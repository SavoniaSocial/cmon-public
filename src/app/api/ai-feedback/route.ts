// ✅ AI Feedback (per thread)
import { NextResponse } from "next/server";
import { serverSupabase } from "@/lib/serverSupabase";
import { generateFeedback } from "@/lib/aiEngine";
import { decrementSparks } from "@/lib/sparkEngine";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const { data: userData, error: userErr } = await serverSupabase.auth.getUser(token);
    if (userErr || !userData?.user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const userId = userData.user.id;
    const body = await req.json();
    const { threadId, messages, brandKitId } = body;

    if (!threadId) {
      return NextResponse.json({ error: "threadId required" }, { status: 400 });
    }
    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: "Prompt required" }, { status: 400 });
    }

    const prompt = messages[messages.length - 1].content.trim();
    if (!prompt) {
      return NextResponse.json({ error: "Prompt required" }, { status: 400 });
    }

    const sparkRes = await decrementSparks(userId, 1);
    if (!sparkRes.success) {
      return NextResponse.json({ error: sparkRes.error || "Insufficient sparks" }, { status: 402 });
    }

    await serverSupabase.from("messages").insert({
      thread_id: threadId,
      role: "user",
      content: prompt,
    });

    const aiRes = await generateFeedback(prompt, true);
    if (!aiRes.ok) {
      return NextResponse.json({ error: "AI failed", details: aiRes.error }, { status: 500 });
    }

    const aiReply = aiRes.plain_text ?? (typeof aiRes === "string" ? aiRes : JSON.stringify(aiRes));

    await serverSupabase.from("messages").insert({
      thread_id: threadId,
      role: "assistant",
      content: aiReply,
    });

    await serverSupabase
      .from("threads")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", threadId);

    return NextResponse.json({
      ok: true,
      reply: aiReply,
      remaining_sparks: sparkRes.remaining,
    });
  } catch (e: any) {
    console.error("[AI Feedback Error]:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

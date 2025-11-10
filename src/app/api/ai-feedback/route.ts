import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { getUserFromRequest } from "@/lib/getUserFromRequest";
import { generateFeedback } from "@/lib/aiEngine";

export async function POST(req: Request) {
  try {
    console.log("🟢 /api/ai-feedback HIT");

    const user = await getUserFromRequest(req);
    if (!user) {
      console.error("🚫 Unauthorized user");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    console.log("📦 Body:", body);

    const {
      threadId,
      messages,
      brandKitId,
      platform,
      format,
      user_inputs,
      continuing,
      key_message_hint,
    } = body;

    const lastUserMessage = messages?.[messages.length - 1]?.content || "";

    const result = await generateFeedback(
      {
        client: "CMON",
        format,
        platform,
        user_inputs,
        continuing,
        key_message_hint,
        thread_memory: messages.map((m: any) => `${m.role}: ${m.content}`).join("\n"),
      },
      false
    );

    const aiText =
      result.ok && result.json?.text
        ? result.json.text
        : result.plain_text || "⚠️ No AI response";

    // ✅ Simpan ke Supabase
    await supabase.from("messages").insert([
      {
        thread_id: threadId,
        role: "assistant",
        content: aiText,
      },
    ]);

    console.log("🤖 AI:", aiText);
    return new Response(aiText, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  } catch (err: any) {
    console.error("❌ ai-feedback error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { serverSupabase } from "@/lib/serverSupabase";
import { generateFeedback } from "@/lib/aiEngine";

async function getUserFromAuthHeader(req: Request) {
  const auth = req.headers.get("authorization") || "";
  const match = auth.match(/Bearer (.+)/);
  const token = match ? match[1] : null;
  if (!token) return null;
  const resp = await serverSupabase.auth.getUser(token);
  return resp.data.user ?? null;
}

export async function GET(req: Request) {
  try {
    const user = await getUserFromAuthHeader(req);
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await serverSupabase
      .from("threads")
      .select("*, messages(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ threads: data });
  } catch (err: any) {
    console.error("GET /api/threads error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to load threads" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getUserFromAuthHeader(req);
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { client, format, hook, copy, brand_kit_id, brand } = body;

    if (!client || !format) {
      return NextResponse.json(
        { error: "Please fill client and format" },
        { status: 400 }
      );
    }

    // 🔹 Generate AI feedback
    const result = await generateFeedback({
      client,
      format,
      platform: "instagram",
      user_inputs: { hook, copy },
      brand: brand ?? null,
    });

    if (!result.ok) {
      console.error("AI generation failed:", result.error);
      return NextResponse.json(
        { error: "AI generation failed", debug: result.plain_text },
        { status: 500 }
      );
    }

    const aiOutput = result.json;
    const aiText =
      aiOutput?.text ??
      aiOutput?.content ??
      "⚠️ AI gagal menghasilkan respon yang sesuai.";

    // 🔹 Simpan ke threads
    const { data: thread, error: tErr } = await serverSupabase
      .from("threads")
      .insert([
        {
          user_id: user.id,
          brand_kit_id: brand_kit_id || null,
          client: client.trim(),
          format: format.trim(),
          hook: hook || null,
          copy: aiText,
          char_count: aiText.length,
        },
      ])
      .select("*, messages(*)")
      .single();

    if (tErr) throw tErr;

    // 🔹 Simpan pesan user dan AI
    const messagesToInsert = [
      {
        thread_id: thread.id,
        role: "user",
        content: `${hook ?? ""}\n\n${copy ?? ""}`.trim(),
      },
      {
        thread_id: thread.id,
        role: "assistant",
        content: aiText,
      },
    ].filter((m) => m.content.length > 0);

    const { data: msgData, error: mErr } = await serverSupabase
      .from("messages")
      .insert(messagesToInsert)
      .select();

    if (mErr) throw mErr;
    thread.messages = msgData;

    // ✅ Kembalikan hasil dan trigger auto-refresh frontend
    return NextResponse.json(
      { ok: true, thread },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
          "Content-Type": "application/json",
        },
      }
    );
  } catch (err: any) {
    console.error("POST /api/threads error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create thread" },
      { status: 500 }
    );
  }
}

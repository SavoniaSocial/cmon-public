import { NextResponse } from "next/server";
import OpenAI from "openai";
import { serverSupabase } from "@/lib/serverSupabase";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

async function getUserFromAuthHeader(req: Request) {
  const auth = req.headers.get("authorization") || "";
  const match = auth.match(/Bearer (.+)/);
  const token = match ? match[1] : null;
  if (!token) return null;
  const resp = await serverSupabase.auth.getUser(token);
  return resp.data.user ?? null;
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromAuthHeader(req);
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = params;
    const body = await req.json();
    const { messages } = body;

    if (!messages || messages.length === 0)
      return NextResponse.json({ error: "No messages" }, { status: 400 });

    // Ambil message terakhir, tapi buang prompt system panjang
    const userMessage = messages[messages.length - 1];
    const cleanContent = userMessage.content
      .replace(/You are an expert copywriter[\s\S]*/i, "")
      .trim();

    // Simpan ke DB hanya pesan user asli
    await serverSupabase.from("messages").insert({
      thread_id: id,
      role: "user",
      content: cleanContent,
    });

    // Proses AI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini-2024-07-18",
      messages,
      max_tokens: 800,
    });

    const aiReply =
      completion.choices?.[0]?.message?.content?.trim() ||
      "⚠️ AI gagal menghasilkan respon yang sesuai.";

    // Simpan AI reply
    await serverSupabase.from("messages").insert({
      thread_id: id,
      role: "assistant",
      content: aiReply,
    });

    // Kirim balik ke frontend
    return NextResponse.json({ reply: aiReply }, { status: 200 });
  } catch (err: any) {
    console.error("❌ POST /api/threads/[id] error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to send message" },
      { status: 500 }
    );
  }
}

// DELETE tetap sama seperti punyamu
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromAuthHeader(req);
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = params;

    const { error: msgErr } = await serverSupabase
      .from("messages")
      .delete()
      .eq("thread_id", id);
    if (msgErr) throw msgErr;

    const { error: tErr } = await serverSupabase
      .from("threads")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
    if (tErr) throw tErr;

    return NextResponse.json({ ok: true, message: "Thread deleted" });
  } catch (err: any) {
    console.error("DELETE /api/threads/[id] error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to delete thread" },
      { status: 500 }
    );
  }
}

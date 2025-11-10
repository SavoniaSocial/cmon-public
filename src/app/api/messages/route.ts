import { NextResponse } from "next/server";
import { serverSupabase } from "@/lib/serverSupabase";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

async function getUserFromAuthHeader(req: Request) {
  const auth = req.headers.get("authorization") || "";
  const match = auth.match(/Bearer (.+)/);
  const token = match ? match[1] : null;
  if (!token) return null;
  const resp = await serverSupabase.auth.getUser(token);
  return resp.data.user ?? null;
}

// ✅ Endpoint utama untuk kirim pesan ke AI dan simpan respon
export async function POST(req: Request) {
  try {
    console.log("🟢 /api/messages HIT");

    const user = await getUserFromAuthHeader(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { threadId, content } = body;

    if (!threadId || !content) {
      return NextResponse.json(
        { error: "Missing threadId or content" },
        { status: 400 }
      );
    }

    // 🧩 Ambil semua pesan lama di thread
    const { data: oldMessages, error: mErr } = await serverSupabase
      .from("messages")
      .select("role, content")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true });

    if (mErr) throw mErr;

    // 🧩 Tambahkan pesan user terbaru ke daftar
    const messages = [
      { role: "system", content: "Kamu adalah copywriter profesional. Balas dengan gaya natural dan sesuai bahasa user." },
      ...(oldMessages ?? []),
      { role: "user", content },
    ];

    // 🧠 Panggil AI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.7,
      max_tokens: 500,
    });

    const aiText =
      completion.choices?.[0]?.message?.content?.trim() ||
      "⚠️ AI gagal menghasilkan respon.";

    // 💾 Simpan pesan user dan asisten ke Supabase
    const { error: insertErr } = await serverSupabase
      .from("messages")
      .insert([
        { thread_id: threadId, role: "user", content },
        { thread_id: threadId, role: "assistant", content: aiText },
      ]);

    if (insertErr) throw insertErr;

    return NextResponse.json({ ok: true, aiText }, { status: 200 });
  } catch (err: any) {
    console.error("❌ /api/messages error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to send message" },
      { status: 500 }
    );
  }
}

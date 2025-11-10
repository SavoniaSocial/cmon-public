import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req: Request) {
  const auth = req.headers.get("authorization");
  const token = auth?.replace("Bearer ", "");
  const { amount } = await req.json();

  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: user, error } = await supabase.auth.getUser(token);
  if (error || !user?.user) {
    return NextResponse.json({ error: "Invalid user" }, { status: 401 });
  }

  const { id } = user.user;

  // 🔹 Ambil sparks sekarang
  const { data: profile } = await supabase
    .from("profiles")
    .select("sparks")
    .eq("id", id)
    .single();

  const current = profile?.sparks ?? 0;
  const updated = Math.max(0, current - (amount || 1));

  await supabase.from("profiles").update({ sparks: updated }).eq("id", id);

  return NextResponse.json({ success: true, sparks: updated });
}

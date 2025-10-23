import { NextResponse } from "next/server";
import { serverSupabase } from "@/lib/serverSupabase";

async function getUserFromAuthHeader(req: Request) {
  const auth = req.headers.get("authorization") || "";
  const match = auth.match(/Bearer (.+)/);
  const token = match ? match[1] : null;
  if (!token) return null;
  const resp = await serverSupabase.auth.getUser(token);
  return resp.data.user ?? null;
}

export async function POST(req: Request) {
  try {
    const user = await getUserFromAuthHeader(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { code } = await req.json();
    if (!code) return NextResponse.json({ error: "Missing code" }, { status: 400 });

    const { data: promo, error: pErr } = await serverSupabase
      .from("promo_codes")
      .select("*")
      .eq("code", code)
      .eq("is_active", true)
      .single();

    if (pErr || !promo) return NextResponse.json({ error: "Invalid promo" }, { status: 400 });

    // apply upgrade
    await serverSupabase.from("profiles").update({ is_pro: true, role: promo.role_upgrade }).eq("id", user.id);

    // mark promo used
    await serverSupabase.from("promo_codes").update({ used_by: user.id, used_at: new Date().toISOString(), is_active: false }).eq("id", promo.id);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("POST /api/auth/promo error:", err);
    return NextResponse.json({ error: err.message || "Promo failed" }, { status: 500 });
  }
}

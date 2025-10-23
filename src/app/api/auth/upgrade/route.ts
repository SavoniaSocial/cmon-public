import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  const { promoCode } = await req.json();

  if (!promoCode) {
    return NextResponse.json({ error: "Promo code is required" }, { status: 400 });
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 1️⃣ Check promo code
  const { data: promo, error: promoError } = await supabase
    .from("promo_codes")
    .select("*")
    .eq("code", promoCode)
    .is("used_by", null)
    .single();

  if (promoError || !promo) {
    return NextResponse.json({ error: "Invalid or used promo code" }, { status: 400 });
  }

  // 2️⃣ Update profile role
  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      role: promo.role_upgrade || "strategist",
      is_pro: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (updateError)
    return NextResponse.json({ error: "Failed to upgrade user" }, { status: 500 });

  // 3️⃣ Mark promo as used
  await supabase
    .from("promo_codes")
    .update({ used_by: user.id, used_at: new Date().toISOString() })
    .eq("id", promo.id);

  return NextResponse.json({ success: true });
}

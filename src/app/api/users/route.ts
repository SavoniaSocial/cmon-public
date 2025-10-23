// src/app/api/users/route.ts
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

export async function GET(req: Request) {
  try {
    const user = await getUserFromAuthHeader(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await serverSupabase
      .from("profiles")
      .select("id, email, full_name, role, is_pro, sparks, avatar_url, bio")
      .eq("id", user.id)
      .single();

    if (error) throw error;
    return NextResponse.json({ profile: data });
  } catch (err: any) {
    console.error("GET /api/users error:", err);
    return NextResponse.json({ error: err.message || "Failed" }, { status: 500 });
  }
}

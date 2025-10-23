// src/app/api/threads/route.ts
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
      .from("threads")
      .select("*, messages(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ threads: data });
  } catch (err: any) {
    console.error("GET /api/threads error:", err);
    return NextResponse.json({ error: err.message || "Failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getUserFromAuthHeader(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { client, format, hook, copy, brand_kit_id } = body;

    // create thread
    const { data: thread, error: tErr } = await serverSupabase
      .from("threads")
      .insert([
        {
          user_id: user.id,
          brand_kit_id: brand_kit_id || null,
          client: client || null,
          format: format || null,
          hook: hook || null,
          copy: copy || null,
          char_count: (copy || "").length,
        },
      ])
      .select()
      .single();

    if (tErr) throw tErr;

    // insert initial user message (hook + copy combined)
    const initialContent = `${hook ?? ""}\n\n${copy ?? ""}`.trim();
    if (initialContent.length > 0) {
      const { error: mErr } = await serverSupabase.from("messages").insert([
        { thread_id: thread.id, role: "user", content: initialContent },
      ]);
      if (mErr) throw mErr;
    }

    return NextResponse.json({ thread });
  } catch (err: any) {
    console.error("POST /api/threads error:", err);
    return NextResponse.json({ error: err.message || "Failed to create thread" }, { status: 500 });
  }
}

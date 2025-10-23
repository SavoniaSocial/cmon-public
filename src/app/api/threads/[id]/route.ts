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

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromAuthHeader(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = params;

    // delete messages linked to thread
    await serverSupabase.from("messages").delete().eq("thread_id", id);

    // delete thread itself
    const { error } = await serverSupabase
      .from("threads")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("DELETE /api/threads/[id] error:", err);
    return NextResponse.json({ error: err.message || "Failed to delete thread" }, { status: 500 });
  }
}

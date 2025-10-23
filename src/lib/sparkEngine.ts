import { serverSupabase } from "./serverSupabase";

export async function decrementSparks(userId: string, count = 1) {
  try {
    const { data, error } = await serverSupabase.rpc("decrement_sparks", {
      p_user_id: userId,
      p_count: count,
    });

    if (error) {
      console.error("[Spark RPC Error]:", error);
      return { success: false, error: error.message };
    }

    if (!data || data.length === 0) {
      return { success: false, error: "Insufficient sparks" };
    }

    const remaining = data[0]?.remaining ?? 0;
    return { success: true, remaining };
  } catch (e: any) {
    console.error("[SparkEngine Exception]:", e);
    return { success: false, error: e.message };
  }
}

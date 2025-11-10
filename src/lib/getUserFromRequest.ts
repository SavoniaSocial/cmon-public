// src/lib/getUserFromRequest.ts
import { createServerClient } from "@supabase/ssr";
import { Database } from "@/lib/database.types";

export async function getUserFromRequest(req: Request) {
  try {
    // Ambil cookie header dari request API (karena ini route.ts)
    const cookieHeader = req.headers.get("cookie") ?? "";

    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            // parse cookie manual
            const match = cookieHeader.match(
              new RegExp(`(^| )${name}=([^;]+)`)
            );
            return match ? match[2] : undefined;
          },
        },
      }
    );

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      console.error("❌ getUserFromRequest error:", error.message);
      return null;
    }

    return user;
  } catch (err: any) {
    console.error("❌ getUserFromRequest fatal error:", err.message);
    return null;
  }
}

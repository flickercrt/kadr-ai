import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { REMEMBER_COOKIE, shapeAuthCookie } from "@/lib/auth-cookies";
import { isSupabaseConfigured } from "@/lib/env";

export async function createServerSupabase() {
  if (!isSupabaseConfigured()) return null;
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: { path: "/", sameSite: "lax" },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          const remember = cookieStore.get(REMEMBER_COOKIE)?.value !== "0";
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, shapeAuthCookie(name, options, remember));
            });
          } catch {
            // Server Components cannot always write cookies. Proxy refreshes them.
          }
        },
      },
    },
  );
}

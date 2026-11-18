"use client";

import { createBrowserClient } from "@supabase/ssr";
import { REMEMBER_MAX_AGE } from "@/lib/auth-cookies";
import { isSupabaseConfigured } from "@/lib/env";

export function createBrowserSupabase(remember = true) {
  if (!isSupabaseConfigured()) return null;
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookieOptions: {
      path: "/",
      sameSite: "lax",
      ...(remember ? { maxAge: REMEMBER_MAX_AGE } : {}),
    },
  });
}

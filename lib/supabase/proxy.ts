import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isAdminEmail, isDemoMode, isSupabaseConfigured } from "@/lib/env";

const protectedPrefixes = ["/dashboard", "/account", "/admin", "/messages", "/certificates"];

export type SessionRole = "admin" | "instructor" | "student" | "anon";

export async function updateSession(request: NextRequest, options?: { resolveRole?: boolean }) {
  const { pathname } = request.nextUrl;
  const demo = isDemoMode();
  const needsAuth = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));

  if (!isSupabaseConfigured()) {
    if (needsAuth && !demo) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return { response: NextResponse.redirect(url), role: "anon" as const };
    }
    return { response: NextResponse.next({ request }), role: "anon" as const };
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const { data } = await supabase.auth.getUser();
  const user = data.user;
  let role: SessionRole = user ? "student" : "anon";
  if (user && isAdminEmail(user.email)) {
    role = "admin";
  } else if (user && (options?.resolveRole || pathname.startsWith("/admin"))) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (profile?.role === "admin" || profile?.role === "instructor") role = profile.role;
  }

  if (needsAuth && !user && !demo) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return { response: NextResponse.redirect(url), role };
  }

  if (pathname.startsWith("/admin") && !demo) {
    const allowed = role === "admin" || (role === "instructor" && pathname.startsWith("/admin/courses"));
    if (!user || !allowed) {
      const url = request.nextUrl.clone();
      url.pathname = role === "instructor" ? "/admin/courses" : "/";
      url.search = "";
      if (role === "instructor" && pathname.startsWith("/admin/courses")) return { response, role };
      return { response: NextResponse.redirect(url), role };
    }
  }

  return { response, role };
}

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { REMEMBER_COOKIE, SEEN_COOKIE, SEEN_MAX_AGE, shapeAuthCookie } from "@/lib/auth-cookies";
import { guardDevice } from "@/lib/device-guard";
import { isAdminEmail, isDemoMode, isSupabaseConfigured } from "@/lib/env";

const protectedPrefixes = ["/dashboard", "/account", "/admin", "/messages", "/certificates"];

function copySetCookies(from: NextResponse, to: NextResponse) {
  const list = typeof from.headers.getSetCookie === "function" ? from.headers.getSetCookie() : [];
  for (const cookie of list) to.headers.append("set-cookie", cookie);
}

function redirectKeeping(request: NextRequest, response: NextResponse, pathname: string, search: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = search;
  const redirect = NextResponse.redirect(url);
  copySetCookies(response, redirect);
  return redirect;
}

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
  const remember = request.cookies.get(REMEMBER_COOKIE)?.value !== "0";
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: { path: "/", sameSite: "lax" },
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, shapeAuthCookie(name, options, remember));
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

  if (user && !demo) {
    const verdict = await guardDevice({ request, supabase, user, pathname });
    if (verdict.signOut) {
      await supabase.auth.signOut();
      const redirect = redirectKeeping(request, response, "/login", `?reason=${verdict.reason}`);
      for (const cookie of request.cookies.getAll()) {
        if (cookie.name.startsWith("sb-")) redirect.cookies.set(cookie.name, "", { path: "/", maxAge: 0 });
      }
      return { response: redirect, role: "anon" as const };
    }
    if (verdict.touch) {
      response.cookies.set(SEEN_COOKIE, "1", {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        maxAge: SEEN_MAX_AGE,
        secure: request.nextUrl.protocol === "https:",
      });
    }
  }

  if (needsAuth && !user && !demo) {
    const params = new URLSearchParams({ next: pathname });
    return { response: redirectKeeping(request, response, "/login", `?${params.toString()}`), role };
  }

  if (pathname.startsWith("/admin") && !demo) {
    const allowed = role === "admin" || (role === "instructor" && pathname.startsWith("/admin/courses"));
    if (!user || !allowed) {
      if (role === "instructor" && pathname.startsWith("/admin/courses")) return { response, role };
      const nextPath = role === "instructor" ? "/admin/courses" : "/";
      return { response: redirectKeeping(request, response, nextPath, ""), role };
    }
  }

  return { response, role };
}

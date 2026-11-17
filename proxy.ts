import { NextResponse, type NextRequest } from "next/server";
import { maintenanceHtml } from "@/lib/maintenance-page";
import { readMaintenance } from "@/lib/maintenance-state";
import { updateSession } from "@/lib/supabase/proxy";

const BANNER_COOKIE = "kadr-maintenance";

function isMaintenanceExempt(pathname: string) {
  return (
    pathname === "/login" ||
    pathname.startsWith("/login/") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api/admin")
  );
}

function copyCookies(from: NextResponse, to: NextResponse) {
  const list = typeof from.headers.getSetCookie === "function" ? from.headers.getSetCookie() : [];
  for (const cookie of list) to.headers.append("set-cookie", cookie);
}

function stampBanner(request: NextRequest, response: NextResponse, on: boolean) {
  if (on) {
    response.cookies.set(BANNER_COOKIE, "1", {
      path: "/",
      sameSite: "lax",
      maxAge: 120,
      secure: request.nextUrl.protocol === "https:",
    });
    return;
  }
  if (request.cookies.get(BANNER_COOKIE)) {
    response.cookies.set(BANNER_COOKIE, "", { path: "/", maxAge: 0 });
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const state = await readMaintenance();
  const exempt = isMaintenanceExempt(pathname);
  const { response, role } = await updateSession(request, { resolveRole: state.enabled });
  const adminBypass = state.enabled && role === "admin";

  if (!state.enabled || exempt || adminBypass) {
    stampBanner(request, response, adminBypass);
    return response;
  }

  if (pathname.startsWith("/api/")) {
    const json = NextResponse.json(
      { error: { code: "maintenance", ar: "الموقع قيد الصيانة", en: "The site is under maintenance." } },
      { status: 503, headers: { "cache-control": "no-store", "retry-after": "300" } },
    );
    copyCookies(response, json);
    stampBanner(request, json, false);
    return json;
  }

  const html = new NextResponse(maintenanceHtml(state.message), {
    status: 503,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "retry-after": "300",
    },
  });
  copyCookies(response, html);
  stampBanner(request, html, false);
  return html;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};

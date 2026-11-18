import { NextResponse } from "next/server";
import { REMEMBER_COOKIE } from "@/lib/auth-cookies";
import { claimDevice } from "@/lib/devices";
import { createServerSupabase } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/utils";
import { cookies } from "next/headers";


export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNextPath(url.searchParams.get("next"));
  if (code) {
    const supabase = await createServerSupabase();
    if (supabase) {
      await supabase.auth.exchangeCodeForSession(code);
      const user = (await supabase.auth.getUser()).data.user;
      if (user) {
        const jar = await cookies();
        const remember = jar.get(REMEMBER_COOKIE)?.value !== "0";
        const claimed = await claimDevice(request, remember);
        if (!claimed.ok && claimed.code === "device_limit") {
          return NextResponse.redirect(new URL("/login?reason=devices", url.origin));
        }
        if (claimed.ok && claimed.finish) await claimed.finish();
      }
    }
  }
  return NextResponse.redirect(new URL(next, url.origin));
}

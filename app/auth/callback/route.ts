import { NextResponse } from "next/server";
import { logActivity } from "@/lib/activity";
import { isAdminEmail } from "@/lib/env";
import { createServerSupabase } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/utils";


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
        await logActivity({
          actorId: user.id,
          actorEmail: user.email,
          actorRole: isAdminEmail(user.email) ? "admin" : "student",
          action: "auth.login",
          targetType: "user",
          targetId: user.id,
          metadata: { via: "oauth" },
        });
      }
    }
  }
  return NextResponse.redirect(new URL(next, url.origin));
}

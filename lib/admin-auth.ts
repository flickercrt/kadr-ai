import "server-only";
import { isAdminEmail } from "@/lib/env";
import { jsonError } from "@/lib/http";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";

/** Re-check the signed-in user against ADMIN_EMAILS. The service role client never reaches the browser. */
export async function requireAdminCaller() {
  const supabase = await createServerSupabase();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  if (!user || !isAdminEmail(user.email)) {
    return { user: null, admin: null, denied: jsonError(403, "forbidden") };
  }
  return { user, admin: createAdminSupabase(), denied: null };
}

import { issueReadyCertificates } from "@/lib/inbox";
import { jsonError } from "@/lib/http";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createServerSupabase();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  if (!user) return jsonError(401, "unauthorized");
  const admin = createAdminSupabase();
  if (!admin) return jsonError(503, "config");
  await issueReadyCertificates(admin, user.id);
  return Response.json({ ok: true });
}

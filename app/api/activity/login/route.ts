import { logActivity } from "@/lib/activity";
import { isAdminEmail } from "@/lib/env";
import { jsonError } from "@/lib/http";
import { createServerSupabase } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createServerSupabase();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  if (!user) return jsonError(401, "unauthorized");
  await logActivity({
    actorId: user.id,
    actorEmail: user.email,
    actorRole: isAdminEmail(user.email) ? "admin" : "student",
    action: "auth.login",
    targetType: "user",
    targetId: user.id,
  });
  return Response.json({ ok: true });
}

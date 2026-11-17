import { isAdminEmail, isServiceRoleConfigured } from "@/lib/env";
import { jsonError } from "@/lib/http";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";


export async function GET() {
  const supabase = await createServerSupabase();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  if (!user || !isAdminEmail(user.email)) return jsonError(403, "forbidden");
  if (!isServiceRoleConfigured()) {
    return Response.json({ configured: false, students: [] });
  }
  const admin = createAdminSupabase();
  if (!admin) return Response.json({ configured: false, students: [] });

  const { data: profiles, error } = await admin
    .from("profiles")
    .select("id, email, full_name, created_at")
    .order("created_at", { ascending: false });
  if (error) return jsonError(500, "unavailable");

  const { data: subscriptions } = await admin
    .from("subscriptions")
    .select("user_id, status, provider, current_period_end");
  const byUser = new Map((subscriptions ?? []).map((row) => [row.user_id, row]));

  return Response.json({
    configured: true,
    students: (profiles ?? []).map((profile) => {
      const subscription = byUser.get(profile.id);
      return {
        id: profile.id,
        email: profile.email,
        name: profile.full_name,
        status: subscription?.status ?? "inactive",
        provider: subscription?.provider ?? null,
        currentPeriodEnd: subscription?.current_period_end ?? null,
      };
    }),
  });
}

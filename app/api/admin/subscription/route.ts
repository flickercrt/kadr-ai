import { z } from "zod";
import { isAdminEmail } from "@/lib/env";
import { jsonError } from "@/lib/http";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";


const bodySchema = z.object({
  userId: z.uuid(),
  active: z.boolean(),
});

export async function POST(request: Request) {
  const supabase = await createServerSupabase();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  if (!user || !isAdminEmail(user.email)) return jsonError(403, "forbidden");

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "invalid");
  const admin = createAdminSupabase();
  if (!admin) return jsonError(503, "config");

  const { error } = await admin.from("subscriptions").upsert({
    user_id: parsed.data.userId,
    status: parsed.data.active ? "active" : "inactive",
    provider: "manual",
    current_period_end: null,
    updated_at: new Date().toISOString(),
  });
  if (error) return jsonError(500, "unavailable");
  return Response.json({ ok: true });
}

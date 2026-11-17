import { z } from "zod";
import { requireAdminCaller } from "@/lib/admin-auth";
import { logActivity } from "@/lib/activity";
import { jsonError } from "@/lib/http";


const bodySchema = z.object({
  userId: z.uuid(),
  active: z.boolean(),
});

export async function POST(request: Request) {
  const gate = await requireAdminCaller();
  if (gate.denied) return gate.denied;
  if (!gate.admin) return jsonError(503, "config");
  const admin = gate.admin;

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "invalid");

  const { error } = await admin.from("subscriptions").upsert({
    user_id: parsed.data.userId,
    status: parsed.data.active ? "active" : "inactive",
    provider: "manual",
    current_period_end: null,
    updated_at: new Date().toISOString(),
  });
  if (error) return jsonError(500, "unavailable");
  await logActivity({
    actorId: gate.user.id,
    actorEmail: gate.user.email,
    actorRole: "admin",
    action: "subscription.updated",
    targetType: "user",
    targetId: parsed.data.userId,
    metadata: { active: parsed.data.active },
  });
  return Response.json({ ok: true });
}

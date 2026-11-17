import { z } from "zod";
import { requireAdminCaller } from "@/lib/admin-auth";
import { logActivity } from "@/lib/activity";
import { jsonError } from "@/lib/http";
import { cleanAvatarUrl, cleanDisplayName } from "@/lib/profile";

const bodySchema = z.object({
  userId: z.uuid(),
  name: z.string(),
  avatarUrl: z.string(),
  role: z.enum(["student", "instructor", "admin"]).optional(),
});

export async function POST(request: Request) {
  const gate = await requireAdminCaller();
  if (gate.denied) return gate.denied;
  if (!gate.admin) return jsonError(503, "config");
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "invalid");
  const name = cleanDisplayName(parsed.data.name);
  const avatarUrl = cleanAvatarUrl(parsed.data.avatarUrl);
  if (name === null || avatarUrl === null) return jsonError(400, "invalid");

  const { data: profile } = await gate.admin.from("profiles").select("id").eq("id", parsed.data.userId).maybeSingle();
  if (!profile) return jsonError(404, "not_found");

  const updated = await gate.admin
    .from("profiles")
    .update({ full_name: name, avatar_url: avatarUrl || null })
    .eq("id", parsed.data.userId);
  if (updated.error && /avatar_url/.test(updated.error.message)) {
    const nameOnly = await gate.admin.from("profiles").update({ full_name: name }).eq("id", parsed.data.userId);
    if (nameOnly.error) return jsonError(500, "failed");
    if (avatarUrl) return jsonError(503, "config");
    await logActivity({ actorId: gate.user.id, actorEmail: gate.user.email, actorRole: "admin", action: "student.updated", targetType: "user", targetId: parsed.data.userId });
    return Response.json({ ok: true, avatarSaved: false });
  }
  if (updated.error) return jsonError(500, "failed");
  await gate.admin.auth.admin.updateUserById(parsed.data.userId, { user_metadata: { full_name: name } }).catch(() => undefined);
  if (parsed.data.role) {
    const roleUpdate = await gate.admin.from("profiles").update({ role: parsed.data.role }).eq("id", parsed.data.userId);
    if (roleUpdate.error && /role/.test(roleUpdate.error.message)) return jsonError(503, "config");
    if (roleUpdate.error) return jsonError(500, "failed");
  }
  await logActivity({
    actorId: gate.user.id,
    actorEmail: gate.user.email,
    actorRole: "admin",
    action: "student.updated",
    targetType: "user",
    targetId: parsed.data.userId,
    metadata: { role: parsed.data.role ?? null },
  });
  return Response.json({ ok: true, avatarSaved: true });
}

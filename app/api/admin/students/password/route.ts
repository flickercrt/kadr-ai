import { z } from "zod";
import { requireAdminCaller } from "@/lib/admin-auth";
import { logActivity } from "@/lib/activity";
import { jsonError } from "@/lib/http";
import { STUDENT_PASSWORD_MAX, STUDENT_PASSWORD_MIN } from "@/lib/username";

const bodySchema = z.object({
  userId: z.uuid(),
  password: z.string(),
});

function isWeakPassword(error: { code?: string }) {
  return error.code === "weak_password";
}

export async function POST(request: Request) {
  const gate = await requireAdminCaller();
  if (gate.denied) return gate.denied;
  if (!gate.admin) return jsonError(503, "config");
  const admin = gate.admin;

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "invalid");
  const { userId, password } = parsed.data;
  if (password.length < STUDENT_PASSWORD_MIN) return jsonError(400, "password_short");
  if (password.length > STUDENT_PASSWORD_MAX) return jsonError(400, "invalid");

  const { data: profile } = await admin.from("profiles").select("id").eq("id", userId).maybeSingle();
  if (!profile) return jsonError(404, "not_found");

  const { error } = await admin.auth.admin.updateUserById(userId, { password });
  if (error) {
    if (error.code === "user_not_found") return jsonError(404, "not_found");
    if (isWeakPassword(error)) return jsonError(400, "password_short");
    return jsonError(500, "failed");
  }
  await logActivity({
    actorId: gate.user.id,
    actorEmail: gate.user.email,
    actorRole: "admin",
    action: "student.password_reset",
    targetType: "user",
    targetId: userId,
  });
  return Response.json({ ok: true });
}

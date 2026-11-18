import { z } from "zod";
import { requireAdminCaller } from "@/lib/admin-auth";
import { logActivity } from "@/lib/activity";
import { isMissingRelation } from "@/lib/db-errors";
import { deviceLimit, listDevices } from "@/lib/devices";
import { jsonError } from "@/lib/http";

const bodySchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("revoke"), id: z.uuid() }),
  z.object({ action: z.literal("revoke-all"), userId: z.uuid() }),
  z.object({ action: z.literal("limit"), maxDevices: z.number().int().min(1).max(10) }),
]);

export async function GET(request: Request) {
  const gate = await requireAdminCaller();
  if (gate.denied) return gate.denied;
  if (!gate.admin) return Response.json({ configured: false, ready: false, devices: [], maxDevices: 2 });
  const userId = new URL(request.url).searchParams.get("userId") ?? "";
  if (userId && !z.uuid().safeParse(userId).success) return jsonError(400, "invalid");
  try {
    return Response.json(await listDevices(userId || undefined));
  } catch {
    return jsonError(500, "failed");
  }
}

export async function POST(request: Request) {
  const gate = await requireAdminCaller();
  if (gate.denied) return gate.denied;
  if (!gate.admin) return jsonError(503, "config");
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "invalid");
  const now = new Date().toISOString();

  if (parsed.data.action === "limit") {
    const { error } = await gate.admin.from("device_settings").upsert(
      { id: 1, max_devices: parsed.data.maxDevices, updated_at: now },
      { onConflict: "id" },
    );
    if (error) return isMissingRelation(error) ? jsonError(503, "config") : jsonError(500, "failed");
    await logActivity({
      actorId: gate.user.id,
      actorEmail: gate.user.email,
      actorRole: "admin",
      action: "device_limit.updated",
      targetType: "settings",
      metadata: { maxDevices: parsed.data.maxDevices },
    });
    return Response.json({ ok: true, maxDevices: parsed.data.maxDevices });
  }

  if (parsed.data.action === "revoke") {
    const { data, error } = await gate.admin
      .from("user_devices")
      .update({ revoked_at: now })
      .eq("id", parsed.data.id)
      .is("revoked_at", null)
      .select("id, user_id, device_id")
      .maybeSingle();
    if (error) return isMissingRelation(error) ? jsonError(503, "config") : jsonError(500, "failed");
    await logActivity({
      actorId: gate.user.id,
      actorEmail: gate.user.email,
      actorRole: "admin",
      action: "device.revoked",
      targetType: "device",
      targetId: data?.device_id ?? parsed.data.id,
      metadata: { userId: data?.user_id ?? null },
    });
    return Response.json({ ok: true });
  }

  const { data, error } = await gate.admin
    .from("user_devices")
    .update({ revoked_at: now })
    .eq("user_id", parsed.data.userId)
    .is("revoked_at", null)
    .select("id");
  if (error) return isMissingRelation(error) ? jsonError(503, "config") : jsonError(500, "failed");
  await logActivity({
    actorId: gate.user.id,
    actorEmail: gate.user.email,
    actorRole: "admin",
    action: "device.revoked_all",
    targetType: "user",
    targetId: parsed.data.userId,
    metadata: { count: data?.length ?? 0 },
  });
  return Response.json({ ok: true, count: data?.length ?? 0, maxDevices: await deviceLimit() });
}

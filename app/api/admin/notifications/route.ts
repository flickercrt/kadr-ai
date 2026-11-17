import { z } from "zod";
import { requireAdminCaller } from "@/lib/admin-auth";
import { isMissingRelation } from "@/lib/db-errors";
import { jsonError } from "@/lib/http";

const bodySchema = z.object({ id: z.uuid().optional() });

export async function GET() {
  const gate = await requireAdminCaller();
  if (gate.denied) return gate.denied;
  if (!gate.admin) return Response.json({ configured: false, ready: false, notifications: [] });
  const { data, error } = await gate.admin
    .from("admin_notifications")
    .select("id, kind, user_id, body, created_at, read_at")
    .order("created_at", { ascending: false })
    .limit(30);
  if (error) {
    if (isMissingRelation(error)) return Response.json({ configured: true, ready: false, notifications: [] });
    return jsonError(500, "failed");
  }
  return Response.json({
    configured: true,
    ready: true,
    notifications: (data ?? []).map((row) => ({
      id: row.id,
      kind: row.kind,
      userId: row.user_id,
      body: row.body,
      createdAt: row.created_at,
      readAt: row.read_at,
    })),
  });
}

export async function POST(request: Request) {
  const gate = await requireAdminCaller();
  if (gate.denied) return gate.denied;
  if (!gate.admin) return jsonError(503, "config");
  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return jsonError(400, "invalid");
  const now = new Date().toISOString();
  const query = gate.admin.from("admin_notifications").update({ read_at: now }).is("read_at", null);
  const { error } = parsed.data.id ? await query.eq("id", parsed.data.id) : await query;
  if (error) return isMissingRelation(error) ? jsonError(503, "config") : jsonError(500, "failed");
  return Response.json({ ok: true });
}

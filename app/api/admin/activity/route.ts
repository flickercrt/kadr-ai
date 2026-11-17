import { requireAdminCaller } from "@/lib/admin-auth";
import { isMissingRelation } from "@/lib/db-errors";
import { jsonError } from "@/lib/http";

const PAGE = 25;

export async function GET(request: Request) {
  const gate = await requireAdminCaller();
  if (gate.denied) return gate.denied;
  if (!gate.admin) return Response.json({ configured: false, ready: false, entries: [], total: 0, page: 1 });
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page") || "1") || 1);
  const action = url.searchParams.get("action")?.trim() ?? "";
  const actor = url.searchParams.get("actor")?.trim() ?? "";
  const q = url.searchParams.get("q")?.trim() ?? "";
  const from = url.searchParams.get("from")?.trim() ?? "";
  const to = url.searchParams.get("to")?.trim() ?? "";

  let query = gate.admin
    .from("activity_log")
    .select("id, actor_id, actor_email, actor_role, action, target_type, target_id, metadata, created_at", { count: "exact" })
    .order("created_at", { ascending: false });
  if (action) query = query.eq("action", action);
  const actorSafe = actor.replace(/[%_,()]/g, "");
  if (actorSafe) query = query.ilike("actor_email", `%${actorSafe}%`);
  const fromDate = from ? new Date(from) : null;
  if (fromDate && !Number.isNaN(fromDate.getTime())) query = query.gte("created_at", fromDate.toISOString());
  if (to) {
    const end = new Date(to);
    if (!Number.isNaN(end.getTime())) {
      end.setUTCHours(23, 59, 59, 999);
      query = query.lte("created_at", end.toISOString());
    }
  }
  if (q) {
    const safe = q.replace(/[%_,()]/g, "");
    if (safe) query = query.or(`action.ilike.%${safe}%,target_type.ilike.%${safe}%,target_id.ilike.%${safe}%,actor_email.ilike.%${safe}%`);
  }
  const fromRow = (page - 1) * PAGE;
  const { data, error, count } = await query.range(fromRow, fromRow + PAGE - 1);
  if (error) {
    if (isMissingRelation(error)) return Response.json({ configured: true, ready: false, entries: [], total: 0, page });
    return jsonError(500, "failed");
  }
  return Response.json({
    configured: true,
    ready: true,
    page,
    pageSize: PAGE,
    total: count ?? 0,
    entries: (data ?? []).map((row) => ({
      id: row.id,
      actorId: row.actor_id,
      actorEmail: row.actor_email,
      actorRole: row.actor_role,
      action: row.action,
      targetType: row.target_type,
      targetId: row.target_id,
      metadata: row.metadata,
      createdAt: row.created_at,
    })),
  });
}

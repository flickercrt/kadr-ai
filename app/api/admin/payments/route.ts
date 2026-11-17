import { z } from "zod";
import { requireAdminCaller } from "@/lib/admin-auth";
import { isMissingRelation } from "@/lib/db-errors";
import { jsonError } from "@/lib/http";

export async function GET(request: Request) {
  const gate = await requireAdminCaller();
  if (gate.denied) return gate.denied;
  if (!gate.admin) return Response.json({ configured: false, ready: false, payments: [] });
  const userId = new URL(request.url).searchParams.get("userId") ?? "";
  if (!z.uuid().safeParse(userId).success) return jsonError(400, "invalid");
  const { data, error } = await gate.admin
    .from("payment_events")
    .select("id, event_type, amount_cents, currency, status, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) {
    if (isMissingRelation(error)) return Response.json({ configured: true, ready: false, payments: [] });
    return jsonError(500, "failed");
  }
  return Response.json({
    configured: true,
    ready: true,
    payments: (data ?? []).map((row) => ({
      id: row.id,
      eventType: row.event_type,
      amountCents: row.amount_cents,
      currency: row.currency,
      status: row.status,
      createdAt: row.created_at,
    })),
  });
}

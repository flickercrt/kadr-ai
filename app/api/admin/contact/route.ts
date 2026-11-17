import { z } from "zod";
import { requireAdminCaller } from "@/lib/admin-auth";
import { isMissingRelation } from "@/lib/db-errors";
import { jsonError } from "@/lib/http";

const bodySchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("handled"), id: z.uuid(), handled: z.boolean() }),
  z.object({ action: z.literal("delete"), id: z.uuid() }),
]);

type Row = {
  id: string;
  name: string;
  contact: string;
  subject: string;
  message: string;
  handled: boolean;
  created_at: string;
};

function relationOrFailed(error: { code?: string; message?: string }) {
  return isMissingRelation(error) ? jsonError(503, "config") : jsonError(500, "failed");
}

export async function GET() {
  const gate = await requireAdminCaller();
  if (gate.denied) return gate.denied;
  if (!gate.admin) return Response.json({ configured: false, ready: false, messages: [] });
  const { data, error } = await gate.admin
    .from("contact_messages")
    .select("id, name, contact, subject, message, handled, created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) {
    if (isMissingRelation(error)) return Response.json({ configured: true, ready: false, messages: [] });
    return jsonError(500, "failed");
  }
  return Response.json({
    configured: true,
    ready: true,
    messages: ((data ?? []) as Row[]).map((row) => ({
      id: row.id,
      name: row.name,
      contact: row.contact,
      subject: row.subject,
      message: row.message,
      handled: row.handled,
      createdAt: row.created_at,
    })),
  });
}

export async function POST(request: Request) {
  const gate = await requireAdminCaller();
  if (gate.denied) return gate.denied;
  if (!gate.admin) return jsonError(503, "config");
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "invalid");
  const body = parsed.data;
  if (body.action === "delete") {
    const { error } = await gate.admin.from("contact_messages").delete().eq("id", body.id);
    if (error) return relationOrFailed(error);
    return Response.json({ ok: true });
  }
  const { error } = await gate.admin.from("contact_messages").update({ handled: body.handled }).eq("id", body.id);
  if (error) return relationOrFailed(error);
  return Response.json({ ok: true });
}

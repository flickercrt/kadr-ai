import { z } from "zod";
import { requireAdminCaller } from "@/lib/admin-auth";
import { logActivity } from "@/lib/activity";
import { isMissingRelation } from "@/lib/db-errors";
import { jsonError } from "@/lib/http";
import { DIRECT_CHAT_SUBJECT, ensureThread, postInboxMessage } from "@/lib/inbox";

const bodySchema = z.object({ body: z.string().trim().min(1).max(2000) });

export async function GET(_request: Request, context: { params: Promise<{ userId: string }> }) {
  const { userId } = await context.params;
  if (!z.uuid().safeParse(userId).success) return jsonError(400, "invalid");
  const gate = await requireAdminCaller();
  if (gate.denied) return gate.denied;
  if (!gate.admin) return jsonError(503, "config");
  const threadId = await ensureThread(gate.admin, userId, DIRECT_CHAT_SUBJECT);
  if (!threadId) return jsonError(503, "config");
  const { data: messages, error } = await gate.admin
    .from("inbox_messages")
    .select("id, body, sender_role, created_at")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });
  if (error) return isMissingRelation(error) ? jsonError(503, "config") : jsonError(500, "failed");
  await gate.admin.from("inbox_threads").update({ admin_read_at: new Date().toISOString() }).eq("id", threadId);
  return Response.json({
    threadId,
    messages: (messages ?? []).map((row) => ({
      id: row.id,
      body: row.body,
      senderRole: row.sender_role,
      createdAt: row.created_at,
    })),
  });
}

export async function POST(request: Request, context: { params: Promise<{ userId: string }> }) {
  const { userId } = await context.params;
  if (!z.uuid().safeParse(userId).success) return jsonError(400, "invalid");
  const gate = await requireAdminCaller();
  if (gate.denied) return gate.denied;
  if (!gate.admin) return jsonError(503, "config");
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "invalid");
  const threadId = await ensureThread(gate.admin, userId, DIRECT_CHAT_SUBJECT);
  if (!threadId) return jsonError(503, "config");
  const error = await postInboxMessage(gate.admin, {
    threadId,
    senderId: gate.user.id,
    senderRole: "admin",
    body: parsed.data.body,
    kind: "chat",
  });
  if (error) return isMissingRelation(error) ? jsonError(503, "config") : jsonError(500, "failed");
  await logActivity({
    actorId: gate.user.id,
    actorEmail: gate.user.email,
    actorRole: "admin",
    action: "message.sent",
    targetType: "user",
    targetId: userId,
    metadata: { channel: "chat" },
  });
  return Response.json({ ok: true });
}

import { z } from "zod";
import { requireAdminCaller } from "@/lib/admin-auth";
import { isMissingRelation } from "@/lib/db-errors";
import { jsonError } from "@/lib/http";
import { ensureThread, postInboxMessage } from "@/lib/inbox";

const bodySchema = z.object({
  userIds: z.array(z.uuid()).min(1).max(200),
  body: z.string().trim().min(1).max(2000),
});

export async function POST(request: Request) {
  const gate = await requireAdminCaller();
  if (gate.denied) return gate.denied;
  if (!gate.admin) return jsonError(503, "config");
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "invalid");

  let sent = 0;
  for (const userId of parsed.data.userIds) {
    const threadId = await ensureThread(gate.admin, userId, "رسالة من الإدارة");
    if (!threadId) return jsonError(503, "config");
    const error = await postInboxMessage(gate.admin, {
      threadId,
      senderId: gate.user.id,
      senderRole: "admin",
      body: parsed.data.body,
      kind: "notice",
    });
    if (error) return isMissingRelation(error) ? jsonError(503, "config") : jsonError(500, "failed");
    sent += 1;
  }
  return Response.json({ ok: true, sent });
}

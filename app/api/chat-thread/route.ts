import { z } from "zod";
import { logActivity } from "@/lib/activity";
import { isDemoMode } from "@/lib/env";
import { isMissingRelation } from "@/lib/db-errors";
import { jsonError } from "@/lib/http";
import { DIRECT_CHAT_SUBJECT, ensureThread, postInboxMessage } from "@/lib/inbox";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";

const bodySchema = z.object({ body: z.string().trim().min(1).max(2000) });

async function threadFor(userId: string) {
  const admin = createAdminSupabase();
  if (!admin) return { admin: null, threadId: null, missing: false };
  const threadId = await ensureThread(admin, userId, DIRECT_CHAT_SUBJECT);
  return { admin, threadId, missing: !threadId };
}

export async function GET(request: Request) {
  const supabase = await createServerSupabase();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  if (!user) {
    if (isDemoMode()) return Response.json({ ready: true, unread: 0, messages: [] });
    return jsonError(401, "unauthorized");
  }
  const { admin, threadId, missing } = await threadFor(user.id);
  if (!admin || missing || !threadId) return Response.json({ ready: false, unread: 0, messages: [] });
  const { data: thread, error } = await admin.from("inbox_threads").select("student_read_at").eq("id", threadId).maybeSingle();
  if (error && isMissingRelation(error) && !/student_read_at/.test(error.message)) {
    return Response.json({ ready: false, unread: 0, messages: [] });
  }
  const readAt = thread?.student_read_at ?? "1970-01-01T00:00:00.000Z";
  const { data: messages } = await admin
    .from("inbox_messages")
    .select("id, body, sender_role, created_at")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });
  const rows = messages ?? [];
  const unread = rows.filter((row) => row.sender_role !== "student" && row.created_at > readAt).length;
  if (new URL(request.url).searchParams.get("peek") !== "1") {
    await admin.from("inbox_threads").update({ student_read_at: new Date().toISOString() }).eq("id", threadId);
  }
  return Response.json({
    ready: true,
    threadId,
    unread,
    messages: rows.map((row) => ({
      id: row.id,
      body: row.body,
      senderRole: row.sender_role,
      createdAt: row.created_at,
    })),
  });
}

export async function POST(request: Request) {
  const supabase = await createServerSupabase();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  if (!user) return jsonError(401, "unauthorized");
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "invalid");
  const { admin, threadId, missing } = await threadFor(user.id);
  if (!admin || missing || !threadId) return jsonError(503, "config");
  const error = await postInboxMessage(admin, {
    threadId,
    senderId: user.id,
    senderRole: "student",
    body: parsed.data.body,
    kind: "chat",
  });
  if (error) return isMissingRelation(error) ? jsonError(503, "config") : jsonError(500, "failed");
  await logActivity({
    actorId: user.id,
    actorEmail: user.email,
    actorRole: "student",
    action: "message.sent",
    targetType: "thread",
    targetId: threadId,
    metadata: { channel: "chat" },
  });
  return Response.json({ ok: true });
}

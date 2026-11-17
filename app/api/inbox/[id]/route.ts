import { isMissingRelation } from "@/lib/db-errors";
import { jsonError } from "@/lib/http";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await createServerSupabase();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  if (!user) return jsonError(401, "unauthorized");
  const admin = createAdminSupabase();
  if (!admin) return jsonError(503, "config");

  const { data: thread, error } = await admin
    .from("inbox_threads")
    .select("id, subject, student_id")
    .eq("id", id)
    .maybeSingle();
  if (error) return isMissingRelation(error) ? Response.json({ ready: false, messages: [] }) : jsonError(500, "failed");
  if (!thread || thread.student_id !== user.id) return jsonError(404, "not_found");

  const { data: messages, error: messageError } = await admin
    .from("inbox_messages")
    .select("id, body, kind, sender_role, created_at")
    .eq("thread_id", id)
    .order("created_at", { ascending: true });
  if (messageError) return jsonError(500, "failed");
  return Response.json({
    ready: true,
    subject: thread.subject,
    messages: (messages ?? []).map((row) => ({
      id: row.id,
      body: row.body,
      kind: row.kind,
      senderRole: row.sender_role,
      createdAt: row.created_at,
    })),
  });
}

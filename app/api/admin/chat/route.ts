import { requireAdminCaller } from "@/lib/admin-auth";
import { isMissingRelation } from "@/lib/db-errors";
import { jsonError } from "@/lib/http";
import { DIRECT_CHAT_SUBJECT } from "@/lib/inbox";
import { displayIdentity } from "@/lib/username";

export async function GET() {
  const gate = await requireAdminCaller();
  if (gate.denied) return gate.denied;
  if (!gate.admin) return Response.json({ configured: false, ready: false, unread: 0, threads: [] });
  const { data: threads, error } = await gate.admin
    .from("inbox_threads")
    .select("id, student_id, admin_read_at, updated_at, inbox_messages(body, sender_role, created_at)")
    .eq("subject", DIRECT_CHAT_SUBJECT)
    .order("updated_at", { ascending: false });
  if (error) {
    if (isMissingRelation(error)) return Response.json({ configured: true, ready: false, unread: 0, threads: [] });
    return jsonError(500, "failed");
  }
  const ids = (threads ?? []).map((thread) => thread.student_id);
  const profiles = ids.length
    ? await gate.admin.from("profiles").select("id, email, full_name").in("id", ids)
    : { data: [] };
  const byId = new Map((profiles.data ?? []).map((row) => [row.id, row]));
  let unread = 0;
  const rows = (threads ?? []).map((thread) => {
    const messages = (thread.inbox_messages ?? []) as { body: string; sender_role: string; created_at: string }[];
    const latest = messages.slice().sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
    const readAt = thread.admin_read_at ?? "1970-01-01T00:00:00.000Z";
    const count = messages.filter((row) => row.sender_role === "student" && row.created_at > readAt).length;
    unread += count;
    const profile = byId.get(thread.student_id);
    const identity = displayIdentity(profile?.email);
    return {
      userId: thread.student_id,
      name: profile?.full_name || identity.username || identity.email || "",
      preview: latest?.body ?? "",
      updatedAt: thread.updated_at,
      unread: count,
    };
  });
  return Response.json({ configured: true, ready: true, unread, threads: rows });
}

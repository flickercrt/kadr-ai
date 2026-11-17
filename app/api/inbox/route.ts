import { isDemoMode } from "@/lib/env";
import { isMissingRelation } from "@/lib/db-errors";
import { jsonError } from "@/lib/http";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createServerSupabase();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  if (!user) {
    if (isDemoMode()) return Response.json({ ready: true, threads: [], certificates: [] });
    return jsonError(401, "unauthorized");
  }
  const admin = createAdminSupabase();
  if (!admin) return Response.json({ ready: false, threads: [], certificates: [] });

  const { data: threads, error } = await admin
    .from("inbox_threads")
    .select("id, subject, updated_at, inbox_messages(body, kind, created_at)")
    .eq("student_id", user.id)
    .order("updated_at", { ascending: false });
  if (error) {
    if (isMissingRelation(error)) return Response.json({ ready: false, threads: [], certificates: [] });
    return jsonError(500, "failed");
  }

  const { data: certificates } = await admin
    .from("certificates")
    .select("id, course_title, student_name, issued_at")
    .eq("user_id", user.id)
    .order("issued_at", { ascending: false });

  return Response.json({
    ready: true,
    threads: (threads ?? []).map((thread) => {
      const messages = (thread.inbox_messages ?? []) as { body: string; kind: string; created_at: string }[];
      const latest = messages.slice().sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
      return {
        id: thread.id,
        subject: thread.subject,
        updatedAt: thread.updated_at,
        preview: latest?.body?.split("\n")[0] ?? "",
        kind: latest?.kind ?? "chat",
      };
    }),
    certificates: (certificates ?? []).map((row) => ({
      id: row.id,
      courseTitle: row.course_title,
      studentName: row.student_name,
      issuedAt: row.issued_at,
    })),
  });
}

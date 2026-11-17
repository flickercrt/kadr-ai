import { isAdminEmail } from "@/lib/env";
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
  const { data, error } = await admin
    .from("certificates")
    .select("id, user_id, student_name, course_title, issued_at")
    .eq("id", id)
    .maybeSingle();
  if (error) return isMissingRelation(error) ? jsonError(503, "config") : jsonError(500, "failed");
  if (!data) return jsonError(404, "not_found");
  const owns = data.user_id === user.id;
  let staff = isAdminEmail(user.email);
  if (!owns && !staff) {
    const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).maybeSingle();
    staff = profile?.role === "admin" || profile?.role === "owner" || profile?.role === "instructor";
  }
  if (!owns && !staff) return jsonError(403, "forbidden");
  return Response.json({
    id: data.id,
    studentName: data.student_name,
    courseTitle: data.course_title,
    issuedAt: data.issued_at,
  });
}

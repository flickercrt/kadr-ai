import { z } from "zod";
import { isDemoMode } from "@/lib/env";
import { isMissingRelation } from "@/lib/db-errors";
import { jsonError } from "@/lib/http";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";

const bodySchema = z.object({
  targetType: z.enum(["course", "lesson", "session"]),
  targetId: z.uuid(),
});

export async function GET() {
  const supabase = await createServerSupabase();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  if (!user) {
    if (isDemoMode()) return Response.json({ ready: true, courses: [], lessons: [], sessions: [], ids: { course: [], lesson: [], session: [] } });
    return jsonError(401, "unauthorized");
  }
  const admin = createAdminSupabase();
  if (!admin) return Response.json({ ready: false, courses: [], lessons: [], sessions: [], ids: { course: [], lesson: [], session: [] } });
  const { data, error } = await admin.from("favorites").select("target_type, target_id, created_at").eq("user_id", user.id).order("created_at", { ascending: false });
  if (error) {
    if (isMissingRelation(error)) return Response.json({ ready: false, courses: [], lessons: [], sessions: [], ids: { course: [], lesson: [], session: [] } });
    return jsonError(500, "failed");
  }
  const rows = data ?? [];
  const ids = {
    course: rows.filter((row) => row.target_type === "course").map((row) => row.target_id as string),
    lesson: rows.filter((row) => row.target_type === "lesson").map((row) => row.target_id as string),
    session: rows.filter((row) => row.target_type === "session").map((row) => row.target_id as string),
  };
  const [courses, lessons, sessions] = await Promise.all([
    ids.course.length ? admin.from("courses").select("id, title").in("id", ids.course) : Promise.resolve({ data: [] }),
    ids.lesson.length ? admin.from("lessons").select("id, title, course_id").in("id", ids.lesson) : Promise.resolve({ data: [] }),
    ids.session.length ? admin.from("chat_sessions").select("id, title, bot_slug").in("id", ids.session) : Promise.resolve({ data: [] }),
  ]);
  return Response.json({
    ready: true,
    ids,
    courses: (courses.data ?? []).map((row) => ({ id: row.id, title: row.title })),
    lessons: (lessons.data ?? []).map((row) => ({ id: row.id, title: row.title, courseId: row.course_id })),
    sessions: (sessions.data ?? []).map((row) => ({ id: row.id, title: row.title, botSlug: row.bot_slug })),
  });
}

export async function POST(request: Request) {
  const supabase = await createServerSupabase();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  if (!user) return jsonError(401, "unauthorized");
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "invalid");
  const admin = createAdminSupabase();
  if (!admin) return jsonError(503, "config");
  const { data: existing, error: readError } = await admin
    .from("favorites")
    .select("target_id")
    .eq("user_id", user.id)
    .eq("target_type", parsed.data.targetType)
    .eq("target_id", parsed.data.targetId)
    .maybeSingle();
  if (readError) return isMissingRelation(readError) ? jsonError(503, "config") : jsonError(500, "failed");
  if (existing) {
    const { error } = await admin.from("favorites").delete().eq("user_id", user.id).eq("target_type", parsed.data.targetType).eq("target_id", parsed.data.targetId);
    if (error) return jsonError(500, "failed");
    return Response.json({ saved: false });
  }
  const { error } = await admin.from("favorites").insert({ user_id: user.id, target_type: parsed.data.targetType, target_id: parsed.data.targetId });
  if (error) return isMissingRelation(error) ? jsonError(503, "config") : jsonError(500, "failed");
  return Response.json({ saved: true });
}

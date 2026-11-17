import { isDemoMode } from "@/lib/env";
import { isMissingRelation } from "@/lib/db-errors";
import { jsonError } from "@/lib/http";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";

type Lesson = { id: string; title: string; position: number; published: boolean };

export async function GET() {
  const supabase = await createServerSupabase();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  if (!user) {
    if (isDemoMode()) return Response.json({ ready: true, courses: [] });
    return jsonError(401, "unauthorized");
  }
  const admin = createAdminSupabase();
  if (!admin) return Response.json({ ready: false, courses: [] });
  const { data, error } = await admin
    .from("courses")
    .select("id, title, position, lessons(id, title, position, published)")
    .eq("published", true)
    .order("position", { ascending: true });
  if (error) {
    if (isMissingRelation(error)) return Response.json({ ready: false, courses: [] });
    return jsonError(500, "failed");
  }
  const { data: progress } = await admin.from("lesson_progress").select("lesson_id").eq("user_id", user.id);
  const { data: certificates } = await admin.from("certificates").select("id, course_id").eq("user_id", user.id);
  const done = new Set((progress ?? []).map((row) => row.lesson_id as string));
  const certificateOf = new Map((certificates ?? []).map((row) => [row.course_id as string, row.id as string]));

  const courses = (data ?? []).map((course) => {
    const lessons = ((course.lessons ?? []) as Lesson[])
      .filter((lesson) => lesson.published)
      .sort((a, b) => a.position - b.position);
    const firstOpen = lessons.findIndex((lesson) => !done.has(lesson.id));
    return {
      id: course.id,
      title: course.title,
      certificateId: certificateOf.get(course.id) ?? null,
      lessons: lessons.map((lesson, index) => ({
        id: lesson.id,
        title: lesson.title,
        state: done.has(lesson.id)
          ? "done"
          : index === firstOpen
            ? "current"
            : firstOpen >= 0 && index === firstOpen + 1
              ? "next"
              : "upcoming",
      })),
    };
  });
  return Response.json({ ready: true, courses });
}

import { requireAdminCaller } from "@/lib/admin-auth";
import { isMissingRelation } from "@/lib/db-errors";
import { jsonError } from "@/lib/http";
import { displayIdentity } from "@/lib/username";

type CourseRow = { id: string; title: string; lessons: { id: string; published: boolean }[] | null };
type ProgressRow = { user_id: string; lesson_id: string };
type ProfileRow = { id: string; email: string | null; full_name: string | null };

export async function GET() {
  const gate = await requireAdminCaller();
  if (gate.denied) return gate.denied;
  if (!gate.admin) return Response.json({ configured: false, ready: false, students: [] });
  const admin = gate.admin;

  const [{ data: profiles, error: profileError }, { data: courses, error: courseError }, { data: progress, error: progressError }] =
    await Promise.all([
      admin.from("profiles").select("id, email, full_name").order("created_at", { ascending: false }),
      admin.from("courses").select("id, title, position, lessons(id, published)").eq("published", true).order("position", { ascending: true }),
      admin.from("lesson_progress").select("user_id, lesson_id"),
    ]);

  const missing = [profileError, courseError, progressError].find((error) => error && isMissingRelation(error));
  if (missing) return Response.json({ configured: true, ready: false, students: [] });
  if (profileError || courseError || progressError) return jsonError(500, "failed");

  const publishedLessons = new Map<string, { courseId: string; courseTitle: string }>();
  const courseList = ((courses ?? []) as CourseRow[]).map((course) => {
    const lessonIds = (course.lessons ?? []).filter((lesson) => lesson.published).map((lesson) => lesson.id);
    for (const lessonId of lessonIds) publishedLessons.set(lessonId, { courseId: course.id, courseTitle: course.title });
    return { id: course.id, title: course.title, lessonIds };
  });

  const doneByUser = new Map<string, Set<string>>();
  for (const row of (progress ?? []) as ProgressRow[]) {
    const set = doneByUser.get(row.user_id) ?? new Set<string>();
    set.add(row.lesson_id);
    doneByUser.set(row.user_id, set);
  }

  const students = ((profiles ?? []) as ProfileRow[]).map((profile) => {
    const identity = displayIdentity(profile.email);
    const finished = doneByUser.get(profile.id) ?? new Set<string>();
    return {
      id: profile.id,
      email: identity.email,
      username: identity.username,
      name: profile.full_name,
      courses: courseList.map((course) => {
        const total = course.lessonIds.length;
        const done = course.lessonIds.filter((id) => finished.has(id)).length;
        return {
          id: course.id,
          title: course.title,
          done,
          total,
          percent: total === 0 ? 0 : Math.round((done / total) * 100),
        };
      }),
    };
  });

  return Response.json({ configured: true, ready: true, students });
}

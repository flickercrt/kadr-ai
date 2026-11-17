import { isDemoMode } from "@/lib/env";
import { type CourseRecord, type LessonRecord } from "@/lib/courses";
import { isMissingRelation } from "@/lib/db-errors";
import { jsonError } from "@/lib/http";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";
import { isSubscriptionActive } from "@/lib/subscription";

type LessonRow = {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  position: number;
  published: boolean;
};

type CourseRow = {
  id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  position: number;
  published: boolean;
  lessons: LessonRow[] | null;
};

function mapLesson(row: LessonRow): LessonRecord {
  return {
    id: row.id,
    courseId: row.course_id,
    title: row.title,
    description: row.description ?? "",
    videoUrl: row.video_url ?? "",
    position: row.position,
    published: row.published,
  };
}

export async function GET() {
  const demo = isDemoMode();
  const supabase = await createServerSupabase();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  if (!user) {
    if (demo) return Response.json({ ready: true, active: true, courses: [] });
    return jsonError(401, "unauthorized");
  }
  const admin = createAdminSupabase();
  if (!admin) return Response.json({ ready: false, active: false, courses: [] });

  const { data: subscription, error: subscriptionError } = await admin
    .from("subscriptions")
    .select("status, current_period_end")
    .eq("user_id", user.id)
    .maybeSingle();
  if (subscriptionError && isMissingRelation(subscriptionError)) {
    return Response.json({ ready: false, active: false, courses: [] });
  }
  const active = isSubscriptionActive(subscription);
  if (!active && !demo) return Response.json({ ready: true, active: false, courses: [] });

  const { data, error } = await admin
    .from("courses")
    .select("id, title, description, video_url, position, published, lessons(id, course_id, title, description, video_url, position, published)")
    .eq("published", true)
    .order("position", { ascending: true });
  if (error) {
    if (isMissingRelation(error)) return Response.json({ ready: false, active, courses: [] });
    return jsonError(500, "failed");
  }

  const courses: CourseRecord[] = ((data ?? []) as CourseRow[]).map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    videoUrl: row.video_url ?? "",
    position: row.position,
    published: true,
    lessons: (row.lessons ?? [])
      .filter((lesson) => lesson.published)
      .map(mapLesson)
      .sort((a, b) => a.position - b.position),
  }));

  return Response.json({ ready: true, active: true, courses });
}

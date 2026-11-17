import { z } from "zod";
import { isMissingRelation } from "@/lib/db-errors";
import { isDemoMode } from "@/lib/env";
import { jsonError } from "@/lib/http";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";
import { isSubscriptionActive } from "@/lib/subscription";

const bodySchema = z.object({ lessonId: z.uuid() });

export async function POST(request: Request) {
  const demo = isDemoMode();
  const supabase = await createServerSupabase();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  if (!user) {
    if (demo) return Response.json({ ready: true, saved: false });
    return jsonError(401, "unauthorized");
  }
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "invalid");
  const admin = createAdminSupabase();
  if (!admin) return Response.json({ ready: false, saved: false });

  const { data: subscription } = await admin
    .from("subscriptions")
    .select("status, current_period_end")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!isSubscriptionActive(subscription) && !demo) return jsonError(402, "paywall");

  const { data: lesson, error: lessonError } = await admin
    .from("lessons")
    .select("id, published, course_id")
    .eq("id", parsed.data.lessonId)
    .maybeSingle();
  if (lessonError) {
    if (isMissingRelation(lessonError)) return Response.json({ ready: false, saved: false });
    return jsonError(500, "failed");
  }
  if (!lesson?.published) return jsonError(404, "not_found");
  const { data: course, error: courseError } = await admin
    .from("courses")
    .select("published")
    .eq("id", lesson.course_id)
    .maybeSingle();
  if (courseError) {
    if (isMissingRelation(courseError)) return Response.json({ ready: false, saved: false });
    return jsonError(500, "failed");
  }
  if (!course?.published) return jsonError(404, "not_found");

  const { error } = await admin.from("lesson_progress").upsert(
    { user_id: user.id, lesson_id: lesson.id, completed_at: new Date().toISOString() },
    { onConflict: "user_id,lesson_id" },
  );
  if (error) {
    if (isMissingRelation(error)) return Response.json({ ready: false, saved: false });
    return jsonError(500, "failed");
  }
  return Response.json({ ready: true, saved: true });
}

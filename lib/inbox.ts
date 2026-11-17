import "server-only";
import { isMissingRelation } from "@/lib/db-errors";
import { createAdminSupabase } from "@/lib/supabase/admin";

type Admin = NonNullable<ReturnType<typeof createAdminSupabase>>;

export async function ensureThread(admin: Admin, studentId: string, subject: string) {
  const { data: existing } = await admin
    .from("inbox_threads")
    .select("id")
    .eq("student_id", studentId)
    .eq("subject", subject)
    .maybeSingle();
  if (existing?.id) return existing.id as string;
  const { data, error } = await admin
    .from("inbox_threads")
    .insert({ student_id: studentId, subject })
    .select("id")
    .single();
  if (error || !data) return null;
  return data.id as string;
}

export async function postInboxMessage(
  admin: Admin,
  input: { threadId: string; senderId: string | null; senderRole: "student" | "admin" | "system"; body: string; kind?: string },
) {
  const { error } = await admin.from("inbox_messages").insert({
    thread_id: input.threadId,
    sender_id: input.senderId,
    sender_role: input.senderRole,
    body: input.body,
    kind: input.kind ?? "chat",
  });
  if (error) return error;
  await admin.from("inbox_threads").update({ updated_at: new Date().toISOString() }).eq("id", input.threadId);
  return null;
}

/** Issue a certificate message for every fully completed published course. Missing tables are ignored. */
export async function issueReadyCertificates(admin: Admin, userId: string) {
  const { data: profile, error: profileError } = await admin.from("profiles").select("full_name").eq("id", userId).maybeSingle();
  if (profileError) return;
  const { data: courses, error: courseError } = await admin
    .from("courses")
    .select("id, title, lessons(id, published)")
    .eq("published", true);
  if (courseError) return;
  const { data: progress, error: progressError } = await admin.from("lesson_progress").select("lesson_id").eq("user_id", userId);
  if (progressError) return;
  const done = new Set((progress ?? []).map((row) => row.lesson_id as string));
  const name = profile?.full_name || "";

  for (const course of courses ?? []) {
    const lessons = ((course.lessons ?? []) as { id: string; published: boolean }[]).filter((lesson) => lesson.published);
    if (lessons.length === 0 || lessons.some((lesson) => !done.has(lesson.id))) continue;
    const { data: existing, error: existingError } = await admin
      .from("certificates")
      .select("id")
      .eq("user_id", userId)
      .eq("course_id", course.id)
      .maybeSingle();
    if (existingError) {
      if (isMissingRelation(existingError)) return;
      continue;
    }
    if (existing) continue;
    const issuedAt = new Date().toISOString();
    const { error: insertError } = await admin.from("certificates").insert({
      user_id: userId,
      course_id: course.id,
      student_name: name,
      course_title: course.title,
      issued_at: issuedAt,
    });
    if (insertError) {
      if (isMissingRelation(insertError)) return;
      continue;
    }
    const threadId = await ensureThread(admin, userId, "شهادات");
    if (!threadId) continue;
    const date = issuedAt.slice(0, 10);
    await postInboxMessage(admin, {
      threadId,
      senderId: null,
      senderRole: "system",
      kind: "certificate",
      body: `شهادة إتمام\nالاسم: ${name || "طالب كادر"}\nالدورة: ${course.title}\nالتاريخ: ${date}`,
    });
  }
}

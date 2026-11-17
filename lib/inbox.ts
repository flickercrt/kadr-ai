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

type IssueResult = { id: string } | { error: "incomplete" | "missing" | "failed" };

export async function issueCourseCertificate(admin: Admin, userId: string, courseId: string): Promise<IssueResult> {
  const { data: profile, error: profileError } = await admin.from("profiles").select("full_name").eq("id", userId).maybeSingle();
  if (profileError || !profile) return { error: "failed" };
  const { data: course, error: courseError } = await admin
    .from("courses")
    .select("id, title, published, lessons(id, published)")
    .eq("id", courseId)
    .maybeSingle();
  if (courseError) return { error: isMissingRelation(courseError) ? "missing" : "failed" };
  if (!course?.published) return { error: "incomplete" };
  const lessons = ((course.lessons ?? []) as { id: string; published: boolean }[]).filter((lesson) => lesson.published);
  const { data: progress, error: progressError } = await admin.from("lesson_progress").select("lesson_id").eq("user_id", userId);
  if (progressError) return { error: isMissingRelation(progressError) ? "missing" : "failed" };
  const done = new Set((progress ?? []).map((row) => row.lesson_id as string));
  if (lessons.length === 0 || lessons.some((lesson) => !done.has(lesson.id))) return { error: "incomplete" };

  const { data: existing, error: existingError } = await admin
    .from("certificates")
    .select("id")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .maybeSingle();
  if (existingError) return { error: isMissingRelation(existingError) ? "missing" : "failed" };
  if (existing?.id) return { id: existing.id as string };

  const issuedAt = new Date().toISOString();
  const name = profile.full_name || "طالب كادر";
  const { data: created, error: insertError } = await admin
    .from("certificates")
    .insert({ user_id: userId, course_id: courseId, student_name: name, course_title: course.title, issued_at: issuedAt })
    .select("id")
    .single();
  if (insertError || !created) return { error: isMissingRelation(insertError) ? "missing" : "failed" };
  const threadId = await ensureThread(admin, userId, "شهادات");
  if (threadId) {
    await postInboxMessage(admin, {
      threadId,
      senderId: null,
      senderRole: "system",
      kind: "certificate",
      body: `شهادة إتمام\nالاسم: ${name}\nالدورة: ${course.title}\nالتاريخ: ${issuedAt.slice(0, 10)}\n/certificates/${created.id}`,
    });
  }
  return { id: created.id as string };
}

/** Issue a certificate message for every fully completed published course. Missing tables are ignored. */
export async function issueReadyCertificates(admin: Admin, userId: string) {
  const { data: courses, error } = await admin.from("courses").select("id").eq("published", true);
  if (error || !courses) return;
  for (const course of courses) {
    const result = await issueCourseCertificate(admin, userId, course.id as string);
    if ("error" in result && result.error === "missing") return;
  }
}

import ExcelJS from "exceljs";
import { requireAdminCaller } from "@/lib/admin-auth";
import { isMissingRelation } from "@/lib/db-errors";
import { jsonError } from "@/lib/http";
import { displayIdentity } from "@/lib/username";

type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  role?: string | null;
};

type ProgressRow = { user_id: string; lesson_id: string };

function styleHeader(sheet: ExcelJS.Worksheet) {
  const header = sheet.getRow(1);
  header.font = { bold: true, color: { argb: "FF0E1116" } };
  header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF00D4B4" } };
}

export async function GET() {
  const gate = await requireAdminCaller();
  if (gate.denied) return gate.denied;
  if (!gate.admin) return jsonError(503, "config");
  const admin = gate.admin;

  const withRole = await admin.from("profiles").select("id, email, full_name, role").order("created_at", { ascending: false });
  const profilesResult = withRole.error
    ? await admin.from("profiles").select("id, email, full_name").order("created_at", { ascending: false })
    : withRole;
  if (profilesResult.error) {
    return isMissingRelation(profilesResult.error) ? jsonError(503, "config") : jsonError(500, "failed");
  }
  const profiles = (profilesResult.data ?? []) as ProfileRow[];

  const subscriptions = await admin.from("subscriptions").select("user_id, status, provider");
  const statusOf = new Map(
    (subscriptions.error ? [] : (subscriptions.data ?? [])).map((row) => [row.user_id as string, row]),
  );

  const progress = await admin.from("lesson_progress").select("user_id, lesson_id");
  const progressReady = !progress.error;
  const progressRows = progressReady ? ((progress.data ?? []) as ProgressRow[]) : [];
  const lessons = progressReady ? await admin.from("lessons").select("id, course_id, title, published") : null;
  const courses = progressReady && lessons && !lessons.error ? await admin.from("courses").select("id, title") : null;

  const doneCount = new Map<string, number>();
  for (const row of progressRows) doneCount.set(row.user_id, (doneCount.get(row.user_id) ?? 0) + 1);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Kadr AI";
  const people = workbook.addWorksheet("الطلاب", { views: [{ rightToLeft: true }] });
  people.columns = [
    { header: "الاسم", key: "name", width: 24 },
    { header: "اسم المستخدم", key: "username", width: 22 },
    { header: "البريد", key: "email", width: 32 },
    { header: "الحالة", key: "status", width: 16 },
    { header: "المصدر", key: "provider", width: 16 },
    { header: "الدور", key: "role", width: 14 },
    ...(progressReady ? [{ header: "دروس مكتملة", key: "done", width: 16 }] : []),
  ];
  styleHeader(people);

  for (const profile of profiles) {
    const identity = displayIdentity(profile.email);
    const subscription = statusOf.get(profile.id);
    people.addRow({
      name: profile.full_name ?? "",
      username: identity.username ?? "",
      email: identity.email ?? profile.email ?? "",
      status: subscription?.status ?? "inactive",
      provider: subscription?.provider ?? "",
      role: profile.role ?? "student",
      done: progressReady ? (doneCount.get(profile.id) ?? 0) : undefined,
    });
  }

  if (progressReady) {
    const lessonRows = lessons && !lessons.error ? (lessons.data ?? []) : [];
    const courseRows = courses && !courses.error ? (courses.data ?? []) : [];
    const courseTitle = new Map(courseRows.map((row) => [row.id as string, row.title as string]));
    const lessonTitle = new Map(lessonRows.map((row) => [row.id as string, (row.title as string) || (row.id as string)]));
    const lessonCourse = new Map(lessonRows.filter((row) => row.published !== false).map((row) => [row.id as string, row.course_id as string]));
    const totals = new Map<string, number>();
    for (const courseId of lessonCourse.values()) totals.set(courseId, (totals.get(courseId) ?? 0) + 1);
    const done = new Map<string, Map<string, number>>();
    for (const row of progressRows) {
      const courseId = lessonCourse.get(row.lesson_id);
      if (!courseId) continue;
      const byCourse = done.get(row.user_id) ?? new Map<string, number>();
      byCourse.set(courseId, (byCourse.get(courseId) ?? 0) + 1);
      done.set(row.user_id, byCourse);
    }

    const sheet = workbook.addWorksheet("التقدم", { views: [{ rightToLeft: true }] });
    const namedCourses = lessonRows.length > 0 && courseRows.length > 0;
    if (namedCourses) {
      sheet.columns = [
        { header: "الاسم", key: "name", width: 24 },
        { header: "اسم المستخدم", key: "username", width: 22 },
        { header: "الدورة", key: "course", width: 28 },
        { header: "دروس مكتملة", key: "finished", width: 16 },
        { header: "دروس الدورة", key: "total", width: 16 },
        { header: "النسبة", key: "percent", width: 12 },
      ];
      for (const profile of profiles) {
        const identity = displayIdentity(profile.email);
        const byCourse = done.get(profile.id) ?? new Map<string, number>();
        for (const [courseId, finished] of byCourse) {
          if (finished === 0) continue;
          const total = totals.get(courseId) ?? 0;
          sheet.addRow({
            name: profile.full_name ?? "",
            username: identity.username ?? "",
            course: courseTitle.get(courseId) ?? courseId,
            finished,
            total,
            percent: total === 0 ? 0 : Math.round((finished / total) * 100),
          });
        }
      }
    } else {
      sheet.columns = [
        { header: "الاسم", key: "name", width: 24 },
        { header: "اسم المستخدم", key: "username", width: 22 },
        { header: "الدرس", key: "lesson", width: 36 },
      ];
      const who = new Map(profiles.map((profile) => [profile.id, profile]));
      for (const row of progressRows) {
        const profile = who.get(row.user_id);
        const identity = displayIdentity(profile?.email);
        sheet.addRow({
          name: profile?.full_name ?? "",
          username: identity.username ?? "",
          lesson: lessonTitle.get(row.lesson_id) ?? row.lesson_id,
        });
      }
    }
    styleHeader(sheet);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="kadr-students.xlsx"',
      "Cache-Control": "no-store",
    },
  });
}

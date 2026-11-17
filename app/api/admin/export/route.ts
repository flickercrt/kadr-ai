import ExcelJS from "exceljs";
import { requireAdminCaller } from "@/lib/admin-auth";
import { jsonError } from "@/lib/http";
import { displayIdentity } from "@/lib/username";

export async function GET() {
  const gate = await requireAdminCaller();
  if (gate.denied) return gate.denied;
  if (!gate.admin) return jsonError(503, "config");
  const admin = gate.admin;

  const [{ data: profiles }, { data: subscriptions }, { data: courses }, { data: lessons }, { data: progress }] = await Promise.all([
    admin.from("profiles").select("id, email, full_name, role"),
    admin.from("subscriptions").select("user_id, status, provider"),
    admin.from("courses").select("id, title"),
    admin.from("lessons").select("id, course_id, published"),
    admin.from("lesson_progress").select("user_id, lesson_id"),
  ]);

  const statusOf = new Map((subscriptions ?? []).map((row) => [row.user_id, row]));
  const courseTitle = new Map((courses ?? []).map((row) => [row.id, row.title as string]));
  const lessonCourse = new Map((lessons ?? []).filter((row) => row.published).map((row) => [row.id, row.course_id as string]));
  const totals = new Map<string, number>();
  for (const courseId of lessonCourse.values()) totals.set(courseId, (totals.get(courseId) ?? 0) + 1);
  const done = new Map<string, Map<string, number>>();
  for (const row of progress ?? []) {
    const courseId = lessonCourse.get(row.lesson_id);
    if (!courseId) continue;
    const byCourse = done.get(row.user_id) ?? new Map<string, number>();
    byCourse.set(courseId, (byCourse.get(courseId) ?? 0) + 1);
    done.set(row.user_id, byCourse);
  }

  const workbook = new ExcelJS.Workbook();
  const people = workbook.addWorksheet("Students");
  people.addRow(["Name", "Username", "Email", "Status", "Provider", "Role"]);
  for (const profile of profiles ?? []) {
    const identity = displayIdentity(profile.email);
    const subscription = statusOf.get(profile.id);
    people.addRow([
      profile.full_name ?? "",
      identity.username ?? "",
      identity.email ?? "",
      subscription?.status ?? "inactive",
      subscription?.provider ?? "",
      "role" in profile ? profile.role ?? "student" : "student",
    ]);
  }

  const sheet = workbook.addWorksheet("Progress");
  sheet.addRow(["Name", "Username", "Course", "Lessons done", "Lessons total", "Percent"]);
  for (const profile of profiles ?? []) {
    const identity = displayIdentity(profile.email);
    const byCourse = done.get(profile.id) ?? new Map<string, number>();
    const courseIds = new Set([...byCourse.keys(), ...totals.keys()]);
    for (const courseId of courseIds) {
      const total = totals.get(courseId) ?? 0;
      const finished = byCourse.get(courseId) ?? 0;
      if (finished === 0) continue;
      sheet.addRow([
        profile.full_name ?? "",
        identity.username ?? "",
        courseTitle.get(courseId) ?? courseId,
        finished,
        total,
        total === 0 ? 0 : Math.round((finished / total) * 100),
      ]);
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="kadr-students.xlsx"',
    },
  });
}

import { z } from "zod";
import { requireAdminCaller } from "@/lib/admin-auth";
import { cleanCourseContent, type CourseRecord, type LessonRecord } from "@/lib/courses";
import { isMissingRelation } from "@/lib/db-errors";
import { jsonError } from "@/lib/http";

const contentSchema = {
  title: z.string(),
  description: z.string().optional(),
  videoUrl: z.string().optional(),
  published: z.boolean().optional(),
};

const bodySchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create-course"), ...contentSchema }),
  z.object({ action: z.literal("update-course"), id: z.uuid(), ...contentSchema }),
  z.object({ action: z.literal("delete-course"), id: z.uuid() }),
  z.object({ action: z.literal("reorder-courses"), ids: z.array(z.uuid()).min(1) }),
  z.object({ action: z.literal("create-lesson"), courseId: z.uuid(), ...contentSchema }),
  z.object({ action: z.literal("update-lesson"), id: z.uuid(), ...contentSchema }),
  z.object({ action: z.literal("delete-lesson"), id: z.uuid() }),
  z.object({ action: z.literal("reorder-lessons"), courseId: z.uuid(), ids: z.array(z.uuid()).min(1) }),
]);

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
  created_at: string;
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

function mapCourse(row: CourseRow): CourseRecord {
  const lessons = (row.lessons ?? []).map(mapLesson).sort((a, b) => a.position - b.position);
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    videoUrl: row.video_url ?? "",
    position: row.position,
    published: row.published,
    lessons,
  };
}

async function loadCourses(admin: NonNullable<Awaited<ReturnType<typeof requireAdminCaller>>["admin"]>) {
  const { data, error } = await admin
    .from("courses")
    .select("id, title, description, video_url, position, published, created_at, lessons(id, course_id, title, description, video_url, position, published)")
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) return { error, courses: [] as CourseRecord[] };
  const courses = ((data ?? []) as CourseRow[]).map(mapCourse);
  return { error: null, courses };
}

export async function GET() {
  const gate = await requireAdminCaller();
  if (gate.denied) return gate.denied;
  if (!gate.admin) return Response.json({ configured: false, ready: false, courses: [] });
  const loaded = await loadCourses(gate.admin);
  if (loaded.error) {
    if (isMissingRelation(loaded.error)) return Response.json({ configured: true, ready: false, courses: [] });
    return jsonError(500, "failed");
  }
  return Response.json({ configured: true, ready: true, courses: loaded.courses });
}

export async function POST(request: Request) {
  const gate = await requireAdminCaller();
  if (gate.denied) return gate.denied;
  if (!gate.admin) return jsonError(503, "config");
  const admin = gate.admin;
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "invalid");
  const body = parsed.data;
  const now = new Date().toISOString();

  if (body.action === "create-course" || body.action === "update-course" || body.action === "create-lesson" || body.action === "update-lesson") {
    const content = cleanCourseContent(body);
    if (!content) return jsonError(400, "invalid");
    if (body.action === "create-course") {
      const { data: last } = await admin.from("courses").select("position").order("position", { ascending: false }).limit(1);
      const position = (last?.[0]?.position ?? -1) + 1;
      const { error } = await admin.from("courses").insert({ ...content, position, updated_at: now });
      if (error) return isMissingRelation(error) ? jsonError(503, "config") : jsonError(500, "failed");
    } else if (body.action === "update-course") {
      const { error } = await admin.from("courses").update({ ...content, updated_at: now }).eq("id", body.id);
      if (error) return isMissingRelation(error) ? jsonError(503, "config") : jsonError(500, "failed");
    } else if (body.action === "create-lesson") {
      const { data: last } = await admin
        .from("lessons")
        .select("position")
        .eq("course_id", body.courseId)
        .order("position", { ascending: false })
        .limit(1);
      const position = (last?.[0]?.position ?? -1) + 1;
      const { error } = await admin.from("lessons").insert({ ...content, course_id: body.courseId, position, updated_at: now });
      if (error) return isMissingRelation(error) ? jsonError(503, "config") : jsonError(500, "failed");
    } else {
      const { error } = await admin.from("lessons").update({ ...content, updated_at: now }).eq("id", body.id);
      if (error) return isMissingRelation(error) ? jsonError(503, "config") : jsonError(500, "failed");
    }
    return Response.json({ ok: true });
  }

  if (body.action === "delete-course") {
    const { error } = await admin.from("courses").delete().eq("id", body.id);
    if (error) return isMissingRelation(error) ? jsonError(503, "config") : jsonError(500, "failed");
    return Response.json({ ok: true });
  }

  if (body.action === "delete-lesson") {
    const { error } = await admin.from("lessons").delete().eq("id", body.id);
    if (error) return isMissingRelation(error) ? jsonError(503, "config") : jsonError(500, "failed");
    return Response.json({ ok: true });
  }

  if (body.action === "reorder-courses") {
    const results = await Promise.all(
      body.ids.map((id, index) => admin.from("courses").update({ position: index, updated_at: now }).eq("id", id)),
    );
    const failure = results.find((result) => result.error);
    if (failure?.error) return isMissingRelation(failure.error) ? jsonError(503, "config") : jsonError(500, "failed");
    return Response.json({ ok: true });
  }

  const results = await Promise.all(
    body.ids.map((id, index) =>
      admin.from("lessons").update({ position: index, updated_at: now }).eq("id", id).eq("course_id", body.courseId),
    ),
  );
  const failure = results.find((result) => result.error);
  if (failure?.error) return isMissingRelation(failure.error) ? jsonError(503, "config") : jsonError(500, "failed");
  return Response.json({ ok: true });
}

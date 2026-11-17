"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminNav } from "@/components/admin/admin-nav";
import { AppHeader } from "@/components/app-header";
import { useI18n } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useMe } from "@/components/use-me";
import { cleanCourseContent, type CourseRecord, type LessonRecord } from "@/lib/courses";
import { isDemoMode } from "@/lib/env";
import type { Locale } from "@/lib/i18n";

type ApiError = { error?: { ar?: string; en?: string } };
type Editor =
  | { kind: "course"; course: CourseRecord | null }
  | { kind: "lesson"; courseId: string; lesson: LessonRecord | null };

function errorText(data: ApiError, locale: Locale, fallback: string) {
  return (locale === "ar" ? data.error?.ar : data.error?.en) || fallback;
}

function move<T extends { id: string }>(items: T[], id: string, direction: -1 | 1) {
  const index = items.findIndex((item) => item.id === id);
  const next = index + direction;
  if (index < 0 || next < 0 || next >= items.length) return null;
  const copy = items.slice();
  const [item] = copy.splice(index, 1);
  copy.splice(next, 0, item);
  return copy.map((entry) => entry.id);
}

export function CoursesAdmin() {
  const { t, locale } = useI18n();
  const { me } = useMe();
  const [courses, setCourses] = useState<CourseRecord[]>([]);
  const [configured, setConfigured] = useState(true);
  const [ready, setReady] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editor, setEditor] = useState<Editor | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [published, setPublished] = useState(false);
  const [pending, setPending] = useState(false);
  const [confirmId, setConfirmId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const response = await fetch("/api/admin/courses");
    const data = (await response.json()) as { configured?: boolean; ready?: boolean; courses?: CourseRecord[] } & ApiError;
    if (response.status === 403) {
      setForbidden(true);
      setError(t.admin.forbidden);
      setLoading(false);
      return;
    }
    setForbidden(false);
    if (!response.ok) {
      setError(errorText(data, locale, t.common.error));
      setLoading(false);
      return;
    }
    setConfigured(data.configured !== false);
    setReady(data.ready !== false);
    setCourses(data.courses ?? []);
    setLoading(false);
  }, [locale, t]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(id);
  }, [load]);

  function openEditor(next: Editor) {
    const source = next.kind === "course" ? next.course : next.lesson;
    setTitle(source?.title ?? "");
    setDescription(source?.description ?? "");
    setVideoUrl(source?.videoUrl ?? "");
    setPublished(source?.published ?? false);
    setError("");
    setEditor(next);
  }

  async function send(body: unknown, success: string) {
    setPending(true);
    setError("");
    setNotice("");
    const response = await fetch("/api/admin/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await response.json().catch(() => ({}))) as ApiError;
    setPending(false);
    if (!response.ok) {
      setError(errorText(data, locale, t.common.error));
      return;
    }
    setNotice(success);
    setEditor(null);
    setConfirmId("");
    await load();
  }

  async function onSave(event: React.FormEvent) {
    event.preventDefault();
    if (!editor) return;
    if (!cleanCourseContent({ title, description, videoUrl, published })) {
      setError(t.catalog.invalid);
      return;
    }
    const fields = { title, description, videoUrl, published };
    if (editor.kind === "course") {
      await send(
        editor.course ? { action: "update-course", id: editor.course.id, ...fields } : { action: "create-course", ...fields },
        t.catalog.saved,
      );
      return;
    }
    await send(
      editor.lesson
        ? { action: "update-lesson", id: editor.lesson.id, ...fields }
        : { action: "create-lesson", courseId: editor.courseId, ...fields },
      t.catalog.saved,
    );
  }

  async function reorderCourses(id: string, direction: -1 | 1) {
    const ids = move(courses, id, direction);
    if (!ids) return;
    await send({ action: "reorder-courses", ids }, t.catalog.saved);
  }

  async function reorderLessons(course: CourseRecord, id: string, direction: -1 | 1) {
    const ids = move(course.lessons, id, direction);
    if (!ids) return;
    await send({ action: "reorder-lessons", courseId: course.id, ids }, t.catalog.saved);
  }

  const showEditor = !forbidden || isDemoMode();

  return (
    <div className="min-h-dvh">
      <AppHeader me={me} />
      <div className="mx-auto max-w-5xl px-4 py-10">
        <AdminNav current="courses" />
        <h1 className="text-3xl font-semibold">{t.catalog.title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-muted">{t.catalog.lead}</p>
        {error ? <p className="mt-4 text-sm text-secondary" role="alert">{error}</p> : null}
        {notice ? <p className="mt-4 text-sm text-primary" role="status">{notice}</p> : null}
        {!configured ? <p className="mt-4 rounded-lg border border-border bg-surface p-4 text-sm">{t.admin.unconfigured}</p> : null}
        {configured && !ready && !forbidden ? (
          <p className="mt-4 rounded-lg border border-border bg-surface p-4 text-sm leading-7">{t.catalog.schema}</p>
        ) : null}
        {showEditor ? (
          <div className="mt-6">
            {editor ? (
              <form onSubmit={(event) => void onSave(event)} className="max-w-xl space-y-3 rounded-lg border border-border bg-surface p-4">
                <h2 className="text-lg font-semibold">
                  {editor.kind === "course"
                    ? editor.course
                      ? t.catalog.editCourse
                      : t.catalog.addCourse
                    : editor.lesson
                      ? t.catalog.editLesson
                      : t.catalog.addLesson}
                </h2>
                <label className="block text-sm">
                  <span className="mb-1 block text-muted">{t.catalog.titleField}</span>
                  <Input value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={140} />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block text-muted">{t.catalog.description}</span>
                  <Textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={4000} />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block text-muted">{t.catalog.video}</span>
                  <Input
                    value={videoUrl}
                    onChange={(event) => setVideoUrl(event.target.value)}
                    dir="ltr"
                    className="text-left"
                    placeholder="https://www.youtube.com/watch?v="
                    maxLength={500}
                  />
                  <span className="mt-1 block text-xs text-muted">{t.catalog.videoHint}</span>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={published}
                    onChange={(event) => setPublished(event.target.checked)}
                    className="size-4 accent-[#00D4B4]"
                  />
                  {t.catalog.published}
                </label>
                <div className="flex flex-wrap gap-2">
                  <Button type="submit" disabled={pending}>{pending ? t.common.loading : t.catalog.save}</Button>
                  <Button type="button" variant="outline" onClick={() => setEditor(null)}>{t.common.cancel}</Button>
                </div>
              </form>
            ) : (
              <Button type="button" onClick={() => openEditor({ kind: "course", course: null })}>{t.catalog.addCourse}</Button>
            )}
          </div>
        ) : null}
        {loading ? <p className="mt-6 text-sm text-muted">{t.common.loading}</p> : null}
        {!loading && courses.length === 0 && ready && configured ? <p className="mt-6 text-sm text-muted">{t.catalog.empty}</p> : null}
        <div className="mt-6 space-y-4">
          {courses.map((course, courseIndex) => (
            <article key={course.id} className="rounded-lg border border-border bg-surface p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold">{course.title}</h2>
                  <p className="mt-1 text-xs text-muted">{course.published ? t.catalog.published : t.catalog.draft}</p>
                  {course.description ? <p className="mt-2 max-w-3xl text-sm leading-7 text-muted">{course.description}</p> : null}
                  {course.videoUrl ? <p className="mt-1 text-xs text-primary" dir="ltr">{course.videoUrl}</p> : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant="outline" disabled={courseIndex === 0 || pending} onClick={() => void reorderCourses(course.id, -1)}>{t.catalog.up}</Button>
                  <Button type="button" size="sm" variant="outline" disabled={courseIndex === courses.length - 1 || pending} onClick={() => void reorderCourses(course.id, 1)}>{t.catalog.down}</Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => openEditor({ kind: "course", course })}>{t.catalog.edit}</Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => openEditor({ kind: "lesson", courseId: course.id, lesson: null })}>{t.catalog.addLesson}</Button>
                  {confirmId === course.id ? (
                    <Button type="button" size="sm" variant="secondary" onClick={() => void send({ action: "delete-course", id: course.id }, t.catalog.removed)}>{t.catalog.confirmRemove}</Button>
                  ) : (
                    <Button type="button" size="sm" variant="outline" onClick={() => setConfirmId(course.id)}>{t.catalog.remove}</Button>
                  )}
                </div>
              </div>
              {course.lessons.length === 0 ? <p className="mt-4 text-sm text-muted">{t.catalog.noLessons}</p> : null}
              <ul className="mt-4 space-y-2">
                {course.lessons.map((lesson, lessonIndex) => (
                  <li key={lesson.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2">
                    <div>
                      <p className="font-medium">{lesson.title}</p>
                      <p className="text-xs text-muted">{lesson.published ? t.catalog.published : t.catalog.draft}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" size="sm" variant="outline" disabled={lessonIndex === 0 || pending} onClick={() => void reorderLessons(course, lesson.id, -1)}>{t.catalog.up}</Button>
                      <Button type="button" size="sm" variant="outline" disabled={lessonIndex === course.lessons.length - 1 || pending} onClick={() => void reorderLessons(course, lesson.id, 1)}>{t.catalog.down}</Button>
                      <Button type="button" size="sm" variant="outline" onClick={() => openEditor({ kind: "lesson", courseId: course.id, lesson })}>{t.catalog.edit}</Button>
                      {confirmId === lesson.id ? (
                        <Button type="button" size="sm" variant="secondary" onClick={() => void send({ action: "delete-lesson", id: lesson.id }, t.catalog.removed)}>{t.catalog.confirmRemove}</Button>
                      ) : (
                        <Button type="button" size="sm" variant="outline" onClick={() => setConfirmId(lesson.id)}>{t.catalog.remove}</Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { FavoriteButton } from "@/components/favorite-button";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/locale-provider";
import { useMe } from "@/components/use-me";
import type { CourseRecord, LessonRecord } from "@/lib/courses";
import { youtubeEmbedUrl } from "@/lib/youtube";
import { cn } from "@/lib/utils";

export function CourseView({ courseId }: { courseId: string }) {
  const { t } = useI18n();
  const { me } = useMe();
  const [course, setCourse] = useState<CourseRecord | null | undefined>(undefined);
  const [active, setActive] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [favoriteCourses, setFavoriteCourses] = useState<Set<string>>(new Set());
  const [favoriteLessons, setFavoriteLessons] = useState<Set<string>>(new Set());
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void (async () => {
        try {
          const response = await fetch("/api/courses");
          const data = (await response.json()) as { active?: boolean; courses?: CourseRecord[]; completedLessonIds?: string[] };
          if (!response.ok) {
            setFailed(true);
            setCourse(null);
            return;
          }
          setActive(data.active !== false);
          const match = (data.courses ?? []).find((item) => item.id === courseId) ?? null;
          setCourse(match);
          setCompleted(new Set(data.completedLessonIds ?? []));
          setSelectedId(match?.lessons[0]?.id ?? null);
        } catch {
          setFailed(true);
          setCourse(null);
        }
      })();
    }, 0);
    return () => window.clearTimeout(id);
  }, [courseId]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void fetch("/api/favorites")
        .then(async (response) => {
          if (!response.ok) return;
          const data = (await response.json()) as { ids?: { course?: string[]; lesson?: string[] } };
          setFavoriteCourses(new Set(data.ids?.course ?? []));
          setFavoriteLessons(new Set(data.ids?.lesson ?? []));
        })
        .catch(() => undefined);
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  const selected: LessonRecord | null = course?.lessons.find((lesson) => lesson.id === selectedId) ?? course?.lessons[0] ?? null;
  const embed = selected ? youtubeEmbedUrl(selected.videoUrl) : null;

  useEffect(() => {
    if (!selected || !active) return;
    const lessonId = selected.id;
    const id = window.setTimeout(() => {
      void markLesson(lessonId);
    }, 0);
    return () => window.clearTimeout(id);
  }, [selected, active]);

  async function markLesson(lessonId: string) {
    const response = await fetch("/api/courses/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId }),
    });
    if (response.ok) setCompleted((current) => new Set(current).add(lessonId));
  }

  return (
    <div className="min-h-dvh">
      <AppHeader me={me} />
      <div className="mx-auto max-w-5xl px-4 py-10">
        <Link href="/dashboard" className="text-sm text-primary">{t.catalog.back}</Link>
        {failed ? <p className="mt-4 text-sm text-secondary">{t.common.error}</p> : null}
        {course === undefined ? <p className="mt-6 text-sm text-muted">{t.common.loading}</p> : null}
        {course === null || (course && !active) ? (
          <p className="mt-6 text-sm text-muted">{active ? t.catalog.dashEmpty : t.catalog.locked}</p>
        ) : null}
        {course && active ? (
          <>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold">{course.title}</h1>
              <FavoriteButton targetType="course" targetId={course.id} active={favoriteCourses.has(course.id)} label={t.favorites.save} />
            </div>
            {course.description ? <p className="mt-2 max-w-3xl text-sm leading-7 text-muted">{course.description}</p> : null}
            {course.lessons.length > 0 && course.lessons.every((lesson) => completed.has(lesson.id)) ? (
              <p className="mt-3 text-sm text-primary">
                <Link href="/messages">{t.inbox.ready}</Link>
              </p>
            ) : null}
            {course.videoUrl && youtubeEmbedUrl(course.videoUrl) ? (
              <div className="mt-6 overflow-hidden rounded-lg border border-border">
                <iframe
                  className="aspect-video w-full"
                  src={youtubeEmbedUrl(course.videoUrl) ?? undefined}
                  title={course.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : null}
            <div className="mt-6 grid gap-4 md:grid-cols-[16rem_1fr]">
              <ul className="space-y-2">
                {course.lessons.map((lesson) => (
                  <li key={lesson.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(lesson.id)}
                      className={cn(
                        "w-full rounded-lg border px-3 py-2 text-start text-sm",
                        lesson.id === selected?.id ? "border-primary bg-primary/10" : "border-border bg-surface",
                      )}
                    >
                      <span>{lesson.title}</span>
                      {completed.has(lesson.id) ? <span className="mt-1 block text-xs text-primary">{t.progress.completed}</span> : null}
                    </button>
                  </li>
                ))}
              </ul>
              <article className="rounded-lg border border-border bg-surface p-4">
                {selected ? (
                  <>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-2xl font-semibold">{selected.title}</h2>
                      <FavoriteButton targetType="lesson" targetId={selected.id} active={favoriteLessons.has(selected.id)} label={t.favorites.save} />
                    </div>
                    {selected.description ? <p className="mt-2 text-sm leading-7 text-muted">{selected.description}</p> : null}
                    <div className="mt-3">
                      {completed.has(selected.id) ? (
                        <p className="text-sm text-primary">{t.progress.completed}</p>
                      ) : (
                        <Button type="button" size="sm" onClick={() => void markLesson(selected.id)}>{t.progress.mark}</Button>
                      )}
                    </div>
                    {embed ? (
                      <div className="mt-4 overflow-hidden rounded-lg border border-border">
                        <iframe
                          className="aspect-video w-full"
                          src={embed}
                          title={selected.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    ) : selected.videoUrl ? (
                      <a href={selected.videoUrl} className="mt-4 inline-block text-sm text-primary" target="_blank" rel="noreferrer">
                        {t.catalog.external}
                      </a>
                    ) : (
                      <p className="mt-4 text-sm text-muted">{t.catalog.noVideo}</p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted">{t.catalog.noLessons}</p>
                )}
              </article>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

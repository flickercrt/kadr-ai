"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/app-header";
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
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void (async () => {
        try {
          const response = await fetch("/api/courses");
          const data = (await response.json()) as { active?: boolean; courses?: CourseRecord[] };
          if (!response.ok) {
            setFailed(true);
            setCourse(null);
            return;
          }
          setActive(data.active !== false);
          const match = (data.courses ?? []).find((item) => item.id === courseId) ?? null;
          setCourse(match);
          setSelectedId(match?.lessons[0]?.id ?? null);
        } catch {
          setFailed(true);
          setCourse(null);
        }
      })();
    }, 0);
    return () => window.clearTimeout(id);
  }, [courseId]);

  const selected: LessonRecord | null = course?.lessons.find((lesson) => lesson.id === selectedId) ?? course?.lessons[0] ?? null;
  const embed = selected ? youtubeEmbedUrl(selected.videoUrl) : null;

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
            <h1 className="mt-4 text-3xl font-semibold">{course.title}</h1>
            {course.description ? <p className="mt-2 max-w-3xl text-sm leading-7 text-muted">{course.description}</p> : null}
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
                      {lesson.title}
                    </button>
                  </li>
                ))}
              </ul>
              <article className="rounded-lg border border-border bg-surface p-4">
                {selected ? (
                  <>
                    <h2 className="text-2xl font-semibold">{selected.title}</h2>
                    {selected.description ? <p className="mt-2 text-sm leading-7 text-muted">{selected.description}</p> : null}
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

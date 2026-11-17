"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { useI18n } from "@/components/locale-provider";
import { useMe } from "@/components/use-me";

type Lesson = { id: string; title: string; state: "done" | "current" | "next" | "upcoming" };
type Course = { id: string; title: string; certificateId: string | null; lessons: Lesson[] };

const dot = {
  done: "bg-primary",
  current: "bg-[#FF6B4A]",
  next: "bg-white/70",
  upcoming: "bg-border",
};

export function TimelinePage() {
  const { t } = useI18n();
  const { me } = useMe();
  const [courses, setCourses] = useState<Course[] | null>(null);
  const [ready, setReady] = useState(true);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void fetch("/api/timeline")
        .then(async (response) => {
          if (!response.ok) return;
          const data = (await response.json()) as { ready?: boolean; courses?: Course[] };
          setReady(data.ready !== false);
          setCourses(data.courses ?? []);
        })
        .catch(() => undefined);
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  const label = {
    done: t.timeline.done,
    current: t.timeline.current,
    next: t.timeline.next,
    upcoming: t.timeline.upcoming,
  };

  return (
    <div className="min-h-dvh">
      <AppHeader me={me} />
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-semibold">{t.timeline.title}</h1>
        <p className="mt-2 text-sm leading-7 text-muted">{t.timeline.lead}</p>
        {!ready ? <p className="mt-4 text-sm text-muted">{t.timeline.schema}</p> : null}
        <div className="mt-8 space-y-10">
          {(courses ?? []).map((course) => (
            <section key={course.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-xl font-semibold">{course.title}</h2>
                {course.certificateId ? (
                  <Link href={`/certificates/${course.certificateId}`} className="text-sm text-[#FF6B4A]">{t.timeline.certificate}</Link>
                ) : null}
              </div>
              <ol className="mt-4 border-s border-border ps-5">
                {course.lessons.map((lesson) => (
                  <li key={lesson.id} className="relative pb-5">
                    <span className={`absolute -start-[1.4rem] top-1 size-3 rounded-full ${dot[lesson.state]}`} />
                    <Link href={`/dashboard/courses/${course.id}`} className="font-medium">{lesson.title}</Link>
                    <p className="text-xs text-muted">{label[lesson.state]}</p>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
        {ready && courses && courses.length === 0 ? <p className="mt-6 text-sm text-muted">{t.timeline.empty}</p> : null}
      </div>
    </div>
  );
}

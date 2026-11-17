"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useI18n } from "@/components/locale-provider";
import type { CourseRecord } from "@/lib/courses";

export function CoursesSection() {
  const { t } = useI18n();
  const [courses, setCourses] = useState<CourseRecord[] | null>(null);
  const [active, setActive] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void (async () => {
        try {
          const response = await fetch("/api/courses");
          if (response.status === 401) {
            setActive(false);
            setCourses([]);
            return;
          }
          const data = (await response.json()) as { active?: boolean; courses?: CourseRecord[] };
          if (!response.ok) {
            setFailed(true);
            setCourses([]);
            return;
          }
          setActive(data.active !== false);
          setCourses(data.courses ?? []);
        } catch {
          setFailed(true);
          setCourses([]);
        }
      })();
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <section className="mt-10">
      <h2 className="text-2xl font-semibold">{t.catalog.dashTitle}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-7 text-muted">{t.catalog.dashLead}</p>
      {failed ? <p className="mt-4 text-sm text-secondary">{t.common.error}</p> : null}
      {courses === null ? <p className="mt-4 text-sm text-muted">{t.common.loading}</p> : null}
      {courses && !active ? (
        <p className="mt-4 rounded-lg border border-border bg-surface p-4 text-sm">
          {t.catalog.locked}{" "}
          <Link href="/account" className="text-primary">{t.dash.upgrade}</Link>
        </p>
      ) : null}
      {courses && active && courses.length === 0 ? <p className="mt-4 text-sm text-muted">{t.catalog.dashEmpty}</p> : null}
      {courses && active && courses.length > 0 ? (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {courses.map((course) => (
            <Link key={course.id} href={`/dashboard/courses/${course.id}`} className="rounded-lg border border-border bg-surface p-5 transition hover:scale-[1.015]">
              <h3 className="text-xl font-semibold">{course.title}</h3>
              {course.description ? <p className="mt-2 text-sm leading-7 text-muted">{course.description}</p> : null}
              <p className="mt-4 text-sm text-primary">
                {course.lessons.length} {t.catalog.lessons} · {t.catalog.open}
              </p>
            </Link>
          ))}
        </div>
      ) : null}
    </section>
  );
}

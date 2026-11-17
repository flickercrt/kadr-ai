"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import { isDemoMode } from "@/lib/env";
import type { Locale } from "@/lib/i18n";

type CourseProgress = { id: string; title: string; done: number; total: number; percent: number };
type StudentProgress = {
  id: string;
  email: string | null;
  username: string | null;
  name: string | null;
  courses: CourseProgress[];
};

function errorText(data: { error?: { ar?: string; en?: string } }, locale: Locale, fallback: string) {
  return (locale === "ar" ? data.error?.ar : data.error?.en) || fallback;
}

export function ProgressPanel() {
  const { t, locale } = useI18n();
  const [students, setStudents] = useState<StudentProgress[]>([]);
  const [ready, setReady] = useState(true);
  const [configured, setConfigured] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void (async () => {
        const response = await fetch("/api/admin/progress");
        const data = (await response.json()) as {
          configured?: boolean;
          ready?: boolean;
          students?: StudentProgress[];
          error?: { ar?: string; en?: string };
        };
        if (response.status === 403 && !isDemoMode()) {
          setError(errorText(data, locale, t.common.error));
          setLoading(false);
          return;
        }
        if (!response.ok && response.status !== 403) {
          setError(errorText(data, locale, t.common.error));
          setLoading(false);
          return;
        }
        setConfigured(data.configured !== false);
        setReady(data.ready !== false);
        setStudents(data.students ?? []);
        setLoading(false);
      })();
    }, 0);
    return () => window.clearTimeout(id);
  }, [locale, t]);

  const rows = students.flatMap((student) => {
    const label = student.name || student.username || student.email || "—";
    if (student.courses.length === 0) {
      return [{ key: student.id, userId: student.id, courseId: "", student: label, course: "—", done: 0, total: 0, percent: 0 }];
    }
    return student.courses.map((course) => ({
      key: `${student.id}-${course.id}`,
      userId: student.id,
      courseId: course.id,
      student: label,
      course: course.title,
      done: course.done,
      total: course.total,
      percent: course.percent,
    }));
  });

  return (
    <section className="mt-12">
      <h2 className="text-2xl font-semibold">{t.progress.title}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-7 text-muted">{t.progress.lead}</p>
      {error ? <p className="mt-4 text-sm text-secondary" role="alert">{error}</p> : null}
      {configured && !ready ? <p className="mt-4 rounded-lg border border-border bg-surface p-4 text-sm leading-7">{t.progress.schema}</p> : null}
      {loading ? <p className="mt-4 text-sm text-muted">{t.common.loading}</p> : null}
      <div className="mt-4 overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-surface text-muted">
            <tr>
              <th className="p-3 text-start font-medium">{t.progress.student}</th>
              <th className="p-3 text-start font-medium">{t.progress.course}</th>
              <th className="p-3 text-start font-medium">{t.progress.lessons}</th>
              <th className="p-3 text-start font-medium">{t.progress.percent}</th>
              <th className="p-3 text-start font-medium">{t.inbox.certificate}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className="border-t border-border">
                <td className="p-3">{row.student}</td>
                <td className="p-3">{row.course}</td>
                <td className="p-3">{row.done}/{row.total}</td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-2 w-24 overflow-hidden rounded-full bg-border">
                      <span className="block h-full bg-primary" style={{ width: `${row.percent}%` }} />
                    </span>
                    <span>{row.percent}%</span>
                  </div>
                </td>
                <td className="p-3">
                  {row.percent === 100 && row.courseId ? (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        void fetch("/api/admin/certificates", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ userId: row.userId, courseId: row.courseId }),
                        }).then(async (response) => {
                          const data = (await response.json().catch(() => ({}))) as { id?: string };
                          if (response.ok && data.id) window.location.href = `/certificates/${data.id}`;
                        });
                      }}
                    >
                      {t.inbox.issue}
                    </Button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!loading && rows.length === 0 ? <p className="mt-4 text-sm text-muted">{t.progress.empty}</p> : null}
    </section>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/components/locale-provider";

type Stats = {
  students: number;
  active: number;
  newThisWeek: number;
  lessonsCompleted: number | null;
  revenueEstimate: number;
  currencySymbol: string;
};

export function StatsStrip() {
  const { t } = useI18n();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void (async () => {
        const response = await fetch("/api/admin/stats");
        if (!response.ok) return;
        const data = (await response.json()) as Stats;
        if (typeof data.students !== "number") return;
        setStats(data);
      })();
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  const cards = [
    [t.stats.students, stats ? String(stats.students) : "—"],
    [t.stats.active, stats ? String(stats.active) : "—"],
    [t.stats.week, stats ? String(stats.newThisWeek) : "—"],
    [t.stats.lessons, stats && stats.lessonsCompleted != null ? String(stats.lessonsCompleted) : "—"],
    [t.stats.revenue, stats ? `${stats.currencySymbol}${stats.revenueEstimate}` : "—"],
  ] as const;

  return (
    <section className="mt-6">
      <h2 className="text-lg font-semibold">{t.stats.title}</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map(([label, value]) => (
          <article key={label} className="rounded-lg border border-border bg-surface p-4">
            <p className="text-xs text-muted">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-primary" dir="ltr">{value}</p>
            {label === t.stats.lessons && stats != null && stats.lessonsCompleted == null ? (
              <p className="mt-1 text-[11px] leading-5 text-muted">{t.stats.lessonsMissing}</p>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/components/locale-provider";
import { isDemoMode } from "@/lib/env";

type Stats = {
  students: number;
  active: number;
  newThisWeek: number;
  lessonsCompleted: number;
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
        if (response.status === 403 && !isDemoMode()) return;
        if (!response.ok && response.status !== 403) return;
        const data = (await response.json()) as Stats;
        setStats(data);
      })();
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  const cards = [
    [t.stats.students, stats ? String(stats.students) : "—"],
    [t.stats.active, stats ? String(stats.active) : "—"],
    [t.stats.week, stats ? String(stats.newThisWeek) : "—"],
    [t.stats.lessons, stats ? String(stats.lessonsCompleted) : "—"],
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
          </article>
        ))}
      </div>
    </section>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isDemoMode } from "@/lib/env";

type Row = { id: string; name: string; email: string | null; username: string | null; endsAt: string; daysLeft: number | null };

export function RenewalAdmin() {
  const { t } = useI18n();
  const [days, setDays] = useState("5");
  const [students, setStudents] = useState<Row[]>([]);
  const [ready, setReady] = useState(true);
  const [notice, setNotice] = useState("");

  async function load() {
    const response = await fetch("/api/admin/reminders");
    if (response.status === 403 && !isDemoMode()) return;
    const data = (await response.json()) as { ready?: boolean; daysBefore?: number; students?: Row[] };
    if (!response.ok && response.status !== 403) return;
    setReady(data.ready !== false);
    setDays(String(data.daysBefore ?? 5));
    setStudents(data.students ?? []);
  }

  useEffect(() => {
    const id = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <section className="mt-10">
      <h2 className="text-2xl font-semibold">{t.reminder.adminTitle}</h2>
      <p className="mt-2 text-sm leading-7 text-muted">{t.reminder.adminLead}</p>
      {!ready ? <p className="mt-4 rounded-lg border border-border bg-surface p-4 text-sm">{t.reminder.schema}</p> : null}
      <form
        className="mt-4 flex flex-wrap items-end gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          void (async () => {
            const response = await fetch("/api/admin/reminders", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ daysBefore: Number(days) }),
            });
            if (response.ok) {
              setNotice(t.reminder.saved);
              await load();
            }
          })();
        }}
      >
        <label className="text-sm">
          <span className="mb-1 block text-muted">{t.reminder.days}</span>
          <Input type="number" min={1} max={60} value={days} onChange={(event) => setDays(event.target.value)} className="w-28" dir="ltr" />
        </label>
        <Button type="submit">{t.common.save}</Button>
      </form>
      {notice ? <p className="mt-3 text-sm text-primary">{notice}</p> : null}
      <ul className="mt-4 space-y-2">
        {students.map((student) => (
          <li key={student.id} className="rounded-lg border border-border bg-surface px-4 py-3 text-sm">
            <span className="font-semibold">{student.name || student.username || student.email}</span>
            <span className="ms-2 text-muted" dir="ltr">{student.endsAt.slice(0, 10)}</span>
            <span className="ms-2 text-[#FF6B4A]">{t.reminder.daysLeft.replace("{days}", String(student.daysLeft ?? ""))}</span>
          </li>
        ))}
      </ul>
      {ready && students.length === 0 ? <p className="mt-4 text-sm text-muted">{t.reminder.empty}</p> : null}
    </section>
  );
}

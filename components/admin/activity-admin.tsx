"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminNav } from "@/components/admin/admin-nav";
import { AppHeader } from "@/components/app-header";
import { useI18n } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMe } from "@/components/use-me";
import { isDemoMode } from "@/lib/env";

const demoEntries: Entry[] = [
  { id: "demo-1", actorEmail: "admin@kadr.ai", actorRole: "admin", action: "student.created", targetType: "user", targetId: "9f2c1a80", createdAt: "2026-11-17T18:04:00.000Z" },
  { id: "demo-2", actorEmail: "sara@students.kadr-ai.local", actorRole: "student", action: "auth.login", targetType: "user", targetId: "1ab34c90", createdAt: "2026-11-17T18:11:00.000Z" },
  { id: "demo-3", actorEmail: "admin@kadr.ai", actorRole: "admin", action: "pricing.updated", targetType: "pricing", targetId: null, createdAt: "2026-11-17T18:20:00.000Z" },
  { id: "demo-4", actorEmail: "admin@kadr.ai", actorRole: "admin", action: "certificate.issued", targetType: "certificate", targetId: "c4e8d210", createdAt: "2026-11-17T18:32:00.000Z" },
];

const actions = [
  "",
  "auth.login",
  "student.created",
  "student.updated",
  "student.password_reset",
  "subscription.updated",
  "pricing.updated",
  "message.sent",
  "certificate.issued",
  "gallery.updated",
  "video.updated",
  "course.updated",
  "maintenance.toggled",
];

type Entry = {
  id: string;
  actorEmail: string | null;
  actorRole: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  createdAt: string;
};

export function ActivityAdmin() {
  const { t } = useI18n();
  const { me } = useMe();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [ready, setReady] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [actor, setActor] = useState("");
  const [action, setAction] = useState("");
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const load = useCallback(async (nextPage: number) => {
    const params = new URLSearchParams({ page: String(nextPage), actor, action, q, from, to });
    let response: Response;
    try {
      response = await fetch(`/api/admin/activity?${params}`);
    } catch {
      setReady(false);
      return;
    }
    if (response.status === 403 && !isDemoMode()) return;
    const data = (await response.json().catch(() => ({}))) as { ready?: boolean; entries?: Entry[]; total?: number; page?: number };
    if (!response.ok && response.status !== 403) return;
    const nextReady = data.ready !== false && response.ok;
    const nextEntries = data.entries ?? [];
    const preview = isDemoMode() && !nextReady;
    const visible = preview
      ? demoEntries.filter((entry) => {
          if (action && entry.action !== action) return false;
          if (actor && !(entry.actorEmail ?? "").toLowerCase().includes(actor.toLowerCase())) return false;
          if (q) {
            const haystack = `${entry.action} ${entry.actorEmail ?? ""} ${entry.targetType ?? ""} ${entry.targetId ?? ""}`.toLowerCase();
            if (!haystack.includes(q.toLowerCase())) return false;
          }
          const day = entry.createdAt.slice(0, 10);
          if (from && day < from) return false;
          if (to && day > to) return false;
          return true;
        })
      : nextEntries;
    setReady(nextReady);
    setEntries(visible);
    setTotal(preview ? visible.length : (data.total ?? 0));
    setPage(data.page ?? nextPage);
  }, [action, actor, from, q, to]);

  useEffect(() => {
    const id = window.setTimeout(() => void load(1), 0);
    return () => window.clearTimeout(id);
  }, [load]);

  const pages = Math.max(1, Math.ceil(total / 25));

  return (
    <div className="min-h-dvh">
      <AppHeader me={me} />
      <div className="mx-auto max-w-5xl px-4 py-10">
        <AdminNav current="activity" />
        <h1 className="text-3xl font-semibold">{t.activity.title}</h1>
        <p className="mt-2 text-sm leading-7 text-muted">{t.activity.lead}</p>
        {!ready ? (
          <p className="mt-4 rounded-lg border border-border bg-surface p-4 text-sm leading-7">
            {isDemoMode() ? t.activity.demo : t.activity.schema}
          </p>
        ) : null}
        <form
          className="mt-6 flex flex-wrap gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void load(1);
          }}
        >
          <Input className="max-w-xs" value={actor} onChange={(event) => setActor(event.target.value)} placeholder={t.activity.actor} />
          <select value={action} onChange={(event) => setAction(event.target.value)} className="h-11 rounded-lg border border-border bg-background px-3 text-sm">
            {actions.map((item) => (
              <option key={item || "all"} value={item}>{item || t.activity.allActions}</option>
            ))}
          </select>
          <Input className="max-w-xs" value={q} onChange={(event) => setQ(event.target.value)} placeholder={t.activity.search} />
          <Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} dir="ltr" className="w-40" />
          <Input type="date" value={to} onChange={(event) => setTo(event.target.value)} dir="ltr" className="w-40" />
          <Button type="submit">{t.activity.apply}</Button>
        </form>
        <div className="mt-4 overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-surface text-muted">
              <tr>
                <th className="p-3 text-start font-medium">{t.activity.when}</th>
                <th className="p-3 text-start font-medium">{t.activity.actor}</th>
                <th className="p-3 text-start font-medium">{t.activity.action}</th>
                <th className="p-3 text-start font-medium">{t.activity.target}</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-t border-border">
                  <td className="p-3" dir="ltr">{entry.createdAt.slice(0, 16).replace("T", " ")}</td>
                  <td className="p-3" dir="ltr">{entry.actorEmail || entry.actorRole}</td>
                  <td className="p-3">{entry.action}</td>
                  <td className="p-3">{entry.targetType} {entry.targetId ? <span dir="ltr" className="text-muted">{entry.targetId.slice(0, 8)}</span> : null}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {ready && entries.length === 0 ? <p className="mt-4 text-sm text-muted">{t.activity.empty}</p> : null}
        <div className="mt-4 flex items-center gap-2 text-sm">
          <Button type="button" size="sm" variant="outline" disabled={page <= 1} onClick={() => void load(page - 1)}>{t.activity.prev}</Button>
          <span className="text-muted">{page} / {pages}</span>
          <Button type="button" size="sm" variant="outline" disabled={page >= pages} onClick={() => void load(page + 1)}>{t.activity.next}</Button>
        </div>
      </div>
    </div>
  );
}

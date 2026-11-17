"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import { isDemoMode } from "@/lib/env";

type Notice = { id: string; body: string; createdAt: string; readAt: string | null };

export function SignupNotices() {
  const { t } = useI18n();
  const [ready, setReady] = useState(true);
  const [notices, setNotices] = useState<Notice[]>([]);

  async function load() {
    const response = await fetch("/api/admin/notifications");
    if (response.status === 403 && !isDemoMode()) return;
    const data = (await response.json()) as { ready?: boolean; notifications?: Notice[] };
    if (!response.ok && response.status !== 403) return;
    setReady(data.ready !== false);
    setNotices(data.notifications ?? []);
  }

  useEffect(() => {
    const id = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  const unread = notices.filter((notice) => !notice.readAt);

  return (
    <section className="mt-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold">{t.notices.title}</h2>
        {unread.length > 0 ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              void fetch("/api/admin/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }).then(() => load());
            }}
          >
            {t.notices.read}
          </Button>
        ) : null}
      </div>
      <p className="mt-2 text-sm text-muted">{t.notices.lead}</p>
      {!ready ? <p className="mt-4 rounded-lg border border-border bg-surface p-4 text-sm leading-7">{t.notices.schema}</p> : null}
      <ul className="mt-4 space-y-2">
        {notices.map((notice) => (
          <li key={notice.id} className="rounded-lg border border-border bg-surface px-4 py-3 text-sm">
            <p className={notice.readAt ? "text-muted" : "font-semibold"}>{notice.body}</p>
            <p className="mt-1 text-xs text-muted" dir="ltr">{notice.createdAt.slice(0, 16).replace("T", " ")}</p>
          </li>
        ))}
      </ul>
      {ready && notices.length === 0 ? <p className="mt-4 text-sm text-muted">{t.notices.empty}</p> : null}
    </section>
  );
}

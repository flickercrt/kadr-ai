"use client";

import { useEffect, useState } from "react";
import { bots } from "@/config/bots";
import { AdminNav } from "@/components/admin/admin-nav";
import { AppHeader } from "@/components/app-header";
import { useI18n } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMe } from "@/components/use-me";
import { isDemoMode } from "@/lib/env";

export function BotLinksAdmin() {
  const { t, tx, locale } = useI18n();
  const { me } = useMe();
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [ready, setReady] = useState(true);
  const [configured, setConfigured] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void (async () => {
        const response = await fetch("/api/admin/bot-links");
        const data = (await response.json()) as { configured?: boolean; ready?: boolean; links?: Record<string, string>; error?: { ar?: string; en?: string } };
        if (response.status === 403 && !isDemoMode()) {
          setForbidden(true);
          setError(t.admin.forbidden);
          return;
        }
        if (!response.ok && response.status !== 403) {
          setError(locale === "ar" ? data.error?.ar || t.common.error : data.error?.en || t.common.error);
          return;
        }
        setConfigured(data.configured !== false);
        setReady(data.ready !== false);
        setUrls(data.links ?? {});
      })();
    }, 0);
    return () => window.clearTimeout(id);
  }, [locale, t]);

  const showForm = !forbidden || isDemoMode();

  return (
    <div className="min-h-dvh">
      <AppHeader me={me} />
      <div className="mx-auto max-w-3xl px-4 py-10">
        <AdminNav current="bots" />
        <h1 className="text-3xl font-semibold">{t.botLinks.title}</h1>
        <p className="mt-2 text-sm leading-7 text-muted">{t.botLinks.lead}</p>
        {error ? <p className="mt-4 text-sm text-secondary" role="alert">{error}</p> : null}
        {notice ? <p className="mt-4 text-sm text-primary" role="status">{notice}</p> : null}
        {!configured ? <p className="mt-4 rounded-lg border border-border bg-surface p-4 text-sm">{t.admin.unconfigured}</p> : null}
        {configured && !ready && !forbidden ? <p className="mt-4 rounded-lg border border-border bg-surface p-4 text-sm leading-7">{t.botLinks.schema}</p> : null}
        {showForm ? (
          <form
            className="mt-6 space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void (async () => {
                setPending(true);
                setError("");
                setNotice("");
                const response = await fetch("/api/admin/bot-links", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ links: bots.map((bot) => ({ slug: bot.slug, url: urls[bot.slug] ?? "" })) }),
                });
                const data = (await response.json().catch(() => ({}))) as { error?: { ar?: string; en?: string } };
                setPending(false);
                if (!response.ok) {
                  setError(locale === "ar" ? data.error?.ar || t.botLinks.invalid : data.error?.en || t.botLinks.invalid);
                  return;
                }
                setNotice(t.botLinks.saved);
              })();
            }}
          >
            {bots.map((bot) => (
              <label key={bot.slug} className="block rounded-lg border border-border bg-surface p-4 text-sm">
                <span className="mb-2 block font-semibold">{tx(bot.name)}</span>
                <Input
                  value={urls[bot.slug] ?? ""}
                  onChange={(event) => setUrls((current) => ({ ...current, [bot.slug]: event.target.value }))}
                  placeholder={`/dashboard/${bot.slug}`}
                  dir="ltr"
                  className="text-left"
                />
              </label>
            ))}
            <Button type="submit" disabled={pending}>{pending ? t.common.loading : t.botLinks.save}</Button>
          </form>
        ) : null}
      </div>
    </div>
  );
}

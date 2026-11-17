"use client";

import { useEffect, useState } from "react";
import { AdminNav } from "@/components/admin/admin-nav";
import { AppHeader } from "@/components/app-header";
import { WatchSection } from "@/components/landing/watch-section";
import { useI18n } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useMe } from "@/components/use-me";
import { isDemoMode } from "@/lib/env";
import type { Locale } from "@/lib/i18n";
import { resolveWatch, type WatchDraft } from "@/lib/watch";

const empty: WatchDraft = {
  enabled: true,
  kickerAr: "",
  kickerEn: "",
  titleAr: "",
  titleEn: "",
  leadAr: "",
  leadEn: "",
  videoUrl: "",
};

export function WatchAdmin() {
  const { t, locale } = useI18n();
  const { me } = useMe();
  const [draft, setDraft] = useState<WatchDraft>(empty);
  const [ready, setReady] = useState(true);
  const [configured, setConfigured] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void (async () => {
        const response = await fetch("/api/admin/watch");
        const data = (await response.json()) as { configured?: boolean; ready?: boolean; draft?: WatchDraft | null; error?: { ar?: string; en?: string } };
        if (response.status === 403 && !isDemoMode()) {
          setForbidden(true);
          setError(t.admin.forbidden);
          return;
        }
        if (!response.ok && response.status !== 403) {
          setError(message(data, locale, t.common.error));
          return;
        }
        setConfigured(data.configured !== false);
        setReady(data.ready !== false);
        if (data.draft) setDraft(data.draft);
      })();
    }, 0);
    return () => window.clearTimeout(id);
  }, [locale, t]);

  function set<K extends keyof WatchDraft>(key: K, value: WatchDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  const showForm = !forbidden || isDemoMode();

  return (
    <div className="min-h-dvh">
      <AppHeader me={me} />
      <div className="mx-auto max-w-5xl px-4 py-10">
        <AdminNav current="watch" />
        <h1 className="text-3xl font-semibold">{t.watchAdmin.title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-muted">{t.watchAdmin.lead}</p>
        {error ? <p className="mt-4 text-sm text-secondary" role="alert">{error}</p> : null}
        {notice ? <p className="mt-4 text-sm text-primary" role="status">{notice}</p> : null}
        {!configured ? <p className="mt-4 rounded-lg border border-border bg-surface p-4 text-sm">{t.admin.unconfigured}</p> : null}
        {configured && !ready && !forbidden ? <p className="mt-4 rounded-lg border border-border bg-surface p-4 text-sm leading-7">{t.watchAdmin.schema}</p> : null}
        {showForm ? (
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <form
              className="space-y-3 rounded-lg border border-border bg-surface p-4"
              onSubmit={(event) => {
                event.preventDefault();
                void (async () => {
                  setPending(true);
                  setError("");
                  setNotice("");
                  const response = await fetch("/api/admin/watch", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(draft),
                  });
                  const data = (await response.json().catch(() => ({}))) as { error?: { ar?: string; en?: string; code?: string } };
                  setPending(false);
                  if (!response.ok) {
                    setError(data.error?.code === "config" ? t.watchAdmin.schema : message(data, locale, t.watchAdmin.invalid));
                    return;
                  }
                  setNotice(t.watchAdmin.saved);
                })();
              }}
            >
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={draft.enabled} onChange={(event) => set("enabled", event.target.checked)} className="size-4 accent-[#00D4B4]" />
                {t.watchAdmin.enabled}
              </label>
              <Field label={t.watchAdmin.kickerAr}><Input value={draft.kickerAr} onChange={(event) => set("kickerAr", event.target.value)} /></Field>
              <Field label={t.watchAdmin.kickerEn}><Input value={draft.kickerEn} onChange={(event) => set("kickerEn", event.target.value)} dir="ltr" className="text-left" /></Field>
              <Field label={t.watchAdmin.titleAr}><Input value={draft.titleAr} onChange={(event) => set("titleAr", event.target.value)} /></Field>
              <Field label={t.watchAdmin.titleEn}><Input value={draft.titleEn} onChange={(event) => set("titleEn", event.target.value)} dir="ltr" className="text-left" /></Field>
              <Field label={t.watchAdmin.leadAr}><Textarea value={draft.leadAr} onChange={(event) => set("leadAr", event.target.value)} /></Field>
              <Field label={t.watchAdmin.leadEn}><Textarea value={draft.leadEn} onChange={(event) => set("leadEn", event.target.value)} dir="ltr" className="text-left" /></Field>
              <Field label={t.watchAdmin.video}>
                <Input value={draft.videoUrl} onChange={(event) => set("videoUrl", event.target.value)} dir="ltr" className="text-left" placeholder="https://www.youtube.com/watch?v=" />
                <input
                  type="file"
                  accept="video/mp4,video/webm"
                  className="mt-2 block text-xs text-muted"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    const body = new FormData();
                    body.set("file", file);
                    void fetch("/api/admin/watch/upload", { method: "POST", body }).then(async (response) => {
                      const data = (await response.json()) as { url?: string };
                      if (data.url) set("videoUrl", data.url);
                      else setError(t.watchAdmin.schema);
                    });
                  }}
                />
              </Field>
              <Button type="submit" disabled={pending}>{pending ? t.common.loading : t.common.save}</Button>
            </form>
            <div>
              <p className="mb-2 text-sm text-muted">{t.watchAdmin.preview}</p>
              {draft.enabled ? <WatchSection preview={resolveWatch(draft)} /> : <p className="rounded-lg border border-border bg-surface p-4 text-sm">{t.watchAdmin.hidden}</p>}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function message(data: { error?: { ar?: string; en?: string } }, locale: Locale, fallback: string) {
  return (locale === "ar" ? data.error?.ar : data.error?.en) || fallback;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-muted">{label}</span>
      {children}
    </label>
  );
}

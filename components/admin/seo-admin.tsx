"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminNav } from "@/components/admin/admin-nav";
import { AppHeader } from "@/components/app-header";
import { useI18n } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useMe } from "@/components/use-me";
import { isDemoMode } from "@/lib/env";
import type { Locale } from "@/lib/i18n";

type ApiError = { error?: { ar?: string; en?: string } };

function errorText(data: ApiError, locale: Locale, fallback: string) {
  return (locale === "ar" ? data.error?.ar : data.error?.en) || fallback;
}

export function SeoAdmin() {
  const { t, locale } = useI18n();
  const { me } = useMe();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [keywords, setKeywords] = useState("");
  const [configured, setConfigured] = useState(true);
  const [ready, setReady] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const response = await fetch("/api/admin/seo");
    const data = (await response.json()) as {
      configured?: boolean;
      ready?: boolean;
      title?: string;
      description?: string;
      keywords?: string;
    } & ApiError;
    if (response.status === 403) {
      setForbidden(true);
      setError(t.admin.forbidden);
      setLoading(false);
      return;
    }
    setForbidden(false);
    if (!response.ok) {
      setError(errorText(data, locale, t.common.error));
      setLoading(false);
      return;
    }
    setConfigured(data.configured !== false);
    setReady(data.ready !== false);
    setTitle(data.title ?? "");
    setDescription(data.description ?? "");
    setKeywords(data.keywords ?? "");
    setLoading(false);
  }, [locale, t]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(id);
  }, [load]);

  async function onSave(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    setNotice("");
    const response = await fetch("/api/admin/seo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, keywords }),
    });
    const data = (await response.json().catch(() => ({}))) as ApiError;
    setPending(false);
    if (!response.ok) {
      setError(errorText(data, locale, t.common.error));
      return;
    }
    setNotice(t.seo.saved);
  }

  const showForm = !forbidden || isDemoMode();

  return (
    <div className="min-h-dvh">
      <AppHeader me={me} />
      <div className="mx-auto max-w-3xl px-4 py-10">
        <AdminNav current="seo" />
        <h1 className="text-3xl font-semibold">{t.seo.title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-muted">{t.seo.lead}</p>
        {error ? <p className="mt-4 text-sm text-secondary" role="alert">{error}</p> : null}
        {notice ? <p className="mt-4 text-sm text-primary" role="status">{notice}</p> : null}
        {!configured ? <p className="mt-4 rounded-lg border border-border bg-surface p-4 text-sm">{t.admin.unconfigured}</p> : null}
        {configured && !ready && !forbidden ? (
          <p className="mt-4 rounded-lg border border-border bg-surface p-4 text-sm leading-7">{t.seo.schema}</p>
        ) : null}
        {loading ? <p className="mt-6 text-sm text-muted">{t.common.loading}</p> : null}
        {showForm ? (
          <form onSubmit={(event) => void onSave(event)} className="mt-6 max-w-xl space-y-3 rounded-lg border border-border bg-surface p-4">
            <label className="block text-sm">
              <span className="mb-1 block text-muted">{t.seo.siteTitle}</span>
              <Input value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={120} />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-muted">{t.seo.description}</span>
              <Textarea value={description} onChange={(event) => setDescription(event.target.value)} required maxLength={300} />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-muted">{t.seo.keywords}</span>
              <Input value={keywords} onChange={(event) => setKeywords(event.target.value)} maxLength={240} />
              <span className="mt-1 block text-xs text-muted">{t.seo.keywordsHint}</span>
            </label>
            <Button type="submit" disabled={pending}>{pending ? t.common.loading : t.seo.save}</Button>
          </form>
        ) : null}
      </div>
    </div>
  );
}

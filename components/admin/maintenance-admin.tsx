"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminNav } from "@/components/admin/admin-nav";
import { AppHeader } from "@/components/app-header";
import { useI18n } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useMe } from "@/components/use-me";
import { isDemoMode } from "@/lib/env";
import type { Locale } from "@/lib/i18n";

type ApiError = { error?: { ar?: string; en?: string } };

function errorText(data: ApiError, locale: Locale, fallback: string) {
  return (locale === "ar" ? data.error?.ar : data.error?.en) || fallback;
}

export function MaintenanceAdmin() {
  const { t, locale } = useI18n();
  const { me } = useMe();
  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState("");
  const [configured, setConfigured] = useState(true);
  const [ready, setReady] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const response = await fetch("/api/admin/maintenance");
    const data = (await response.json()) as { configured?: boolean; ready?: boolean; enabled?: boolean; message?: string } & ApiError;
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
    setEnabled(data.enabled === true);
    setMessage(data.message ?? "");
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
    const response = await fetch("/api/admin/maintenance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled, message }),
    });
    const data = (await response.json().catch(() => ({}))) as ApiError;
    setPending(false);
    if (!response.ok) {
      setError(errorText(data, locale, t.common.error));
      return;
    }
    setNotice(t.maintenance.saved);
  }

  const showForm = !forbidden || isDemoMode();

  return (
    <div className="min-h-dvh">
      <AppHeader me={me} />
      <div className="mx-auto max-w-3xl px-4 py-10">
        <AdminNav current="maintenance" />
        <h1 className="text-3xl font-semibold">{t.maintenance.title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-muted">{t.maintenance.lead}</p>
        {error ? <p className="mt-4 text-sm text-secondary" role="alert">{error}</p> : null}
        {notice ? <p className="mt-4 text-sm text-primary" role="status">{notice}</p> : null}
        {!configured ? <p className="mt-4 rounded-lg border border-border bg-surface p-4 text-sm">{t.admin.unconfigured}</p> : null}
        {configured && !ready && !forbidden ? (
          <p className="mt-4 rounded-lg border border-border bg-surface p-4 text-sm leading-7">{t.maintenance.schema}</p>
        ) : null}
        {loading ? <p className="mt-6 text-sm text-muted">{t.common.loading}</p> : null}
        {showForm ? (
          <form onSubmit={(event) => void onSave(event)} className="mt-6 max-w-xl space-y-4 rounded-lg border border-border bg-surface p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold">{t.maintenance.toggle}</p>
                <p className="mt-1 text-sm text-muted">{enabled ? t.maintenance.toggleOn : t.maintenance.toggleOff}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={enabled}
                aria-label={t.maintenance.toggle}
                onClick={() => setEnabled((value) => !value)}
                className={`relative h-7 w-12 shrink-0 rounded-full border transition ${enabled ? "border-[#00D4B4] bg-[#00D4B4]" : "border-border bg-background"}`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-[#F5F7FA] transition ${enabled ? "start-6" : "start-0.5"}`}
                />
              </button>
            </div>
            <label className="block text-sm">
              <span className="mb-1 block text-muted">{t.maintenance.message}</span>
              <Textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                maxLength={400}
                rows={4}
                placeholder={t.maintenance.messageHint}
              />
              <span className="mt-1 block text-xs text-muted">{t.maintenance.messageHint}</span>
            </label>
            <Button type="submit" disabled={pending}>{pending ? t.common.loading : t.maintenance.save}</Button>
          </form>
        ) : null}
      </div>
    </div>
  );
}

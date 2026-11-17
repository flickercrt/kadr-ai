"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminNav } from "@/components/admin/admin-nav";
import { AppHeader } from "@/components/app-header";
import { useI18n } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import { useMe } from "@/components/use-me";
import { isDemoMode } from "@/lib/env";
import type { Locale } from "@/lib/i18n";

type Message = {
  id: string;
  name: string;
  contact: string;
  subject: string;
  message: string;
  handled: boolean;
  createdAt: string;
};

type ApiError = { error?: { ar?: string; en?: string } };

function errorText(data: ApiError, locale: Locale, fallback: string) {
  return (locale === "ar" ? data.error?.ar : data.error?.en) || fallback;
}

export function ContactAdmin() {
  const { t, locale } = useI18n();
  const { me } = useMe();
  const [messages, setMessages] = useState<Message[]>([]);
  const [configured, setConfigured] = useState(true);
  const [ready, setReady] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [confirmId, setConfirmId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const response = await fetch("/api/admin/contact");
    const data = (await response.json()) as { configured?: boolean; ready?: boolean; messages?: Message[] } & ApiError;
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
    setMessages(data.messages ?? []);
    setLoading(false);
  }, [locale, t]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(id);
  }, [load]);

  async function send(body: unknown) {
    setPending(true);
    setError("");
    const response = await fetch("/api/admin/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await response.json().catch(() => ({}))) as ApiError;
    setPending(false);
    if (!response.ok) {
      setError(errorText(data, locale, t.common.error));
      return;
    }
    setConfirmId("");
    await load();
  }

  return (
    <div className="min-h-dvh">
      <AppHeader me={me} />
      <div className="mx-auto max-w-5xl px-4 py-10">
        <AdminNav current="contact" />
        <h1 className="text-3xl font-semibold">{t.contact.adminTitle}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-muted">{t.contact.adminLead}</p>
        {error ? <p className="mt-4 text-sm text-secondary" role="alert">{error}</p> : null}
        {!configured ? <p className="mt-4 rounded-lg border border-border bg-surface p-4 text-sm">{t.admin.unconfigured}</p> : null}
        {configured && !ready && !forbidden ? (
          <p className="mt-4 rounded-lg border border-border bg-surface p-4 text-sm leading-7">{t.contact.schema}</p>
        ) : null}
        {loading ? <p className="mt-6 text-sm text-muted">{t.common.loading}</p> : null}
        {!loading && messages.length === 0 && ready && !forbidden ? <p className="mt-6 text-sm text-muted">{t.contact.empty}</p> : null}
        <ul className="mt-6 space-y-3">
          {messages.map((item) => (
            <li key={item.id} className="rounded-lg border border-border bg-surface p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-muted">{new Date(item.createdAt).toLocaleString(locale === "ar" ? "ar" : "en")}</p>
                  <h2 className="mt-1 text-lg font-semibold">{item.subject}</h2>
                  <p className="mt-1 text-sm">{item.name} · <span dir="ltr">{item.contact}</span></p>
                  <p className="mt-2 max-w-3xl whitespace-pre-wrap text-sm leading-7 text-muted">{item.message}</p>
                  <p className="mt-2 text-xs text-primary">{item.handled ? t.contact.handled : t.contact.new}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => void send({ action: "handled", id: item.id, handled: !item.handled })}>
                    {item.handled ? t.contact.reopen : t.contact.mark}
                  </Button>
                  {confirmId === item.id ? (
                    <Button type="button" size="sm" variant="secondary" disabled={pending} onClick={() => void send({ action: "delete", id: item.id })}>{t.contact.confirmRemove}</Button>
                  ) : (
                    <Button type="button" size="sm" variant="outline" onClick={() => setConfirmId(item.id)}>{t.contact.remove}</Button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
        {forbidden && isDemoMode() ? <p className="mt-6 text-sm text-muted">{t.contact.adminLead}</p> : null}
      </div>
    </div>
  );
}

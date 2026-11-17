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
import { cleanFaq, type FaqItem } from "@/lib/faq";
import type { Locale } from "@/lib/i18n";

type ApiError = { error?: { ar?: string; en?: string } };

function errorText(data: ApiError, locale: Locale, fallback: string) {
  return (locale === "ar" ? data.error?.ar : data.error?.en) || fallback;
}

function move(items: FaqItem[], id: string, direction: -1 | 1) {
  const index = items.findIndex((item) => item.id === id);
  const next = index + direction;
  if (index < 0 || next < 0 || next >= items.length) return null;
  const copy = items.slice();
  const [item] = copy.splice(index, 1);
  copy.splice(next, 0, item);
  return copy.map((entry) => entry.id);
}

export function FaqAdmin() {
  const { t, locale } = useI18n();
  const { me } = useMe();
  const [items, setItems] = useState<FaqItem[]>([]);
  const [configured, setConfigured] = useState(true);
  const [ready, setReady] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState<FaqItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [published, setPublished] = useState(true);
  const [pending, setPending] = useState(false);
  const [confirmId, setConfirmId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const response = await fetch("/api/admin/faq");
    const data = (await response.json()) as { configured?: boolean; ready?: boolean; items?: FaqItem[] } & ApiError;
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
    setItems(data.items ?? []);
    setLoading(false);
  }, [locale, t]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(id);
  }, [load]);

  function openCreate() {
    setEditing(null);
    setQuestion("");
    setAnswer("");
    setPublished(true);
    setShowForm(true);
    setError("");
  }

  function openEdit(item: FaqItem) {
    setEditing(item);
    setQuestion(item.question);
    setAnswer(item.answer);
    setPublished(item.published);
    setShowForm(true);
    setError("");
  }

  async function send(body: unknown, success: string) {
    setPending(true);
    setError("");
    setNotice("");
    const response = await fetch("/api/admin/faq", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await response.json().catch(() => ({}))) as ApiError;
    setPending(false);
    if (!response.ok) {
      setError(errorText(data, locale, t.common.error));
      return false;
    }
    setNotice(success);
    setConfirmId("");
    await load();
    return true;
  }

  async function onSave(event: React.FormEvent) {
    event.preventDefault();
    if (!cleanFaq({ question, answer, published })) {
      setError(t.faq.invalid);
      return;
    }
    const ok = await send(
      editing
        ? { action: "update", id: editing.id, question, answer, published }
        : { action: "create", question, answer, published },
      t.faq.saved,
    );
    if (ok) setShowForm(false);
  }

  async function reorder(id: string, direction: -1 | 1) {
    const ids = move(items, id, direction);
    if (!ids) return;
    await send({ action: "reorder", ids }, t.faq.saved);
  }

  const showEditor = !forbidden || isDemoMode();

  return (
    <div className="min-h-dvh">
      <AppHeader me={me} />
      <div className="mx-auto max-w-5xl px-4 py-10">
        <AdminNav current="faq" />
        <h1 className="text-3xl font-semibold">{t.faq.adminTitle}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-muted">{t.faq.adminLead}</p>
        {error ? <p className="mt-4 text-sm text-secondary" role="alert">{error}</p> : null}
        {notice ? <p className="mt-4 text-sm text-primary" role="status">{notice}</p> : null}
        {!configured ? <p className="mt-4 rounded-lg border border-border bg-surface p-4 text-sm">{t.admin.unconfigured}</p> : null}
        {configured && !ready && !forbidden ? (
          <p className="mt-4 rounded-lg border border-border bg-surface p-4 text-sm leading-7">{t.faq.schema}</p>
        ) : null}
        {showEditor ? (
          <div className="mt-6">
            {showForm ? (
              <form onSubmit={(event) => void onSave(event)} className="max-w-xl space-y-3 rounded-lg border border-border bg-surface p-4">
                <h2 className="text-lg font-semibold">{editing ? t.faq.edit : t.faq.add}</h2>
                <label className="block text-sm">
                  <span className="mb-1 block text-muted">{t.faq.question}</span>
                  <Input value={question} onChange={(event) => setQuestion(event.target.value)} required maxLength={200} />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block text-muted">{t.faq.answer}</span>
                  <Textarea value={answer} onChange={(event) => setAnswer(event.target.value)} required maxLength={2000} />
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={published} onChange={(event) => setPublished(event.target.checked)} className="size-4 accent-[#00D4B4]" />
                  {t.faq.published}
                </label>
                <div className="flex flex-wrap gap-2">
                  <Button type="submit" disabled={pending}>{pending ? t.common.loading : t.faq.save}</Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>{t.common.cancel}</Button>
                </div>
              </form>
            ) : (
              <Button type="button" onClick={openCreate}>{t.faq.add}</Button>
            )}
          </div>
        ) : null}
        {loading ? <p className="mt-6 text-sm text-muted">{t.common.loading}</p> : null}
        {!loading && items.length === 0 && ready ? <p className="mt-6 text-sm text-muted">{t.faq.adminEmpty}</p> : null}
        <ul className="mt-6 space-y-3">
          {items.map((item, index) => (
            <li key={item.id} className="rounded-lg border border-border bg-surface p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">{item.question}</h2>
                  <p className="mt-1 text-xs text-muted">{item.published ? t.faq.published : t.faq.draft}</p>
                  <p className="mt-2 max-w-3xl text-sm leading-7 text-muted">{item.answer}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant="outline" disabled={index === 0 || pending} onClick={() => void reorder(item.id, -1)}>{t.faq.up}</Button>
                  <Button type="button" size="sm" variant="outline" disabled={index === items.length - 1 || pending} onClick={() => void reorder(item.id, 1)}>{t.faq.down}</Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => openEdit(item)}>{t.faq.edit}</Button>
                  {confirmId === item.id ? (
                    <Button type="button" size="sm" variant="secondary" onClick={() => void send({ action: "delete", id: item.id }, t.faq.removed)}>{t.faq.confirmRemove}</Button>
                  ) : (
                    <Button type="button" size="sm" variant="outline" onClick={() => setConfirmId(item.id)}>{t.faq.remove}</Button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

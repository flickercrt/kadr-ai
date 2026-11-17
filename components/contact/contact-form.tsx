"use client";

import { useState } from "react";
import { offer } from "@/config/site";
import { useI18n } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { parseContact } from "@/lib/contact";
import type { Locale } from "@/lib/i18n";

type ApiError = { error?: { ar?: string; en?: string } };

function errorText(data: ApiError, locale: Locale, fallback: string) {
  return (locale === "ar" ? data.error?.ar : data.error?.en) || fallback;
}

export function ContactForm() {
  const { t, locale } = useI18n();
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (!parseContact({ name, contact, subject, message })) {
      setError(t.contact.invalid);
      return;
    }
    setPending(true);
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, contact, subject, message, website }),
    });
    const data = (await response.json().catch(() => ({}))) as ApiError;
    setPending(false);
    if (!response.ok) {
      setError(errorText(data, locale, t.common.error));
      return;
    }
    setDone(true);
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-[1.1fr_0.9fr]">
      <div>
        <p className="text-sm font-semibold text-secondary">{t.contact.kicker}</p>
        <h1 className="mt-2 text-4xl font-semibold">{t.contact.title}</h1>
        <p className="mt-3 max-w-xl leading-8 text-muted">{t.contact.lead}</p>
        {done ? (
          <p className="mt-8 rounded-lg border border-primary/40 bg-primary/10 p-4 text-sm" role="status">{t.contact.sent}</p>
        ) : (
          <form onSubmit={(event) => void onSubmit(event)} className="mt-8 max-w-xl space-y-3">
            <label className="block text-sm">
              <span className="mb-1 block text-muted">{t.contact.name}</span>
              <Input value={name} onChange={(event) => setName(event.target.value)} required maxLength={80} autoComplete="name" />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-muted">{t.contact.reach}</span>
              <Input value={contact} onChange={(event) => setContact(event.target.value)} required maxLength={120} autoComplete="email" dir="ltr" className="text-left" />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-muted">{t.contact.subject}</span>
              <Input value={subject} onChange={(event) => setSubject(event.target.value)} required maxLength={120} />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-muted">{t.contact.message}</span>
              <Textarea value={message} onChange={(event) => setMessage(event.target.value)} required maxLength={2000} />
            </label>
            <label className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden>
              Website
              <input tabIndex={-1} autoComplete="off" value={website} onChange={(event) => setWebsite(event.target.value)} />
            </label>
            {error ? <p className="text-sm text-secondary" role="alert">{error}</p> : null}
            <Button type="submit" disabled={pending}>{pending ? t.common.loading : t.contact.send}</Button>
          </form>
        )}
      </div>
      <aside className="h-fit rounded-lg border border-border bg-surface p-6">
        <h2 className="text-xl font-semibold">{t.contact.whatsappTitle}</h2>
        <p className="mt-2 text-sm leading-7 text-muted">{t.contact.whatsappLead}</p>
        <a
          href={`https://wa.me/${offer.whatsapp}`}
          className="mt-5 inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground"
          target="_blank"
          rel="noreferrer"
        >
          {t.common.whatsapp}
          <span dir="ltr">{offer.whatsappDisplay}</span>
        </a>
      </aside>
    </div>
  );
}

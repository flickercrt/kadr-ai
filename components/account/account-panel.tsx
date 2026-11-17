"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { offer, whatsappHref } from "@/config/site";
import { AppHeader } from "@/components/app-header";
import { useI18n } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import { useMe } from "@/components/use-me";

export function AccountPanel() {
  const { t, locale } = useI18n();
  const { me, failed } = useMe();
  const [banner, setBanner] = useState<"success" | "cancel" | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState<"checkout" | "portal" | null>(null);

  useEffect(() => {
    const id = window.setTimeout(() => {
      const value = new URLSearchParams(window.location.search).get("checkout");
      if (value === "success" || value === "cancel") setBanner(value);
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  async function checkout() {
    setPending("checkout");
    setError("");
    const response = await fetch("/api/billing/checkout", { method: "POST" });
    const data = (await response.json()) as { url?: string; error?: { ar?: string; en?: string } };
    setPending(null);
    if (data.url) {
      window.location.href = data.url;
      return;
    }
    setError((locale === "ar" ? data.error?.ar : data.error?.en) || t.billing.missing);
  }

  async function portal() {
    setPending("portal");
    setError("");
    const response = await fetch("/api/billing/portal", { method: "POST" });
    const data = (await response.json()) as { url?: string; error?: { ar?: string; en?: string } };
    setPending(null);
    if (data.url) {
      window.location.href = data.url;
      return;
    }
    setError((locale === "ar" ? data.error?.ar : data.error?.en) || t.billing.noCustomer);
  }

  const statusLabel = !me?.subscription
    ? t.account.none
    : me.subscription.status === "active"
      ? t.account.active
      : me.subscription.status === "past_due"
        ? t.account.pastDue
        : me.subscription.status === "canceled"
          ? t.account.canceled
          : t.account.inactive;

  return (
    <div className="min-h-dvh">
      <AppHeader me={me} />
      <div className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="text-3xl font-semibold">{t.account.title}</h1>
        {failed ? <p className="mt-4 text-sm text-secondary">{t.common.error}</p> : null}
        {banner === "success" ? <p className="mt-4 rounded-lg border border-primary/40 bg-primary/10 p-3 text-sm">{t.account.success}</p> : null}
        {banner === "cancel" ? <p className="mt-4 rounded-lg border border-secondary/40 bg-secondary/10 p-3 text-sm">{t.account.cancel}</p> : null}
        {!me ? <p className="mt-6 text-muted">{t.common.loading}</p> : null}
        {me && !me.user ? (
          <p className="mt-6 text-sm text-muted">
            {me.mode === "demo" ? t.account.demo : t.auth.loginLead}{" "}
            <Link href="/login?next=/account" className="text-primary">{t.nav.login}</Link>
          </p>
        ) : null}
        {me?.user ? (
          <div className="mt-6 rounded-lg border border-border bg-surface p-5">
            <p className="text-sm text-muted">
              <span dir="ltr">{me.user.username || me.user.email}</span>
            </p>
            <h2 className="mt-4 text-sm text-muted">{t.account.status}</h2>
            <p className="text-2xl font-semibold">{me.subscription.demoBypass ? t.account.demo : statusLabel}</p>
            <p className="mt-2 text-sm text-muted">
              {t.account.provider}: {me.subscription.provider || "—"}
            </p>
            <p className="mt-1 text-sm text-muted">
              {t.account.renews}:{" "}
              {me.subscription.currentPeriodEnd
                ? new Date(me.subscription.currentPeriodEnd).toLocaleDateString(locale === "ar" ? "ar" : "en")
                : t.account.openEnded}
            </p>
            <p className="mt-4 text-3xl font-semibold text-primary">
              <span className="me-2 text-base text-muted line-through">
                {offer.currencySymbol}
                {offer.compareAt}
              </span>
              {offer.currencySymbol}
              {offer.price}
              <span className="text-sm text-muted">{t.common.perMonth}</span>
            </p>
            {error ? <p className="mt-3 text-sm text-secondary">{error}</p> : null}
            <div className="mt-5 flex flex-wrap gap-2">
              <Button type="button" onClick={() => void checkout()} disabled={pending !== null}>
                {pending === "checkout" ? t.common.loading : t.account.checkout}
              </Button>
              <Button type="button" variant="outline" onClick={() => void portal()} disabled={pending !== null}>
                {pending === "portal" ? t.common.loading : t.account.portal}
              </Button>
            </div>
            <p className="mt-4 text-sm leading-7 text-muted">{t.account.manual}</p>
            <a href={whatsappHref(locale)} className="mt-2 inline-block text-sm text-primary" target="_blank" rel="noreferrer">
              {t.common.whatsapp}
              <span className="ms-2" dir="ltr">
                {offer.whatsappDisplay}
              </span>
            </a>
            {me.isAdmin ? (
              <p className="mt-4">
                <Link href="/admin" className="text-sm text-primary">{t.account.admin}</Link>
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

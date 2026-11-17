"use client";

import { useEffect, useState } from "react";
import { AdminNav } from "@/components/admin/admin-nav";
import { AppHeader } from "@/components/app-header";
import { PriceOffer } from "@/components/price-offer";
import { useI18n } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMe } from "@/components/use-me";
import { isDemoMode } from "@/lib/env";
import { pricingFromSettings, type DiscountKind, type PricingSettings, type PricingView } from "@/lib/pricing";

function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromLocalInput(value: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function PricingAdmin() {
  const { t, locale } = useI18n();
  const { me } = useMe();
  const [ready, setReady] = useState(true);
  const [configured, setConfigured] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [monthlyPrice, setMonthlyPrice] = useState("99");
  const [kind, setKind] = useState<DiscountKind>("percent");
  const [value, setValue] = useState("60");
  const [starts, setStarts] = useState("");
  const [ends, setEnds] = useState("");
  const [preview, setPreview] = useState<PricingView | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void (async () => {
        const response = await fetch("/api/admin/pricing");
        const data = (await response.json()) as {
          configured?: boolean;
          ready?: boolean;
          settings?: PricingSettings;
          preview?: PricingView;
          error?: { ar?: string; en?: string };
        };
        if (response.status === 403 && !isDemoMode()) {
          setForbidden(true);
          setError(locale === "ar" ? data.error?.ar || t.admin.forbidden : data.error?.en || t.admin.forbidden);
          return;
        }
        if (!response.ok && response.status !== 403) {
          setError(locale === "ar" ? data.error?.ar || t.common.error : data.error?.en || t.common.error);
          return;
        }
        setConfigured(data.configured !== false);
        setReady(data.ready !== false);
        if (data.settings) {
          setMonthlyPrice(String(data.settings.monthlyPrice));
          setKind(data.settings.discountKind);
          setValue(String(data.settings.discountValue));
          setStarts(toLocalInput(data.settings.discountStartsAt));
          setEnds(toLocalInput(data.settings.discountEndsAt));
          setPreview(data.preview ?? null);
        }
      })();
    }, 0);
    return () => window.clearTimeout(id);
  }, [locale, t]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const settings: PricingSettings = {
      monthlyPrice: Number(monthlyPrice),
      discountKind: kind,
      discountValue: Number(value),
      discountStartsAt: fromLocalInput(starts),
      discountEndsAt: fromLocalInput(ends),
    };
    if (!Number.isFinite(settings.monthlyPrice) || settings.monthlyPrice <= 0) {
      setError(t.pricing.invalid);
      return;
    }
    setPreview(pricingFromSettings(settings, Date.now()));
    setPending(true);
    setError("");
    setNotice("");
    const response = await fetch("/api/admin/pricing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    const data = (await response.json().catch(() => ({}))) as { preview?: PricingView; error?: { ar?: string; en?: string } };
    setPending(false);
    if (!response.ok) {
      setError((locale === "ar" ? data.error?.ar : data.error?.en) || t.pricing.invalid);
      return;
    }
    if (data.preview) setPreview(data.preview);
    setNotice(t.pricing.saved);
  }

  const showForm = !forbidden || isDemoMode();

  return (
    <div className="min-h-dvh">
      <AppHeader me={me} />
      <div className="mx-auto max-w-3xl px-4 py-10">
        <AdminNav current="pricing" />
        <h1 className="text-3xl font-semibold">{t.pricing.title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-muted">{t.pricing.lead}</p>
        {error ? <p className="mt-4 text-sm text-secondary" role="alert">{error}</p> : null}
        {notice ? <p className="mt-4 text-sm text-primary" role="status">{notice}</p> : null}
        {!configured ? <p className="mt-4 rounded-lg border border-border bg-surface p-4 text-sm">{t.admin.unconfigured}</p> : null}
        {configured && !ready && !forbidden ? (
          <p className="mt-4 rounded-lg border border-border bg-surface p-4 text-sm leading-7">{t.pricing.schema}</p>
        ) : null}
        {showForm ? (
          <form onSubmit={(event) => void onSubmit(event)} className="mt-6 space-y-3 rounded-lg border border-border bg-surface p-4">
            <label className="block text-sm">
              <span className="mb-1 block text-muted">{t.pricing.monthly}</span>
              <Input type="number" min="1" step="0.01" value={monthlyPrice} onChange={(event) => setMonthlyPrice(event.target.value)} required dir="ltr" className="text-left" />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-muted">{t.pricing.kind}</span>
              <select
                value={kind}
                onChange={(event) => setKind(event.target.value as DiscountKind)}
                className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm"
              >
                <option value="none">{t.pricing.none}</option>
                <option value="percent">{t.pricing.percent}</option>
                <option value="fixed">{t.pricing.fixed}</option>
              </select>
            </label>
            {kind !== "none" ? (
              <>
                <label className="block text-sm">
                  <span className="mb-1 block text-muted">{t.pricing.value}</span>
                  <Input type="number" min="0" step="0.01" value={value} onChange={(event) => setValue(event.target.value)} required dir="ltr" className="text-left" />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block text-muted">{t.pricing.starts}</span>
                  <Input type="datetime-local" value={starts} onChange={(event) => setStarts(event.target.value)} required dir="ltr" className="text-left" />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block text-muted">{t.pricing.ends}</span>
                  <Input type="datetime-local" value={ends} onChange={(event) => setEnds(event.target.value)} required dir="ltr" className="text-left" />
                </label>
              </>
            ) : null}
            {preview ? (
              <div>
                <p className="mb-2 text-xs text-muted">{t.pricing.preview}</p>
                <PriceOffer pricing={preview} />
              </div>
            ) : null}
            <Button type="submit" disabled={pending}>{pending ? t.common.loading : t.pricing.save}</Button>
          </form>
        ) : null}
      </div>
    </div>
  );
}

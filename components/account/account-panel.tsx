"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { offer, whatsappHref } from "@/config/site";
import { PriceOffer } from "@/components/price-offer";
import { RenewalBanner } from "@/components/renewal-banner";
import { usePricing } from "@/components/use-pricing";
import { AppHeader } from "@/components/app-header";
import { useI18n } from "@/components/locale-provider";
import { Avatar } from "@/components/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMe } from "@/components/use-me";
import { cleanAvatarUrl, cleanDisplayName } from "@/lib/profile";

export function AccountPanel() {
  const { t, locale } = useI18n();
  const pricing = usePricing();
  const { me, failed, reload } = useMe();
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [profileError, setProfileError] = useState("");
  const [profileNotice, setProfileNotice] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [banner, setBanner] = useState<"success" | "cancel" | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState<"checkout" | "portal" | null>(null);

  useEffect(() => {
    const id = window.setTimeout(() => {
      const value = new URLSearchParams(window.location.search).get("checkout");
      if (value === "success" || value === "cancel") setBanner(value);
      if (me?.user) {
        setName(me.user.name);
        setAvatar(me.user.avatar ?? "");
      }
    }, 0);
    return () => window.clearTimeout(id);
  }, [me?.user]);

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
        <RenewalBanner />
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
            <div className="flex items-center gap-3">
              <Avatar name={name || me.user.name} src={avatar || me.user.avatar} size={56} />
              <p className="text-sm text-muted">
                <span dir="ltr">{me.user.username || me.user.email}</span>
              </p>
            </div>
            <form
              className="mt-4 space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                void (async () => {
                  if (cleanDisplayName(name) === null || cleanAvatarUrl(avatar) === null) {
                    setProfileError(t.account.profileInvalid);
                    return;
                  }
                  setSavingProfile(true);
                  setProfileError("");
                  setProfileNotice("");
                  const response = await fetch("/api/me/profile", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name, avatarUrl: avatar }),
                  });
                  const data = (await response.json().catch(() => ({}))) as { error?: { ar?: string; en?: string; code?: string } };
                  setSavingProfile(false);
                  if (!response.ok) {
                    setProfileError((locale === "ar" ? data.error?.ar : data.error?.en) || (data.error?.code === "config" ? t.account.profileSchema : t.account.profileInvalid));
                    return;
                  }
                  setProfileNotice(t.account.profileSaved);
                  await reload();
                })();
              }}
            >
              <label className="block text-sm">
                <span className="mb-1 block text-muted">{t.account.profileName}</span>
                <Input value={name} onChange={(event) => setName(event.target.value)} maxLength={80} />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-muted">{t.account.profilePhoto}</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="block text-xs text-muted"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    void (async () => {
                      setProfileError("");
                      const body = new FormData();
                      body.set("file", file);
                      const response = await fetch("/api/me/avatar", { method: "POST", body });
                      const data = (await response.json().catch(() => ({}))) as { avatarUrl?: string; error?: { ar?: string; en?: string; code?: string } };
                      if (!response.ok || !data.avatarUrl) {
                        setProfileError(data.error?.code === "config" ? t.account.profileSchema : (locale === "ar" ? data.error?.ar : data.error?.en) || t.account.profileInvalid);
                        return;
                      }
                      setAvatar(data.avatarUrl);
                      setProfileNotice(t.account.profileSaved);
                      await reload();
                    })();
                  }}
                />
                <span className="mt-1 block text-xs text-muted">{t.account.profilePhotoHint}</span>
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-muted">{t.account.profileUrl}</span>
                <Input value={avatar.startsWith("data:") ? "" : avatar} onChange={(event) => setAvatar(event.target.value)} dir="ltr" className="text-left" placeholder="https://" />
              </label>
              {profileError ? <p className="text-sm text-secondary" role="alert">{profileError}</p> : null}
              {profileNotice ? <p className="text-sm text-primary" role="status">{profileNotice}</p> : null}
              <Button type="submit" disabled={savingProfile}>{savingProfile ? t.common.loading : t.account.profileSave}</Button>
            </form>
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
            <div className="mt-4">
              <PriceOffer pricing={pricing} />
            </div>
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

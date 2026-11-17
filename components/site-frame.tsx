"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { joinFeed, landing, offer, whatsappHref } from "@/config/site";
import { Countdown } from "@/components/countdown";
import { usePricing } from "@/components/use-pricing";
import { promoText } from "@/lib/pricing";
import { Logo } from "@/components/logo";
import { useI18n } from "@/components/locale-provider";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SiteFrame({
  children,
  showJoinToast = false,
}: {
  children: React.ReactNode;
  showJoinToast?: boolean;
}) {
  return (
    <>
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-3 focus:rounded-lg focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        تخطٍ إلى المحتوى
      </a>
      <div className="sticky top-0 z-40">
        <PromoBar />
        <SiteHeader />
      </div>
      <main id="content">{children}</main>
      <SiteFooter />
      <WhatsAppButton />
      {showJoinToast ? <JoinToast /> : null}
    </>
  );
}

function PromoBar() {
  const { tx, t, locale } = useI18n();
  const pricing = usePricing();
  return (
    <div className="bg-secondary text-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-2 text-sm">
        <p className="font-medium">{promoText(pricing, locale)}</p>
        <div className="flex items-center gap-3">
          {pricing.discountActive && pricing.countdownEndsAt ? (
            <>
              <span className="hidden sm:inline text-white/80">{t.countdown.endsIn}</span>
              <Countdown endsAt={pricing.countdownEndsAt} compact onCoral />
            </>
          ) : null}
          <Link href="/signup?next=/account" className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
            {tx(landing.promo.cta)}
          </Link>
        </div>
      </div>
    </div>
  );
}

function SiteHeader() {
  const { locale, setLocale, t, tx } = useI18n();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const links = [
    { href: "/", label: t.nav.home },
    { href: "/#bots", label: t.nav.bots },
    { href: "/gallery", label: t.nav.projects },
    { href: "/roadmap", label: t.nav.roadmap, badge: t.nav.new },
  ];

  return (
    <header className="border-b border-border/80 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <Link href="/" aria-label={locale === "ar" ? "كادر AI" : "Kadr AI"}>
          <Logo locale={locale} />
        </Link>
        <nav className="hidden items-center gap-5 text-sm text-muted lg:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn("inline-flex items-center gap-2 hover:text-foreground", pathname === link.href && "text-foreground")}
            >
              {link.label}
              {link.badge ? (
                <span className="rounded-full bg-secondary/15 px-2 py-0.5 text-[10px] font-semibold text-secondary">
                  {link.badge}
                </span>
              ) : null}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="h-9 rounded-full border border-border px-3 text-xs font-semibold"
            onClick={() => setLocale(locale === "ar" ? "en" : "ar")}
            aria-label={t.lang.label}
          >
            {t.lang.short}
          </button>
          <Link href="/login" className="hidden text-sm text-muted hover:text-foreground sm:inline">
            {t.nav.login}
          </Link>
          <Link href="/signup" className={cn(buttonVariants({ size: "sm" }), "hidden sm:inline-flex")}>
            {tx(landing.hero.primaryCta)}
          </Link>
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-lg border border-border lg:hidden"
            aria-label={t.nav.menu}
            onClick={() => setOpen((value) => !value)}
          >
            <span className="flex w-4 flex-col gap-1">
              <span className="h-px bg-foreground" />
              <span className="h-px bg-foreground" />
              <span className="h-px bg-foreground" />
            </span>
          </button>
        </div>
      </div>
      {open ? (
        <div className="border-t border-border px-4 py-4 lg:hidden">
          <div className="flex flex-col gap-3 text-base">
            {links.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>
                {link.label}
              </Link>
            ))}
            <Link href="/login" onClick={() => setOpen(false)}>
              {t.nav.login}
            </Link>
            <Link href="/signup" className={buttonVariants()} onClick={() => setOpen(false)}>
              {t.nav.start}
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}

function SiteFooter() {
  const { t, tx, locale } = useI18n();
  const [year, setYear] = useState("2026");
  useEffect(() => {
    const id = window.setTimeout(() => setYear(String(new Date().getFullYear())), 0);
    return () => window.clearTimeout(id);
  }, []);
  return (
    <footer className="border-t border-border">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-3">
        <div>
          <Logo locale={locale} />
          <p className="mt-3 max-w-sm text-sm leading-7 text-muted">{tx(landing.footer.blurb)}</p>
        </div>
        <div>
          <h2 className="text-sm font-semibold">{t.footer.quick}</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li><Link href="/#bots">{t.nav.bots}</Link></li>
            <li><Link href="/gallery">{t.nav.projects}</Link></li>
            <li><Link href="/roadmap">{t.nav.roadmap}</Link></li>
            <li><Link href="/login">{t.nav.login}</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-semibold">{t.footer.contact}</h2>
          <a
            href={whatsappHref(locale)}
            className={cn(buttonVariants(), "mt-3")}
            target="_blank"
            rel="noreferrer"
          >
            {t.footer.whatsapp}
          </a>
          <p className="mt-3 text-sm text-muted" dir="ltr">
            {offer.whatsappDisplay}
          </p>
        </div>
      </div>
      <div className="border-t border-border px-4 py-4 text-center text-xs text-muted">
        © {year} {locale === "ar" ? "كادر AI" : "Kadr AI"}. {t.footer.rights}
      </div>
    </footer>
  );
}

function WhatsAppButton() {
  const pathname = usePathname();
  const { locale, t } = useI18n();
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/account") || pathname.startsWith("/admin")) {
    return null;
  }
  return (
    <a
      href={whatsappHref(locale)}
      target="_blank"
      rel="noreferrer"
      aria-label={t.common.whatsapp}
      className="fixed bottom-5 left-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-[#06210f] shadow-lg transition hover:scale-105"
    >
      <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden>
        <path
          fill="currentColor"
          d="M12.04 2C6.58 2 2.15 6.4 2.15 11.83c0 1.74.46 3.44 1.34 4.94L2 22l5.39-1.4a10 10 0 0 0 4.65 1.18h.01c5.46 0 9.89-4.4 9.89-9.83C21.94 6.4 17.5 2 12.04 2zm5.76 14.15c-.24.68-1.4 1.3-1.94 1.38-.5.08-1.12.11-1.81-.11-.41-.14-.95-.31-1.63-.61-2.87-1.24-4.74-4.13-4.88-4.32-.14-.19-1.16-1.54-1.16-2.94s.73-2.08 1-2.37c.24-.27.64-.39 1.02-.39h.37c.12 0 .28-.04.44.34.17.4.58 1.39.63 1.49.06.1.1.22.02.36-.08.14-.12.22-.24.34-.12.12-.25.27-.36.36-.12.1-.24.22-.1.43.14.21.62 1.02 1.33 1.65.91.81 1.68 1.06 1.92 1.18.24.12.38.1.52-.06.14-.16.6-.7.76-.94.16-.24.32-.2.54-.12.22.08 1.4.66 1.64.78.24.12.4.18.46.28.06.1.06.58-.18 1.26z"
        />
      </svg>
    </a>
  );
}

function JoinToast() {
  const { tx, t } = useI18n();
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const show = window.setTimeout(() => setVisible(true), 900);
    const cycle = window.setInterval(() => {
      setVisible(false);
      window.setTimeout(() => {
        setIndex((value) => (value + 1) % joinFeed.length);
        setVisible(true);
      }, 280);
    }, 5200);
    return () => {
      window.clearTimeout(show);
      window.clearInterval(cycle);
    };
  }, []);

  const item = joinFeed[index];
  return (
    <div
      className={cn(
        "fixed bottom-5 right-5 z-40 w-[min(100%-7rem,18rem)] rounded-lg border border-border bg-surface/95 p-3 shadow-xl transition",
        visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
      )}
      aria-live="polite"
    >
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
          {item.name.slice(0, 1)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{item.name}</p>
          <p className="text-xs text-muted">
            {tx(item.place)} · {t.join.line}
          </p>
        </div>
        <span className="ms-auto text-[11px] text-secondary">{t.join.now}</span>
      </div>
    </div>
  );
}

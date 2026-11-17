"use client";

import Link from "next/link";
import { bots } from "@/config/bots";
import { AppHeader } from "@/components/app-header";
import { useI18n } from "@/components/locale-provider";
import { useMe } from "@/components/use-me";
import { cn } from "@/lib/utils";

export function DashboardHome() {
  const { t, tx } = useI18n();
  const { me, failed } = useMe();

  return (
    <div className="min-h-dvh">
      <AppHeader me={me} />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-3xl font-semibold">{t.dash.title}</h1>
        <p className="mt-2 max-w-2xl text-muted">{t.dash.lead}</p>
        {failed ? <p className="mt-4 text-sm text-secondary">{t.common.error}</p> : null}
        {me?.mode === "demo" && !me.user ? (
          <p className="mt-4 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm">
            <span className="font-semibold">{t.dash.demo}. </span>
            {t.dash.demoBody}
          </p>
        ) : null}
        {me ? (
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <span className={cn("rounded-full px-3 py-1", me.subscription.active ? "bg-primary/15 text-primary" : "bg-secondary/15 text-secondary")}>
              {me.subscription.active ? t.dash.active : t.dash.inactive}
            </span>
            <span className="rounded-full border border-border px-3 py-1 text-muted">
              {t.dash.quota}: {me.usage.used}/{me.usage.limit}
            </span>
            {!me.subscription.active ? (
              <Link href="/account" className="rounded-full bg-primary px-3 py-1 font-semibold text-primary-foreground">
                {t.dash.upgrade}
              </Link>
            ) : null}
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted">{t.common.loading}</p>
        )}
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {bots.map((bot) => {
            const inner = (
              <article className="relative h-full overflow-hidden rounded-lg border border-border bg-surface p-5">
                <span className="pointer-events-none absolute -top-3 end-2 text-7xl font-semibold text-white/[0.05]">{bot.numeral}</span>
                <p className="font-mono text-xs text-primary">{bot.numeral}</p>
                <h2 className="mt-3 text-xl font-semibold">{tx(bot.name)}</h2>
                <p className="mt-2 text-sm leading-7 text-muted">{tx(bot.summary)}</p>
                <p className="mt-4 text-sm font-semibold text-primary">{bot.enabled ? t.dash.open : t.dash.soon}</p>
              </article>
            );
            return (
              <Link key={bot.slug} href={`/dashboard/${bot.slug}`} className="transition hover:scale-[1.015]">
                {inner}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

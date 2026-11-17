"use client";

import Link from "next/link";
import { bots } from "@/config/bots";
import { landing, offer, testimonials } from "@/config/site";
import { works } from "@/data/works";
import { Countdown } from "@/components/countdown";
import { FrameArt } from "@/components/frame-art";
import { Mark } from "@/components/logo";
import { useI18n } from "@/components/locale-provider";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function HomePage() {
  const { t, tx } = useI18n();
  return (
    <>
      <section className="mx-auto grid max-w-6xl min-w-0 items-center gap-12 px-4 py-14 md:grid-cols-2 md:py-20">
        <div>
          <p className="inline-flex rounded-full border border-secondary/40 bg-secondary/10 px-3 py-1 text-xs font-semibold text-secondary">
            {tx(landing.hero.kicker)}
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-[1.2] tracking-tight md:text-6xl">
            {tx(landing.hero.title)}
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-muted">{tx(landing.hero.subtitle)}</p>
          <div className="mt-6 flex flex-wrap items-end gap-3">
            <span className="text-lg text-muted line-through">
              {offer.currencySymbol}
              {offer.compareAt}
            </span>
            <span className="text-4xl font-semibold text-primary">
              {offer.currencySymbol}
              {offer.price}
            </span>
            <span className="pb-1 text-sm text-muted">{t.common.perMonth}</span>
            <span className="rounded-full bg-secondary px-2 py-1 text-xs font-semibold text-white">
              -{offer.discountPercent}%
            </span>
          </div>
          <p className="mt-3 text-sm text-muted">{t.countdown.endsIn}</p>
          <div className="mt-2">
            <Countdown />
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/signup?next=/account" className={buttonVariants({ size: "lg" })}>
              {tx(landing.hero.primaryCta)}
            </Link>
            <a href="#watch" className={buttonVariants({ size: "lg", variant: "outline" })}>
              {tx(landing.hero.secondaryCta)}
            </a>
          </div>
          <p className="mt-4 max-w-md text-xs leading-6 text-muted">{tx(landing.hero.priceNote)}</p>
        </div>
        <HeroFrame />
      </section>

      <section id="watch" className="mx-auto max-w-6xl px-4 py-12">
        <p className="text-sm font-semibold text-secondary">{tx(landing.watch.kicker)}</p>
        <h2 className="mt-2 text-3xl font-semibold md:text-4xl">{tx(landing.watch.title)}</h2>
        <p className="mt-3 max-w-2xl text-muted">{tx(landing.watch.lead)}</p>
        <div className="mt-6 overflow-hidden rounded-lg border border-border bg-surface">
          {offer.introYoutubeId ? (
            <div className="aspect-video">
              <iframe
                className="h-full w-full"
                src={`https://www.youtube-nocookie.com/embed/${offer.introYoutubeId}`}
                title={tx(landing.watch.title)}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="relative aspect-video">
              <FrameArt tone="night" numeral="01" kind="video" className="h-full rounded-none" />
              <p className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-sm text-white/80">
                {tx(landing.watch.empty)}
              </p>
            </div>
          )}
        </div>
      </section>

      <Section kicker={tx(landing.problem.kicker)} title={tx(landing.problem.title)} lead={tx(landing.problem.lead)}>
        <div className="grid gap-4 md:grid-cols-3">
          {landing.problem.points.map((point, index) => (
            <article key={point.title.en} className="rounded-lg border border-border bg-surface p-5 transition hover:scale-[1.015]">
              <p className="font-mono text-sm text-secondary">0{index + 1}</p>
              <h3 className="mt-3 text-xl font-semibold">{tx(point.title)}</h3>
              <p className="mt-2 text-sm leading-7 text-muted">{tx(point.body)}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section kicker={tx(landing.audience.kicker)} title={tx(landing.audience.title)}>
        <div className="grid gap-4 sm:grid-cols-2">
          {landing.audience.cards.map((card) => (
            <article key={card.title.en} className="rounded-lg border border-border bg-surface p-5 transition hover:scale-[1.015]">
              <h3 className="text-lg font-semibold">{tx(card.title)}</h3>
              <p className="mt-2 text-sm leading-7 text-muted">{tx(card.body)}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section id="learn" kicker={tx(landing.learn.kicker)} title={tx(landing.learn.title)} lead={tx(landing.learn.lead)}>
        <ol className="grid gap-4">
          {landing.learn.steps.map((step) => (
            <li key={step.numeral} className="relative overflow-hidden rounded-lg border border-border bg-surface p-5 md:p-6">
              <span className="pointer-events-none absolute -top-3 end-4 text-7xl font-semibold text-white/[0.04]">
                {step.numeral}
              </span>
              <p className="font-mono text-sm text-primary">{step.numeral}</p>
              <h3 className="mt-2 text-2xl font-semibold">{tx(step.title)}</h3>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-muted">{tx(step.body)}</p>
            </li>
          ))}
        </ol>
        <article className="glow-ring mt-4 rounded-lg bg-surface p-6">
          <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
            {tx(landing.learn.featured.badge)}
          </span>
          <h3 className="mt-3 text-2xl font-semibold">{tx(landing.learn.featured.title)}</h3>
          <p className="mt-2 max-w-3xl leading-8 text-muted">{tx(landing.learn.featured.body)}</p>
        </article>
      </Section>

      <Section kicker={tx(landing.showcase.kicker)} title={tx(landing.showcase.title)} lead={tx(landing.showcase.lead)}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {works.slice(0, 4).map((work) => (
            <Link key={work.id} href="/gallery" className="group rounded-lg border border-border bg-surface p-3 transition hover:scale-[1.015]">
              <FrameArt tone={work.tone} numeral={work.id.slice(-2)} kind={work.kind} />
              <div className="mt-3 flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold">{tx(work.title)}</h3>
                <span className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted">{t.common.sample}</span>
              </div>
            </Link>
          ))}
        </div>
        <Link href="/gallery" className={cn(buttonVariants({ variant: "outline" }), "mt-6")}>
          {tx(landing.showcase.cta)}
        </Link>
      </Section>

      <Section id="bots" kicker={tx(landing.botsSection.kicker)} title={tx(landing.botsSection.title)} lead={tx(landing.botsSection.lead)}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {bots.map((bot) => {
            const card = (
              <article
                className={cn(
                  "relative h-full overflow-hidden rounded-lg border border-border bg-surface p-5 transition hover:scale-[1.015]",
                  !bot.enabled && "opacity-80",
                )}
              >
                <span className="pointer-events-none absolute -top-4 end-2 text-8xl font-semibold text-white/[0.05]">
                  {bot.numeral}
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-primary">{bot.numeral}</span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                      bot.enabled ? "bg-primary/15 text-primary" : "bg-secondary/15 text-secondary",
                    )}
                  >
                    {bot.enabled ? t.dash.live : t.dash.soon}
                  </span>
                  {bot.badge ? (
                    <span className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted">{tx(bot.badge)}</span>
                  ) : null}
                </div>
                <h3 className="mt-4 text-xl font-semibold">{tx(bot.name)}</h3>
                <p className="mt-2 text-sm leading-7 text-muted">{tx(bot.summary)}</p>
              </article>
            );
            return bot.enabled ? (
              <Link key={bot.slug} href={`/dashboard/${bot.slug}`} className="block">
                {card}
              </Link>
            ) : (
              <div key={bot.slug}>{card}</div>
            );
          })}
        </div>
      </Section>

      <Section id="pricing" kicker={tx(landing.pricing.kicker)} title={tx(landing.pricing.title)} lead={tx(landing.pricing.lead)}>
        <div className="grid gap-4 md:grid-cols-2">
          {landing.pricing.plans.map((plan) => (
            <article
              key={plan.id}
              className={cn(
                "flex flex-col rounded-lg border border-border bg-surface p-6",
                plan.highlighted && "glow-ring order-first md:order-none",
              )}
            >
              {"badge" in plan && plan.badge ? (
                <span className="w-fit rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                  {tx(plan.badge)}
                </span>
              ) : null}
              <h3 className="mt-3 text-2xl font-semibold">{tx(plan.title)}</h3>
              {plan.highlighted ? (
                <div className="mt-4 flex items-end gap-2">
                  <span className="text-muted line-through">
                    {offer.currencySymbol}
                    {offer.compareAt}
                  </span>
                  <span className="text-4xl font-semibold text-primary">
                    {offer.currencySymbol}
                    {offer.price}
                  </span>
                  <span className="pb-1 text-sm text-muted">{t.common.perMonth}</span>
                </div>
              ) : (
                <p className="mt-4 text-sm text-muted">{tx(plan.priceNote)}</p>
              )}
              {plan.highlighted ? <p className="mt-1 text-xs text-muted">{tx(plan.priceNote)}</p> : null}
              <ul className="mt-5 flex-1 space-y-2 text-sm">
                {plan.features.map((feature) => (
                  <li key={feature.en} className="flex gap-2">
                    <span className="text-primary">✓</span>
                    <span>{tx(feature)}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={plan.href}
                className={cn(buttonVariants({ variant: plan.highlighted ? "primary" : "outline" }), "mt-6")}
              >
                {tx(plan.cta)}
              </Link>
            </article>
          ))}
        </div>
      </Section>

      <Section kicker={tx(landing.compare.kicker)} title={tx(landing.compare.title)} lead={tx(landing.compare.lead)}>
        <div className="overflow-hidden rounded-lg border border-border">
          <div className="hidden grid-cols-[1.1fr_1fr_1fr] bg-surface text-sm font-semibold md:grid">
            <div className="p-4" />
            <div className="p-4 text-muted">{tx(landing.compare.course)}</div>
            <div className="bg-primary/10 p-4 text-primary">{tx(landing.compare.community)}</div>
          </div>
          {landing.compare.rows.map((row) => (
            <div key={row.label.en} className="grid gap-3 border-t border-border p-4 md:grid-cols-[1.1fr_1fr_1fr] md:p-0">
              <div className="font-medium md:p-4">{tx(row.label)}</div>
              <div className="text-sm text-muted md:p-4">
                <span className="mb-1 block text-xs md:hidden">{tx(landing.compare.course)}</span>
                <span className="text-secondary">{row.courseOk ? "✓" : "✗"}</span> {tx(row.course)}
              </div>
              <div className="text-sm md:bg-primary/5 md:p-4">
                <span className="mb-1 block text-xs text-primary md:hidden">{tx(landing.compare.community)}</span>
                <span className="text-primary">{row.membershipOk ? "✓" : "✗"}</span> {tx(row.membership)}
              </div>
            </div>
          ))}
        </div>
        <Link href="/signup?next=/account" className={cn(buttonVariants({ size: "lg" }), "mt-6")}>
          {tx(landing.compare.cta)}
        </Link>
      </Section>

      <Section kicker={tx(landing.stories.kicker)} title={tx(landing.stories.title)} lead={tx(landing.stories.note)}>
        <div className="grid gap-4 md:grid-cols-3">
          {testimonials.map((item) => (
            <figure key={item.name} className="rounded-lg border border-border bg-surface p-5">
              <blockquote className="text-sm leading-7">“{tx(item.quote)}”</blockquote>
              <figcaption className="mt-4 flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-primary/15 font-semibold text-primary">
                  {item.initial}
                </span>
                <span>
                  <span className="block text-sm font-semibold">{item.name}</span>
                  <span className="block text-xs text-muted">{tx(item.role)}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </Section>

      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="rounded-lg border border-border bg-surface px-6 py-10 text-center md:px-12">
          <Mark className="mx-auto" />
          <h2 className="mt-4 text-3xl font-semibold md:text-4xl">{tx(landing.finalCta.title)}</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted">{tx(landing.finalCta.subtitle)}</p>
          <Link href="/signup" className={cn(buttonVariants({ size: "lg" }), "mt-6")}>
            {tx(landing.finalCta.cta)}
          </Link>
        </div>
      </section>
    </>
  );
}

function Section({
  id,
  kicker,
  title,
  lead,
  children,
}: {
  id?: string;
  kicker: string;
  title: string;
  lead?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mx-auto max-w-6xl px-4 py-14">
      <p className="text-sm font-semibold text-secondary">{kicker}</p>
      <h2 className="mt-2 max-w-3xl text-3xl font-semibold tracking-tight md:text-4xl">{title}</h2>
      {lead ? <p className="mt-3 max-w-3xl leading-8 text-muted">{lead}</p> : null}
      <div className="mt-8">{children}</div>
    </section>
  );
}

function HeroFrame() {
  return (
    <div className="relative min-w-0">
      <div className="absolute -inset-6 -z-10 rounded-full bg-primary/10 blur-3xl" />
      <div className="min-w-0 overflow-hidden rounded-lg border border-border bg-surface p-3 shadow-2xl">
        <div className="mb-3 flex items-center justify-between px-1 text-[11px] tracking-[0.18em] text-muted">
          <span>KADR / SCENE 04</span>
          <span className="text-primary">35MM</span>
        </div>
        <FrameArt tone="teal" numeral="04" kind="image" />
        <pre
          dir="ltr"
          className="mt-3 overflow-x-auto rounded-lg bg-background p-4 text-left text-xs leading-6 text-foreground/90"
        >
{`Character sheet, same face in front / 3/4 / profile.
Hero frame: 35mm, eye-level, rain on stone.
Palette locked: ink black, teal practical, coral rim.
No text. No extra people.`}
        </pre>
      </div>
    </div>
  );
}

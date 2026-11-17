"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FaqAccordion } from "@/components/faq/faq-accordion";
import { useI18n } from "@/components/locale-provider";
import { buttonVariants } from "@/components/ui/button";
import { seedFaqs, type FaqItem } from "@/lib/faq";
import { cn } from "@/lib/utils";

export function HomeFaq() {
  const { t, locale } = useI18n();
  const [items, setItems] = useState<FaqItem[]>(() => seedFaqs(locale).slice(0, 3));

  useEffect(() => {
    let active = true;
    const id = window.setTimeout(() => {
      void fetch("/api/faq")
        .then((response) => (response.ok ? response.json() : null))
        .then((data: { source?: string; items?: FaqItem[] } | null) => {
          if (!active || !data) return;
          const next = data.source === "db" ? (data.items ?? []).slice(0, 3) : seedFaqs(locale).slice(0, 3);
          setItems(next);
        })
        .catch(() => undefined);
    }, 0);
    return () => {
      active = false;
      window.clearTimeout(id);
    };
  }, [locale]);

  if (items.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 py-14">
      <p className="text-sm font-semibold text-secondary">{t.faq.kicker}</p>
      <h2 className="mt-2 text-3xl font-semibold md:text-4xl">{t.faq.title}</h2>
      <p className="mt-3 max-w-2xl text-muted">{t.faq.previewLead}</p>
      <div className="mt-8 max-w-3xl">
        <FaqAccordion items={items} />
      </div>
      <Link href="/faq" className={cn(buttonVariants({ variant: "outline" }), "mt-6")}>
        {t.faq.all}
      </Link>
    </section>
  );
}

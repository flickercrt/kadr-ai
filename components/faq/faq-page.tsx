"use client";

import { useEffect, useState } from "react";
import { whatsappHref } from "@/config/site";
import { FaqAccordion } from "@/components/faq/faq-accordion";
import { useI18n } from "@/components/locale-provider";
import { buttonVariants } from "@/components/ui/button";
import { seedFaqs, type FaqItem } from "@/lib/faq";
import { cn } from "@/lib/utils";

export function FaqPage() {
  const { t, locale } = useI18n();
  const [items, setItems] = useState<FaqItem[]>(() => seedFaqs(locale));

  useEffect(() => {
    let active = true;
    const id = window.setTimeout(() => {
      void fetch("/api/faq")
        .then((response) => (response.ok ? response.json() : { source: "seed", items: [] }))
        .then((data: { source?: string; items?: FaqItem[] }) => {
          if (!active) return;
          if (data.source === "db") setItems(data.items ?? []);
          else setItems(seedFaqs(locale));
        })
        .catch(() => {
          if (active) setItems(seedFaqs(locale));
        });
    }, 0);
    return () => {
      active = false;
      window.clearTimeout(id);
    };
  }, [locale]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <p className="text-sm font-semibold text-secondary">{t.faq.kicker}</p>
      <h1 className="mt-2 text-4xl font-semibold">{t.faq.title}</h1>
      <p className="mt-3 leading-8 text-muted">{t.faq.lead}</p>
      <div className="mt-8">
        {items.length === 0 ? <p className="text-sm text-muted">{t.faq.empty}</p> : <FaqAccordion items={items} />}
      </div>
      <a href={whatsappHref(locale)} className={cn(buttonVariants({ variant: "outline" }), "mt-8")} target="_blank" rel="noreferrer">
        {t.faq.contact}
      </a>
    </div>
  );
}

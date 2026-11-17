"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { GalleryMedia } from "@/components/gallery/gallery-view";
import { buttonVariants } from "@/components/ui/button";
import { landing } from "@/config/site";
import { useI18n } from "@/components/locale-provider";
import type { GalleryCard } from "@/lib/gallery";
import { cn } from "@/lib/utils";

export function HomeGallery() {
  const { t, tx, locale } = useI18n();
  const [items, setItems] = useState<GalleryCard[]>([]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void fetch(`/api/gallery?locale=${locale}`)
        .then(async (response) => {
          if (!response.ok) return;
          const data = (await response.json()) as { items?: GalleryCard[] };
          setItems((data.items ?? []).slice(0, 4));
        })
        .catch(() => undefined);
    }, 0);
    return () => window.clearTimeout(id);
  }, [locale]);

  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <p className="text-sm font-semibold text-secondary">{tx(landing.showcase.kicker)}</p>
      <h2 className="mt-2 text-3xl font-semibold md:text-4xl">{tx(landing.showcase.title)}</h2>
      <p className="mt-3 max-w-2xl text-muted">{tx(landing.showcase.lead)}</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((work) => (
          <Link key={work.id} href="/gallery" className="group rounded-lg border border-border bg-surface p-3 transition hover:scale-[1.015]">
            <GalleryMedia item={work} />
            <div className="mt-3 flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">{work.title}</h3>
              <span className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted">{t.common.sample}</span>
            </div>
          </Link>
        ))}
      </div>
      <Link href="/gallery" className={cn(buttonVariants({ variant: "outline" }), "mt-6")}>
        {tx(landing.showcase.cta)}
      </Link>
    </section>
  );
}

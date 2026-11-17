"use client";

import { useEffect, useMemo, useState } from "react";
import { FrameArt } from "@/components/frame-art";
import { useI18n } from "@/components/locale-provider";
import { Modal } from "@/components/ui/modal";
import { galleryEmbed, type GalleryCard, type GalleryCategory } from "@/lib/gallery";
import { cn } from "@/lib/utils";

export function GalleryView() {
  const { t, locale } = useI18n();
  const [filter, setFilter] = useState("all");
  const [active, setActive] = useState<GalleryCard | null>(null);
  const [categories, setCategories] = useState<GalleryCategory[]>([]);
  const [items, setItems] = useState<GalleryCard[]>([]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void fetch(`/api/gallery?locale=${locale}`)
        .then(async (response) => {
          if (!response.ok) return;
          const data = (await response.json()) as { categories?: GalleryCategory[]; items?: GalleryCard[] };
          setCategories(data.categories ?? []);
          setItems(data.items ?? []);
          setFilter("all");
        })
        .catch(() => undefined);
    }, 0);
    return () => window.clearTimeout(id);
  }, [locale]);

  const visible = useMemo(
    () => items.filter((item) => filter === "all" || item.categoryId === filter),
    [filter, items],
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <p className="text-sm font-semibold text-secondary">{t.common.sample}</p>
      <h1 className="mt-2 text-4xl font-semibold">{t.gallery.title}</h1>
      <p className="mt-3 max-w-2xl leading-8 text-muted">{t.gallery.lead}</p>
      <div className="mt-6 flex flex-wrap gap-2">
        <FilterButton active={filter === "all"} onClick={() => setFilter("all")}>{locale === "ar" ? "الكل" : "All"}</FilterButton>
        {categories.map((category) => (
          <FilterButton key={category.id} active={filter === category.id} onClick={() => setFilter(category.id)}>
            {category.name}
          </FilterButton>
        ))}
      </div>
      {visible.length === 0 ? (
        <p className="mt-10 text-muted">{t.gallery.empty}</p>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((work) => (
            <button
              key={work.id}
              type="button"
              onClick={() => setActive(work)}
              className="rounded-lg border border-border bg-surface p-3 text-start transition hover:scale-[1.015]"
            >
              <GalleryMedia item={work} />
              <div className="mt-3 flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{work.title}</h2>
                  <p className="mt-1 text-xs text-muted">{work.categoryLabel}</p>
                </div>
                <span className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted">{t.common.sample}</span>
              </div>
            </button>
          ))}
        </div>
      )}
      <Modal open={Boolean(active)} onOpenChange={(open) => !open && setActive(null)} title={active?.title ?? ""}>
        {active ? (
          <div>
            <GalleryMedia item={active} play />
            {active.description ? <p className="mt-4 text-sm leading-7 text-muted">{active.description}</p> : null}
            {active.mediaType === "video" && !active.videoUrl ? <p className="mt-3 text-sm text-foreground/90">{t.gallery.noVideo}</p> : null}
            {active.mediaType === "image" && !active.imageUrl ? <p className="mt-3 text-sm text-foreground/90">{t.gallery.imageSlot}</p> : null}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

function FilterButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-sm",
        active ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted",
      )}
    >
      {children}
    </button>
  );
}

export function GalleryMedia({ item, play = false }: { item: GalleryCard; play?: boolean }) {
  const embed = play ? galleryEmbed(item.videoUrl) : null;
  if (play && embed) {
    return (
      <div className="aspect-video overflow-hidden rounded-lg">
        <iframe className="h-full w-full" src={embed} title={item.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
      </div>
    );
  }
  if (play && item.mediaType === "video" && item.videoUrl) {
    return <video className="aspect-video w-full rounded-lg bg-black" src={item.videoUrl} controls />;
  }
  if (item.imageUrl) {
    return <img src={item.imageUrl} alt="" className="aspect-video w-full rounded-lg object-cover" />;
  }
  return <FrameArt tone={item.tone} numeral={item.id.slice(-2)} kind={item.mediaType} />;
}

"use client";

import { useMemo, useState } from "react";
import { workCategories, works, type WorkCategory, type WorkItem } from "@/data/works";
import { FrameArt } from "@/components/frame-art";
import { useI18n } from "@/components/locale-provider";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";

export function GalleryView() {
  const { t, tx } = useI18n();
  const [filter, setFilter] = useState<"all" | WorkCategory>("all");
  const [active, setActive] = useState<WorkItem | null>(null);
  const visible = useMemo(
    () => works.filter((work) => filter === "all" || work.category === filter),
    [filter],
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <p className="text-sm font-semibold text-secondary">{t.common.sample}</p>
      <h1 className="mt-2 text-4xl font-semibold">{t.gallery.title}</h1>
      <p className="mt-3 max-w-2xl leading-8 text-muted">{t.gallery.lead}</p>
      <div className="mt-6 flex flex-wrap gap-2">
        {workCategories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => setFilter(category.id)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm",
              filter === category.id ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted",
            )}
          >
            {tx(category.label)}
          </button>
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
              <FrameArt tone={work.tone} numeral={work.id.slice(-2)} kind={work.kind} />
              <div className="mt-3 flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{tx(work.title)}</h2>
                  <p className="mt-1 text-xs text-muted">
                    {tx(workCategories.find((item) => item.id === work.category)?.label ?? workCategories[0].label)} · {work.year}
                  </p>
                </div>
                <span className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted">{t.common.sample}</span>
              </div>
            </button>
          ))}
        </div>
      )}
      <Modal open={Boolean(active)} onOpenChange={(open) => !open && setActive(null)} title={active ? tx(active.title) : ""}>
        {active ? (
          <div>
            {active.youtubeId ? (
              <div className="aspect-video overflow-hidden rounded-lg">
                <iframe
                  className="h-full w-full"
                  src={`https://www.youtube-nocookie.com/embed/${active.youtubeId}`}
                  title={tx(active.title)}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <FrameArt tone={active.tone} numeral={active.id.slice(-2)} kind={active.kind} />
            )}
            <p className="mt-4 text-sm leading-7 text-muted">{tx(active.blurb)}</p>
            <p className="mt-3 text-sm text-foreground/90">
              {active.kind === "video" && !active.youtubeId ? t.gallery.noVideo : t.gallery.imageSlot}
            </p>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

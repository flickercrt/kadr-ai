"use client";

import { useEffect, useState } from "react";
import { FrameArt } from "@/components/frame-art";
import { landing } from "@/config/site";
import { useI18n } from "@/components/locale-provider";
import { galleryEmbed } from "@/lib/gallery";
import { configWatch, type WatchContent } from "@/lib/watch";

export function WatchSection({ preview }: { preview?: WatchContent | null }) {
  const { tx } = useI18n();
  const [remote, setRemote] = useState<WatchContent | null>(preview ? null : configWatch());

  useEffect(() => {
    if (preview) return;
    const id = window.setTimeout(() => {
      void fetch("/api/watch")
        .then(async (response) => {
          if (!response.ok) return;
          setRemote((await response.json()) as WatchContent);
        })
        .catch(() => undefined);
    }, 0);
    return () => window.clearTimeout(id);
  }, [preview]);

  const content = preview ?? remote ?? configWatch();
  if (!content.enabled) return null;
  const embed = galleryEmbed(content.videoUrl);
  const directVideo = Boolean(content.videoUrl) && !embed;

  return (
    <section id="watch" className="mx-auto max-w-6xl px-4 py-12">
      <p className="text-sm font-semibold text-secondary">{tx(content.kicker)}</p>
      <h2 className="mt-2 text-3xl font-semibold md:text-4xl">{tx(content.title)}</h2>
      <p className="mt-3 max-w-2xl text-muted">{tx(content.lead)}</p>
      <div className="mt-6 overflow-hidden rounded-lg border border-border bg-surface">
        {embed ? (
          <div className="aspect-video">
            <iframe className="h-full w-full" src={embed} title={tx(content.title)} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
          </div>
        ) : directVideo ? (
          <video className="aspect-video w-full bg-black" src={content.videoUrl} controls />
        ) : (
          <div className="relative aspect-video">
            <FrameArt tone="night" numeral="01" kind="video" className="h-full rounded-none" />
            <p className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-sm text-white/80">{tx(landing.watch.empty)}</p>
          </div>
        )}
      </div>
    </section>
  );
}

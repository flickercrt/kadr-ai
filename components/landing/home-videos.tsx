"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/components/locale-provider";
import { YoutubePlayer } from "@/components/youtube-player";
import type { HomepageVideo } from "@/lib/homepage-videos";

export function HomeVideos() {
  const { t } = useI18n();
  const [videos, setVideos] = useState<HomepageVideo[]>([]);

  useEffect(() => {
    let active = true;
    const id = window.setTimeout(() => {
      void fetch("/api/videos")
        .then((response) => (response.ok ? response.json() : { videos: [] }))
        .then((data: { videos?: HomepageVideo[] }) => {
          if (active) setVideos(data.videos ?? []);
        })
        .catch(() => {
          if (active) setVideos([]);
        });
    }, 0);
    return () => {
      active = false;
      window.clearTimeout(id);
    };
  }, []);

  if (videos.length === 0) return null;

  return (
    <section id="videos" className="mx-auto max-w-6xl px-4 py-12">
      <p className="text-sm font-semibold text-secondary">{t.videos.homeKicker}</p>
      <h2 className="mt-2 text-3xl font-semibold md:text-4xl">{t.videos.homeTitle}</h2>
      <p className="mt-3 max-w-2xl text-muted">{t.videos.homeLead}</p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {videos.map((video) =>
          video.embedUrl ? (
            <article key={video.id} className="overflow-hidden rounded-lg border border-border bg-surface">
              <YoutubePlayer title={video.title} embedUrl={video.embedUrl} />
              <h3 className="p-4 text-lg font-semibold">{video.title}</h3>
            </article>
          ) : null,
        )}
      </div>
    </section>
  );
}

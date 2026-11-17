import { landing, offer } from "@/config/site";

export type WatchContent = {
  enabled: boolean;
  kicker: { ar: string; en: string };
  title: { ar: string; en: string };
  lead: { ar: string; en: string };
  videoUrl: string;
};

export type WatchDraft = {
  enabled: boolean;
  kickerAr: string;
  kickerEn: string;
  titleAr: string;
  titleEn: string;
  leadAr: string;
  leadEn: string;
  videoUrl: string;
};

export function configWatch(): WatchContent {
  return {
    enabled: true,
    kicker: { ...landing.watch.kicker },
    title: { ...landing.watch.title },
    lead: { ...landing.watch.lead },
    videoUrl: offer.introYoutubeId ? `https://www.youtube.com/watch?v=${offer.introYoutubeId}` : "",
  };
}

function pick(value: string | null | undefined, fallback: string) {
  const text = (value ?? "").trim();
  return text || fallback;
}

export function resolveWatch(draft: Partial<WatchDraft> | null | undefined): WatchContent {
  const base = configWatch();
  if (!draft) return base;
  return {
    enabled: draft.enabled !== false,
    kicker: { ar: pick(draft.kickerAr, base.kicker.ar), en: pick(draft.kickerEn, base.kicker.en) },
    title: { ar: pick(draft.titleAr, base.title.ar), en: pick(draft.titleEn, base.title.en) },
    lead: { ar: pick(draft.leadAr, base.lead.ar), en: pick(draft.leadEn, base.lead.en) },
    videoUrl: pick(draft.videoUrl, base.videoUrl),
  };
}

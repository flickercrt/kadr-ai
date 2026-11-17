import { works, workCategories, type WorkItem } from "@/data/works";
import { youtubeEmbedUrl, youtubeIdFromUrl } from "@/lib/youtube";

export type GalleryCard = {
  id: string;
  title: string;
  categoryId: string;
  categoryLabel: string;
  description: string;
  mediaType: "image" | "video";
  imageUrl: string;
  videoUrl: string;
  tone: "teal" | "coral" | "mist" | "night";
};

export type GalleryCategory = { id: string; name: string };

const tones = ["night", "teal", "mist", "coral"] as const;

export function fallbackGallery(locale: "ar" | "en" = "ar"): { categories: GalleryCategory[]; items: GalleryCard[] } {
  const categories = workCategories
    .filter((category) => category.id !== "all")
    .map((category) => ({ id: category.id, name: category.label[locale] }));
  const label = new Map(categories.map((category) => [category.id, category.name]));
  return {
    categories,
    items: works.map((work, index) => fromWork(work, label.get(work.category) ?? work.category, index, locale)),
  };
}

function fromWork(work: WorkItem, categoryLabel: string, index: number, locale: "ar" | "en"): GalleryCard {
  return {
    id: work.id,
    title: work.title[locale],
    categoryId: work.category,
    categoryLabel,
    description: work.blurb[locale],
    mediaType: work.kind,
    imageUrl: "",
    videoUrl: work.youtubeId ? `https://www.youtube.com/watch?v=${work.youtubeId}` : "",
    tone: work.tone ?? tones[index % tones.length],
  };
}

export function toneAt(index: number) {
  return tones[index % tones.length];
}

export function galleryEmbed(videoUrl: string) {
  return youtubeEmbedUrl(videoUrl) || (youtubeIdFromUrl(videoUrl) ? youtubeEmbedUrl(videoUrl) : null);
}

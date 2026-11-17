import type { L10n } from "@/config/site";

/**
 * Gallery source. These are generic placeholders, not a client portfolio.
 * Replace titles and set youtubeId when real media exists.
 * kind "video" without youtubeId still renders a frame and explains the slot.
 */
export type WorkCategory = "ad" | "short" | "poster" | "motion";

export type WorkItem = {
  id: string;
  title: L10n;
  category: WorkCategory;
  year: number;
  blurb: L10n;
  tone: "teal" | "coral" | "mist" | "night";
  kind: "image" | "video";
  /** YouTube id. Empty keeps the abstract placeholder. */
  youtubeId?: string;
};

export const workCategories: { id: "all" | WorkCategory; label: L10n }[] = [
  { id: "all", label: { ar: "الكل", en: "All" } },
  { id: "short", label: { ar: "فيلم قصير", en: "Short film" } },
  { id: "ad", label: { ar: "إعلان", en: "Ad" } },
  { id: "poster", label: { ar: "بوستر", en: "Poster" } },
  { id: "motion", label: { ar: "موشن", en: "Motion" } },
];

export const works: WorkItem[] = [
  {
    id: "frame-01",
    title: { ar: "أرشيف تحت المطر", en: "Archive in the rain" },
    category: "short",
    year: 2026,
    blurb: {
      ar: "عيّنة إطار: لقطة قريبة، ضوء عملي بارد، وورقة على الطاولة.",
      en: "Sample frame: a close shot, cold practical light, a page on the table.",
    },
    tone: "night",
    kind: "video",
  },
  {
    id: "frame-02",
    title: { ar: "سطح عند الفجر", en: "Roof at dawn" },
    category: "short",
    year: 2026,
    blurb: {
      ar: "عيّنة إطار: أفق مدينة، شخصية واحدة، حركة تتبع قصيرة.",
      en: "Sample frame: a city horizon, one figure, a short follow.",
    },
    tone: "teal",
    kind: "video",
  },
  {
    id: "frame-03",
    title: { ar: "زجاج على طاولة", en: "Glass on a table" },
    category: "ad",
    year: 2026,
    blurb: {
      ar: "عيّنة إعلان: منتج في الوسط، منطقة فارغة للشعار، خلفية داكنة.",
      en: "Sample ad: product in the center, an empty zone for the mark, a dark ground.",
    },
    tone: "mist",
    kind: "image",
  },
  {
    id: "frame-04",
    title: { ar: "عنوان في الثلث السفلي", en: "Title in the lower third" },
    category: "poster",
    year: 2026,
    blurb: {
      ar: "عيّنة بوستر: وجه واحد ومساحة عريضة للحروف لا يكتبها النموذج.",
      en: "Sample poster: one face and a wide band for type the model is not asked to render.",
    },
    tone: "coral",
    kind: "image",
  },
  {
    id: "frame-05",
    title: { ar: "ممر الفندق", en: "Hotel corridor" },
    category: "short",
    year: 2025,
    blurb: {
      ar: "عيّنة إطار: منظور بنقطة هروب واحدة، شخصية في آخر الممر.",
      en: "Sample frame: one-point perspective, a figure at the end of the hall.",
    },
    tone: "night",
    kind: "image",
  },
  {
    id: "frame-06",
    title: { ar: "حلقة منتج في ثلاث لقطات", en: "A product in three shots" },
    category: "ad",
    year: 2025,
    blurb: {
      ar: "عيّنة إعلان: افتتاح، استخدام، وخاتمة على لون واحد.",
      en: "Sample ad: open, use, and an end card on one color.",
    },
    tone: "teal",
    kind: "video",
  },
  {
    id: "frame-07",
    title: { ar: "شبكة عناوين", en: "A title grid" },
    category: "motion",
    year: 2025,
    blurb: {
      ar: "عيّنة موشن: حروف تتحرك على شبكة، لا صورة شخصية.",
      en: "Sample motion: type moving on a grid, no portrait.",
    },
    tone: "coral",
    kind: "video",
  },
  {
    id: "frame-08",
    title: { ar: "ملصق شخصية", en: "Character one-sheet" },
    category: "poster",
    year: 2026,
    blurb: {
      ar: "عيّنة بوستر: ورقة شخصية مترجمة إلى تكوين عمودي.",
      en: "Sample poster: a character sheet translated into a vertical composition.",
    },
    tone: "mist",
    kind: "image",
  },
];

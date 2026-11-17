import type { L10n } from "@/config/site";

/**
 * Add a bot here, add its two markdown files under /prompts, and set
 * enabled: true. Pages and the chat API read this list only.
 */
export type BotConfig = {
  slug: string;
  numeral: string;
  enabled: boolean;
  /** Filename inside /prompts. The loader strips HTML comments. */
  promptFile: string;
  knowledgeFile: string;
  name: L10n;
  summary: L10n;
  badge?: L10n;
  starters: L10n[];
};

export const bots: BotConfig[] = [
  {
    slug: "scenes",
    numeral: "01",
    enabled: true,
    promptFile: "scenes.md",
    knowledgeFile: "scenes.knowledge.md",
    name: { ar: "بوت المشاهد", en: "Scene bot" },
    summary: {
      ar: "ورقة شخصية ووصف إطار ثابت يمكن الرجوع إليه في كل لقطة.",
      en: "A character sheet and a locked frame you can return to in every shot.",
    },
    badge: { ar: "ابدأ من هنا", en: "Start here" },
    starters: [
      {
        ar: "أمينة أرشيف في مبنى حجري، ليلة ممطرة. أريد ورقة شخصية ولقطة قريبة لوجهها.",
        en: "An archive keeper in a stone building, a rainy night. I need a character sheet and a close frame of her face.",
      },
      {
        ar: "عداء في سطح مدينة عند الفجر، ألوان باردة مع حافة دافئة. ثبّت الملابس والوجه.",
        en: "A runner on a city roof at dawn, cold colors with a warm edge. Lock the clothes and the face.",
      },
    ],
  },
  {
    slug: "video",
    numeral: "02",
    enabled: true,
    promptFile: "video.md",
    knowledgeFile: "video.knowledge.md",
    name: { ar: "بوت الفيديو", en: "Video bot" },
    summary: {
      ar: "برومبت يحرك المشهد: كاميرا، زاوية، إضاءة، ومشاعر، بمدة يمكن مونتاجها.",
      en: "A prompt that moves the scene: camera, angle, light, and emotion, in a duration you can cut.",
    },
    starters: [
      {
        ar: "حرّك لقطة الأمينة: الكاميرا تزحف ببطء، هي ترفع نظرها عن الورقة، ضوء عملي بارد.",
        en: "Move the archivist shot: the camera creeps, she looks up from the page, cold practical light.",
      },
      {
        ar: "لقطة تتبع قصيرة من خلف العداء على السطح، ريح، وعدسة 35.",
        en: "A short follow from behind the runner on the roof, wind, 35mm lens.",
      },
    ],
  },
  {
    slug: "posters",
    numeral: "03",
    enabled: true,
    promptFile: "posters.md",
    knowledgeFile: "posters.knowledge.md",
    name: { ar: "بوت البوسترات", en: "Poster bot" },
    summary: {
      ar: "تكوين بوستر ومعالجة عنوان، مع فراغ حقيقي للحروف.",
      en: "A poster composition and a title treatment, with real space left for type.",
    },
    starters: [
      {
        ar: "بوستر لفيلم قصير عنوانه «الأرشيف». وجه واحد، مساحة عريضة للعنوان في الأسفل.",
        en: "A poster for a short called “The Archive”. One face, a wide space for the title at the bottom.",
      },
      {
        ar: "بوستر إعلان لمنتج زجاجي، بلا شعار مقروء داخل التوليد، مع منطقة نظيفة للعلامة.",
        en: "An ad poster for a glass product, no readable logo inside the render, with a clean zone for the mark.",
      },
    ],
  },
  {
    slug: "sfx",
    numeral: "04",
    enabled: false,
    promptFile: "sfx.md",
    knowledgeFile: "sfx.knowledge.md",
    name: { ar: "بوت المؤثرات", en: "Sound bot" },
    summary: {
      ar: "برومبت موسيقى ومؤثرات من وصف المشهد. غير مفعّل بعد.",
      en: "Music and sound-effect prompts from a scene description. Not switched on yet.",
    },
    badge: { ar: "قريباً", en: "Soon" },
    starters: [],
  },
  {
    slug: "ads",
    numeral: "05",
    enabled: false,
    promptFile: "ads.md",
    knowledgeFile: "ads.knowledge.md",
    name: { ar: "بوت الإعلانات", en: "Ads bot" },
    summary: {
      ar: "هيكل فيلم ترويجي: خطاف، منتج، وخاتمة. غير مفعّل بعد.",
      en: "A promo-film structure: hook, product, and end card. Not switched on yet.",
    },
    badge: { ar: "جديد", en: "New" },
    starters: [],
  },
];

export function getBot(slug: string) {
  return bots.find((bot) => bot.slug === slug) ?? null;
}

export function liveBots() {
  return bots.filter((bot) => bot.enabled);
}

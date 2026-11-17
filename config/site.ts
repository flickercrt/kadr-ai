import type { CSSProperties } from "react";

/**
 * Single source for the brand, palette, prices, countdown, and WhatsApp.
 * Change this file (and the CSS variables are injected from it) to retheme.
 */

export const brand = {
  name: "Kadr AI",
  nameAr: "كادر AI",
  /** Wordmark beside the viewfinder mark. */
  logoText: { ar: "كادر", en: "Kadr" },
  logoSuffix: "AI",
  tagline: {
    ar: "اصنع السينما والإعلان، إطارًا بإطار.",
    en: "Make cinema and ads, frame by frame.",
  },
  description: {
    ar: "أكاديمية لصناعة المشهد السينمائي والإعلان الترويجي بالذكاء الاصطناعي: شخصية ثابتة، حركة كاميرا مقصودة، وبوستر جاهز للعرض.",
    en: "An academy for cinematic scenes and promotional films made with AI: a locked character, deliberate camera moves, and a poster ready to show.",
  },
  colors: {
    background: "#0E1116",
    surface: "#161B22",
    primary: "#00D4B4",
    primaryText: "#0E1116",
    secondary: "#FF6B4A",
    text: "#F5F7FA",
    muted: "#8B949E",
    /** A step lighter than the card surface. */
    border: "#2A313C",
  },
} as const;

export const brandStyle = {
  "--brand-bg": brand.colors.background,
  "--brand-surface": brand.colors.surface,
  "--brand-primary": brand.colors.primary,
  "--brand-primary-text": brand.colors.primaryText,
  "--brand-secondary": brand.colors.secondary,
  "--brand-text": brand.colors.text,
  "--brand-muted": brand.colors.muted,
  "--brand-border": brand.colors.border,
} as CSSProperties;

export const localeStorageKey = "kadr-locale";

/**
 * Commerce. The strikethrough price, the live price, the countdown, and
 * WhatsApp all live here — not in components.
 *
 * PLACEHOLDER WhatsApp number: replace before launch.
 */
export const offer = {
  discountPercent: 60,
  /** Charged each month, in major currency units. */
  price: 39,
  /** Shown with a strike-through. */
  compareAt: 99,
  currency: "USD",
  currencySymbol: "$",
  /** ISO timestamp. The countdown reaches zero at this moment. */
  countdownEndsAt: "2026-12-31T21:00:00.000Z",
  /** Digits only, country code included, no plus sign. */
  whatsapp: "970599000000",
  whatsappMessage: {
    ar: "مرحبا، أريد الاشتراك في عضوية كادر AI",
    en: "Hello, I would like to join Kadr AI",
  },
  /** YouTube id for the "watch this first" block. Empty shows a designed frame. */
  introYoutubeId: "",
};

export function whatsappHref(locale: "ar" | "en") {
  const text = encodeURIComponent(offer.whatsappMessage[locale]);
  return `https://wa.me/${offer.whatsapp}?text=${text}`;
}

export type L10n = { ar: string; en: string };

export const landing = {
  promo: {
    text: {
      ar: `خصم ${offer.discountPercent}% لفترة محدودة — العضوية الشهرية بـ ${offer.currencySymbol}${offer.price} بدل ${offer.currencySymbol}${offer.compareAt}`,
      en: `${offer.discountPercent}% off for a limited time — monthly membership ${offer.currencySymbol}${offer.price} instead of ${offer.currencySymbol}${offer.compareAt}`,
    },
    cta: { ar: "احجز السعر", en: "Lock the price" },
  },
  hero: {
    kicker: {
      ar: "كادر — الإطار الذي تُبنى عليه اللقطة",
      en: "Kadr — the frame a shot is built on",
    },
    title: {
      ar: "صناعة السينما والإعلانات بالذكاء الاصطناعي",
      en: "Make cinema and ads with AI",
    },
    subtitle: {
      ar: "نظام بوتات يكتب لك البرومبت النهائي: ورقة شخصية ثابتة، حركة كاميرا وإضاءة ومشاعر، ثم بوستر وعنوان. تلصق الناتج في أداة التوليد كما هو.",
      en: "A bot system that writes the final prompt: a locked character sheet, camera motion, light and emotion, then a poster and title. Paste the result into your generator as-is.",
    },
    primaryCta: { ar: "ابدأ الآن", en: "Start now" },
    secondaryCta: { ar: "شاهد هذا أولاً", en: "Watch this first" },
    priceNote: {
      ar: "اشتراك شهري. يمكن إيقافه من بوابة الدفع، أو تفعيله يدوياً إذا دفعت عبر واتساب.",
      en: "Monthly membership. Cancel in the billing portal, or have it activated manually if you pay via WhatsApp.",
    },
  },
  watch: {
    kicker: { ar: "قبل أن تشترك", en: "Before you join" },
    title: { ar: "شاهد هذا أولاً", en: "Watch this first" },
    lead: {
      ar: "دقيقة تشرح الفرق بين طلب «اصنع لي مشهداً» وبين إخراج لقطة لها شخصية وعدسة ونية.",
      en: "A short look at the difference between “make me a scene” and directing a shot that has a character, a lens, and an intention.",
    },
    empty: {
      ar: "سيظهر الدرس هنا عند إضافة معرّف يوتيوب في ملف الإعداد.",
      en: "The lesson appears here once a YouTube id is set in the config file.",
    },
  },
  problem: {
    kicker: { ar: "المشكلة الحقيقية", en: "The real problem" },
    title: {
      ar: "لماذا يبدو عمل الذكاء الاصطناعي ضعيفاً؟",
      en: "Why does AI work come out looking thin?",
    },
    lead: {
      ar: "الأداة ليست السبب. السبب أن المشهد يُطلب بجملة واحدة: بلا وجه ثابت، بلا عدسة، وبلا قرار إخراجي.",
      en: "The tool is not the reason. The scene is asked for in one sentence: no locked face, no lens, no directing decision.",
    },
    points: [
      {
        title: { ar: "الوجه يتبدل", en: "The face drifts" },
        body: {
          ar: "من دون ورقة شخصية، كل لقطة تخترع إنساناً آخر. المشهد لا يُقطع.",
          en: "Without a character sheet, every frame invents a different person. The scene will not cut.",
        },
      },
      {
        title: { ar: "الكاميرا تائهة", en: "The camera is lost" },
        body: {
          ar: "«حركة سينمائية» ليست إخراجاً. العدسة، الاتجاه، والسرعة هي القرار.",
          en: "“Cinematic motion” is not direction. Lens, direction, and speed are the decision.",
        },
      },
      {
        title: { ar: "البوستر يُلحق في الآخر", en: "The poster is an afterthought" },
        body: {
          ar: "العنوان والفراغ المخصص له يُخططان مع المشهد، لا بعد أن يضيع التكوين.",
          en: "The title and the space it needs are planned with the scene, not after the composition is already gone.",
        },
      },
    ],
  },
  audience: {
    kicker: { ar: "لمن هذا", en: "Who this is for" },
    title: { ar: "كادر يناسبك إذا كنت", en: "Kadr fits if you are" },
    cards: [
      {
        title: { ar: "صنّاع الأفلام", en: "Filmmakers" },
        body: {
          ar: "تريد مشهداً يُقطع مع الذي يليه، لا لقطة يتيمة جميلة.",
          en: "You want a shot that cuts with the next one, not a pretty orphan frame.",
        },
      },
      {
        title: { ar: "صنّاع الإعلانات", en: "Ad makers" },
        body: {
          ar: "تريد جودة استوديو لفيلم ترويجي بفريق صغير وميزانية حلقة.",
          en: "You want studio-grade promo films with a small crew and a one-spot budget.",
        },
      },
      {
        title: { ar: "مصممو الغرافيك والـ 3D", en: "Designers and 3D" },
        body: {
          ar: "عندك شكل ثابت وتريد أن يتحرك داخل عدسة، لا أن يذوب في كل توليد.",
          en: "You already have a form, and you want it to move inside a lens instead of melting on every render.",
        },
      },
      {
        title: { ar: "صنّاع المحتوى", en: "Content creators" },
        body: {
          ar: "تريد أن يرتفع المقطع من «محتوى» إلى لقطة لها ضوء وقرار.",
          en: "You want the clip to rise from “content” to a shot with light and a decision.",
        },
      },
    ],
  },
  learn: {
    kicker: { ar: "ماذا ستتقن", en: "What you will master" },
    title: { ar: "ثلاث مراحل، من الفكرة إلى الإطار الأخير", en: "Three stages, from the idea to the final frame" },
    lead: {
      ar: "كل مرحلة لها بوت متخصص. لا يولّد صورة ولا فيديو. يسلّمك البرومبت الجاهز للنسخ.",
      en: "Each stage has a specialist bot. It does not generate an image or a video. It hands you a prompt ready to copy.",
    },
    steps: [
      {
        numeral: "01",
        bot: "scenes",
        title: { ar: "بناء الشخصية والمشهد", en: "Build the character and the scene" },
        body: {
          ar: "ورقة شخصية ثابتة: وجه، خامة، خزانة ملابس، ولوحة ألوان، ثم وصف الإطار الذي ستعود إليه كل اللقطات.",
          en: "A locked character sheet: face, texture, wardrobe, and palette, then the frame every later shot returns to.",
        },
      },
      {
        numeral: "02",
        bot: "video",
        title: { ar: "تحريك المشهد", en: "Animate the scene" },
        body: {
          ar: "برومبت حركة: اتجاه الكاميرا، زاوية العدسة، الإضاءة، والمشاعر، بمدة لقطة يمكن مونتاجها.",
          en: "A motion prompt: camera direction, lens angle, lighting, and emotion, in a duration you can actually cut.",
        },
      },
      {
        numeral: "03",
        bot: "posters",
        title: { ar: "الإخراج النهائي والبوستر", en: "Final output and the poster" },
        body: {
          ar: "تكوين بوستر، معالجة العنوان، والفراغ الذي يُترك للحروف حتى لا يكتب النموذج نصاً مكسوراً.",
          en: "Poster composition, title treatment, and the space left for type so the model is not asked to render broken lettering.",
        },
      },
    ],
    featured: {
      badge: { ar: "مميّز", en: "Featured" },
      title: {
        ar: "قفل الشخصية عبر اللقطات",
        en: "Lock the character across shots",
      },
      body: {
        ar: "نفس الوجه، نفس الخامة، نفس الضوء من ورقة الشخصية إلى الحركة ثم إلى البوستر. هذا هو الفرق بين توليد جميل وفيلم يمكن استكماله.",
        en: "The same face, the same texture, the same light — from the sheet, into motion, onto the poster. That is the difference between a pretty render and a film you can finish.",
      },
    },
  },
  showcase: {
    kicker: { ar: "المعرض", en: "Showcase" },
    title: { ar: "إطارات للتدريب على العين", en: "Frames to train the eye" },
    lead: {
      ar: "عيّنات عرض لتجربة التصفية والشبكة. استبدلها بأعمالك من ملف البيانات عندما تجهز الوسائط.",
      en: "Sample frames so you can try the filter and the grid. Replace them from the data file when your media is ready.",
    },
    cta: { ar: "المعرض كاملاً", en: "Full gallery" },
  },
  botsSection: {
    kicker: { ar: "نظام البوتات", en: "The bot system" },
    title: { ar: "خمسة بوتات، كل واحد لمرحلة", en: "Five bots, one for each stage" },
    lead: {
      ar: "ثلاثة تعمل اليوم. المؤثرات الصوتية والإعلانات معرّفة وجاهزة للتفعيل من ملف الإعداد دون تعديل الصفحات.",
      en: "Three are live today. Sound and ads are defined and can be switched on from the config without touching the pages.",
    },
  },
  pricing: {
    kicker: { ar: "العضوية", en: "Membership" },
    title: { ar: "سعر واحد يفتح البوتات", en: "One price opens the bots" },
    lead: {
      ar: "الاشتراك شهري. البوتات لا تُباع منفصلة عن العضوية، حتى يبقى النظام محدثاً معك.",
      en: "The subscription is monthly. Bots are not sold apart from the membership, so the system stays current with you.",
    },
    plans: [
      {
        id: "bots",
        highlighted: false,
        title: { ar: "نظام البوتات", en: "Bot system" },
        priceNote: { ar: "مشمول في العضوية", en: "Included with membership" },
        features: [
          { ar: "بوت المشاهد — شخصية وإطار", en: "Scene bot — character and frame" },
          { ar: "بوت الفيديو — عدسة وحركة ومشاعر", en: "Video bot — lens, motion, emotion" },
          { ar: "بوت البوسترات — عنوان وتكوين", en: "Poster bot — title and layout" },
          { ar: "المؤثرات والإعلانات عند تفعيلهما", en: "Sound and ads when they are switched on" },
          { ar: "برومبت للنسخ، لا توليد داخل الموقع", en: "A prompt to copy, no generation inside the site" },
        ],
        cta: { ar: "تعرّف على البوتات", en: "See the bots" },
        href: "#bots",
      },
      {
        id: "membership",
        highlighted: true,
        badge: { ar: "الأفضل قيمة", en: "Best value" },
        title: { ar: "عضوية كادر", en: "Kadr membership" },
        priceNote: { ar: "تُجدَّد كل شهر", en: "Renews monthly" },
        features: [
          { ar: "كل البوتات المتاحة هذا الشهر", en: "Every bot available this month" },
          { ar: "جلسات محفوظة لكل بوت", en: "Saved sessions for each bot" },
          { ar: "حصة شهرية من الرسائل", en: "A monthly message allowance" },
          { ar: "بوابة لإدارة البطاقة وإيقاف التجديد", en: "A portal to manage the card and stop renewal" },
          { ar: "تفعيل يدوي لمن يدفع خارج المنصة", en: "Manual activation if you pay outside the platform" },
        ],
        cta: { ar: "اشترك الآن", en: "Subscribe now" },
        href: "/signup?next=/account",
      },
    ],
  },
  compare: {
    kicker: { ar: "قبل أن تختار", en: "Before you choose" },
    title: { ar: "دورة تُغلق، أم عضوية تبقى؟", en: "A course that ends, or a membership that stays?" },
    lead: {
      ar: "الدورة المسجّلة تشرح لحظة. العضوية تبقى مع تغيّر النماذج، وجلساتك لا تُمسح آخر الحلقة.",
      en: "A recorded course explains a moment. The membership stays as the models change, and your sessions are still there after the lesson.",
    },
    course: { ar: "دورة مسجّلة", en: "A recorded course" },
    community: { ar: "عضوية كادر", en: "Kadr membership" },
    rows: [
      {
        label: { ar: "المحتوى", en: "Material" },
        course: { ar: "شروح ثابتة تنتهي بنهاية التسجيل", en: "Fixed lessons that end when the videos end" },
        membership: { ar: "بوتات تُحدَّث تعليماتها مع الممارسة", en: "Bots whose instructions are updated as the craft changes" },
        courseOk: false,
        membershipOk: true,
      },
      {
        label: { ar: "البرومبت", en: "The prompt" },
        course: { ar: "أمثلة عامة تنسخها وتعدّلها وحدك", en: "Generic examples you copy and repair alone" },
        membership: { ar: "برومبت مكتوب لمشهدك أنت", en: "A prompt written for your scene" },
        courseOk: false,
        membershipOk: true,
      },
      {
        label: { ar: "الذاكرة", en: "Memory" },
        course: { ar: "لا سجل لما جرّبته", en: "No record of what you tried" },
        membership: { ar: "جلسات محفوظة لكل بوت", en: "Saved sessions on every bot" },
        courseOk: false,
        membershipOk: true,
      },
      {
        label: { ar: "بعد الشهر الأول", en: "After the first month" },
        course: { ar: "تتوقف عند آخر فيديو", en: "You stop at the last video" },
        membership: { ar: "تجدّد أو توقف من البوابة", en: "Renew, or stop from the portal" },
        courseOk: false,
        membershipOk: true,
      },
    ],
    cta: { ar: "ابدأ العضوية", en: "Start the membership" },
  },
  stories: {
    kicker: { ar: "آراء", en: "Notes" },
    title: { ar: "ماذا يقول من يشتغل بالإطار", en: "What people say about working frame by frame" },
    note: {
      ar: "النصوص أدناه نماذج تنسيق في ملف الإعداد، وليست شهادات حقيقية بعد.",
      en: "The quotes below are layout samples in the config file, not real testimonials yet.",
    },
  },
  finalCta: {
    title: { ar: "الإطار الأول هو الأصعب. ابدأه بنظام.", en: "The first frame is the hard one. Start it with a system." },
    subtitle: {
      ar: "حساب، ثم عضوية، ثم بوت يسلّمك برومبت تنسخه.",
      en: "An account, then a membership, then a bot that hands you a prompt to copy.",
    },
    cta: { ar: "إنشاء حساب", en: "Create an account" },
  },
  footer: {
    blurb: {
      ar: "كادر AI أكاديمية لكتابة برومبت السينما والإعلان. من الفكرة إلى الإطار الأخير، بخطوات يمكن إعادتها.",
      en: "Kadr AI is an academy for writing cinema and advertising prompts. From the idea to the final frame, in steps you can repeat.",
    },
  },
};

/**
 * PLACEHOLDER TESTIMONIALS — layout samples only, not real students.
 * Replace every entry before launch.
 */
export const testimonials: {
  quote: L10n;
  name: string;
  role: L10n;
  initial: string;
}[] = [
  {
    quote: {
      ar: "نموذج: أول مرة أقدر أعيد نفس الوجه في ثلاث لقطات من غير ما ينكسر الفك.",
      en: "Sample: the first time I could repeat the same face across three shots without the jaw breaking.",
    },
    name: "س. ن.",
    role: { ar: "نموذج — إخراج", en: "Sample — directing" },
    initial: "س",
  },
  {
    quote: {
      ar: "نموذج: بوت الفيديو خلّاني أسمي حركة الكاميرا بدل ما أكتب «سينمائي» وأأمل.",
      en: "Sample: the video bot made me name the camera move instead of writing “cinematic” and hoping.",
    },
    name: "ل. ع.",
    role: { ar: "نموذج — إعلان", en: "Sample — ads" },
    initial: "ل",
  },
  {
    quote: {
      ar: "نموذج: البوستر صار له فراغ للعنوان. الحروف بطلت تطلع عجينة.",
      en: "Sample: the poster finally had room for the title. The letters stopped coming out as paste.",
    },
    name: "م. ك.",
    role: { ar: "نموذج — تصميم", en: "Sample — design" },
    initial: "م",
  },
];

/**
 * PLACEHOLDER social proof. Replace with real recent signups or remove the toast.
 */
export const joinFeed: { name: string; place: L10n }[] = [
  { name: "هدى س.", place: { ar: "رام الله", en: "Ramallah" } },
  { name: "كريم د.", place: { ar: "عمّان", en: "Amman" } },
  { name: "نور ف.", place: { ar: "حيفا", en: "Haifa" } },
  { name: "يوسف م.", place: { ar: "بيروت", en: "Beirut" } },
  { name: "لينا ر.", place: { ar: "دبي", en: "Dubai" } },
];

export const roadmap: {
  numeral: string;
  state: L10n;
  title: L10n;
  body: L10n;
}[] = [
  {
    numeral: "01",
    state: { ar: "الآن", en: "Now" },
    title: { ar: "ثلاثة بوتات وعضوية شهرية", en: "Three bots and a monthly membership" },
    body: {
      ar: "مشاهد، فيديو، وبوسترات. الدفع عبر المنصة أو التفعيل اليدوي من الإدارة.",
      en: "Scenes, video, and posters. Pay on the platform, or have an admin activate you manually.",
    },
  },
  {
    numeral: "02",
    state: { ar: "التالي", en: "Next" },
    title: { ar: "المؤثرات الصوتية والإعلانات", en: "Sound and ads" },
    body: {
      ar: "البوتان معرّفان في الإعداد. تفعيلهما لا يحتاج صفحة جديدة.",
      en: "Both bots are already in the config. Switching them on does not need a new page.",
    },
  },
  {
    numeral: "03",
    state: { ar: "بعدهما", en: "After that" },
    title: { ar: "جلسات مراجعة للأعمال", en: "Reviews of finished work" },
    body: {
      ar: "موعد ثابت لمراجعة إطار مكتمل: شخصية، حركة، وبوستر في ملف واحد.",
      en: "A standing slot to review a finished frame: character, motion, and poster in one file.",
    },
  },
  {
    numeral: "04",
    state: { ar: "لاحقاً", en: "Later" },
    title: { ar: "مكتبة مراجع للاستوديو", en: "A reference library for the studio" },
    body: {
      ar: "عدسات، ألوان، وتراكيب تُرفق بمعرفة البوت بدل أن تبقى في رأس المخرج فقط.",
      en: "Lenses, palettes, and compositions attached to the bot’s knowledge, not only in the director’s head.",
    },
  },
];

export type FaqItem = {
  id: string;
  question: string;
  answer: string;
  position: number;
  published: boolean;
};

export type FaqSeed = {
  id: string;
  question: { ar: string; en: string };
  answer: { ar: string; en: string };
};

/** Shown when faq_items is missing or has no rows. */
export const faqSeed: FaqSeed[] = [
  {
    id: "seed-membership",
    question: { ar: "كيف يعمل الاشتراك الشهري؟", en: "How does the monthly membership work?" },
    answer: {
      ar: "العضوية شهرية وتفتح بوتات المشاهد والفيديو والبوستر. تدفع من المنصة، أو عبر واتساب ثم يفعّلها المشرف من لوحة الإدارة.",
      en: "The membership is monthly and opens the scene, video, and poster bots. Pay on the site, or via WhatsApp and an admin switches it on.",
    },
  },
  {
    id: "seed-cancel",
    question: { ar: "هل أستطيع إلغاء العضوية؟", en: "Can I cancel?" },
    answer: {
      ar: "نعم. أوقف التجديد من بوابة الدفع. إذا فُعّلت العضوية يدوياً، اطلب الإيقاف عبر واتساب.",
      en: "Yes. Stop renewal in the billing portal. If an admin activated you by hand, ask on WhatsApp.",
    },
  },
  {
    id: "seed-learn",
    question: { ar: "ماذا سأتعلم في كادر؟", en: "What will I learn?" },
    answer: {
      ar: "ورقة شخصية ثابتة، ثم حركة كاميرا وإضاءة ومشاعر، ثم بوستر يُترك فيه فراغ للعنوان. الناتج برومبت تنسخه كما هو.",
      en: "A locked character sheet, then camera, light, and emotion, then a poster with room for the title. You leave with a prompt to copy.",
    },
  },
  {
    id: "seed-bots",
    question: { ar: "هل البوتات تولّد الصورة أو الفيديو؟", en: "Do the bots generate the image or video?" },
    answer: {
      ar: "لا. البوت يكتب البرومبت الجاهز. التوليد يبقى في الأداة التي تستخدمها أنت.",
      en: "No. The bot writes the prompt. Generation stays in the tool you already use.",
    },
  },
  {
    id: "seed-whatsapp",
    question: { ar: "كيف أتواصل إذا احتجت مساعدة؟", en: "How do I get help?" },
    answer: {
      ar: "راسلنا على واتساب 0569737472 لأسئلة العضوية والتفعيل والدعم.",
      en: "Message us on WhatsApp at 0569737472 for membership, activation, and support.",
    },
  },
  {
    id: "seed-who",
    question: { ar: "لمن هذه الأكاديمية؟", en: "Who is the academy for?" },
    answer: {
      ar: "لصنّاع الأفلام والإعلانات والمصممين وصنّاع المحتوى الذين يريدون لقطة تُقطع مع التي تليها، لا إطاراً يتيماً.",
      en: "Filmmakers, ad makers, designers, and creators who want a shot that cuts with the next one.",
    },
  },
];

export function seedFaqs(locale: "ar" | "en"): FaqItem[] {
  return faqSeed.map((item, index) => ({
    id: item.id,
    question: item.question[locale],
    answer: item.answer[locale],
    position: index,
    published: true,
  }));
}

export function cleanFaq(input: { question: string; answer: string; published?: boolean }) {
  const question = input.question.trim();
  const answer = input.answer.trim();
  if (question.length < 4 || question.length > 200) return null;
  if (answer.length < 4 || answer.length > 2000) return null;
  return { question, answer, published: input.published === true };
}

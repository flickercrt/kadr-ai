import type { Locale } from "@/lib/i18n";

function fence(prompt: string) {
  return "```text\n" + prompt.trim() + "\n```";
}

export function buildDemoReply(botSlug: string, userText: string, locale: Locale) {
  const idea = userText.replace(/\s+/g, " ").trim().slice(0, 500) || "a single figure in a dark room";
  const lead =
    locale === "ar"
      ? "هذه معاينة محلية. البرومبت أدناه جاهز للنسخ إلى أداة التوليد. الموقع لا يولّد الصورة ولا الفيديو."
      : "This is a local preview. The prompt below is ready to paste into your generator. This site does not render the image or the video.";

  if (botSlug === "video") {
    const prompt = [
      `Cinematic shot based on: ${idea}.`,
      "Duration 4 seconds. 35mm lens, gentle dolly-in, eye-level, shallow depth of field.",
      "Subject holds a readable action. Emotion is restrained, not a smile for the camera.",
      "Lighting: one cold practical source, a thin warm rim from frame-left. No flicker, no morphing face, no extra limbs.",
      "Camera move is motivated and ends on the same character described above.",
    ].join(" ");
    return `${lead}\n\n${fence(prompt)}`;
  }

  if (botSlug === "posters") {
    const prompt = [
      `Movie poster composition inspired by: ${idea}.`,
      "Vertical one-sheet. One subject, large negative space in the lower third reserved for a title that will be set later in design software.",
      "Do not render readable letters, logos, or watermarks. Typography is specified separately.",
      "Palette: near-black ground, teal highlight, a single coral accent. Photographed, not illustrated plastic.",
    ].join(" ");
    const typeNote =
      locale === "ar"
        ? "معالجة العنوان (تُنفَّذ في برنامج التصميم، لا داخل التوليد): خط عربي هندسي ثقيل، كلمتان كحد أقصى، بمحاذاة يمين المساحة السفلية."
        : "Title treatment (set in design software, not inside the render): a heavy geometric face, two words maximum, aligned to the lower band.";
    return `${lead}\n\n${typeNote}\n\n${fence(prompt)}`;
  }

  const prompt = [
    `Character sheet and hero frame for: ${idea}.`,
    "Full character sheet on a neutral dark ground: front, three-quarter, and profile, same face, same age, same wardrobe, same scars or marks.",
    "Then one locked hero frame: 50mm, eye-level, subject sharp, background readable but secondary.",
    "Palette locked: ink black, teal practical light, coral edge light. Skin texture natural. No text, no watermark, no extra people.",
  ].join(" ");
  return `${lead}\n\n${fence(prompt)}`;
}

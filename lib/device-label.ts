/** Arabic-friendly "browser on OS · kind" label from a user agent. No external lookup. */
export function deviceLabel(userAgent: string | null | undefined) {
  const ua = userAgent || "";
  const browser = /edg\//i.test(ua)
    ? "إيدج"
    : /opr\/|opera/i.test(ua)
      ? "أوبرا"
      : /firefox\//i.test(ua)
        ? "فايرفوكس"
        : /chrome\//i.test(ua) && !/edg\//i.test(ua)
          ? "كروم"
          : /safari\//i.test(ua)
            ? "سفاري"
            : "متصفح";
  const os = /android/i.test(ua)
    ? "أندرويد"
    : /iphone/i.test(ua)
      ? "آيفون"
      : /ipad/i.test(ua)
        ? "آيباد"
        : /mac os x/i.test(ua)
          ? "ماك"
          : /windows/i.test(ua)
            ? "ويندوز"
            : /cros/i.test(ua)
              ? "كروم بوك"
              : /linux/i.test(ua)
                ? "لينكس"
                : "نظام غير معروف";
  const kind = /ipad|tablet/i.test(ua) ? "جهاز لوحي" : /mobile|iphone|android/i.test(ua) ? "هاتف" : "حاسوب";
  return `${browser} على ${os} · ${kind}`;
}

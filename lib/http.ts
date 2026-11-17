import "server-only";

type ErrorCode =
  | "unauthorized"
  | "paywall"
  | "quota"
  | "rate"
  | "not_found"
  | "invalid"
  | "unavailable"
  | "forbidden"
  | "config"
  | "no_customer";

const messages: Record<ErrorCode, { ar: string; en: string }> = {
  unauthorized: { ar: "يلزم تسجيل الدخول.", en: "You need to log in." },
  paywall: {
    ar: "العضوية غير فعّالة. البوتات للمشتركين.",
    en: "Membership is not active. The bots are for subscribers.",
  },
  quota: {
    ar: "بلغت حصة الرسائل لهذا الشهر.",
    en: "You have used this month’s message allowance.",
  },
  rate: {
    ar: "أرسلت عدة رسائل بسرعة. انتظر دقيقة.",
    en: "Too many messages at once. Wait a minute.",
  },
  not_found: { ar: "العنصر غير موجود.", en: "That item was not found." },
  invalid: { ar: "البيانات غير مكتملة.", en: "The request is incomplete." },
  unavailable: {
    ar: "النموذج غير متصل من الخادم.",
    en: "The model is not connected on the server.",
  },
  forbidden: { ar: "ليس لديك صلاحية لهذا الإجراء.", en: "You cannot do that." },
  config: {
    ar: "الخدمة غير مهيئة على الخادم بعد.",
    en: "This service is not configured on the server yet.",
  },
  no_customer: {
    ar: "لا توجد عملية دفع سابقة لفتح البوابة.",
    en: "There is no previous payment to open the portal.",
  },
};

export function jsonError(status: number, code: ErrorCode) {
  return Response.json({ error: { code, ...messages[code] } }, { status });
}

export function currentPeriod() {
  const now = new Date();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${now.getUTCFullYear()}-${month}`;
}

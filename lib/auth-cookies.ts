export const REMEMBER_COOKIE = "kadr-remember";
export const DEVICE_COOKIE = "kadr-device";
export const SEEN_COOKIE = "kadr-seen";

/** Chrome's upper bound for a persistent cookie. */
export const REMEMBER_MAX_AGE = 400 * 24 * 60 * 60;
export const SEEN_MAX_AGE = 5 * 60;

export const WHATSAPP_DEVICES = "https://wa.me/972569737472";

export function isDeviceId(value: string | undefined | null): value is string {
  return Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value));
}

export function deviceLimitMessage(max: number) {
  if (max === 2) return "حسابك مفعّل على جهازين، تواصل مع الإدارة لتسجيل الخروج من جهاز";
  const count = Number.isFinite(max) && max > 0 ? max : 2;
  return `حسابك مفعّل على ${count} أجهزة، تواصل مع الإدارة لتسجيل الخروج من جهاز`;
}

type CookieOptions = {
  path?: string;
  sameSite?: "lax" | "strict" | "none" | boolean;
  secure?: boolean;
  httpOnly?: boolean;
  maxAge?: number;
  expires?: Date;
  domain?: string;
};

/** Keep Supabase auth cookies on `/` for the whole site. Remember-me uses a long maxAge; otherwise they stay session cookies. */
export function shapeAuthCookie(name: string, options: CookieOptions | undefined, remember: boolean): CookieOptions {
  const next: CookieOptions = { ...(options ?? {}), path: "/", sameSite: "lax" };
  delete next.expires;
  delete next.domain;
  if (name.startsWith("sb-") && !remember) delete next.maxAge;
  if (name.startsWith("sb-") && remember) next.maxAge = REMEMBER_MAX_AGE;
  return next;
}

export function rememberDocumentCookie(remember: boolean) {
  const base = `${REMEMBER_COOKIE}=${remember ? "1" : "0"}; Path=/; SameSite=Lax`;
  return remember ? `${base}; Max-Age=${REMEMBER_MAX_AGE}` : base;
}

export function writeRememberCookie(remember: boolean) {
  if (typeof document === "undefined") return;
  document.cookie = rememberDocumentCookie(remember);
}

export function followLogin(path: string) {
  window.location.assign(path);
}

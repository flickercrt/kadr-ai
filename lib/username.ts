/** Supabase Auth requires an email. Username accounts use this reserved domain. */
export const STUDENT_EMAIL_DOMAIN = "students.kadr-ai.local";

export const STUDENT_PASSWORD_MIN = 6;
export const STUDENT_PASSWORD_MAX = 72;

const USERNAME = /^[a-z0-9][a-z0-9._-]{1,31}$/;

export function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

export function isValidUsername(value: string) {
  return USERNAME.test(value);
}

export function studentEmailForUsername(username: string) {
  return `${username}@${STUDENT_EMAIL_DOMAIN}`;
}

export function usernameFromStudentEmail(email: string | null | undefined) {
  if (!email) return null;
  const lower = email.trim().toLowerCase();
  const suffix = `@${STUDENT_EMAIL_DOMAIN}`;
  if (!lower.endsWith(suffix)) return null;
  const username = lower.slice(0, -suffix.length);
  return isValidUsername(username) ? username : null;
}

/** Accept a real email, or a username that maps to the reserved student domain. */
export function loginEmailFromIdentifier(identifier: string) {
  const value = identifier.trim();
  if (!value) return "";
  if (value.includes("@")) return value.toLowerCase();
  return studentEmailForUsername(normalizeUsername(value));
}

export function isReservedStudentEmail(email: string) {
  return email.trim().toLowerCase().endsWith(`@${STUDENT_EMAIL_DOMAIN}`);
}

/** Hide the synthetic mailbox. Username accounts show the username instead. */
export function displayIdentity(email: string | null | undefined) {
  const username = usernameFromStudentEmail(email);
  if (username) return { email: null as string | null, username };
  const shown = email?.trim() || null;
  return { email: shown, username: null as string | null };
}

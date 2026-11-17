export const DEFAULT_REMINDER_DAYS = 5;

export function daysUntil(end: string | null, now = Date.now()) {
  if (!end) return null;
  const time = new Date(end).getTime();
  if (!Number.isFinite(time)) return null;
  return Math.ceil((time - now) / (24 * 60 * 60 * 1000));
}

export function isRenewalDue(end: string | null, daysBefore: number, now = Date.now()) {
  const left = daysUntil(end, now);
  if (left === null) return false;
  return left >= 0 && left <= daysBefore;
}

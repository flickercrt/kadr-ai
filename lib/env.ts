export function isDemoMode() {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true";
}

export function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  return Boolean(url && key && !url.includes("your-project"));
}

export function isServiceRoleConfigured() {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY) && isSupabaseConfigured();
}

export function adminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined) {
  if (!email) return false;
  return adminEmails().includes(email.toLowerCase());
}

export function monthlyQuota() {
  const value = Number(process.env.MONTHLY_MESSAGE_QUOTA ?? "200");
  return Number.isFinite(value) && value > 0 ? value : 200;
}

export function rateLimitPerMinute() {
  const value = Number(process.env.RATE_LIMIT_PER_MINUTE ?? "8");
  return Number.isFinite(value) && value > 0 ? value : 8;
}

export function historyTokenBudget() {
  const value = Number(process.env.HISTORY_TOKEN_BUDGET ?? "6000");
  return Number.isFinite(value) && value > 500 ? value : 6000;
}

export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://127.0.0.1:43123").replace(/\/$/, "");
}

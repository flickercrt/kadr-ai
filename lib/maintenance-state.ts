import { isSupabaseConfigured } from "@/lib/env";

const TTL_MS = 15_000;

type MaintenanceState = { enabled: boolean; message: string; at: number };

let cache: MaintenanceState | null = null;

export function clearMaintenanceCache() {
  cache = null;
}

/** Short-lived read. A missing table or a failed request is treated as off. */
export async function readMaintenance() {
  if (!isSupabaseConfigured()) return { enabled: false, message: "" };
  if (cache && Date.now() - cache.at < TTL_MS) return cache;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return { enabled: false, message: "" };
  try {
    const response = await fetch(`${url}/rest/v1/site_settings?id=eq.1&select=maintenance,maintenance_message`, {
      headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(2500),
    });
    if (!response.ok) {
      cache = { enabled: false, message: "", at: Date.now() };
      return cache;
    }
    const rows = (await response.json()) as { maintenance?: boolean; maintenance_message?: string }[] | { message?: string };
    const row = Array.isArray(rows) ? rows[0] : undefined;
    cache = {
      enabled: row?.maintenance === true,
      message: typeof row?.maintenance_message === "string" ? row.maintenance_message : "",
      at: Date.now(),
    };
    return cache;
  } catch {
    return cache ?? { enabled: false, message: "" };
  }
}

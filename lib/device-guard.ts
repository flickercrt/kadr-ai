import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";
import { DEVICE_COOKIE, isDeviceId, SEEN_COOKIE } from "@/lib/auth-cookies";
import { isMissingRelation } from "@/lib/db-errors";
import { isAdminEmail, isServiceRoleConfigured } from "@/lib/env";

export type DeviceVerdict = { signOut: false; touch: boolean } | { signOut: true; reason: "revoked" | "device"; touch: false };

function exempt(pathname: string) {
  return pathname === "/api/devices/claim" || pathname.startsWith("/auth/");
}

async function staffUser(supabase: SupabaseClient, user: User) {
  if (isAdminEmail(user.email)) return true;
  const { data } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  return data?.role === "admin" || data?.role === "instructor";
}

type DeviceRow = { id: string; revoked_at: string | null };

async function loadDevice(userId: string, deviceId: string): Promise<DeviceRow | null | "skip"> {
  if (!isServiceRoleConfigured()) return "skip";
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return "skip";
  try {
    const response = await fetch(
      `${url}/rest/v1/user_devices?user_id=eq.${userId}&device_id=eq.${encodeURIComponent(deviceId)}&select=id,revoked_at&limit=1`,
      {
        headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: "application/json" },
        cache: "no-store",
        signal: AbortSignal.timeout(2500),
      },
    );
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { code?: string; message?: string } | null;
      if (isMissingRelation(body)) return "skip";
      return "skip";
    }
    const rows = (await response.json()) as DeviceRow[];
    return rows[0] ?? null;
  } catch {
    return "skip";
  }
}

async function touchDevice(id: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return;
  await fetch(`${url}/rest/v1/user_devices?id=eq.${id}`, {
    method: "PATCH",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ last_seen_at: new Date().toISOString() }),
    signal: AbortSignal.timeout(2500),
  }).catch(() => undefined);
}

/** Revoked devices are signed out. A logged-in student with no device row is signed out too, unless the table is not there yet. */
export async function guardDevice(input: {
  request: NextRequest;
  supabase: SupabaseClient;
  user: User;
  pathname: string;
}): Promise<DeviceVerdict> {
  const deviceId = input.request.cookies.get(DEVICE_COOKIE)?.value;
  const known = isDeviceId(deviceId) ? deviceId : null;
  if (!known) {
    if (exempt(input.pathname) || !isServiceRoleConfigured()) return { signOut: false, touch: false };
    const probe = await loadDevice(input.user.id, "00000000-0000-4000-8000-000000000000");
    if (probe === "skip") return { signOut: false, touch: false };
    if (await staffUser(input.supabase, input.user)) return { signOut: false, touch: false };
    return { signOut: true, reason: "device", touch: false };
  }

  const row = await loadDevice(input.user.id, known);
  if (row === "skip") return { signOut: false, touch: false };
  if (!row) {
    if (exempt(input.pathname)) return { signOut: false, touch: false };
    if (await staffUser(input.supabase, input.user)) return { signOut: false, touch: false };
    return { signOut: true, reason: "device", touch: false };
  }
  if (row.revoked_at) {
    if (input.pathname === "/api/devices/claim") return { signOut: false, touch: false };
    return { signOut: true, reason: "revoked", touch: false };
  }
  const recent = Boolean(input.request.cookies.get(SEEN_COOKIE));
  if (!recent) void touchDevice(row.id);
  return { signOut: false, touch: !recent };
}

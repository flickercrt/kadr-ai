import "server-only";
import { DEVICE_COOKIE, deviceLimitMessage, isDeviceId, REMEMBER_MAX_AGE } from "@/lib/auth-cookies";
import { logActivity } from "@/lib/activity";
import { isMissingRelation } from "@/lib/db-errors";
import { deviceGeo } from "@/lib/device-geo";
import { deviceLabel } from "@/lib/device-label";
import { isAdminEmail } from "@/lib/env";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";
import { cookies } from "next/headers";

const DEFAULT_LIMIT = 2;

export type DeviceView = {
  id: string;
  userId: string;
  deviceId: string;
  label: string;
  userAgent: string | null;
  ip: string | null;
  country: string | null;
  city: string | null;
  createdAt: string;
  lastSeenAt: string;
  revokedAt: string | null;
  name?: string | null;
  email?: string | null;
};

function mapRow(row: {
  id: string;
  user_id: string;
  device_id: string;
  device_label: string | null;
  user_agent: string | null;
  ip: string | null;
  country: string | null;
  city: string | null;
  created_at: string;
  last_seen_at: string;
  revoked_at: string | null;
}): DeviceView {
  return {
    id: row.id,
    userId: row.user_id,
    deviceId: row.device_id,
    label: row.device_label || deviceLabel(row.user_agent),
    userAgent: row.user_agent,
    ip: row.ip,
    country: row.country,
    city: row.city,
    createdAt: row.created_at,
    lastSeenAt: row.last_seen_at,
    revokedAt: row.revoked_at,
  };
}

async function staff(user: { id: string; email?: string | null }, supabase: NonNullable<Awaited<ReturnType<typeof createServerSupabase>>>) {
  if (isAdminEmail(user.email)) return true;
  const { data } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  return data?.role === "admin" || data?.role === "instructor";
}

export async function deviceLimit() {
  const admin = createAdminSupabase();
  if (!admin) return DEFAULT_LIMIT;
  const { data, error } = await admin.from("device_settings").select("max_devices").eq("id", 1).maybeSingle();
  if (error || !data) return DEFAULT_LIMIT;
  const value = Number(data.max_devices);
  return Number.isFinite(value) && value >= 1 ? Math.min(10, value) : DEFAULT_LIMIT;
}

export async function claimDevice(request: Request, remember: boolean) {
  const supabase = await createServerSupabase();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  if (!user || !supabase) return { ok: false as const, status: 401, code: "unauthorized" };
  const admin = createAdminSupabase();
  const jar = await cookies();
  const existing = jar.get(DEVICE_COOKIE)?.value;
  const deviceId = isDeviceId(existing) ? existing : crypto.randomUUID();
  const secure = new URL(request.url).protocol === "https:";
  const finish = () => persistCookies(deviceId, remember, secure);

  if (!admin) return { ok: true as const, deviceId, skipped: true, finish };

  const geo = deviceGeo((name) => request.headers.get(name));
  const label = deviceLabel(request.headers.get("user-agent"));
  const now = new Date().toISOString();
  const { data: active, error } = await admin
    .from("user_devices")
    .select("id, device_id, revoked_at")
    .eq("user_id", user.id)
    .is("revoked_at", null);
  if (error) {
    if (isMissingRelation(error)) return { ok: true as const, deviceId, skipped: true, finish };
    return { ok: true as const, deviceId, skipped: true, finish };
  }

  const mine = (active ?? []).some((row) => row.device_id === deviceId);
  const others = (active ?? []).filter((row) => row.device_id !== deviceId).length;
  const exempt = await staff(user, supabase);
  const limit = await deviceLimit();
  if (!exempt && !mine && others >= limit) {
    await supabase.auth.signOut();
    await logActivity({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: "student",
      action: "device.blocked",
      targetType: "user",
      targetId: user.id,
      metadata: { limit, deviceId },
    });
    return { ok: false as const, status: 403, code: "device_limit", message: deviceLimitMessage(limit), deviceId };
  }

  const payload = {
    user_agent: request.headers.get("user-agent"),
    device_label: label,
    ip: geo.ip,
    country: geo.country,
    city: geo.city,
    last_seen_at: now,
    revoked_at: null as string | null,
  };
  const existingRow = await admin.from("user_devices").select("id").eq("user_id", user.id).eq("device_id", deviceId).maybeSingle();
  if (existingRow.error && isMissingRelation(existingRow.error)) return { ok: true as const, deviceId, skipped: true, finish };
  const write = existingRow.data
    ? await admin.from("user_devices").update(payload).eq("id", existingRow.data.id)
    : await admin.from("user_devices").insert({ user_id: user.id, device_id: deviceId, ...payload });
  if (write.error && !isMissingRelation(write.error)) {
    return { ok: true as const, deviceId, skipped: true, finish };
  }
  await logActivity({
    actorId: user.id,
    actorEmail: user.email,
    actorRole: exempt ? "admin" : "student",
    action: "auth.login",
    targetType: "device",
    targetId: deviceId,
    metadata: { label, remember },
  });
  return { ok: true as const, deviceId, finish };
}

function persistCookies(deviceId: string, remember: boolean, secure: boolean) {
  return async () => {
    const jar = await cookies();
    jar.set(DEVICE_COOKIE, deviceId, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure,
      maxAge: REMEMBER_MAX_AGE,
    });
    jar.set("kadr-remember", remember ? "1" : "0", {
      httpOnly: false,
      path: "/",
      sameSite: "lax",
      secure,
      ...(remember ? { maxAge: REMEMBER_MAX_AGE } : {}),
    });
    if (!remember) {
      for (const cookie of jar.getAll()) {
        if (!cookie.name.startsWith("sb-")) continue;
        jar.set(cookie.name, cookie.value, { path: "/", sameSite: "lax", secure, httpOnly: false });
      }
    }
  };
}

export async function listDevices(userId?: string) {
  const admin = createAdminSupabase();
  if (!admin) return { configured: false, ready: false, devices: [] as DeviceView[], maxDevices: DEFAULT_LIMIT };
  let query = admin
    .from("user_devices")
    .select("id, user_id, device_id, device_label, user_agent, ip, country, city, created_at, last_seen_at, revoked_at")
    .order("last_seen_at", { ascending: false })
    .limit(300);
  if (userId) query = query.eq("user_id", userId);
  const { data, error } = await query;
  if (error) {
    if (isMissingRelation(error)) return { configured: true, ready: false, devices: [] as DeviceView[], maxDevices: DEFAULT_LIMIT };
    throw new Error("failed");
  }
  const devices = (data ?? []).map(mapRow);
  const ids = [...new Set(devices.map((device) => device.userId))];
  if (ids.length) {
    const { data: profiles } = await admin.from("profiles").select("id, full_name, email").in("id", ids);
    const byId = new Map((profiles ?? []).map((profile) => [profile.id as string, profile]));
    for (const device of devices) {
      const profile = byId.get(device.userId);
      device.name = (profile?.full_name as string | null) ?? null;
      device.email = (profile?.email as string | null) ?? null;
    }
  }
  return { configured: true, ready: true, devices, maxDevices: await deviceLimit() };
}

export async function listOwnDevices(userId: string) {
  const supabase = await createServerSupabase();
  if (!supabase) return { configured: false, ready: false, devices: [] as DeviceView[] };
  const { data, error } = await supabase
    .from("user_devices")
    .select("id, user_id, device_id, device_label, user_agent, ip, country, city, created_at, last_seen_at, revoked_at")
    .eq("user_id", userId)
    .order("last_seen_at", { ascending: false });
  if (error) {
    if (isMissingRelation(error)) return { configured: true, ready: false, devices: [] as DeviceView[] };
    throw new Error("failed");
  }
  return { configured: true, ready: true, devices: (data ?? []).map(mapRow) };
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminNav } from "@/components/admin/admin-nav";
import { AppHeader } from "@/components/app-header";
import { DeviceTable, type DeviceRow } from "@/components/devices/device-table";
import { useI18n } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMe } from "@/components/use-me";
import { isDemoMode } from "@/lib/env";

const demoDevices: DeviceRow[] = [
  {
    id: "demo-device-1",
    userId: "00000000-0000-4000-8000-000000000001",
    name: "سارة",
    email: "sara",
    label: "كروم على ويندوز · حاسوب",
    ip: "213.6.120.14",
    country: "PS",
    city: "Ramallah",
    createdAt: "2026-11-01T09:12:00.000Z",
    lastSeenAt: "2026-11-17T18:40:00.000Z",
    revokedAt: null,
  },
  {
    id: "demo-device-2",
    userId: "00000000-0000-4000-8000-000000000001",
    name: "سارة",
    email: "sara",
    label: "سفاري على آيفون · هاتف",
    ip: "213.6.120.22",
    country: "PS",
    city: "Ramallah",
    createdAt: "2026-11-12T14:02:00.000Z",
    lastSeenAt: "2026-11-17T16:05:00.000Z",
    revokedAt: null,
  },
];

export function DevicesAdmin({ userId = "" }: { userId?: string }) {
  const { t } = useI18n();
  const { me } = useMe();
  const [devices, setDevices] = useState<DeviceRow[]>([]);
  const [ready, setReady] = useState(true);
  const [maxDevices, setMaxDevices] = useState(2);
  const [notice, setNotice] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const query = userId ? `?userId=${encodeURIComponent(userId)}` : "";
    try {
      const response = await fetch(`/api/admin/devices${query}`);
      const data = (await response.json().catch(() => ({}))) as { ready?: boolean; devices?: DeviceRow[]; maxDevices?: number };
      if (response.status === 403 && !isDemoMode()) return;
      const nextReady = response.ok && data.ready !== false;
      setReady(nextReady);
      setDevices(!nextReady && isDemoMode() ? demoDevices.filter((device) => !userId || device.userId === userId) : (data.devices ?? []));
      setMaxDevices(data.maxDevices ?? 2);
    } catch {
      setReady(false);
    }
  }, [userId]);

  useEffect(() => {
    const id = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(id);
  }, [load]);

  async function revoke(id: string) {
    setPendingId(id);
    await fetch("/api/admin/devices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "revoke", id }),
    });
    setPendingId(null);
    await load();
  }

  async function revokeAll() {
    if (!userId) return;
    setPendingId("all");
    await fetch("/api/admin/devices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "revoke-all", userId }),
    });
    setPendingId(null);
    await load();
  }

  async function saveLimit(event: React.FormEvent) {
    event.preventDefault();
    setNotice("");
    const response = await fetch("/api/admin/devices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "limit", maxDevices }),
    });
    if (response.ok) setNotice(t.devices.saved);
  }

  return (
    <div className="min-h-dvh">
      <AppHeader me={me} />
      <div className="mx-auto max-w-5xl px-4 py-10">
        <AdminNav current="devices" />
        <h1 className="text-3xl font-semibold">{t.devices.title}</h1>
        <p className="mt-2 text-sm leading-7 text-muted">{t.devices.lead}</p>
        {!ready ? <p className="mt-4 rounded-lg border border-border bg-surface p-4 text-sm leading-7">{isDemoMode() ? t.devices.demo : t.devices.schema}</p> : null}
        <form className="mt-6 flex flex-wrap items-end gap-2" onSubmit={(event) => void saveLimit(event)}>
          <label className="text-sm">
            <span className="mb-1 block text-muted">{t.devices.max}</span>
            <Input
              type="number"
              min={1}
              max={10}
              value={maxDevices}
              onChange={(event) => setMaxDevices(Number(event.target.value))}
              className="w-28"
              dir="ltr"
            />
          </label>
          <Button type="submit">{t.devices.save}</Button>
          {userId ? (
            <Button type="button" variant="outline" disabled={pendingId === "all"} onClick={() => void revokeAll()}>
              {t.devices.logoutAll}
            </Button>
          ) : null}
          {notice ? <span className="text-sm text-primary">{notice}</span> : null}
        </form>
        <div className="mt-4">
          <DeviceTable devices={devices} showUser={!userId} onRevoke={(id) => void revoke(id)} pendingId={pendingId} />
        </div>
        {devices.length === 0 ? <p className="mt-4 text-sm text-muted">{t.devices.empty}</p> : null}
      </div>
    </div>
  );
}

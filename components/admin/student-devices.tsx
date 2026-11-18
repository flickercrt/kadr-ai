"use client";

import { useEffect, useState } from "react";
import { AdminNav } from "@/components/admin/admin-nav";
import { AppHeader } from "@/components/app-header";
import { DeviceTable, type DeviceRow } from "@/components/devices/device-table";
import { useI18n } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import { useMe } from "@/components/use-me";
import { isDemoMode } from "@/lib/env";

const demoDevices: DeviceRow[] = [
  {
    id: "demo-device-1",
    userId: "00000000-0000-4000-8000-000000000001",
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
    label: "سفاري على آيفون · هاتف",
    ip: "213.6.120.22",
    country: "PS",
    city: "Ramallah",
    createdAt: "2026-11-12T14:02:00.000Z",
    lastSeenAt: "2026-11-17T16:05:00.000Z",
    revokedAt: null,
  },
];

export function StudentDevices({ userId }: { userId: string }) {
  const { t } = useI18n();
  const { me } = useMe();
  const [devices, setDevices] = useState<DeviceRow[]>([]);
  const [ready, setReady] = useState(true);
  const [name, setName] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void (async () => {
        try {
          const [devicesResponse, studentsResponse] = await Promise.all([
            fetch(`/api/admin/devices?userId=${encodeURIComponent(userId)}`),
            fetch("/api/admin/students"),
          ]);
          const data = (await devicesResponse.json().catch(() => ({}))) as { ready?: boolean; devices?: DeviceRow[] };
          const students = (await studentsResponse.json().catch(() => ({}))) as { students?: { id: string; name: string | null; username: string | null }[] };
          const student = students.students?.find((item) => item.id === userId);
          setName(student?.name || student?.username || "");
          if (devicesResponse.status === 403 && !isDemoMode()) return;
          const nextReady = devicesResponse.ok && data.ready !== false;
          setReady(nextReady);
          setDevices(!nextReady && isDemoMode() ? demoDevices : (data.devices ?? []));
          if (!student && isDemoMode()) setName("سارة");
        } catch {
          setReady(false);
        }
      })();
    }, 0);
    return () => window.clearTimeout(id);
  }, [userId]);

  async function revoke(id: string) {
    setPendingId(id);
    await fetch("/api/admin/devices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "revoke", id }),
    });
    setPendingId(null);
    setDevices((current) => current.map((device) => (device.id === id ? { ...device, revokedAt: new Date().toISOString() } : device)));
  }

  async function revokeAll() {
    setPendingId("all");
    await fetch("/api/admin/devices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "revoke-all", userId }),
    });
    setPendingId(null);
    setDevices((current) => current.map((device) => ({ ...device, revokedAt: device.revokedAt ?? new Date().toISOString() })));
  }

  return (
    <div className="min-h-dvh">
      <AppHeader me={me} />
      <div className="mx-auto max-w-5xl px-4 py-10">
        <AdminNav current="devices" />
        <h1 className="text-3xl font-semibold">{t.devices.studentTitle}</h1>
        {name ? <p className="mt-2 text-sm text-muted">{name}</p> : null}
        {!ready ? <p className="mt-4 rounded-lg border border-border bg-surface p-4 text-sm leading-7">{isDemoMode() ? t.devices.demo : t.devices.schema}</p> : null}
        <div className="mt-4">
          <Button type="button" variant="outline" disabled={pendingId === "all"} onClick={() => void revokeAll()}>
            {t.devices.logoutAll}
          </Button>
        </div>
        <div className="mt-4">
          <DeviceTable devices={devices} onRevoke={(id) => void revoke(id)} pendingId={pendingId} />
        </div>
        {ready && devices.length === 0 ? <p className="mt-4 text-sm text-muted">{t.devices.empty}</p> : null}
      </div>
    </div>
  );
}

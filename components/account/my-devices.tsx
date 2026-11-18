"use client";

import { useEffect, useState } from "react";
import { DeviceTable, type DeviceRow } from "@/components/devices/device-table";
import { useI18n } from "@/components/locale-provider";

export function MyDevices() {
  const { t } = useI18n();
  const [devices, setDevices] = useState<DeviceRow[]>([]);
  const [ready, setReady] = useState(true);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void (async () => {
        try {
          const response = await fetch("/api/devices");
          const data = (await response.json().catch(() => ({}))) as { ready?: boolean; devices?: DeviceRow[] };
          if (!response.ok) {
            setReady(response.status !== 401);
            return;
          }
          setReady(data.ready !== false);
          setDevices(data.devices ?? []);
        } catch {
          setReady(false);
        }
      })();
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold">{t.devices.mine}</h2>
      <p className="mt-1 text-sm leading-7 text-muted">{t.devices.mineLead}</p>
      {!ready ? <p className="mt-3 text-sm leading-7 text-muted">{t.devices.schema}</p> : null}
      <div className="mt-3">
        <DeviceTable devices={devices} />
      </div>
      {ready && devices.length === 0 ? <p className="mt-3 text-sm text-muted">{t.devices.empty}</p> : null}
    </section>
  );
}

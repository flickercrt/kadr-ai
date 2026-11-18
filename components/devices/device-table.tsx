"use client";

import { useI18n } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";

export type DeviceRow = {
  id: string;
  userId: string;
  label: string;
  ip: string | null;
  country: string | null;
  city: string | null;
  createdAt: string;
  lastSeenAt: string;
  revokedAt: string | null;
  name?: string | null;
  email?: string | null;
};

function when(value: string) {
  return value.slice(0, 16).replace("T", " ");
}

function place(device: DeviceRow) {
  return [device.city, device.country].filter(Boolean).join(" · ") || "—";
}

export function DeviceTable({
  devices,
  showUser = false,
  onRevoke,
  pendingId,
}: {
  devices: DeviceRow[];
  showUser?: boolean;
  onRevoke?: (id: string) => void;
  pendingId?: string | null;
}) {
  const { t } = useI18n();
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[760px] text-sm">
        <thead className="bg-surface text-muted">
          <tr>
            {showUser ? <th className="p-3 text-start font-medium">{t.devices.user}</th> : null}
            <th className="p-3 text-start font-medium">{t.devices.browser}</th>
            <th className="p-3 text-start font-medium">{t.devices.ip}</th>
            <th className="p-3 text-start font-medium">{t.devices.place}</th>
            <th className="p-3 text-start font-medium">{t.devices.first}</th>
            <th className="p-3 text-start font-medium">{t.devices.last}</th>
            <th className="p-3 text-start font-medium">{t.devices.status}</th>
            {onRevoke ? <th className="p-3 text-start font-medium">{t.devices.logout}</th> : null}
          </tr>
        </thead>
        <tbody>
          {devices.map((device) => (
            <tr key={device.id} className="border-t border-border">
              {showUser ? (
                <td className="p-3">
                  <div>{device.name || "—"}</div>
                  <div className="text-xs text-muted" dir="ltr">{device.email || device.userId.slice(0, 8)}</div>
                </td>
              ) : null}
              <td className="p-3">{device.label}</td>
              <td className="p-3" dir="ltr">{device.ip || "—"}</td>
              <td className="p-3">{place(device)}</td>
              <td className="p-3" dir="ltr">{when(device.createdAt)}</td>
              <td className="p-3" dir="ltr">{when(device.lastSeenAt)}</td>
              <td className="p-3">{device.revokedAt ? t.devices.revoked : t.devices.active}</td>
              {onRevoke ? (
                <td className="p-3">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={Boolean(device.revokedAt) || pendingId === device.id}
                    onClick={() => onRevoke(device.id)}
                  >
                    {t.devices.logout}
                  </Button>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

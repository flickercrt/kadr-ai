"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { isDemoMode } from "@/lib/env";

type Payment = {
  id: string;
  eventType: string;
  amountCents: number | null;
  currency: string | null;
  status: string;
  createdAt: string;
};

const demoPayments: Payment[] = [
  { id: "pay-1", eventType: "invoice.paid", amountCents: 3900, currency: "usd", status: "paid", createdAt: "2026-11-01T09:12:00.000Z" },
  { id: "pay-2", eventType: "invoice.paid", amountCents: 3900, currency: "usd", status: "paid", createdAt: "2026-10-01T09:12:00.000Z" },
];

function money(payment: Payment) {
  if (payment.amountCents === null) return "—";
  const amount = (payment.amountCents / 100).toFixed(2);
  return `${(payment.currency || "usd").toUpperCase()} ${amount}`;
}

export function PaymentHistoryButton({ userId }: { userId: string }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => {
      void (async () => {
        try {
          const response = await fetch(`/api/admin/payments?userId=${encodeURIComponent(userId)}`);
          const data = (await response.json().catch(() => ({}))) as { ready?: boolean; payments?: Payment[] };
          const nextReady = response.ok && data.ready !== false;
          setReady(nextReady);
          setPayments(!nextReady && isDemoMode() ? demoPayments : (data.payments ?? []));
        } catch {
          setReady(false);
          setPayments(isDemoMode() ? demoPayments : []);
        }
      })();
    }, 0);
    return () => window.clearTimeout(id);
  }, [open, userId]);

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        {t.admin.payments}
      </Button>
      <Modal open={open} onOpenChange={setOpen} title={t.admin.paymentsTitle}>
        {!ready ? <p className="text-sm leading-7 text-muted">{isDemoMode() ? t.admin.paymentsDemo : t.admin.paymentsSchema}</p> : null}
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[420px] text-sm">
            <thead className="text-muted">
              <tr>
                <th className="p-2 text-start font-medium">{t.admin.paymentsWhen}</th>
                <th className="p-2 text-start font-medium">{t.admin.paymentsAmount}</th>
                <th className="p-2 text-start font-medium">{t.admin.paymentsStatus}</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id} className="border-t border-border">
                  <td className="p-2" dir="ltr">{payment.createdAt.slice(0, 10)}</td>
                  <td className="p-2" dir="ltr">{money(payment)}</td>
                  <td className="p-2">{payment.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {payments.length === 0 ? <p className="mt-3 text-sm text-muted">{t.admin.paymentsEmpty}</p> : null}
      </Modal>
    </>
  );
}

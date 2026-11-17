import { logActivity } from "@/lib/activity";
import { applySubscriptionUpdate, recordPaymentEvent } from "@/lib/billing-store";
import { getPaymentProvider } from "@/lib/payments";
import { stripeBillingReady } from "@/lib/payments/price";

export async function POST(request: Request) {
  if (!stripeBillingReady()) {
    return Response.json({ received: true, configured: false });
  }
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");
  try {
    const provider = getPaymentProvider();
    const result = await provider.handleWebhook(rawBody, signature);
    let userId = result.update?.userId ?? result.payment?.userId ?? null;
    if (result.update) {
      const applied = await applySubscriptionUpdate(result.update);
      userId = applied.userId ?? userId;
      await logActivity({
        actorId: userId,
        actorRole: "system",
        action: "subscription.updated",
        targetType: "user",
        targetId: userId,
        metadata: { provider: "stripe", status: result.update.status, event: result.payment?.eventType ?? null },
      });
    }
    if (result.payment) {
      await recordPaymentEvent({ ...result.payment, userId: result.payment.userId ?? userId });
    }
    return Response.json({ received: true });
  } catch {
    return Response.json({ error: "invalid webhook" }, { status: 400 });
  }
}

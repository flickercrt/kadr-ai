import { applySubscriptionUpdate } from "@/lib/billing-store";
import { getPaymentProvider } from "@/lib/payments";


export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");
  try {
    const provider = getPaymentProvider();
    const update = await provider.handleWebhook(rawBody, signature);
    if (update) await applySubscriptionUpdate(update);
    return Response.json({ received: true });
  } catch {
    return Response.json({ error: "invalid webhook" }, { status: 400 });
  }
}

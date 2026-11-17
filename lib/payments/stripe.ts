import "server-only";
import Stripe from "stripe";
import type { PaymentProvider, PaymentRecord, SubscriptionUpdate, WebhookResult } from "@/lib/payments/types";
import type { SubscriptionStatus } from "@/lib/types";

function stripeClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

function mapStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  if (status === "active" || status === "trialing") return "active";
  if (status === "past_due" || status === "unpaid" || status === "paused") return "past_due";
  if (status === "canceled" || status === "incomplete_expired") return "canceled";
  return "inactive";
}

function customerIdOf(customer: Stripe.Subscription["customer"] | Stripe.Checkout.Session["customer"]) {
  if (!customer) return null;
  return typeof customer === "string" ? customer : customer.id;
}

function periodEnd(subscription: Stripe.Subscription) {
  const end = subscription.items?.data?.[0]?.current_period_end;
  if (!end) return null;
  return new Date(end * 1000).toISOString();
}

async function fromSubscription(stripe: Stripe, subscriptionId: string, userId: string | null): Promise<SubscriptionUpdate> {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  return {
    userId: userId || subscription.metadata.userId || null,
    status: mapStatus(subscription.status),
    provider: "stripe",
    providerCustomerId: customerIdOf(subscription.customer),
    providerSubscriptionId: subscription.id,
    currentPeriodEnd: periodEnd(subscription),
  };
}

export const stripeProvider: PaymentProvider = {
  name: "stripe",

  async createCheckout(input) {
    const stripe = stripeClient();
    if (!stripe || !input.amountCents || input.amountCents < 50) {
      throw new Error("STRIPE_NOT_CONFIGURED");
    }
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      client_reference_id: input.userId,
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      metadata: { userId: input.userId },
      subscription_data: { metadata: { userId: input.userId } },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: input.amountCents,
            recurring: { interval: "month" },
            product_data: { name: "Kadr AI monthly membership" },
          },
        },
      ],
      ...(input.customerId
        ? { customer: input.customerId }
        : { customer_email: input.email }),
    });
    if (!session.url) throw new Error("STRIPE_NO_URL");
    return { url: session.url };
  },

  async createPortal(input) {
    const stripe = stripeClient();
    if (!stripe) throw new Error("STRIPE_NOT_CONFIGURED");
    const session = await stripe.billingPortal.sessions.create({
      customer: input.customerId,
      return_url: input.returnUrl,
    });
    return { url: session.url };
  },

  async handleWebhook(rawBody, signature) {
    const stripe = stripeClient();
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!stripe || !secret || !signature) {
      throw new Error("STRIPE_NOT_CONFIGURED");
    }
    const event = stripe.webhooks.constructEvent(rawBody, signature, secret);
    const ignored: WebhookResult = { update: null, payment: null };

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const subscriptionId =
        typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
      const userId = session.client_reference_id || session.metadata?.userId || null;
      const update = subscriptionId ? await fromSubscription(stripe, subscriptionId, userId) : null;
      return {
        update,
        payment: paymentFrom(event.id, event.type, userId ?? update?.userId ?? null, session.amount_total, session.currency, session.payment_status || "paid"),
      };
    }

    if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      const subscription = event.data.object;
      const canceled = event.type === "customer.subscription.deleted";
      return {
        update: {
          userId: subscription.metadata.userId || null,
          status: canceled ? "canceled" : mapStatus(subscription.status),
          provider: "stripe",
          providerCustomerId: customerIdOf(subscription.customer),
          providerSubscriptionId: subscription.id,
          currentPeriodEnd: periodEnd(subscription),
        },
        payment: canceled
          ? paymentFrom(event.id, event.type, subscription.metadata.userId || null, null, null, "canceled")
          : null,
      };
    }

    if (event.type === "invoice.paid" || event.type === "invoice.payment_failed") {
      const invoice = event.data.object;
      const details = invoice.parent?.subscription_details?.subscription;
      const subscriptionId = typeof details === "string" ? details : details?.id ?? null;
      const customer = customerIdOf(invoice.customer);
      const failed = event.type === "invoice.payment_failed";
      const update = subscriptionId ? await fromSubscription(stripe, subscriptionId, null) : null;
      const status = failed ? "past_due" as const : "active" as const;
      return {
        update: update
          ? { ...update, status, providerCustomerId: update.providerCustomerId ?? customer }
          : {
              userId: null,
              status,
              provider: "stripe",
              providerCustomerId: customer,
              providerSubscriptionId: subscriptionId,
              currentPeriodEnd: null,
            },
        payment: paymentFrom(
          event.id,
          event.type,
          update?.userId ?? null,
          failed ? invoice.amount_due : invoice.amount_paid,
          invoice.currency,
          failed ? "failed" : "paid",
        ),
      };
    }

    return ignored;
  },
};

function paymentFrom(
  providerEventId: string,
  eventType: string,
  userId: string | null,
  amountCents: number | null | undefined,
  currency: string | null | undefined,
  status: string,
): PaymentRecord {
  return {
    userId,
    providerEventId,
    eventType,
    amountCents: typeof amountCents === "number" ? amountCents : null,
    currency: currency ?? null,
    status,
  };
}

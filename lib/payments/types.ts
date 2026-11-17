import type { SubscriptionStatus } from "@/lib/types";

/**
 * Isolate the payment provider behind this interface.
 * Stripe is the default. Paddle or Lemon Squeezy can replace it by
 * implementing the same three methods and selecting them in index.ts.
 * Manual activation in the admin page does not go through this interface.
 */
export type CheckoutInput = {
  userId: string;
  email: string;
  customerId: string | null;
  successUrl: string;
  cancelUrl: string;
  /** Monthly price in the smallest currency unit, already discounted. */
  amountCents: number;
};

export type PaymentRecord = {
  userId: string | null;
  providerEventId: string;
  eventType: string;
  amountCents: number | null;
  currency: string | null;
  status: string;
};

export type WebhookResult = {
  update: SubscriptionUpdate | null;
  payment: PaymentRecord | null;
};

export type PortalInput = {
  customerId: string;
  returnUrl: string;
};

export type SubscriptionUpdate = {
  userId: string | null;
  status: SubscriptionStatus;
  provider: string;
  providerCustomerId: string | null;
  providerSubscriptionId: string | null;
  currentPeriodEnd: string | null;
};

export interface PaymentProvider {
  readonly name: string;
  createCheckout(input: CheckoutInput): Promise<{ url: string }>;
  createPortal(input: PortalInput): Promise<{ url: string }>;
  /** update is null when the event should not change a membership. */
  handleWebhook(rawBody: string, signature: string | null): Promise<WebhookResult>;
}

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
  /** Return null when the event should be ignored. */
  handleWebhook(rawBody: string, signature: string | null): Promise<SubscriptionUpdate | null>;
}

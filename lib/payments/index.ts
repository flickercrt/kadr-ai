import "server-only";
import type { PaymentProvider } from "@/lib/payments/types";
import { stripeProvider } from "@/lib/payments/stripe";

/**
 * Swap providers here. Implement PaymentProvider in a sibling file
 * (paddle.ts or lemon-squeezy.ts) and return it when PAYMENT_PROVIDER matches.
 */
export function getPaymentProvider(): PaymentProvider {
  const name = process.env.PAYMENT_PROVIDER || "stripe";
  if (name === "stripe") return stripeProvider;
  throw new Error(`Unknown PAYMENT_PROVIDER: ${name}`);
}

import "server-only";
import { createAdminSupabase } from "@/lib/supabase/admin";
import type { SubscriptionUpdate } from "@/lib/payments/types";

export async function applySubscriptionUpdate(update: SubscriptionUpdate) {
  const admin = createAdminSupabase();
  if (!admin) throw new Error("SUPABASE_SERVICE_ROLE_MISSING");

  let userId = update.userId;
  if (!userId && update.providerCustomerId) {
    const { data } = await admin
      .from("subscriptions")
      .select("user_id")
      .eq("provider_customer_id", update.providerCustomerId)
      .maybeSingle();
    userId = data?.user_id ?? null;
  }
  if (!userId) return { applied: false };

  const { error } = await admin.from("subscriptions").upsert({
    user_id: userId,
    status: update.status,
    provider: update.provider,
    provider_customer_id: update.providerCustomerId,
    provider_subscription_id: update.providerSubscriptionId,
    current_period_end: update.currentPeriodEnd,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
  return { applied: true };
}

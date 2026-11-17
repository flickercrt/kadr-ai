import { siteUrl } from "@/lib/env";
import { jsonError } from "@/lib/http";
import { getPaymentProvider } from "@/lib/payments";
import { currentSaleCents, stripeBillingReady, WHATSAPP_SUBSCRIBE_URL } from "@/lib/payments/price";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";

export async function POST() {
  const amountCents = await currentSaleCents();
  if (!stripeBillingReady() || amountCents === null) {
    return Response.json({ url: WHATSAPP_SUBSCRIBE_URL, fallback: "whatsapp" });
  }

  const supabase = await createServerSupabase();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  if (!user?.email) return jsonError(401, "unauthorized");
  const admin = createAdminSupabase();
  if (!admin) return jsonError(503, "config");

  const { data: subscription } = await admin
    .from("subscriptions")
    .select("provider_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  try {
    const provider = getPaymentProvider();
    const { url } = await provider.createCheckout({
      userId: user.id,
      email: user.email,
      customerId: subscription?.provider_customer_id ?? null,
      successUrl: `${siteUrl()}/account?checkout=success`,
      cancelUrl: `${siteUrl()}/account?checkout=cancel`,
      amountCents,
    });
    return Response.json({ url });
  } catch (error) {
    if (error instanceof Error && error.message === "STRIPE_NOT_CONFIGURED") {
      return Response.json({ url: WHATSAPP_SUBSCRIBE_URL, fallback: "whatsapp" });
    }
    return jsonError(503, "config");
  }
}

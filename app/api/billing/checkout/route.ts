import { siteUrl } from "@/lib/env";
import { jsonError } from "@/lib/http";
import { getPaymentProvider } from "@/lib/payments";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";


export async function POST() {
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
    });
    return Response.json({ url });
  } catch {
    return jsonError(503, "config");
  }
}

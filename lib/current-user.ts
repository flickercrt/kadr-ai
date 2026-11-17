import "server-only";
import { cookies } from "next/headers";
import { isAdminEmail, isDemoMode, monthlyQuota } from "@/lib/env";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { asStatus, isSubscriptionActive } from "@/lib/subscription";
import { currentPeriod } from "@/lib/http";
import type { MeResponse } from "@/lib/types";

const emptySubscription: MeResponse["subscription"] = {
  status: "inactive",
  active: false,
  provider: null,
  currentPeriodEnd: null,
  demoBypass: false,
};

export async function getMe(): Promise<MeResponse> {
  // Touch the request so this route is never frozen as a static payload.
  await cookies();
  const demo = isDemoMode();
  const supabase = await createServerSupabase();
  if (!supabase) {
    return {
      mode: demo ? "demo" : "live",
      configured: false,
      user: null,
      subscription: demo
        ? { ...emptySubscription, status: "active", active: true, provider: "demo", demoBypass: true }
        : emptySubscription,
      usage: { used: 0, limit: monthlyQuota() },
      isAdmin: false,
    };
  }

  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) {
    return {
      mode: demo ? "demo" : "live",
      configured: true,
      user: null,
      subscription: demo
        ? { ...emptySubscription, status: "active", active: true, provider: "demo", demoBypass: true }
        : emptySubscription,
      usage: { used: 0, limit: monthlyQuota() },
      isAdmin: false,
    };
  }

  const admin = createAdminSupabase() ?? supabase;
  const [{ data: profile }, { data: subscription }, { data: usage }] = await Promise.all([
    admin.from("profiles").select("full_name, email").eq("id", user.id).maybeSingle(),
    admin.from("subscriptions").select("status, provider, current_period_end").eq("user_id", user.id).maybeSingle(),
    admin
      .from("usage_monthly")
      .select("message_count")
      .eq("user_id", user.id)
      .eq("period", currentPeriod())
      .maybeSingle(),
  ]);

  const status = asStatus(subscription?.status);
  const active = isSubscriptionActive(
    subscription
      ? { status: subscription.status, current_period_end: subscription.current_period_end }
      : null,
  );

  return {
    mode: demo ? "demo" : "live",
    configured: true,
    user: {
      id: user.id,
      email: profile?.email || user.email || "",
      name: profile?.full_name || (user.user_metadata?.full_name as string) || "",
    },
    subscription: {
      status: active ? "active" : status,
      active: active || demo,
      provider: subscription?.provider ?? null,
      currentPeriodEnd: subscription?.current_period_end ?? null,
      demoBypass: demo && !active,
    },
    usage: { used: usage?.message_count ?? 0, limit: monthlyQuota() },
    isAdmin: isAdminEmail(user.email),
  };
}

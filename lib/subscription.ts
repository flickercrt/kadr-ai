import "server-only";
import type { SubscriptionStatus } from "@/lib/types";

export function isSubscriptionActive(row: {
  status: string;
  current_period_end: string | null;
} | null) {
  if (!row || row.status !== "active") return false;
  if (!row.current_period_end) return true;
  return new Date(row.current_period_end).getTime() > Date.now();
}

export function asStatus(value: string | null | undefined): SubscriptionStatus {
  if (value === "active" || value === "past_due" || value === "canceled" || value === "inactive") {
    return value;
  }
  return "inactive";
}

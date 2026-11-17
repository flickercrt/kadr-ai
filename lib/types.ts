export type SubscriptionStatus = "active" | "inactive" | "past_due" | "canceled";

export type MeResponse = {
  mode: "demo" | "live";
  configured: boolean;
  user: { id: string; email: string; name: string; username: string | null } | null;
  subscription: {
    status: SubscriptionStatus;
    active: boolean;
    provider: string | null;
    currentPeriodEnd: string | null;
    demoBypass: boolean;
  };
  usage: { used: number; limit: number };
  isAdmin: boolean;
};

export type SessionRecord = {
  id: string;
  botSlug: string;
  title: string;
  updatedAt: string;
};

export type MessageRecord = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

export type ApiError = {
  error: { code: string; ar: string; en: string };
};

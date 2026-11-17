import OpenAI from "openai";
import { z } from "zod";
import { getBot } from "@/config/bots";
import { buildDemoReply } from "@/lib/demo-reply";
import {
  historyTokenBudget,
  isDemoMode,
  monthlyQuota,
  rateLimitPerMinute,
} from "@/lib/env";
import { currentPeriod, jsonError } from "@/lib/http";
import { buildSystemPrompt } from "@/lib/prompts";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";
import { isSubscriptionActive } from "@/lib/subscription";
import { trimHistory } from "@/lib/tokens";
import type { Locale } from "@/lib/i18n";

export const maxDuration = 60;

const bodySchema = z.object({
  botSlug: z.string().min(1).max(40),
  content: z.string().trim().min(1).max(4000),
  locale: z.enum(["ar", "en"]).optional(),
  sessionId: z.uuid().optional(),
});

const sseHeaders = {
  "Content-Type": "text/event-stream; charset=utf-8",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
};

function streamText(text: string) {
  const encoder = new TextEncoder();
  const parts = text.split(/(\s+)/);
  return new Response(
    new ReadableStream({
      async start(controller) {
        for (let index = 0; index < parts.length; index += 4) {
          const piece = parts.slice(index, index + 4).join("");
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "delta", text: piece })}\n\n`));
          await new Promise((resolve) => setTimeout(resolve, 18));
        }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`));
        controller.close();
      },
    }),
    { headers: sseHeaders },
  );
}

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "invalid");

  const { botSlug, content, sessionId } = parsed.data;
  const locale: Locale = parsed.data.locale === "en" ? "en" : "ar";
  const bot = getBot(botSlug);
  if (!bot || !bot.enabled) return jsonError(404, "not_found");

  const supabase = await createServerSupabase();
  const userResult = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  const user = userResult.data.user;
  const demo = isDemoMode();

  if (!user) {
    if (demo) return streamText(buildDemoReply(bot.slug, content, locale));
    return jsonError(401, "unauthorized");
  }
  if (!sessionId) return jsonError(400, "invalid");

  const admin = createAdminSupabase();
  if (!admin) return jsonError(503, "config");

  await admin.from("profiles").upsert(
    { id: user.id, email: user.email, full_name: (user.user_metadata?.full_name as string) || "" },
    { onConflict: "id", ignoreDuplicates: true },
  );

  const { data: session } = await admin
    .from("chat_sessions")
    .select("id, title, bot_slug")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!session || session.bot_slug !== bot.slug) return jsonError(404, "not_found");

  const { data: subscription } = await admin
    .from("subscriptions")
    .select("status, current_period_end")
    .eq("user_id", user.id)
    .maybeSingle();
  const active = isSubscriptionActive(subscription);
  if (!active && !demo) return jsonError(402, "paywall");

  const since = new Date(Date.now() - 60_000).toISOString();
  const { count } = await admin
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("role", "user")
    .gte("created_at", since);
  if ((count ?? 0) >= rateLimitPerMinute()) return jsonError(429, "rate");

  const period = currentPeriod();
  const { data: usage } = await admin
    .from("usage_monthly")
    .select("message_count")
    .eq("user_id", user.id)
    .eq("period", period)
    .maybeSingle();
  if ((usage?.message_count ?? 0) >= monthlyQuota()) return jsonError(429, "quota");

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    if (demo) return streamText(buildDemoReply(bot.slug, content, locale));
    return jsonError(503, "unavailable");
  }

  const { error: insertError } = await admin.from("messages").insert({
    session_id: sessionId,
    user_id: user.id,
    role: "user",
    content,
  });
  if (insertError) return jsonError(500, "unavailable");

  await admin.from("usage_monthly").upsert({
    user_id: user.id,
    period,
    message_count: (usage?.message_count ?? 0) + 1,
  });

  const defaultTitles = new Set(["محادثة جديدة", "New chat"]);
  if (defaultTitles.has(session.title)) {
    await admin
      .from("chat_sessions")
      .update({ title: content.slice(0, 72), updated_at: new Date().toISOString() })
      .eq("id", sessionId);
  }

  const { data: historyRows } = await admin
    .from("messages")
    .select("role, content")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true })
    .limit(40);

  const history = trimHistory(historyRows ?? [], historyTokenBudget()).map((row) => ({
    role: row.role as "user" | "assistant",
    content: row.content,
  }));

  const openai = new OpenAI({ apiKey });
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let full = "";
      try {
        const completion = await openai.chat.completions.create({
          model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
          stream: true,
          max_completion_tokens: 1400,
          messages: [{ role: "system", content: buildSystemPrompt(bot) }, ...history],
        });
        for await (const chunk of completion) {
          const token = chunk.choices[0]?.delta?.content ?? "";
          if (!token) continue;
          full += token;
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "delta", text: token })}\n\n`));
        }
        if (full.trim()) {
          await admin.from("messages").insert({
            session_id: sessionId,
            user_id: user.id,
            role: "assistant",
            content: full,
          });
        }
        await admin.from("chat_sessions").update({ updated_at: new Date().toISOString() }).eq("id", sessionId);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`));
        controller.close();
      } catch {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error" })}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: sseHeaders });
}

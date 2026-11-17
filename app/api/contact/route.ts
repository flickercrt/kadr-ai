import { z } from "zod";
import { parseContact } from "@/lib/contact";
import { jsonError } from "@/lib/http";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { isMissingRelation } from "@/lib/db-errors";

const bodySchema = z.object({
  name: z.string(),
  contact: z.string(),
  subject: z.string(),
  message: z.string(),
  website: z.string().optional(),
});

const WINDOW_MS = 10 * 60 * 1000;
const LIMIT = 5;
const hits = new Map<string, number[]>();

function clientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || "local";
}

function limited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((time) => now - time < WINDOW_MS);
  if (recent.length >= LIMIT) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  return false;
}

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "invalid");
  if ((parsed.data.website ?? "").trim()) return Response.json({ ok: true });
  if (limited(clientIp(request))) {
    return Response.json(
      {
        error: {
          code: "rate",
          ar: "أرسلت عدة رسائل. انتظر قليلاً ثم أعد المحاولة.",
          en: "Too many messages. Wait a moment and try again.",
        },
      },
      { status: 429 },
    );
  }
  const content = parseContact(parsed.data);
  if (!content) return jsonError(400, "invalid");

  const admin = createAdminSupabase();
  if (!admin) return jsonError(503, "config");
  const { error } = await admin.from("contact_messages").insert(content);
  if (error) return isMissingRelation(error) ? jsonError(503, "config") : jsonError(500, "failed");

  await admin.from("admin_notifications").insert({
    kind: "contact",
    body: `${content.name} — ${content.subject}`,
  });

  return Response.json({ ok: true });
}

import { z } from "zod";
import { requireAdminCaller } from "@/lib/admin-auth";
import { safeBotDestination } from "@/lib/bot-links";
import { bots } from "@/config/bots";
import { isMissingRelation } from "@/lib/db-errors";
import { jsonError } from "@/lib/http";

const bodySchema = z.object({
  links: z.array(z.object({ slug: z.string(), url: z.string() })),
});

const slugs = new Set(bots.map((bot) => bot.slug));

export async function GET() {
  const gate = await requireAdminCaller();
  if (gate.denied) return gate.denied;
  if (!gate.admin) return Response.json({ configured: false, ready: false, links: {} });
  const { data, error } = await gate.admin.from("bot_links").select("slug, url");
  if (error) {
    if (isMissingRelation(error)) return Response.json({ configured: true, ready: false, links: {} });
    return jsonError(500, "failed");
  }
  const links: Record<string, string> = {};
  for (const row of data ?? []) links[row.slug] = row.url ?? "";
  return Response.json({ configured: true, ready: true, links });
}

export async function POST(request: Request) {
  const gate = await requireAdminCaller();
  if (gate.denied) return gate.denied;
  if (!gate.admin) return jsonError(503, "config");
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "invalid");
  const rows = [];
  for (const item of parsed.data.links) {
    if (!slugs.has(item.slug)) return jsonError(400, "invalid");
    const url = safeBotDestination(item.url);
    if (url === null) return jsonError(400, "invalid");
    rows.push({ slug: item.slug, url, updated_at: new Date().toISOString() });
  }
  const { error } = await gate.admin.from("bot_links").upsert(rows);
  if (error) return isMissingRelation(error) ? jsonError(503, "config") : jsonError(500, "failed");
  return Response.json({ ok: true });
}

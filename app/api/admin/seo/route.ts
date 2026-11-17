import { z } from "zod";
import { requireAdminCaller } from "@/lib/admin-auth";
import { isMissingRelation } from "@/lib/db-errors";
import { jsonError } from "@/lib/http";
import { clearSeoCache, defaultSeo } from "@/lib/seo";

const bodySchema = z.object({
  title: z.string().max(120),
  description: z.string().max(300),
  keywords: z.string().max(240),
});

function clean(value: string, max: number) {
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}

export async function GET() {
  const gate = await requireAdminCaller();
  if (gate.denied) return gate.denied;
  if (!gate.admin) return Response.json({ configured: false, ready: false, ...defaultSeo() });
  const { data, error } = await gate.admin.from("seo_settings").select("title, description, keywords").eq("id", 1).maybeSingle();
  if (error) {
    if (isMissingRelation(error)) return Response.json({ configured: true, ready: false, ...defaultSeo() });
    return jsonError(500, "failed");
  }
  const fallback = defaultSeo();
  return Response.json({
    configured: true,
    ready: true,
    title: data?.title?.trim() || fallback.title,
    description: data?.description?.trim() || fallback.description,
    keywords: data?.keywords?.trim() || fallback.keywords,
  });
}

export async function POST(request: Request) {
  const gate = await requireAdminCaller();
  if (gate.denied) return gate.denied;
  if (!gate.admin) return jsonError(503, "config");
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "invalid");
  const title = clean(parsed.data.title, 120);
  const description = clean(parsed.data.description, 300);
  const keywords = clean(parsed.data.keywords, 240);
  if (title.length < 4 || description.length < 12) return jsonError(400, "invalid");
  const { error } = await gate.admin.from("seo_settings").upsert(
    { id: 1, title, description, keywords, updated_at: new Date().toISOString() },
    { onConflict: "id" },
  );
  if (error) return isMissingRelation(error) ? jsonError(503, "config") : jsonError(500, "failed");
  clearSeoCache();
  return Response.json({ ok: true, title, description, keywords });
}

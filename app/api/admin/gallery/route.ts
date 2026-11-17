import { z } from "zod";
import { requireAdminCaller } from "@/lib/admin-auth";
import { logActivity } from "@/lib/activity";
import { isMissingRelation } from "@/lib/db-errors";
import { jsonError } from "@/lib/http";
import { isHttpUrl } from "@/lib/youtube";

const itemSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  categoryId: z.string().nullable().optional(),
  mediaType: z.enum(["image", "video"]),
  imageUrl: z.string().optional(),
  videoUrl: z.string().optional(),
  published: z.boolean().optional(),
});

const bodySchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create-category"), name: z.string() }),
  z.object({ action: z.literal("update-category"), id: z.uuid(), name: z.string() }),
  z.object({ action: z.literal("delete-category"), id: z.uuid() }),
  z.object({ action: z.literal("reorder-categories"), ids: z.array(z.uuid()).min(1) }),
  z.object({ action: z.literal("create-item"), ...itemSchema.shape }),
  z.object({ action: z.literal("update-item"), id: z.uuid(), ...itemSchema.shape }),
  z.object({ action: z.literal("delete-item"), id: z.uuid() }),
  z.object({ action: z.literal("reorder-items"), ids: z.array(z.uuid()).min(1) }),
]);

function cleanItem(input: z.infer<typeof itemSchema>) {
  const title = input.title.trim();
  const description = (input.description ?? "").trim();
  const imageUrl = (input.imageUrl ?? "").trim();
  const videoUrl = (input.videoUrl ?? "").trim();
  if (title.length < 1 || title.length > 140 || description.length > 2000) return null;
  if (imageUrl && !isHttpUrl(imageUrl)) return null;
  if (videoUrl && !isHttpUrl(videoUrl)) return null;
  return {
    title,
    description,
    category_id: input.categoryId || null,
    media_type: input.mediaType,
    image_url: imageUrl,
    video_url: videoUrl,
    published: input.published === true,
  };
}

async function load(admin: NonNullable<Awaited<ReturnType<typeof requireAdminCaller>>["admin"]>) {
  const [categories, items] = await Promise.all([
    admin.from("gallery_categories").select("id, name, position").order("position", { ascending: true }),
    admin.from("gallery_items").select("id, category_id, title, description, media_type, image_url, video_url, position, published").order("position", { ascending: true }),
  ]);
  const error = categories.error || items.error;
  return { error, categories: categories.data ?? [], items: items.data ?? [] };
}

export async function GET() {
  const gate = await requireAdminCaller();
  if (gate.denied) return gate.denied;
  if (!gate.admin) return Response.json({ configured: false, ready: false, categories: [], items: [] });
  const loaded = await load(gate.admin);
  if (loaded.error) {
    if (isMissingRelation(loaded.error)) return Response.json({ configured: true, ready: false, categories: [], items: [] });
    return jsonError(500, "failed");
  }
  return Response.json({
    configured: true,
    ready: true,
    categories: loaded.categories,
    items: loaded.items.map((row) => ({
      id: row.id,
      categoryId: row.category_id,
      title: row.title,
      description: row.description,
      mediaType: row.media_type,
      imageUrl: row.image_url,
      videoUrl: row.video_url,
      position: row.position,
      published: row.published,
    })),
  });
}

export async function POST(request: Request) {
  const gate = await requireAdminCaller();
  if (gate.denied) return gate.denied;
  if (!gate.admin) return jsonError(503, "config");
  const admin = gate.admin;
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "invalid");
  const body = parsed.data;
  const now = new Date().toISOString();
  const done = async (targetId?: string) => {
    await logActivity({
      actorId: gate.user.id,
      actorEmail: gate.user.email,
      actorRole: "admin",
      action: "gallery.updated",
      targetType: "gallery",
      targetId: targetId ?? null,
      metadata: { op: body.action },
    });
    return Response.json({ ok: true });
  };

  if (body.action === "create-category" || body.action === "update-category") {
    const name = body.name.trim();
    if (name.length < 1 || name.length > 60) return jsonError(400, "invalid");
    if (body.action === "create-category") {
      const { data: last } = await admin.from("gallery_categories").select("position").order("position", { ascending: false }).limit(1);
      const { error } = await admin.from("gallery_categories").insert({ name, position: (last?.[0]?.position ?? -1) + 1 });
      if (error) return isMissingRelation(error) ? jsonError(503, "config") : jsonError(500, "failed");
    } else {
      const { error } = await admin.from("gallery_categories").update({ name }).eq("id", body.id);
      if (error) return isMissingRelation(error) ? jsonError(503, "config") : jsonError(500, "failed");
    }
    return done();
  }

  if (body.action === "delete-category") {
    const { error } = await admin.from("gallery_categories").delete().eq("id", body.id);
    if (error) return isMissingRelation(error) ? jsonError(503, "config") : jsonError(500, "failed");
    return done();
  }

  if (body.action === "reorder-categories" || body.action === "reorder-items") {
    const table = body.action === "reorder-categories" ? "gallery_categories" : "gallery_items";
    const results = await Promise.all(body.ids.map((id, index) => admin.from(table).update({ position: index, ...(table === "gallery_items" ? { updated_at: now } : {}) }).eq("id", id)));
    const failure = results.find((result) => result.error);
    if (failure?.error) return isMissingRelation(failure.error) ? jsonError(503, "config") : jsonError(500, "failed");
    return done();
  }

  if (body.action === "delete-item") {
    const { error } = await admin.from("gallery_items").delete().eq("id", body.id);
    if (error) return isMissingRelation(error) ? jsonError(503, "config") : jsonError(500, "failed");
    return done();
  }

  const content = cleanItem(body);
  if (!content) return jsonError(400, "invalid");
  if (body.action === "create-item") {
    const { data: last } = await admin.from("gallery_items").select("position").order("position", { ascending: false }).limit(1);
    const { error } = await admin.from("gallery_items").insert({ ...content, position: (last?.[0]?.position ?? -1) + 1, updated_at: now });
    if (error) return isMissingRelation(error) ? jsonError(503, "config") : jsonError(500, "failed");
  } else {
    const { error } = await admin.from("gallery_items").update({ ...content, updated_at: now }).eq("id", body.id);
    if (error) return isMissingRelation(error) ? jsonError(503, "config") : jsonError(500, "failed");
  }
  return done();
}

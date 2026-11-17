import { connection } from "next/server";
import { fallbackGallery, toneAt, type GalleryCard, type GalleryCategory } from "@/lib/gallery";
import { createAdminSupabase } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  await connection();
  const locale = new URL(request.url).searchParams.get("locale") === "en" ? "en" : "ar";
  const fallback = fallbackGallery(locale);
  const admin = createAdminSupabase();
  if (!admin) return Response.json({ source: "fallback", ...fallback });
  const [categoriesResult, itemsResult] = await Promise.all([
    admin.from("gallery_categories").select("id, name, position").order("position", { ascending: true }),
    admin.from("gallery_items").select("id, category_id, title, description, media_type, image_url, video_url, position, published").eq("published", true).order("position", { ascending: true }),
  ]);
  if (categoriesResult.error || itemsResult.error) return Response.json({ source: "fallback", ...fallback });
  if ((itemsResult.data ?? []).length === 0) {
    const any = await admin.from("gallery_items").select("id", { count: "exact", head: true });
    if (any.error || (any.count ?? 0) === 0) return Response.json({ source: "fallback", ...fallback });
  }
  const categories: GalleryCategory[] = (categoriesResult.data ?? []).map((row) => ({ id: row.id, name: row.name }));
  const nameOf = new Map(categories.map((category) => [category.id, category.name]));
  const items: GalleryCard[] = (itemsResult.data ?? []).map((row, index) => ({
    id: row.id,
    title: row.title,
    categoryId: row.category_id ?? "",
    categoryLabel: nameOf.get(row.category_id ?? "") ?? "",
    description: row.description ?? "",
    mediaType: row.media_type === "video" ? "video" : "image",
    imageUrl: row.image_url ?? "",
    videoUrl: row.video_url ?? "",
    tone: toneAt(index),
  }));
  if (items.length === 0) return Response.json({ source: "fallback", ...fallback });
  return Response.json({ source: "database", categories, items }, { headers: { "Cache-Control": "no-store" } });
}

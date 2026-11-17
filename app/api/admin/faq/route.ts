import { z } from "zod";
import { requireAdminCaller } from "@/lib/admin-auth";
import { isMissingRelation } from "@/lib/db-errors";
import { cleanFaq, type FaqItem } from "@/lib/faq";
import { jsonError } from "@/lib/http";

const bodySchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create"), question: z.string(), answer: z.string(), published: z.boolean().optional() }),
  z.object({ action: z.literal("update"), id: z.uuid(), question: z.string(), answer: z.string(), published: z.boolean().optional() }),
  z.object({ action: z.literal("delete"), id: z.uuid() }),
  z.object({ action: z.literal("reorder"), ids: z.array(z.uuid()).min(1) }),
]);

type Row = {
  id: string;
  question: string;
  answer: string;
  position: number;
  published: boolean;
};

function mapRow(row: Row): FaqItem {
  return {
    id: row.id,
    question: row.question,
    answer: row.answer,
    position: row.position,
    published: row.published,
  };
}

function relationOrFailed(error: { code?: string; message?: string }) {
  return isMissingRelation(error) ? jsonError(503, "config") : jsonError(500, "failed");
}

export async function GET() {
  const gate = await requireAdminCaller();
  if (gate.denied) return gate.denied;
  if (!gate.admin) return Response.json({ configured: false, ready: false, items: [] });
  const { data, error } = await gate.admin
    .from("faq_items")
    .select("id, question, answer, position, published")
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) {
    if (isMissingRelation(error)) return Response.json({ configured: true, ready: false, items: [] });
    return jsonError(500, "failed");
  }
  return Response.json({ configured: true, ready: true, items: ((data ?? []) as Row[]).map(mapRow) });
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

  if (body.action === "create" || body.action === "update") {
    const content = cleanFaq(body);
    if (!content) return jsonError(400, "invalid");
    if (body.action === "create") {
      const { data: last } = await admin.from("faq_items").select("position").order("position", { ascending: false }).limit(1);
      const position = (last?.[0]?.position ?? -1) + 1;
      const { error } = await admin.from("faq_items").insert({ ...content, position, updated_at: now });
      if (error) return relationOrFailed(error);
    } else {
      const { error } = await admin.from("faq_items").update({ ...content, updated_at: now }).eq("id", body.id);
      if (error) return relationOrFailed(error);
    }
    return Response.json({ ok: true });
  }

  if (body.action === "delete") {
    const { error } = await admin.from("faq_items").delete().eq("id", body.id);
    if (error) return relationOrFailed(error);
    return Response.json({ ok: true });
  }

  const results = await Promise.all(
    body.ids.map((id, index) => admin.from("faq_items").update({ position: index, updated_at: now }).eq("id", id)),
  );
  const failure = results.find((result) => result.error);
  if (failure?.error) return relationOrFailed(failure.error);
  return Response.json({ ok: true });
}

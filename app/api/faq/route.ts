import { connection } from "next/server";
import { isMissingRelation } from "@/lib/db-errors";
import { createServerSupabase } from "@/lib/supabase/server";

type Row = { id: string; question: string; answer: string; position: number };

/** Published FAQs. No rows, or a missing table, means the page should use the built-in seed. */
export async function GET() {
  await connection();
  const supabase = await createServerSupabase();
  if (!supabase) return Response.json({ source: "seed", items: [] });

  const { data, error } = await supabase
    .from("faq_items")
    .select("id, question, answer, position")
    .eq("published", true)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  if (error || !data?.length) {
    if (error && !isMissingRelation(error)) return Response.json({ source: "seed", items: [] });
    return Response.json({ source: "seed", items: [] });
  }

  return Response.json({
    source: "db",
    items: (data as Row[]).map((row) => ({
      id: row.id,
      question: row.question,
      answer: row.answer,
      position: row.position,
      published: true,
    })),
  });
}

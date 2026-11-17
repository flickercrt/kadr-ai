import { z } from "zod";
import { requireAdminCaller } from "@/lib/admin-auth";
import { isMissingRelation } from "@/lib/db-errors";
import { jsonError } from "@/lib/http";
import { clearMaintenanceCache } from "@/lib/maintenance-state";

const bodySchema = z.object({
  enabled: z.boolean(),
  message: z.string().max(400).optional(),
});

function cleanMessage(value: string) {
  return [...value]
    .filter((char) => {
      const code = char.charCodeAt(0);
      return code === 9 || code === 10 || code === 13 || code > 31;
    })
    .join("")
    .trim()
    .slice(0, 400);
}

export async function GET() {
  const gate = await requireAdminCaller();
  if (gate.denied) return gate.denied;
  if (!gate.admin) return Response.json({ configured: false, ready: false, enabled: false, message: "" });

  const { data, error } = await gate.admin
    .from("site_settings")
    .select("maintenance, maintenance_message")
    .eq("id", 1)
    .maybeSingle();
  if (error) {
    if (isMissingRelation(error)) return Response.json({ configured: true, ready: false, enabled: false, message: "" });
    return jsonError(500, "failed");
  }
  return Response.json({
    configured: true,
    ready: true,
    enabled: data?.maintenance === true,
    message: data?.maintenance_message ?? "",
  });
}

export async function POST(request: Request) {
  const gate = await requireAdminCaller();
  if (gate.denied) return gate.denied;
  if (!gate.admin) return jsonError(503, "config");

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "invalid");
  const message = cleanMessage(parsed.data.message ?? "");
  const { error } = await gate.admin.from("site_settings").upsert(
    {
      id: 1,
      maintenance: parsed.data.enabled,
      maintenance_message: message,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );
  if (error) return isMissingRelation(error) ? jsonError(503, "config") : jsonError(500, "failed");
  clearMaintenanceCache();
  return Response.json({ ok: true, enabled: parsed.data.enabled, message });
}

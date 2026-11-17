import { z } from "zod";
import { requireAdminCaller } from "@/lib/admin-auth";
import { issueCourseCertificate } from "@/lib/inbox";
import { jsonError } from "@/lib/http";

const bodySchema = z.object({ userId: z.uuid(), courseId: z.uuid() });

export async function POST(request: Request) {
  const gate = await requireAdminCaller();
  if (gate.denied) return gate.denied;
  if (!gate.admin) return jsonError(503, "config");
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "invalid");
  const result = await issueCourseCertificate(gate.admin, parsed.data.userId, parsed.data.courseId);
  if ("error" in result) {
    if (result.error === "missing") return jsonError(503, "config");
    if (result.error === "incomplete") return jsonError(400, "invalid");
    return jsonError(500, "failed");
  }
  return Response.json({ ok: true, id: result.id });
}

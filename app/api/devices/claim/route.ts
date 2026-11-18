import { WHATSAPP_DEVICES } from "@/lib/auth-cookies";
import { claimDevice } from "@/lib/devices";
import { jsonError } from "@/lib/http";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { remember?: boolean } | null;
  const remember = body?.remember !== false;
  const result = await claimDevice(request, remember);
  if (!result.ok) {
    if (result.code === "device_limit") {
      return Response.json(
        { ok: false, code: "device_limit", message: result.message, whatsapp: WHATSAPP_DEVICES },
        { status: 403 },
      );
    }
    return jsonError(401, "unauthorized");
  }
  if (result.finish) await result.finish();
  return Response.json({ ok: true });
}

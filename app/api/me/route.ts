import { getMe } from "@/lib/current-user";


export async function GET() {
  const me = await getMe();
  return Response.json(me, { headers: { "Cache-Control": "no-store" } });
}

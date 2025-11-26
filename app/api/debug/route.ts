import { kv } from "@vercel/kv";

export async function GET() {
  await kv.set("ping", "pong");
  return Response.json({ ok: true, value: await kv.get("ping") });
}

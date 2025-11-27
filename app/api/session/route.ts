import { kv } from "@vercel/kv";
import { randomUUID } from "crypto";

export async function GET() {
  const sessionId = randomUUID();
  const sessionSecret = randomUUID(); // random secret per session

  // Store in KV for 10 min expiration
  await kv.set(`session:${sessionId}`, sessionSecret, { ex: 600 });

  return Response.json({
    sessionId,
    sessionSecret,
    expiresAt: Date.now() + 600000,
  });
}

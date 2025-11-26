import { kv } from "@vercel/kv";
import crypto from "crypto";

export const runtime = "nodejs";

export async function GET() {
  const sessionId = crypto.randomBytes(16).toString("hex");
  const sessionSecret = crypto.randomBytes(32).toString("hex");

  await kv.set(`session:${sessionId}`, sessionSecret, {
    ex: 600, // 10 minutes
  });

  return Response.json({
    sessionId,
    sessionSecret,
    expiresAt: Date.now() + 10 * 60 * 1000,
  });
}

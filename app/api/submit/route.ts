import { kv } from "@vercel/kv";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const {
      fid,
      username,
      score,
      difficulty,
      timestamp,
      sessionId,
      hash,
    } = await req.json();

    if (!fid || !username || typeof score !== "number") {
      return new Response("Invalid payload", { status: 400 });
    }

    // ⭐ Only Ultra Hard mode is allowed
    if (difficulty !== "ultrahard") {
      return Response.json({
        ignored: true,
        reason: "Only Ultra Hard scores are tracked.",
      });
    }

    // --- Validate anti-cheat session ---
    const sessionSecret = await kv.get<string>(`session:${sessionId}`);
    if (!sessionSecret) {
      return new Response("Invalid session", { status: 403 });
    }

    const expectedHash = crypto
      .createHmac("sha256", sessionSecret)
      .update(`${fid}:${score}:${timestamp}`)
      .digest("hex");

    if (expectedHash !== hash) {
      return new Response("Invalid signature", { status: 403 });
    }

    // Store/Update username
    await kv.hset(`user:${fid}`, {
      fid,
      username,
    });

    // ⭐ Save highest score in Ultra Hard leaderboard
    await kv.zadd("leaderboard:ultrahard", {
      member: fid.toString(),
      score,
    });

    return Response.json({ success: true });
  } catch (e) {
    console.error(e);
    return new Response("Server error", { status: 500 });
  }
}

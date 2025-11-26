import { kv } from "@vercel/kv";
import crypto from "crypto";

export const runtime = "nodejs";

const MAX_SCORE_PER_GAME = 300;
const MAX_TIME_DRIFT = 1000 * 5; // 5s

export async function POST(req: Request) {
  try {
    const { fid, username, score, timestamp, sessionId, hash } =
      await req.json();

    if (!fid || typeof score !== "number" || !timestamp || !sessionId || !hash) {
      return new Response("Invalid payload", { status: 400 });
    }

    const now = Date.now();
    if (Math.abs(now - timestamp) > MAX_TIME_DRIFT) {
      return new Response("Timestamp invalid", { status: 400 });
    }

    if (score < 0 || score > MAX_SCORE_PER_GAME) {
      return new Response("Impossible score", { status: 400 });
    }

    const sessionSecret = await kv.get<string>(`session:${sessionId}`);
    if (!sessionSecret) {
      return new Response("Session expired or invalid", { status: 400 });
    }

    const serverHash = crypto
      .createHmac("sha256", sessionSecret)
      .update(`${fid}:${score}:${timestamp}`)
      .digest("hex");

    if (serverHash !== hash) {
      return new Response("Invalid signature", { status: 403 });
    }

    await kv.hset(`user:${fid}`, {
      fid,
      username,
    });

    const currentScore = await kv.zscore("leaderboard:alltime", fid.toString());

    if (!currentScore || score > currentScore) {
      await kv.zadd("leaderboard:alltime", {
        member: fid.toString(),
        score,
      });
    }

    return Response.json({ success: true });
  } catch (e) {
    console.error(e);
    return new Response("Error submitting score", { status: 500 });
  }
}

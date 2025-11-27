import { kv } from "@vercel/kv";

// --- Helper functions to normalize KV values safely ---
function getStr(value: unknown): string {
  if (typeof value === "string") return value;
  if (value === undefined || value === null) return "";
  return String(value);
}

function getNum(value: unknown): number {
  const n = Number(value);
  return isNaN(n) ? 0 : n;
}

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

    const now = Date.now();

    // --------------------------------------------------
    // 0. Accept only Ultra Hard mode
    // --------------------------------------------------
    if (difficulty !== "ultrahard") {
      return Response.json({ ignored: true });
    }

    // --------------------------------------------------
    // 1. Score sanity check
    // Ultra Hard realistic: < 200 points
    // --------------------------------------------------
    if (typeof score !== "number" || score < 0 || score > 200) {
      return Response.json(
        { success: false, reason: "invalid_score" },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 2. Load stored session (FID + secret)
    // --------------------------------------------------
    const stored = await kv.hgetall(`session:${sessionId}`);

    if (!stored) {
      return new Response("Invalid session", { status: 403 });
    }

    // SAFE typed values
    const storedFid = getStr(stored.fid);
    const storedSecret = getStr(stored.sessionSecret);
    const storedCreatedAt = getNum(stored.createdAt);
    const storedUsed = getStr(stored.used);

    // --------------------------------------------------
    // 3. Ensure session belongs to this user
    // --------------------------------------------------
    if (String(storedFid) !== String(fid)) {
      return new Response("FID mismatch", { status: 403 });
    }

    // --------------------------------------------------
    // 4. Replay protection
    // --------------------------------------------------
    if (storedUsed === "1") {
      return new Response("Session already used", { status: 403 });
    }

    // --------------------------------------------------
    // 5. Expiration (2 minutes)
    // --------------------------------------------------
    const SESSION_MAX_AGE = 2 * 60 * 1000;
    if (now - storedCreatedAt > SESSION_MAX_AGE) {
      return new Response("Session expired", { status: 403 });
    }

    // --------------------------------------------------
    // 6. Validate HMAC signature
    // --------------------------------------------------
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(storedSecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      Uint8Array.from(Buffer.from(hash, "hex")),
      encoder.encode(`${fid}:${score}:${timestamp}`)
    );

    if (!valid) {
      return new Response("Invalid signature", { status: 403 });
    }

    // --------------------------------------------------
    // 7. Timing sanity check (anti-fast-injection)
    //
    // Ultra Hard ~2 seconds per question
    // Require at least 0.4 seconds per correct answer
    // --------------------------------------------------
    const elapsed = now - storedCreatedAt;
    const expectedMinimumTime = score * 400; // 0.4s minimum per question

    if (elapsed < expectedMinimumTime) {
      return new Response("Impossible score timing", { status: 403 });
    }

    // --------------------------------------------------
    // 8. Per-FID rate limit (max 1 submit/sec)
    // --------------------------------------------------
    const lastSubmitKey = `rate:user:${fid}:last`;
    const lastSubmit = await kv.get<number>(lastSubmitKey);

    if (lastSubmit && now - lastSubmit < 1000) {
      return new Response("Rate limited", { status: 429 });
    }

    await kv.set(lastSubmitKey, now, { ex: 2 });

    // --------------------------------------------------
    // 9. Reject if new score <= old score (keep only best)
    // --------------------------------------------------
    const existingScore = await kv.zscore(
      "leaderboard:ultrahard",
      String(fid)
    );

    if (existingScore !== null && existingScore >= score) {
      // Mark session used
      await kv.hset(`session:${sessionId}`, { used: "1" });

      return Response.json({
        success: true,
        updated: false,
        reason: "lower_or_equal_score",
      });
    }

    // --------------------------------------------------
    // 10. Save new username (safe)
    // --------------------------------------------------
    await kv.hset(`user:${fid}`, {
      fid: String(fid),
      username,
    });

    // --------------------------------------------------
    // 11. Save NEW high score
    // --------------------------------------------------
    await kv.zadd("leaderboard:ultrahard", {
      score: Number(score),
      member: String(fid),
    });

    // Mark session as used
    await kv.hset(`session:${sessionId}`, { used: "1" });

    return Response.json({ success: true, updated: true });
  } catch (err) {
    console.error("Submit error:", err);
    return new Response("Error", { status: 500 });
  }
}

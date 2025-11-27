import { kv } from "@vercel/kv";

// Helpers for KV "unknown" types
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
    const body = await req.json();
    console.log("📥 Incoming Submit Body:", body);

    const {
      fid,
      username,
      score,
      difficulty,
      timestamp,
      sessionId,
      hash,
    } = body;

    const now = Date.now();

    // -----------------------------------------------------
    // 0. Difficulty check
    // -----------------------------------------------------
    if (difficulty !== "ultrahard") {
      console.warn("⛔ Ignored: Difficulty is not Ultra Hard:", difficulty);
      return Response.json({ ignored: "difficulty_not_ultrahard" });
    }

    // -----------------------------------------------------
    // 1. Score sanity
    // -----------------------------------------------------
    if (typeof score !== "number" || score < 0 || score > 200) {
      console.warn("⛔ Invalid score:", score);
      return Response.json(
        { success: false, reason: "invalid_score" },
        { status: 400 }
      );
    }

    // -----------------------------------------------------
    // 2. Load session
    // -----------------------------------------------------
    const stored = await kv.hgetall(`session:${sessionId}`);
    console.log("📦 Loaded Session:", stored);

    if (!stored) {
      console.warn("⛔ No session found!");
      return new Response("Invalid session", { status: 403 });
    }

    const storedFid = getStr(stored.fid);
    const storedSecret = getStr(stored.sessionSecret);
    const storedCreatedAt = getNum(stored.createdAt);
    const storedUsed = getStr(stored.used);

    console.log("🔍 Parsed Stored Values:", {
      storedFid,
      storedSecret,
      storedCreatedAt,
      storedUsed
    });

    // -----------------------------------------------------
    // 3. FID mismatch
    // -----------------------------------------------------
    if (String(storedFid) !== String(fid)) {
      console.warn("⛔ FID mismatch:", { storedFid, fid });
      return new Response("FID mismatch", { status: 403 });
    }

    // -----------------------------------------------------
    // 4. Replay detection
    // -----------------------------------------------------
    if (storedUsed === "1") {
      console.warn("⛔ Replay detected: session already used");
      return new Response("Session replay", { status: 403 });
    }

    // -----------------------------------------------------
    // 5. Session expiration (2 min)
    // -----------------------------------------------------
    const SESSION_MAX_AGE = 120000;
    if (now - storedCreatedAt > SESSION_MAX_AGE) {
      console.warn("⛔ Session expired:", {
        now,
        createdAt: storedCreatedAt,
        age: now - storedCreatedAt
      });
      return new Response("Session expired", { status: 403 });
    }

    // -----------------------------------------------------
    // 6. HMAC Validation
    // -----------------------------------------------------
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(storedSecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const isValidSig = await crypto.subtle.verify(
      "HMAC",
      key,
      Uint8Array.from(Buffer.from(hash, "hex")),
      encoder.encode(`${fid}:${score}:${timestamp}`)
    );

    console.log("🔐 Signature Valid?", isValidSig);

    if (!isValidSig) {
      console.warn("⛔ Invalid signature!", { hash });
      return new Response("Invalid signature", { status: 403 });
    }

    // -----------------------------------------------------
    // 7. Timing anti-cheat
    // -----------------------------------------------------
    const elapsed = now - storedCreatedAt;
    const expectedMinimumTime = score * 400;

    console.log("⏱ Timing Check:", {
      elapsed,
      expectedMinimumTime,
      score
    });

    if (elapsed < expectedMinimumTime) {
      console.warn("⛔ Timing too fast — cheating suspected");
      return new Response("Impossible score timing", { status: 403 });
    }

    // -----------------------------------------------------
    // 8. Rate limit
    // -----------------------------------------------------
    const lastSubmitKey = `rate:user:${fid}:last`;
    const lastSubmit = await kv.get<number>(lastSubmitKey);

    console.log("🚦 Last Submit:", lastSubmit);

    if (lastSubmit && now - lastSubmit < 1000) {
      console.warn("⛔ Rate limited");
      return new Response("Rate limited", { status: 429 });
    }

    await kv.set(lastSubmitKey, now, { ex: 2 });

    // -----------------------------------------------------
    // 9. Only update if HIGHER score
    // -----------------------------------------------------
    const existingScore = await kv.zscore("leaderboard:ultrahard", String(fid));

    console.log("📊 Existing Score:", existingScore);

    if (existingScore !== null && existingScore >= score) {
      console.warn("⛔ New score not higher than previous");
      await kv.hset(`session:${sessionId}`, { used: "1" });
      return Response.json({
        success: true,
        updated: false,
        reason: "lower_or_equal_score",
      });
    }

    // -----------------------------------------------------
    // 10. Save user profile
    // -----------------------------------------------------
    await kv.hset(`user:${fid}`, {
      fid: String(fid),
      username,
    });

    // -----------------------------------------------------
    // 11. Save high score
    // -----------------------------------------------------
    console.log("🏅 Saving NEW High Score:", score);

    await kv.zadd("leaderboard:ultrahard", {
      score: Number(score),
      member: String(fid),
    });

    // Mark session used
    await kv.hset(`session:${sessionId}`, { used: "1" });

    console.log("✅ SUCCESS — Score updated");

    return Response.json({ success: true, updated: true });
  } catch (err) {
    console.error("🔥 Fatal Submit Error:", err);
    return new Response("Server error", { status: 500 });
  }
}

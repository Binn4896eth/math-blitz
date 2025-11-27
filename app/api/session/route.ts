import { kv } from "@vercel/kv";

function randomSecret(length = 32): string {
  const arr = new Uint8Array(length);
  crypto.getRandomValues(arr);
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function POST(req: Request) {
  try {
    const { fid } = await req.json();

    if (!fid) {
      return new Response("Missing fid", { status: 400 });
    }

    const sessionId = crypto.randomUUID();
    const sessionSecret = randomSecret(32);
    const createdAt = Date.now();

    await kv.hset(`session:${sessionId}`, {
      fid,               // 🔥 CRITICAL FIX
      sessionSecret,
      createdAt,
      used: "0",
    });

    await kv.expire(`session:${sessionId}`, 120);

    return Response.json({
      sessionId,
      sessionSecret,
      createdAt,
      expiresIn: 120000,
    });

  } catch (e) {
    console.error(e);
    return new Response("Session error", { status: 500 });
  }
}

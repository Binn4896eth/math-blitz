import { kv } from "@vercel/kv";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = 20;

  const start = (page - 1) * pageSize;
  const end = start + pageSize - 1;

  // ⭐ Only Ultra Hard mode ZSET
  const entries = await kv.zrange("leaderboard:ultrahard", start, end, {
    withScores: true,
    rev: true,
  });

  const leaderboard = [];

  for (let i = 0; i < entries.length; i += 2) {
    const fid = entries[i];
    const score = entries[i + 1];

    const user = await kv.hgetall(`user:${fid}`);

    leaderboard.push({
      fid,
      username: user?.username ?? "Unknown",
      score,
    });
  }

  const total = await kv.zcard("leaderboard:ultrahard");

  return Response.json({
    page,
    pages: Math.ceil(total / pageSize),
    leaderboard,
  });
}

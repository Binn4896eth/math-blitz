import { kv } from "@vercel/kv";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = 20;

  const start = (page - 1) * pageSize;
  const end = start + pageSize - 1;

  const entries = await kv.zrange("leaderboard:ultrahard", start, end, {
    withScores: true,
    rev: true,
    });


  const leaderboard: { fid: string; username: string; score: number }[] = [];

  for (let i = 0; i < entries.length; i += 2) {
    const fid = entries[i] as string;
    const score = entries[i + 1] as number;
    const user = await kv.hgetall<{ username?: string }>(`user:${fid}`);

    leaderboard.push({
      fid,
      username: user?.username ?? "Unknown",
      score,
    });
  }

  const total = await kv.zcard("leaderboard:alltime");

  return Response.json({
    page,
    pages: Math.max(1, Math.ceil(total / pageSize)),
    leaderboard,
  });
}

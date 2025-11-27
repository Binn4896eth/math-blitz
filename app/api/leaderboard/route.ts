import { kv } from "@vercel/kv";

interface LeaderboardEntry {
  fid: string;
  username: string;
  score: number;
  avatar: string;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = 20;

  const start = (page - 1) * pageSize;
  const end = start + pageSize - 1;

  // Read ONLY Ultra Hard leaderboard
  const rawEntries = (await kv.zrange("leaderboard:ultrahard", start, end, {
    withScores: true,
    rev: true,
  })) as (string | number)[];

  const fids: string[] = [];
  const rows: { fid: string; username: string; score: number }[] = [];

  for (let i = 0; i < rawEntries.length; i += 2) {
    const fid = String(rawEntries[i]);
    const score = Number(rawEntries[i + 1]);

    const user = (await kv.hgetall(`user:${fid}`)) as { username?: string } | null;

    rows.push({
      fid,
      username: user?.username ?? "Unknown",
      score,
    });

    fids.push(fid);
  }

  // Avatar loading (if using NEYNAR)
  const avatars: Record<string, string> = {};
  const fallbackAvatar = "https://warpcast.com/~/favicon.ico";

  if (fids.length > 0 && process.env.NEYNAR_API_KEY) {
    try {
      const res = await fetch(
        `https://api.neynar.com/v2/farcaster/user/bulk?fids=${fids.join(",")}`,
        {
          headers: {
            accept: "application/json",
            api_key: process.env.NEYNAR_API_KEY,
          },
        }
      );

      const data = await res.json();

      if (Array.isArray(data?.users)) {
        for (const u of data.users) {
          avatars[String(u.fid)] =
            u?.pfp?.url || u?.pfp_url || fallbackAvatar;
        }
      }
    } catch (err) {
      console.error("Avatar fetch failed:", err);
    }
  }

  const leaderboard: LeaderboardEntry[] = rows.map((r) => ({
    ...r,
    avatar: avatars[r.fid] ?? fallbackAvatar,
  }));

  const total = await kv.zcard("leaderboard:ultrahard");

  return Response.json({
    page,
    pages: Math.max(1, Math.ceil(total / pageSize)),
    leaderboard,
  });
}

"use client";

import MathGame from "@/components/MathGame";
import Leaderboard from "@/components/Leaderboard";
import { sdk } from "@farcaster/miniapp-sdk";
import { useEffect, useState } from "react";

export default function MathPage() {
  const [fid, setFid] = useState<number | null>(null);
  const [username, setUsername] = useState<string>("");
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  useEffect(() => {
    sdk.actions.ready();

    async function init() {
      try {
        // sdk.context is a Promise<MiniAppContext>
        const ctx = await sdk.context;

        if (ctx?.user) {
          setFid(ctx.user.fid);
          setUsername(ctx.user.username ?? "");
        }
      } catch (e) {
        console.error("FC context error:", e);
      }
    }

    init();
  }, []);

  if (showLeaderboard) {
    return <Leaderboard onClose={() => setShowLeaderboard(false)} />;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center pt-6 px-3">
      <button
        onClick={() => setShowLeaderboard(true)}
        className="mb-4 px-4 py-2 bg-yellow-300 rounded-xl shadow font-bold"
      >
        🏆 View Leaderboard
      </button>

      <div className="w-full max-w-md">
        <MathGame fid={fid} username={username} />
      </div>
    </div>
  );
}

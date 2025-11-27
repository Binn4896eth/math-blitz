"use client";

import Leaderboard from "@/components/Leaderboard";
import MathGame from "@/components/MathGame";
import { sdk } from "@farcaster/miniapp-sdk";
import { useEffect, useState } from "react";

export default function MathPage() {
  const [fid, setFid] = useState<number | null>(null);
  const [username, setUsername] = useState("");
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  useEffect(() => {
    sdk.actions.ready();

    async function init() {
      try {
        const ctx = await sdk.context;
        if (ctx?.user) {
          setFid(ctx.user.fid);
          setUsername(ctx.user.username ?? "");
        }
      } catch (err) {
        console.log("Miniapp context error:", err);
      }
    }

    init();
  }, []);

  if (showLeaderboard) {
    return <Leaderboard onClose={() => setShowLeaderboard(false)} />;
  }

  return (
    <div className="p-4 pt-6 flex flex-col items-center">
      <button
        onClick={() => setShowLeaderboard(true)}
        className="mb-4 px-4 py-2 bg-yellow-300 rounded-xl shadow font-bold"
      >
        🏆 View Ultra Hard Leaderboard
      </button>

      <MathGame fid={fid} username={username} />
    </div>
  );
}

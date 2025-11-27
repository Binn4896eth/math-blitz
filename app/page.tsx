"use client";

import { useEffect, useState } from "react";
import MathGame from "@/components/MathGame";
import Leaderboard from "@/components/Leaderboard";
import { sdk } from "@farcaster/miniapp-sdk";

export default function MathPage() {
  const [fid, setFid] = useState<number | null>(null);
  const [username, setUsername] = useState<string>("");
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  useEffect(() => {
    // Tell Miniapp we are ready
    sdk.actions.ready();

    // Load Farcaster context
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

  // ---- LEADERBOARD MODE ---- //
  if (showLeaderboard) {
    return (
      <Leaderboard
        onClose={() => setShowLeaderboard(false)}
        currentFid={fid}
      />
    );
  }

  // ---- MAIN GAME PAGE ---- //
  return (
    <div className="min-h-screen flex flex-col items-center justify-start pt-8 px-4 bg-gradient-to-b from-purple-50 via-blue-50 to-slate-50">

      {/* Leaderboard Button */}
      <button
        onClick={() => setShowLeaderboard(true)}
        className="
          mb-6 px-5 py-3
          rounded-2xl shadow
          font-bold text-white
          bg-purple-600 hover:bg-purple-700
          transition
        "
      >
        🏆 View Ultra Hard Leaderboard
      </button>

      {/* Game Component */}
      <div className="w-full max-w-md">
        <MathGame fid={fid} username={username} />
      </div>
    </div>
  );
}

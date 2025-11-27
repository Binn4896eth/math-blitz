"use client";

import { useEffect, useState } from "react";

interface Row {
  fid: string;
  username: string;
  score: number;
  avatar: string;
}

interface LeaderboardProps {
  onClose: () => void;
  currentFid?: number | null;
}

export default function Leaderboard({ onClose, currentFid }: LeaderboardProps) {
  const [rows, setRows] = useState<Row[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = async (p: number) => {
    setLoading(true);
    const res = await fetch(`/api/leaderboard?page=${p}`);
    const data = await res.json();
    setRows(data.leaderboard);
    setPage(data.page);
    setPages(data.pages);
    setLoading(false);
  };

  useEffect(() => {
    load(1);
  }, []);

  const rankColor = (index: number) => {
    if (index === 0) return "text-yellow-500 font-bold";
    if (index === 1) return "text-gray-400 font-bold";
    if (index === 2) return "text-amber-700 font-bold";
    return "text-slate-500";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-blue-50 to-slate-50 flex items-center justify-center p-4">

      <div className="relative max-w-md w-full bg-white/90 backdrop-blur border border-slate-200 rounded-3xl shadow-2xl p-7">

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/95 border border-gray-300 shadow-md text-gray-700 text-2xl hover:bg-gray-100 active:scale-95 transition z-20"
        >
          ×
        </button>

        <h1 className="text-2xl font-extrabold text-center mt-10 mb-6 px-6">
          🏆 Ultra Hard Leaderboard
        </h1>

        {loading ? (
          <p className="text-center text-gray-500">Loading…</p>
        ) : (
          <ul className="space-y-3">
            {rows.map((row, i) => {
              const isMe = currentFid && Number(row.fid) === currentFid;

              return (
                <li
                  key={row.fid}
                  className={`flex items-center justify-between p-3 rounded-xl border bg-white hover:bg-gray-50 transition ${isMe ? "ring-2 ring-purple-400" : ""}`}
                >

                  <div className="flex items-center gap-3">
                    <span className={rankColor(i)}>{(page - 1) * 20 + i + 1}.</span>

                    <img
                      src={row.avatar || "https://warpcast.com/~/favicon.ico"}
                      onError={(e) => (e.currentTarget.src = "https://warpcast.com/~/favicon.ico")}
                      className="w-10 h-10 rounded-full border shadow-sm"
                    />

                    <span className="font-medium">@{row.username}</span>
                  </div>

                  <span className="font-bold text-purple-700 text-lg">{row.score}</span>
                </li>
              );
            })}
          </ul>
        )}

        <div className="flex justify-between mt-6">
          <button
            disabled={page <= 1}
            onClick={() => load(page - 1)}
            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-30 hover:bg-gray-300 transition"
          >
            Prev
          </button>

          <span className="text-sm text-gray-500">
            Page {page} / {pages}
          </span>

          <button
            disabled={page >= pages}
            onClick={() => load(page + 1)}
            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-30 hover:bg-gray-300 transition"
          >
            Next
          </button>
        </div>

      </div>
    </div>
  );
}

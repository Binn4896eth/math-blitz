"use client";

import { useEffect, useState } from "react";

interface Row {
  fid: string;
  username: string;
  score: number;
}

interface LeaderboardProps {
  onClose: () => void;
}

export default function Leaderboard({ onClose }: LeaderboardProps) {
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

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow p-6 relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 text-xl"
        >
          ×
        </button>

        <h1 className="text-2xl font-bold text-center mb-4">🏆 Leaderboard</h1>

        {loading ? (
          <p className="text-center text-gray-500">Loading…</p>
        ) : (
          <ul className="space-y-3">
            {rows.map((row, i) => (
              <li
                key={`${row.fid}-${i}`}
                className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border"
              >
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">
                    {(page - 1) * 20 + i + 1}.
                  </span>
                  <span className="font-semibold">@{row.username}</span>
                </div>
                <span className="font-bold text-blue-600">{row.score}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="flex justify-between mt-6">
          <button
            className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-30"
            disabled={page <= 1}
            onClick={() => load(page - 1)}
          >
            Prev
          </button>

          <span className="text-sm text-gray-600">
            Page {page} / {pages}
          </span>

          <button
            className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-30"
            disabled={page >= pages}
            onClick={() => load(page + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import { sdk } from "@farcaster/miniapp-sdk";

type Difficulty = "easy" | "hard" | "veryhard" | "ultrahard";

interface MathGameProps {
  fid: number | null;
  username: string;
}

export default function MathGame({ fid, username }: MathGameProps) {
  const difficultyTimes: Record<Difficulty, number> = {
    easy: 10,
    hard: 5,
    veryhard: 3,
    ultrahard: 2,
  };

  // --- MUSIC --- //
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isMusicOn, setIsMusicOn] = useState(true);

  // --- GAME STATES --- //
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [timeLeft, setTimeLeft] = useState(10);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);

  const [question, setQuestion] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState<number>(0);
  const [answers, setAnswers] = useState<number[]>([]);

  const [gameOver, setGameOver] = useState(false);
  const [lastDifficulty, setLastDifficulty] = useState<Difficulty | null>(null);

  const submittedRef = useRef(false);

  // --- SETUP AUDIO --- //
  useEffect(() => {
    if (!audioRef.current) {
      const audio = new Audio("/math-blitz-theme.mp3");
      audio.loop = true;
      audio.volume = 0.35;
      audioRef.current = audio;
    }
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  // --- CONTROL MUSIC --- //
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isMusicOn && difficulty && !gameOver) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [isMusicOn, difficulty, gameOver]);

  // --- QUESTION GENERATOR --- //
  const generateQuestion = () => {
    const type = Math.floor(Math.random() * 3);
    let a = 1 + Math.floor(Math.random() * 10);
    let b = 1 + Math.floor(Math.random() * 10);
    let correct = 0;

    if (type === 0) {
      correct = a + b;
      setQuestion(`${a} + ${b}`);
    } else if (type === 1) {
      correct = a * b;
      setQuestion(`${a} × ${b}`);
    } else {
      const product = a * b;
      correct = a;
      setQuestion(`${product} ÷ ${b}`);
    }

    let wrong = correct + (Math.random() > 0.5 ? 1 : -1);
    if (wrong === correct) wrong += 2;

    setAnswers(Math.random() > 0.5 ? [correct, wrong] : [wrong, correct]);
    setCorrectAnswer(correct);
  };

  // --- START GAME --- //
  const startGame = (d: Difficulty) => {
    submittedRef.current = false;
    setDifficulty(d);
    setLastDifficulty(d);
    setLives(3);
    setScore(0);
    setTimeLeft(difficultyTimes[d]);
    setGameOver(false);
    generateQuestion();

    if (audioRef.current && isMusicOn) {
      audioRef.current.play().catch(() => {});
    }
  };

  // --- TIMER --- //
  useEffect(() => {
    if (!difficulty || gameOver) return;

    if (timeLeft <= 0) {
      setLives((prev) => {
        const newLives = prev - 1;
        if (newLives <= 0) {
          setGameOver(true);
          return 0;
        }
        setTimeLeft(difficultyTimes[difficulty]);
        generateQuestion();
        return newLives;
      });
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, difficulty, gameOver]);

  // --- ANSWER CLICK --- //
  const chooseAnswer = (value: number) => {
    if (!difficulty) return;

    if (value === correctAnswer) setScore((s) => s + 1);
    else {
      setLives((prev) => {
        const newLives = prev - 1;
        if (newLives <= 0) {
          setGameOver(true);
          return 0;
        }
        return newLives;
      });
    }

    if (!gameOver) {
      setTimeLeft(difficultyTimes[difficulty]);
      generateQuestion();
    }
  };

  const toggleMusic = () => setIsMusicOn((prev) => !prev);

  // --- SHARE CAST BUTTON --- //
  const shareToCast = () => {
    const msg = `🔥 I scored ${score} points in Ultra Hard Mode on Math Blitz!\nPlay now: https://yourdomain.xyz`;

    sdk.actions.openUrl({
      url: `https://warpcast.com/~/compose?text=${encodeURIComponent(msg)}`,
    });
  };

  // --- SECURE SCORE SUBMIT --- //
  async function submitScoreSecure(fid: number | null, username: string, score: number) {
    if (!fid) return;

    try {
      const sessionRes = await fetch("/api/session");
      const session = await sessionRes.json();
      const { sessionId, sessionSecret } = session;

      const timestamp = Date.now();
      const encoder = new TextEncoder();

      const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(sessionSecret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );

      const signature = await crypto.subtle.sign(
        "HMAC",
        key,
        encoder.encode(`${fid}:${score}:${timestamp}`)
      );

      const hash = [...new Uint8Array(signature)]
        .map((x) => x.toString(16).padStart(2, "0"))
        .join("");

      await fetch("/api/submit", {
        method: "POST",
        body: JSON.stringify({
          fid,
          username,
          score,
          difficulty: lastDifficulty,
          timestamp,
          sessionId,
          hash,
        }),
      });
    } catch (err) {
      console.error("Submit score failed:", err);
    }
  }

  // --- SUBMIT SCORE WHEN GAME ENDS --- //
  useEffect(() => {
    if (gameOver && fid && !submittedRef.current) {
      submittedRef.current = true;
      submitScoreSecure(fid, username, score);
    }
  }, [gameOver, fid, username, score]);

  // --- GAME OVER PAGE --- //
  if (gameOver) {
  return (
    <div className="w-full bg-gradient-to-b from-purple-50 via-blue-50 to-slate-50 px-4 pt-10 pb-10">
      <div className="max-w-sm w-full mx-auto bg-white/90 border border-slate-200 rounded-3xl shadow-xl px-6 py-10 text-center relative overflow-hidden">

        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-purple-300/30 to-transparent blur-3xl" />
        </div>

        <h1 className="text-3xl font-bold text-slate-900 mb-3">Game Over</h1>

        <div className="mt-3 mb-8">
          <p className="text-[12px] tracking-[0.25em] text-slate-500 uppercase mb-3">
            YOUR SCORE
          </p>

          <div className="relative inline-block">
            <span className="absolute inset-0 bg-purple-300 blur-2xl opacity-30 rounded-full"></span>
            <p className="relative text-8xl font-extrabold text-purple-700 drop-shadow">{score}</p>
          </div>

          <p className="text-sm text-slate-600 mt-4">
            {score === 0 ? "Try again!" :
             score < 5 ? "Warm-up complete!" :
             score < 10 ? "Nice run!" :
             "Incredible score!"}
          </p>
        </div>

        {lastDifficulty && (
          <div className="mb-6">
            <p className="text-[11px] text-slate-500 mb-2">MODE</p>
            <span className="px-4 py-1.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200">
              {lastDifficulty === "easy" ? "Easy" :
               lastDifficulty === "hard" ? "Hard" :
               lastDifficulty === "veryhard" ? "Very Hard" :
               "Ultra Hard"}
            </span>
          </div>
        )}

        <button
          onClick={shareToCast}
          className="w-full py-3 mb-5 rounded-xl bg-purple-600 text-white font-semibold shadow hover:bg-purple-700 transition"
        >
          🔥 Share on Farcaster
        </button>

        <button
          onClick={toggleMusic}
          className="mb-6 px-4 py-2 rounded-full border border-slate-200 bg-slate-50 text-xs text-slate-600"
        >
          {isMusicOn ? "🔊 Music On" : "🔇 Music Off"}
        </button>

        <p className="text-xs text-slate-500 mb-3">Play Again</p>

        <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
          <button onClick={() => startGame("easy")} className="bg-emerald-100 text-emerald-700 py-3 rounded-xl text-xs font-medium shadow">Easy • 10s</button>
          <button onClick={() => startGame("hard")} className="bg-sky-100 text-sky-700 py-3 rounded-xl text-xs font-medium shadow">Hard • 5s</button>
          <button onClick={() => startGame("veryhard")} className="bg-orange-100 text-orange-700 py-3 rounded-xl text-xs font-medium shadow">Very Hard • 3s</button>
          <button onClick={() => startGame("ultrahard")} className="bg-rose-100 text-rose-700 py-3 rounded-xl text-xs font-medium shadow">Ultra Hard • 2s</button>
        </div>

      </div>
    </div>
  );
}




  // --- HOME SCREEN --- //
  if (!difficulty) {
  return (
    <div className="w-full bg-gradient-to-b from-purple-50 via-blue-50 to-slate-50 px-4 pt-10 pb-10">
      <div className="max-w-sm w-full mx-auto bg-white/90 border border-slate-200 rounded-3xl shadow-xl px-6 py-8 text-center">

        <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
          Math Blitz
        </h1>
        <p className="mb-6 text-sm text-slate-600">
          Test your reflex. Solve fast. Climb the leaderboard.
        </p>

        <button
          onClick={toggleMusic}
          className="mb-6 px-4 py-2 rounded-full border border-slate-200 bg-slate-50 text-xs text-slate-600"
        >
          {isMusicOn ? "🔊 Music On" : "🔇 Music Off"}
        </button>

        <p className="text-xs text-slate-500 mb-3">Choose Difficulty</p>

        <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto">

          <button onClick={() => startGame("easy")}
            className="bg-emerald-100 text-emerald-700 py-3 rounded-xl text-sm font-medium shadow">
            Easy • 10s
          </button>

          <button onClick={() => startGame("hard")}
            className="bg-sky-100 text-sky-700 py-3 rounded-xl text-sm font-medium shadow">
            Hard • 5s
          </button>

          <button onClick={() => startGame("veryhard")}
            className="bg-orange-100 text-orange-700 py-3 rounded-xl text-sm font-medium shadow">
            Very Hard • 3s
          </button>

          <button onClick={() => startGame("ultrahard")}
            className="bg-rose-100 text-rose-700 py-3 rounded-xl text-sm font-medium shadow">
            Ultra Hard • 2s
          </button>

        </div>

      </div>
    </div>
  );
}



  // --- IN-GAME SCREEN --- //
  return (
    <div className="text-center p-4">
      <div className="flex items-center justify-between mb-4 max-w-md mx-auto">
        <div className="text-left">
          <p className="text-sm">Lives: ❤️ {lives}</p>
          <p className="text-sm">Score: {score}</p>
        </div>

        <button
          onClick={toggleMusic}
          className="px-3 py-1 rounded-full border text-xs"
        >
          {isMusicOn ? "🔊 On" : "🔇 Off"}
        </button>

        <p className="text-sm">Time: {timeLeft}s</p>
      </div>

      <p className="text-4xl font-bold mb-6">{question}</p>

      <div className="flex justify-center gap-6">
        <button
          onClick={() => chooseAnswer(answers[0])}
          className="bg-blue-500 text-white px-6 py-4 text-xl rounded-xl min-w-[110px]"
        >
          {answers[0]}
        </button>

        <button
          onClick={() => chooseAnswer(answers[1])}
          className="bg-orange-500 text-white px-6 py-4 text-xl rounded-xl min-w-[110px]"
        >
          {answers[1]}
        </button>
      </div>
    </div>
  );
}

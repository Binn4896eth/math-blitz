"use client";
import { useState, useEffect, useRef } from "react";

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

  // --- MUSIC STATE & REF ---
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isMusicOn, setIsMusicOn] = useState(true);

  // --- GAME STATES ---
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

  // --- SETUP AUDIO ONCE ---
  useEffect(() => {
    if (!audioRef.current) {
      const audio = new Audio("/math-blitz-theme.mp3");
      audio.loop = true;
      audio.volume = 0.4;
      audioRef.current = audio;
    }

    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  // --- CONTROL MUSIC ---
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isMusicOn && difficulty && !gameOver) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [isMusicOn, difficulty, gameOver]);

  // --- GENERATE QUESTION ---
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
      const divisor = b;
      const product = a * b;
      correct = a;
      setQuestion(`${product} ÷ ${divisor}`);
    }

    let wrong = correct + (Math.random() > 0.5 ? 1 : -1);
    if (wrong === correct) wrong += 2;

    setAnswers(Math.random() > 0.5 ? [correct, wrong] : [wrong, correct]);
    setCorrectAnswer(correct);
  };

  // --- START GAME ---
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

  // --- TIMER ---
  useEffect(() => {
    if (!difficulty || gameOver) return;

    if (timeLeft <= 0) {
      setLives((prevLives) => {
        const newLives = prevLives - 1;
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

  // --- CHOOSE ANSWER ---
  const chooseAnswer = (value: number) => {
    if (!difficulty) return;

    if (value === correctAnswer) {
      setScore((s) => s + 1);
    } else {
      setLives((prevLives) => {
        const newLives = prevLives - 1;
        if (newLives <= 0) {
          setGameOver(true);
          return 0;
        }
        return newLives;
      });
    }

    if (!gameOver && difficulty) {
      setTimeLeft(difficultyTimes[difficulty]);
      generateQuestion();
    }
  };

  const toggleMusic = () => {
    setIsMusicOn((prev) => !prev);
  };

  // --- SECURE ANTI-CHEAT SCORE SUBMIT ---
  async function submitScoreSecure(
    fid: number | null,
    username: string,
    score: number
  ) {
    if (!fid) return; // do nothing if no user
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
          timestamp,
          sessionId,
          hash,
        }),
      });
    } catch (err) {
      console.error("Submit score failed:", err);
    }
  }

  // --- AUTO-SUBMIT SCORE WHEN GAME ENDS ---
  useEffect(() => {
    if (gameOver && fid && !submittedRef.current) {
      submittedRef.current = true;
      submitScoreSecure(fid, username, score);
    }
  }, [gameOver, fid, username, score]);

  // --- GAME OVER SCREEN ---
  if (gameOver) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sky-50 via-emerald-50 to-slate-50 px-4">
        <div className="max-w-sm w-full bg-white/90 border border-slate-200 rounded-3xl shadow-lg px-6 py-8 text-center relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-b from-emerald-200/40 to-transparent blur-2xl" />
          </div>

          <h1 className="text-2xl font-semibold text-slate-800 mb-2">
            Game Over
          </h1>

          <div className="mt-4 mb-6">
            <p className="text-[11px] tracking-[0.25em] text-slate-500 uppercase mb-2">
              Score
            </p>

            <div className="relative inline-block">
              <span className="absolute inset-0 bg-emerald-300 blur-2xl opacity-30 rounded-full"></span>
              <p className="relative text-7xl font-extrabold text-emerald-600 drop-shadow-sm">
                {score}
              </p>
            </div>

            <p className="text-xs text-slate-500 mt-3">
              {score === 0
                ? "Try again!"
                : score < 5
                ? "Warm-up complete."
                : score < 10
                ? "Nice run!"
                : "Amazing!"}
            </p>
          </div>

          {lastDifficulty && (
            <div className="mb-6">
              <p className="text-[11px] text-slate-500 mb-2 text-center">
                Mode
              </p>
              <div className="flex justify-center">
                <span
                  className={`px-4 py-1.5 rounded-full text-xs font-medium border
              ${
                lastDifficulty === "easy"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : lastDifficulty === "hard"
                  ? "bg-sky-50 text-sky-700 border-sky-200"
                  : lastDifficulty === "veryhard"
                  ? "bg-orange-50 text-orange-700 border-orange-200"
                  : "bg-rose-50 text-rose-700 border-rose-200"
              }`}
                >
                  {lastDifficulty === "veryhard"
                    ? "Very Hard"
                    : lastDifficulty === "ultrahard"
                    ? "Ultra Hard"
                    : lastDifficulty.charAt(0).toUpperCase() +
                      lastDifficulty.slice(1)}
                </span>
              </div>
            </div>
          )}

          <button
            onClick={toggleMusic}
            className="mb-5 px-4 py-2 rounded-full border border-slate-200 bg-slate-50 text-xs text-slate-600"
          >
            {isMusicOn ? "🔊 Music On" : "🔇 Music Off"}
          </button>

          <p className="text-xs text-slate-500 mb-3">Play again:</p>

          <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
            <button
              onClick={() => startGame("easy")}
              className="bg-emerald-100 text-emerald-700 py-3 rounded-xl text-xs font-medium"
            >
              Easy • 10s
            </button>
            <button
              onClick={() => startGame("hard")}
              className="bg-sky-100 text-sky-700 py-3 rounded-xl text-xs font-medium"
            >
              Hard • 5s
            </button>
            <button
              onClick={() => startGame("veryhard")}
              className="bg-orange-100 text-orange-700 py-3 rounded-xl text-xs font-medium"
            >
              Very Hard • 3s
            </button>
            <button
              onClick={() => startGame("ultrahard")}
              className="bg-rose-100 text-rose-700 py-3 rounded-xl text-xs font-medium"
            >
              Ultra • 2s
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- DIFFICULTY SELECTION ---
  if (!difficulty) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sky-50 via-emerald-50 to-slate-50 px-4">
        <div className="max-w-sm w-full bg-white/90 border border-slate-200 rounded-3xl shadow-md px-6 py-8 text-center">
          <h1 className="text-3xl font-semibold mb-3 text-slate-800">
            Math Blitz
          </h1>
          <p className="mb-4 text-sm text-slate-600">Choose a difficulty.</p>

          <button
            onClick={toggleMusic}
            className="mb-4 px-4 py-2 rounded-full border border-slate-200 bg-slate-50 text-xs text-slate-600"
          >
            {isMusicOn ? "🔊 Music On" : "🔇 Music Off"}
          </button>

          <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
            <button
              onClick={() => startGame("easy")}
              className="bg-emerald-100 text-emerald-700 py-3 rounded-xl text-sm font-medium"
            >
              Easy • 10s
            </button>
            <button
              onClick={() => startGame("hard")}
              className="bg-sky-100 text-sky-700 py-3 rounded-xl text-sm font-medium"
            >
              Hard • 5s
            </button>
            <button
              onClick={() => startGame("veryhard")}
              className="bg-orange-100 text-orange-700 py-3 rounded-xl text-sm font-medium"
            >
              Very Hard • 3s
            </button>
            <button
              onClick={() => startGame("ultrahard")}
              className="bg-rose-100 text-rose-700 py-3 rounded-xl text-sm font-medium"
            >
              Ultra • 2s
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- MAIN GAME UI ---
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
          className="bg-blue-500 text-white px-6 py-4 text-xl rounded-xl min-w-[100px]"
        >
          {answers[0]}
        </button>

        <button
          onClick={() => chooseAnswer(answers[1])}
          className="bg-orange-500 text-white px-6 py-4 text-xl rounded-xl min-w-[100px]"
        >
          {answers[1]}
        </button>
      </div>
    </div>
  );
}

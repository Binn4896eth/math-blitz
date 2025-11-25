"use client";
import { useState, useEffect, useRef } from "react";

type Difficulty = "easy" | "hard" | "veryhard" | "ultrahard";

export default function MathGame() {
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

  // --- SETUP AUDIO ONCE ---
  useEffect(() => {
    if (!audioRef.current) {
      const audio = new Audio("/math-blitz-theme.mp3");
      audio.loop = true;
      audio.volume = 0.4; // calm / educational vibe, not too loud
      audioRef.current = audio;
    }

    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  // --- CONTROL MUSIC BASED ON STATE ---
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isMusicOn && difficulty && !gameOver) {
      // Browser might block autoplay until user interaction,
      // but this will work once they click a button (like difficulty select).
      audio
        .play()
        .catch(() => {
          // ignore autoplay errors
        });
    } else {
      audio.pause();
    }
  }, [isMusicOn, difficulty, gameOver]);

  // --- GENERATE RANDOM QUESTION ---
  const generateQuestion = () => {
    const type = Math.floor(Math.random() * 3); // 0 add, 1 multiply, 2 divide
    let a = 1 + Math.floor(Math.random() * 10);
    let b = 1 + Math.floor(Math.random() * 10);
    let correct = 0;

    if (type === 0) {
      // addition
      correct = a + b;
      setQuestion(`${a} + ${b}`);
    } else if (type === 1) {
      // multiplication
      correct = a * b;
      setQuestion(`${a} × ${b}`);
    } else {
      // division (clean integer)
      const divisor = b;
      const product = a * b;
      correct = a;
      setQuestion(`${product} ÷ ${divisor}`);
    }

    // false answer generation
    let wrong = correct + (Math.random() > 0.5 ? 1 : -1);
    if (wrong === correct) wrong += 2;

    // shuffle positions
    setAnswers(Math.random() > 0.5 ? [correct, wrong] : [wrong, correct]);
    setCorrectAnswer(correct);
  };

  // --- START GAME WITH DIFFICULTY ---
  const startGame = (d: Difficulty) => {
    setDifficulty(d);
    setLastDifficulty(d);
    setLives(3);
    setScore(0);
    setTimeLeft(difficultyTimes[d]);
    setGameOver(false);
    generateQuestion();

    // Try to start music when player explicitly starts game
    if (audioRef.current && isMusicOn) {
      audioRef.current
        .play()
        .catch(() => {
          // ignore autoplay block
        });
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

        // still alive → next question & reset timer
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

  // --- USER SELECTS ANSWER ---
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

    // reset timer + new question (if not game over)
    if (!gameOver) {
      setTimeLeft(difficultyTimes[difficulty]);
      generateQuestion();
    }
  };

  const toggleMusic = () => {
    setIsMusicOn((prev) => !prev);
  };

  // --- GAME OVER SCREEN ---
  if (gameOver) {
    return (
      <div className="text-center mt-10 px-4">
        <h1 className="text-3xl font-bold mb-2">Game Over</h1>
        <p className="text-lg mb-1">Score: {score}</p>
        {lastDifficulty && (
          <p className="text-sm text-gray-600 mb-4">
            Difficulty played:{" "}
            <span className="font-semibold capitalize">
              {lastDifficulty === "veryhard"
                ? "Very Hard"
                : lastDifficulty === "ultrahard"
                ? "Ultra Hard"
                : lastDifficulty}
            </span>
          </p>
        )}

        <button
          onClick={toggleMusic}
          className="mb-4 px-4 py-2 rounded-full border text-sm"
        >
          {isMusicOn ? "🔊 Music On" : "🔇 Music Off"}
        </button>

        <h2 className="text-xl font-semibold mb-3">Play Again – Select Difficulty</h2>

        <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
          <button
            onClick={() => startGame("easy")}
            className="bg-green-500 text-white py-3 rounded-lg text-sm"
          >
            Easy (10s)
          </button>
          <button
            onClick={() => startGame("hard")}
            className="bg-yellow-500 text-white py-3 rounded-lg text-sm"
          >
            Hard (5s)
          </button>
          <button
            onClick={() => startGame("veryhard")}
            className="bg-red-500 text-white py-3 rounded-lg text-sm"
          >
            Very Hard (3s)
          </button>
          <button
            onClick={() => startGame("ultrahard")}
            className="bg-purple-600 text-white py-3 rounded-lg text-sm"
          >
            Ultra Hard (2s)
          </button>
        </div>
      </div>
    );
  }

  // --- DIFFICULTY SELECTION SCREEN ---
  if (!difficulty) {
    return (
      <div className="text-center mt-10 px-4">
        <h1 className="text-3xl font-bold mb-4">Math Blitz</h1>
        <p className="mb-4 text-gray-700">
          Choose a difficulty and see how long you can survive!
        </p>

        <button
          onClick={toggleMusic}
          className="mb-4 px-4 py-2 rounded-full border text-sm"
        >
          {isMusicOn ? "🔊 Music On" : "🔇 Music Off"}
        </button>

        <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
          <button
            onClick={() => startGame("easy")}
            className="bg-green-500 text-white py-3 rounded-lg text-sm"
          >
            Easy (10s)
          </button>
          <button
            onClick={() => startGame("hard")}
            className="bg-yellow-500 text-white py-3 rounded-lg text-sm"
          >
            Hard (5s)
          </button>
          <button
            onClick={() => startGame("veryhard")}
            className="bg-red-500 text-white py-3 rounded-lg text-sm"
          >
            Very Hard (3s)
          </button>
          <button
            onClick={() => startGame("ultrahard")}
            className="bg-purple-600 text-white py-3 rounded-lg text-sm"
          >
            Ultra Hard (2s)
          </button>
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

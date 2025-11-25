"use client";
import { useState, useEffect } from "react";

type Difficulty = "easy" | "hard" | "veryhard" | "ultrahard";

const difficultyTimes: Record<Difficulty, number> = {
  easy: 10,
  hard: 5,
  veryhard: 3,
  ultrahard: 2,
};

const difficultyLabels: Record<Difficulty, string> = {
  easy: "Easy (10s / question)",
  hard: "Hard (5s / question)",
  veryhard: "Very Hard (3s / question)",
  ultrahard: "Ultra Hard (2s / question)",
};

export default function MathGame() {
  // --- GAME STATES ---
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);

  const [question, setQuestion] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState<number>(0);
  const [answers, setAnswers] = useState<number[]>([]);

  const [gameOver, setGameOver] = useState(false);

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
      // division with clean result
      const divisor = b;
      const product = a * b;
      correct = a; // product ÷ divisor = a
      setQuestion(`${product} ÷ ${divisor}`);
    }

    // false answer
    let wrong = correct + (Math.random() > 0.5 ? 1 : -1);
    if (wrong === correct) wrong += 2;

    // shuffle left/right positions
    setAnswers(Math.random() > 0.5 ? [correct, wrong] : [wrong, correct]);
    setCorrectAnswer(correct);
  };

  // --- START / RESTART GAME WITH DIFFICULTY ---
  const startGame = (d: Difficulty) => {
    setDifficulty(d);
    setLives(3);
    setScore(0);
    setGameOver(false);
    setTimeLeft(difficultyTimes[d]);
    generateQuestion();
  };

  // --- TIMER EFFECT (per question) ---
  useEffect(() => {
    if (!difficulty || gameOver) return;

    if (timeLeft <= 0) {
      // time ran out → lose a life
      setLives((prevLives) => {
        const newLives = prevLives - 1;

        if (newLives <= 0) {
          setGameOver(true);
          return 0;
        }

        // still alive → next question + reset timer
        setTimeLeft(difficultyTimes[difficulty]);
        generateQuestion();
        return newLives;
      });

      return;
    }

    const id = setTimeout(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);

    return () => clearTimeout(id);
  }, [timeLeft, difficulty, gameOver]);

  // --- USER SELECTS ANSWER ---
  const chooseAnswer = (value: number) => {
    if (!difficulty || gameOver) return;

    if (value === correctAnswer) {
      setScore((s) => s + 1);
      setTimeLeft(difficultyTimes[difficulty]);
      generateQuestion();
    } else {
      setLives((prevLives) => {
        const newLives = prevLives - 1;
        if (newLives <= 0) {
          setGameOver(true);
          return 0;
        }
        // still alive → next question
        setTimeLeft(difficultyTimes[difficulty]);
        generateQuestion();
        return newLives;
      });
    }
  };

  // --- DIFFICULTY SELECTION SCREEN ---
  if (!difficulty && !gameOver) {
    return (
      <div className="text-center p-4">
        <h1 className="text-3xl font-bold mb-4">Math Blitz</h1>
        <p className="mb-6 text-gray-700">
          Choose difficulty. You have 3 lives. Answer before the timer runs out!
        </p>

        <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
          <button
            onClick={() => startGame("easy")}
            className="bg-green-500 text-white py-3 rounded-lg text-sm font-semibold"
          >
            Easy<br />10s
          </button>
          <button
            onClick={() => startGame("hard")}
            className="bg-yellow-500 text-white py-3 rounded-lg text-sm font-semibold"
          >
            Hard<br />5s
          </button>
          <button
            onClick={() => startGame("veryhard")}
            className="bg-red-500 text-white py-3 rounded-lg text-sm font-semibold"
          >
            Very Hard<br />3s
          </button>
          <button
            onClick={() => startGame("ultrahard")}
            className="bg-purple-600 text-white py-3 rounded-lg text-sm font-semibold"
          >
            Ultra Hard<br />2s
          </button>
        </div>
      </div>
    );
  }

  // --- GAME OVER SCREEN ---
  if (gameOver && difficulty) {
    return (
      <div className="text-center p-4">
        <h1 className="text-3xl font-bold mb-4">Game Over</h1>
        <p className="text-lg mb-2">Your Score: <span className="font-semibold">{score}</span></p>
        <p className="text-md mb-6">
          Difficulty played:{" "}
          <span className="font-semibold">
            {difficultyLabels[difficulty]}
          </span>
        </p>

        <h2 className="text-xl font-semibold mb-3">Play Again</h2>
        <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
          <button
            onClick={() => startGame("easy")}
            className="bg-green-500 text-white py-3 rounded-lg text-sm font-semibold"
          >
            Easy<br />10s
          </button>
          <button
            onClick={() => startGame("hard")}
            className="bg-yellow-500 text-white py-3 rounded-lg text-sm font-semibold"
          >
            Hard<br />5s
          </button>
          <button
            onClick={() => startGame("veryhard")}
            className="bg-red-500 text-white py-3 rounded-lg text-sm font-semibold"
          >
            Very Hard<br />3s
          </button>
          <button
            onClick={() => startGame("ultrahard")}
            className="bg-purple-600 text-white py-3 rounded-lg text-sm font-semibold"
          >
            Ultra Hard<br />2s
          </button>
        </div>
      </div>
    );
  }

  // --- MAIN GAME UI ---
  return (
    <div className="text-center p-4">
      <div className="flex justify-between items-center mb-3 text-sm">
        <span className="px-3 py-1 rounded-full bg-gray-200 text-gray-800">
          Lives: {"❤️".repeat(lives)}{" ".repeat(3 - lives)}
        </span>
        {difficulty && (
          <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 capitalize">
            {difficultyLabels[difficulty].split(" ")[0]} {/* Easy / Hard / Very / Ultra */}
          </span>
        )}
      </div>

      <div className="flex justify-between items-center mb-4 text-sm">
        <span>Score: <span className="font-semibold">{score}</span></span>
        <span className="text-red-600 font-semibold">
          Time: {timeLeft}s
        </span>
      </div>

      <p className="text-4xl font-bold mb-6">{question}</p>

      {/* Answer buttons: left & right */}
      <div className="flex justify-center gap-4">
        <button
          onClick={() => chooseAnswer(answers[0])}
          className="flex-1 max-w-[140px] bg-blue-500 active:bg-blue-600 text-white px-4 py-4 text-xl rounded-xl"
        >
          {answers[0]}
        </button>

        <button
          onClick={() => chooseAnswer(answers[1])}
          className="flex-1 max-w-[140px] bg-orange-500 active:bg-orange-600 text-white px-4 py-4 text-xl rounded-xl"
        >
          {answers[1]}
        </button>
      </div>
    </div>
  );
}

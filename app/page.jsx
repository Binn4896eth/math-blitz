"use client";

import MathGame from "@/components/MathGame";

export default function MathPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <MathGame />
      </div>
    </div>
  );
}

"use client";

import MathGame from "@/components/MathGame";
import { sdk } from '@farcaster/miniapp-sdk';
import { useEffect } from 'react';

export default function MathPage() {
  useEffect(() => {
        sdk.actions.ready();
    }, []);
  return (
    <div className="min-h-screen bg-gray-100 flex items-start justify-center py-6 px-3">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-4">
        
        </h1>
        <MathGame />
      </div>
    </div>
  );
}

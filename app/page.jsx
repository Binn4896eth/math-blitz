"use client";

import MathGame from "@/components/MathGame";
import { sdk } from '@farcaster/miniapp-sdk';
import { useEffect } from 'react';

export default function MathPage() {
  useEffect(() => {
        sdk.actions.ready();
    }, []);
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <MathGame />
      </div>
    </div>
  );
}

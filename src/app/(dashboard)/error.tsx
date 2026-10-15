"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

// Shown when a page crashes, instead of the default Next.js error screen.
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="max-w-md mx-auto py-16 text-center">
      <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-amber-500" />
      <h2 className="text-lg font-bold">This page could not be shown</h2>
      <p className="mt-1 text-sm text-gray-500">Something went wrong while loading it. Your data is safe. Try again, or go back to the previous page.</p>
      <div className="mt-4 flex justify-center gap-2">
        <button onClick={reset} className="inline-flex items-center gap-2 rounded-lg bg-yellow-400 px-4 py-2 text-sm font-semibold text-gray-950 hover:bg-yellow-300">
          <RotateCcw className="h-4 w-4" /> Try again
        </button>
        <button onClick={() => history.back()} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold">
          Go back
        </button>
      </div>
    </div>
  );
}

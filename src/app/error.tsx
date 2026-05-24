"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[First Day] Runtime error:", error);
  }, [error]);

  return (
    <div className="fixed inset-0 z-[100] tile-substrate overflow-hidden flex items-center justify-center">
      <div className="flex flex-col items-center gap-8 px-6 max-w-md w-full">
        <h1
          className="text-4xl sm:text-5xl text-white text-center uppercase tracking-wider"
          style={{ fontFamily: "var(--font-bebas), system-ui, sans-serif" }}
        >
          Something broke
        </h1>

        <p className="text-white/50 text-center text-base leading-relaxed">
          An unexpected error occurred. Your progress is safe — try again or head back to start fresh.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full">
          <button
            onClick={reset}
            className="flex-1 py-4 px-8 text-black font-bold uppercase tracking-wider text-base bg-[#cc5533] transition-all duration-200 hover:brightness-110 active:scale-[0.97]"
          >
            Try again
          </button>

          <a
            href="/"
            className="flex-1 py-4 px-8 text-white font-bold uppercase tracking-wider text-base text-center border border-white/10 transition-all duration-200 hover:border-white/30 active:scale-[0.97]"
          >
            Go home
          </a>
        </div>

        {error.digest && (
          <p className="text-white/20 text-xs text-center font-mono">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}

"use client";

import { Button } from "@/src/components/ui/Button";

export function ErrorFallback({
  reset,
  compact = false,
}: {
  reset: () => void;
  compact?: boolean;
}) {
  return (
    <div
      className={
        compact
          ? "flex min-h-[40vh] items-center justify-center"
          : "page-shell flex min-h-screen items-center justify-center"
      }
    >
      <div className="relative z-10 max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-2xl">
        <h2 className="mb-2 font-tech text-2xl font-bold text-white">Une erreur est survenue</h2>
        <p className="mb-6 text-slate-400">
          Impossible d&apos;afficher cette page. Réessaie ou reviens plus tard.
        </p>
        <Button onClick={reset} variant="primary">
          Réessayer
        </Button>
      </div>
    </div>
  );
}

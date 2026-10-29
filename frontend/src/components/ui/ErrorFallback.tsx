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
          ? "flex min-h-[40vh] items-center"
          : "page-shell flex min-h-screen items-center px-6"
      }
    >
      <div className="relative z-10 w-full max-w-2xl rule-thick pt-4">
        <p className="label text-live-text">Carton rouge</p>
        <h2 className="display mt-2 text-6xl text-ink md:text-8xl">Hors-jeu.</h2>
        <p className="editorial mt-4 mb-8 text-xl text-ink/70">
          Impossible d&apos;afficher cette page. Réessaie ou reviens plus tard.
        </p>
        <Button onClick={reset} variant="primary">
          Réessayer <span className="arrow">→</span>
        </Button>
      </div>
    </div>
  );
}

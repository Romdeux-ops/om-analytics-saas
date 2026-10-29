import { cn } from "@/src/lib/ui/cn";

export type ResultLetter = "V" | "N" | "D";

const LABELS: Record<ResultLetter, string> = { V: "Victoire", N: "Nul", D: "Défaite" };

/**
 * Résultat codé par la forme, pas par la couleur :
 * carré plein (victoire), carré grisé (nul), contour seul (défaite).
 */
export function ResultMark({
  result,
  size = "md",
  className,
}: {
  result: ResultLetter;
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <span
      title={LABELS[result]}
      aria-label={LABELS[result]}
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden border border-current font-mono font-bold",
        size === "sm" ? "h-5 w-5 text-[10px]" : "h-7 w-7 text-xs",
        className,
      )}
    >
      {result === "V" && <span className="absolute inset-0 bg-current" aria-hidden="true" />}
      {result === "N" && <span className="absolute inset-0 bg-current opacity-25" aria-hidden="true" />}
      <span className={cn("relative", result === "V" && "text-paper")}>
        {result}
      </span>
    </span>
  );
}

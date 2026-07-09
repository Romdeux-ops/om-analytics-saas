import { cn } from "@/src/lib/ui/cn";

interface RevealProps {
  children: React.ReactNode;
  /** Délai d'apparition en secondes (effet cascade). */
  delay?: number;
  className?: string;
}

/**
 * Révélation légère au chargement (CSS pur, pas de framer-motion).
 * Respecte `prefers-reduced-motion` via globals.css.
 */
export function Reveal({ children, delay = 0, className }: RevealProps) {
  return (
    <div
      className={cn("reveal", className)}
      style={delay > 0 ? { animationDelay: `${delay}s` } : undefined}
    >
      {children}
    </div>
  );
}

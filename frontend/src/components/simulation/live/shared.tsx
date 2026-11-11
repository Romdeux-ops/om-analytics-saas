import { isOmTeam, shortTeamName } from "@/src/lib/ui/teams";
import type { Side } from "@/src/lib/simulation";
import { cn } from "@/src/lib/ui/cn";

/**
 * Couleurs d'identité des deux équipes : l'OM porte toujours l'accent
 * (comme partout sur le site), sinon c'est l'équipe à domicile.
 */
export interface SideTones {
  accentSide: Side;
  bg: Record<Side, string>;
  fill: Record<Side, string>;
}

export function sideTones(homeName: string, awayName: string): SideTones {
  const accentSide: Side = isOmTeam(awayName) && !isOmTeam(homeName) ? "away" : "home";
  const inkSide: Side = accentSide === "home" ? "away" : "home";
  return {
    accentSide,
    bg: { [accentSide]: "bg-accent", [inkSide]: "bg-ink" } as Record<Side, string>,
    fill: { [accentSide]: "var(--accent)", [inkSide]: "var(--ink)" } as Record<Side, string>,
  };
}

export function teamCode(name: string): string {
  return shortTeamName(name);
}

/** Pastille carrée de la couleur d'une équipe (identité jamais portée par la couleur seule : toujours suivie du nom). */
export function Swatch({ className }: { className: string }) {
  return <span aria-hidden="true" className={cn("inline-block h-2.5 w-2.5 shrink-0", className)} />;
}

export function CardIcon({ color, className }: { color: "yellow" | "red"; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-block h-3 w-2 shrink-0 border border-ink",
        color === "yellow" ? "bg-[#f5c400]" : "bg-live",
        className,
      )}
    />
  );
}

export function SectionTitle({ title, aside }: { title: string; aside?: React.ReactNode }) {
  return (
    <h3 className="flex items-baseline justify-between gap-3 border-t-[6px] border-ink pt-2">
      <span className="display text-3xl">{title}</span>
      {aside ? <span className="label text-ink/55">{aside}</span> : null}
    </h3>
  );
}

export function formatPct(p: number): string {
  return `${Math.round(p * 100)} %`;
}

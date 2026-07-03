/**
 * Formate une valeur marchande en euros (affichage M€ / K€).
 */
export function formatMarketValue(value: number | null | undefined): string {
  if (value == null) return "—";
  if (value >= 1_000_000) {
    const millions = value / 1_000_000;
    return `${millions.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} M€`;
  }
  if (value >= 1_000) {
    const thousands = value / 1_000;
    return `${thousands.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} K€`;
  }
  return `${value.toLocaleString("fr-FR")} €`;
}

/**
 * Formate la valorisation totale de l'effectif (ex. ~320 M€).
 */
export function formatSquadTotalValue(total: number): string {
  if (total >= 1_000_000) {
    const millions = total / 1_000_000;
    return `~${Math.round(millions).toLocaleString("fr-FR")} M€`;
  }
  return formatMarketValue(total);
}

const POSITION_ORDER = ["GK", "DEF", "MID", "FWD"] as const;

const POSITION_LABELS: Record<(typeof POSITION_ORDER)[number], string> = {
  GK: "Gardiens",
  DEF: "Défenseurs",
  MID: "Milieux",
  FWD: "Attaquants",
};

export function groupPlayersByPosition<T extends { position: string }>(
  players: readonly T[],
): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const pos of POSITION_ORDER) {
    const group = players.filter((p) => p.position === pos);
    if (group.length > 0) {
      groups.set(POSITION_LABELS[pos], group);
    }
  }
  return groups;
}

export type CompetitionId = "ligue1" | "europa" | "coupe";

export type CompetitionStatus = "active" | "draw-pending";

export interface Competition {
  id: CompetitionId;
  label: string;
  shortLabel: string;
  season: string;
  status: CompetitionStatus;
  /** Message affiché quand le tirage n'a pas encore eu lieu */
  drawMessage?: string;
}

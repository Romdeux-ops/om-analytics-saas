/** Zone de qualification/relégation affichée par un bandeau coloré dans le tableau. */
export type StandingZone =
  | "champions-league"
  | "europa-league"
  | "conference-league"
  | "relegation"
  | "playoffs-direct"
  | "playoffs-qualifiers";

export interface StandingRow {
  rank: number;
  clubName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  isOm: boolean;
  zone?: StandingZone;
}

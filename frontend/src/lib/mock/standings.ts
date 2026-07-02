import type { StandingRow } from "@/src/lib/types/standing";

export const MOCK_STANDINGS: StandingRow[] = [
  { rank: 1, clubName: "Paris Saint-Germain", played: 24, won: 17, drawn: 5, lost: 2, goalsFor: 52, goalsAgainst: 18, points: 56, isOm: false },
  { rank: 2, clubName: "AS Monaco", played: 24, won: 15, drawn: 4, lost: 5, goalsFor: 41, goalsAgainst: 26, points: 49, isOm: false },
  { rank: 3, clubName: "Olympique de Marseille", played: 24, won: 13, drawn: 6, lost: 5, goalsFor: 38, goalsAgainst: 24, points: 45, isOm: true },
  { rank: 4, clubName: "LOSC Lille", played: 24, won: 12, drawn: 7, lost: 5, goalsFor: 35, goalsAgainst: 22, points: 43, isOm: false },
  { rank: 5, clubName: "OGC Nice", played: 24, won: 11, drawn: 6, lost: 7, goalsFor: 32, goalsAgainst: 28, points: 39, isOm: false },
  { rank: 6, clubName: "Olympique Lyonnais", played: 24, won: 10, drawn: 5, lost: 9, goalsFor: 30, goalsAgainst: 29, points: 35, isOm: false },
  { rank: 7, clubName: "RC Lens", played: 24, won: 9, drawn: 7, lost: 8, goalsFor: 28, goalsAgainst: 27, points: 34, isOm: false },
  { rank: 8, clubName: "Stade Rennais", played: 24, won: 9, drawn: 6, lost: 9, goalsFor: 31, goalsAgainst: 30, points: 33, isOm: false },
];

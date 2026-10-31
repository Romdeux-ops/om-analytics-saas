import { ImageResponse } from "next/og";
import { getMatch } from "@/src/lib/data/match";
import { DefaultCard, MatchCard, OG_SIZE, formatKickoff } from "@/src/lib/og";
import { shortTeamName } from "@/src/lib/ui/teams";

export const alt = "Avant-match OM Analytics";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function MatchOpengraphImage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  const match = await getMatch(matchId).catch(() => null);

  if (!match) {
    return new ImageResponse(<DefaultCard subtitle="Avant-match de l'Olympique de Marseille" />, size);
  }

  const home = shortTeamName(match.home_team_name);
  const away = shortTeamName(match.away_team_name);
  const footer = match.played
    ? `Score final · ${match.home_score} – ${match.away_score}`
    : formatKickoff(new Date(match.date));

  return new ImageResponse(
    <MatchCard kicker={match.played ? "Résultat" : "Avant-match"} home={home} away={away} footer={footer} />,
    size,
  );
}

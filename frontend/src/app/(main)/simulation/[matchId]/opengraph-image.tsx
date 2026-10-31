import { ImageResponse } from "next/og";
import { getMatch } from "@/src/lib/data/match";
import { DefaultCard, MatchCard, OG_SIZE, formatKickoff, ogOptions } from "@/src/lib/og";
import { shortTeamName } from "@/src/lib/ui/teams";

export const alt = "Avant-match OM Analytics";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function MatchOpengraphImage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  const match = await getMatch(matchId).catch(() => null);

  if (!match) {
    const subtitle = "Avant-match de l'Olympique de Marseille";
    return new ImageResponse(<DefaultCard subtitle={subtitle} />, await ogOptions(size, [subtitle]));
  }

  const card = {
    kicker: match.played ? "Résultat" : "Avant-match",
    home: shortTeamName(match.home_team_name),
    away: shortTeamName(match.away_team_name),
    footer: match.played
      ? `Score final · ${match.home_score} – ${match.away_score}`
      : formatKickoff(new Date(match.date)),
  };

  return new ImageResponse(<MatchCard {...card} />, await ogOptions(size, Object.values(card)));
}

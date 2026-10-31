import { ImageResponse } from "next/og";
import { getNextOmFixture } from "@/src/lib/data/calendar";
import { getCompetition } from "@/src/lib/data/competitions";
import { DefaultCard, MatchCard, OG_SIZE, formatKickoff, ogOptions } from "@/src/lib/og";
import { shortTeamName } from "@/src/lib/ui/teams";

export const alt = "OM Analytics — le prochain match de l'Olympique de Marseille";
export const size = OG_SIZE;
export const contentType = "image/png";
export const revalidate = 300;

export default async function OpengraphImage() {
  const fixture = await getNextOmFixture().catch(() => null);

  if (!fixture) {
    const subtitle = "Le programme de match de l'Olympique de Marseille";
    return new ImageResponse(<DefaultCard subtitle={subtitle} />, await ogOptions(size, [subtitle]));
  }

  const competition = getCompetition(fixture.competition).label;
  const matchday = fixture.matchday > 0 ? ` · J${fixture.matchday}` : "";
  const card = {
    kicker: `Prochain match · ${competition}${matchday}`,
    home: shortTeamName(fixture.homeTeam),
    away: shortTeamName(fixture.awayTeam),
    footer: formatKickoff(new Date(fixture.date), fixture.timeTbd),
  };

  return new ImageResponse(<MatchCard {...card} />, await ogOptions(size, Object.values(card)));
}

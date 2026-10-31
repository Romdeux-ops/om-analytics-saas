import { ImageResponse } from "next/og";
import { getNextOmFixture } from "@/src/lib/data/calendar";
import { getCompetition } from "@/src/lib/data/competitions";
import { DefaultCard, MatchCard, OG_SIZE, formatKickoff } from "@/src/lib/og";
import { shortTeamName } from "@/src/lib/ui/teams";

export const alt = "OM Analytics — le prochain match de l'Olympique de Marseille";
export const size = OG_SIZE;
export const contentType = "image/png";
export const revalidate = 300;

export default async function OpengraphImage() {
  const fixture = await getNextOmFixture().catch(() => null);

  if (!fixture) {
    return new ImageResponse(<DefaultCard subtitle="Le programme de match de l'Olympique de Marseille" />, size);
  }

  const competition = getCompetition(fixture.competition).label;
  const matchday = fixture.matchday > 0 ? ` · J${fixture.matchday}` : "";

  return new ImageResponse(
    <MatchCard
      kicker={`Prochain match · ${competition}${matchday}`}
      home={shortTeamName(fixture.homeTeam)}
      away={shortTeamName(fixture.awayTeam)}
      footer={formatKickoff(new Date(fixture.date), fixture.timeTbd)}
    />,
    size,
  );
}

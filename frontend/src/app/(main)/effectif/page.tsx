import { formatSeason } from "@om/db/season";
import { CoachCard } from "@/src/components/effectif/CoachCard";
import { SquadTable } from "@/src/components/effectif/SquadTable";
import { PageSectionHeader } from "@/src/components/layout/PageSectionHeader";
import { getLigue1Standings, standingsMatchday } from "@/src/lib/data/competitions";
import { getOmSquadPageData } from "@/src/lib/data/squad";

export const revalidate = 60;

export default async function EffectifPage() {
  const [{ squad, coach, totalMarketValue }, ligue1Standings] = await Promise.all([
    getOmSquadPageData(),
    getLigue1Standings(),
  ]);
  const season = formatSeason();

  return (
    <div>
      <PageSectionHeader
        title={
          <>
            Effec<span className="text-accent-text">tif</span>
          </>
        }
        subtitle={`Olympique de Marseille · Saison ${season}`}
      />

      <CoachCard
        coachName={coach}
        totalMarketValue={totalMarketValue}
        playerCount={squad.length}
        season={season}
      />
      <SquadTable players={squad} season={season} matchday={standingsMatchday(ligue1Standings)} />
    </div>
  );
}

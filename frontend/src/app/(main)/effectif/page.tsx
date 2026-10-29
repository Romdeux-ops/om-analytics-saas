import { CoachCard } from "@/src/components/effectif/CoachCard";
import { SquadTable } from "@/src/components/effectif/SquadTable";
import { PageSectionHeader } from "@/src/components/layout/PageSectionHeader";
import { getOmSquadPageData } from "@/src/lib/data/squad";

export const revalidate = 60;

export default async function EffectifPage() {
  const { squad, coach, totalMarketValue } = await getOmSquadPageData();

  return (
    <div>
      <PageSectionHeader
        title={
          <>
            Effec<span className="text-accent-text">tif</span>
          </>
        }
        subtitle="Olympique de Marseille · Saison 2026-2027"
      />

      <CoachCard
        coachName={coach}
        totalMarketValue={totalMarketValue}
        playerCount={squad.length}
      />
      <SquadTable players={squad} />
    </div>
  );
}

import { Users } from "lucide-react";
import { CoachCard } from "@/src/components/effectif/CoachCard";
import { SquadTable } from "@/src/components/effectif/SquadTable";
import { PageSectionHeader } from "@/src/components/layout/PageSectionHeader";
import { Reveal } from "@/src/components/ui/Reveal";
import { getOmSquadPageData } from "@/src/lib/data/squad";

export const revalidate = 60;

export default async function EffectifPage() {
  const { squad, coach, totalMarketValue } = await getOmSquadPageData();

  return (
    <div className="mx-auto max-w-5xl">
      <PageSectionHeader
        title={<span className="text-gradient">Effectif</span>}
        subtitle="Olympique de Marseille · Saison 2026-2027"
        icon={<Users size={18} />}
        accent="cyan"
      />

      <Reveal>
        <CoachCard
          coachName={coach}
          totalMarketValue={totalMarketValue}
          playerCount={squad.length}
        />
        <SquadTable players={squad} />
      </Reveal>
    </div>
  );
}

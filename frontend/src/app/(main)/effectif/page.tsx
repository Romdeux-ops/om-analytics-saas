import type { Metadata } from "next";
import { formatSeason } from "@om/db/season";
import { CoachCard } from "@/src/components/effectif/CoachCard";
import { SquadTable } from "@/src/components/effectif/SquadTable";
import { PageSectionHeader } from "@/src/components/layout/PageSectionHeader";
import { getOmSquadPageData } from "@/src/lib/data/squad";
import { pageMetadata } from "@/src/lib/site";

export const revalidate = 60;

export const metadata: Metadata = pageMetadata({
  title: "Effectif",
  description: "L'effectif de l'Olympique de Marseille : joueurs par poste, statistiques et valeurs marchandes.",
  path: "/effectif",
});

export default async function EffectifPage() {
  const { squad, coach, totalMarketValue } = await getOmSquadPageData();
  const season = formatSeason();
  // Les stats joueurs ne suivent pas forcément le classement : on date le tableau d'après elles.
  const statsMatchday = Math.max(0, ...squad.map((p) => p.matchesPlayed));

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
      <SquadTable players={squad} season={season} matchday={statsMatchday} />
    </div>
  );
}

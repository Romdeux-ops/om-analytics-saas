import type { Metadata } from "next";
import { ClassementView } from "@/src/components/classement/ClassementView";
import { StandingsTable } from "@/src/components/classement/StandingsTable";
import { DrawPlaceholder } from "@/src/components/classement/DrawPlaceholder";
import { PageSectionHeader } from "@/src/components/layout/PageSectionHeader";
import { pageMetadata } from "@/src/lib/site";
import {
  COMPETITIONS,
  getCompetition,
  getEuropaStandings,
  getLigue1Standings,
  standingsMatchday,
} from "@/src/lib/data/competitions";

export const revalidate = 300;

export const metadata: Metadata = pageMetadata({
  title: "Classements",
  description: "Classement de Ligue 1 et de la phase de ligue d'Europa League, avec la position de l'OM.",
  path: "/classement",
});

export default async function ClassementPage() {
  const ligue1 = getCompetition("ligue1");
  const europa = getCompetition("europa");
  const [ligue1Standings, europaStandings] = await Promise.all([
    getLigue1Standings(),
    getEuropaStandings(),
  ]);
  const panels = {
    ligue1: (
      <StandingsTable
        standings={ligue1Standings}
        title={ligue1.label}
        season={ligue1.season}
        badgeLabel={`Journée ${standingsMatchday(ligue1Standings)}`}
      />
    ),
    europa: (
      <StandingsTable
        standings={europaStandings}
        title={europa.label}
        season={europa.season}
        badgeLabel={`Journée ${standingsMatchday(europaStandings)} · Phase de ligue`}
      />
    ),
    coupe: <DrawPlaceholder competition={getCompetition("coupe")} />,
  };

  return (
    <div>
      <PageSectionHeader
        title={
          <>
            Classe<span className="text-accent-text">ments</span>
          </>
        }
        subtitle="Ligue 1 · Europa League · Coupe de France"
      />

      <ClassementView competitions={COMPETITIONS} panels={panels} />
    </div>
  );
}

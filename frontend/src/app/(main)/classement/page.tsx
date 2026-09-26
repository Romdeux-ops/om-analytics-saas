import { ListOrdered } from "lucide-react";
import { ClassementView } from "@/src/components/classement/ClassementView";
import { StandingsTable } from "@/src/components/classement/StandingsTable";
import { DrawPlaceholder } from "@/src/components/classement/DrawPlaceholder";
import { PageSectionHeader } from "@/src/components/layout/PageSectionHeader";
import {
  COMPETITIONS,
  getCompetition,
  getEuropaStandings,
  getLigue1Standings,
  standingsMatchday,
} from "@/src/lib/data/competitions";

export const revalidate = 300;

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
    <div className="mx-auto max-w-5xl">
      <PageSectionHeader
        title={<span className="text-gradient-gold">Classements</span>}
        subtitle="Ligue 1 · Europa League · Coupe de France"
        icon={<ListOrdered size={18} />}
        accent="gold"
      />

      <ClassementView competitions={COMPETITIONS} panels={panels} />
    </div>
  );
}

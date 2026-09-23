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
} from "@/src/lib/data/competitions";

export const dynamic = "force-static";

export default function ClassementPage() {
  const ligue1 = getCompetition("ligue1");
  const europa = getCompetition("europa");
  const panels = {
    ligue1: (
      <StandingsTable
        standings={getLigue1Standings()}
        title={ligue1.label}
        season={ligue1.season}
        badgeLabel="Journée 5"
      />
    ),
    europa: (
      <StandingsTable
        standings={getEuropaStandings()}
        title={europa.label}
        season={europa.season}
        badgeLabel="Journée 1 · Phase de ligue"
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

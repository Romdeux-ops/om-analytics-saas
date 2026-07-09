import { ListOrdered } from "lucide-react";
import { ClassementView } from "@/src/components/classement/ClassementView";
import { StandingsTable } from "@/src/components/classement/StandingsTable";
import { DrawPlaceholder } from "@/src/components/classement/DrawPlaceholder";
import { PageSectionHeader } from "@/src/components/layout/PageSectionHeader";
import { Reveal } from "@/src/components/ui/Reveal";
import {
  COMPETITIONS,
  getCompetition,
  getLigue1Standings,
} from "@/src/lib/data/competitions";

export const dynamic = "force-static";

export default function ClassementPage() {
  const ligue1 = getCompetition("ligue1");
  const panels = {
    ligue1: <StandingsTable standings={getLigue1Standings()} season={ligue1.season} />,
    europa: <DrawPlaceholder competition={getCompetition("europa")} />,
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

      <Reveal>
        <ClassementView competitions={COMPETITIONS} panels={panels} />
      </Reveal>
    </div>
  );
}

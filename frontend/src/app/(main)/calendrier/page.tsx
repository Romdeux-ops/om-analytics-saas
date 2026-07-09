import { CalendarDays } from "lucide-react";
import {
  CalendarView,
  type CalendarTabId,
} from "@/src/components/calendrier/CalendarView";
import { FixtureList } from "@/src/components/calendrier/FixtureList";
import { NextMatchHighlight } from "@/src/components/calendrier/NextMatchHighlight";
import { DrawPlaceholder } from "@/src/components/classement/DrawPlaceholder";
import type { TabDescriptor } from "@/src/components/classement/CompetitionTabs";
import { PageSectionHeader } from "@/src/components/layout/PageSectionHeader";
import { Reveal } from "@/src/components/ui/Reveal";
import { COMPETITIONS, getCompetition } from "@/src/lib/data/competitions";
import { getAllOmFixtures, getOmFixtures } from "@/src/lib/data/calendar";

const SEASON = "2026-2027";

export const dynamic = "force-static";

export default function CalendrierPage() {
  const tabs: TabDescriptor<CalendarTabId>[] = [
    { id: "general", label: "Calendrier général", shortLabel: "Tous", season: SEASON },
    ...COMPETITIONS.map((c) => ({
      id: c.id,
      label: c.label,
      shortLabel: c.shortLabel,
      season: c.season,
    })),
  ];

  const panels: Record<CalendarTabId, React.ReactNode> = {
    general: (
      <FixtureList
        fixtures={getAllOmFixtures()}
        title="Calendrier général"
        season={SEASON}
        showCompetition
        note="Toutes compétitions confondues. L'Europa League et la Coupe de France seront ajoutées ici dès les tirages effectués."
      />
    ),
    ligue1: <FixtureList fixtures={getOmFixtures("ligue1")} title="Ligue 1" season={SEASON} />,
    europa: <DrawPlaceholder competition={getCompetition("europa")} />,
    coupe: <DrawPlaceholder competition={getCompetition("coupe")} />,
  };

  return (
    <div className="mx-auto max-w-5xl">
      <PageSectionHeader
        title={<span className="text-gradient">Calendrier</span>}
        subtitle="Ligue 1 · Europa League · Coupe de France"
        icon={<CalendarDays size={18} />}
        accent="cyan"
      />

      <Reveal>
        <NextMatchHighlight />
        <CalendarView tabs={tabs} panels={panels} />
      </Reveal>
    </div>
  );
}

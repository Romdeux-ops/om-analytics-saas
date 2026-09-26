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
import { COMPETITIONS, getCompetition } from "@/src/lib/data/competitions";
import { getAllOmFixtures, getOmFixtures } from "@/src/lib/data/calendar";

const SEASON = "2026-2027";

export const revalidate = 300;

export default async function CalendrierPage() {
  const [allFixtures, ligue1Fixtures, europaFixtures, coupeFixtures] = await Promise.all([
    getAllOmFixtures(),
    getOmFixtures("ligue1"),
    getOmFixtures("europa"),
    getOmFixtures("coupe"),
  ]);

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
        fixtures={allFixtures}
        title="Calendrier général"
        season={SEASON}
        showCompetition
        note={
          coupeFixtures.length === 0
            ? "Toutes compétitions confondues. La Coupe de France sera ajoutée ici dès le tirage effectué."
            : undefined
        }
      />
    ),
    ligue1: <FixtureList fixtures={ligue1Fixtures} title="Ligue 1" season={SEASON} />,
    europa: <FixtureList fixtures={europaFixtures} title="Europa League" season={SEASON} />,
    coupe:
      coupeFixtures.length > 0 ? (
        <FixtureList fixtures={coupeFixtures} title="Coupe de France" season={SEASON} />
      ) : (
        <DrawPlaceholder competition={getCompetition("coupe")} />
      ),
  };

  return (
    <div className="mx-auto max-w-5xl">
      <PageSectionHeader
        title={<span className="text-gradient">Calendrier</span>}
        subtitle="Ligue 1 · Europa League · Coupe de France"
        icon={<CalendarDays size={18} />}
        accent="cyan"
      />

      <NextMatchHighlight />
      <CalendarView tabs={tabs} panels={panels} />
    </div>
  );
}

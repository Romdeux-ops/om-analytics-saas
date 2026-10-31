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
import { formatSeason } from "@om/db/season";

export const revalidate = 300;

export default async function CalendrierPage() {
  const season = formatSeason();
  const [allFixtures, ligue1Fixtures, europaFixtures, coupeFixtures] = await Promise.all([
    getAllOmFixtures(),
    getOmFixtures("ligue1"),
    getOmFixtures("europa"),
    getOmFixtures("coupe"),
  ]);

  const tabs: TabDescriptor<CalendarTabId>[] = [
    { id: "general", label: "Calendrier général", shortLabel: "Tous", season: season },
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
        season={season}
        showCompetition
        note={
          coupeFixtures.length === 0
            ? "Toutes compétitions confondues. La Coupe de France sera ajoutée ici dès le tirage effectué."
            : undefined
        }
      />
    ),
    ligue1: <FixtureList fixtures={ligue1Fixtures} title="Ligue 1" season={season} />,
    europa: <FixtureList fixtures={europaFixtures} title="Europa League" season={season} />,
    coupe:
      coupeFixtures.length > 0 ? (
        <FixtureList fixtures={coupeFixtures} title="Coupe de France" season={season} />
      ) : (
        <DrawPlaceholder competition={getCompetition("coupe")} />
      ),
  };

  return (
    <div>
      <PageSectionHeader
        title={
          <>
            Calen<span className="text-accent-text">drier</span>
          </>
        }
        subtitle="Ligue 1 · Europa League · Coupe de France"
      />

      <NextMatchHighlight />
      <CalendarView tabs={tabs} panels={panels} />
    </div>
  );
}

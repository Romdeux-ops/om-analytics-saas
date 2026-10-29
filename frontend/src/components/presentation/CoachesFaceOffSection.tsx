"use client";

import { memo } from "react";
import { SectionHeading } from "@/src/components/ui/SectionHeading";
import { shortTeamName } from "@/src/lib/ui/teams";
import { cn } from "@/src/lib/ui/cn";
import type { CoachProfile } from "@/src/lib/data/coaches";

interface CoachesFaceOffSectionProps {
  homeCoach: CoachProfile;
  awayCoach: CoachProfile;
  homeTeamName: string;
  awayTeamName: string;
}

export const CoachesFaceOffSection = memo(function CoachesFaceOffSection({
  homeCoach,
  awayCoach,
  homeTeamName,
  awayTeamName,
}: CoachesFaceOffSectionProps) {
  const homeShort = shortTeamName(homeTeamName);
  const awayShort = shortTeamName(awayTeamName);

  return (
    <section>
      <SectionHeading
        index="04"
        title="Le duel des bancs"
        subtitle="Philosophies tactiques, schémas et confrontation des styles"
      />

      <div className="grid md:grid-cols-2">
        <CoachColumn coach={homeCoach} teamName={homeShort} isHome />
        <CoachColumn coach={awayCoach} teamName={awayShort} isHome={false} />
      </div>
    </section>
  );
});

function CoachColumn({
  coach,
  teamName,
  isHome,
}: {
  coach: CoachProfile;
  teamName: string;
  isHome: boolean;
}) {
  return (
    <article className={cn("flex flex-col", isHome ? "md:border-r md:border-ink md:pr-8" : "mt-10 md:mt-0 md:pl-8")}>
      <p className="label text-ink/60">
        {isHome ? "Domicile" : "Extérieur"} · {coach.role} · {teamName}
        {coach.nationality && ` · ${coach.nationality}`}
        {coach.age && ` · ${coach.age} ans`}
      </p>
      <h4 className="display mt-2 text-5xl text-ink md:text-6xl">{coach.name}</h4>

      <div className="mt-5 grid grid-cols-[auto_1fr] border-y border-ink">
        <div className="border-r border-ink py-3 pr-5">
          <span className="label block text-ink/60">Système</span>
          <span className="display text-4xl tabular text-accent-text">{coach.system}</span>
        </div>
        <div className="py-3 pl-5">
          <span className="label block text-ink/60">Style de jeu</span>
          <span className="mt-1 block text-sm font-bold uppercase leading-snug">{coach.style}</span>
        </div>
      </div>

      <p className="label mt-5 text-ink/60">Principes &amp; philosophie</p>
      <p className="editorial mt-2 text-xl leading-snug text-ink/80">{coach.philosophy}</p>
    </article>
  );
}

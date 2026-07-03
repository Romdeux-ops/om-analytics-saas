"use client";

import { useState } from "react";
import { CompetitionTabs } from "@/src/components/classement/CompetitionTabs";
import type { Competition, CompetitionId } from "@/src/lib/types/competition";

interface ClassementViewProps {
  competitions: Competition[];
  /** Panneaux déjà rendus côté serveur, indexés par compétition. */
  panels: Record<CompetitionId, React.ReactNode>;
  defaultId?: CompetitionId;
}

/**
 * Coquille cliente minimale : ne gère que la bascule d'onglet. Les panneaux
 * (tableau, placeholders) sont rendus côté serveur et passés en props, donc
 * seul le state d'onglet vit côté client — bundle allégé.
 */
export function ClassementView({ competitions, panels, defaultId = "ligue1" }: ClassementViewProps) {
  const [selected, setSelected] = useState<CompetitionId>(defaultId);

  return (
    <div className="space-y-6">
      <CompetitionTabs competitions={competitions} selected={selected} onSelect={setSelected} />

      <div
        role="tabpanel"
        id={`panel-${selected}`}
        aria-labelledby={`tab-${selected}`}
        tabIndex={0}
      >
        {panels[selected]}
      </div>
    </div>
  );
}

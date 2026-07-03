"use client";

import { useState } from "react";
import {
  CompetitionTabs,
  type TabDescriptor,
} from "@/src/components/classement/CompetitionTabs";
import type { CompetitionId } from "@/src/lib/types/competition";

export type CalendarTabId = "general" | CompetitionId;

interface CalendarViewProps {
  tabs: TabDescriptor<CalendarTabId>[];
  /** Panneaux rendus côté serveur, indexés par onglet. */
  panels: Record<CalendarTabId, React.ReactNode>;
  defaultId?: CalendarTabId;
}

/**
 * Coquille cliente minimale : ne gère que la bascule d'onglet.
 * Les panneaux (calendrier général, par compétition, placeholders) sont
 * rendus côté serveur et passés en props — bundle client allégé.
 */
export function CalendarView({ tabs, panels, defaultId = "general" }: CalendarViewProps) {
  const [selected, setSelected] = useState<CalendarTabId>(defaultId);

  return (
    <div className="space-y-6">
      <CompetitionTabs competitions={tabs} selected={selected} onSelect={setSelected} />

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

"use client";

import { useRef } from "react";
import { cn } from "@/src/lib/ui/cn";

/** Descripteur minimal d'onglet — générique pour réutilisation (classement, calendrier…). */
export interface TabDescriptor<Id extends string> {
  id: Id;
  label: string;
  shortLabel: string;
  season: string;
}

interface CompetitionTabsProps<Id extends string> {
  competitions: TabDescriptor<Id>[];
  selected: Id;
  onSelect: (id: Id) => void;
  /** Précharge le panneau au survol, sans changer l'onglet actif. */
  onPrefetch?: (id: Id) => void;
  ariaLabel?: string;
}

export function CompetitionTabs<Id extends string>({
  competitions,
  selected,
  onSelect,
  onPrefetch,
  ariaLabel = "Compétitions",
}: CompetitionTabsProps<Id>) {
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  function selectAndFocus(id: Id) {
    onSelect(id);
    tabRefs.current[id]?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent, idx: number) {
    const count = competitions.length;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      selectAndFocus(competitions[(idx + 1) % count].id);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      selectAndFocus(competitions[(idx - 1 + count) % count].id);
    } else if (e.key === "Home") {
      e.preventDefault();
      selectAndFocus(competitions[0].id);
    } else if (e.key === "End") {
      e.preventDefault();
      selectAndFocus(competitions[count - 1].id);
    }
  }

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="flex items-end gap-1 border-b border-ink"
    >
      {competitions.map((comp, idx) => {
        const isActive = comp.id === selected;
        return (
          <button
            key={comp.id}
            ref={(el) => {
              tabRefs.current[comp.id] = el;
            }}
            type="button"
            role="tab"
            id={`tab-${comp.id}`}
            aria-selected={isActive}
            aria-label={comp.label}
            aria-controls={`panel-${comp.id}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onSelect(comp.id)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            onPointerEnter={() => onPrefetch?.(comp.id)}
            className={cn(
              "-mb-px flex min-w-0 cursor-pointer items-baseline gap-2 border border-b-0 border-ink px-3 transition-all duration-100 sm:px-5",
              isActive
                ? "bg-ink pb-3 pt-3 text-paper"
                : "pb-2 pt-2 text-ink hover:bg-accent hover:pb-3 hover:pt-3 hover:text-on-accent",
            )}
          >
            <span className="display text-2xl leading-none">{comp.shortLabel}</span>
            <span className="label hidden truncate sm:inline">{comp.label}</span>
            <span className={cn("hidden text-[10px] tabular md:inline", isActive ? "text-paper/60" : "opacity-60")}>
              {comp.season}
            </span>
          </button>
        );
      })}
    </div>
  );
}

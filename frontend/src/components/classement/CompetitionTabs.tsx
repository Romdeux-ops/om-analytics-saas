"use client";

import { useRef } from "react";
import { cn } from "@/src/lib/ui/cn";
import type { Competition, CompetitionId } from "@/src/lib/types/competition";

interface CompetitionTabsProps {
  competitions: Competition[];
  selected: CompetitionId;
  onSelect: (id: CompetitionId) => void;
}

export function CompetitionTabs({ competitions, selected, onSelect }: CompetitionTabsProps) {
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  function selectAndFocus(id: CompetitionId) {
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
      aria-label="Compétitions"
      className="flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-1.5 backdrop-blur-md"
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
            aria-controls={`panel-${comp.id}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onSelect(comp.id)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            className={cn(
              "flex min-w-0 flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all sm:flex-none sm:px-5",
              isActive
                ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-white shadow-[0_0_20px_-8px_rgba(34,211,238,0.5)] ring-1 ring-cyan-400/30"
                : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-200",
            )}
          >
            <span className="font-tech uppercase tracking-wider">{comp.shortLabel}</span>
            <span className="hidden truncate sm:inline">{comp.label}</span>
            <span className="text-[10px] font-normal text-slate-400">{comp.season}</span>
          </button>
        );
      })}
    </div>
  );
}

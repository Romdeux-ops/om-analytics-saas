"use client";

import { cn } from "@/src/lib/ui/cn";
import { teamCode } from "./shared";

export interface MultiplexCard {
  id: string;
  homeName: string;
  awayName: string;
  score: { home: number; away: number };
  /** Un but vient d'être marqué dans ce match. */
  flash: boolean;
}

interface MultiplexProps {
  cards: MultiplexCard[];
  selected: string | null;
  onSelect: (id: string | null) => void;
  clockLabel: string;
}

export function Multiplex({ cards, selected, onSelect, clockLabel }: MultiplexProps) {
  if (cards.length === 0) {
    return <p className="editorial text-xl text-ink/50">Pas d&apos;autre match à suivre pour cette compétition.</p>;
  }

  return (
    <div>
      <p className="label mb-3 flex justify-between text-ink/55">
        <span>Affiches simulées · même graine</span>
        <span className="tabular">{clockLabel}</span>
      </p>
      <ul className="grid grid-cols-1 gap-[2px] bg-ink/20 sm:grid-cols-2">
        {cards.map((card) => {
          const isSelected = selected === card.id;
          return (
            <li key={card.id} className="bg-paper">
              <button
                type="button"
                onClick={() => onSelect(isSelected ? null : card.id)}
                aria-pressed={isSelected}
                title="Mettre en évidence ces deux clubs dans le classement"
                className={cn(
                  "grid w-full grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 py-2.5 text-left transition-colors duration-300",
                  card.flash ? "bg-accent text-on-accent" : isSelected ? "bg-ink text-paper" : "hover:bg-ink/5",
                )}
              >
                <span className="truncate text-right text-[13px] font-semibold uppercase">{teamCode(card.homeName)}</span>
                <span className="display text-2xl leading-none tabular">
                  {card.score.home}
                  <span className="mx-1 opacity-40">-</span>
                  {card.score.away}
                </span>
                <span className="truncate text-[13px] font-semibold uppercase">{teamCode(card.awayName)}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

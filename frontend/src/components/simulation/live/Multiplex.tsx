"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Radio } from "lucide-react";
import { cn } from "@/src/lib/ui/cn";
import { teamCode } from "./shared";

/** Un but marqué dans un autre match de la journée. */
export interface MultiplexFeedEntry {
  id: string;
  t: number;
  label: string;
  text: string;
}

/** Petit fil des buts du multiplex, séparé du fil du match suivi. */
export function MultiplexFeed({ entries, started }: { entries: MultiplexFeedEntry[]; started: boolean }) {
  return (
    <section className="border border-ink" aria-label="Fil du multiplex">
      <p className="label flex items-center justify-between border-b border-ink px-3 py-2">
        <span className="inline-flex items-center gap-1.5 text-accent-text">
          <Radio size={14} aria-hidden="true" /> Fil du multiplex
        </span>
        <span className="tabular text-ink/55">
          {entries.length} {entries.length > 1 ? "buts" : "but"}
        </span>
      </p>
      <ol className="no-scrollbar max-h-64 overflow-y-auto px-3" aria-live="polite" aria-relevant="additions">
        <AnimatePresence initial={false}>
          {entries.map((entry) => (
            <motion.li
              key={entry.id}
              layout="position"
              initial={{ opacity: 0, x: 14 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-[3rem_1fr] gap-3 border-b border-dashed border-ink/30 py-2 last:border-b-0"
            >
              <span className="display text-xl leading-none text-ink/60 tabular">{entry.label}</span>
              <p className="min-w-0 text-[13px] leading-relaxed">{entry.text}</p>
            </motion.li>
          ))}
        </AnimatePresence>
        {entries.length === 0 && (
          <li className="editorial py-4 text-lg text-ink/45">
            {started ? "Aucun but ailleurs pour l'instant." : "En attente du coup d'envoi…"}
          </li>
        )}
      </ol>
    </section>
  );
}

export interface MultiplexCard {
  id: string;
  homeName: string;
  awayName: string;
  score: { home: number; away: number };
  /** Un but vient d'être marqué dans ce match. */
  flash: boolean;
  /** Match déjà joué : `score` est le score réel, pas une simulation. */
  final?: boolean;
}

interface MultiplexProps {
  cards: MultiplexCard[];
  selected: string | null;
  onSelect: (id: string | null) => void;
  clockLabel: string;
  /** « calendrier » : vraies affiches de la journée ; « illustratif » : appariement fictif de repli. */
  source: "calendrier" | "illustratif";
}

export function Multiplex({ cards, selected, onSelect, clockLabel, source }: MultiplexProps) {
  if (cards.length === 0) {
    return <p className="editorial text-xl text-ink/50">Pas d&apos;autre match à suivre pour cette compétition.</p>;
  }

  return (
    <div>
      <p className="label mb-3 flex justify-between text-ink/55">
        <span>
          {source === "calendrier"
            ? "Affiches réelles de la journée · scores simulés par le même modèle, sauf matchs déjà joués"
            : "Affiches illustratives (appariement fictif, calendrier réel indisponible) · scores non prédictifs"}
        </span>
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
                <span className="truncate text-[13px] font-semibold uppercase">
                  {teamCode(card.awayName)}
                  {card.final && <span className="label ml-2 normal-case opacity-60">score réel</span>}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

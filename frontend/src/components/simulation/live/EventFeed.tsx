"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeftRight, Crosshair, Flag, Hand, MonitorPlay, Radio, Timer, Zap } from "lucide-react";
import type { SimEvent } from "@/src/lib/simulation";
import { minuteLabel } from "@/src/lib/simulation/timeline";
import { cn } from "@/src/lib/ui/cn";
import { CardIcon, SectionTitle, teamCode } from "./shared";

export type FeedEntry =
  | { kind: "match"; id: string; t: number; event: SimEvent; teamName?: string }
  | { kind: "multiplex"; id: string; t: number; label: string; text: string };

type FeedFilter = "all" | "highlights" | "goals" | "cards";

const FILTERS: { id: FeedFilter; label: string }[] = [
  { id: "highlights", label: "Temps forts" },
  { id: "all", label: "Tout" },
  { id: "goals", label: "Buts" },
  { id: "cards", label: "Cartons" },
];

function keep(entry: FeedEntry, filter: FeedFilter): boolean {
  if (entry.kind === "multiplex") return filter !== "cards";
  const { type, importance } = entry.event;
  switch (filter) {
    case "all":
      return true;
    case "highlights":
      return importance >= 1;
    case "goals":
      return type === "goal" || type === "var";
    case "cards":
      return type === "yellow" || type === "red";
  }
}

export function EventFeed({ entries, started }: { entries: FeedEntry[]; started: boolean }) {
  const [filter, setFilter] = useState<FeedFilter>("highlights");
  const visible = entries.filter((e) => keep(e, filter));

  return (
    <section className="flex flex-col" aria-label="Fil du match">
      <SectionTitle title="Fil du match" aside={`${entries.filter((e) => e.kind === "match").length} actions`} />
      <div className="mt-3 flex flex-wrap gap-1" role="group" aria-label="Filtrer le fil">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            aria-pressed={filter === f.id}
            className={cn(
              "label border border-ink px-2.5 py-1",
              filter === f.id ? "bg-ink text-paper" : "hover:bg-accent hover:text-on-accent",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <ol className="no-scrollbar relative mt-3 max-h-[75vh] overflow-y-auto" aria-live="polite" aria-relevant="additions">
        <AnimatePresence initial={false}>
          {visible.map((entry) => (
            <motion.li
              key={entry.id}
              layout="position"
              initial={{ opacity: 0, x: 14 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {entry.kind === "match" ? <MatchRow event={entry.event} teamName={entry.teamName} /> : <MultiplexRow entry={entry} />}
            </motion.li>
          ))}
        </AnimatePresence>
        {visible.length === 0 && (
          <li className="editorial py-10 text-2xl text-ink/45">
            {started ? "Rien pour l'instant dans cette catégorie." : "En attente du coup d'envoi…"}
          </li>
        )}
      </ol>
    </section>
  );
}

function EventIcon({ event }: { event: SimEvent }) {
  const size = 14;
  switch (event.type) {
    case "goal":
      return <span className="display text-sm leading-none">BUT</span>;
    case "yellow":
      return <CardIcon color="yellow" />;
    case "red":
      return <CardIcon color="red" />;
    case "substitution":
      return <ArrowLeftRight size={size} aria-hidden="true" />;
    case "corner":
    case "offside":
      return <Flag size={size} aria-hidden="true" />;
    case "save":
      return <Hand size={size} aria-hidden="true" />;
    case "big_chance":
      return <Zap size={size} aria-hidden="true" />;
    case "shot":
      return <Crosshair size={size} aria-hidden="true" />;
    case "var":
      return <MonitorPlay size={size} aria-hidden="true" />;
    case "kickoff":
    case "half_time":
    case "full_time":
      return <Timer size={size} aria-hidden="true" />;
    default:
      return <span aria-hidden="true" className="inline-block h-1.5 w-1.5 bg-ink/40" />;
  }
}

const TYPE_LABEL: Record<SimEvent["type"], string> = {
  kickoff: "Coup d'envoi",
  shot: "Tir",
  shot_on_target: "Tir cadré",
  save: "Arrêt",
  big_chance: "Grosse occasion",
  goal: "But",
  corner: "Corner",
  foul: "Faute",
  offside: "Hors-jeu",
  yellow: "Carton jaune",
  red: "Carton rouge",
  substitution: "Changement",
  var: "VAR",
  half_time: "Mi-temps",
  full_time: "Fin du match",
};

function MatchRow({ event, teamName }: { event: SimEvent; teamName?: string }) {
  const goal = event.type === "goal";
  const alert = event.type === "red" || (event.type === "var" && event.varOverturned);
  const period = event.type === "half_time" || event.type === "full_time" || event.type === "kickoff";
  const minor = event.importance === 0;

  return (
    <div
      className={cn(
        "grid grid-cols-[3.75rem_1fr] gap-3 border-b py-2.5",
        goal ? "border-ink bg-accent px-2 text-on-accent" : alert ? "border-ink bg-live px-2 text-paper" : period ? "border-ink bg-ink px-2 text-paper" : "border-ink/20",
      )}
    >
      <span className={cn("display leading-none tabular", minor || event.addedTime ? "text-xl" : "text-3xl", minor && "text-ink/50")}>
        {minuteLabel(event)}
      </span>
      <div className="min-w-0">
        <span className={cn("label inline-flex items-center gap-1.5", !goal && !alert && !period && "text-ink/60")}>
          <EventIcon event={event} />
          {TYPE_LABEL[event.type]}
          {teamName && !period && <span className="opacity-70">· {teamCode(teamName)}</span>}
          {event.xg !== undefined && event.type !== "goal" && <span className="tabular opacity-70">· xG {event.xg.toFixed(2)}</span>}
        </span>
        <p className={cn("mt-1 leading-relaxed", minor ? "text-[12px] text-ink/65" : "text-[13px]", goal && "font-semibold")}>
          {event.text}
        </p>
      </div>
    </div>
  );
}

function MultiplexRow({ entry }: { entry: Extract<FeedEntry, { kind: "multiplex" }> }) {
  return (
    <div className="grid grid-cols-[3.75rem_1fr] gap-3 border-b border-dashed border-ink/40 py-2.5">
      <span className="display text-xl leading-none text-ink/60 tabular">{entry.label}</span>
      <div className="min-w-0">
        <span className="label inline-flex items-center gap-1.5 text-accent-text">
          <Radio size={14} aria-hidden="true" /> Multiplex
        </span>
        <p className="mt-1 text-[13px] leading-relaxed">{entry.text}</p>
      </div>
    </div>
  );
}

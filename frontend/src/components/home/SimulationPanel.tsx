import Link from "next/link";
import { getUpcomingMatches } from "@/src/lib/data/matches";
import { fullTeamName, isOmTeam, shortTeamName } from "@/src/lib/ui/teams";
import { cn } from "@/src/lib/ui/cn";
import type { MatchView } from "@/src/lib/types/match";

const PARIS_TZ = "Europe/Paris";

function formatFullDate(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: PARIS_TZ,
  }).format(date);
}

function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: PARIS_TZ,
  }).format(date);
}

/**
 * Bandeau du SEUL prochain match à simuler.
 * Seul ce match dispose de l'accès à la simulation.
 */
function FeaturedMatchBanner({ match }: { match: MatchView }) {
  const matchDate = new Date(match.date);

  return (
    <Link href={`/simulation/${match.id}`} prefetch className="group block">
      <p className="label flex items-center gap-2 text-paper/60">
        <span className="pulse-dot text-accent-inverse" aria-hidden="true" />
        Seul match ouvert à la simulation · <span className="capitalize">{formatFullDate(matchDate)}</span>
      </p>

      <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-end gap-3 md:gap-8">
        <TeamBlock name={match.home_team_name} align="left" />
        <span className="editorial pb-2 text-2xl text-paper/60 md:text-4xl">contre</span>
        <TeamBlock name={match.away_team_name} align="right" />
      </div>

      <div className="mt-8 flex flex-col items-start justify-between gap-4 border-t border-paper/25 pt-5 sm:flex-row sm:items-center">
        <p className="label text-paper/60">Onze probables · remplaçants · duel des coachs · moteur IA</p>
        <span className="label inline-flex items-center gap-3 border border-paper bg-accent px-6 py-4 text-sm text-on-accent transition-all duration-150 group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 group-hover:shadow-[5px_5px_0_0_var(--paper)] group-active:translate-x-0 group-active:translate-y-0 group-active:shadow-none">
          Lancer la simulation <span className="arrow">→</span>
        </span>
      </div>
    </Link>
  );
}

function TeamBlock({ name, align }: { name: string; align: "left" | "right" }) {
  const om = isOmTeam(name);
  return (
    <div className={cn("min-w-0", align === "right" && "text-right")}>
      <p className={cn("display text-[clamp(3.5rem,9vw,8rem)]", om ? "text-accent-inverse" : "text-paper")}>
        {shortTeamName(name)}
      </p>
      <p className="label mt-2 truncate text-paper/50">{fullTeamName(name)}</p>
    </div>
  );
}

/**
 * Rencontres suivantes : AFFICHAGE INFORMATIF UNIQUEMENT.
 * Aucune action de simulation n'est disponible avant d'avoir joué le match précédent.
 */
function LockedMatchRow({ match, index }: { match: MatchView; index: number }) {
  return (
    <li className="grid grid-cols-[2rem_1fr_auto] items-baseline gap-3 border-t border-paper/20 py-3">
      <span className="text-[11px] tabular text-paper/40">{String(index).padStart(2, "0")}</span>
      <p className="display text-xl leading-tight text-paper/80">
        {shortTeamName(match.home_team_name)} <span className="text-paper/35">–</span>{" "}
        {shortTeamName(match.away_team_name)}
      </p>
      <span className="flex items-center gap-3">
        <span className="hidden text-[11px] tabular text-paper/50 sm:inline">
          {formatShortDate(new Date(match.date))}
        </span>
        <span className="label border border-paper/30 px-1.5 py-0.5 text-paper/50">Verrouillé</span>
      </span>
    </li>
  );
}

export async function SimulationPanel() {
  const matches = await getUpcomingMatches(6);
  const featured = matches[0];
  const others = matches.slice(1);

  return (
    <section className="ink-block relative left-1/2 w-screen -translate-x-1/2 py-10 md:py-14">
      <div className="mx-auto max-w-[1400px] px-4 md:px-8 lg:px-12">
        <div className="flex items-baseline justify-between gap-2 border-b border-paper/25 pb-3">
          <p className="label text-paper/60">
            <span className="text-accent-inverse">03</span> — Simulation IA
          </p>
          <p className="label flex items-center gap-2 text-paper/60">Moteur actif</p>
        </div>

        {matches.length === 0 ? (
          <div className="py-12">
            <p className="display text-6xl text-paper/40 md:text-8xl">Saison bouclée.</p>
            <p className="editorial mt-3 text-xl text-paper/70">
              Tous les matchs ont été simulés : le calendrier complet de la saison a été joué.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-8">{featured && <FeaturedMatchBanner match={featured} />}</div>

            {others.length > 0 && (
              <aside className="lg:col-span-4 lg:border-l lg:border-paper/25 lg:pl-8">
                <p className="label text-paper/60">À suivre</p>
                <p className="editorial mb-4 mt-1 text-base text-paper/60">
                  Simulation ouverte une fois le match en cours joué.
                </p>
                <ul className="border-b border-paper/20">
                  {others.map((match, i) => (
                    <LockedMatchRow key={match.id} match={match} index={i + 2} />
                  ))}
                </ul>
              </aside>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

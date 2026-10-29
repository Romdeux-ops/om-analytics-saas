import { MatchCountdown } from "@/src/components/home/MatchCountdown";
import { getNextOmFixture } from "@/src/lib/data/calendar";
import { getCompetition } from "@/src/lib/data/competitions";
import { isOmTeam, shortTeamName } from "@/src/lib/ui/teams";
import { cn } from "@/src/lib/ui/cn";

const PARIS_TZ = "Europe/Paris";

function formatMatchDate(dateStr: string, timeTbd: boolean): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    ...(timeTbd ? ({ year: "numeric" } as const) : ({ hour: "2-digit", minute: "2-digit" } as const)),
    timeZone: PARIS_TZ,
  }).format(date);
}

/** Le prochain match en billet pleine largeur : affiche à gauche, talon à droite. */
export async function NextMatchHighlight() {
  const fixture = await getNextOmFixture();

  if (!fixture) {
    return (
      <section className="mb-12 border-t-[6px] border-ink pt-3">
        <p className="label text-ink/60">Prochain match</p>
        <p className="editorial mt-3 text-xl text-ink/70">Aucun match à venir pour l&apos;OM.</p>
      </section>
    );
  }

  const isHome = fixture.homeTeam === "Marseille";
  const competition = getCompetition(fixture.competition);

  return (
    <section className="mb-14 grid border border-ink md:grid-cols-[1fr_18rem]">
      <div className="p-5 md:p-8">
        <p className="label text-ink/60">
          Billet · {competition.label} · Journée {fixture.matchday}
        </p>
        <p className="display mt-4 text-[clamp(3.5rem,9vw,8rem)] text-ink">
          <Team name={fixture.homeTeam} />
          <span className="editorial mx-3 align-middle text-[0.3em] normal-case text-ink/60">contre</span>
          <Team name={fixture.awayTeam} />
        </p>
        <p className="mt-4 text-sm font-bold uppercase">
          {isHome ? "Orange Vélodrome, Marseille" : `Déplacement — ${shortTeamName(fixture.homeTeam)}`}
          <span className="mx-2 text-ink/40">/</span>
          <span className="capitalize">{formatMatchDate(fixture.date, fixture.timeTbd)}</span>
        </p>
        <div className="mt-8">
          <MatchCountdown targetDate={fixture.date} />
        </div>
      </div>

      <div className="ink-block flex flex-col justify-between gap-6 border-t border-dashed border-ink p-5 md:border-l md:border-t-0 md:p-6">
        <div>
          <p className="label text-paper/60">Lieu</p>
          <p className="display mt-1 text-4xl">{isHome ? "Vélodrome" : shortTeamName(fixture.homeTeam)}</p>
        </div>
        <div>
          <p className="label text-paper/60">Simulation</p>
          <p className="editorial mt-1 text-lg leading-snug text-paper/80">
            Le moteur de prédiction ouvrira bientôt pour ce match.
          </p>
        </div>
        <p className="display text-6xl tabular text-accent-inverse">J{fixture.matchday}</p>
      </div>
    </section>
  );
}

function Team({ name }: { name: string }) {
  return <span className={cn(isOmTeam(name) ? "text-accent-text" : "text-ink")}>{shortTeamName(name)}</span>;
}

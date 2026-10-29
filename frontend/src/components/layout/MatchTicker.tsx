import { getAllOmFixtures } from "@/src/lib/data/calendar";
import { getCompetition } from "@/src/lib/data/competitions";
import { getStandings } from "@/src/lib/data/standings";
import { isOmTeam, shortTeamName } from "@/src/lib/ui/teams";

const PARIS_TZ = "Europe/Paris";

function formatTickerDate(iso: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: PARIS_TZ,
  }).format(new Date(iso));
}

export async function MatchTicker() {
  const [fixtures, standings] = await Promise.all([getAllOmFixtures(), getStandings()]);
  const played = fixtures.filter((f) => f.played).slice(-3).reverse();
  const next = fixtures.find((f) => !f.played);
  const om = standings.find((row) => row.isOm);

  const items: { key: string; label: string; value: string; live?: boolean }[] = [];

  if (next) {
    items.push({
      key: "next",
      label: "Prochain",
      value: `${shortTeamName(next.homeTeam)} – ${shortTeamName(next.awayTeam)} · ${getCompetition(next.competition).shortLabel} · ${formatTickerDate(next.date)}`,
      live: true,
    });
  }
  if (om) {
    items.push({
      key: "rank",
      label: "Ligue 1",
      value: `OM ${om.rank}${om.rank === 1 ? "er" : "e"} · ${om.points} pts · ${om.won}V ${om.drawn}N ${om.lost}D`,
    });
  }
  for (const f of played) {
    const omHome = isOmTeam(f.homeTeam);
    const omGoals = omHome ? f.homeScore : f.awayScore;
    const oppGoals = omHome ? f.awayScore : f.homeScore;
    const verdict =
      omGoals === undefined || oppGoals === undefined
        ? ""
        : omGoals > oppGoals
          ? "V"
          : omGoals === oppGoals
            ? "N"
            : "D";
    items.push({
      key: `${f.date}-${f.homeTeam}`,
      label: verdict ? `Résultat ${verdict}` : "Résultat",
      value: `${shortTeamName(f.homeTeam)} ${f.homeScore ?? "-"}–${f.awayScore ?? "-"} ${shortTeamName(f.awayTeam)}`,
    });
  }
  items.push({ key: "motto", label: "Marseille", value: "Droit au but →" });

  // Contenu doublé pour une boucle continue (translateX -50%)
  const loop = [...items, ...items];

  return (
    <div className="ticker overflow-hidden border-b border-ink bg-ink text-paper" aria-label="Fil d'infos OM">
      <ul className="ticker-track py-2">
        {loop.map((item, i) => (
          <li
            key={`${item.key}-${i}`}
            aria-hidden={i >= items.length || undefined}
            className="flex shrink-0 items-center gap-3 whitespace-nowrap px-6 text-[11px] uppercase tracking-[0.1em]"
          >
            {item.live && <span className="pulse-dot text-live" aria-hidden="true" />}
            <span className="font-bold text-accent-inverse">{item.label}</span>
            <span className="tabular">{item.value}</span>
            <span className="pl-3 text-paper/40" aria-hidden="true">
              {"///"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

import type { MatchModelInput } from "@/src/lib/simulation";
import { formatPct, teamCode } from "./shared";

/** Message affiché à la place des probabilités quand le match n'est pas couvert par le modèle. */
export function NoProbabilityNotice() {
  return (
    <div className="border border-dashed border-ink p-4" role="note">
      <p className="label text-ink/55">Aucune probabilité affichée</p>
      <p className="editorial mt-2 text-lg leading-snug text-ink/75">
        Le modèle de prédiction n&apos;est calibré que sur la Ligue 1. Pour ce match, aucune force n&apos;est estimée pour
        l&apos;adversaire : la simulation ci-dessous est illustrative et ne vaut pas pronostic.
      </p>
    </div>
  );
}

const factor = (logValue: number) => `× ${Math.exp(logValue).toFixed(2).replace(".", ",")}`;
const range = ([lo, hi]: [number, number]) => `${Math.round(lo * 100)}–${Math.round(hi * 100)} %`;

/**
 * Paramètres et provenance de la prédiction : ce que le modèle sait, d'où il le tient,
 * et la part d'incertitude qu'il mesure.
 */
export function ModelNotes({ model, homeName, awayName }: { model: MatchModelInput; homeName: string; awayName: string }) {
  const { provenance: p } = model;
  const date = new Date(p.dataThrough).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  const teams = [
    { name: homeName, info: p.home },
    { name: awayName, info: p.away },
  ];

  return (
    <details className="border-t border-ink pt-3">
      <summary className="label cursor-pointer text-ink/55">
        Modèle Dixon-Coles · résultats de Ligue 1 jusqu&apos;au {date} · hypothèses et paramètres
      </summary>
      <div className="mt-3 space-y-3 text-[13px] leading-relaxed text-ink/75">
        {p.interval && (
          <p>
            Intervalle à 90 % lié à l&apos;incertitude sur les forces : {teamCode(homeName)} {range(p.interval.home)}, nul{" "}
            {range(p.interval.draw)}, {teamCode(awayName)} {range(p.interval.away)}.
            {p.pointEstimate && <> Sans cette incertitude, le modèle donnerait {formatPct(p.pointEstimate.home)} à {teamCode(homeName)}.</>}
          </p>
        )}
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2">
          {teams.map(({ name, info }) => (
            <div key={name}>
              <dt className="label text-ink/55">
                {teamCode(name)}
                {info.promoted ? " · promu" : ""}
              </dt>
              <dd className="tabular">
                Buts marqués {factor(info.att)} · buts encaissés {factor(info.def)} · Elo {Math.round(info.elo)}
              </dd>
            </div>
          ))}
        </dl>
        <p className="tabular">
          Avantage du domicile estimé : × {p.homeFactor.toFixed(2).replace(".", ",")} sur les buts · correction des petits scores ρ ={" "}
          {p.rho.toFixed(3).replace(".", ",")} · {p.matchesUsed} matchs ajustés.
        </p>
        <p>
          Les forces sont exprimées par rapport à un club moyen de Ligue 1. Le modèle ne connaît ni les compositions, ni les absences, ni
          le repos : ces éléments n&apos;ont pas pu être validés sur l&apos;historique et ne déplacent pas les probabilités. Il est moins
          fiable sur les promus et tend à surestimer les gros favoris.
        </p>
      </div>
    </details>
  );
}

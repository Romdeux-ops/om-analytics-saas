"use client";

import { memo, useState } from "react";
import Image from "next/image";
import type { MatchEditorialPreview } from "@/src/lib/data/match-preview";
import { MatchEditorialEditorModal } from "@/src/components/presentation/MatchEditorialEditorModal";
import { SectionHeading } from "@/src/components/ui/SectionHeading";

interface MatchEditorialSectionProps {
  editorial: MatchEditorialPreview;
  matchId?: number;
  isAdmin?: boolean;
  onEditorialUpdated?: (updated: MatchEditorialPreview) => void;
}

/** L'avant-match mis en page comme un article de journal. */
export const MatchEditorialSection = memo(function MatchEditorialSection({
  editorial,
  matchId,
  isAdmin = false,
  onEditorialUpdated,
}: MatchEditorialSectionProps) {
  const [editorOpen, setEditorOpen] = useState(false);
  const { tendency } = editorial;

  return (
    <section>
      <SectionHeading
        index="03"
        title={editorial.isFromPress ? "L'avant-match" : "L'analyse"}
        subtitle={
          editorial.isFromPress
            ? `Dépêche relayée depuis ${editorial.pressSource} · Couverture officielle`
            : "Analyse pré-match générée par IA · statistiques et tactique"
        }
        action={
          <span className="flex flex-wrap items-center justify-end gap-2">
            {editorial.isCustomized && <span className="bg-accent px-2 py-1 text-on-accent">Édité par le staff</span>}
            {isAdmin && matchId && (
              <button
                type="button"
                onClick={() => setEditorOpen(true)}
                className="pressable border border-ink px-2 py-1 hover:bg-ink hover:text-paper"
              >
                Réécrire les textes IA
              </button>
            )}
            <span className="border border-ink px-2 py-1">{editorial.sourceBadge}</span>
          </span>
        }
      />

      {isAdmin && matchId && (
        <MatchEditorialEditorModal
          open={editorOpen}
          onClose={() => setEditorOpen(false)}
          matchId={matchId}
          initialEditorial={editorial}
          onSaved={(updated) => {
            onEditorialUpdated?.(updated);
          }}
        />
      )}

      <div className="grid gap-10 lg:grid-cols-12">
        {/* Article */}
        <article className="lg:col-span-8">
          <p className="label text-ink/60">
            {editorial.isFromPress ? `Avant-match · ${editorial.pressSource}` : "Analyse IA · OM Analytics"} ·{" "}
            {editorial.readTimeMinutes} min de lecture · Publié le {editorial.publishedDateFormatted}
          </p>
          <h2 className="editorial mt-3 text-4xl normal-case leading-[1.02] text-ink md:text-6xl">
            {editorial.headline}
          </h2>
          <p className="mt-4 border-b border-ink pb-5 text-base font-bold leading-relaxed">
            {editorial.subheadline}
          </p>

          <div className="mt-6 gap-8 text-[13px] leading-relaxed text-ink/85 md:columns-2 md:[column-rule:1px_solid_var(--rule)]">
            {editorial.paragraphs.map((p, i) => (
              <p key={i} className="mb-4 text-justify [hyphens:auto]">
                {i === 0 && (
                  <span className="display float-left mr-2 mt-1 text-7xl leading-[0.75] text-accent-text">
                    {p.charAt(0)}
                  </span>
                )}
                {i === 0 ? p.slice(1) : p}
              </p>
            ))}
          </div>

          {editorial.isFromPress && editorial.pressUrl ? (
            <a
              href={editorial.pressUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group mt-6 flex items-center justify-between gap-4 border-y border-ink py-4 invert-hover"
            >
              <span>
                <span className="label block opacity-60">Source de la dépêche : {editorial.pressSource}</span>
                <span className="display mt-1 block text-2xl">Lire l&apos;article complet</span>
              </span>
              <span className="arrow display text-4xl">↗</span>
            </a>
          ) : (
            <p className="mt-6 border-l-[6px] border-ink pl-4 text-xs leading-relaxed text-ink/70">
              <span className="label mb-1 block text-ink">Généré par intelligence artificielle</span>
              {editorial.disclaimer ||
                "Ce texte a été généré automatiquement par l'IA à partir des statistiques de la saison (classement officiel, forme des 5 derniers matchs et compositions probables)."}
            </p>
          )}

          <div className="mt-10 border-t-[6px] border-ink pt-3">
            <p className="label text-ink/60">Les 3 clés tactiques de la rencontre</p>
            <ol className="mt-4 grid gap-6 md:grid-cols-3">
              {editorial.tacticalKeys.map((key, i) => (
                <li key={i} className="border-t border-ink pt-3">
                  <span className="display text-6xl leading-none text-accent-text">{i + 1}</span>
                  <h5 className="mt-2 text-xs font-bold uppercase">{key.title}</h5>
                  <p className="mt-1.5 text-xs leading-relaxed text-ink/70">{key.description}</p>
                </li>
              ))}
            </ol>
          </div>
        </article>

        {/* Encadrés */}
        <aside className="space-y-8 lg:col-span-4 lg:border-l lg:border-ink lg:pl-8">
          <div className="ink-block p-5">
            <p className="label text-paper/60">Le joueur à suivre</p>
            <p className="display mt-2 text-5xl">{editorial.keyPlayer.name}</p>
            <p className="label mt-1 text-accent-inverse">{editorial.keyPlayer.team}</p>
            <p className="editorial mt-4 text-lg leading-snug text-paper/80">{editorial.keyPlayer.description}</p>
          </div>

          <div>
            <p className="label text-ink/60">Tendance IA · 1 N 2</p>
            <div className="mt-3 flex h-14 w-full border border-ink" aria-hidden="true">
              <div style={{ width: `${tendency.homeWinPct}%` }} className="bg-ink" />
              <div
                style={{ width: `${tendency.drawPct}%` }}
                className="border-x border-ink bg-[repeating-linear-gradient(135deg,var(--ink)_0_1px,transparent_1px_6px)]"
              />
              <div style={{ width: `${tendency.awayWinPct}%` }} className="bg-accent" />
            </div>
            <dl className="mt-2 grid grid-cols-3 text-center">
              <div className="text-left">
                <dt className="label text-ink/60">1</dt>
                <dd className="display text-3xl tabular">{tendency.homeWinPct}%</dd>
              </div>
              <div>
                <dt className="label text-ink/60">N</dt>
                <dd className="display text-3xl tabular">{tendency.drawPct}%</dd>
              </div>
              <div className="text-right">
                <dt className="label text-ink/60">2</dt>
                <dd className="display text-3xl tabular">{tendency.awayWinPct}%</dd>
              </div>
            </dl>
            <p className="editorial mt-3 text-lg leading-snug text-ink/75">{tendency.predictionText}</p>
          </div>

          {editorial.pressArticles.length > 0 && (
            <div className="border-t-[6px] border-ink pt-3">
              <p className="label text-ink/60">Revue de presse</p>
              <ul className="mt-2">
                {editorial.pressArticles.map((article, i) => (
                  <li key={i}>
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-start justify-between gap-3 border-b border-ink/20 py-3"
                    >
                      {article.imageUrl && (
                        <span className="block w-24 shrink-0 overflow-hidden border border-ink bg-ink/10">
                          <Image
                            src={article.imageUrl}
                            alt=""
                            width={192}
                            height={128}
                            unoptimized
                            className="aspect-[3/2] w-full object-cover transition-transform duration-300 group-hover:scale-[1.05]"
                          />
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="label block text-ink/50">{article.source}</span>
                        <span className="editorial mt-0.5 block text-lg leading-tight decoration-accent decoration-2 underline-offset-4 group-hover:underline">
                          {article.title}
                        </span>
                      </span>
                      <span className="arrow mt-4 shrink-0">↗</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
});

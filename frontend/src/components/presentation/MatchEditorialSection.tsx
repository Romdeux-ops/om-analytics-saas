"use client";

import { memo } from "react";
import {
  Newspaper,
  ExternalLink,
  Flame,
  Key,
  Star,
  TrendingUp,
  Clock,
  Sparkles,
} from "lucide-react";
import type { MatchEditorialPreview } from "@/src/lib/data/match-preview";

interface MatchEditorialSectionProps {
  editorial: MatchEditorialPreview;
}

export const MatchEditorialSection = memo(function MatchEditorialSection({
  editorial,
}: MatchEditorialSectionProps) {
  return (
    <section className="space-y-5">
      {/* En-tête */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-xl border ${
              editorial.isFromPress
                ? "border-amber-400/30 bg-amber-500/10 text-amber-400"
                : "border-cyan-400/30 bg-cyan-500/10 text-cyan-400"
            }`}
          >
            {editorial.isFromPress ? <Newspaper size={16} /> : <Sparkles size={16} />}
          </span>
          <div>
            <h3 className="font-tech text-base font-bold uppercase tracking-wider text-white">
              {editorial.isFromPress
                ? `Présentation & Avant-Match : ${editorial.pressSource || "Presse"}`
                : "Présentation & Analyse Éditoriale IA"}
            </h3>
            <p className="text-xs text-slate-400">
              {editorial.isFromPress
                ? `Dépêche relayée depuis ${editorial.pressSource} · Couverture officielle Ligue 1`
                : "Analyse pré-match générée par intelligence artificielle · Statistiques et tactique"}
            </p>
          </div>
        </div>

        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold ${
            editorial.isFromPress
              ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
              : "border-cyan-500/30 bg-cyan-500/10 text-cyan-300"
          }`}
        >
          {editorial.isFromPress ? <Newspaper size={12} /> : <Sparkles size={12} />}
          {editorial.sourceBadge}
        </span>
      </div>

      {/* Carte Article Principal */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900/90 via-slate-950/95 to-black p-6 shadow-2xl backdrop-blur-2xl md:p-8">
        {/* En-tête de l'article */}
        <div className="border-b border-white/10 pb-6">
          <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-slate-400">
            <span
              className={`rounded px-2 py-0.5 font-bold uppercase tracking-wider text-[10px] ${
                editorial.isFromPress
                  ? "bg-amber-500/20 text-amber-300 border border-amber-400/30"
                  : "bg-cyan-500/20 text-cyan-300 border border-cyan-400/30"
              }`}
            >
              {editorial.isFromPress
                ? `Avant-Match Presse · ${editorial.pressSource}`
                : "Analyse IA · OM Analytics"}
            </span>
            <span className="flex items-center gap-1 text-slate-400">
              <Clock size={12} />
              {editorial.readTimeMinutes} min de lecture
            </span>
            <span className="text-slate-600">·</span>
            <span>Publié le {editorial.publishedDateFormatted}</span>
          </div>

          <h2 className="font-tech text-2xl font-black uppercase tracking-tight text-white md:text-3xl lg:text-4xl">
            {editorial.headline}
          </h2>

          <p className="mt-3 text-sm font-medium leading-relaxed text-slate-300 md:text-base md:leading-relaxed">
            {editorial.subheadline}
          </p>
        </div>

        {/* Corps de texte */}
        <div className="mt-6 space-y-4 text-sm leading-relaxed text-slate-300 md:text-base md:leading-loose">
          {editorial.paragraphs.map((p, i) => (
            <p key={i} className="text-justify text-slate-300/90">
              {i === 0 && (
                <span
                  className={`float-left mr-2 font-tech text-4xl font-black leading-none ${
                    editorial.isFromPress ? "text-amber-400" : "text-cyan-400"
                  }`}
                >
                  {p.charAt(0)}
                </span>
              )}
              {i === 0 ? p.slice(1) : p}
            </p>
          ))}
        </div>

        {/* Bloc Lien Article Presse Complet (si trouvé) */}
        {editorial.isFromPress && editorial.pressUrl && (
          <div className="mt-8 rounded-2xl border border-amber-400/30 bg-gradient-to-r from-amber-950/40 via-slate-900/80 to-slate-950 p-5 shadow-xl backdrop-blur-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Newspaper size={16} className="text-amber-400" />
                  <h4 className="font-tech text-sm font-bold uppercase tracking-wider text-white">
                    Source de la dépêche : {editorial.pressSource}
                  </h4>
                </div>
                <p className="text-xs text-slate-300">
                  Retrouvez l&apos;intégralité de l&apos;article, les déclarations et les analyses détaillées du journal.
                </p>
              </div>
              <a
                href={editorial.pressUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-slate-950 shadow-lg shadow-amber-500/25 transition-transform hover:scale-105 shrink-0"
              >
                <span>Lire l&apos;article complet</span>
                <ExternalLink size={14} />
              </a>
            </div>
          </div>
        )}

        {/* Bloc Disclaimer IA (si texte généré par IA) */}
        {!editorial.isFromPress && (
          <div className="mt-8 flex items-start gap-3 rounded-2xl border border-cyan-400/20 bg-cyan-500/[0.05] p-4 text-xs text-slate-300">
            <Sparkles size={16} className="text-cyan-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-cyan-300 uppercase text-[11px] tracking-wider">
                Génération par Intelligence Artificielle
              </p>
              <p className="text-slate-400 leading-relaxed">
                {editorial.disclaimer ||
                  "Ce texte a été généré automatiquement par l'IA à partir des statistiques de la saison (classement officiel, forme des 5 derniers matchs et compositions probables)."}
              </p>
            </div>
          </div>
        )}

        {/* 3 clés tactiques */}
        <div className="mt-8 border-t border-white/10 pt-6">
          <div className="mb-4 flex items-center gap-2">
            <Key size={16} className="text-cyan-400" />
            <h4 className="font-tech text-sm font-bold uppercase tracking-wider text-white">
              Les 3 clés tactiques de la rencontre
            </h4>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {editorial.tacticalKeys.map((key, i) => (
              <div
                key={i}
                className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition-colors hover:border-cyan-400/20 hover:bg-white/[0.04]"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500/20 text-[10px] font-bold text-cyan-300">
                    {i + 1}
                  </span>
                  <h5 className="text-xs font-bold text-white uppercase">{key.title}</h5>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{key.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bloc Joueur Clé & Tendance */}
        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 border-t border-white/10 pt-6">
          {/* Joueur clé */}
          <div className="rounded-2xl border border-amber-400/20 bg-amber-500/[0.04] p-4">
            <div className="flex items-center gap-2 mb-2">
              <Star size={16} className="text-amber-400 fill-amber-400/20" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                Le Joueur à Suivre
              </span>
            </div>
            <h5 className="font-tech text-lg font-black text-white uppercase">
              {editorial.keyPlayer.name}
            </h5>
            <span className="text-xs text-slate-400 block mb-2">{editorial.keyPlayer.team}</span>
            <p className="text-xs text-slate-300 leading-relaxed">
              {editorial.keyPlayer.description}
            </p>
          </div>

          {/* Tendance IA */}
          <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/[0.04] p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={16} className="text-cyan-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300">
                Tendance IA &amp; Probabilités
              </span>
            </div>
            {/* Barre de répartition */}
            <div className="mb-3 space-y-1">
              <div className="flex justify-between text-[10px] font-mono font-bold text-slate-300">
                <span>1 ({editorial.tendency.homeWinPct}%)</span>
                <span>N ({editorial.tendency.drawPct}%)</span>
                <span>2 ({editorial.tendency.awayWinPct}%)</span>
              </div>
              <div className="flex h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  style={{ width: `${editorial.tendency.homeWinPct}%` }}
                  className="bg-cyan-400"
                />
                <div
                  style={{ width: `${editorial.tendency.drawPct}%` }}
                  className="bg-slate-400"
                />
                <div
                  style={{ width: `${editorial.tendency.awayWinPct}%` }}
                  className="bg-blue-500"
                />
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {editorial.tendency.predictionText}
            </p>
          </div>
        </div>
      </div>

      {/* Revue de presse & Dépêches récentes scrapées */}
      {editorial.pressArticles.length > 0 && (
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame size={15} className="text-amber-400" />
              <h4 className="font-tech text-xs font-bold uppercase tracking-wider text-slate-300">
                Revue de Presse &amp; Dépêches en Direct
              </h4>
            </div>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest">
              Flux d&apos;actualité sportive
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {editorial.pressArticles.map((article, i) => (
              <a
                key={i}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3 transition-colors hover:border-cyan-400/30 hover:bg-white/[0.05]"
              >
                <div className="min-w-0 flex-1">
                  <span className="rounded bg-white/5 px-1.5 py-0.5 text-[9px] font-bold text-slate-400 uppercase">
                    {article.source}
                  </span>
                  <p className="mt-1 line-clamp-2 text-xs font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors">
                    {article.title}
                  </p>
                </div>
                <ExternalLink
                  size={14}
                  className="shrink-0 text-slate-600 transition-colors group-hover:text-cyan-400 mt-1"
                />
              </a>
            ))}
          </div>
        </div>
      )}
    </section>
  );
});

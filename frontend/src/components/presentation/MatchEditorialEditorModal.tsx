"use client";

import { useState } from "react";
import { Modal } from "@/src/components/ui/Modal";
import {
  Sparkles,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  FileText,
  Key,
  Star,
  TrendingUp,
} from "lucide-react";
import type { MatchEditorialPreview } from "@/src/lib/data/match-preview";
import { saveMatchEditorialAction, resetMatchEditorialAction } from "@/src/app/actions/match";

interface MatchEditorialEditorModalProps {
  open: boolean;
  onClose: () => void;
  matchId: number;
  initialEditorial: MatchEditorialPreview;
  onSaved: (updated: MatchEditorialPreview) => void;
}

export function MatchEditorialEditorModal({
  open,
  onClose,
  matchId,
  initialEditorial,
  onSaved,
}: MatchEditorialEditorModalProps) {
  const [activeTab, setActiveTab] = useState<"article" | "paragraphs" | "keys" | "prediction">("article");

  // Form states
  const [headline, setHeadline] = useState(initialEditorial.headline);
  const [subheadline, setSubheadline] = useState(initialEditorial.subheadline);
  const [paragraphs, setParagraphs] = useState<string[]>(
    initialEditorial.paragraphs.length > 0 ? [...initialEditorial.paragraphs] : [""],
  );
  const [tacticalKeys, setTacticalKeys] = useState(
    initialEditorial.tacticalKeys.length > 0
      ? initialEditorial.tacticalKeys.map((k) => ({ ...k }))
      : [
          { title: "", description: "" },
          { title: "", description: "" },
          { title: "", description: "" },
        ],
  );
  const [keyPlayerName, setKeyPlayerName] = useState(initialEditorial.keyPlayer.name);
  const [keyPlayerDesc, setKeyPlayerDesc] = useState(initialEditorial.keyPlayer.description);
  const [keyPlayerTeam, setKeyPlayerTeam] = useState(initialEditorial.keyPlayer.team);
  const [homeWinPct, setHomeWinPct] = useState(initialEditorial.tendency.homeWinPct);
  const [drawPct, setDrawPct] = useState(initialEditorial.tendency.drawPct);
  const [awayWinPct, setAwayWinPct] = useState(initialEditorial.tendency.awayWinPct);
  const [predictionText, setPredictionText] = useState(initialEditorial.tendency.predictionText);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function handleSave() {
    setSaving(true);
    setError(null);

    const updatedData: MatchEditorialPreview = {
      ...initialEditorial,
      headline: headline.trim() || initialEditorial.headline,
      subheadline: subheadline.trim() || initialEditorial.subheadline,
      paragraphs: paragraphs.filter((p) => p.trim().length > 0),
      tacticalKeys: tacticalKeys.filter((k) => k.title.trim().length > 0),
      keyPlayer: {
        name: keyPlayerName.trim() || initialEditorial.keyPlayer.name,
        team: keyPlayerTeam.trim() || initialEditorial.keyPlayer.team,
        description: keyPlayerDesc.trim() || initialEditorial.keyPlayer.description,
      },
      tendency: {
        homeWinPct: Number(homeWinPct) || 33,
        drawPct: Number(drawPct) || 33,
        awayWinPct: Number(awayWinPct) || 34,
        predictionText: predictionText.trim() || initialEditorial.tendency.predictionText,
      },
      isCustomized: true,
      customizedAt: new Date().toISOString(),
    };

    const res = await saveMatchEditorialAction(matchId, updatedData);
    setSaving(false);

    if (!res.ok) {
      setError(res.error);
      return;
    }

    onSaved(updatedData);
    onClose();
  }

  async function handleReset() {
    if (!window.confirm("Rétablir les textes générés automatiquement par l'IA ?")) return;
    setSaving(true);
    setError(null);

    const res = await resetMatchEditorialAction(matchId);
    setSaving(false);

    if (!res.ok) {
      setError(res.error);
      return;
    }

    window.location.reload();
  }

  return (
    <Modal open={open} onClose={onClose} titleId="editorial-editor-title">
      <div className="space-y-5 max-w-2xl">
        {/* En-tête */}
        <div className="border-b border-white/10 pb-4">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-500/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-cyan-300">
              <Sparkles size={13} />
              Mode Administration Éditoriale
            </span>
          </div>
          <h2 id="editorial-editor-title" className="mt-2 font-tech text-2xl font-black uppercase text-white">
            Réécriture des textes IA
          </h2>
          <p className="text-xs text-slate-400">
            Personnalisez les analyses tactiques, l&apos;article d&apos;avant-match et les pronostics officiels.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs font-semibold text-red-300">
            {error}
          </div>
        )}

        {/* Navigation par onglets */}
        <div className="flex flex-wrap gap-1.5 border-b border-white/5 pb-2">
          {[
            { id: "article", label: "Article & Titres", icon: FileText },
            { id: "paragraphs", label: "Paragraphes", icon: Sparkles },
            { id: "keys", label: "Clés Tactiques", icon: Key },
            { id: "prediction", label: "Joueur & Pronostic", icon: Star },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                  active
                    ? "bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-400/40"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon size={13} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Contenu Onglet 1 : Titres */}
        {activeTab === "article" && (
          <div className="space-y-4 max-h-[50vh] overflow-y-auto no-scrollbar pr-1">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-300">
                Titre principal de l&apos;avant-match
              </label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="Ex: OM - ESTAC Troyes : Le choc sous haute tension..."
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400/50"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-300">
                Sous-titre / Enjeux majeurs
              </label>
              <textarea
                rows={3}
                value={subheadline}
                onChange={(e) => setSubheadline(e.target.value)}
                placeholder="Ex: Respectivement 4e et 12e de Ligue 1, les deux formations s'affrontent..."
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400/50 leading-relaxed"
              />
            </div>
          </div>
        )}

        {/* Contenu Onglet 2 : Paragraphes de l'article */}
        {activeTab === "paragraphs" && (
          <div className="space-y-4 max-h-[50vh] overflow-y-auto no-scrollbar pr-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">
                {paragraphs.length} paragraphe{paragraphs.length > 1 ? "s" : ""} dans l&apos;analyse
              </span>
              <button
                type="button"
                onClick={() => setParagraphs([...paragraphs, ""])}
                className="flex items-center gap-1 rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-cyan-300 hover:bg-cyan-500/20"
              >
                <Plus size={12} />
                <span>Ajouter un paragraphe</span>
              </button>
            </div>

            {paragraphs.map((p, i) => (
              <div key={i} className="space-y-1.5 rounded-xl border border-white/5 bg-white/[0.02] p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Paragraphe {i + 1}
                  </span>
                  {paragraphs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setParagraphs(paragraphs.filter((_, idx) => idx !== i))}
                      className="text-slate-500 hover:text-red-400 transition-colors"
                      title="Supprimer ce paragraphe"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
                <textarea
                  rows={4}
                  value={p}
                  onChange={(e) => {
                    const next = [...paragraphs];
                    next[i] = e.target.value;
                    setParagraphs(next);
                  }}
                  placeholder={`Contenu du paragraphe ${i + 1}...`}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400/50 leading-relaxed"
                />
              </div>
            ))}
          </div>
        )}

        {/* Contenu Onglet 3 : Clés Tactiques */}
        {activeTab === "keys" && (
          <div className="space-y-4 max-h-[50vh] overflow-y-auto no-scrollbar pr-1">
            <p className="text-xs text-slate-400">
              Définissez les 3 points tactiques clés sur lesquels la rencontre va basculer.
            </p>

            {tacticalKeys.map((k, i) => (
              <div key={i} className="space-y-2 rounded-xl border border-white/5 bg-white/[0.02] p-3.5">
                <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-cyan-300">
                  <Key size={12} />
                  Clé Tactique n°{i + 1}
                </span>
                <div>
                  <input
                    type="text"
                    value={k.title}
                    onChange={(e) => {
                      const next = [...tacticalKeys];
                      next[i] = { ...next[i], title: e.target.value };
                      setTacticalKeys(next);
                    }}
                    placeholder={`Titre de la clé tactique ${i + 1}...`}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400/50"
                  />
                </div>
                <div>
                  <textarea
                    rows={2}
                    value={k.description}
                    onChange={(e) => {
                      const next = [...tacticalKeys];
                      next[i] = { ...next[i], description: e.target.value };
                      setTacticalKeys(next);
                    }}
                    placeholder="Description tactique..."
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400/50 leading-relaxed"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Contenu Onglet 4 : Joueur clé & Pronostic */}
        {activeTab === "prediction" && (
          <div className="space-y-4 max-h-[50vh] overflow-y-auto no-scrollbar pr-1">
            {/* Joueur clé */}
            <div className="space-y-2.5 rounded-xl border border-amber-400/20 bg-amber-500/[0.03] p-3.5">
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-300">
                <Star size={12} />
                Le Joueur à Suivre
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-semibold">Nom du joueur</label>
                  <input
                    type="text"
                    value={keyPlayerName}
                    onChange={(e) => setKeyPlayerName(e.target.value)}
                    placeholder="Ex: Amine Gouiri"
                    className="w-full mt-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white outline-none focus:border-amber-400/50"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-semibold">Club / Équipe</label>
                  <input
                    type="text"
                    value={keyPlayerTeam}
                    onChange={(e) => setKeyPlayerTeam(e.target.value)}
                    placeholder="Ex: Olympique de Marseille"
                    className="w-full mt-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white outline-none focus:border-amber-400/50"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-slate-400 uppercase font-semibold">Description / Impact</label>
                <textarea
                  rows={2}
                  value={keyPlayerDesc}
                  onChange={(e) => setKeyPlayerDesc(e.target.value)}
                  placeholder="Ex: Auteur de 4 buts cette saison, l'attaquant olympien est le fer de lance..."
                  className="w-full mt-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none focus:border-amber-400/50"
                />
              </div>
            </div>

            {/* Pronostic et probabilités */}
            <div className="space-y-2.5 rounded-xl border border-cyan-400/20 bg-cyan-500/[0.03] p-3.5">
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-cyan-300">
                <TrendingUp size={12} />
                Pronostic &amp; Probabilités de résultat
              </span>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-semibold">Victoire 1 (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={homeWinPct}
                    onChange={(e) => setHomeWinPct(Number(e.target.value))}
                    className="w-full mt-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white outline-none focus:border-cyan-400/50"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-semibold">Match Nul (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={drawPct}
                    onChange={(e) => setDrawPct(Number(e.target.value))}
                    className="w-full mt-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white outline-none focus:border-cyan-400/50"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-semibold">Victoire 2 (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={awayWinPct}
                    onChange={(e) => setAwayWinPct(Number(e.target.value))}
                    className="w-full mt-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white outline-none focus:border-cyan-400/50"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase font-semibold">Texte du pronostic IA</label>
                <textarea
                  rows={2}
                  value={predictionText}
                  onChange={(e) => setPredictionText(e.target.value)}
                  placeholder="Ex: Léger avantage aux locaux devant leur public..."
                  className="w-full mt-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none focus:border-cyan-400/50"
                />
              </div>
            </div>
          </div>
        )}

        {/* Boutons d'action */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
          <button
            type="button"
            disabled={saving}
            onClick={handleReset}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-400 hover:text-red-400 hover:border-red-400/30 transition-colors"
          >
            <RotateCcw size={13} />
            <span>Rétablir IA d&apos;origine</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              className="rounded-xl border border-white/10 px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
            >
              Annuler
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 via-cyan-300 to-blue-500 px-5 py-2 text-xs font-black uppercase tracking-wider text-slate-950 shadow-lg shadow-cyan-500/25 transition-transform hover:scale-105 disabled:opacity-50"
            >
              <Save size={13} />
              <span>{saving ? "Sauvegarde..." : "Enregistrer les textes"}</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

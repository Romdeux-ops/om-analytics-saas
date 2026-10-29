"use client";

import { useState } from "react";
import { Modal } from "@/src/components/ui/Modal";
import type { MatchEditorialPreview } from "@/src/lib/data/match-preview";
import { saveMatchEditorialAction, resetMatchEditorialAction } from "@/src/app/actions/match";

interface MatchEditorialEditorModalProps {
  open: boolean;
  onClose: () => void;
  matchId: number;
  initialEditorial: MatchEditorialPreview;
  onSaved: (updated: MatchEditorialPreview) => void;
}

const TABS = [
  { id: "article", label: "01 · Titres" },
  { id: "paragraphs", label: "02 · Corps" },
  { id: "keys", label: "03 · Clés" },
  { id: "prediction", label: "04 · Pronostic" },
] as const;

export function MatchEditorialEditorModal({
  open,
  onClose,
  matchId,
  initialEditorial,
  onSaved,
}: MatchEditorialEditorModalProps) {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]["id"]>("article");

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
    <Modal open={open} onClose={onClose} titleId="editorial-editor-title" className="max-w-2xl">
      <div className="space-y-5">
        <div className="border-b border-ink pb-3 pr-8">
          <p className="label text-ink/50">Régie éditoriale</p>
          <h2 id="editorial-editor-title" className="display mt-1 text-4xl">
            Réécrire l&apos;avant-match
          </h2>
          <p className="editorial mt-1 text-base text-ink/60">
            Titres, clés tactiques et pronostic — les textes IA restent rétablissables.
          </p>
        </div>

        {error && (
          <p className="label border border-live bg-live px-3 py-2 text-on-accent" role="alert">
            {error}
          </p>
        )}

        <div className="flex flex-wrap border border-ink">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`label flex-1 border-r border-ink px-3 py-2 last:border-r-0 ${
                activeTab === tab.id ? "bg-ink text-paper" : "hover:bg-accent hover:text-on-accent"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "article" && (
          <div className="no-scrollbar max-h-[50vh] space-y-4 overflow-y-auto pr-1">
            <div>
              <label className="label mb-1.5 block">Titre principal</label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="Ex: OM — ESTAC : le choc sous haute tension"
                className="field"
              />
            </div>
            <div>
              <label className="label mb-1.5 block">Sous-titre / Enjeux</label>
              <textarea
                rows={3}
                value={subheadline}
                onChange={(e) => setSubheadline(e.target.value)}
                placeholder="Respectivement 4e et 12e de Ligue 1…"
                className="field leading-relaxed"
              />
            </div>
          </div>
        )}

        {activeTab === "paragraphs" && (
          <div className="no-scrollbar max-h-[50vh] space-y-4 overflow-y-auto pr-1">
            <div className="flex items-center justify-between">
              <span className="label text-ink/50">
                {paragraphs.length} paragraphe{paragraphs.length > 1 ? "s" : ""}
              </span>
              <button
                type="button"
                onClick={() => setParagraphs([...paragraphs, ""])}
                className="label border-b border-ink pb-0.5 hover:border-accent"
              >
                + Paragraphe
              </button>
            </div>

            {paragraphs.map((p, i) => (
              <div key={i} className="border border-ink p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="label text-ink/50">Paragraphe {i + 1}</span>
                  {paragraphs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setParagraphs(paragraphs.filter((_, idx) => idx !== i))}
                      className="label text-live-text hover:underline"
                    >
                      Retirer
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
                  placeholder={`Contenu du paragraphe ${i + 1}…`}
                  className="field leading-relaxed"
                />
              </div>
            ))}
          </div>
        )}

        {activeTab === "keys" && (
          <div className="no-scrollbar max-h-[50vh] space-y-4 overflow-y-auto pr-1">
            <p className="editorial text-base text-ink/60">
              Trois points sur lesquels la rencontre bascule.
            </p>
            {tacticalKeys.map((k, i) => (
              <div key={i} className="space-y-2 border border-ink p-3">
                <span className="label text-ink/50">Clé {String(i + 1).padStart(2, "0")}</span>
                <input
                  type="text"
                  value={k.title}
                  onChange={(e) => {
                    const next = [...tacticalKeys];
                    next[i] = { ...next[i], title: e.target.value };
                    setTacticalKeys(next);
                  }}
                  placeholder={`Titre de la clé ${i + 1}…`}
                  className="field"
                />
                <textarea
                  rows={2}
                  value={k.description}
                  onChange={(e) => {
                    const next = [...tacticalKeys];
                    next[i] = { ...next[i], description: e.target.value };
                    setTacticalKeys(next);
                  }}
                  placeholder="Description tactique…"
                  className="field leading-relaxed"
                />
              </div>
            ))}
          </div>
        )}

        {activeTab === "prediction" && (
          <div className="no-scrollbar max-h-[50vh] space-y-5 overflow-y-auto pr-1">
            <div className="space-y-3 border border-ink p-3">
              <p className="label">Le joueur à suivre</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div>
                  <label className="label mb-1 block text-ink/50">Nom</label>
                  <input
                    type="text"
                    value={keyPlayerName}
                    onChange={(e) => setKeyPlayerName(e.target.value)}
                    placeholder="Amine Gouiri"
                    className="field"
                  />
                </div>
                <div>
                  <label className="label mb-1 block text-ink/50">Club</label>
                  <input
                    type="text"
                    value={keyPlayerTeam}
                    onChange={(e) => setKeyPlayerTeam(e.target.value)}
                    placeholder="Olympique de Marseille"
                    className="field"
                  />
                </div>
              </div>
              <div>
                <label className="label mb-1 block text-ink/50">Impact</label>
                <textarea
                  rows={2}
                  value={keyPlayerDesc}
                  onChange={(e) => setKeyPlayerDesc(e.target.value)}
                  placeholder="Auteur de 4 buts cette saison…"
                  className="field leading-relaxed"
                />
              </div>
            </div>

            <div className="space-y-3 border border-ink p-3">
              <p className="label">1 · N · 2</p>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="label mb-1 block text-ink/50">1 (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={homeWinPct}
                    onChange={(e) => setHomeWinPct(Number(e.target.value))}
                    className="field tabular"
                  />
                </div>
                <div>
                  <label className="label mb-1 block text-ink/50">N (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={drawPct}
                    onChange={(e) => setDrawPct(Number(e.target.value))}
                    className="field tabular"
                  />
                </div>
                <div>
                  <label className="label mb-1 block text-ink/50">2 (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={awayWinPct}
                    onChange={(e) => setAwayWinPct(Number(e.target.value))}
                    className="field tabular"
                  />
                </div>
              </div>
              <div>
                <label className="label mb-1 block text-ink/50">Texte du pronostic</label>
                <textarea
                  rows={2}
                  value={predictionText}
                  onChange={(e) => setPredictionText(e.target.value)}
                  placeholder="Léger avantage aux locaux…"
                  className="field leading-relaxed"
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink pt-4">
          <button
            type="button"
            disabled={saving}
            onClick={handleReset}
            className="label border-b border-ink/40 pb-0.5 hover:border-live hover:text-live-text disabled:opacity-40"
          >
            Rétablir l&apos;IA d&apos;origine
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              className="label border border-ink px-4 py-2 hover:bg-ink hover:text-paper disabled:opacity-40"
            >
              Annuler
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="label border border-ink bg-accent px-5 py-2 text-on-accent transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_var(--ink)] disabled:opacity-40"
            >
              {saving ? "Sauvegarde…" : "Enregistrer les textes"}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

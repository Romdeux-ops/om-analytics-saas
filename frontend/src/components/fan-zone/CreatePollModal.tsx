"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import { cn } from "@/src/lib/ui/cn";
import { createPollAction } from "@/src/lib/fan-zone/admin-actions";
import {
  MAX_POLL_OPTION_LABEL_LENGTH,
  MAX_POLL_OPTIONS,
  MAX_POLL_QUESTION_LENGTH,
  MIN_POLL_OPTIONS,
  MIN_POLL_QUESTION_LENGTH,
} from "@/src/lib/fan-zone/constants";
import type { PollView } from "@/src/lib/fan-zone/types";

interface CreatePollModalProps {
  open: boolean;
  roomId: number;
  onClose: () => void;
  onCreated: (poll: PollView) => void;
}

export function CreatePollModal({ open, roomId, onClose, onCreated }: CreatePollModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [closesAt, setClosesAt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  function updateOption(index: number, value: string) {
    setOptions((prev) => prev.map((o, i) => (i === index ? value.slice(0, MAX_POLL_OPTION_LABEL_LENGTH) : o)));
  }

  function addOption() {
    if (options.length >= MAX_POLL_OPTIONS) return;
    setOptions((prev) => [...prev, ""]);
  }

  function removeOption(index: number) {
    if (options.length <= MIN_POLL_OPTIONS) return;
    setOptions((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await createPollAction(
        roomId,
        question,
        options,
        closesAt ? new Date(closesAt).toISOString() : null,
      );
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setQuestion("");
      setOptions(["", ""]);
      setClosesAt("");
      onCreated(result.poll);
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="presentation" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" aria-hidden="true" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-poll-title"
        className={cn(
          "relative z-10 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-white/10 bg-[var(--bg-raise)] p-6 shadow-2xl",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white"
          aria-label="Fermer"
        >
          <X size={18} />
        </button>

        <h2 id="create-poll-title" className="font-tech text-xl font-bold text-white">
          Nouveau sondage
        </h2>
        <p className="mt-1 text-sm text-slate-400">Créer un sondage pour le salon actif.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="poll-question" className="mb-1.5 block text-xs font-medium text-slate-400">
              Question
            </label>
            <input
              id="poll-question"
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value.slice(0, MAX_POLL_QUESTION_LENGTH))}
              required
              minLength={MIN_POLL_QUESTION_LENGTH}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-violet-400/50"
            />
          </div>

          <fieldset>
            <legend className="mb-2 text-xs font-medium text-slate-400">
              Options ({MIN_POLL_OPTIONS}–{MAX_POLL_OPTIONS})
            </legend>
            <div className="space-y-2">
              {options.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    required
                    placeholder={`Option ${index + 1}`}
                    className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white outline-none focus:border-violet-400/50"
                  />
                  {options.length > MIN_POLL_OPTIONS && (
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-red-400"
                      aria-label={`Supprimer l'option ${index + 1}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {options.length < MAX_POLL_OPTIONS && (
              <Button type="button" variant="ghost" size="sm" className="mt-2" onClick={addOption}>
                <Plus size={14} />
                Ajouter une option
              </Button>
            )}
          </fieldset>

          <div>
            <label htmlFor="poll-closes" className="mb-1.5 block text-xs font-medium text-slate-400">
              Date de clôture (optionnel)
            </label>
            <input
              id="poll-closes"
              type="datetime-local"
              value={closesAt}
              onChange={(e) => setClosesAt(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-violet-400/50"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" variant="primary" className="w-full" disabled={loading}>
            {loading ? "Création..." : "Créer le sondage"}
          </Button>
        </form>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { X } from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import { cn } from "@/src/lib/ui/cn";
import { createDebateAction } from "@/src/lib/fan-zone/admin-actions";
import {
  MAX_DEBATE_QUESTION_LENGTH,
  MIN_DEBATE_QUESTION_LENGTH,
} from "@/src/lib/fan-zone/constants";
import type { DebateView } from "@/src/lib/fan-zone/types";

interface CreateDebateModalProps {
  open: boolean;
  roomId: number;
  onClose: () => void;
  onCreated: (debate: DebateView) => void;
}

export function CreateDebateModal({ open, roomId, onClose, onCreated }: CreateDebateModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [question, setQuestion] = useState("");
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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await createDebateAction(roomId, question);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setQuestion("");
      onCreated(result.debate);
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
        aria-labelledby="create-debate-title"
        className={cn(
          "relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-[var(--bg-raise)] p-6 shadow-2xl",
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

        <h2 id="create-debate-title" className="font-tech text-xl font-bold text-white">
          Nouveau débat
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Posez une question pour lancer un débat entre supporters.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="debate-question" className="mb-1.5 block text-xs font-medium text-slate-400">
              Question du débat
            </label>
            <textarea
              id="debate-question"
              value={question}
              onChange={(e) => setQuestion(e.target.value.slice(0, MAX_DEBATE_QUESTION_LENGTH))}
              required
              minLength={MIN_DEBATE_QUESTION_LENGTH}
              rows={3}
              placeholder="Ex : Greenwood doit-il être titulaire contre le PSG ?"
              className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/50"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" variant="primary" className="w-full" disabled={loading}>
            {loading ? "Création..." : "Lancer le débat"}
          </Button>
        </form>
      </div>
    </div>
  );
}

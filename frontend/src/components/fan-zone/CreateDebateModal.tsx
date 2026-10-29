"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/src/components/ui/Button";
import { Modal } from "@/src/components/ui/Modal";
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
  const [question, setQuestion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
    <Modal open={open} onClose={onClose} titleId="create-debate-title">
        <p className="label text-ink/50">Zone débat</p>
        <h2 id="create-debate-title" className="display mt-1 text-4xl">
          Nouveau débat
        </h2>
        <p className="editorial mt-1 text-base text-ink/60">
          Une question pour lancer les supporters.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="debate-question" className="label mb-1.5 block">
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
              className="field resize-none"
            />
          </div>

          {error && (
            <p className="label text-live-text" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" variant="primary" className="w-full" loading={loading}>
            Lancer le débat
          </Button>
        </form>
    </Modal>
  );
}

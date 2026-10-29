"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/src/components/ui/Button";
import { Modal } from "@/src/components/ui/Modal";
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
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [closesAt, setClosesAt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
    <Modal
      open={open}
      onClose={onClose}
      titleId="create-poll-title"
      className="max-h-[90vh] overflow-y-auto"
    >
        <p className="label text-ink/50">Le vote du virage</p>
        <h2 id="create-poll-title" className="display mt-1 text-4xl">
          Nouveau sondage
        </h2>
        <p className="editorial mt-1 text-base text-ink/60">Pour le salon actif.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="poll-question" className="label mb-1.5 block">
              Question
            </label>
            <input
              id="poll-question"
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value.slice(0, MAX_POLL_QUESTION_LENGTH))}
              required
              minLength={MIN_POLL_QUESTION_LENGTH}
              className="field"
            />
          </div>

          <fieldset>
            <legend className="label mb-2">
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
                    className="field min-w-0 flex-1"
                  />
                  {options.length > MIN_POLL_OPTIONS && (
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="label border border-ink px-3 hover:bg-live hover:text-on-accent"
                      aria-label={`Supprimer l'option ${index + 1}`}
                    >
                      Retirer
                    </button>
                  )}
                </div>
              ))}
            </div>
            {options.length < MAX_POLL_OPTIONS && (
              <Button type="button" variant="ghost" size="sm" className="mt-2" onClick={addOption}>
                + Option
              </Button>
            )}
          </fieldset>

          <div>
            <label htmlFor="poll-closes" className="label mb-1.5 block">
              Date de clôture (optionnel)
            </label>
            <input
              id="poll-closes"
              type="datetime-local"
              value={closesAt}
              onChange={(e) => setClosesAt(e.target.value)}
              className="field"
            />
          </div>

          {error && (
            <p className="label text-live-text" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" variant="primary" className="w-full" loading={loading}>
            Créer le sondage
          </Button>
        </form>
    </Modal>
  );
}

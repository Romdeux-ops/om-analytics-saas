"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/src/components/ui/Button";
import { MAX_REPLY_LENGTH } from "@/src/lib/fan-zone/constants";

interface ReplyComposerProps {
  onSubmit: (content: string) => Promise<boolean>;
  onCancel?: () => void;
  placeholder?: string;
}

export function ReplyComposer({
  onSubmit,
  onCancel,
  placeholder = "Votre réponse...",
}: ReplyComposerProps) {
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);
    const ok = await onSubmit(trimmed);
    setSubmitting(false);
    if (ok) setContent("");
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
      <label htmlFor="reply-input" className="sr-only">
        Répondre
      </label>
      <input
        id="reply-input"
        type="text"
        value={content}
        onChange={(e) => setContent(e.target.value.slice(0, MAX_REPLY_LENGTH))}
        placeholder={placeholder}
        maxLength={MAX_REPLY_LENGTH}
        className="min-w-0 flex-1 border border-ink bg-paper px-3 py-2 text-sm text-ink outline-none placeholder:text-ink/40 focus:shadow-[3px_3px_0_0_var(--accent)]"
      />
      <Button type="submit" variant="primary" size="sm" loading={submitting} disabled={!content.trim()} aria-label="Envoyer la réponse">
        <span aria-hidden="true">→</span>
      </Button>
      {onCancel && (
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Annuler
        </Button>
      )}
    </form>
  );
}

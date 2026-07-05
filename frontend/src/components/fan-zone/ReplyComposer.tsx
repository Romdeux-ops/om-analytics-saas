"use client";

import { useState, type FormEvent } from "react";
import { Send } from "lucide-react";
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
        className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400/40"
      />
      <Button type="submit" variant="primary" size="sm" disabled={submitting || !content.trim()}>
        <Send size={14} />
      </Button>
      {onCancel && (
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Annuler
        </Button>
      )}
    </form>
  );
}

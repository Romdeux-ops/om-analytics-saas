"use client";

import { useState, type FormEvent } from "react";
import { Send } from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import { useAuth } from "@/src/components/auth/AuthProvider";
import { createMessageAction } from "@/src/lib/fan-zone/actions";
import { MAX_CONTENT_LENGTH } from "@/src/lib/fan-zone/constants";
import type { MessageView } from "@/src/lib/fan-zone/types";

interface MessageComposerProps {
  roomId: number;
  onOptimisticPost: (message: MessageView) => void;
  onPostError: (tempId: number) => void;
}

export function MessageComposer({ roomId, onOptimisticPost, onPostError }: MessageComposerProps) {
  const { user, profile, isGuest, requireAuth } = useAuth();
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;

    await requireAuth(async () => {
      const tempId = -Date.now();
      const authorId = user?.id ?? profile?.id ?? "pending";
      const optimistic: MessageView = {
        id: tempId,
        room_id: roomId,
        parent_id: null,
        user_id: authorId,
        content: trimmed,
        created_at: new Date().toISOString(),
        profile: profile ?? {
          id: authorId,
          display_name: user?.email?.split("@")[0] ?? "Supporter",
          avatar_url: null,
        },
        reactions: [],
        user_reaction: null,
        like_count: 0,
        user_liked: false,
        reply_count: 0,
        pending: true,
      };

      onOptimisticPost(optimistic);
      setContent("");
      setSubmitting(true);

      const result = await createMessageAction(roomId, trimmed);
      setSubmitting(false);

      if (!result.ok) {
        onPostError(tempId);
        setContent(trimmed);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <label htmlFor="message-composer" className="sr-only">
        Votre message
      </label>
      <textarea
        id="message-composer"
        value={content}
        onChange={(e) => setContent(e.target.value.slice(0, MAX_CONTENT_LENGTH))}
        placeholder="Partagez votre avis avec la communauté..."
        rows={3}
        maxLength={MAX_CONTENT_LENGTH}
        className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400/40"
        onFocus={() => {
          if (isGuest) requireAuth(() => {});
        }}
      />
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-slate-500">
          {content.length}/{MAX_CONTENT_LENGTH}
        </span>
        <Button type="submit" variant="primary" size="sm" disabled={submitting || !content.trim()}>
          <Send size={14} />
          Publier
        </Button>
      </div>
    </form>
  );
}

"use server";

import { createClient } from "@/src/lib/supabase/server";
import {
  EMOJI_REACTIONS,
  MAX_CONTENT_LENGTH,
  MAX_REPLY_LENGTH,
} from "./constants";

function sanitizeContent(raw: string, maxLen: number): string {
  return raw.trim().replace(/<[^>]*>/g, "").slice(0, maxLen);
}

export async function createMessageAction(
  roomId: number,
  content: string,
  parentId?: number | null,
): Promise<{ ok: true; id: number } | { ok: false; error: string }> {
  const maxLen = parentId ? MAX_REPLY_LENGTH : MAX_CONTENT_LENGTH;
  const sanitized = sanitizeContent(content, maxLen);
  if (!sanitized) {
    return {
      ok: false,
      error: parentId
        ? `Réponse invalide (1–${MAX_REPLY_LENGTH} caractères).`
        : "Message invalide (1–500 caractères).",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Connexion requise." };
  }

  if (parentId) {
    const { data: parent, error: parentError } = await supabase
      .from("messages")
      .select("id, room_id, parent_id")
      .eq("id", parentId)
      .single();

    if (parentError || !parent || parent.room_id !== roomId || parent.parent_id != null) {
      return { ok: false, error: "Message parent introuvable." };
    }
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({
      room_id: roomId,
      user_id: user.id,
      content: sanitized,
      parent_id: parentId ?? null,
    })
    .select("id")
    .single();

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true, id: data.id };
}

export async function toggleReactionAction(
  messageId: number,
  emoji: string,
): Promise<{ ok: true; action: "added" | "removed" | "updated" } | { ok: false; error: string }> {
  if (!EMOJI_REACTIONS.includes(emoji as (typeof EMOJI_REACTIONS)[number])) {
    return { ok: false, error: "Réaction non autorisée." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Connexion requise." };
  }

  const { data: existing, error: fetchError } = await supabase
    .from("message_reactions")
    .select("id, emoji")
    .eq("message_id", messageId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (fetchError) {
    return { ok: false, error: fetchError.message };
  }

  if (existing?.emoji === emoji) {
    const { error } = await supabase.from("message_reactions").delete().eq("id", existing.id);
    if (error) return { ok: false, error: error.message };
    return { ok: true, action: "removed" };
  }

  if (existing) {
    const { error } = await supabase
      .from("message_reactions")
      .update({ emoji })
      .eq("id", existing.id);
    if (error) return { ok: false, error: error.message };
    return { ok: true, action: "updated" };
  }

  const { error } = await supabase.from("message_reactions").insert({
    message_id: messageId,
    user_id: user.id,
    emoji,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true, action: "added" };
}

export async function toggleLikeAction(
  messageId: number,
): Promise<{ ok: true; action: "added" | "removed" } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Connexion requise." };
  }

  const { data: existing, error: fetchError } = await supabase
    .from("message_likes")
    .select("message_id")
    .eq("message_id", messageId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (fetchError) {
    return { ok: false, error: fetchError.message };
  }

  if (existing) {
    const { error } = await supabase
      .from("message_likes")
      .delete()
      .eq("message_id", messageId)
      .eq("user_id", user.id);
    if (error) return { ok: false, error: error.message };
    return { ok: true, action: "removed" };
  }

  const { error } = await supabase.from("message_likes").insert({
    message_id: messageId,
    user_id: user.id,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true, action: "added" };
}

export async function createReplyAction(
  roomId: number,
  parentId: number,
  content: string,
): Promise<{ ok: true; id: number } | { ok: false; error: string }> {
  return createMessageAction(roomId, content, parentId);
}

export async function castVoteAction(
  pollId: number,
  optionId: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Connexion requise." };
  }

  const { data: poll, error: pollError } = await supabase
    .from("polls")
    .select("id, is_active, closes_at")
    .eq("id", pollId)
    .single();

  if (pollError || !poll?.is_active) {
    return { ok: false, error: "Sondage indisponible." };
  }

  if (poll.closes_at && new Date(poll.closes_at) < new Date()) {
    return { ok: false, error: "Ce sondage est clos." };
  }

  const { data: option, error: optionError } = await supabase
    .from("poll_options")
    .select("id")
    .eq("id", optionId)
    .eq("poll_id", pollId)
    .single();

  if (optionError || !option) {
    return { ok: false, error: "Option invalide." };
  }

  const { error } = await supabase.from("votes").insert({
    poll_id: pollId,
    option_id: optionId,
    user_id: user.id,
  });

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "Vous avez déjà voté." };
    }
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

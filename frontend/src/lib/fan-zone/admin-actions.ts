"use server";

import { requireAdmin } from "@/src/lib/admin/permissions";
import { createClient } from "@/src/lib/supabase/server";
import {
  MAX_POLL_OPTION_LABEL_LENGTH,
  MAX_POLL_OPTIONS,
  MAX_POLL_QUESTION_LENGTH,
  MAX_ROOM_DESCRIPTION_LENGTH,
  MAX_ROOM_NAME_LENGTH,
  MIN_POLL_OPTIONS,
  MIN_POLL_QUESTION_LENGTH,
  MIN_ROOM_NAME_LENGTH,
  MIN_DEBATE_QUESTION_LENGTH,
  MAX_DEBATE_QUESTION_LENGTH,
} from "./constants";
import type { DebateView, PollView, RoomView } from "./types";

function sanitizeText(raw: string, maxLen: number): string {
  return raw.trim().replace(/<[^>]*>/g, "").slice(0, maxLen);
}

function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function ensureUniqueSlug(
  supabase: Awaited<ReturnType<typeof createClient>>,
  baseSlug: string,
): Promise<string> {
  const slug = baseSlug || "salon";
  let suffix = 0;

  while (true) {
    const candidate = suffix === 0 ? slug : `${slug}-${suffix}`;
    const { data } = await supabase.from("rooms").select("id").eq("slug", candidate).maybeSingle();
    if (!data) return candidate;
    suffix += 1;
  }
}

export async function createRoomAction(
  name: string,
  description?: string | null,
): Promise<{ ok: true; room: RoomView } | { ok: false; error: string }> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;

  const trimmedName = sanitizeText(name, MAX_ROOM_NAME_LENGTH);
  if (trimmedName.length < MIN_ROOM_NAME_LENGTH) {
    return { ok: false, error: `Nom : ${MIN_ROOM_NAME_LENGTH}–${MAX_ROOM_NAME_LENGTH} caractères.` };
  }

  const desc =
    description != null && description.trim()
      ? sanitizeText(description, MAX_ROOM_DESCRIPTION_LENGTH)
      : null;

  const supabase = await createClient();
  const slug = await ensureUniqueSlug(supabase, slugify(trimmedName));

  const { data, error } = await supabase
    .from("rooms")
    .insert({ name: trimmedName, slug, description: desc, is_active: true })
    .select("id, name, slug, description, is_active")
    .single();

  if (error) {
    return { ok: false, error: error.message };
  }

  return {
    ok: true,
    room: {
      id: data.id,
      name: data.name,
      slug: data.slug,
      description: data.description,
      is_active: data.is_active,
    },
  };
}

export async function updateRoomAction(
  roomId: number,
  fields: { name?: string; description?: string | null },
): Promise<{ ok: true; room: RoomView } | { ok: false; error: string }> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;

  const updates: Record<string, string | null> = {};

  if (fields.name !== undefined) {
    const trimmedName = sanitizeText(fields.name, MAX_ROOM_NAME_LENGTH);
    if (trimmedName.length < MIN_ROOM_NAME_LENGTH) {
      return { ok: false, error: `Nom : ${MIN_ROOM_NAME_LENGTH}–${MAX_ROOM_NAME_LENGTH} caractères.` };
    }
    updates.name = trimmedName;
  }

  if (fields.description !== undefined) {
    updates.description =
      fields.description?.trim()
        ? sanitizeText(fields.description, MAX_ROOM_DESCRIPTION_LENGTH)
        : null;
  }

  if (!Object.keys(updates).length) {
    return { ok: false, error: "Aucune modification." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rooms")
    .update(updates)
    .eq("id", roomId)
    .select("id, name, slug, description, is_active")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Salon introuvable." };
  }

  return {
    ok: true,
    room: {
      id: data.id,
      name: data.name,
      slug: data.slug,
      description: data.description,
      is_active: data.is_active,
    },
  };
}

export async function deactivateRoomAction(
  roomId: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;

  const supabase = await createClient();

  const { count, error: countError } = await supabase
    .from("rooms")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true);

  if (countError) {
    return { ok: false, error: countError.message };
  }

  if ((count ?? 0) <= 1) {
    return { ok: false, error: "Impossible de désactiver le dernier salon actif." };
  }

  const { error } = await supabase.from("rooms").update({ is_active: false }).eq("id", roomId);

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

export async function createPollAction(
  roomId: number,
  question: string,
  optionLabels: string[],
  closesAt?: string | null,
): Promise<{ ok: true; poll: PollView } | { ok: false; error: string }> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;

  const trimmedQuestion = sanitizeText(question, MAX_POLL_QUESTION_LENGTH);
  if (trimmedQuestion.length < MIN_POLL_QUESTION_LENGTH) {
    return {
      ok: false,
      error: `Question : ${MIN_POLL_QUESTION_LENGTH}–${MAX_POLL_QUESTION_LENGTH} caractères.`,
    };
  }

  const labels = optionLabels
    .map((l) => sanitizeText(l, MAX_POLL_OPTION_LABEL_LENGTH))
    .filter(Boolean);

  if (labels.length < MIN_POLL_OPTIONS || labels.length > MAX_POLL_OPTIONS) {
    return {
      ok: false,
      error: `Entre ${MIN_POLL_OPTIONS} et ${MAX_POLL_OPTIONS} options requises.`,
    };
  }

  const supabase = await createClient();

  const { data: room, error: roomError } = await supabase
    .from("rooms")
    .select("id")
    .eq("id", roomId)
    .single();

  if (roomError || !room) {
    return { ok: false, error: "Salon introuvable." };
  }

  const { data: poll, error: pollError } = await supabase
    .from("polls")
    .insert({
      room_id: roomId,
      question: trimmedQuestion,
      is_active: true,
      closes_at: closesAt ?? null,
    })
    .select("id, room_id, question, is_active, closes_at")
    .single();

  if (pollError || !poll) {
    return { ok: false, error: pollError?.message ?? "Erreur création sondage." };
  }

  const { data: options, error: optionsError } = await supabase
    .from("poll_options")
    .insert(labels.map((label) => ({ poll_id: poll.id, label, vote_count: 0 })))
    .select("id, label, vote_count");

  if (optionsError || !options?.length) {
    await supabase.from("polls").delete().eq("id", poll.id);
    return { ok: false, error: optionsError?.message ?? "Erreur création options." };
  }

  return {
    ok: true,
    poll: {
      id: poll.id,
      room_id: poll.room_id,
      question: poll.question,
      is_active: poll.is_active,
      closes_at: poll.closes_at,
      user_vote_option_id: null,
      options: options.map((o) => ({
        id: o.id,
        label: o.label,
        vote_count: o.vote_count,
      })),
    },
  };
}

export async function closePollAction(
  pollId: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;

  const supabase = await createClient();
  const { error } = await supabase
    .from("polls")
    .update({ is_active: false, closes_at: new Date().toISOString() })
    .eq("id", pollId);

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

export async function deleteMessageAction(
  messageId: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;

  const supabase = await createClient();
  const { error } = await supabase.from("messages").delete().eq("id", messageId);

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

export async function pinMessageAction(
  messageId: number,
  pinned: boolean,
): Promise<{ ok: true; roomId: number } | { ok: false; error: string }> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;

  const supabase = await createClient();

  const { data: message, error: fetchError } = await supabase
    .from("messages")
    .select("id, room_id, parent_id")
    .eq("id", messageId)
    .single();

  if (fetchError || !message || message.parent_id != null) {
    return { ok: false, error: "Message introuvable ou non épinglable." };
  }

  if (pinned) {
    await supabase
      .from("messages")
      .update({ is_pinned: false })
      .eq("room_id", message.room_id)
      .eq("is_pinned", true);
  }

  const { error } = await supabase
    .from("messages")
    .update({ is_pinned: pinned })
    .eq("id", messageId);

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true, roomId: message.room_id };
}

export async function createDebateAction(
  roomId: number,
  question: string,
): Promise<{ ok: true; debate: DebateView } | { ok: false; error: string }> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;

  const trimmedQuestion = sanitizeText(question, MAX_DEBATE_QUESTION_LENGTH);
  if (trimmedQuestion.length < MIN_DEBATE_QUESTION_LENGTH) {
    return {
      ok: false,
      error: `Question : ${MIN_DEBATE_QUESTION_LENGTH}–${MAX_DEBATE_QUESTION_LENGTH} caractères.`,
    };
  }

  const supabase = await createClient();

  const { data: room, error: roomError } = await supabase
    .from("rooms")
    .select("id")
    .eq("id", roomId)
    .single();

  if (roomError || !room) {
    return { ok: false, error: "Salon introuvable." };
  }

  const { data, error } = await supabase
    .from("debates")
    .insert({ room_id: roomId, question: trimmedQuestion, is_active: true })
    .select("id, room_id, question, is_active, created_at")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Erreur création débat." };
  }

  return {
    ok: true,
    debate: {
      id: data.id,
      room_id: data.room_id,
      question: data.question,
      is_active: data.is_active,
      created_at: data.created_at,
      posts: [],
    },
  };
}

export async function closeDebateAction(
  debateId: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;

  const supabase = await createClient();
  const { error } = await supabase.from("debates").update({ is_active: false }).eq("id", debateId);

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

export async function deleteRoomAction(
  roomId: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;

  const supabase = await createClient();

  const { count, error: countError } = await supabase
    .from("rooms")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true);

  if (countError) {
    return { ok: false, error: countError.message };
  }

  if ((count ?? 0) <= 1) {
    return { ok: false, error: "Impossible de supprimer le dernier salon actif." };
  }

  const { error } = await supabase.from("rooms").delete().eq("id", roomId);

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

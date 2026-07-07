import { createClient } from "@/src/lib/supabase/server";
import { PAGE_SIZE } from "./constants";
import { buildRoomDebatesViews, type DebatePostRow } from "./debate-enrichment";
import { enrichMessages, type MessageRow } from "./message-enrichment";
import type { DebateView, MessageFeedPage, MessageView, PollView, ProfileView, RoomView } from "./types";

export async function getActiveRooms(): Promise<RoomView[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rooms")
    .select("id, name, slug, description")
    .eq("is_active", true)
    .order("id", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

async function getCurrentUserId(): Promise<string | undefined> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id;
}

export async function getMessagesPage(
  roomId: number,
  cursor?: string,
  limit = PAGE_SIZE,
): Promise<MessageFeedPage> {
  const supabase = await createClient();
  const currentUserId = await getCurrentUserId();

  let query = supabase
    .from("messages")
    .select("id, room_id, parent_id, user_id, content, created_at, is_pinned")
    .eq("room_id", roomId)
    .is("parent_id", null)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit + 1);

  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as MessageRow[];
  const hasMore = rows.length > limit;
  const pageRows = hasMore ? rows.slice(0, limit) : rows;
  const messages = await enrichMessages(supabase, pageRows, currentUserId);
  const nextCursor = hasMore ? pageRows[pageRows.length - 1]?.created_at ?? null : null;

  return { messages, nextCursor };
}

export async function getMessageReplies(messageId: number): Promise<MessageView[]> {
  const supabase = await createClient();
  const currentUserId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("messages")
    .select("id, room_id, parent_id, user_id, content, created_at")
    .eq("parent_id", messageId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return enrichMessages(supabase, (data ?? []) as MessageRow[], currentUserId);
}

export async function getRoomPolls(roomId: number, userId?: string): Promise<PollView[]> {
  const supabase = await createClient();

  const { data: polls, error } = await supabase
    .from("polls")
    .select("id, room_id, question, is_active, closes_at")
    .eq("room_id", roomId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  if (!polls?.length) return [];

  const pollIds = polls.map((p) => p.id);

  const { data: options, error: optionsError } = await supabase
    .from("poll_options")
    .select("id, poll_id, label, vote_count")
    .in("poll_id", pollIds)
    .order("id", { ascending: true });

  if (optionsError) throw new Error(optionsError.message);

  let userVotes: { poll_id: number; option_id: number }[] = [];
  if (userId) {
    const { data: votes, error: votesError } = await supabase
      .from("votes")
      .select("poll_id, option_id")
      .in("poll_id", pollIds)
      .eq("user_id", userId);

    if (votesError) throw new Error(votesError.message);
    userVotes = votes ?? [];
  }

  const voteByPoll = new Map(userVotes.map((v) => [v.poll_id, v.option_id]));

  return polls.map((poll) => ({
    id: poll.id,
    room_id: poll.room_id,
    question: poll.question,
    is_active: poll.is_active,
    closes_at: poll.closes_at,
    user_vote_option_id: voteByPoll.get(poll.id) ?? null,
    options: (options ?? [])
      .filter((o) => o.poll_id === poll.id)
      .map((o) => ({
        id: o.id,
        label: o.label,
        vote_count: o.vote_count,
      })),
  }));
}

export async function getCurrentUserProfile(): Promise<ProfileView | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, role")
    .eq("id", user.id)
    .single();

  if (error || !data) return null;
  return data;
}

export async function getRoomDebates(roomId: number): Promise<DebateView[]> {
  const supabase = await createClient();

  const { data: debates, error } = await supabase
    .from("debates")
    .select("id, room_id, question, is_active, created_at")
    .eq("room_id", roomId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  if (!debates?.length) return [];

  const debateIds = debates.map((d) => d.id);

  const { data: postRows, error: postsError } = await supabase
    .from("debate_posts")
    .select("id, debate_id, parent_id, user_id, content, created_at")
    .in("debate_id", debateIds)
    .is("parent_id", null)
    .order("created_at", { ascending: true });

  if (postsError) throw new Error(postsError.message);

  return buildRoomDebatesViews(supabase, debates, (postRows ?? []) as DebatePostRow[]);
}

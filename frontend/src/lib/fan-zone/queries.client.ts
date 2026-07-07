import { createClient } from "@/src/lib/supabase/client";
import { PAGE_SIZE } from "./constants";
import { buildRoomDebatesViews, enrichDebatePosts, type DebatePostRow } from "./debate-enrichment";
import { enrichMessages, type MessageRow } from "./message-enrichment";
import type { DebatePostView, DebateView, MessageFeedPage, MessageView, PollView } from "./types";

export async function fetchMessagesPageClient(
  roomId: number,
  cursor?: string,
  limit = PAGE_SIZE,
): Promise<MessageFeedPage> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
  const messages = await enrichMessages(supabase, pageRows, user?.id);
  const nextCursor = hasMore ? pageRows[pageRows.length - 1]?.created_at ?? null : null;

  return { messages, nextCursor };
}

export async function fetchMessageRepliesClient(messageId: number): Promise<MessageView[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("messages")
    .select("id, room_id, parent_id, user_id, content, created_at")
    .eq("parent_id", messageId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return enrichMessages(supabase, (data ?? []) as MessageRow[], user?.id);
}

export async function fetchRoomPollsClient(roomId: number): Promise<PollView[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
  if (user) {
    const { data: votes, error: votesError } = await supabase
      .from("votes")
      .select("poll_id, option_id")
      .in("poll_id", pollIds)
      .eq("user_id", user.id);

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

export async function fetchRoomDebatesClient(roomId: number): Promise<DebateView[]> {
  const supabase = createClient();

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

export async function fetchDebateRepliesClient(postId: number): Promise<DebatePostView[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("debate_posts")
    .select("id, debate_id, parent_id, user_id, content, created_at")
    .eq("parent_id", postId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return enrichDebatePosts(supabase, (data ?? []) as DebatePostRow[]);
}

export async function fetchRoomFeedClient(
  roomId: number,
): Promise<{ messages: MessageFeedPage; polls: PollView[]; debates: DebateView[] }> {
  const [messages, polls, debates] = await Promise.all([
    fetchMessagesPageClient(roomId),
    fetchRoomPollsClient(roomId),
    fetchRoomDebatesClient(roomId),
  ]);
  return { messages, polls, debates };
}

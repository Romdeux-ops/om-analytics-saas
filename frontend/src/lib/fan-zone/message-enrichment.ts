import type { MessageView, ProfileView, ReactionCount } from "./types";

export type MessageRow = {
  id: number;
  room_id: number;
  user_id: string;
  content: string;
  created_at: string;
  parent_id?: number | null;
  is_pinned?: boolean;
};

export type ReactionRow = {
  message_id: number;
  emoji: string;
  user_id: string;
};

export type LikeRow = {
  message_id: number;
  user_id: string;
};

export async function fetchProfilesMap<T extends { from: (table: string) => unknown }>(
  supabase: T,
  userIds: string[],
): Promise<Map<string, ProfileView>> {
  const map = new Map<string, ProfileView>();
  if (!userIds.length) return map;

  const client = supabase as {
    from: (table: string) => {
      select: (cols: string) => {
        in: (col: string, ids: string[]) => Promise<{ data: ProfileView[] | null }>;
      };
    };
  };

  const { data } = await client.from("profiles").select("id, display_name, avatar_url").in("id", userIds);

  for (const p of data ?? []) {
    map.set(p.id, p);
  }
  return map;
}

export function mapProfileFromMap(profiles: Map<string, ProfileView>, userId: string): ProfileView {
  return (
    profiles.get(userId) ?? {
      id: userId,
      display_name: userId.slice(0, 8),
      avatar_url: null,
    }
  );
}

export function aggregateReactions(
  rows: ReactionRow[],
  messageIds: number[],
  currentUserId?: string,
): Map<number, { reactions: ReactionCount[]; user_reaction: string | null }> {
  const byMessage = new Map<number, Map<string, number>>();
  const userReaction = new Map<number, string>();

  for (const id of messageIds) {
    byMessage.set(id, new Map());
  }

  for (const row of rows) {
    if (!byMessage.has(row.message_id)) continue;
    const counts = byMessage.get(row.message_id)!;
    counts.set(row.emoji, (counts.get(row.emoji) ?? 0) + 1);
    if (currentUserId && row.user_id === currentUserId) {
      userReaction.set(row.message_id, row.emoji);
    }
  }

  const result = new Map<number, { reactions: ReactionCount[]; user_reaction: string | null }>();
  for (const id of messageIds) {
    const counts = byMessage.get(id)!;
    const reactions = [...counts.entries()]
      .map(([emoji, count]) => ({ emoji, count }))
      .sort((a, b) => b.count - a.count);
    result.set(id, { reactions, user_reaction: userReaction.get(id) ?? null });
  }
  return result;
}

export function aggregateLikes(
  rows: LikeRow[],
  messageIds: number[],
  currentUserId?: string,
): Map<number, { like_count: number; user_liked: boolean }> {
  const counts = new Map<number, number>();
  const userLiked = new Set<number>();

  for (const id of messageIds) {
    counts.set(id, 0);
  }

  for (const row of rows) {
    if (!counts.has(row.message_id)) continue;
    counts.set(row.message_id, (counts.get(row.message_id) ?? 0) + 1);
    if (currentUserId && row.user_id === currentUserId) {
      userLiked.add(row.message_id);
    }
  }

  const result = new Map<number, { like_count: number; user_liked: boolean }>();
  for (const id of messageIds) {
    result.set(id, { like_count: counts.get(id) ?? 0, user_liked: userLiked.has(id) });
  }
  return result;
}

export function aggregateReplyCounts(rows: { parent_id: number | null }[]): Map<number, number> {
  const counts = new Map<number, number>();
  for (const row of rows) {
    if (row.parent_id == null) continue;
    counts.set(row.parent_id, (counts.get(row.parent_id) ?? 0) + 1);
  }
  return counts;
}

export function mapMessageRow(
  row: MessageRow,
  profiles: Map<string, ProfileView>,
  meta?: {
    like_count: number;
    user_liked: boolean;
    reactions: ReactionCount[];
    user_reaction: string | null;
    reply_count: number;
  },
): MessageView {
  return {
    id: row.id,
    room_id: row.room_id,
    parent_id: row.parent_id ?? null,
    user_id: row.user_id,
    content: row.content,
    created_at: row.created_at,
    profile: mapProfileFromMap(profiles, row.user_id),
    like_count: meta?.like_count ?? 0,
    user_liked: meta?.user_liked ?? false,
    reactions: meta?.reactions ?? [],
    user_reaction: meta?.user_reaction ?? null,
    reply_count: meta?.reply_count ?? 0,
    is_pinned: row.is_pinned ?? false,
  };
}

export async function enrichMessages<T extends { from: (table: string) => unknown }>(
  supabase: T,
  rows: MessageRow[],
  currentUserId?: string,
): Promise<MessageView[]> {
  if (!rows.length) return [];

  const messageIds = rows.map((r) => r.id);
  const userIds = [...new Set(rows.map((r) => r.user_id))];

  const client = supabase as {
    from: (table: string) => {
      select: (cols: string) => {
        in: (
          col: string,
          ids: number[] | string[],
        ) => Promise<{ data: ReactionRow[] | LikeRow[] | { parent_id: number | null }[] | null }>;
      };
    };
  };

  const [profilesMap, reactionsResult, likesResult, replyCountsResult] = await Promise.all([
    fetchProfilesMap(supabase, userIds),
    client
      .from("message_reactions")
      .select("message_id, emoji, user_id")
      .in("message_id", messageIds) as Promise<{ data: ReactionRow[] | null }>,
    client
      .from("message_likes")
      .select("message_id, user_id")
      .in("message_id", messageIds) as Promise<{ data: LikeRow[] | null }>,
    client
      .from("messages")
      .select("parent_id")
      .in("parent_id", messageIds) as Promise<{ data: { parent_id: number | null }[] | null }>,
  ]);

  const reactionMeta = aggregateReactions(reactionsResult.data ?? [], messageIds, currentUserId);
  const likeMeta = aggregateLikes(likesResult.data ?? [], messageIds, currentUserId);
  const replyCounts = aggregateReplyCounts(replyCountsResult.data ?? []);

  return rows.map((row) => {
    const reactions = reactionMeta.get(row.id);
    const likes = likeMeta.get(row.id);
    return mapMessageRow(row, profilesMap, {
      like_count: likes?.like_count ?? 0,
      user_liked: likes?.user_liked ?? false,
      reactions: reactions?.reactions ?? [],
      user_reaction: reactions?.user_reaction ?? null,
      reply_count: replyCounts.get(row.id) ?? 0,
    });
  });
}

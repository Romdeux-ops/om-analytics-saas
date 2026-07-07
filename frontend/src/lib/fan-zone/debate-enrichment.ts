import { fetchProfilesMap, mapProfileFromMap } from "./message-enrichment";
import type { DebatePostView, DebateView, ProfileView } from "./types";

export type DebatePostRow = {
  id: number;
  debate_id: number;
  user_id: string;
  content: string;
  created_at: string;
  parent_id?: number | null;
};

export function aggregateDebateReplyCounts(
  rows: { parent_id: number | null }[],
): Map<number, number> {
  const counts = new Map<number, number>();
  for (const row of rows) {
    if (row.parent_id == null) continue;
    counts.set(row.parent_id, (counts.get(row.parent_id) ?? 0) + 1);
  }
  return counts;
}

export function mapDebatePostRow(
  row: DebatePostRow,
  profiles: Map<string, ProfileView>,
  replyCount = 0,
): DebatePostView {
  return {
    id: row.id,
    debate_id: row.debate_id,
    parent_id: row.parent_id ?? null,
    user_id: row.user_id,
    content: row.content,
    created_at: row.created_at,
    profile: mapProfileFromMap(profiles, row.user_id),
    reply_count: replyCount,
  };
}

export async function enrichDebatePosts<T extends { from: (table: string) => unknown }>(
  supabase: T,
  rows: DebatePostRow[],
): Promise<DebatePostView[]> {
  if (!rows.length) return [];

  const postIds = rows.map((r) => r.id);
  const userIds = [...new Set(rows.map((r) => r.user_id))];

  const client = supabase as {
    from: (table: string) => {
      select: (cols: string) => {
        in: (
          col: string,
          ids: number[] | string[],
        ) => Promise<{ data: { parent_id: number | null }[] | null }>;
      };
    };
  };

  const [profilesMap, replyCountsResult] = await Promise.all([
    fetchProfilesMap(supabase, userIds),
    client
      .from("debate_posts")
      .select("parent_id")
      .in("parent_id", postIds) as Promise<{ data: { parent_id: number | null }[] | null }>,
  ]);

  const replyCounts = aggregateDebateReplyCounts(replyCountsResult.data ?? []);

  return rows.map((row) =>
    mapDebatePostRow(row, profilesMap, replyCounts.get(row.id) ?? 0),
  );
}

export async function getDebateTopLevelPosts<T extends { from: (table: string) => unknown }>(
  supabase: T,
  debateId: number,
): Promise<DebatePostView[]> {
  const client = supabase as {
    from: (table: string) => {
      select: (cols: string) => {
        eq: (col: string, val: number) => {
          is: (col: string, val: null) => {
            order: (
              col: string,
              opts: { ascending: boolean },
            ) => Promise<{ data: DebatePostRow[] | null; error: { message: string } | null }>;
          };
        };
      };
    };
  };

  const { data, error } = await client
    .from("debate_posts")
    .select("id, debate_id, parent_id, user_id, content, created_at")
    .eq("debate_id", debateId)
    .is("parent_id", null)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return enrichDebatePosts(supabase, data ?? []);
}

export function buildDebateView(
  debate: {
    id: number;
    room_id: number;
    question: string;
    is_active: boolean;
    created_at: string;
  },
  posts: DebatePostView[],
): DebateView {
  return {
    id: debate.id,
    room_id: debate.room_id,
    question: debate.question,
    is_active: debate.is_active,
    created_at: debate.created_at,
    posts,
  };
}

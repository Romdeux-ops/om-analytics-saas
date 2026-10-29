"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/src/components/ui/Button";
import { useAuth } from "@/src/components/auth/AuthProvider";
import { ReplyComposer } from "@/src/components/fan-zone/ReplyComposer";
import { createDebatePostAction } from "@/src/lib/fan-zone/actions";
import { closeDebateAction } from "@/src/lib/fan-zone/admin-actions";
import { DEBATE_POSTS_PREVIEW, MAX_DEBATE_POST_LENGTH } from "@/src/lib/fan-zone/constants";
import { mapDebatePostRow } from "@/src/lib/fan-zone/debate-enrichment";
import { formatRelativeTime, getInitials } from "@/src/lib/fan-zone/format";
import { fetchDebateRepliesClient } from "@/src/lib/fan-zone/queries.client";
import { createClient } from "@/src/lib/supabase/client";
import { cn } from "@/src/lib/ui/cn";
import type { DebatePostView, DebateView, ProfileView } from "@/src/lib/fan-zone/types";

function mergePosts(existing: DebatePostView[], incoming: DebatePostView[]): DebatePostView[] {
  const ids = new Set(existing.map((p) => p.id));
  const merged = [...existing];
  for (const post of incoming) {
    if (!ids.has(post.id)) {
      merged.push(post);
      ids.add(post.id);
    }
  }
  return merged.sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );
}

interface DebatePostItemProps {
  post: DebatePostView;
  debateId: number;
  isClosed: boolean;
  liveReplies?: DebatePostView[];
}

function DebatePostItem({ post, debateId, isClosed, liveReplies }: DebatePostItemProps) {
  const { requireAuth } = useAuth();
  const [replying, setReplying] = useState(false);
  const [repliesExpanded, setRepliesExpanded] = useState(false);
  const [replies, setReplies] = useState<DebatePostView[]>([]);
  const [loadingReplies, setLoadingReplies] = useState(false);

  const allReplies = useMemo(
    () => mergePosts(replies, liveReplies ?? []),
    [replies, liveReplies],
  );

  const displayCount = Math.max(post.reply_count, allReplies.length);

  async function loadReplies() {
    if (loadingReplies) return;
    setLoadingReplies(true);
    try {
      const data = await fetchDebateRepliesClient(post.id);
      setReplies(data);
      setRepliesExpanded(true);
    } finally {
      setLoadingReplies(false);
    }
  }

  async function handleReply(content: string): Promise<boolean> {
    const result = await requireAuth(() => createDebatePostAction(debateId, content, post.id));
    if (!result?.ok) return false;
    setReplying(false);
    if (!repliesExpanded) await loadReplies();
    return true;
  }

  return (
    <article className="border-b border-ink/20 py-3 last:border-b-0">
      <div className="flex gap-3">
        <div
          className="display flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden border border-ink text-sm"
          aria-hidden="true"
        >
          {post.profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.profile.avatar_url}
              alt=""
              className="h-full w-full object-cover grayscale"
            />
          ) : (
            getInitials(post.profile.display_name)
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="display text-lg">{post.profile.display_name}</span>
            <time className="text-[11px] tabular text-ink/50" dateTime={post.created_at}>
              {formatRelativeTime(post.created_at)}
            </time>
          </div>
          <p className="mt-1 whitespace-pre-wrap text-[13px] text-ink">{post.content}</p>

          {!isClosed && (
            <button
              type="button"
              onClick={() => {
                void requireAuth(() => setReplying(true));
              }}
              className="label mt-2 cursor-pointer border-b border-ink/40 hover:border-accent hover:text-accent-text"
            >
              Répondre
            </button>
          )}

          {replying && (
            <ReplyComposer
              onSubmit={handleReply}
              onCancel={() => setReplying(false)}
              placeholder="Votre argument..."
            />
          )}

          {displayCount > 0 && (
            <div className="mt-2">
              {!repliesExpanded ? (
                <button
                  type="button"
                  onClick={loadReplies}
                  disabled={loadingReplies}
                  className="label cursor-pointer text-ink/60 hover:text-ink disabled:cursor-not-allowed"
                >
                  {loadingReplies
                    ? "Chargement…"
                    : `Voir ${displayCount} réponse${displayCount > 1 ? "s" : ""} ↓`}
                </button>
              ) : (
                <ul className="mt-2 space-y-2 border-l-[3px] border-ink pl-3" role="list">
                  {allReplies.map((reply) => (
                    <li key={reply.id} className="text-[13px]">
                      <span className="font-semibold uppercase">{reply.profile.display_name}</span>
                      <span className="mx-1.5 text-ink/40">/</span>
                      <span className="text-ink/80">{reply.content}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

interface DebateCardProps {
  debate: DebateView;
  onClosed?: (debateId: number) => void;
}

export function DebateCard({ debate, onClosed }: DebateCardProps) {
  const supabase = useMemo(() => createClient(), []);
  const { requireAuth, isAdmin } = useAuth();
  const [isActive, setIsActive] = useState(debate.is_active);
  const [posts, setPosts] = useState(debate.posts);
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [closing, setClosing] = useState(false);
  const [liveRepliesByParent, setLiveRepliesByParent] = useState<Record<number, DebatePostView[]>>(
    {},
  );

  const postIdsRef = useRef(new Set(posts.map((p) => p.id)));
  const profileCacheRef = useRef(new Map<string, ProfileView>());

  useEffect(() => {
    postIdsRef.current = new Set(posts.map((p) => p.id));
  }, [posts]);

  const isClosed = !isActive;
  const visiblePosts = posts.slice(0, DEBATE_POSTS_PREVIEW);
  const hasMore = posts.length > DEBATE_POSTS_PREVIEW;

  const fetchProfile = useCallback(
    async (userId: string): Promise<ProfileView> => {
      const cached = profileCacheRef.current.get(userId);
      if (cached) return cached;

      const { data } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .eq("id", userId)
        .single();

      const profile: ProfileView =
        data ?? {
          id: userId,
          display_name: userId.slice(0, 8),
          avatar_url: null,
        };

      profileCacheRef.current.set(userId, profile);
      return profile;
    },
    [supabase],
  );

  const handleNewRow = useCallback(
    async (row: {
      id: number;
      debate_id: number;
      user_id: string;
      content: string;
      created_at: string;
      parent_id?: number | null;
    }) => {
      if (row.debate_id !== debate.id) return;
      if (postIdsRef.current.has(row.id)) return;

      const profile = await fetchProfile(row.user_id);
      const view = mapDebatePostRow(
        {
          id: row.id,
          debate_id: row.debate_id,
          user_id: row.user_id,
          content: row.content,
          created_at: row.created_at,
          parent_id: row.parent_id ?? null,
        },
        new Map([[profile.id, profile]]),
      );

      if (row.parent_id != null) {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === row.parent_id ? { ...p, reply_count: p.reply_count + 1 } : p,
          ),
        );
        setLiveRepliesByParent((prev) => ({
          ...prev,
          [row.parent_id!]: [...(prev[row.parent_id!] ?? []), view],
        }));
        return;
      }

      postIdsRef.current.add(row.id);
      setPosts((prev) => mergePosts(prev, [view]));
    },
    [debate.id, fetchProfile],
  );

  useEffect(() => {
    const channel = supabase
      .channel(`debate-posts-${debate.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "debate_posts",
          filter: `debate_id=eq.${debate.id}`,
        },
        (payload) => {
          void handleNewRow(
            payload.new as {
              id: number;
              debate_id: number;
              user_id: string;
              content: string;
              created_at: string;
              parent_id?: number | null;
            },
          );
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, debate.id, handleNewRow]);

  async function handleSubmit() {
    const trimmed = content.trim();
    if (!trimmed || submitting || isClosed) return;

    setSubmitting(true);
    setError(null);

    const result = await requireAuth(() => createDebatePostAction(debate.id, trimmed));
    setSubmitting(false);

    if (!result) return;
    if (!result.ok) {
      setError(result.error);
      return;
    }

    setContent("");
  }

  async function handleClose() {
    if (isClosed || closing) return;
    setClosing(true);
    setError(null);

    const result = await closeDebateAction(debate.id);
    setClosing(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setIsActive(false);
    onClosed?.(debate.id);
  }

  return (
    <article className="border border-ink bg-paper">
      <header className="flex items-center justify-between gap-3 border-b border-ink bg-ink px-4 py-2 text-paper">
        <span className="label">
          Débat{isClosed && <span className="text-paper/50"> · Clos</span>}
        </span>
        {isAdmin && !isClosed && (
          <button
            type="button"
            onClick={handleClose}
            disabled={closing}
            className="label border-b border-paper/60 pb-0.5 hover:border-live disabled:opacity-40"
          >
            {closing ? "Fermeture…" : "Clore le débat"}
          </button>
        )}
      </header>

      <div className="p-4">
      <h3 className="editorial text-3xl leading-tight text-ink">« {debate.question} »</h3>

      <div className="mt-4">
        {visiblePosts.length === 0 ? (
          <p className="editorial text-lg text-ink/55">Soyez le premier à donner votre avis.</p>
        ) : (
          visiblePosts.map((post) => (
            <DebatePostItem
              key={post.id}
              post={post}
              debateId={debate.id}
              isClosed={isClosed}
              liveReplies={liveRepliesByParent[post.id]}
            />
          ))
        )}

        {hasMore && (
          <p className="label pt-2 text-ink/50">
            + {posts.length - DEBATE_POSTS_PREVIEW} autre{posts.length - DEBATE_POSTS_PREVIEW > 1 ? "s" : ""}{" "}
            prise{posts.length - DEBATE_POSTS_PREVIEW > 1 ? "s" : ""} de position
          </p>
        )}
      </div>

      {!isClosed && (
        <div className="mt-4 border-t border-ink pt-4">
          <label htmlFor={`debate-composer-${debate.id}`} className="sr-only">
            Participer au débat
          </label>
          <div className="flex gap-2">
            <textarea
              id={`debate-composer-${debate.id}`}
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, MAX_DEBATE_POST_LENGTH))}
              placeholder="Donnez votre avis..."
              rows={2}
              className={cn(
                "min-w-0 flex-1 resize-none border border-ink bg-paper px-3 py-2 text-sm text-ink outline-none placeholder:text-ink/40 focus:shadow-[3px_3px_0_0_var(--accent)]",
              )}
            />
            <Button
              type="button"
              variant="primary"
              size="sm"
              loading={submitting}
              disabled={!content.trim()}
              onClick={handleSubmit}
              className="self-end"
              aria-label="Publier votre prise de position"
            >
              <span aria-hidden="true">→</span>
            </Button>
          </div>
        </div>
      )}

      <p className="label mt-3 text-ink/50">
        <span className="tabular">{posts.length}</span> prise{posts.length !== 1 ? "s" : ""} de position
      </p>

      {error && (
        <p className="label mt-2 text-live-text" role="alert">
          {error}
        </p>
      )}
      </div>
    </article>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Lock, MessageCircle, MessagesSquare } from "lucide-react";
import { Card } from "@/src/components/ui/Card";
import { Badge } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import { useAuth } from "@/src/components/auth/AuthProvider";
import { ReplyComposer } from "@/src/components/fan-zone/ReplyComposer";
import { createDebatePostAction } from "@/src/lib/fan-zone/actions";
import { closeDebateAction } from "@/src/lib/fan-zone/admin-actions";
import { DEBATE_POSTS_PREVIEW, MAX_DEBATE_POST_LENGTH } from "@/src/lib/fan-zone/constants";
import { mapDebatePostRow } from "@/src/lib/fan-zone/debate-enrichment";
import { fetchDebateRepliesClient } from "@/src/lib/fan-zone/queries.client";
import { createClient } from "@/src/lib/supabase/client";
import { cn } from "@/src/lib/ui/cn";
import type { DebatePostView, DebateView, ProfileView } from "@/src/lib/fan-zone/types";

function formatRelativeTime(iso: string) {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "à l'instant";
  if (diffMin < 60) return `il y a ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `il y a ${diffH}h`;
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(date);
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

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
    let ok = false;
    await requireAuth(async () => {
      const result = await createDebatePostAction(debateId, content, post.id);
      if (!result.ok) return;
      ok = true;
      setReplying(false);
      if (!repliesExpanded) {
        await loadReplies();
      }
    });
    return ok;
  }

  return (
    <article className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
      <div className="flex gap-3">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-500/15 text-xs font-bold text-cyan-300"
          aria-hidden="true"
        >
          {post.profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.profile.avatar_url}
              alt=""
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            getInitials(post.profile.display_name)
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-sm font-semibold text-white">{post.profile.display_name}</span>
            <time className="text-[11px] text-slate-500" dateTime={post.created_at}>
              {formatRelativeTime(post.created_at)}
            </time>
          </div>
          <p className="mt-1 whitespace-pre-wrap text-sm text-slate-200">{post.content}</p>

          {!isClosed && (
            <button
              type="button"
              onClick={() => {
                if (replying) {
                  setReplying(false);
                  return;
                }
                requireAuth(() => setReplying(true));
              }}
              className="mt-2 text-xs font-medium text-cyan-400/80 hover:text-cyan-300"
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
                  className="text-xs font-medium text-slate-400 hover:text-slate-300"
                >
                  {loadingReplies
                    ? "Chargement..."
                    : `Voir ${displayCount} réponse${displayCount > 1 ? "s" : ""}`}
                </button>
              ) : (
                <ul className="mt-2 space-y-2 border-l border-white/10 pl-3" role="list">
                  {allReplies.map((reply) => (
                    <li key={reply.id} className="text-sm">
                      <span className="font-medium text-white">{reply.profile.display_name}</span>
                      <span className="mx-1.5 text-slate-600">·</span>
                      <span className="text-slate-300">{reply.content}</span>
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

    await requireAuth(async () => {
      setSubmitting(true);
      setError(null);

      const result = await createDebatePostAction(debate.id, trimmed);
      setSubmitting(false);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setContent("");
    });
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
    <Card variant="flat" className="border-cyan-400/15">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <MessagesSquare size={16} className="text-cyan-400" aria-hidden="true" />
          <Badge variant="muted" className="border-cyan-400/25 text-cyan-200">
            Débat
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {isClosed && <Badge variant="muted">Clos</Badge>}
          {isAdmin && !isClosed && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              disabled={closing}
              className="text-amber-300 hover:text-amber-200"
            >
              <Lock size={13} />
              Fermer
            </Button>
          )}
        </div>
      </div>

      <h3 className="font-tech text-lg font-bold text-white">{debate.question}</h3>

      <div className="mt-4 space-y-3">
        {visiblePosts.length === 0 ? (
          <p className="text-sm text-slate-500">Soyez le premier à donner votre avis.</p>
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
          <p className="text-xs text-slate-500">
            + {posts.length - DEBATE_POSTS_PREVIEW} autre{posts.length - DEBATE_POSTS_PREVIEW > 1 ? "s" : ""}{" "}
            prise{posts.length - DEBATE_POSTS_PREVIEW > 1 ? "s" : ""} de position
          </p>
        )}
      </div>

      {!isClosed && (
        <div className="mt-4 border-t border-white/8 pt-4">
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
                "min-w-0 flex-1 resize-none rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/40",
              )}
            />
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={submitting || !content.trim()}
              onClick={handleSubmit}
              className="self-end"
            >
              <MessageCircle size={14} />
            </Button>
          </div>
        </div>
      )}

      <p className="mt-3 text-xs text-slate-500">
        {posts.length} prise{posts.length !== 1 ? "s" : ""} de position
      </p>

      {error && (
        <p className="mt-2 text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
    </Card>
  );
}

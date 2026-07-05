"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/src/lib/supabase/client";
import { fetchMessagesPageClient } from "@/src/lib/fan-zone/queries.client";
import { mapMessageRow } from "@/src/lib/fan-zone/message-enrichment";
import { MessageCard } from "@/src/components/fan-zone/MessageCard";
import { MessageComposer } from "@/src/components/fan-zone/MessageComposer";
import { Button } from "@/src/components/ui/Button";
import type { MessageView, ProfileView, ReactionCount } from "@/src/lib/fan-zone/types";

interface MessageFeedProps {
  roomId: number;
  initialMessages: MessageView[];
  initialCursor: string | null;
}

export function MessageFeed({ roomId, initialMessages, initialCursor }: MessageFeedProps) {
  const supabase = useMemo(() => createClient(), []);
  const [messages, setMessages] = useState<MessageView[]>(initialMessages);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const [reconnecting, setReconnecting] = useState(false);
  const [liveRepliesByParent, setLiveRepliesByParent] = useState<Record<number, MessageView[]>>({});

  const messageIdsRef = useRef(new Set(initialMessages.map((m) => m.id)));
  const profileCacheRef = useRef(new Map<string, ProfileView>());
  const pendingEngagementRef = useRef(new Set<number>());
  const engagementTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    messageIdsRef.current = new Set(messages.map((m) => m.id));
  }, [messages]);

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

  const buildReplyView = useCallback(
    async (row: {
      id: number;
      room_id: number;
      user_id: string;
      content: string;
      created_at: string;
      parent_id: number;
    }): Promise<MessageView> => {
      const profile = await fetchProfile(row.user_id);
      return mapMessageRow(
        {
          id: row.id,
          room_id: row.room_id,
          parent_id: row.parent_id,
          user_id: row.user_id,
          content: row.content,
          created_at: row.created_at,
        },
        new Map([[profile.id, profile]]),
      );
    },
    [fetchProfile],
  );

  const handleNewRow = useCallback(
    async (row: {
      id: number;
      room_id: number;
      user_id: string;
      content: string;
      created_at: string;
      parent_id?: number | null;
    }) => {
      if (row.room_id !== roomId) return;

      if (row.parent_id != null) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === row.parent_id ? { ...m, reply_count: m.reply_count + 1 } : m,
          ),
        );

        const reply = await buildReplyView({
          ...row,
          parent_id: row.parent_id,
        });

        setLiveRepliesByParent((prev) => ({
          ...prev,
          [row.parent_id!]: [...(prev[row.parent_id!] ?? []), reply],
        }));
        return;
      }

      const profile = await fetchProfile(row.user_id);
      const newMessage: MessageView = {
        id: row.id,
        room_id: row.room_id,
        parent_id: null,
        user_id: row.user_id,
        content: row.content,
        created_at: row.created_at,
        profile,
        like_count: 0,
        user_liked: false,
        reactions: [],
        user_reaction: null,
        reply_count: 0,
      };

      setMessages((prev) => {
        if (prev.some((m) => m.id === newMessage.id)) return prev;
        if (
          prev.some(
            (m) => m.pending && m.content === newMessage.content && m.user_id === newMessage.user_id,
          )
        ) {
          return prev.map((m) =>
            m.pending && m.content === newMessage.content ? newMessage : m,
          );
        }
        return [newMessage, ...prev];
      });
    },
    [roomId, fetchProfile, buildReplyView],
  );

  const refreshMessageEngagement = useCallback(
    async (messageId: number) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const [{ data: reactionRows }, { data: likeRows }] = await Promise.all([
        supabase
          .from("message_reactions")
          .select("message_id, emoji, user_id")
          .eq("message_id", messageId),
        supabase.from("message_likes").select("message_id, user_id").eq("message_id", messageId),
      ]);

      const counts = new Map<string, number>();
      let userReaction: string | null = null;
      for (const row of reactionRows ?? []) {
        counts.set(row.emoji, (counts.get(row.emoji) ?? 0) + 1);
        if (user && row.user_id === user.id) userReaction = row.emoji;
      }

      const reactions: ReactionCount[] = [...counts.entries()]
        .map(([emoji, count]) => ({ emoji, count }))
        .sort((a, b) => b.count - a.count);

      const like_count = likeRows?.length ?? 0;
      const user_liked = Boolean(user && likeRows?.some((r) => r.user_id === user.id));

      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, reactions, user_reaction: userReaction, like_count, user_liked } : m,
        ),
      );
    },
    [supabase],
  );

  const scheduleEngagementRefresh = useCallback(
    (messageId: number) => {
      if (!messageIdsRef.current.has(messageId)) return;

      pendingEngagementRef.current.add(messageId);
      if (engagementTimerRef.current) clearTimeout(engagementTimerRef.current);

      engagementTimerRef.current = setTimeout(async () => {
        const ids = [...pendingEngagementRef.current];
        pendingEngagementRef.current.clear();
        await Promise.all(ids.map((id) => refreshMessageEngagement(id)));
      }, 150);
    },
    [refreshMessageEngagement],
  );

  useEffect(() => {
    const channel = supabase
      .channel(`room-${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          handleNewRow(payload.new as Parameters<typeof handleNewRow>[0]);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "message_reactions",
        },
        (payload) => {
          const row = (payload.new ?? payload.old) as { message_id?: number } | null;
          if (row?.message_id) scheduleEngagementRefresh(row.message_id);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "message_likes",
        },
        (payload) => {
          const row = (payload.new ?? payload.old) as { message_id?: number } | null;
          if (row?.message_id) scheduleEngagementRefresh(row.message_id);
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setReconnecting(false);
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setReconnecting(true);
        }
      });

    return () => {
      if (engagementTimerRef.current) clearTimeout(engagementTimerRef.current);
      supabase.removeChannel(channel);
    };
  }, [roomId, supabase, handleNewRow, scheduleEngagementRefresh]);

  async function loadMore() {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    setLoadMoreError(null);
    try {
      const page = await fetchMessagesPageClient(roomId, cursor);
      setMessages((prev) => {
        const ids = new Set(prev.map((m) => m.id));
        const unique = page.messages.filter((m) => !ids.has(m.id));
        return [...prev, ...unique];
      });
      setCursor(page.nextCursor);
    } catch {
      setLoadMoreError("Impossible de charger plus de messages.");
    } finally {
      setLoadingMore(false);
    }
  }

  function handleOptimisticPost(message: MessageView) {
    setMessages((prev) => [message, ...prev]);
  }

  function handlePostError(tempId: number) {
    setMessages((prev) => prev.filter((m) => m.id !== tempId));
  }

  return (
    <div className="space-y-4">
      {reconnecting && (
        <p className="text-center text-xs text-amber-400" role="status">
          Reconnexion au fil en cours...
        </p>
      )}

      <MessageComposer
        roomId={roomId}
        onOptimisticPost={handleOptimisticPost}
        onPostError={handlePostError}
      />

      <div className="space-y-3" role="feed" aria-label="Fil de messages" aria-busy={loadingMore}>
        {messages.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            Aucun message pour l&apos;instant. Soyez le premier à publier !
          </p>
        ) : (
          messages.map((message) => (
            <MessageCard
              key={message.id}
              message={message}
              roomId={roomId}
              liveReplies={liveRepliesByParent[message.id]}
            />
          ))
        )}
      </div>

      {loadMoreError && (
        <p className="text-center text-sm text-red-400" role="alert">
          {loadMoreError}
        </p>
      )}

      {cursor && (
        <div className="flex justify-center pt-2">
          <Button variant="ghost" size="sm" onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? "Chargement..." : "Charger plus"}
          </Button>
        </div>
      )}
    </div>
  );
}

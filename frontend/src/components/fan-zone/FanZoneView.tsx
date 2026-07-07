"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CompetitionTabs } from "@/src/components/classement/CompetitionTabs";
import type { TabDescriptor } from "@/src/components/classement/CompetitionTabs";
import { AdminToolbar } from "@/src/components/fan-zone/AdminToolbar";
import { GuestBanner } from "@/src/components/fan-zone/GuestBanner";
import { MessageFeed } from "@/src/components/fan-zone/MessageFeed";
import { DebateList } from "@/src/components/fan-zone/DebateList";
import { PollList } from "@/src/components/fan-zone/PollList";
import { fetchRoomFeedClient } from "@/src/lib/fan-zone/queries.client";
import type { DebateView, MessageFeedPage, PollView, RoomView } from "@/src/lib/fan-zone/types";

interface RoomFeedData {
  messages: MessageFeedPage;
  polls: PollView[];
  debates: DebateView[];
}

interface FanZoneViewProps {
  rooms: RoomView[];
  initialFeed: RoomFeedData;
  defaultSlug: string;
}

const emptyFeed = (): RoomFeedData => ({
  messages: { messages: [], nextCursor: null },
  polls: [],
  debates: [],
});

export function FanZoneView({ rooms: initialRooms, initialFeed, defaultSlug }: FanZoneViewProps) {
  const [rooms, setRooms] = useState(initialRooms);
  const [selectedSlug, setSelectedSlug] = useState(defaultSlug);
  const [feedsBySlug, setFeedsBySlug] = useState<Record<string, RoomFeedData>>({
    [defaultSlug]: initialFeed,
  });
  const [loadingSlug, setLoadingSlug] = useState<string | null>(null);
  const loadedSlugsRef = useRef(new Set([defaultSlug]));

  const tabs: TabDescriptor<string>[] = useMemo(
    () =>
      rooms.map((room) => ({
        id: room.slug,
        label: room.name,
        shortLabel: room.name.split(" ")[0] ?? room.slug,
        season: room.description ?? "Salon",
      })),
    [rooms],
  );

  useEffect(() => {
    const room = rooms.find((r) => r.slug === selectedSlug);
    if (!room || loadedSlugsRef.current.has(selectedSlug)) return;

    loadedSlugsRef.current.add(selectedSlug);
    setLoadingSlug(selectedSlug);

    fetchRoomFeedClient(room.id)
      .then((feed) => {
        setFeedsBySlug((prev) => ({ ...prev, [selectedSlug]: feed }));
      })
      .finally(() => {
        setLoadingSlug((current) => (current === selectedSlug ? null : current));
      });
  }, [selectedSlug, rooms]);

  const feed = feedsBySlug[selectedSlug];
  const selectedRoom = rooms.find((r) => r.slug === selectedSlug) ?? rooms[0];
  const isLoading = loadingSlug === selectedSlug;

  function handleRoomCreated(room: RoomView) {
    setRooms((prev) => [...prev, room]);
    setFeedsBySlug((prev) => ({ ...prev, [room.slug]: emptyFeed() }));
    loadedSlugsRef.current.add(room.slug);
    setSelectedSlug(room.slug);
  }

  function handlePollCreated(poll: PollView) {
    setFeedsBySlug((prev) => {
      const current = prev[selectedSlug] ?? emptyFeed();
      return {
        ...prev,
        [selectedSlug]: {
          ...current,
          polls: [poll, ...current.polls],
        },
      };
    });
  }

  function handlePollClosed(pollId: number) {
    setFeedsBySlug((prev) => {
      const current = prev[selectedSlug];
      if (!current) return prev;
      return {
        ...prev,
        [selectedSlug]: {
          ...current,
          polls: current.polls.map((p) =>
            p.id === pollId
              ? { ...p, is_active: false, closes_at: new Date().toISOString() }
              : p,
          ),
        },
      };
    });
  }

  function handleDebateCreated(debate: DebateView) {
    setFeedsBySlug((prev) => {
      const current = prev[selectedSlug] ?? emptyFeed();
      return {
        ...prev,
        [selectedSlug]: {
          ...current,
          debates: [debate, ...current.debates],
        },
      };
    });
  }

  function handleDebateClosed(debateId: number) {
    setFeedsBySlug((prev) => {
      const current = prev[selectedSlug];
      if (!current) return prev;
      return {
        ...prev,
        [selectedSlug]: {
          ...current,
          debates: current.debates.filter((d) => d.id !== debateId),
        },
      };
    });
  }

  function handleRoomUpdated(room: RoomView) {
    setRooms((prev) => prev.map((r) => (r.id === room.id ? room : r)));
  }

  function handleRoomDeleted(roomId: number) {
    setRooms((prev) => {
      const deletedRoom = prev.find((r) => r.id === roomId);
      if (!deletedRoom) return prev;

      setFeedsBySlug((feeds) => {
        const next = { ...feeds };
        delete next[deletedRoom.slug];
        return next;
      });
      loadedSlugsRef.current.delete(deletedRoom.slug);

      const remaining = prev.filter((r) => r.id !== roomId);
      setSelectedSlug((current) =>
        current === deletedRoom.slug ? (remaining[0]?.slug ?? current) : current,
      );

      return remaining;
    });
  }

  if (!selectedRoom) {
    return (
      <p className="text-center text-slate-500">Aucun salon disponible pour le moment.</p>
    );
  }

  return (
    <div className="space-y-6">
      <GuestBanner />

      <AdminToolbar
        currentRoom={selectedRoom}
        onRoomCreated={handleRoomCreated}
        onRoomUpdated={handleRoomUpdated}
        onRoomDeleted={handleRoomDeleted}
        onPollCreated={handlePollCreated}
        onDebateCreated={handleDebateCreated}
      />

      <CompetitionTabs
        competitions={tabs}
        selected={selectedSlug}
        onSelect={setSelectedSlug}
        ariaLabel="Salons"
      />

      <div
        role="tabpanel"
        id={`panel-${selectedSlug}`}
        aria-labelledby={`tab-${selectedSlug}`}
        tabIndex={0}
        className="grid grid-cols-1 gap-6 lg:grid-cols-5"
      >
        <div className="lg:col-span-3">
          {isLoading || !feed ? (
            <p className="py-8 text-center text-sm text-slate-500">Chargement du salon...</p>
          ) : (
            <MessageFeed
              key={selectedRoom.id}
              roomId={selectedRoom.id}
              initialMessages={feed.messages.messages}
              initialCursor={feed.messages.nextCursor}
            />
          )}
        </div>

        <aside className="lg:col-span-2">
          {feed && (
            <>
              <PollList
                key={`polls-${selectedSlug}`}
                polls={feed.polls}
                onPollClosed={handlePollClosed}
              />
              <DebateList
                key={`debates-${selectedSlug}`}
                debates={feed.debates}
                onDebateClosed={handleDebateClosed}
              />
            </>
          )}
        </aside>
      </div>
    </div>
  );
}

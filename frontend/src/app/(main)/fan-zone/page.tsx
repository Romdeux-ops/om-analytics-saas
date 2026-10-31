import type { Metadata } from "next";
import { Suspense } from "react";
import { FanZoneView } from "@/src/components/fan-zone/FanZoneView";
import { PageSectionHeader } from "@/src/components/layout/PageSectionHeader";
import { CardSkeleton } from "@/src/components/ui/CardSkeleton";
import { getAuthUser } from "@/src/lib/auth/session";
import {
  getActiveRooms,
  getMessagesPage,
  getRoomDebates,
  getRoomPolls,
} from "@/src/lib/fan-zone/queries.server";
import type { RoomView } from "@/src/lib/fan-zone/types";
import { pageMetadata } from "@/src/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Fan Zone",
  description: "Le mur du virage : salons de discussion, sondages et débats entre supporters de l'OM.",
  path: "/fan-zone",
});

export default async function FanZonePage() {
  const rooms = await getActiveRooms();
  const defaultSlug = rooms[0]?.slug ?? "tribune-principale";
  const roomNames = rooms.map((r) => r.name).join(" · ");

  return (
    <div>
      <PageSectionHeader
        title={
          <>
            Fan <span className="text-accent-text">Zone</span>
          </>
        }
        subtitle={roomNames ? `Le mur du virage · ${roomNames}` : "Le mur du virage · Communauté OM"}
      />

      <Suspense fallback={<CardSkeleton rows={5} />}>
        <FanZoneFeed rooms={rooms} defaultSlug={defaultSlug} />
      </Suspense>
    </div>
  );
}

async function FanZoneFeed({
  rooms,
  defaultSlug,
}: {
  rooms: RoomView[];
  defaultSlug: string;
}) {
  const user = await getAuthUser();
  const defaultRoom = rooms.find((r) => r.slug === defaultSlug) ?? rooms[0];

  let initialFeed: {
    messages: Awaited<ReturnType<typeof getMessagesPage>>;
    polls: Awaited<ReturnType<typeof getRoomPolls>>;
    debates: Awaited<ReturnType<typeof getRoomDebates>>;
  } = { messages: { messages: [], nextCursor: null }, polls: [], debates: [] };

  if (defaultRoom) {
    const [messages, polls, debates] = await Promise.all([
      getMessagesPage(defaultRoom.id, undefined, undefined, user?.id),
      getRoomPolls(defaultRoom.id, user?.id),
      getRoomDebates(defaultRoom.id),
    ]);
    initialFeed = { messages, polls, debates };
  }

  return <FanZoneView rooms={rooms} initialFeed={initialFeed} defaultSlug={defaultSlug} />;
}

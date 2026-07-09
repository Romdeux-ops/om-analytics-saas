import nextDynamic from "next/dynamic";
import { MessagesSquare } from "lucide-react";
import { CardSkeleton } from "@/src/components/ui/CardSkeleton";
import { PageSectionHeader } from "@/src/components/layout/PageSectionHeader";
import { getAuthUser } from "@/src/lib/auth/session";
import {
  getActiveRooms,
  getMessagesPage,
  getRoomDebates,
  getRoomPolls,
} from "@/src/lib/fan-zone/queries.server";

const FanZoneView = nextDynamic(
  () =>
    import("@/src/components/fan-zone/FanZoneView").then((mod) => ({ default: mod.FanZoneView })),
  { loading: () => <CardSkeleton rows={5} /> },
);

export const dynamic = "force-dynamic";

export default async function FanZonePage() {
  const [user, rooms] = await Promise.all([getAuthUser(), getActiveRooms()]);
  const defaultSlug = rooms[0]?.slug ?? "tribune-principale";
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

  const roomNames = rooms.map((r) => r.name).join(" · ");

  return (
    <div className="mx-auto max-w-5xl">
      <PageSectionHeader
        title={
          <span className="bg-gradient-to-r from-violet-300 to-fuchsia-400 bg-clip-text text-transparent">
            Fan Zone
          </span>
        }
        subtitle={roomNames || "Communauté OM"}
        icon={<MessagesSquare size={18} />}
        accent="violet"
      />

      <FanZoneView rooms={rooms} initialFeed={initialFeed} defaultSlug={defaultSlug} />
    </div>
  );
}

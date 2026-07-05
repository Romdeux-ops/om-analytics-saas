import Link from "next/link";
import { ArrowLeft, MessagesSquare } from "lucide-react";
import { FanZoneView } from "@/src/components/fan-zone/FanZoneView";
import { Reveal } from "@/src/components/ui/Reveal";
import { ThemeToggle } from "@/src/components/ui/ThemeToggle";
import { createClient } from "@/src/lib/supabase/server";
import {
  getActiveRooms,
  getMessagesPage,
  getRoomPolls,
} from "@/src/lib/fan-zone/queries.server";

export const dynamic = "force-dynamic";

export default async function FanZonePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const rooms = await getActiveRooms();
  const defaultSlug = rooms[0]?.slug ?? "tribune-principale";
  const defaultRoom = rooms.find((r) => r.slug === defaultSlug) ?? rooms[0];

  const initialFeed = defaultRoom
    ? {
        messages: await getMessagesPage(defaultRoom.id),
        polls: await getRoomPolls(defaultRoom.id, user?.id),
      }
    : { messages: { messages: [], nextCursor: null }, polls: [] };

  const roomNames = rooms.map((r) => r.name).join(" · ");

  return (
    <div className="page-shell">
      <main className="relative z-10 mx-auto max-w-5xl px-4 py-6 md:px-6 md:py-10 lg:px-8">
        <header className="mb-8 md:mb-10">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white"
              >
                <ArrowLeft size={16} />
                <span className="sr-only">Retour au menu</span>
                <span className="hidden sm:inline">Menu</span>
              </Link>
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-400/20 bg-violet-500/10 text-violet-300">
                  <MessagesSquare size={18} />
                </span>
                <div>
                  <h1 className="font-tech text-2xl font-black tracking-tight text-white md:text-3xl">
                    <span className="bg-gradient-to-r from-violet-300 to-fuchsia-400 bg-clip-text text-transparent">
                      Fan Zone
                    </span>
                  </h1>
                  {roomNames && (
                    <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.28em] text-slate-500">
                      {roomNames}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <ThemeToggle />
          </div>
          <div className="mt-6 h-px w-full bg-gradient-to-r from-transparent via-violet-400/25 to-transparent" />
        </header>

        <Reveal>
          <FanZoneView rooms={rooms} initialFeed={initialFeed} defaultSlug={defaultSlug} />
        </Reveal>
      </main>
    </div>
  );
}

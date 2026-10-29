"use client";

import { useState } from "react";
import { useAuth } from "@/src/components/auth/AuthProvider";
import { CreateDebateModal } from "@/src/components/fan-zone/CreateDebateModal";
import { CreatePollModal } from "@/src/components/fan-zone/CreatePollModal";
import { CreateRoomModal } from "@/src/components/fan-zone/CreateRoomModal";
import { EditRoomModal } from "@/src/components/fan-zone/EditRoomModal";
import { deleteRoomAction } from "@/src/lib/fan-zone/admin-actions";
import type { DebateView, PollView, RoomView } from "@/src/lib/fan-zone/types";

interface AdminToolbarProps {
  currentRoom: RoomView;
  onRoomCreated: (room: RoomView) => void;
  onRoomUpdated: (room: RoomView) => void;
  onRoomDeleted: (roomId: number) => void;
  onPollCreated: (poll: PollView) => void;
  onDebateCreated: (debate: DebateView) => void;
}

export function AdminToolbar({
  currentRoom,
  onRoomCreated,
  onRoomUpdated,
  onRoomDeleted,
  onPollCreated,
  onDebateCreated,
}: AdminToolbarProps) {
  const { isAdmin } = useAuth();
  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [editRoomModalOpen, setEditRoomModalOpen] = useState(false);
  const [pollModalOpen, setPollModalOpen] = useState(false);
  const [debateModalOpen, setDebateModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isAdmin) return null;

  async function handleDeleteRoom() {
    if (deleting) return;
    const confirmed = window.confirm(
      `Supprimer définitivement le salon « ${currentRoom.name} » ? Cette action est irréversible.`,
    );
    if (!confirmed) return;

    setDeleting(true);
    setError(null);

    const result = await deleteRoomAction(currentRoom.id);
    setDeleting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    onRoomDeleted(currentRoom.id);
  }

  return (
    <>
      <div className="ink-block flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <p className="label">
          <span className="bg-accent px-1.5 py-0.5 text-on-accent">Régie</span>
          <span className="ml-2 hidden text-paper/60 sm:inline">{currentRoom.name}</span>
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {[
            { label: "+ Salon", onClick: () => setRoomModalOpen(true) },
            { label: "Modifier salon", onClick: () => setEditRoomModalOpen(true) },
            { label: "+ Sondage", onClick: () => setPollModalOpen(true) },
            { label: "+ Débat", onClick: () => setDebateModalOpen(true) },
          ].map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={action.onClick}
              className="label border-b border-paper/50 pb-0.5 hover:border-accent-inverse hover:text-accent-inverse"
            >
              {action.label}
            </button>
          ))}
          <button
            type="button"
            onClick={handleDeleteRoom}
            disabled={deleting}
            className="label border-b border-live pb-0.5 hover:bg-live disabled:opacity-40"
          >
            {deleting ? "Suppression…" : "Supprimer salon"}
          </button>
        </div>
      </div>

      {error && (
        <p className="label text-live-text" role="alert">
          {error}
        </p>
      )}

      <CreateRoomModal
        open={roomModalOpen}
        onClose={() => setRoomModalOpen(false)}
        onCreated={onRoomCreated}
      />

      <EditRoomModal
        open={editRoomModalOpen}
        room={currentRoom}
        onClose={() => setEditRoomModalOpen(false)}
        onUpdated={onRoomUpdated}
      />

      <CreatePollModal
        open={pollModalOpen}
        roomId={currentRoom.id}
        onClose={() => setPollModalOpen(false)}
        onCreated={onPollCreated}
      />

      <CreateDebateModal
        open={debateModalOpen}
        roomId={currentRoom.id}
        onClose={() => setDebateModalOpen(false)}
        onCreated={onDebateCreated}
      />
    </>
  );
}

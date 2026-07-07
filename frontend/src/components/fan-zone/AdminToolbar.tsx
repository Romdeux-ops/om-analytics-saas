"use client";

import { useState } from "react";
import { Pencil, Plus, Shield, Trash2 } from "lucide-react";
import { Badge } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
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
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <Shield size={16} className="text-amber-300" aria-hidden="true" />
          <Badge variant="muted" className="border-amber-400/30 text-amber-200">
            Mode admin
          </Badge>
          <span className="hidden text-xs text-amber-200/70 sm:inline">· {currentRoom.name}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setRoomModalOpen(true)}>
            <Plus size={14} />
            Nouveau salon
          </Button>
          <Button variant="outline" size="sm" onClick={() => setEditRoomModalOpen(true)}>
            <Pencil size={14} />
            Modifier salon
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDeleteRoom}
            disabled={deleting}
            className="text-red-300 hover:text-red-200"
          >
            <Trash2 size={14} />
            Supprimer salon
          </Button>
          <Button variant="primary" size="sm" onClick={() => setPollModalOpen(true)}>
            <Plus size={14} />
            Nouveau sondage
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setDebateModalOpen(true)}
            className="bg-cyan-600 hover:bg-cyan-500"
          >
            <Plus size={14} />
            Nouveau débat
          </Button>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-400" role="alert">
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

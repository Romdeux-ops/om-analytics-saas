"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/src/components/ui/Button";
import { Modal } from "@/src/components/ui/Modal";
import { updateRoomAction } from "@/src/lib/fan-zone/admin-actions";
import {
  MAX_ROOM_DESCRIPTION_LENGTH,
  MAX_ROOM_NAME_LENGTH,
  MIN_ROOM_NAME_LENGTH,
} from "@/src/lib/fan-zone/constants";
import type { RoomView } from "@/src/lib/fan-zone/types";

interface EditRoomModalProps {
  open: boolean;
  room: RoomView;
  onClose: () => void;
  onUpdated: (room: RoomView) => void;
}

export function EditRoomModal({ open, room, onClose, onUpdated }: EditRoomModalProps) {
  if (!open) return null;
  return <EditRoomModalForm room={room} onClose={onClose} onUpdated={onUpdated} />;
}

function EditRoomModalForm({ room, onClose, onUpdated }: Omit<EditRoomModalProps, "open">) {
  const [name, setName] = useState(room.name);
  const [description, setDescription] = useState(room.description ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await updateRoomAction(room.id, { name, description });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onUpdated(result.room);
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open onClose={onClose} titleId="edit-room-title">
        <p className="label text-ink/50">{room.slug}</p>
        <h2 id="edit-room-title" className="display mt-1 text-4xl">
          Modifier le salon
        </h2>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="edit-room-name" className="label mb-1.5 block">
              Nom
            </label>
            <input
              id="edit-room-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, MAX_ROOM_NAME_LENGTH))}
              required
              minLength={MIN_ROOM_NAME_LENGTH}
              className="field"
            />
          </div>

          <div>
            <label htmlFor="edit-room-description" className="label mb-1.5 block">
              Description
            </label>
            <textarea
              id="edit-room-description"
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, MAX_ROOM_DESCRIPTION_LENGTH))}
              rows={2}
              className="field resize-none"
            />
          </div>

          {error && (
            <p className="label text-live-text" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" variant="primary" className="w-full" loading={loading}>
            Enregistrer
          </Button>
        </form>
    </Modal>
  );
}

"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/src/components/ui/Button";
import { Modal } from "@/src/components/ui/Modal";
import { createRoomAction } from "@/src/lib/fan-zone/admin-actions";
import {
  MAX_ROOM_DESCRIPTION_LENGTH,
  MAX_ROOM_NAME_LENGTH,
  MIN_ROOM_NAME_LENGTH,
} from "@/src/lib/fan-zone/constants";
import type { RoomView } from "@/src/lib/fan-zone/types";

interface CreateRoomModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (room: RoomView) => void;
}

function slugPreview(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function CreateRoomModal({ open, onClose, onCreated }: CreateRoomModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await createRoomAction(name, description);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setName("");
      setDescription("");
      onCreated(result.room);
      onClose();
    } finally {
      setLoading(false);
    }
  }

  const preview = slugPreview(name.trim());

  return (
    <Modal open={open} onClose={onClose} titleId="create-room-title">
        <p className="label text-ink/50">Mur du virage</p>
        <h2 id="create-room-title" className="display mt-1 text-4xl">
          Nouveau salon
        </h2>
        <p className="editorial mt-1 text-base text-ink/60">Un topic de discussion dans la Fan Zone.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="room-name" className="label mb-1.5 block">
              Nom du salon
            </label>
            <input
              id="room-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, MAX_ROOM_NAME_LENGTH))}
              required
              minLength={MIN_ROOM_NAME_LENGTH}
              className="field"
            />
            {preview && (
              <p className="label mt-1 text-ink/50">
                Slug : <span className="text-accent-text">{preview}</span>
              </p>
            )}
          </div>

          <div>
            <label htmlFor="room-description" className="label mb-1.5 block">
              Description (optionnel)
            </label>
            <textarea
              id="room-description"
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
            Créer le salon
          </Button>
        </form>
    </Modal>
  );
}

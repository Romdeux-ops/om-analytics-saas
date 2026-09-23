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
        <h2 id="create-room-title" className="font-tech text-xl font-bold text-white">
          Nouveau salon
        </h2>
        <p className="mt-1 text-sm text-slate-400">Créer un topic de discussion dans la Fan Zone.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="room-name" className="mb-1.5 block text-xs font-medium text-slate-400">
              Nom du salon
            </label>
            <input
              id="room-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, MAX_ROOM_NAME_LENGTH))}
              required
              minLength={MIN_ROOM_NAME_LENGTH}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-violet-400/50"
            />
            {preview && (
              <p className="mt-1 text-xs text-slate-500">
                Slug : <span className="text-violet-300">{preview}</span>
              </p>
            )}
          </div>

          <div>
            <label htmlFor="room-description" className="mb-1.5 block text-xs font-medium text-slate-400">
              Description (optionnel)
            </label>
            <textarea
              id="room-description"
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, MAX_ROOM_DESCRIPTION_LENGTH))}
              rows={2}
              className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-violet-400/50"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400" role="alert">
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

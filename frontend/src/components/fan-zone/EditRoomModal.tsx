"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { X } from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import { cn } from "@/src/lib/ui/cn";
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
  const dialogRef = useRef<HTMLDivElement>(null);
  const [name, setName] = useState(room.name);
  const [description, setDescription] = useState(room.description ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="presentation" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" aria-hidden="true" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-room-title"
        className={cn(
          "relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-[var(--bg-raise)] p-6 shadow-2xl",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white"
          aria-label="Fermer"
        >
          <X size={18} />
        </button>

        <h2 id="edit-room-title" className="font-tech text-xl font-bold text-white">
          Modifier le salon
        </h2>
        <p className="mt-1 text-sm text-slate-400">{room.slug}</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="edit-room-name" className="mb-1.5 block text-xs font-medium text-slate-400">
              Nom
            </label>
            <input
              id="edit-room-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, MAX_ROOM_NAME_LENGTH))}
              required
              minLength={MIN_ROOM_NAME_LENGTH}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-violet-400/50"
            />
          </div>

          <div>
            <label htmlFor="edit-room-description" className="mb-1.5 block text-xs font-medium text-slate-400">
              Description
            </label>
            <textarea
              id="edit-room-description"
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

          <Button type="submit" variant="primary" className="w-full" disabled={loading}>
            {loading ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </form>
      </div>
    </div>
  );
}

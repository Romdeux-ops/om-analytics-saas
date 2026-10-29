"use client";

import { useAuth } from "@/src/components/auth/AuthProvider";
import { Button } from "@/src/components/ui/Button";

export function GuestBanner() {
  const { isGuest, openAuthModal } = useAuth();

  if (!isGuest) return null;

  return (
    <div
      className="mb-6 flex flex-col items-start justify-between gap-3 border border-dashed border-ink px-4 py-3 sm:flex-row sm:items-center"
      role="status"
    >
      <p className="text-[13px]">
        <span className="label mr-2 bg-ink px-1.5 py-0.5 text-paper">Tribune visiteurs</span>
        Mode invité — connectez-vous pour poster et voter.
      </p>
      <Button variant="outline" size="sm" onClick={() => openAuthModal("login")}>
        Se connecter →
      </Button>
    </div>
  );
}

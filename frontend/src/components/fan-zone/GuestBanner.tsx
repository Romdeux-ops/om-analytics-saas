"use client";

import { Eye } from "lucide-react";
import { useAuth } from "@/src/components/auth/AuthProvider";
import { Button } from "@/src/components/ui/Button";

export function GuestBanner() {
  const { isGuest, openAuthModal } = useAuth();

  if (!isGuest) return null;

  return (
    <div
      className="mb-6 flex flex-col items-start justify-between gap-3 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 sm:flex-row sm:items-center"
      role="status"
    >
      <div className="flex items-center gap-3">
        <Eye size={16} className="shrink-0 text-amber-300" aria-hidden="true" />
        <p className="text-sm text-amber-100">
          Mode invité — connectez-vous pour poster et voter.
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={() => openAuthModal("login")}>
        Se connecter
      </Button>
    </div>
  );
}

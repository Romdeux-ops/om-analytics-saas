"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/src/components/ui/Button";
import { setGuestModeAction } from "@/src/app/actions/auth";
import { useAuth } from "@/src/components/auth/AuthProvider";

export function WelcomeActions() {
  const router = useRouter();
  const { openAuthModal, enterGuestMode } = useAuth();

  async function handleGuest() {
    await setGuestModeAction();
    enterGuestMode();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="w-full max-w-xl space-y-0 border-y border-ink">
      <div className="flex items-center justify-between gap-4 border-b border-ink py-4">
        <div>
          <p className="label text-ink/50">01</p>
          <p className="display mt-1 text-3xl">Se connecter</p>
          <p className="editorial mt-1 text-base text-ink/60">Accédez à votre compte supporter</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => openAuthModal("login")}>
          Connexion →
        </Button>
      </div>

      <div className="flex items-center justify-between gap-4 border-b border-ink py-4">
        <div>
          <p className="label text-ink/50">02</p>
          <p className="display mt-1 text-3xl">Créer un compte</p>
          <p className="editorial mt-1 text-base text-ink/60">Rejoignez le virage</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => openAuthModal("signup")}>
          S&apos;inscrire
        </Button>
      </div>

      <div className="flex items-center justify-between gap-4 py-4">
        <div>
          <p className="label text-ink/50">03</p>
          <p className="display mt-1 text-3xl">Tribune visiteurs</p>
          <p className="editorial mt-1 text-base text-ink/60">Lecture seule · Fan Zone en observation</p>
        </div>
        <Button variant="ghost" size="sm" onClick={handleGuest}>
          Continuer
        </Button>
      </div>
    </div>
  );
}

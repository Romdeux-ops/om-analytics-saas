"use client";

import { useRouter } from "next/navigation";
import { LogIn, UserPlus, Eye } from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { setGuestModeAction } from "@/src/app/actions/auth";
import { useAuth } from "@/src/components/auth/AuthProvider";

export function WelcomeActions() {
  const router = useRouter();
  const { openAuthModal } = useAuth();

  async function handleGuest() {
    await setGuestModeAction();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-4">
      <Card variant="flat" className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-500/10 text-cyan-300">
            <LogIn size={18} />
          </span>
          <div>
            <p className="font-tech font-bold text-white">Se connecter</p>
            <p className="text-xs text-slate-500">Accédez à votre compte supporter</p>
          </div>
        </div>
        <Button variant="primary" size="sm" onClick={() => openAuthModal("login")}>
          Connexion
        </Button>
      </Card>

      <Card variant="flat" className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-400/20 bg-amber-500/10 text-amber-300">
            <UserPlus size={18} />
          </span>
          <div>
            <p className="font-tech font-bold text-white">Créer un compte</p>
            <p className="text-xs text-slate-500">Rejoignez la communauté OM</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => openAuthModal("signup")}>
          S&apos;inscrire
        </Button>
      </Card>

      <Card variant="flat" className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-slate-400">
            <Eye size={18} />
          </span>
          <div>
            <p className="font-tech font-bold text-white">Jouer en tant qu&apos;invité</p>
            <p className="text-xs text-slate-500">Lecture seule · Fan Zone en observation</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={handleGuest}>
          Continuer
        </Button>
      </Card>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { signInAction, signUpAction } from "@/src/app/actions/auth";
import { Button } from "@/src/components/ui/Button";
import { Modal } from "@/src/components/ui/Modal";
import { MIN_PASSWORD_LENGTH } from "@/src/lib/fan-zone/constants";

type AuthIntent = "login" | "signup";

interface AuthModalProps {
  open: boolean;
  intent: AuthIntent;
  onClose: () => void;
  onSuccess: () => void;
  onSwitchIntent: (intent: AuthIntent) => void;
}

export function AuthModal({ open, intent, onClose, onSuccess, onSwitchIntent }: AuthModalProps) {
  const firstInputRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    firstInputRef.current?.focus();
  }, [open]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result =
        intent === "signup"
          ? await signUpAction(email, password, displayName)
          : await signInAction(email, password);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      if (intent === "signup" && "needsConfirmation" in result && result.needsConfirmation) {
        setError("Vérifiez votre email pour confirmer votre compte.");
        return;
      }

      onSuccess();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} titleId="auth-modal-title">
        <h2 id="auth-modal-title" className="font-tech text-xl font-bold text-white">
          {intent === "login" ? "Se connecter" : "Créer un compte"}
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          {intent === "login"
            ? "Accédez à la Fan Zone et participez aux débats."
            : "Rejoignez la communauté des supporters OM."}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {intent === "signup" && (
            <div>
              <label htmlFor="auth-display-name" className="mb-1.5 block text-xs font-medium text-slate-400">
                Pseudo
              </label>
              <input
                ref={firstInputRef}
                id="auth-display-name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                autoComplete="username"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-400/50"
              />
            </div>
          )}

          <div>
            <label htmlFor="auth-email" className="mb-1.5 block text-xs font-medium text-slate-400">
              Email
            </label>
            <input
              ref={intent === "login" ? firstInputRef : undefined}
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-400/50"
            />
          </div>

          <div>
            <label htmlFor="auth-password" className="mb-1.5 block text-xs font-medium text-slate-400">
              Mot de passe
            </label>
            <input
              id="auth-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={MIN_PASSWORD_LENGTH}
              autoComplete={intent === "login" ? "current-password" : "new-password"}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-400/50"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" variant="primary" className="w-full" loading={loading}>
            {intent === "login" ? "Se connecter" : "Créer mon compte"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-400">
          {intent === "login" ? "Pas encore de compte ?" : "Déjà un compte ?"}{" "}
          <button
            type="button"
            onClick={() => {
              setError(null);
              onSwitchIntent(intent === "login" ? "signup" : "login");
            }}
            className="pressable cursor-pointer font-medium text-cyan-400 hover:text-cyan-300"
          >
            {intent === "login" ? "Créer un compte" : "Se connecter"}
          </button>
        </p>
    </Modal>
  );
}

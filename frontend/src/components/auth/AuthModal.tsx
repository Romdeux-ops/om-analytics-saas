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
        <p className="label text-ink/50">Accès tribune</p>
        <h2 id="auth-modal-title" className="display mt-1 text-4xl">
          {intent === "login" ? "Se connecter" : "Créer un compte"}
        </h2>
        <p className="editorial mt-1 text-base text-ink/60">
          {intent === "login"
            ? "Fan Zone, débats et votes — entrez dans le virage."
            : "Rejoignez la communauté des supporters OM."}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {intent === "signup" && (
            <div>
              <label htmlFor="auth-display-name" className="label mb-1.5 block">
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
                className="field"
              />
            </div>
          )}

          <div>
            <label htmlFor="auth-email" className="label mb-1.5 block">
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
              className="field"
            />
          </div>

          <div>
            <label htmlFor="auth-password" className="label mb-1.5 block">
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
              className="field"
            />
          </div>

          {error && (
            <p className="label text-live-text" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" variant="primary" className="w-full" loading={loading}>
            {intent === "login" ? "Se connecter" : "Créer mon compte"}
          </Button>
        </form>

        <p className="mt-4 text-center text-[13px] text-ink/60">
          {intent === "login" ? "Pas encore de compte ?" : "Déjà un compte ?"}{" "}
          <button
            type="button"
            onClick={() => {
              setError(null);
              onSwitchIntent(intent === "login" ? "signup" : "login");
            }}
            className="label cursor-pointer border-b border-ink pb-0.5 hover:border-accent"
          >
            {intent === "login" ? "Créer un compte" : "Se connecter"}
          </button>
        </p>
    </Modal>
  );
}

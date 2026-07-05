"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { X } from "lucide-react";
import { signInAction, signUpAction } from "@/src/app/actions/auth";
import { Button } from "@/src/components/ui/Button";
import { cn } from "@/src/lib/ui/cn";
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
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    firstInputRef.current?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !dialogRef.current) return;

    function handleFocusTrap(e: KeyboardEvent) {
      if (e.key !== "Tab" || !dialogRef.current) return;

      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    }

    document.addEventListener("keydown", handleFocusTrap);
    return () => document.removeEventListener("keydown", handleFocusTrap);
  }, [open]);

  if (!open) return null;

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" aria-hidden="true" />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        className={cn(
          "relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-[var(--bg-raise)] p-6 shadow-2xl",
          "motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Fermer"
        >
          <X size={18} />
        </button>

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

          <Button type="submit" variant="primary" className="w-full" disabled={loading}>
            {loading ? "Chargement..." : intent === "login" ? "Se connecter" : "Créer mon compte"}
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
            className="font-medium text-cyan-400 hover:text-cyan-300"
          >
            {intent === "login" ? "Créer un compte" : "Se connecter"}
          </button>
        </p>
      </div>
    </div>
  );
}

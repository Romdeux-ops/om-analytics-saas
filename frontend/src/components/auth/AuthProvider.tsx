"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { signOutAction } from "@/src/app/actions/auth";
import { createClient } from "@/src/lib/supabase/client";
import { AuthModal } from "@/src/components/auth/AuthModal";
import type { ProfileView } from "@/src/lib/fan-zone/types";

type AuthIntent = "login" | "signup";

interface AuthContextValue {
  user: User | null;
  profile: ProfileView | null;
  isGuest: boolean;
  isLoading: boolean;
  openAuthModal: (intent?: AuthIntent) => void;
  requireAuth: (action: () => void) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
  initialGuest?: boolean;
  initialUser?: User | null;
}

export function AuthProvider({
  children,
  initialGuest = false,
  initialUser = null,
}: AuthProviderProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [user, setUser] = useState<User | null>(initialUser);
  const [profile, setProfile] = useState<ProfileView | null>(null);
  const [isGuest, setIsGuest] = useState(initialGuest);
  const [isLoading, setIsLoading] = useState(!initialUser && !initialGuest);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalIntent, setModalIntent] = useState<AuthIntent>("login");

  const fetchProfile = useCallback(
    async (authUser: User) => {
      const { data } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .eq("id", authUser.id)
        .single();

      setProfile(
        data ?? {
          id: authUser.id,
          display_name:
            (authUser.user_metadata?.display_name as string | undefined) ??
            authUser.email?.split("@")[0] ??
            "Supporter",
          avatar_url: null,
        },
      );
    },
    [supabase],
  );

  useEffect(() => {
    async function init() {
      if (initialUser) {
        setIsLoading(false);
        await fetchProfile(initialUser);
        return;
      }

      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (authUser) {
        setUser(authUser);
        setIsGuest(false);
        await fetchProfile(authUser);
      }

      setIsLoading(false);
    }

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      if (nextUser) {
        setIsGuest(false);
        await fetchProfile(nextUser);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, fetchProfile, initialUser]);

  const openAuthModal = useCallback((intent: AuthIntent = "login") => {
    setModalIntent(intent);
    setModalOpen(true);
  }, []);

  const requireAuth = useCallback(
    (action: () => void) => {
      if (isLoading) return;
      if (isGuest || !user) {
        openAuthModal("login");
        return;
      }
      action();
    },
    [isGuest, isLoading, user, openAuthModal],
  );

  const handleAuthSuccess = useCallback(async () => {
    setModalOpen(false);
    router.refresh();

    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (authUser) {
      setUser(authUser);
      setIsGuest(false);
      await fetchProfile(authUser);
      router.push("/");
    }
  }, [router, supabase, fetchProfile]);

  const signOut = useCallback(async () => {
    await signOutAction();
    setUser(null);
    setProfile(null);
    setIsGuest(false);
    router.push("/welcome");
    router.refresh();
  }, [router]);

  const value = useMemo(
    () => ({
      user,
      profile,
      isGuest,
      isLoading,
      openAuthModal,
      requireAuth,
      signOut,
    }),
    [user, profile, isGuest, isLoading, openAuthModal, requireAuth, signOut],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      <AuthModal
        open={modalOpen}
        intent={modalIntent}
        onClose={() => setModalOpen(false)}
        onSuccess={handleAuthSuccess}
        onSwitchIntent={setModalIntent}
      />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}

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
  isAdmin: boolean;
  isLoading: boolean;
  openAuthModal: (intent?: AuthIntent) => void;
  requireAuth: <T>(action: () => T | Promise<T>) => Promise<T | undefined>;
  requireAdmin: <T>(action: () => T | Promise<T>) => Promise<T | undefined>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
  initialGuest?: boolean;
  initialUser?: User | null;
  initialProfile?: ProfileView | null;
}

export function AuthProvider({
  children,
  initialGuest = false,
  initialUser = null,
  initialProfile = null,
}: AuthProviderProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [user, setUser] = useState<User | null>(initialUser);
  const [profile, setProfile] = useState<ProfileView | null>(initialProfile);
  const [isGuest, setIsGuest] = useState(initialGuest);
  const [isLoading, setIsLoading] = useState(!initialUser && !initialGuest);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalIntent, setModalIntent] = useState<AuthIntent>("login");

  const fetchProfile = useCallback(
    async (authUser: User) => {
      const { data } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, role")
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
          role: "user",
        },
      );
    },
    [supabase],
  );

  useEffect(() => {
    if (initialGuest) {
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
    }

    if (initialUser) {
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
    }

    async function init() {
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
  }, [supabase, fetchProfile, initialUser, initialGuest]);

  const openAuthModal = useCallback((intent: AuthIntent = "login") => {
    setModalIntent(intent);
    setModalOpen(true);
  }, []);

  const requireAuth = useCallback(
    async <T,>(action: () => T | Promise<T>): Promise<T | undefined> => {
      if (isLoading) return undefined;
      if (isGuest || !user) {
        openAuthModal("login");
        return undefined;
      }
      return await action();
    },
    [isGuest, isLoading, user, openAuthModal],
  );

  const requireAdmin = useCallback(
    async <T,>(action: () => T | Promise<T>): Promise<T | undefined> => {
      if (isLoading) return undefined;
      if (isGuest || !user) {
        openAuthModal("login");
        return undefined;
      }
      if (profile?.role !== "admin") return undefined;
      return await action();
    },
    [isGuest, isLoading, user, profile?.role, openAuthModal],
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

  const isAdmin = profile?.role === "admin";

  const value = useMemo(
    () => ({
      user,
      profile,
      isGuest,
      isAdmin,
      isLoading,
      openAuthModal,
      requireAuth,
      requireAdmin,
      signOut,
    }),
    [user, profile, isGuest, isAdmin, isLoading, openAuthModal, requireAuth, requireAdmin, signOut],
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


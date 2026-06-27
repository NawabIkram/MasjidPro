import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { AuthUser, Masjid } from "../types";
import {
  continueWithGoogleAccount,
  getCurrentSession,
  loginAccount,
  logoutAccount,
  registerDonorAccount,
  registerMasjidAccount,
  updateProfile,
} from "../services/api";
import type { DonorRegistrationInput, GoogleAuthInput, MasjidRegistrationInput } from "../services/api";

type AuthContextValue = {
  user: AuthUser | null;
  masjids: Masjid[];
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  continueWithGoogle: (input: GoogleAuthInput) => Promise<AuthUser>;
  registerMasjid: (input: MasjidRegistrationInput) => Promise<AuthUser>;
  registerDonor: (input: DonorRegistrationInput) => Promise<AuthUser>;
  logout: () => Promise<void>;
  selectMasjid: (masjidId: string) => Promise<void>;
  updateAccount: (input: Partial<Pick<AuthUser, "name" | "phone">>) => Promise<AuthUser>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [masjids, setMasjids] = useState<Masjid[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getCurrentSession()
      .then((session) => {
        if (!mounted) return;
        setUser(session.user);
        setMasjids(session.masjids);
      })
      .catch(() => {
        if (!mounted) return;
        setUser(null);
        setMasjids([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const acceptSession = (session: { user: AuthUser; masjids: Masjid[] }) => {
    setUser(session.user);
    setMasjids(session.masjids);
    return session.user;
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      masjids,
      loading,
      login: async (email, password) => acceptSession(await loginAccount({ email, password })),
      continueWithGoogle: async (input) => acceptSession(await continueWithGoogleAccount(input)),
      registerMasjid: async (input) => acceptSession(await registerMasjidAccount(input)),
      registerDonor: async (input) => acceptSession(await registerDonorAccount(input)),
      logout: async () => {
        try {
          await logoutAccount();
        } finally {
          setUser(null);
          setMasjids([]);
        }
      },
      selectMasjid: async (masjidId) => {
        if (!user || !user.masjidIds.includes(masjidId)) return;
        setUser(await updateProfile({ preferredMasjidId: masjidId }));
      },
      updateAccount: async (input) => {
        const updated = await updateProfile(input);
        setUser(updated);
        return updated;
      },
    }),
    [loading, masjids, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider.");
  return context;
}

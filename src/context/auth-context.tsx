"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { SessionProvider, signIn as nextAuthSignIn, signOut as nextAuthSignOut, useSession } from "next-auth/react";

export type ProfileRole = "creator" | "admin" | "teacher" | "student" | "parent";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: ProfileRole;
};

type AuthContextValue = {
  user: SessionUser | null;
  ready: boolean;
  signIn: (email: string, password: string) => Promise<{ ok: true } | { ok: false; message: string }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function InnerAuthProvider({ children }: { children: ReactNode }) {
  const { data, status } = useSession();
  const ready = status !== "loading";

  const user = (data?.user && "role" in data.user ? (data.user as SessionUser) : null) ?? null;

  const value = useMemo<AuthContextValue>(() => {
    return {
      user,
      ready,
      async signIn(email: string, password: string) {
        const result = await nextAuthSignIn("credentials", {
          email,
          password,
          redirect: false,
        });
        if (!result || result.error) {
          return { ok: false as const, message: "Invalid email or password." };
        }
        return { ok: true as const };
      },
      async signOut() {
        await nextAuthSignOut({ redirect: false });
      },
    };
  }, [ready, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <InnerAuthProvider>{children}</InnerAuthProvider>
    </SessionProvider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

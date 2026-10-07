"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { api } from "@/lib/api";
import type { User } from "@/lib/types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  verifyCredentials: (username: string, password: string) => Promise<void>;
  enterApp: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const refresh = useCallback(async () => {
    try {
      const u = await api.me();
      setUser(u);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Route guard: redirect unauthenticated users to /login
  useEffect(() => {
    if (loading) return;
    if (!user && pathname !== "/login") {
      router.replace("/login");
    }
    if (user && pathname === "/login") {
      router.replace("/hosted-zones");
    }
  }, [user, loading, pathname, router]);

  const login = async (username: string, password: string) => {
    const u = await api.login(username, password);
    setUser(u);
    router.replace("/hosted-zones");
  };

  // Populate the user from the current cookie session (used after a session is
  // activated during the multi-stage login) without re-issuing credentials.
  const enterApp = async () => {
    const u = await api.me();
    setUser(u);
    router.replace("/hosted-zones");
  };

  // Verify credentials for the first login stage WITHOUT entering the app yet.
  // The backend sets the session cookie on success; we clear it immediately so
  // the route guard does not auto-advance past the "Choose AWS sessions" stage.
  const verifyCredentials = async (username: string, password: string) => {
    await api.login(username, password);
    await api.logout();
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
    router.replace("/login");
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, verifyCredentials, enterApp, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

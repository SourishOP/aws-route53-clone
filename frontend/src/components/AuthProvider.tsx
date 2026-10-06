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

  const logout = async () => {
    await api.logout();
    setUser(null);
    router.replace("/login");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

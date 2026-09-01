"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { api, isApiClientError, TOKEN_KEY, type PublicUser } from "./api";

interface AuthState {
  user: PublicUser | null;
  loading: boolean;
  setUser: (u: PublicUser | null) => void;
  refresh: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (body: Parameters<typeof api.register>[0]) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);

  const refresh = useCallback(async () => {
    if (!localStorage.getItem(TOKEN_KEY)) {
      setUser(null);
      return;
    }
    try {
      const { user } = await api.me();
      if (mounted.current) setUser(user);
    } catch (e) {
      // Only clear the token on 401 — network blips and 5xx should not log
      // the user out. Anything else (unknown errors) is left as-is so we
      // don't accidentally wipe a still-valid session.
      if (isApiClientError(e) && e.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
      }
      if (mounted.current) setUser(null);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    refresh().finally(() => setLoading(false));
    return () => {
      mounted.current = false;
    };
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const { token, user } = await api.login(email, password);
    localStorage.setItem(TOKEN_KEY, token);
    setUser(user);
  }, []);

  const register = useCallback(async (body: Parameters<typeof api.register>[0]) => {
    const { token, user } = await api.register(body);
    localStorage.setItem(TOKEN_KEY, token);
    setUser(user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      /* session may already be dead */
    }
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, setUser, refresh, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

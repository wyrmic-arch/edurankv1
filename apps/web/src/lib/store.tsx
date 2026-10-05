"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import { api, isApiClientError, TOKEN_KEY, type PublicUser } from "./api";

interface AuthState {
  user: PublicUser | null;
  loading: boolean;
  /** Set when we have a token but the API couldn't be reached — lets the app
   *  show a retry instead of treating the user as logged out. */
  authError: string | null;
  setUser: Dispatch<SetStateAction<PublicUser | null>>;
  refresh: () => Promise<void>;
  login: (email: string, password: string, turnstileToken?: string) => Promise<PublicUser>;
  register: (body: Parameters<typeof api.register>[0]) => Promise<PublicUser>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const mounted = useRef(true);

  const refresh = useCallback(async () => {
    if (!localStorage.getItem(TOKEN_KEY)) {
      setUser(null);
      setAuthError(null);
      return;
    }
    // Retry transient failures (cold worker, flaky mobile network) before
    // giving up. We only ever *log out* on an explicit 401.
    const delays = [0, 800, 2000];
    for (let attempt = 0; attempt < delays.length; attempt++) {
      if (delays[attempt]) await new Promise((r) => setTimeout(r, delays[attempt]));
      if (!mounted.current) return;
      try {
        const { user } = await api.me();
        if (mounted.current) {
          setUser(user);
          setAuthError(null);
        }
        return;
      } catch (e) {
        if (isApiClientError(e) && e.status === 401) {
          localStorage.removeItem(TOKEN_KEY);
          if (mounted.current) {
            setUser(null);
            setAuthError(null);
          }
          return;
        }
        // Network / 5xx — fall through and retry.
      }
    }
    // Token still present but the API is unreachable: keep the session and
    // surface a retryable error rather than redirecting to /login.
    if (mounted.current) setAuthError("Couldn't reach EduRank. Check your connection and try again.");
  }, []);

  useEffect(() => {
    mounted.current = true;
    refresh().finally(() => {
      if (mounted.current) setLoading(false);
    });
    return () => {
      mounted.current = false;
    };
  }, [refresh]);

  const login = useCallback(async (email: string, password: string, turnstileToken?: string) => {
    const { token, user } = await api.login(email, password, turnstileToken);
    localStorage.setItem(TOKEN_KEY, token);
    setUser(user);
    setAuthError(null);
    return user;
  }, []);

  const register = useCallback(async (body: Parameters<typeof api.register>[0]) => {
    const { token, user } = await api.register(body);
    localStorage.setItem(TOKEN_KEY, token);
    setUser(user);
    setAuthError(null);
    return user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      /* session may already be dead */
    }
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    setAuthError(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, authError, setUser, refresh, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

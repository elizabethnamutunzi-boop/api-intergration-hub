"use client";

import { createContext, useCallback, useContext, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { authenticate, registerAccount, startSession } from "@/lib/auth-credentials";
import { persistLogout, getServerSessionUser, getSessionUser, subscribeSession } from "@/lib/auth-storage";
import { hasPermission, type AuthResult, type AuthUser, type Permission, type RegisterInput } from "@/types/auth";

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isReady: boolean;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  login: (username: string, password: string) => Promise<AuthResult>;
  register: (input: RegisterInput) => Promise<AuthResult>;
  requestLogout: () => void;
  cancelLogout: () => void;
  confirmLogout: () => void;
  logoutConfirmOpen: boolean;
  can: (permission: Permission) => boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const user = useSyncExternalStore(subscribeSession, getSessionUser, getServerSessionUser);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  const login = useCallback(async (username: string, password: string): Promise<AuthResult> => {
    try {
      const nextUser = await authenticate(username, password);
      if (!nextUser) {
        return { ok: false, message: "Invalid username or password." };
      }

      startSession(nextUser);
      setDrawerOpen(false);
      return { ok: true };
    } catch {
      return { ok: false, message: "Unable to sign in. Please try again." };
    }
  }, []);

  const register = useCallback(async (input: RegisterInput): Promise<AuthResult> => {
    try {
      const result = await registerAccount(input);
      if (!result.ok || !result.user) {
        return { ok: false, message: result.message ?? "Unable to create the account." };
      }

      startSession(result.user);
      setDrawerOpen(false);
      return { ok: true };
    } catch {
      return { ok: false, message: "Unable to create the account. Please try again." };
    }
  }, []);

  const requestLogout = useCallback(() => {
    setLogoutConfirmOpen(true);
  }, []);

  const cancelLogout = useCallback(() => {
    setLogoutConfirmOpen(false);
  }, []);

  const confirmLogout = useCallback(() => {
    persistLogout();
    setDrawerOpen(false);
    setLogoutConfirmOpen(false);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isReady: true,
      drawerOpen,
      openDrawer: () => setDrawerOpen(true),
      closeDrawer: () => setDrawerOpen(false),
      login,
      register,
      requestLogout,
      cancelLogout,
      confirmLogout,
      logoutConfirmOpen,
      can: (permission: Permission) => hasPermission(user, permission),
    }),
    [cancelLogout, confirmLogout, drawerOpen, login, logoutConfirmOpen, register, requestLogout, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

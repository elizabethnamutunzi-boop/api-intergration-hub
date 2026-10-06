"use client";

import { QueryProvider } from "@/components/providers/query-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import { WatchlistProvider } from "@/components/providers/watchlist-provider";
import { AuthDrawer } from "@/components/auth/auth-drawer";
import { LogoutConfirm } from "@/components/auth/logout-confirm";
import type { ReactNode } from "react";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        <WatchlistProvider>
          {children}
          <AuthDrawer />
          <LogoutConfirm />
        </WatchlistProvider>
      </AuthProvider>
    </QueryProvider>
  );
}

"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import {
  getServerWatchlistIds,
  getWatchlistIds,
  persistWatchlist,
  subscribeWatchlist,
} from "@/lib/auth-storage";

type WatchlistContextValue = {
  ids: string[];
  has: (id: string) => boolean;
  add: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const WatchlistContext = createContext<WatchlistContextValue | null>(null);

export function WatchlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const ids = useSyncExternalStore(
    subscribeWatchlist,
    () => getWatchlistIds(userId),
    getServerWatchlistIds,
  );

  const persist = useCallback(
    (next: string[]) => {
      if (!userId) {
        return;
      }
      persistWatchlist(userId, next);
    },
    [userId],
  );

  const value = useMemo<WatchlistContextValue>(
    () => ({
      ids,
      has: (id: string) => ids.includes(id),
      add: (id: string) => {
        if (!userId || ids.includes(id)) {
          return;
        }
        persist([...ids, id]);
      },
      remove: (id: string) => persist(ids.filter((item) => item !== id)),
      clear: () => persist([]),
    }),
    [ids, persist, userId],
  );

  return <WatchlistContext.Provider value={value}>{children}</WatchlistContext.Provider>;
}

export function useWatchlist(): WatchlistContextValue {
  const context = useContext(WatchlistContext);
  if (!context) {
    throw new Error("useWatchlist must be used within WatchlistProvider");
  }
  return context;
}

import { z } from "zod";
import type { AuthSession, AuthUser } from "@/types/auth";

export const SESSION_STORAGE_KEY = "pulseboard.session.v2";
export const TOKEN_STORAGE_KEY = "pulseboard.token.v1";
export const ACCOUNTS_STORAGE_KEY = "pulseboard.accounts.v1";
export const WATCHLIST_STORAGE_KEY = "pulseboard.watchlist.v1";
const LEGACY_SESSION_KEY = "pulseboard.session.v1";

const authUserSchema = z.object({
  id: z.string().min(1),
  username: z.string().min(1),
  name: z.string().min(1),
  email: z.string().min(1),
  role: z.enum(["admin", "analyst"]),
  initials: z.string().min(1),
});

const sessionSchema = z.object({
  user: authUserSchema,
  token: z.string().min(1),
  issuedAt: z.string().min(1),
});

const accountSchema = z.object({
  user: authUserSchema,
  salt: z.string().min(1),
  passwordHash: z.string().min(1),
});

const accountsSchema = z.array(accountSchema);
const watchlistSchema = z.record(z.array(z.string()));

export type StoredAccount = z.infer<typeof accountSchema>;

function canUseStorage(): boolean {
  return typeof window !== "undefined";
}

export function createAuthToken(userId: string): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  const nonce = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `pb.${encodeURIComponent(userId)}.${nonce}`;
}

export function readAccounts(): StoredAccount[] {
  if (!canUseStorage()) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = accountsSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
}

export function writeAccounts(accounts: StoredAccount[]): void {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
}

export function findAccount(username: string): StoredAccount | undefined {
  const needle = username.trim().toLowerCase();
  return readAccounts().find((account) => account.user.username.toLowerCase() === needle);
}

export function upsertAccount(account: StoredAccount): void {
  const accounts = readAccounts().filter((item) => item.user.id !== account.user.id && item.user.username !== account.user.username);
  writeAccounts([...accounts, account]);
}

function readStoredToken(): string | null {
  if (!canUseStorage()) {
    return null;
  }
  return window.localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function readSession(): AuthSession | null {
  if (!canUseStorage()) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = sessionSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
      return null;
    }

    const token = readStoredToken();
    if (!token || token !== parsed.data.token) {
      return null;
    }

    return parsed.data;
  } catch {
    return null;
  }
}

export function writeSession(user: AuthUser, token: string): AuthSession {
  const session: AuthSession = {
    user,
    token,
    issuedAt: new Date().toISOString(),
  };

  if (canUseStorage()) {
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
    window.localStorage.removeItem(LEGACY_SESSION_KEY);
  }

  return session;
}

export function clearSession(): void {
  if (canUseStorage()) {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    window.localStorage.removeItem(LEGACY_SESSION_KEY);
  }
}

export function readWatchlists(): Record<string, string[]> {
  if (!canUseStorage()) {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(WATCHLIST_STORAGE_KEY);
    if (!raw) {
      return {};
    }

    const parsed = watchlistSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : {};
  } catch {
    return {};
  }
}

export function writeWatchlist(userId: string, ids: string[]): void {
  if (!canUseStorage()) {
    return;
  }

  const current = readWatchlists();
  current[userId] = ids;
  window.localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(current));
}

type Listener = () => void;

const sessionListeners = new Set<Listener>();
const watchlistListeners = new Set<Listener>();
const EMPTY_WATCHLIST: string[] = [];
let watchlistCache: { key: string; ids: string[] } | null = null;

function emit(listeners: Set<Listener>): void {
  listeners.forEach((listener) => listener());
}

export function subscribeSession(listener: Listener): () => void {
  sessionListeners.add(listener);
  return () => sessionListeners.delete(listener);
}

export function subscribeWatchlist(listener: Listener): () => void {
  watchlistListeners.add(listener);
  return () => watchlistListeners.delete(listener);
}

export function getSessionUser(): AuthUser | null {
  return readSession()?.user ?? null;
}

export function getServerSessionUser(): AuthUser | null {
  return null;
}

export function getWatchlistIds(userId: string): string[] {
  if (!userId) {
    return EMPTY_WATCHLIST;
  }

  const ids = readWatchlists()[userId] ?? EMPTY_WATCHLIST;
  const key = `${userId}:${ids.join(",")}`;
  if (watchlistCache?.key === key) {
    return watchlistCache.ids;
  }

  watchlistCache = { key, ids };
  return ids;
}

export function getServerWatchlistIds(): string[] {
  return EMPTY_WATCHLIST;
}

export function persistSession(user: AuthUser, token: string): void {
  writeSession(user, token);
  emit(sessionListeners);
}

export function persistLogout(): void {
  clearSession();
  emit(sessionListeners);
}

export function persistWatchlist(userId: string, ids: string[]): void {
  writeWatchlist(userId, ids);
  emit(watchlistListeners);
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key === SESSION_STORAGE_KEY || event.key === TOKEN_STORAGE_KEY) {
      emit(sessionListeners);
    }
    if (event.key === WATCHLIST_STORAGE_KEY) {
      emit(watchlistListeners);
    }
  });
}

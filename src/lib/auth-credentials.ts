import { DEMO_USERS, initialsFromName, type AuthResult, type AuthUser, type RegisterInput } from "@/types/auth";
import {
  createAuthToken,
  findAccount,
  persistSession,
  readAccounts,
  upsertAccount,
  type StoredAccount,
} from "@/lib/auth-storage";

export const DEMO_ADMIN_USERNAME = "admin";
export const DEMO_ADMIN_PASSWORD = "admin123";

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return toHex(new Uint8Array(digest));
}

function createSalt(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return toHex(bytes);
}

export async function hashPassword(password: string, salt: string): Promise<string> {
  return sha256(`${salt}:${password}`);
}

function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

export async function ensureSeedAccounts(): Promise<void> {
  const accounts = readAccounts();
  const hasAdmin = accounts.some((account) => account.user.username === DEMO_ADMIN_USERNAME);
  if (hasAdmin) {
    return;
  }

  const admin = DEMO_USERS.find((user) => user.role === "admin");
  if (!admin) {
    return;
  }

  const salt = createSalt();
  const passwordHash = await hashPassword(DEMO_ADMIN_PASSWORD, salt);
  upsertAccount({ user: admin, salt, passwordHash });
}

export async function authenticate(username: string, password: string): Promise<AuthUser | null> {
  await ensureSeedAccounts();
  const account = findAccount(normalizeUsername(username));
  if (!account) {
    return null;
  }

  const passwordHash = await hashPassword(password, account.salt);
  if (passwordHash !== account.passwordHash) {
    return null;
  }

  return account.user;
}

export async function registerAccount(input: RegisterInput): Promise<AuthResult & { user?: AuthUser }> {
  await ensureSeedAccounts();

  const name = normalizeName(input.name);
  const username = normalizeUsername(input.username);
  const password = input.password;

  if (name.length < 2) {
    return { ok: false, message: "Enter a display name of at least 2 characters." };
  }
  if (!/^[a-z0-9._-]{3,24}$/.test(username)) {
    return { ok: false, message: "Username must be 3–24 characters using letters, numbers, dots, dashes, or underscores." };
  }
  if (password.length < 6) {
    return { ok: false, message: "Password must be at least 6 characters." };
  }
  if (findAccount(username)) {
    return { ok: false, message: "That username is already taken." };
  }

  const user: AuthUser = {
    id: `acct_${username}`,
    username,
    name,
    email: `${username}@pulseboard.local`,
    role: "analyst",
    initials: initialsFromName(name),
  };
  const salt = createSalt();
  const passwordHash = await hashPassword(password, salt);
  const account: StoredAccount = { user, salt, passwordHash };
  upsertAccount(account);

  return { ok: true, user };
}

export function startSession(user: AuthUser): string {
  const token = createAuthToken(user.id);
  persistSession(user, token);
  return token;
}

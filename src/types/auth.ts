export type UserRole = "admin" | "analyst";

export type Permission = "export" | "create" | "delete";

export type AuthUser = {
  id: string;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  initials: string;
};

export type AuthSession = {
  user: AuthUser;
  token: string;
  issuedAt: string;
};

export type AuthResult = {
  ok: boolean;
  message?: string;
};

export type RegisterInput = {
  name: string;
  username: string;
  password: string;
};

export const DEMO_USERS: AuthUser[] = [
  {
    id: "admin",
    username: "admin",
    name: "Amina Okonkwo",
    email: "admin@pulseboard.local",
    role: "admin",
    initials: "AO",
  },
  {
    id: "analyst",
    username: "analyst",
    name: "Leo Park",
    email: "analyst@pulseboard.local",
    role: "analyst",
    initials: "LP",
  },
];

export function roleLabel(role: UserRole): string {
  return role === "admin" ? "Admin" : "Analyst";
}

export function hasPermission(user: AuthUser | null, permission: Permission): boolean {
  return Boolean(user) && (permission === "export" || permission === "create" || permission === "delete");
}

export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "U";
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
}

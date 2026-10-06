"use client";

import type { ReactNode } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import type { Permission } from "@/types/auth";

type ProtectedProps = {
  permission: Permission;
  children: ReactNode;
  fallback?: ReactNode;
};

export function Protected({ permission, children, fallback = null }: ProtectedProps) {
  const { isReady, can } = useAuth();

  if (!isReady || !can(permission)) {
    return fallback;
  }

  return children;
}

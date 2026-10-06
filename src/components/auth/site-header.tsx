"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/components/providers/auth-provider";
import { roleLabel } from "@/types/auth";

export function SiteHeader() {
  const { user, isReady, openDrawer, requestLogout } = useAuth();

  return (
    <div className="masthead-tools">
      {isReady && user ? (
        <>
          <button
            type="button"
            className="user-menu"
            onClick={openDrawer}
            aria-haspopup="dialog"
            aria-label={`Account menu, logged in as ${roleLabel(user.role)}`}
          >
            <span className={`user-avatar role-${user.role}`} aria-hidden="true">
              {user.initials}
            </span>
            <span className="user-menu-copy">
              <strong>{user.name}</strong>
            </span>
          </button>
          <button type="button" className="logout-button" onClick={requestLogout} aria-label="Log out">
            Log out
          </button>
        </>
      ) : (
        <button
          type="button"
          className="user-menu"
          onClick={openDrawer}
          aria-haspopup="dialog"
          aria-label="Open log in"
        >
          <span className="user-avatar guest" aria-hidden="true">
            ?
          </span>
          <span className="user-menu-copy">
            <strong>Guest</strong>
          </span>
        </button>
      )}
      <ThemeToggle />
    </div>
  );
}

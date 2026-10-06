"use client";

import { useEffect, useId, useRef } from "react";
import { useAuth } from "@/components/providers/auth-provider";

export function LogoutConfirm() {
  const { logoutConfirmOpen, cancelLogout, confirmLogout } = useAuth();
  const titleId = useId();
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!logoutConfirmOpen) {
      return;
    }

    const previous = document.activeElement;
    confirmRef.current?.focus();
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        cancelLogout();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", onKeyDown);
      if (previous instanceof HTMLElement) {
        previous.focus();
      }
    };
  }, [cancelLogout, logoutConfirmOpen]);

  return (
    <div
      className={`confirm-layer ${logoutConfirmOpen ? "open" : ""}`}
      aria-hidden={!logoutConfirmOpen}
      inert={!logoutConfirmOpen}
    >
      <div className="confirm-overlay" onClick={cancelLogout} />
      <div className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={`${titleId}-copy`}>
        <p className="eyebrow">Account</p>
        <h2 id={titleId}>Confirm Logout</h2>
        <p id={`${titleId}-copy`}>You will return to guest view and lose access to export and watchlist controls.</p>
        <div className="confirm-actions">
          <button type="button" className="dismiss-button" onClick={cancelLogout}>
            Cancel
          </button>
          <button ref={confirmRef} type="button" className="retry-button confirm-logout" onClick={confirmLogout}>
            Confirm Logout
          </button>
        </div>
      </div>
    </div>
  );
}

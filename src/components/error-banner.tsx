"use client";

import type { ErrorCopy } from "@/lib/request-error";

type ErrorBannerProps = {
  open: boolean;
  copy: ErrorCopy;
  isRetrying: boolean;
  onRetry: () => void;
  onDismiss: () => void;
};

export function ErrorBanner({ open, copy, isRetrying, onRetry, onDismiss }: ErrorBannerProps) {
  return (
    <aside
      className={`error-banner ${copy.tone} ${open ? "open" : ""}`}
      role="alert"
      aria-live="assertive"
      aria-hidden={!open}
      inert={!open}
    >
      <div className="error-banner-copy">
        <p className="error-banner-kicker">{copy.kicker}</p>
        <p className="error-banner-title">{copy.title}</p>
        <p className="error-banner-message">{copy.message}</p>
      </div>
      <div className="error-banner-actions">
        <button type="button" className="retry-button" onClick={onRetry} disabled={isRetrying || !open}>
          {isRetrying ? "Retrying…" : "Retry Request"}
        </button>
        <button type="button" className="dismiss-button" onClick={onDismiss} disabled={!open}>
          Dismiss
        </button>
      </div>
    </aside>
  );
}

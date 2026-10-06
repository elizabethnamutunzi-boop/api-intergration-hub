"use client";

import type { ErrorCopy } from "@/lib/request-error";

type ErrorFallbackProps = {
  copy: ErrorCopy;
  isRetrying: boolean;
  onRetry: () => void;
};

export function ErrorFallback({ copy, isRetrying, onRetry }: ErrorFallbackProps) {
  return (
    <section className={`error-fallback ${copy.tone}`} role="alert">
      <p className="error-banner-kicker">{copy.kicker}</p>
      <h2>{copy.title}</h2>
      <p>{copy.message}</p>
      <p className="error-fallback-hint">No cached snapshot is available. Retry without reloading the page.</p>
      <button type="button" className="retry-button" onClick={onRetry} disabled={isRetrying}>
        {isRetrying ? "Retrying…" : "Retry Request"}
      </button>
    </section>
  );
}

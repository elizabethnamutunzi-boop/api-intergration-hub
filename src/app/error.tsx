"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="empty-state" role="alert">
      <h2>Unable to render Pulseboard</h2>
      <p>{error.message || "An unexpected error occurred."}</p>
      <button type="button" className="retry-button" onClick={reset}>
        Try again
      </button>
    </section>
  );
}

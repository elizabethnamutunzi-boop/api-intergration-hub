"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <main className="shell">
          <section className="empty-state" role="alert">
            <h1>Something went wrong</h1>
            <p>{error.message || "The dashboard hit an unexpected error."}</p>
            <button type="button" className="retry-button" onClick={reset}>
              Reload
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}

type EmptyResultsProps = {
  query: string;
};

export function EmptyResults({ query }: EmptyResultsProps) {
  const hasQuery = query.trim().length > 0;

  return (
    <section className="empty-results" role="status" aria-live="polite">
      <span className="empty-results-mark" aria-hidden="true">
        /
      </span>
      <h2>No matching records</h2>
      <p>
        {hasQuery ? (
          <>
            Nothing matched <strong>“{query}”</strong> in live search or the current snapshot. Try a ticker like BTC or
            a name like Ethereum.
          </>
        ) : (
          <>The live snapshot came back empty. Retry the request or clear filters to try again.</>
        )}
      </p>
    </section>
  );
}

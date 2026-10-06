function Bone({ className }: { className: string }) {
  return <span className={`skeleton-bone ${className}`} />;
}

function StatSkeletonCard() {
  return (
    <article className="stat-card skeleton-card" aria-hidden="true">
      <Bone className="skeleton-label" />
      <Bone className="skeleton-stat-value" />
      <Bone className="skeleton-detail" />
    </article>
  );
}

function MarketSkeletonCard() {
  return (
    <article className="market-card skeleton-card" aria-hidden="true">
      <header className="card-head">
        <div className="identity">
          <Bone className="skeleton-avatar" />
          <div>
            <Bone className="skeleton-title" />
            <Bone className="skeleton-sub" />
          </div>
        </div>
        <Bone className="skeleton-spark" />
      </header>
      <Bone className="skeleton-price" />
      <div className="change-row">
        <Bone className="skeleton-pill" />
        <Bone className="skeleton-pill" />
        <Bone className="skeleton-pill" />
      </div>
      <dl className="metrics">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index}>
            <Bone className="skeleton-metric-label" />
            <Bone className="skeleton-metric-value" />
          </div>
        ))}
      </dl>
    </article>
  );
}

export function SearchResultsSkeleton() {
  return (
    <div className="market-grid" aria-busy="true" aria-live="polite">
      {Array.from({ length: 3 }).map((_, index) => (
        <MarketSkeletonCard key={index} />
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="dashboard-body" aria-busy="true" aria-live="polite">
      <div className="stats-grid">
        {Array.from({ length: 4 }).map((_, index) => (
          <StatSkeletonCard key={index} />
        ))}
      </div>
      <div className="market-grid">
        {Array.from({ length: 9 }).map((_, index) => (
          <MarketSkeletonCard key={index} />
        ))}
      </div>
    </div>
  );
}

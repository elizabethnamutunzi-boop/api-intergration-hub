import { DashboardSkeleton } from "@/components/skeleton-loaders";
import { SiteHeader } from "@/components/auth/site-header";

export default function Loading() {
  return (
    <main className="shell">
      <header className="hero">
        <div className="hero-top">
          <h1>Pulseboard</h1>
          <SiteHeader />
        </div>
        <p className="eyebrow">Live public API · CoinGecko</p>
        <p className="lede">Live snapshots of the top cryptocurrencies, refreshed every 30 seconds.</p>
        <nav className="nav-links hero-nav" aria-label="Dashboard sections">
          <a href="#prices">Prices</a>
          <a href="#volume">Volume</a>
          <a href="#watchlist">Watchlist</a>
        </nav>
      </header>
      <div className="dashboard">
        <div className="toolbar">
          <div className="search-wrap">
            <span className="skeleton-bone skeleton-search" />
          </div>
          <span className="skeleton-bone skeleton-freshness" />
        </div>
        <DashboardSkeleton />
      </div>
    </main>
  );
}

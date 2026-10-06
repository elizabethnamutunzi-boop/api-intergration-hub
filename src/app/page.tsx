import { DashboardErrorBoundary } from "@/components/error-boundary";
import { Dashboard } from "@/components/dashboard";
import { SiteHeader } from "@/components/auth/site-header";

export default function HomePage() {
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
      <DashboardErrorBoundary>
        <Dashboard />
      </DashboardErrorBoundary>
    </main>
  );
}

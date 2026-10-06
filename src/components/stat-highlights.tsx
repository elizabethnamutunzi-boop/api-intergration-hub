import { formatChange, formatUsd } from "@/lib/format";
import type { MarketAsset } from "@/types/markets";

type StatHighlightsProps = {
  assets: MarketAsset[];
};

function StatCard({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  tone?: "up" | "down" | "neutral";
}) {
  return (
    <article className={`stat-card ${tone ?? "neutral"}`}>
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value}</p>
      <p className="stat-detail">{detail}</p>
    </article>
  );
}

export function StatHighlights({ assets }: StatHighlightsProps) {
  const volume = assets.reduce((sum, asset) => sum + asset.volume, 0);
  const gainer = assets.reduce<MarketAsset | null>((best, asset) => {
    if (!best || asset.change24h > best.change24h) {
      return asset;
    }
    return best;
  }, null);
  const loser = assets.reduce<MarketAsset | null>((worst, asset) => {
    if (!worst || asset.change24h < worst.change24h) {
      return asset;
    }
    return worst;
  }, null);

  return (
    <section className="stats-grid" id="volume" aria-label="Market highlights">
      <StatCard label="Assets tracked" value={String(assets.length || 0)} detail="Top coins by market cap" />
      <StatCard label="24h volume" value={formatUsd(volume)} detail="Combined USD volume" />
      <StatCard
        label="Top gainer"
        value={gainer ? gainer.symbol : "N/A"}
        detail={gainer ? formatChange(gainer.change24h) : "No data"}
        tone="up"
      />
      <StatCard
        label="Top loser"
        value={loser ? loser.symbol : "N/A"}
        detail={loser ? formatChange(loser.change24h) : "No data"}
        tone="down"
      />
    </section>
  );
}

"use client";

import { memo } from "react";
import { formatChange } from "@/lib/format";
import type { MarketAsset } from "@/types/markets";
import { SparklineChart } from "@/components/sparkline-chart";
import { Protected } from "@/components/auth/protected";
import { useWatchlist } from "@/components/providers/watchlist-provider";

type MarketCardProps = {
  asset: MarketAsset;
  graphsPending?: boolean;
};

function ChangePill({ label, value }: { label: string; value: number }) {
  const tone = value >= 0 ? "up" : "down";
  return (
    <span className={`change-pill ${tone}`}>
      {label} {formatChange(value)}
    </span>
  );
}

function WatchlistActions({ id }: { id: string }) {
  const { has, add, remove } = useWatchlist();
  const saved = has(id);

  return (
    <div className="card-actions">
      {saved ? (
        <Protected permission="delete">
          <button type="button" className="ghost-button danger" onClick={() => remove(id)}>
            Remove from watchlist
          </button>
        </Protected>
      ) : (
        <Protected permission="create">
          <button type="button" className="ghost-button" onClick={() => add(id)}>
            Add to watchlist
          </button>
        </Protected>
      )}
    </div>
  );
}

export const MarketCard = memo(function MarketCard({ asset, graphsPending = false }: MarketCardProps) {
  const rising = asset.change24h >= 0;

  return (
    <article className="market-card" id={`asset-${asset.id}`}>
      <header className="card-head">
        <div className="identity">
          {asset.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={asset.imageUrl}
              alt=""
              width={36}
              height={36}
              className="asset-icon"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <span className="asset-fallback" aria-hidden="true">
              {asset.symbol.slice(0, 2)}
            </span>
          )}
          <div>
            <h3>{asset.name}</h3>
            <p className="symbol">
              {asset.rank > 0 ? `#${asset.rank}` : "N/A"} · {asset.symbol}
            </p>
          </div>
        </div>
        <SparklineChart path={asset.sparklinePath} rising={rising} waiting={graphsPending && !asset.sparklinePath} />
      </header>

      <div className="price-block">
        <p className="price">{asset.priceFormatted}</p>
        <div className="change-row" role="group" aria-label="Timeframe changes">
          <ChangePill label="1h" value={asset.change1h} />
          <ChangePill label="24h" value={asset.change24h} />
          <ChangePill label="7d" value={asset.change7d} />
        </div>
      </div>

      <dl className="metrics">
        <div>
          <dt>Market cap</dt>
          <dd>{asset.marketCapFormatted}</dd>
        </div>
        <div>
          <dt>Volume</dt>
          <dd>{asset.volumeFormatted}</dd>
        </div>
        <div>
          <dt>24h high</dt>
          <dd>{asset.high24hFormatted}</dd>
        </div>
        <div>
          <dt>24h low</dt>
          <dd>{asset.low24hFormatted}</dd>
        </div>
      </dl>

      <WatchlistActions id={asset.id} />
    </article>
  );
});

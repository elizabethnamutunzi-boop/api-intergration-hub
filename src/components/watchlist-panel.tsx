"use client";

import { Protected } from "@/components/auth/protected";
import { useAuth } from "@/components/providers/auth-provider";
import { useWatchlist } from "@/components/providers/watchlist-provider";
import type { MarketAsset } from "@/types/markets";

type WatchlistPanelProps = {
  assets: MarketAsset[];
};

export function WatchlistPanel({ assets }: WatchlistPanelProps) {
  const { user } = useAuth();
  const { ids, remove, clear } = useWatchlist();
  const items = ids
    .map((id) => assets.find((asset) => asset.id === id))
    .filter((asset): asset is MarketAsset => Boolean(asset));

  if (!user || ids.length === 0) {
    return null;
  }

  return (
    <section className="watchlist-panel" aria-label="Watchlist">
      <div className="watchlist-head">
        <h2>Watchlist</h2>
        {user.role === "admin" ? (
          <button type="button" className="ghost-button danger" onClick={clear}>
            Delete all
          </button>
        ) : null}
      </div>
      <ul className="watchlist-chips">
        {items.map((asset) => (
          <li key={asset.id}>
            <a href={`#asset-${asset.id}`}>
              {asset.symbol}
              <span>{asset.priceFormatted}</span>
            </a>
            <Protected permission="delete">
              <button type="button" className="chip-delete" onClick={() => remove(asset.id)} aria-label={`Remove ${asset.name}`}>
                Remove
              </button>
            </Protected>
          </li>
        ))}
      </ul>
      {items.length === 0 ? <p className="watchlist-empty">Saved assets are not in the current snapshot.</p> : null}
    </section>
  );
}

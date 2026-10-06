import type { MarketAsset, RawMarketCoin } from "@/types/markets";
import {
  formatLocalTimestamp,
  formatUsd,
  sanitizeText,
  sanitizeUrl,
  toNumber,
} from "@/lib/format";
import { buildSparklinePath, downsampleSparkline } from "@/lib/sparkline";

export function toMarketAsset(raw: RawMarketCoin): MarketAsset {
  const lastUpdatedIso = raw.last_updated ?? new Date().toISOString();
  const change24h = toNumber(
    raw.price_change_percentage_24h_in_currency ?? raw.price_change_percentage_24h,
  );
  const sparkline = downsampleSparkline(raw.sparkline_in_7d?.price ?? []);

  return {
    id: sanitizeText(raw.id, "unknown"),
    symbol: sanitizeText(raw.symbol, "n/a").toUpperCase(),
    name: sanitizeText(raw.name),
    imageUrl: sanitizeUrl(raw.image),
    rank: Math.max(0, Math.round(toNumber(raw.market_cap_rank))),
    priceUsd: toNumber(raw.current_price),
    priceFormatted: formatUsd(toNumber(raw.current_price)),
    marketCap: toNumber(raw.market_cap),
    marketCapFormatted: formatUsd(toNumber(raw.market_cap)),
    volume: toNumber(raw.total_volume),
    volumeFormatted: formatUsd(toNumber(raw.total_volume)),
    high24hFormatted: formatUsd(toNumber(raw.high_24h)),
    low24hFormatted: formatUsd(toNumber(raw.low_24h)),
    change1h: toNumber(raw.price_change_percentage_1h_in_currency),
    change24h,
    change7d: toNumber(raw.price_change_percentage_7d_in_currency),
    sparkline,
    sparklinePath: buildSparklinePath(sparkline),
    lastUpdatedIso,
    lastUpdatedLabel: formatLocalTimestamp(lastUpdatedIso),
  };
}

export function toMarketAssets(rawCoins: RawMarketCoin[]): MarketAsset[] {
  return rawCoins.map(toMarketAsset);
}

import { formatLocalTimestamp, sanitizeText, sanitizeUrl, toNumber } from "@/lib/format";
import type { MarketAsset } from "@/types/markets";

type RawSearchCoin = {
  id: string;
  name?: string | null;
  symbol?: string | null;
  market_cap_rank?: number | null;
  thumb?: string | null;
  large?: string | null;
};

export function fromSearchCoin(raw: RawSearchCoin, fetchedAt: string): MarketAsset {
  return {
    id: sanitizeText(raw.id, "unknown"),
    symbol: sanitizeText(raw.symbol, "n/a").toUpperCase(),
    name: sanitizeText(raw.name),
    imageUrl: sanitizeUrl(raw.large ?? raw.thumb),
    rank: Math.max(0, Math.round(toNumber(raw.market_cap_rank))),
    priceUsd: 0,
    priceFormatted: "N/A",
    marketCap: 0,
    marketCapFormatted: "N/A",
    volume: 0,
    volumeFormatted: "N/A",
    high24hFormatted: "N/A",
    low24hFormatted: "N/A",
    change1h: 0,
    change24h: 0,
    change7d: 0,
    sparkline: [],
    sparklinePath: "",
    lastUpdatedIso: fetchedAt,
    lastUpdatedLabel: formatLocalTimestamp(fetchedAt),
  };
}

import { formatLocalTimestamp, formatUsd, sanitizeText, toNumber } from "@/lib/format";
import { displayNameForPair, rankForPair } from "@/lib/schemas/binance";
import { buildSparklinePath } from "@/lib/sparkline";
import type { MarketAsset } from "@/types/markets";

type BinanceTicker = {
  symbol: string;
  lastPrice: string;
  priceChangePercent: string;
  highPrice: string;
  lowPrice: string;
  quoteVolume: string;
};

export function fromBinanceTicker(ticker: BinanceTicker, fetchedAt: string): MarketAsset {
  const price = toNumber(Number.parseFloat(ticker.lastPrice));
  const change24h = toNumber(Number.parseFloat(ticker.priceChangePercent));
  const high = toNumber(Number.parseFloat(ticker.highPrice));
  const low = toNumber(Number.parseFloat(ticker.lowPrice));
  const volume = toNumber(Number.parseFloat(ticker.quoteVolume));
  const symbol = sanitizeText(ticker.symbol.replace(/USDT$/, ""), "N/A");

  return {
    id: sanitizeText(ticker.symbol, "unknown").toLowerCase(),
    symbol,
    name: displayNameForPair(ticker.symbol),
    imageUrl: "",
    rank: rankForPair(ticker.symbol),
    priceUsd: price,
    priceFormatted: formatUsd(price),
    marketCap: 0,
    marketCapFormatted: "N/A",
    volume,
    volumeFormatted: formatUsd(volume),
    high24hFormatted: formatUsd(high),
    low24hFormatted: formatUsd(low),
    change1h: 0,
    change24h,
    change7d: 0,
    sparkline: [low, price, high],
    sparklinePath: buildSparklinePath([low, price, high]),
    lastUpdatedIso: fetchedAt,
    lastUpdatedLabel: formatLocalTimestamp(fetchedAt),
  };
}

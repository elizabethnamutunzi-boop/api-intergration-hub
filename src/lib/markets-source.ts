import { MemoryCache } from "@/lib/cache";
import { coinGeckoBaseUrl, coinGeckoHeaders, publicApiHeaders } from "@/lib/coingecko";
import { fetchWithRetry, readUpstreamJson, UpstreamError } from "@/lib/fetch-with-retry";
import { formatLocalTimestamp, formatUsd, sanitizeText, toNumber } from "@/lib/format";
import { binanceTickersSchema, binanceTickersUrl, isTrackedPair } from "@/lib/schemas/binance";
import { rawMarketsResponseSchema } from "@/lib/schemas/markets";
import { buildSparklinePath, downsampleSparkline } from "@/lib/sparkline";
import { fromBinanceTicker } from "@/lib/transformers/binance";
import { toMarketAssets } from "@/lib/transformers/markets";
import type { MarketsPayload, SparklinesPayload } from "@/types/markets";
import { z } from "zod";

const MARKETS_KEY = "usd-markets";
const SPARKLINES_KEY = "usd-sparklines";
const marketsCache = new MemoryCache<MarketsPayload>(20_000);
const sparklinesCache = new MemoryCache<SparklinesPayload>(45_000);

const inflight = {
  markets: null as Promise<MarketsPayload> | null,
  sparklines: null as Promise<SparklinesPayload> | null,
};

export const marketsCacheHeaders = {
  "Cache-Control": "public, s-maxage=20, stale-while-revalidate=40",
};

export const sparklinesCacheHeaders = {
  "Cache-Control": "public, s-maxage=45, stale-while-revalidate=90",
};

export function getFreshMarkets(): MarketsPayload | undefined {
  return marketsCache.get(MARKETS_KEY);
}

export function getStaleMarkets(): MarketsPayload | undefined {
  return marketsCache.peek(MARKETS_KEY, 40_000);
}

export function getFreshSparklines(): SparklinesPayload | undefined {
  return sparklinesCache.get(SPARKLINES_KEY);
}

export function getStaleSparklines(): SparklinesPayload | undefined {
  return sparklinesCache.peek(SPARKLINES_KEY, 90_000);
}

function marketsEndpoint(sparkline: boolean): string {
  const endpoint = new URL(`${coinGeckoBaseUrl()}/coins/markets`);
  endpoint.searchParams.set("vs_currency", "usd");
  endpoint.searchParams.set("order", "market_cap_desc");
  endpoint.searchParams.set("per_page", "48");
  endpoint.searchParams.set("page", "1");
  endpoint.searchParams.set("sparkline", sparkline ? "true" : "false");
  endpoint.searchParams.set("price_change_percentage", "1h,24h,7d");
  return endpoint.toString();
}

async function fetchCoinGeckoMarkets(sparkline: boolean) {
  const response = await fetchWithRetry(
    marketsEndpoint(sparkline),
    {
      headers: coinGeckoHeaders(),
    },
    { attempts: 1, timeoutMs: 3500 },
  );
  const json = await readUpstreamJson(response);
  const parsed = rawMarketsResponseSchema.safeParse(json);

  if (!parsed.success) {
    throw new UpstreamError("Upstream payload failed validation and was rejected.", 502, "VALIDATION_ERROR");
  }

  return parsed.data;
}

async function fetchBinanceFrom(url: string): Promise<MarketsPayload> {
  const response = await fetchWithRetry(
    url,
    { headers: publicApiHeaders() },
    { attempts: 1, timeoutMs: 3500 },
  );
  const json = await readUpstreamJson(response);
  const parsed = binanceTickersSchema.safeParse(json);

  if (!parsed.success) {
    throw new UpstreamError("Fallback payload failed validation.", 502, "VALIDATION_ERROR");
  }

  const fetchedAt = new Date().toISOString();
  const assets = parsed.data
    .filter((ticker) => isTrackedPair(ticker.symbol))
    .map((ticker) => fromBinanceTicker(ticker, fetchedAt))
    .sort((left, right) => left.rank - right.rank);

  if (assets.length === 0) {
    throw new UpstreamError("Fallback payload did not include tracked markets.", 502, "VALIDATION_ERROR");
  }

  return {
    assets,
    fetchedAt,
    source: "live",
    count: assets.length,
  };
}

const coinloreTickerSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  name: z.string(),
  rank: z.union([z.number(), z.string()]),
  price_usd: z.union([z.number(), z.string()]),
  market_cap_usd: z.union([z.number(), z.string()]).optional(),
  volume24: z.union([z.number(), z.string()]).optional(),
  percent_change_1h: z.union([z.number(), z.string()]).optional(),
  percent_change_24h: z.union([z.number(), z.string()]).optional(),
  percent_change_7d: z.union([z.number(), z.string()]).optional(),
});

const coinloreResponseSchema = z.object({
  data: z.array(coinloreTickerSchema),
});

async function fetchCoinloreFallback(): Promise<MarketsPayload> {
  const response = await fetchWithRetry(
    "https://api.coinlore.net/api/tickers/?start=0&limit=48",
    { headers: publicApiHeaders() },
    { attempts: 1, timeoutMs: 3500 },
  );
  const json = await readUpstreamJson(response);
  const parsed = coinloreResponseSchema.safeParse(json);

  if (!parsed.success) {
    throw new UpstreamError("Secondary fallback payload failed validation.", 502, "VALIDATION_ERROR");
  }

  const fetchedAt = new Date().toISOString();
  const assets = parsed.data.data.map((ticker) => {
    const price = toNumber(Number.parseFloat(String(ticker.price_usd)));
    const marketCap = toNumber(Number.parseFloat(String(ticker.market_cap_usd ?? 0)));
    const volume = toNumber(Number.parseFloat(String(ticker.volume24 ?? 0)));
    const change1h = toNumber(Number.parseFloat(String(ticker.percent_change_1h ?? 0)));
    const change24h = toNumber(Number.parseFloat(String(ticker.percent_change_24h ?? 0)));
    const change7d = toNumber(Number.parseFloat(String(ticker.percent_change_7d ?? 0)));
    const rank = Math.max(0, Math.round(toNumber(Number.parseFloat(String(ticker.rank)))));

    return {
      id: sanitizeText(ticker.id, "unknown"),
      symbol: sanitizeText(ticker.symbol, "n/a").toUpperCase(),
      name: sanitizeText(ticker.name),
      imageUrl: "",
      rank,
      priceUsd: price,
      priceFormatted: formatUsd(price),
      marketCap,
      marketCapFormatted: formatUsd(marketCap),
      volume,
      volumeFormatted: formatUsd(volume),
      high24hFormatted: "N/A",
      low24hFormatted: "N/A",
      change1h,
      change24h,
      change7d,
      sparkline: [price],
      sparklinePath: buildSparklinePath([price]),
      lastUpdatedIso: fetchedAt,
      lastUpdatedLabel: formatLocalTimestamp(fetchedAt),
    };
  });

  if (assets.length === 0) {
    throw new UpstreamError("Secondary fallback returned no markets.", 502, "VALIDATION_ERROR");
  }

  return {
    assets,
    fetchedAt,
    source: "live",
    count: assets.length,
  };
}

async function fetchCoinGeckoPayload(): Promise<MarketsPayload> {
  const raw = await fetchCoinGeckoMarkets(false);
  return {
    assets: toMarketAssets(raw),
    fetchedAt: new Date().toISOString(),
    source: "live",
    count: raw.length,
  };
}

async function fetchLiveMarkets(): Promise<MarketsPayload> {
  try {
    return await Promise.any([
      fetchCoinloreFallback(),
      fetchBinanceFrom(binanceTickersUrl("https://api.binance.us/api/v3/ticker/24hr")),
      fetchBinanceFrom(binanceTickersUrl("https://data-api.binance.vision/api/v3/ticker/24hr")),
      fetchCoinGeckoPayload(),
    ]);
  } catch (error) {
    if (error instanceof AggregateError) {
      throw error.errors[0] instanceof Error
        ? error.errors[0]
        : new UpstreamError("All market sources failed.", 502, "UPSTREAM_ERROR");
    }
    throw error;
  }
}

export async function loadMarketsPayload(): Promise<MarketsPayload> {
  const fresh = marketsCache.get(MARKETS_KEY);
  if (fresh) {
    return { ...fresh, source: "cache" };
  }

  if (inflight.markets) {
    return inflight.markets;
  }

  inflight.markets = (async () => {
    try {
      const payload = await fetchLiveMarkets();
      marketsCache.set(MARKETS_KEY, payload);
      return payload;
    } catch (error) {
      const stale = marketsCache.peek(MARKETS_KEY, 60_000);
      if (stale) {
        return { ...stale, source: "cache" };
      }
      throw error;
    } finally {
      inflight.markets = null;
    }
  })();

  return inflight.markets;
}

export async function loadSparklinesPayload(): Promise<SparklinesPayload> {
  const fresh = sparklinesCache.get(SPARKLINES_KEY);
  if (fresh) {
    return { ...fresh, source: "cache" };
  }

  if (inflight.sparklines) {
    return inflight.sparklines;
  }

  inflight.sparklines = (async () => {
    try {
      const raw = await fetchCoinGeckoMarkets(true);
      const paths: Record<string, string> = {};

      for (const coin of raw) {
        const path = buildSparklinePath(downsampleSparkline(coin.sparkline_in_7d?.price ?? []));
        if (path) {
          paths[coin.id] = path;
        }
      }

      const payload: SparklinesPayload = {
        paths,
        fetchedAt: new Date().toISOString(),
        source: "live",
      };
      sparklinesCache.set(SPARKLINES_KEY, payload);

      const markets = marketsCache.get(MARKETS_KEY) ?? marketsCache.peek(MARKETS_KEY, 40_000);
      if (markets) {
        marketsCache.set(MARKETS_KEY, {
          ...markets,
          assets: markets.assets.map((asset) => {
            const path = paths[asset.id];
            return path && path !== asset.sparklinePath ? { ...asset, sparklinePath: path } : asset;
          }),
        });
      }

      return payload;
    } catch (error) {
      const stale = sparklinesCache.peek(SPARKLINES_KEY, 120_000);
      if (stale) {
        return { ...stale, source: "cache" };
      }
      throw error;
    } finally {
      inflight.sparklines = null;
    }
  })();

  return inflight.sparklines;
}

export function warmSparklines(): void {
  void loadSparklinesPayload().catch(() => undefined);
}

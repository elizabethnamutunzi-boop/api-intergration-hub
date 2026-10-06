import { MemoryCache } from "@/lib/cache";
import { coinGeckoBaseUrl, coinGeckoHeaders } from "@/lib/coingecko";
import { fetchWithRetry, UpstreamError } from "@/lib/fetch-with-retry";
import { binanceTickersSchema, isTrackedPair } from "@/lib/schemas/binance";
import { rawMarketsResponseSchema } from "@/lib/schemas/markets";
import { buildSparklinePath, downsampleSparkline } from "@/lib/sparkline";
import { fromBinanceTicker } from "@/lib/transformers/binance";
import { toMarketAssets } from "@/lib/transformers/markets";
import type { MarketsPayload, SparklinesPayload } from "@/types/markets";

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
      next: { revalidate: sparkline ? 45 : 20 },
    },
    { attempts: 2, timeoutMs: sparkline ? 7000 : 4500 },
  );
  const json: unknown = await response.json();
  const parsed = rawMarketsResponseSchema.safeParse(json);

  if (!parsed.success) {
    throw new UpstreamError("Upstream payload failed validation and was rejected.", 502, "VALIDATION_ERROR");
  }

  return parsed.data;
}

async function fetchBinanceFallback(): Promise<MarketsPayload> {
  const response = await fetchWithRetry(
    "https://api.binance.com/api/v3/ticker/24hr",
    { headers: { Accept: "application/json" }, next: { revalidate: 20 } },
    { attempts: 2, timeoutMs: 5000 },
  );
  const json: unknown = await response.json();
  const parsed = binanceTickersSchema.safeParse(json);

  if (!parsed.success) {
    throw new UpstreamError("Fallback payload failed validation.", 502, "VALIDATION_ERROR");
  }

  const fetchedAt = new Date().toISOString();
  const assets = parsed.data
    .filter((ticker) => isTrackedPair(ticker.symbol))
    .map((ticker) => fromBinanceTicker(ticker, fetchedAt))
    .sort((left, right) => left.rank - right.rank);

  return {
    assets,
    fetchedAt,
    source: "live",
    count: assets.length,
  };
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
      const raw = await fetchCoinGeckoMarkets(false);
      const payload: MarketsPayload = {
        assets: toMarketAssets(raw),
        fetchedAt: new Date().toISOString(),
        source: "live",
        count: raw.length,
      };
      marketsCache.set(MARKETS_KEY, payload);
      return payload;
    } catch (error) {
      const stale = marketsCache.peek(MARKETS_KEY, 60_000);
      if (stale) {
        return { ...stale, source: "cache" };
      }

      try {
        const fallback = await fetchBinanceFallback();
        marketsCache.set(MARKETS_KEY, fallback);
        return fallback;
      } catch {
        throw error;
      }
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

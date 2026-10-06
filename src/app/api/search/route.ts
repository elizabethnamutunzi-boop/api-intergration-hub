import { NextResponse } from "next/server";
import { isRateLimited, MemoryCache } from "@/lib/cache";
import { coinGeckoBaseUrl, coinGeckoHeaders, publicApiHeaders } from "@/lib/coingecko";
import { fetchWithRetry, readUpstreamJson, UpstreamError } from "@/lib/fetch-with-retry";
import { normalizeSearchQuery } from "@/lib/search";
import { BINANCE_TICKER_URLS, binanceTickersSchema, pairMatchesQuery } from "@/lib/schemas/binance";
import { rawMarketsResponseSchema } from "@/lib/schemas/markets";
import { rawSearchResponseSchema } from "@/lib/schemas/search";
import { fromBinanceTicker } from "@/lib/transformers/binance";
import { toMarketAssets } from "@/lib/transformers/markets";
import { fromSearchCoin } from "@/lib/transformers/search";
import type { ApiErrorBody, MarketsPayload } from "@/types/markets";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 20;

type SearchPayload = MarketsPayload & { query: string };

const searchCache = new MemoryCache<SearchPayload>(30_000);

function errorResponse(status: number, body: ApiErrorBody): NextResponse<ApiErrorBody> {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function GET(request: Request): Promise<NextResponse<SearchPayload | ApiErrorBody>> {
  const query = normalizeSearchQuery(new URL(request.url).searchParams.get("q") ?? "");

  if (!query) {
    return errorResponse(400, {
      error: {
        code: "VALIDATION_ERROR",
        message: "Enter a name or ticker to search.",
      },
    });
  }

  if (query.length > 64) {
    return errorResponse(400, {
      error: {
        code: "VALIDATION_ERROR",
        message: "Search queries must be 64 characters or fewer.",
      },
    });
  }

  const cacheKey = query.toLowerCase();
  if (isRateLimited()) {
    const cached = searchCache.get(cacheKey);
    if (cached) {
      return NextResponse.json({ ...cached, source: "cache" });
    }

    return errorResponse(429, {
      error: {
        code: "RATE_LIMITED",
        message: "Too many search requests. Please wait a moment and try again.",
      },
    });
  }

  const cached = searchCache.get(cacheKey);
  if (cached) {
    return NextResponse.json({ ...cached, source: "cache" });
  }

  try {
    const payload = await searchCoinGecko(query);
    searchCache.set(cacheKey, payload);
    return NextResponse.json(payload, {
      headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
    });
  } catch (error) {
    try {
      const fallback = await searchBinance(query);
      searchCache.set(cacheKey, fallback);
      return NextResponse.json(fallback, {
        headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
      });
    } catch {
      if (error instanceof UpstreamError) {
        const status =
          error.status === 429
            ? 429
            : error.status === 404 || error.code === "NOT_FOUND"
              ? 404
              : error.code === "TIMEOUT"
                ? 504
                : 502;
        return errorResponse(status, {
          error: {
            code: status === 404 ? "NOT_FOUND" : error.code,
            message: error.message,
          },
        });
      }

      return errorResponse(500, {
        error: {
          code: "UNKNOWN",
          message: "An unexpected error occurred while searching markets.",
        },
      });
    }
  }
}

async function searchCoinGecko(query: string): Promise<SearchPayload> {
  const baseUrl = coinGeckoBaseUrl();
  const headers = coinGeckoHeaders();
  const searchUrl = new URL(`${baseUrl}/search`);
  searchUrl.searchParams.set("query", query);

  const searchResponse = await fetchWithRetry(searchUrl.toString(), { headers }, { attempts: 3, timeoutMs: 8000 });
  const searchJson = await readUpstreamJson(searchResponse);
  const parsedSearch = rawSearchResponseSchema.safeParse(searchJson);

  if (!parsedSearch.success) {
    throw new UpstreamError("Search payload failed validation.", 502, "VALIDATION_ERROR");
  }

  const fetchedAt = new Date().toISOString();
  const coins = parsedSearch.data.coins.slice(0, 12);

  if (coins.length === 0) {
    return { assets: [], fetchedAt, source: "live", count: 0, query };
  }

  const marketsUrl = new URL(`${baseUrl}/coins/markets`);
  marketsUrl.searchParams.set("vs_currency", "usd");
  marketsUrl.searchParams.set("ids", coins.map((coin) => coin.id).join(","));
  marketsUrl.searchParams.set("sparkline", "false");
  marketsUrl.searchParams.set("price_change_percentage", "1h,24h,7d");

  try {
    const marketsResponse = await fetchWithRetry(marketsUrl.toString(), { headers }, { attempts: 3, timeoutMs: 8000 });
    const marketsJson = await readUpstreamJson(marketsResponse);
    const parsedMarkets = rawMarketsResponseSchema.safeParse(marketsJson);

    if (parsedMarkets.success && parsedMarkets.data.length > 0) {
      const assets = toMarketAssets(parsedMarkets.data);
      return { assets, fetchedAt, source: "live", count: assets.length, query };
    }
  } catch {
    // Fall through to lightweight search hits so the user still gets results.
  }

  const assets = coins.map((coin) => fromSearchCoin(coin, fetchedAt));
  return { assets, fetchedAt, source: "live", count: assets.length, query };
}

async function searchBinance(query: string): Promise<SearchPayload> {
  let lastError: unknown;

  for (const url of BINANCE_TICKER_URLS) {
    try {
      const response = await fetchWithRetry(
        url,
        { headers: publicApiHeaders() },
        { attempts: 2, timeoutMs: 8000 },
      );
      const json = await readUpstreamJson(response);
      const parsed = binanceTickersSchema.safeParse(json);

      if (!parsed.success) {
        throw new UpstreamError("Fallback search payload failed validation.", 502, "VALIDATION_ERROR");
      }

      const fetchedAt = new Date().toISOString();
      const assets = parsed.data
        .filter((ticker) => pairMatchesQuery(ticker.symbol, query))
        .slice(0, 12)
        .map((ticker) => fromBinanceTicker(ticker, fetchedAt));

      return { assets, fetchedAt, source: "live", count: assets.length, query };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new UpstreamError("Fallback search is unavailable.", 502, "UPSTREAM_ERROR");
}

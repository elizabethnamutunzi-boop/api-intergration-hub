import { NextResponse } from "next/server";
import { isRateLimited } from "@/lib/cache";
import {
  getFreshMarkets,
  getStaleMarkets,
  loadMarketsPayload,
  marketsCacheHeaders,
  warmSparklines,
} from "@/lib/markets-source";
import { UpstreamError } from "@/lib/fetch-with-retry";
import type { ApiErrorBody, MarketsPayload } from "@/types/markets";

function errorResponse(status: number, body: ApiErrorBody): NextResponse<ApiErrorBody> {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

function cachedResponse(payload: MarketsPayload): NextResponse<MarketsPayload> {
  return NextResponse.json(
    { ...payload, source: "cache" },
    { headers: marketsCacheHeaders },
  );
}

export async function GET(): Promise<NextResponse<MarketsPayload | ApiErrorBody>> {
  const fresh = getFreshMarkets();
  if (fresh) {
    warmSparklines();
    return cachedResponse(fresh);
  }

  const stale = getStaleMarkets();
  if (stale) {
    void loadMarketsPayload().catch(() => undefined);
    warmSparklines();
    return cachedResponse(stale);
  }

  if (isRateLimited()) {
    return errorResponse(429, {
      error: {
        code: "RATE_LIMITED",
        message: "Too many requests. Please wait a moment and try again.",
      },
    });
  }

  try {
    const payload = await loadMarketsPayload();
    warmSparklines();
    return NextResponse.json(payload, { headers: marketsCacheHeaders });
  } catch (error) {
    if (error instanceof UpstreamError) {
      const status =
        error.status === 429
          ? 429
          : error.status === 404 || error.code === "NOT_FOUND"
            ? 404
            : error.code === "TIMEOUT"
              ? 504
              : 502;
      const code = status === 404 ? "NOT_FOUND" : error.code;
      return errorResponse(status, {
        error: {
          code,
          message: error.message,
        },
      });
    }

    return errorResponse(500, {
      error: {
        code: "UNKNOWN",
        message: "An unexpected error occurred while fetching market data.",
      },
    });
  }
}

import { NextResponse } from "next/server";
import { isRateLimited } from "@/lib/cache";
import {
  getFreshSparklines,
  getStaleSparklines,
  loadSparklinesPayload,
  sparklinesCacheHeaders,
} from "@/lib/markets-source";
import { UpstreamError } from "@/lib/fetch-with-retry";
import type { ApiErrorBody, SparklinesPayload } from "@/types/markets";

function errorResponse(status: number, body: ApiErrorBody): NextResponse<ApiErrorBody> {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

function cachedResponse(payload: SparklinesPayload): NextResponse<SparklinesPayload> {
  return NextResponse.json(
    { ...payload, source: "cache" },
    { headers: sparklinesCacheHeaders },
  );
}

export async function GET(): Promise<NextResponse<SparklinesPayload | ApiErrorBody>> {
  const fresh = getFreshSparklines();
  if (fresh) {
    return cachedResponse(fresh);
  }

  const stale = getStaleSparklines();
  if (stale) {
    void loadSparklinesPayload().catch(() => undefined);
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
    const payload = await loadSparklinesPayload();
    return NextResponse.json(payload, { headers: sparklinesCacheHeaders });
  } catch (error) {
    if (error instanceof UpstreamError) {
      const status = error.status === 429 ? 429 : error.code === "TIMEOUT" ? 504 : 502;
      return errorResponse(status, {
        error: {
          code: error.code,
          message: error.message,
        },
      });
    }

    return errorResponse(500, {
      error: {
        code: "UNKNOWN",
        message: "Unable to load sparkline data.",
      },
    });
  }
}

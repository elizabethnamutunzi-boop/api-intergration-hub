"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { attachSparklinePaths, useSparklinePaths } from "@/hooks/use-sparklines";
import { codeFromStatus, MarketsRequestError } from "@/lib/request-error";
import { marketsPayloadSchema } from "@/lib/schemas/markets";
import type { ApiErrorBody, ApiErrorCode, MarketsPayload } from "@/types/markets";

async function fetchMarkets(): Promise<MarketsPayload> {
  let response: Response;

  try {
    response = await fetch("/api/markets");
  } catch {
    throw new MarketsRequestError("The network request failed. Check your connection and retry.", "UNKNOWN", 0);
  }

  let json: unknown;
  try {
    const text = await response.text();
    json = text ? JSON.parse(text) : null;
  } catch {
    throw new MarketsRequestError(
      "The market API failed before it could send data. Retry in a moment.",
      "UPSTREAM_ERROR",
      response.status || 502,
    );
  }

  if (!response.ok) {
    const body = json as ApiErrorBody;
    const code: ApiErrorCode = body.error?.code ?? codeFromStatus(response.status);
    throw new MarketsRequestError(
      body.error?.message ?? "Unable to load market data.",
      code,
      response.status,
    );
  }

  const parsed = marketsPayloadSchema.safeParse(json);
  if (!parsed.success) {
    throw new MarketsRequestError("Market payload failed client-side validation.", "VALIDATION_ERROR", 502);
  }

  return parsed.data;
}

export function useMarkets() {
  const markets = useQuery({
    queryKey: ["markets"],
    queryFn: fetchMarkets,
    refetchInterval: 30_000,
    staleTime: 20_000,
    placeholderData: keepPreviousData,
    retry: 3,
    retryDelay: (attempt) => Math.min(400 * 2 ** attempt + Math.random() * 250, 4000),
  });
  const sparklines = useSparklinePaths();
  const data = attachSparklinePaths(markets.data, sparklines.data?.paths);

  return {
    ...markets,
    data,
    graphsPending: sparklines.isPending || (sparklines.isFetching && !sparklines.data),
  };
}

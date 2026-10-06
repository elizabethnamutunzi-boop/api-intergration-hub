"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { attachSparklinePaths, useSparklinePaths } from "@/hooks/use-sparklines";
import { codeFromStatus, MarketsRequestError } from "@/lib/request-error";
import { searchPayloadSchema } from "@/lib/schemas/search";
import { normalizeSearchQuery } from "@/lib/search";
import type { ApiErrorBody, ApiErrorCode, MarketsPayload } from "@/types/markets";

export type SearchPayload = MarketsPayload & { query: string };

async function fetchSearch(query: string): Promise<SearchPayload> {
  let response: Response;

  try {
    response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
  } catch {
    throw new MarketsRequestError("The search request failed. Check your connection and retry.", "UNKNOWN", 0);
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    throw new MarketsRequestError("The search API returned an unreadable response.", "UPSTREAM_ERROR", response.status);
  }

  if (!response.ok) {
    const body = json as ApiErrorBody;
    const code: ApiErrorCode = body.error?.code ?? codeFromStatus(response.status);
    throw new MarketsRequestError(body.error?.message ?? "Unable to search markets.", code, response.status);
  }

  const parsed = searchPayloadSchema.safeParse(json);
  if (!parsed.success) {
    throw new MarketsRequestError("Search payload failed client-side validation.", "VALIDATION_ERROR", 502);
  }

  return parsed.data;
}

export function useMarketSearch(query: string) {
  const normalized = normalizeSearchQuery(query);
  const sparklines = useSparklinePaths();

  const search = useQuery({
    queryKey: ["market-search", normalized.toLowerCase()],
    queryFn: () => fetchSearch(normalized),
    enabled: normalized.length > 0,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    retry: 2,
    retryDelay: (attempt) => Math.min(400 * 2 ** attempt + Math.random() * 250, 4000),
  });

  return {
    ...search,
    data: attachSparklinePaths(search.data, sparklines.data?.paths),
  };
}

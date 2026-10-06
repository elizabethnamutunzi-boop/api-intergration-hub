"use client";

import { useQuery } from "@tanstack/react-query";
import { codeFromStatus, MarketsRequestError } from "@/lib/request-error";
import { sparklinesPayloadSchema } from "@/lib/schemas/markets";
import type { ApiErrorBody, ApiErrorCode, MarketAsset, SparklinesPayload } from "@/types/markets";

async function fetchSparklines(): Promise<SparklinesPayload> {
  let response: Response;

  try {
    response = await fetch("/api/sparklines");
  } catch {
    throw new MarketsRequestError("The sparkline request failed. Check your connection and retry.", "UNKNOWN", 0);
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    throw new MarketsRequestError("Sparkline data was unreadable.", "UPSTREAM_ERROR", response.status);
  }

  if (!response.ok) {
    const body = json as ApiErrorBody;
    const code: ApiErrorCode = body.error?.code ?? codeFromStatus(response.status);
    throw new MarketsRequestError(body.error?.message ?? "Unable to load graph lines.", code, response.status);
  }

  const parsed = sparklinesPayloadSchema.safeParse(json);
  if (!parsed.success) {
    throw new MarketsRequestError("Sparkline payload failed client-side validation.", "VALIDATION_ERROR", 502);
  }

  return parsed.data;
}

export function useSparklinePaths() {
  return useQuery({
    queryKey: ["sparklines"],
    queryFn: fetchSparklines,
    staleTime: 45_000,
    refetchInterval: 45_000,
    retry: 2,
    retryDelay: (attempt) => Math.min(400 * 2 ** attempt + Math.random() * 250, 4000),
  });
}

export function attachSparklinePaths<T extends { assets: MarketAsset[] }>(
  payload: T | undefined,
  paths: Record<string, string> | undefined,
): T | undefined {
  if (!payload || !paths) {
    return payload;
  }

  let changed = false;
  const assets = payload.assets.map((asset) => {
    const path = paths[asset.id];
    if (!path || path === asset.sparklinePath) {
      return asset;
    }
    changed = true;
    return { ...asset, sparklinePath: path };
  });

  return changed ? { ...payload, assets } : payload;
}

export type RawMarketCoin = {
  id: string;
  symbol?: string | null;
  name?: string | null;
  image?: string | null;
  current_price?: number | null;
  market_cap?: number | null;
  market_cap_rank?: number | null;
  total_volume?: number | null;
  high_24h?: number | null;
  low_24h?: number | null;
  price_change_percentage_1h_in_currency?: number | null;
  price_change_percentage_24h_in_currency?: number | null;
  price_change_percentage_7d_in_currency?: number | null;
  price_change_percentage_24h?: number | null;
  sparkline_in_7d?: { price?: number[] | null } | null;
  last_updated?: string | null;
};

export type MarketAsset = {
  id: string;
  symbol: string;
  name: string;
  imageUrl: string;
  rank: number;
  priceUsd: number;
  priceFormatted: string;
  marketCap: number;
  marketCapFormatted: string;
  volume: number;
  volumeFormatted: string;
  high24hFormatted: string;
  low24hFormatted: string;
  change1h: number;
  change24h: number;
  change7d: number;
  sparkline: number[];
  sparklinePath: string;
  lastUpdatedIso: string;
  lastUpdatedLabel: string;
};

export type MarketsPayload = {
  assets: MarketAsset[];
  fetchedAt: string;
  source: "live" | "cache";
  count: number;
};

export type SparklinesPayload = {
  paths: Record<string, string>;
  fetchedAt: string;
  source: "live" | "cache";
};

export type ApiErrorCode =
  | "NOT_FOUND"
  | "RATE_LIMITED"
  | "TIMEOUT"
  | "UPSTREAM_ERROR"
  | "VALIDATION_ERROR"
  | "UNKNOWN";

export type ApiErrorBody = {
  error: {
    code: ApiErrorCode;
    message: string;
  };
};

import { z } from "zod";

const nullableNumber = z.number().nullable().optional();
const nullableString = z.string().nullable().optional();

export const rawMarketCoinSchema = z.object({
  id: z.string().min(1),
  symbol: nullableString,
  name: nullableString,
  image: nullableString,
  current_price: nullableNumber,
  market_cap: nullableNumber,
  market_cap_rank: nullableNumber,
  total_volume: nullableNumber,
  high_24h: nullableNumber,
  low_24h: nullableNumber,
  price_change_percentage_1h_in_currency: nullableNumber,
  price_change_percentage_24h_in_currency: nullableNumber,
  price_change_percentage_7d_in_currency: nullableNumber,
  price_change_percentage_24h: nullableNumber,
  sparkline_in_7d: z
    .object({
      price: z.array(z.number()).nullable().optional(),
    })
    .nullable()
    .optional(),
  last_updated: nullableString,
});

export const rawMarketsResponseSchema = z.array(rawMarketCoinSchema);

export const marketAssetSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  name: z.string(),
  imageUrl: z.string(),
  rank: z.number(),
  priceUsd: z.number(),
  priceFormatted: z.string(),
  marketCap: z.number(),
  marketCapFormatted: z.string(),
  volume: z.number(),
  volumeFormatted: z.string(),
  high24hFormatted: z.string(),
  low24hFormatted: z.string(),
  change1h: z.number(),
  change24h: z.number(),
  change7d: z.number(),
  sparkline: z.array(z.number()),
  sparklinePath: z.string(),
  lastUpdatedIso: z.string(),
  lastUpdatedLabel: z.string(),
});

export const marketsPayloadSchema = z.object({
  assets: z.array(marketAssetSchema),
  fetchedAt: z.string(),
  source: z.enum(["live", "cache"]),
  count: z.number(),
});

export const sparklinesPayloadSchema = z.object({
  paths: z.record(z.string(), z.string()),
  fetchedAt: z.string(),
  source: z.enum(["live", "cache"]),
});

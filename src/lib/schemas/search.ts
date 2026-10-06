import { z } from "zod";
import { marketsPayloadSchema } from "@/lib/schemas/markets";

export const rawSearchCoinSchema = z.object({
  id: z.string().min(1),
  name: z.string().nullable().optional(),
  symbol: z.string().nullable().optional(),
  market_cap_rank: z.number().nullable().optional(),
  thumb: z.string().nullable().optional(),
  large: z.string().nullable().optional(),
});

export const rawSearchResponseSchema = z.object({
  coins: z.array(rawSearchCoinSchema).optional().default([]),
});

export const searchPayloadSchema = marketsPayloadSchema.extend({
  query: z.string(),
});

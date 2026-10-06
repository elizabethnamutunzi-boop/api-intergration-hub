import { z } from "zod";

export const binanceTickerSchema = z.object({
  symbol: z.string(),
  lastPrice: z.string(),
  priceChangePercent: z.string(),
  highPrice: z.string(),
  lowPrice: z.string(),
  quoteVolume: z.string(),
});

export const binanceTickersSchema = z.array(binanceTickerSchema);

export const BINANCE_TICKER_URLS = [
  "https://api.binance.com/api/v3/ticker/24hr",
  "https://data-api.binance.vision/api/v3/ticker/24hr",
  "https://api.binance.us/api/v3/ticker/24hr",
] as const;

const TOP_PAIRS = [
  "BTCUSDT",
  "ETHUSDT",
  "BNBUSDT",
  "SOLUSDT",
  "XRPUSDT",
  "ADAUSDT",
  "DOGEUSDT",
  "AVAXUSDT",
  "TRXUSDT",
  "LINKUSDT",
  "DOTUSDT",
  "MATICUSDT",
  "LTCUSDT",
  "BCHUSDT",
  "ATOMUSDT",
  "UNIUSDT",
  "XLMUSDT",
  "NEARUSDT",
  "APTUSDT",
  "ICPUSDT",
  "FILUSDT",
  "ETCUSDT",
  "HBARUSDT",
  "VETUSDT",
  "ARBUSDT",
  "OPUSDT",
  "INJUSDT",
  "SUIUSDT",
  "RUNEUSDT",
  "AAVEUSDT",
  "GRTUSDT",
  "ALGOUSDT",
  "FTMUSDT",
  "SANDUSDT",
  "MANAUSDT",
  "AXSUSDT",
  "EGLDUSDT",
  "XTZUSDT",
  "THETAUSDT",
  "EOSUSDT",
  "FLOWUSDT",
  "KAVAUSDT",
  "NEOUSDT",
  "IOTAUSDT",
  "ZECUSDT",
  "XMRUSDT",
  "CAKEUSDT",
  "CRVUSDT",
] as const;

const PAIR_NAMES: Record<string, string> = {
  BTCUSDT: "Bitcoin",
  ETHUSDT: "Ethereum",
  BNBUSDT: "BNB",
  SOLUSDT: "Solana",
  XRPUSDT: "XRP",
  ADAUSDT: "Cardano",
  DOGEUSDT: "Dogecoin",
  AVAXUSDT: "Avalanche",
  TRXUSDT: "TRON",
  LINKUSDT: "Chainlink",
  DOTUSDT: "Polkadot",
  MATICUSDT: "Polygon",
  LTCUSDT: "Litecoin",
  BCHUSDT: "Bitcoin Cash",
  ATOMUSDT: "Cosmos",
  UNIUSDT: "Uniswap",
  XLMUSDT: "Stellar",
  NEARUSDT: "NEAR Protocol",
  APTUSDT: "Aptos",
  ICPUSDT: "Internet Computer",
  FILUSDT: "Filecoin",
  ETCUSDT: "Ethereum Classic",
  HBARUSDT: "Hedera",
  VETUSDT: "VeChain",
  ARBUSDT: "Arbitrum",
  OPUSDT: "Optimism",
  INJUSDT: "Injective",
  SUIUSDT: "Sui",
  RUNEUSDT: "THORChain",
  AAVEUSDT: "Aave",
  GRTUSDT: "The Graph",
  ALGOUSDT: "Algorand",
  FTMUSDT: "Fantom",
  SANDUSDT: "The Sandbox",
  MANAUSDT: "Decentraland",
  AXSUSDT: "Axie Infinity",
  EGLDUSDT: "MultiversX",
  XTZUSDT: "Tezos",
  THETAUSDT: "Theta Network",
  EOSUSDT: "EOS",
  FLOWUSDT: "Flow",
  KAVAUSDT: "Kava",
  NEOUSDT: "Neo",
  IOTAUSDT: "IOTA",
  ZECUSDT: "Zcash",
  XMRUSDT: "Monero",
  CAKEUSDT: "PancakeSwap",
  CRVUSDT: "Curve DAO",
};

export function isTrackedPair(symbol: string): boolean {
  return (TOP_PAIRS as readonly string[]).includes(symbol);
}

export function displayNameForPair(symbol: string): string {
  return PAIR_NAMES[symbol] ?? symbol.replace(/USDT$/, "");
}

export function rankForPair(symbol: string): number {
  const index = (TOP_PAIRS as readonly string[]).indexOf(symbol);
  return index >= 0 ? index + 1 : 0;
}

export function pairMatchesQuery(symbol: string, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return false;
  }

  const ticker = symbol.replace(/USDT$/, "").toLowerCase();
  const name = displayNameForPair(symbol).toLowerCase();
  return name.includes(needle) || ticker.includes(needle) || symbol.toLowerCase().includes(needle);
}

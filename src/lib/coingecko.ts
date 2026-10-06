export function coinGeckoBaseUrl(): string {
  return (process.env.COINGECKO_BASE_URL ?? "https://api.coingecko.com/api/v3").replace(/\/$/, "");
}

export function coinGeckoHeaders(): HeadersInit {
  const headers: HeadersInit = {
    Accept: "application/json",
  };
  const apiKey = process.env.COINGECKO_API_KEY?.trim();

  if (apiKey) {
    headers["x-cg-demo-api-key"] = apiKey;
    headers["x-cg-pro-api-key"] = apiKey;
  }

  return headers;
}

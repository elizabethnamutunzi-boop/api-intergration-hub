export function coinGeckoBaseUrl(): string {
  const configured = process.env.COINGECKO_BASE_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, "");
  }

  const apiKey = process.env.COINGECKO_API_KEY?.trim() ?? "";
  if (apiKey && !apiKey.startsWith("CG-")) {
    return "https://pro-api.coingecko.com/api/v3";
  }

  return "https://api.coingecko.com/api/v3";
}

export function coinGeckoHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "User-Agent": "Pulseboard/1.0 (https://github.com/elizabethnamutunzi-boop/api-intergration-hub)",
  };
  const apiKey = process.env.COINGECKO_API_KEY?.trim();

  if (apiKey) {
    if (apiKey.startsWith("CG-")) {
      headers["x-cg-demo-api-key"] = apiKey;
    } else {
      headers["x-cg-pro-api-key"] = apiKey;
    }
  }

  return headers;
}

export function publicApiHeaders(): HeadersInit {
  return {
    Accept: "application/json",
    "User-Agent": "Pulseboard/1.0 (https://github.com/elizabethnamutunzi-boop/api-intergration-hub)",
  };
}

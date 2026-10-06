import type { MarketAsset } from "@/types/markets";

function escapeCsv(value: string | number): string {
  const text = String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function exportAssets(assets: MarketAsset[], format: "csv" | "json"): void {
  const stamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
  const filename = `pulseboard-markets-${stamp}.${format}`;
  const contents =
    format === "json"
      ? JSON.stringify(assets, null, 2)
      : [
          "rank,name,symbol,price_usd,change_24h,market_cap,volume,high_24h,low_24h",
          ...assets.map((asset) =>
            [
              asset.rank,
              escapeCsv(asset.name),
              escapeCsv(asset.symbol),
              asset.priceUsd,
              asset.change24h,
              escapeCsv(asset.marketCapFormatted),
              escapeCsv(asset.volumeFormatted),
              escapeCsv(asset.high24hFormatted),
              escapeCsv(asset.low24hFormatted),
            ].join(","),
          ),
        ].join("\n");

  const blob = new Blob([contents], {
    type: format === "json" ? "application/json" : "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

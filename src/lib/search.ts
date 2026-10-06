import type { MarketAsset } from "@/types/markets";

export function normalizeSearchQuery(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function assetMatchesQuery(asset: Pick<MarketAsset, "id" | "name" | "symbol">, query: string): boolean {
  const needle = normalizeSearchQuery(query).toLowerCase();
  if (!needle) {
    return true;
  }

  return (
    asset.id.toLowerCase().includes(needle) ||
    asset.name.toLowerCase().includes(needle) ||
    asset.symbol.toLowerCase().includes(needle)
  );
}

export function filterAssets<T extends Pick<MarketAsset, "id" | "name" | "symbol">>(assets: T[], query: string): T[] {
  const needle = normalizeSearchQuery(query);
  if (!needle) {
    return assets;
  }

  return assets.filter((asset) => assetMatchesQuery(asset, needle));
}

export function uniqueAssets<T extends { id: string }>(assets: T[]): T[] {
  const seen = new Set<string>();
  return assets.filter((asset) => {
    if (seen.has(asset.id)) {
      return false;
    }
    seen.add(asset.id);
    return true;
  });
}

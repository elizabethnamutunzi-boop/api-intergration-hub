import type { MarketAsset } from "@/types/markets";
import { MarketCard } from "@/components/market-card";

type MarketGridProps = {
  assets: MarketAsset[];
  graphsPending?: boolean;
};

export function MarketGrid({ assets, graphsPending = false }: MarketGridProps) {
  return (
    <section className="market-grid" id="prices" aria-label="Live market cards">
      {assets.map((asset) => (
        <MarketCard key={asset.id} asset={asset} graphsPending={graphsPending} />
      ))}
    </section>
  );
}

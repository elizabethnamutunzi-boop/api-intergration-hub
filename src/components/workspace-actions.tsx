"use client";

import { Protected } from "@/components/auth/protected";
import { useAuth } from "@/components/providers/auth-provider";
import { exportAssets } from "@/lib/export";
import type { MarketAsset } from "@/types/markets";

type WorkspaceActionsProps = {
  assets: MarketAsset[];
};

export function WorkspaceActions({ assets }: WorkspaceActionsProps) {
  const { isAuthenticated, isReady } = useAuth();

  if (!isReady || !isAuthenticated) {
    return null;
  }

  return (
    <div className="workspace-actions">
      <Protected permission="export">
        <button type="button" className="ghost-button" onClick={() => exportAssets(assets, "csv")} disabled={assets.length === 0}>
          Export CSV
        </button>
        <button type="button" className="ghost-button" onClick={() => exportAssets(assets, "json")} disabled={assets.length === 0}>
          Export JSON
        </button>
      </Protected>
    </div>
  );
}

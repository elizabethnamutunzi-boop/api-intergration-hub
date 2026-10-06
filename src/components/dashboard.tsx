"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { EmptyResults } from "@/components/empty-results";
import { ErrorBanner } from "@/components/error-banner";
import { ErrorFallback } from "@/components/error-fallback";
import { FreshnessIndicator } from "@/components/freshness-indicator";
import { MarketGrid } from "@/components/market-grid";
import { SearchBar } from "@/components/search-bar";
import { DashboardSkeleton, SearchResultsSkeleton } from "@/components/skeleton-loaders";
import { StatHighlights } from "@/components/stat-highlights";
import { WorkspaceActions } from "@/components/workspace-actions";
import { WatchlistPanel } from "@/components/watchlist-panel";
import { getErrorCopy } from "@/lib/request-error";
import { filterAssets, normalizeSearchQuery, uniqueAssets } from "@/lib/search";
import { useMarkets } from "@/hooks/use-markets";
import { useMarketSearch } from "@/hooks/use-search";
import type { MarketAsset } from "@/types/markets";

export function Dashboard() {
  const { data, isPending, isFetching, isError, error, refetch, dataUpdatedAt, graphsPending } = useMarkets();
  const [draftQuery, setDraftQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const wasError = useRef(false);
  const search = useMarketSearch(submittedQuery);

  const assets = useMemo(() => data?.assets ?? [], [data?.assets]);
  const hasData = assets.length > 0;
  const appliedQuery = normalizeSearchQuery(submittedQuery);
  const localMatches = useMemo(() => filterAssets(assets, appliedQuery), [assets, appliedQuery]);
  const remoteMatches = useMemo(() => {
    if (!search.data) {
      return [];
    }
    if (normalizeSearchQuery(search.data.query).toLowerCase() !== appliedQuery.toLowerCase()) {
      return [];
    }
    return search.data.assets;
  }, [appliedQuery, search.data]);
  const visible = useMemo(
    () => (appliedQuery ? uniqueAssets([...localMatches, ...remoteMatches]) : assets),
    [appliedQuery, assets, localMatches, remoteMatches],
  );
  const suggestions = useMemo(() => {
    const local = filterAssets(assets, draftQuery).slice(0, 8);
    const includeRemote = normalizeSearchQuery(draftQuery).toLowerCase() === appliedQuery.toLowerCase();
    return uniqueAssets(includeRemote ? [...local, ...remoteMatches] : local).slice(0, 8);
  }, [appliedQuery, assets, draftQuery, remoteMatches]);

  const fetchedAt = data?.fetchedAt ?? (dataUpdatedAt ? new Date(dataUpdatedAt).toISOString() : undefined);
  const copy = getErrorCopy(error);
  const showSkeleton = (!hasData && isPending) || (!hasData && isFetching);
  const showInlineError = isError && !hasData && !isFetching;
  const isSearching = Boolean(appliedQuery) && search.isFetching;
  const showEmptyResults = Boolean(appliedQuery) && visible.length === 0 && !isSearching;

  useEffect(() => {
    if (isError && !wasError.current) {
      setBannerDismissed(false);
    }
    wasError.current = isError;
  }, [isError]);

  function applySearch(value: string) {
    setDraftQuery(value);
    setSubmittedQuery(normalizeSearchQuery(value));
  }

  function clearSearch() {
    setDraftQuery("");
    setSubmittedQuery("");
  }

  function selectAsset(asset: MarketAsset) {
    applySearch(asset.name);
    window.setTimeout(() => {
      document.getElementById(`asset-${asset.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  }

  return (
    <div className="dashboard">
      <ErrorBanner
        open={isError && !bannerDismissed}
        copy={copy}
        isRetrying={isFetching}
        onRetry={() => {
          setBannerDismissed(false);
          void refetch().catch(() => undefined);
        }}
        onDismiss={() => setBannerDismissed(true)}
      />

      <div className="toolbar">
        <SearchBar
          value={draftQuery}
          onChange={setDraftQuery}
          onSubmit={applySearch}
          onSelect={selectAsset}
          onClear={clearSearch}
          suggestions={suggestions}
          resultCount={appliedQuery ? visible.length : assets.length}
          isSearching={isSearching}
        />
        <FreshnessIndicator
          fetchedAt={fetchedAt}
          isFetching={isFetching || isSearching}
          source={data?.source}
          isError={isError}
        />
      </div>
      <WorkspaceActions assets={visible} />

      {showSkeleton ? (
        <DashboardSkeleton />
      ) : showInlineError ? (
        <ErrorFallback copy={copy} isRetrying={isFetching} onRetry={() => void refetch().catch(() => undefined)} />
      ) : (
        <div className="dashboard-body" aria-live="polite">
          {appliedQuery ? (
            <div className="results-heading">
              <h2>
                Search results for <span>“{appliedQuery}”</span>
              </h2>
              <p>
                {isSearching
                  ? "Fetching live matches…"
                  : search.isError
                    ? "Live search is unavailable. Showing matches from the current snapshot."
                    : `${visible.length} ${visible.length === 1 ? "asset" : "assets"} available below.`}
              </p>
            </div>
          ) : null}
          <StatHighlights assets={appliedQuery ? visible : assets} />
          <div id="watchlist">
            <WatchlistPanel assets={uniqueAssets([...assets, ...visible])} />
          </div>
          {showEmptyResults ? (
            <EmptyResults query={appliedQuery} />
          ) : isSearching && visible.length === 0 ? (
            <SearchResultsSkeleton />
          ) : (
            <MarketGrid assets={visible} graphsPending={graphsPending} />
          )}
        </div>
      )}
    </div>
  );
}

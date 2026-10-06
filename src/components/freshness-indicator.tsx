"use client";

import { useEffect, useState } from "react";

type FreshnessIndicatorProps = {
  fetchedAt?: string;
  isFetching: boolean;
  source?: "live" | "cache";
  isError: boolean;
};

function formatAge(seconds: number): string {
  if (seconds < 5) {
    return "just now";
  }
  if (seconds < 60) {
    return `${seconds}s ago`;
  }
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ago`;
}

export function FreshnessIndicator({ fetchedAt, isFetching, source, isError }: FreshnessIndicatorProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const ageSeconds = fetchedAt ? Math.max(0, Math.round((now - new Date(fetchedAt).getTime()) / 1000)) : 0;
  const label = fetchedAt ? `Last updated ${formatAge(ageSeconds)}` : "Waiting for first snapshot";
  const status = isError ? "Showing last known data" : isFetching ? "Refreshing…" : source === "cache" ? "Cached snapshot" : "Live";

  return (
    <p className="freshness" aria-live="polite">
      <span className={`pulse ${isError ? "error" : isFetching ? "busy" : "live"}`} aria-hidden="true" />
      <span>
        {label}
        <span className="freshness-status"> · {status}</span>
      </span>
    </p>
  );
}

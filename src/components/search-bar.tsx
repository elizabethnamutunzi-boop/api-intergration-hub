"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import type { MarketAsset } from "@/types/markets";

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  onSelect: (asset: MarketAsset) => void;
  onClear: () => void;
  suggestions: MarketAsset[];
  resultCount: number;
  isSearching: boolean;
};

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
      <circle cx="11" cy="11" r="6.25" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="m16.2 16.2 4.1 4.1" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function SearchBar({
  value,
  onChange,
  onSubmit,
  onSelect,
  onClear,
  suggestions,
  resultCount,
  isSearching,
}: SearchBarProps) {
  const listId = "asset-search-results";
  const wrapRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const hasQuery = value.trim().length > 0;
  const showList = open && hasQuery;
  const activeIndexSafe = suggestions.length === 0 ? 0 : Math.min(activeIndex, suggestions.length - 1);
  const activeSuggestion = suggestions[activeIndexSafe];

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  function submitQuery(query: string) {
    onSubmit(query);
    setOpen(true);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submitQuery(value);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) => Math.min(current + 1, Math.max(suggestions.length - 1, 0)));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => Math.max(current - 1, 0));
      return;
    }

    if (event.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="search-wrap" ref={wrapRef}>
      <form className="search-form" onSubmit={handleSubmit} role="search">
        <button type="submit" className="search-icon-button" aria-label="Search" title="Search">
          <SearchIcon />
        </button>
        <label htmlFor="asset-search" className="sr-only">
          Search assets by name or symbol
        </label>
        <input
          id="asset-search"
          type="search"
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            setActiveIndex(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search Bitcoin, ETH, solana…"
          autoComplete="off"
          className="search-input"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showList}
          aria-controls={listId}
          aria-activedescendant={showList && activeSuggestion ? `${listId}-${activeSuggestion.id}` : undefined}
        />
        {hasQuery ? (
          <button
            type="button"
            className="search-clear-button"
            onClick={() => {
              onClear();
              setOpen(false);
            }}
          >
            Clear
          </button>
        ) : null}
        <p className="search-meta" aria-live="polite">
          {isSearching ? "Searching…" : `${resultCount} ${resultCount === 1 ? "result" : "results"}`}
        </p>
      </form>

      {showList ? (
        <ul className="search-results" id={listId} role="listbox" aria-label="Search results">
          {isSearching && suggestions.length === 0 ? (
            <li className="search-result-empty">Looking up live matches…</li>
          ) : suggestions.length === 0 ? (
            <li className="search-result-empty">No matching records. Press search to query the live API.</li>
          ) : (
            suggestions.map((asset, index) => (
              <li key={asset.id} role="presentation">
                <button
                  type="button"
                  id={`${listId}-${asset.id}`}
                  role="option"
                  aria-selected={index === activeIndexSafe}
                  className={`search-result ${index === activeIndexSafe ? "active" : ""}`}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => {
                    onSelect(asset);
                    setOpen(false);
                  }}
                >
                  {asset.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={asset.imageUrl} alt="" width={28} height={28} className="search-result-icon" />
                  ) : (
                    <span className="asset-fallback search-result-fallback" aria-hidden="true">
                      {asset.symbol.slice(0, 2)}
                    </span>
                  )}
                  <span className="search-result-copy">
                    <span className="search-result-name">{asset.name}</span>
                    <span className="search-result-symbol">{asset.symbol}</span>
                  </span>
                  <span className="search-result-price">{asset.priceFormatted}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}

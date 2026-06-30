"use client";

import { useEffect, useRef, useState } from "react";
import { Coin } from "@/lib/types";

interface AssetSearchProps {
  value: Coin;
  onSelect: (coin: Coin) => void;
}

/**
 * Searchable asset picker backed by CoinGecko's full coin list (17 000+
 * assets via /api/coins/search), not just a top-N dropdown — closer to the
 * "plus de 7 000 cryptoactifs" the original sinvestir.fr simulator
 * advertises.
 */
export default function AssetSearch({ value, onSelect }: AssetSearchProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Coin[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      debounceRef.current = setTimeout(() => setResults([]), 0);
      return () => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
      };
    }

    debounceRef.current = setTimeout(() => {
      setLoading(true);
      fetch(`/api/coins/search?q=${encodeURIComponent(query)}`)
        .then((r) => r.json())
        .then((data) => setResults(data.coins ?? []))
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, open]);

  return (
    <div className="relative">
      <input
        type="text"
        className="input-field"
        placeholder="Rechercher une crypto (ex: bitcoin, sol...)"
        value={open ? query : `${value.name} (${value.symbol})`}
        onFocus={() => {
          setOpen(true);
          setQuery("");
        }}
        onChange={(e) => setQuery(e.target.value)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && (
        <ul className="absolute z-10 mt-1 w-full max-h-60 overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] shadow-xl">
          {loading && <li className="px-3 py-2 text-xs text-[var(--text-muted)]">Recherche…</li>}
          {!loading && query && results.length === 0 && (
            <li className="px-3 py-2 text-xs text-[var(--text-muted)]">Aucun résultat</li>
          )}
          {!loading && !query && (
            <li className="px-3 py-2 text-xs text-[var(--text-muted)]">
              Tapez un nom ou un symbole (parmi 17 000+ actifs)
            </li>
          )}
          {results.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onMouseDown={() => {
                  onSelect(c);
                  setOpen(false);
                  setQuery("");
                }}
                className="w-full text-left px-3 py-2 text-sm text-white hover:bg-[var(--bg-card)]"
              >
                {c.name} <span className="text-[var(--text-muted)]">({c.symbol})</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

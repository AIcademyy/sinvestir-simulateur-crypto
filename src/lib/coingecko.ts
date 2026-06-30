import { getSupabase } from "./supabase";
import { Coin } from "./types";

const BASE = "https://api.coingecko.com/api/v3";
const PRICE_CACHE_TTL_MS = 60 * 60 * 1000; // 1h, matches the Next.js fetch revalidate below

/** Top cryptos by market cap, in EUR. Cached for an hour to stay within the free rate limit. */
export async function fetchTopCoins(limit = 60): Promise<Coin[]> {
  const url = `${BASE}/coins/markets?vs_currency=eur&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`CoinGecko coins/markets failed: ${res.status}`);
  const data = await res.json();
  return data.map((c: { id: string; symbol: string; name: string; image: string }) => ({
    id: c.id,
    symbol: c.symbol.toUpperCase(),
    name: c.name,
    image: c.image,
  }));
}

/**
 * Full CoinGecko coin list (17 000+ entries, id/symbol/name only, no market
 * data) — the free, no-key endpoint behind the asset search box. Cached 24h
 * since new listings are rare; it's ~2MB of JSON, too big to re-fetch per
 * keystroke.
 */
async function fetchAllCoinsList(): Promise<{ id: string; symbol: string; name: string }[]> {
  const url = `${BASE}/coins/list`;
  const res = await fetch(url, { next: { revalidate: 86400 } });
  if (!res.ok) throw new Error(`CoinGecko coins/list failed: ${res.status}`);
  return res.json();
}

/** Searches the full coin list by symbol/name substring, best matches first. */
export async function searchCoins(query: string, limit = 20): Promise<Coin[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const all = await fetchAllCoinsList();
  const scored = all
    .map((c) => {
      const symbol = c.symbol.toLowerCase();
      const name = c.name.toLowerCase();
      let score = -1;
      if (symbol === q) score = 0;
      else if (symbol.startsWith(q)) score = 1;
      else if (name.startsWith(q)) score = 2;
      else if (name.includes(q) || symbol.includes(q)) score = 3;
      return { c, score };
    })
    .filter((r) => r.score >= 0)
    .sort((a, b) => a.score - b.score || a.c.name.length - b.c.name.length)
    .slice(0, limit);

  return scored.map(({ c }) => ({
    id: c.id,
    symbol: c.symbol.toUpperCase(),
    name: c.name,
    image: "",
  }));
}

export interface PricePoint {
  timestamp: number;
  price: number;
}

/**
 * Daily historical price series in EUR between two dates (inclusive).
 * Backed by a shared Supabase cache (table `price_cache`) when configured,
 * on top of Next.js's own per-instance fetch cache — useful as soon as
 * multiple visitors (or the multi-asset comparator) request overlapping
 * date ranges, so they don't each re-pay CoinGecko's rate limit.
 */
export async function fetchPriceHistory(
  coinId: string,
  startDate: string,
  endDate: string
): Promise<PricePoint[]> {
  const cacheKey = `${coinId}:${startDate}:${endDate}`;
  const supabase = getSupabase();

  if (supabase) {
    const { data } = await supabase
      .from("price_cache")
      .select("prices, fetched_at")
      .eq("cache_key", cacheKey)
      .maybeSingle();

    if (data && Date.now() - new Date(data.fetched_at).getTime() < PRICE_CACHE_TTL_MS) {
      return data.prices as PricePoint[];
    }
  }

  const from = Math.floor(new Date(startDate + "T00:00:00Z").getTime() / 1000);
  const to = Math.floor(new Date(endDate + "T23:59:59Z").getTime() / 1000) + 1;

  const url = `${BASE}/coins/${coinId}/market_chart/range?vs_currency=eur&from=${from}&to=${to}`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) {
    throw new Error(`CoinGecko market_chart/range failed: ${res.status}`);
  }
  const data = await res.json();
  const prices: [number, number][] = data.prices ?? [];
  const series = prices.map(([timestamp, price]) => ({ timestamp, price }));

  if (supabase) {
    await supabase
      .from("price_cache")
      .upsert({ cache_key: cacheKey, prices: series, fetched_at: new Date().toISOString() });
  }

  return series;
}

/** Finds the price point with the timestamp closest to (but not after) the target date. */
export function priceAtOrBefore(series: PricePoint[], targetMs: number): PricePoint | null {
  let candidate: PricePoint | null = null;
  for (const point of series) {
    if (point.timestamp <= targetMs) {
      candidate = point;
    } else {
      break;
    }
  }
  return candidate ?? series[0] ?? null;
}

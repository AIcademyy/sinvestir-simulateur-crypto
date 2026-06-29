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

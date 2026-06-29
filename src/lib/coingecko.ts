import { Coin } from "./types";

const BASE = "https://api.coingecko.com/api/v3";

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

/** Daily historical price series in EUR between two dates (inclusive). */
export async function fetchPriceHistory(
  coinId: string,
  startDate: string,
  endDate: string
): Promise<PricePoint[]> {
  const from = Math.floor(new Date(startDate + "T00:00:00Z").getTime() / 1000);
  const to = Math.floor(new Date(endDate + "T23:59:59Z").getTime() / 1000) + 1;

  const url = `${BASE}/coins/${coinId}/market_chart/range?vs_currency=eur&from=${from}&to=${to}`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) {
    throw new Error(`CoinGecko market_chart/range failed: ${res.status}`);
  }
  const data = await res.json();
  const prices: [number, number][] = data.prices ?? [];
  return prices.map(([timestamp, price]) => ({ timestamp, price }));
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

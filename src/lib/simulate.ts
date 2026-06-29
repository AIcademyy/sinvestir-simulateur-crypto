import { priceAtOrBefore, PricePoint } from "./coingecko";
import { Coin, Frequency, SimulationPoint, SimulationResult } from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;

function stepMs(frequency: Frequency): number {
  switch (frequency) {
    case "daily":
      return DAY_MS;
    case "weekly":
      return 7 * DAY_MS;
    case "monthly":
      return 30 * DAY_MS;
    case "once":
    default:
      return 0;
  }
}

/** Contribution dates between start and end (inclusive of start). "once" yields a single date. */
function buildContributionDates(startMs: number, endMs: number, frequency: Frequency): number[] {
  if (frequency === "once") return [startMs];
  const step = stepMs(frequency);
  const dates: number[] = [];
  for (let t = startMs; t <= endMs; t += step) {
    dates.push(t);
  }
  return dates.length ? dates : [startMs];
}

export function runSimulation(
  coin: Coin,
  amount: number,
  frequency: Frequency,
  startDate: string,
  endDate: string,
  priceSeries: PricePoint[]
): SimulationResult {
  const startMs = new Date(startDate + "T00:00:00Z").getTime();
  const endMs = new Date(endDate + "T00:00:00Z").getTime();

  const contributionDates = buildContributionDates(startMs, endMs, frequency);

  let invested = 0;
  let acquired = 0;
  const series: SimulationPoint[] = [];

  for (const t of contributionDates) {
    const point = priceAtOrBefore(priceSeries, t);
    if (!point) continue;
    acquired += amount / point.price;
    invested += amount;
    series.push({
      date: new Date(t).toISOString().slice(0, 10),
      invested,
      value: acquired * point.price,
    });
  }

  const lastPoint = priceSeries[priceSeries.length - 1] ?? null;
  const finalPrice = lastPoint?.price ?? 0;
  const finalCapital = acquired * finalPrice;

  if (lastPoint) {
    series.push({
      date: new Date(lastPoint.timestamp).toISOString().slice(0, 10),
      invested,
      value: finalCapital,
    });
  }

  const avgPrice = acquired > 0 ? invested / acquired : 0;
  const performancePct = invested > 0 ? ((finalCapital - invested) / invested) * 100 : 0;

  return {
    coin: { id: coin.id, symbol: coin.symbol, name: coin.name },
    invested,
    contributions: contributionDates.length,
    acquired,
    avgPrice,
    finalPrice,
    finalCapital,
    performancePct,
    series,
  };
}

export type Frequency = "once" | "daily" | "weekly" | "monthly";

export interface Coin {
  id: string;
  symbol: string;
  name: string;
  image: string;
}

export interface SimulationInput {
  coinId: string;
  amount: number;
  frequency: Frequency;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
}

export interface SimulationPoint {
  date: string;
  invested: number;
  value: number;
}

export interface SimulationResult {
  coin: Pick<Coin, "id" | "symbol" | "name">;
  invested: number;
  contributions: number;
  acquired: number;
  avgPrice: number;
  finalPrice: number;
  finalCapital: number;
  performancePct: number;
  series: SimulationPoint[];
}

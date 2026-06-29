import { NextResponse } from "next/server";
import { fetchPriceHistory, fetchTopCoins } from "@/lib/coingecko";
import { runSimulation } from "@/lib/simulate";
import { Frequency } from "@/lib/types";

const FREQUENCIES: Frequency[] = ["once", "daily", "weekly", "monthly"];

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body) {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  const { coinId, amount, frequency, startDate, endDate } = body as Record<string, unknown>;

  if (
    typeof coinId !== "string" ||
    typeof amount !== "number" ||
    !Number.isFinite(amount) ||
    amount <= 0 ||
    typeof frequency !== "string" ||
    !FREQUENCIES.includes(frequency as Frequency) ||
    typeof startDate !== "string" ||
    typeof endDate !== "string"
  ) {
    return NextResponse.json({ error: "Paramètres manquants ou invalides" }, { status: 400 });
  }

  if (new Date(startDate) >= new Date(endDate)) {
    return NextResponse.json(
      { error: "La date de début doit précéder la date de fin" },
      { status: 400 }
    );
  }

  try {
    const [coins, priceSeries] = await Promise.all([
      fetchTopCoins(60),
      fetchPriceHistory(coinId, startDate, endDate),
    ]);

    const coin = coins.find((c) => c.id === coinId);
    if (!coin) {
      return NextResponse.json({ error: "Actif inconnu" }, { status: 404 });
    }
    if (priceSeries.length === 0) {
      return NextResponse.json(
        { error: "Aucune donnée de marché pour cette période" },
        { status: 422 }
      );
    }

    const result = runSimulation(
      coin,
      amount,
      frequency as Frequency,
      startDate,
      endDate,
      priceSeries
    );

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur inconnue" },
      { status: 502 }
    );
  }
}

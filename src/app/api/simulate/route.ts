import { NextResponse } from "next/server";
import { fetchPriceHistory } from "@/lib/coingecko";
import { runSimulation } from "@/lib/simulate";
import { Frequency } from "@/lib/types";

const FREQUENCIES: Frequency[] = ["once", "daily", "weekly", "monthly"];

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body) {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  const { coinId, coinSymbol, coinName, amount, frequency, startDate, endDate } =
    body as Record<string, unknown>;

  if (
    typeof coinId !== "string" ||
    !coinId ||
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
    const priceSeries = await fetchPriceHistory(coinId, startDate, endDate);

    if (priceSeries.length === 0) {
      return NextResponse.json(
        { error: "Aucune donnée de marché pour cette période" },
        { status: 422 }
      );
    }

    // coinSymbol/coinName come from the asset search box (CoinGecko's full
    // 17k+ coin list has no per-coin market data, so the client already has
    // the display label — no need to re-resolve it against a market-cap
    // list here, which would artificially cap which assets are usable).
    const coin = {
      id: coinId,
      symbol: typeof coinSymbol === "string" && coinSymbol ? coinSymbol.toUpperCase() : coinId.toUpperCase(),
      name: typeof coinName === "string" && coinName ? coinName : coinId,
    };

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

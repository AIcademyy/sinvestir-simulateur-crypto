import { NextResponse } from "next/server";
import { fetchTopCoins } from "@/lib/coingecko";

export async function GET() {
  try {
    const coins = await fetchTopCoins(60);
    return NextResponse.json({ coins });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur inconnue" },
      { status: 502 }
    );
  }
}

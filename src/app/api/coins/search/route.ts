import { NextResponse } from "next/server";
import { searchCoins } from "@/lib/coingecko";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";

  try {
    const coins = await searchCoins(q);
    return NextResponse.json({ coins });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur inconnue" },
      { status: 502 }
    );
  }
}

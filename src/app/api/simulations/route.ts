import { NextResponse } from "next/server";
import { emitAutomationEvent } from "@/lib/automation";
import { getSupabase } from "@/lib/supabase";
import { SimulationResult } from "@/lib/types";

export async function GET() {
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ simulations: [], persistence: "disabled" });
  }

  const { data, error } = await supabase
    .from("simulations")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 502 });
  }

  return NextResponse.json({ simulations: data, persistence: "enabled" });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const result = body as
    | (SimulationResult & { frequency: string; startDate: string; endDate: string; leadEmail?: string })
    | null;

  if (!result?.coin?.id) {
    return NextResponse.json({ error: "Résultat de simulation invalide" }, { status: 400 });
  }

  // This is exactly the kind of event an n8n workflow would consume to sync
  // a lead/CRM record (HubSpot), append a row to a reporting sheet, or send
  // the lead an email report (see automation/lead-report-email.html).
  emitAutomationEvent("simulation.completed", { ...result });

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ saved: false, persistence: "disabled" });
  }

  const { error } = await supabase.from("simulations").insert({
    coin_id: result.coin.id,
    coin_symbol: result.coin.symbol,
    amount: result.invested / Math.max(result.contributions, 1),
    frequency: result.frequency,
    start_date: result.startDate,
    end_date: result.endDate,
    invested: result.invested,
    acquired: result.acquired,
    final_capital: result.finalCapital,
    performance_pct: result.performancePct,
    lead_email: result.leadEmail || null,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 502 });
  }

  return NextResponse.json({ saved: true, persistence: "enabled" });
}

import SuiteShell from "@/components/SuiteShell";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const eur = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

interface SavedSimulation {
  id: string;
  created_at: string;
  coin_symbol: string;
  frequency: string;
  start_date: string;
  end_date: string;
  invested: number;
  final_capital: number;
  performance_pct: number;
}

const FREQUENCY_LABELS: Record<string, string> = {
  once: "Unique",
  daily: "Par jour",
  weekly: "Par semaine",
  monthly: "Par mois",
};

export default async function MesSimulationsPage() {
  const supabase = getSupabase();

  const { data } = supabase
    ? await supabase
        .from("simulations")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50)
    : { data: null };

  const simulations = (data ?? []) as SavedSimulation[];

  return (
    <SuiteShell>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-semibold text-white mb-1">Mes simulations</h1>
        <p className="text-sm text-[var(--text-muted)] mb-6">
          Historique des simulations enregistrées (persisté via Supabase).
        </p>

        {!supabase && (
          <div className="card p-5 text-sm text-[var(--text-muted)]">
            Persistance désactivée sur cet environnement — configurez{" "}
            <code className="text-[var(--gold)]">SUPABASE_URL</code> et{" "}
            <code className="text-[var(--gold)]">SUPABASE_SERVICE_ROLE_KEY</code>{" "}
            pour activer l&apos;historique (voir <code>supabase/schema.sql</code>).
          </div>
        )}

        {supabase && simulations.length === 0 && (
          <div className="card p-5 text-sm text-[var(--text-muted)]">
            Aucune simulation enregistrée pour l&apos;instant. Lancez-en une depuis{" "}
            <span className="text-[var(--blue)]">Les simulateurs</span>.
          </div>
        )}

        {simulations.length > 0 && (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[var(--bg-elevated)] text-[var(--text-muted)]">
                <tr>
                  <th className="text-left px-4 py-2">Actif</th>
                  <th className="text-left px-4 py-2">Fréquence</th>
                  <th className="text-left px-4 py-2">Période</th>
                  <th className="text-right px-4 py-2">Investi</th>
                  <th className="text-right px-4 py-2">Capital final</th>
                  <th className="text-right px-4 py-2">Perf.</th>
                </tr>
              </thead>
              <tbody>
                {simulations.map((sim) => (
                  <tr key={sim.id} className="border-t border-[var(--border)]">
                    <td className="px-4 py-2 font-medium text-white">{sim.coin_symbol}</td>
                    <td className="px-4 py-2 text-[var(--text-muted)]">
                      {FREQUENCY_LABELS[sim.frequency] ?? sim.frequency}
                    </td>
                    <td className="px-4 py-2 text-[var(--text-muted)]">
                      {sim.start_date} → {sim.end_date}
                    </td>
                    <td className="px-4 py-2 text-right text-white">{eur.format(sim.invested)}</td>
                    <td className="px-4 py-2 text-right text-[var(--gold)]">
                      {eur.format(sim.final_capital)}
                    </td>
                    <td
                      className={`px-4 py-2 text-right ${
                        sim.performance_pct >= 0 ? "text-[var(--success)]" : "text-[var(--danger)]"
                      }`}
                    >
                      {sim.performance_pct >= 0 ? "+" : ""}
                      {sim.performance_pct.toFixed(2)} %
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </SuiteShell>
  );
}

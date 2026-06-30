import SavedSimulationsTable, { SavedSimulation } from "@/components/SavedSimulationsTable";
import SuiteShell from "@/components/SuiteShell";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

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
            <code className="text-[var(--blue)]">SUPABASE_URL</code> et{" "}
            <code className="text-[var(--blue)]">SUPABASE_SERVICE_ROLE_KEY</code>{" "}
            pour activer l&apos;historique (voir <code>supabase/schema.sql</code>).
          </div>
        )}

        {supabase && simulations.length === 0 && (
          <div className="card p-5 text-sm text-[var(--text-muted)]">
            Aucune simulation enregistrée pour l&apos;instant. Lancez-en une depuis{" "}
            <span className="text-[var(--blue)]">Les simulateurs</span>.
          </div>
        )}

        {simulations.length > 0 && <SavedSimulationsTable simulations={simulations} />}
      </div>
    </SuiteShell>
  );
}

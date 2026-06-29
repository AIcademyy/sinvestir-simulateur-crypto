"use client";

import { useState } from "react";

const eur = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

export interface SavedSimulation {
  id: string;
  created_at: string;
  coin_symbol: string;
  frequency: string;
  start_date: string;
  end_date: string;
  invested: number;
  acquired: number;
  final_capital: number;
  performance_pct: number;
}

const FREQUENCY_LABELS: Record<string, string> = {
  once: "Investissement unique",
  daily: "Par jour",
  weekly: "Par semaine",
  monthly: "Par mois",
};

const MAX_COMPARE = 3;

export default function SavedSimulationsTable({ simulations }: { simulations: SavedSimulation[] }) {
  const [selected, setSelected] = useState<string[]>([]);

  function toggle(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((s) => s !== id);
      if (prev.length >= MAX_COMPARE) return prev;
      return [...prev, id];
    });
  }

  const compared = simulations.filter((s) => selected.includes(s.id));

  return (
    <>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[var(--bg-elevated)] text-[var(--text-muted)]">
            <tr>
              <th className="px-4 py-2 w-10"></th>
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
                <td className="px-4 py-2">
                  <input
                    type="checkbox"
                    checked={selected.includes(sim.id)}
                    onChange={() => toggle(sim.id)}
                    disabled={!selected.includes(sim.id) && selected.length >= MAX_COMPARE}
                  />
                </td>
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

      <p className="mt-3 text-xs text-[var(--text-muted)]">
        Cochez jusqu&apos;à {MAX_COMPARE} lignes pour les comparer côte à côte.
      </p>

      {compared.length >= 2 && (
        <div className="card overflow-hidden mt-6">
          <div className="bg-gradient-to-r from-[var(--blue-strong)] to-[var(--blue-soft)] px-5 py-3">
            <h2 className="text-white font-semibold">Comparaison de scénarios</h2>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {compared.map((sim) => (
              <div key={sim.id} className="stat-tile">
                <p className="text-xs uppercase tracking-wide text-[var(--text-muted)] mb-1">
                  {sim.coin_symbol} · {FREQUENCY_LABELS[sim.frequency] ?? sim.frequency}
                </p>
                <p className="text-xl font-semibold text-[var(--gold)]">{eur.format(sim.final_capital)}</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Investi {eur.format(sim.invested)} · {sim.start_date} → {sim.end_date}
                </p>
                <p
                  className={`mt-2 text-sm font-semibold ${
                    sim.performance_pct >= 0 ? "text-[var(--success)]" : "text-[var(--danger)]"
                  }`}
                >
                  {sim.performance_pct >= 0 ? "+" : ""}
                  {sim.performance_pct.toFixed(2)} %
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

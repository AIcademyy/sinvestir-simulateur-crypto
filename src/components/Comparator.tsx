"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Coin, Frequency, SimulationResult } from "@/lib/types";

const FREQUENCY_OPTIONS: { value: Frequency; label: string }[] = [
  { value: "once", label: "Investissement unique" },
  { value: "daily", label: "Par jour" },
  { value: "weekly", label: "Par semaine" },
  { value: "monthly", label: "Par mois" },
];

const ASSET_COLORS = ["#2563eb", "#22c55e", "#a855f7", "#f04438"];
const MAX_ASSETS = 4;

const eur = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

function todayMinus(days: number): string {
  return new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
}

type ComparisonEntry = { coinId: string; color: string; result: SimulationResult | null; error?: string };

export default function Comparator() {
  const [coins, setCoins] = useState<Coin[]>([]);
  const [selected, setSelected] = useState<string[]>(["bitcoin", "ethereum"]);
  const [amount, setAmount] = useState(100);
  const [frequency, setFrequency] = useState<Frequency>("monthly");
  const [startDate, setStartDate] = useState(todayMinus(360));
  const [endDate, setEndDate] = useState(todayMinus(0));
  const [entries, setEntries] = useState<ComparisonEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/coins")
      .then((r) => r.json())
      .then((data) => setCoins(data.coins ?? []))
      .catch(() => {});
  }, []);

  function toggleCoin(coinId: string) {
    setSelected((prev) => {
      if (prev.includes(coinId)) return prev.filter((id) => id !== coinId);
      if (prev.length >= MAX_ASSETS) return prev;
      return [...prev, coinId];
    });
  }

  async function runComparison() {
    setLoading(true);
    const results = await Promise.all(
      selected.map(async (coinId, i) => {
        try {
          const r = await fetch("/api/simulate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ coinId, amount, frequency, startDate, endDate }),
          });
          const data = await r.json();
          if (!r.ok) throw new Error(data.error ?? "Erreur");
          return { coinId, color: ASSET_COLORS[i % ASSET_COLORS.length], result: data as SimulationResult };
        } catch (err) {
          return {
            coinId,
            color: ASSET_COLORS[i % ASSET_COLORS.length],
            result: null,
            error: err instanceof Error ? err.message : "Erreur",
          };
        }
      })
    );
    setEntries(results);
    setLoading(false);
  }

  // Merge each asset's series into one array of { date, [coinId]: value } for Recharts.
  const chartData = useMemo(() => {
    const byDate = new Map<string, Record<string, number | string>>();
    for (const entry of entries) {
      if (!entry.result) continue;
      for (const point of entry.result.series) {
        const row = byDate.get(point.date) ?? { date: point.date };
        row[entry.coinId] = point.value;
        byDate.set(point.date, row);
      }
    }
    return Array.from(byDate.values()).sort((a, b) => String(a.date).localeCompare(String(b.date)));
  }, [entries]);

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-4 mb-2">
          <span className="hidden sm:block flex-1 max-w-24 h-px bg-[var(--border)]" />
          <h1 className="text-2xl sm:text-3xl font-bold tracking-wide text-white">
            COMPARATEUR MULTI-ACTIFS
          </h1>
          <span className="hidden sm:block flex-1 max-w-24 h-px bg-[var(--border)]" />
        </div>
        <p className="text-[var(--blue)] font-medium">
          Comparez la performance de plusieurs cryptoactifs sur la même période
        </p>
      </div>

      <div className="mb-6">
        <div className="section-title">
          <h2 className="text-white font-semibold">Paramètres communs</h2>
        </div>
        <div className="flex flex-col gap-4">
          <div>
            <span className="font-medium text-white text-sm">
              Actifs à comparer ({selected.length}/{MAX_ASSETS})
            </span>
            <div className="mt-2 flex flex-wrap gap-2">
              {coins.slice(0, 20).map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleCoin(c.id)}
                  className={`text-xs px-3 py-1.5 rounded-full border ${
                    selected.includes(c.id)
                      ? "bg-[var(--blue)]/20 border-[var(--blue)] text-[var(--blue)]"
                      : "border-[var(--border)] text-[var(--text-muted)]"
                  }`}
                >
                  {c.symbol}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-white">Montant par versement (€)</span>
              <input
                type="number"
                min={1}
                className="input-field"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-white">Fréquence</span>
              <select
                className="input-field"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as Frequency)}
              >
                {FREQUENCY_OPTIONS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium text-white">Depuis</span>
                <input
                  type="date"
                  className="input-field"
                  value={startDate}
                  min={todayMinus(364)}
                  max={endDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium text-white">Jusqu&apos;au</span>
                <input
                  type="date"
                  className="input-field"
                  value={endDate}
                  min={startDate}
                  max={todayMinus(0)}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </label>
            </div>
          </div>

          <button
            type="button"
            onClick={runComparison}
            disabled={selected.length < 2 || loading}
            className="self-start rounded-lg bg-[var(--blue)] px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {loading ? "Calcul en cours…" : `Comparer ${selected.length} actifs`}
          </button>
          {selected.length < 2 && (
            <p className="text-xs text-[var(--text-muted)]">Sélectionnez au moins 2 actifs.</p>
          )}
        </div>
      </div>

      {entries.length > 0 && (
        <div>
          <div className="section-title">
            <h2 className="text-white font-semibold">Résultats comparés</h2>
          </div>
          <div>
            <div className="h-72 mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fill: "var(--text-muted)", fontSize: 11 }} minTickGap={30} />
                  <YAxis
                    tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                    tickFormatter={(v) => `${Math.round(v / 1000)}k€`}
                    width={50}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      color: "var(--text)",
                    }}
                    formatter={(value, name) => [
                      eur.format(Number(value)),
                      entries.find((e) => e.coinId === name)?.result?.coin.symbol ?? String(name),
                    ]}
                  />
                  <Legend
                    formatter={(value) => entries.find((e) => e.coinId === value)?.result?.coin.symbol ?? value}
                  />
                  {entries.map(
                    (entry) =>
                      entry.result && (
                        <Line
                          key={entry.coinId}
                          type="monotone"
                          dataKey={entry.coinId}
                          stroke={entry.color}
                          strokeWidth={2}
                          dot={false}
                          connectNulls
                        />
                      )
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>

            <table className="w-full text-sm">
              <thead className="text-[var(--text-muted)] text-left">
                <tr>
                  <th className="py-2">Actif</th>
                  <th className="py-2 text-right">Investi</th>
                  <th className="py-2 text-right">Capital final</th>
                  <th className="py-2 text-right">Performance</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.coinId} className="border-t border-[var(--border)]">
                    <td className="py-2 font-medium text-white flex items-center gap-2">
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-full"
                        style={{ background: entry.color }}
                      />
                      {entry.result?.coin.symbol ?? entry.coinId}
                    </td>
                    {entry.result ? (
                      <>
                        <td className="py-2 text-right text-white">{eur.format(entry.result.invested)}</td>
                        <td className="py-2 text-right text-[var(--success)]">
                          {eur.format(entry.result.finalCapital)}
                        </td>
                        <td
                          className={`py-2 text-right ${
                            entry.result.performancePct >= 0 ? "text-[var(--success)]" : "text-[var(--danger)]"
                          }`}
                        >
                          {entry.result.performancePct >= 0 ? "+" : ""}
                          {entry.result.performancePct.toFixed(2)} %
                        </td>
                      </>
                    ) : (
                      <td colSpan={3} className="py-2 text-right text-[var(--danger)] text-xs">
                        {entry.error}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

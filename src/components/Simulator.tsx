"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
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

const eur = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });
const num = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 8 });

function todayMinus(days: number): string {
  return new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
}

export default function Simulator({ embedded = false }: { embedded?: boolean }) {
  const [coins, setCoins] = useState<Coin[]>([]);
  const [coinId, setCoinId] = useState("bitcoin");
  const [amount, setAmount] = useState(100);
  const [frequency, setFrequency] = useState<Frequency>("monthly");
  const [startDate, setStartDate] = useState(todayMinus(360));
  const [endDate, setEndDate] = useState(todayMinus(0));
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/coins")
      .then((r) => r.json())
      .then((data) => setCoins(data.coins ?? []))
      .catch(() => setError("Impossible de charger la liste des actifs."));
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setLoading(true);
      setError(null);
    }, 0);

    fetch("/api/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coinId, amount, frequency, startDate, endDate }),
      signal: controller.signal,
    })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error ?? "Erreur de simulation");
        setResult(data);
      })
      .catch((err) => {
        if (err.name !== "AbortError") setError(err.message);
      })
      .finally(() => setLoading(false));

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [coinId, amount, frequency, startDate, endDate]);

  const selectedCoin = useMemo(
    () => coins.find((c) => c.id === coinId),
    [coins, coinId]
  );

  const investedShare = result && result.finalCapital > 0
    ? Math.min(100, (result.invested / Math.max(result.finalCapital, result.invested)) * 100)
    : 0;

  return (
    <div className={embedded ? "w-full" : "w-full max-w-5xl mx-auto"}>
      {!embedded && (
        <div className="mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-semibold text-white">
            SIMULATEUR CRYPTO-MONNAIE
          </h1>
          <p className="mt-2 text-[var(--blue)] font-medium">
            Estimez la performance d&apos;un investissement en cryptoactifs sur données historiques
          </p>
          <p className="mt-2 text-sm text-[var(--text-muted)] max-w-2xl mx-auto">
            Cet outil s&apos;appuie exclusivement sur des données de marché passées. Il s&apos;agit
            d&apos;un outil pédagogique : les performances passées ne préjugent pas des performances
            futures, et les cryptoactifs sont des actifs très volatils.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
        <div className="card overflow-hidden">
          <div className="bg-gradient-to-r from-[var(--blue-strong)] to-[var(--blue-soft)] px-5 py-3">
            <h2 className="text-white font-semibold">Simulation</h2>
          </div>
          <div className="p-5 flex flex-col gap-4">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-white">Actif numérique</span>
              <select
                className="input-field"
                value={coinId}
                onChange={(e) => setCoinId(e.target.value)}
              >
                {coins.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.symbol})
                  </option>
                ))}
              </select>
            </label>

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

            <div className="grid grid-cols-2 gap-3">
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
            <p className="text-xs text-[var(--text-muted)]">
              Historique limité aux 365 derniers jours (plan gratuit CoinGecko).
            </p>
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="bg-gradient-to-r from-[var(--blue-strong)] to-[var(--blue-soft)] px-5 py-3">
            <h2 className="text-white font-semibold">Vos résultats</h2>
          </div>

          <div className="p-5">
            {error && (
              <p className="text-[var(--danger)] text-sm mb-4">{error}</p>
            )}

            {result && (
              <>
                <div className="stat-tile mb-4">
                  <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">
                    Capital final
                  </p>
                  <p className="text-2xl font-semibold text-[var(--gold)]">
                    {eur.format(result.finalCapital)}
                  </p>
                  <div className="mt-3 h-2 rounded-full bg-[var(--bg)] overflow-hidden flex">
                    <div
                      className="h-full bg-[var(--blue)]"
                      style={{ width: `${investedShare}%` }}
                    />
                    <div
                      className="h-full bg-[var(--gold)]"
                      style={{ width: `${100 - investedShare}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-[var(--text-muted)]">
                    Somme investie {eur.format(result.invested)} · Intérêts/gains{" "}
                    {eur.format(result.finalCapital - result.invested)}
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
                  <div className="stat-tile">
                    <p className="text-xs text-[var(--text-muted)]">Investi</p>
                    <p className="text-lg font-semibold text-white">
                      {eur.format(result.invested)}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      en {result.contributions} versement{result.contributions > 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="stat-tile">
                    <p className="text-xs text-[var(--text-muted)]">Acquis</p>
                    <p className="text-lg font-semibold text-white">
                      {num.format(result.acquired)} {result.coin.symbol}
                    </p>
                  </div>
                  <div className="stat-tile">
                    <p className="text-xs text-[var(--text-muted)]">Prix moyen d&apos;acquisition</p>
                    <p className="text-lg font-semibold text-white">
                      {eur.format(result.avgPrice)}
                    </p>
                  </div>
                  <div className="stat-tile">
                    <p className="text-xs text-[var(--text-muted)]">Prix final</p>
                    <p className="text-lg font-semibold text-white">
                      {eur.format(result.finalPrice)}
                    </p>
                  </div>
                  <div className="stat-tile col-span-2 sm:col-span-1">
                    <p className="text-xs text-[var(--text-muted)]">Performance</p>
                    <p
                      className={`text-lg font-semibold ${
                        result.performancePct >= 0 ? "text-[var(--success)]" : "text-[var(--danger)]"
                      }`}
                    >
                      {result.performancePct >= 0 ? "+" : ""}
                      {result.performancePct.toFixed(2)} %
                    </p>
                  </div>
                </div>

                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={result.series}>
                      <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                        minTickGap={30}
                      />
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
                          name === "invested" ? "Investi" : "Valeur du portefeuille",
                        ]}
                      />
                      <Line
                        type="monotone"
                        dataKey="invested"
                        stroke="var(--blue)"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="var(--gold)"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}

            {loading && !result && (
              <p className="text-sm text-[var(--text-muted)]">Calcul en cours…</p>
            )}
          </div>
        </div>
      </div>

      {!embedded && selectedCoin && (
        <p className="mt-4 text-center text-xs text-[var(--text-muted)]">
          Données de marché historiques fournies par CoinGecko. Simulation à but pédagogique,
          ne constitue pas un conseil en investissement.
        </p>
      )}
    </div>
  );
}

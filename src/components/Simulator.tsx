"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import AssetSearch from "@/components/AssetSearch";
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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [coin, setCoin] = useState<Coin>({
    id: searchParams.get("coin") || "bitcoin",
    symbol: searchParams.get("symbol") || "BTC",
    name: searchParams.get("name") || "Bitcoin",
    image: "",
  });
  const [amount, setAmount] = useState(Number(searchParams.get("amount")) || 100);
  const [frequency, setFrequency] = useState<Frequency>(
    (searchParams.get("freq") as Frequency) || "monthly"
  );
  const [startDate, setStartDate] = useState(searchParams.get("from") || todayMinus(360));
  const [endDate, setEndDate] = useState(searchParams.get("to") || todayMinus(0));
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [reportStatus, setReportStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setLoading(true);
      setError(null);
    }, 0);

    fetch("/api/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        coinId: coin.id,
        coinSymbol: coin.symbol,
        coinName: coin.name,
        amount,
        frequency,
        startDate,
        endDate,
      }),
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
  }, [coin, amount, frequency, startDate, endDate]);

  // Keep the URL in sync so the current simulation is shareable as a link.
  useEffect(() => {
    const params = new URLSearchParams({
      coin: coin.id,
      symbol: coin.symbol,
      name: coin.name,
      amount: String(amount),
      freq: frequency,
      from: startDate,
      to: endDate,
    });
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [coin, amount, frequency, startDate, endDate, pathname, router]);

  async function copyShareLink() {
    await navigator.clipboard.writeText(window.location.href);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }

  // Persist + emit an automation event once the user settles on a result,
  // rather than on every keystroke while they're still tweaking inputs.
  useEffect(() => {
    if (!result) return;
    const timer = setTimeout(() => {
      fetch("/api/simulations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...result, frequency, startDate, endDate }),
      }).catch(() => {});
    }, 1200);
    return () => clearTimeout(timer);
  }, [result, frequency, startDate, endDate]);

  async function sendReport() {
    if (!result || !email) return;
    setReportStatus("sending");
    try {
      const r = await fetch("/api/simulations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...result, frequency, startDate, endDate, leadEmail: email }),
      });
      if (!r.ok) throw new Error();
      setReportStatus("sent");
    } catch {
      setReportStatus("error");
    }
  }

  const investedShare = result && result.finalCapital > 0
    ? Math.min(100, (result.invested / Math.max(result.finalCapital, result.invested)) * 100)
    : 0;

  return (
    <div className={embedded ? "w-full" : "w-full max-w-5xl mx-auto"}>
      {!embedded && (
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-4 mb-2">
            <span className="hidden sm:block flex-1 max-w-24 h-px bg-[var(--border)]" />
            <h1 className="text-2xl sm:text-3xl font-bold tracking-wide text-white">
              SIMULATEUR CRYPTO-MONNAIE
            </h1>
            <span className="hidden sm:block flex-1 max-w-24 h-px bg-[var(--border)]" />
          </div>
          <p className="text-[var(--blue)] font-medium">
            Estimez la performance d&apos;un investissement en cryptoactifs sur données historiques
          </p>
          <p className="mt-2 text-sm text-[var(--text-muted)] max-w-2xl mx-auto">
            Comment un investissement en crypto-monnaie aurait évolué dans le temps ? Grâce au
            simulateur S&apos;investir Crypto, projetez la valeur d&apos;un placement unique ou
            programmé selon vos paramètres.
          </p>
          <div className="card mt-5 max-w-2xl mx-auto px-4 py-3 flex items-start gap-3 text-left">
            <span className="text-[var(--blue)] mt-0.5">ⓘ</span>
            <p className="text-xs text-[var(--text-muted)]">
              Cet outil a uniquement une vocation pédagogique et illustrative. Il s&apos;appuie sur
              des données de marché historiques et ne constitue ni un conseil en investissement, ni
              une prévision de performance, ni une recommandation de placement. Les cryptoactifs
              sont des actifs très volatils.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
        <div>
          <div className="section-title">
            <h2 className="text-white font-semibold">Simulation</h2>
          </div>
          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-white">Actif numérique</span>
              <AssetSearch value={coin} onSelect={setCoin} />
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

        <div>
          <div className="section-title">
            <h2 className="text-white font-semibold">Vos résultats</h2>
          </div>

          <div>
            {error && (
              <p className="text-[var(--danger)] text-sm mb-4">{error}</p>
            )}

            {result && (
              <>
                <div className="stat-tile mb-4">
                  <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">
                    Capital final
                  </p>
                  <p className="text-2xl font-semibold text-white">
                    {eur.format(result.finalCapital)}
                  </p>
                  <div className="mt-3 h-2 rounded-full bg-[var(--bg)] overflow-hidden flex">
                    <div
                      className="h-full bg-[var(--blue)]"
                      style={{ width: `${investedShare}%` }}
                    />
                    <div
                      className="h-full bg-[var(--success)]"
                      style={{ width: `${100 - investedShare}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-[var(--text-muted)]">
                    Somme investie {eur.format(result.invested)} ·{" "}
                    <span className="text-[var(--success)]">
                      Gains nets {eur.format(result.finalCapital - result.invested)}
                    </span>
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
                        stroke="var(--success)"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-6 pt-5 border-t border-[var(--border)]">
                  <div className="flex flex-col sm:flex-row gap-2 mb-3">
                    <input
                      type="email"
                      placeholder="votre@email.com"
                      className="input-field flex-1"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setReportStatus("idle");
                      }}
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={sendReport}
                      disabled={!email || reportStatus === "sending"}
                      className="btn-pill btn-pill-solid disabled:opacity-50"
                    >
                      {reportStatus === "sending" ? "Envoi…" : "Recevoir mon rapport par email"}
                    </button>
                    <button
                      type="button"
                      onClick={copyShareLink}
                      className="btn-pill btn-pill-outline"
                    >
                      {linkCopied ? "Lien copié !" : "Partager cette simulation"}
                    </button>
                  </div>
                  <p className="mt-2 text-[11px] text-[var(--text-muted)]">
                    Sur votre espace client S&apos;investir, ce champ serait pré-rempli avec
                    l&apos;email de votre compte.
                  </p>
                </div>
                {reportStatus === "sent" && (
                  <p className="mt-2 text-xs text-[var(--success)]">
                    Demande envoyée — vous recevrez votre rapport par email.
                  </p>
                )}
                {reportStatus === "error" && (
                  <p className="mt-2 text-xs text-[var(--danger)]">
                    Échec de l&apos;envoi, réessayez.
                  </p>
                )}
              </>
            )}

            {loading && !result && (
              <p className="text-sm text-[var(--text-muted)]">Calcul en cours…</p>
            )}
          </div>
        </div>
      </div>

      {embedded && (
        <p className="mt-4 text-center text-xs text-[var(--text-muted)]">
          Données de marché historiques fournies par CoinGecko. Simulation à but pédagogique,
          ne constitue pas un conseil en investissement.
        </p>
      )}
    </div>
  );
}

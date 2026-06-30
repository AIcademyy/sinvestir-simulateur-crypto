import SimulatorCard from "@/components/SimulatorCard";
import SuiteShell from "@/components/SuiteShell";

/**
 * Mirrors the real "Les simulateurs" hub on simulateurs.sinvestir.fr: a grid
 * of cards, one per tool. The existing tools are reproduced here as disabled
 * placeholders purely so the demo looks like the real product — only
 * "Simulateur Crypto-monnaie" is the actual deliverable. In a real
 * integration, S'investir would just drop that one card (and its target
 * page) into their existing grid; see the README.
 */
export default function SimulateursPage() {
  return (
    <SuiteShell>
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-semibold text-white mb-1">Les simulateurs</h1>
        <p className="text-sm text-[var(--text-muted)] mb-8">
          Avec les simulateurs S&apos;investir, passez de l&apos;idée à l&apos;action : créez,
          simulez, investissez.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <SimulatorCard
            icon="₿"
            title="Simulateur Crypto-monnaie"
            description="Estimez la performance d'un investissement en cryptoactifs sur données historiques."
            href="/simulateur-crypto"
            highlight
          />
          <SimulatorCard
            icon="📈"
            title="Simulateur d'intérêts composés"
            description="Calculez combien un investissement peut vous rapporter au fil du temps."
          />
          <SimulatorCard
            icon="📉"
            title="Simulateur d'inflation"
            description="Calculez l'évolution de votre pouvoir d'achat net d'inflation."
          />
          <SimulatorCard
            icon="💸"
            title="Simulateur impact des frais"
            description="Calculez à quel point les frais impactent réellement vos placements."
          />
          <SimulatorCard
            icon="🏠"
            title="Simulateur crédit immobilier"
            description="Calculez simplement le coût de votre crédit immobilier."
          />
          <SimulatorCard
            icon="🔥"
            title="Simulateur F.I.R.E"
            description={'Calculez l’âge auquel vous pourriez être "F.I.R.E" (retraite anticipée).'}
          />
          <SimulatorCard
            icon="📊"
            title="Simulateur Coût par ordre (PEA)"
            description="Calculez et comparez simplement le coût par ordre sur un PEA chez les principaux courtiers du marché."
          />
        </div>
      </div>
    </SuiteShell>
  );
}

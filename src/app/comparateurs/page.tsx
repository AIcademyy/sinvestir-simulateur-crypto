import SimulatorCard from "@/components/SimulatorCard";
import SuiteShell from "@/components/SuiteShell";

/**
 * Same logic as the simulateurs hub (src/app/page.tsx): replicates the real
 * "Les comparateurs" grid so the demo is faithful, with only the crypto
 * card being a real, working deliverable.
 *
 * Note: S'investir's real grid already has a "Comparateur Crypto" card for
 * choosing a crypto *exchange*. Ours compares the *performance* of several
 * assets, which is a different job — named distinctly here on purpose to
 * avoid implying it replaces their existing tool.
 */
export default function ComparateursPage() {
  return (
    <SuiteShell>
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-semibold text-white mb-1">Les comparateurs</h1>
        <p className="text-sm text-[var(--text-muted)] mb-8">
          Avec les comparateurs S&apos;investir, comparez les meilleures offres du marché.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <SimulatorCard
            icon="₿"
            title="Comparateur de performance crypto"
            description="Comparez la performance de plusieurs cryptoactifs sur une même période et un même montant investi."
            href="/comparateur-crypto"
            highlight
          />
          <SimulatorCard
            icon="📋"
            title="Comparateur PEA"
            description="Quel courtier choisir pour ouvrir votre PEA ? Analyse des meilleures offres du marché selon plus de 40 critères."
          />
          <SimulatorCard
            icon="📋"
            title="Comparateur Compte-titres"
            description="Quel courtier choisir pour ouvrir un compte-titres ? Analyse selon les frais, les produits, les services et la qualité globale."
          />
          <SimulatorCard
            icon="📋"
            title="Comparateur Assurances-vie"
            description="Quelle assurance-vie choisir ? Analyse des meilleures offres selon les frais, les fonds euros et la qualité de service."
          />
          <SimulatorCard
            icon="📋"
            title="Comparateur PER"
            description="Quel PER choisir ? Analyse des offres selon les frais, les fonds euros, les unités de compte et la qualité globale."
          />
          <SimulatorCard
            icon="📋"
            title="Comparateur SCPI"
            description="Quelles SCPI choisir ? Identification des SCPI les plus performantes pour maximiser votre rendement."
          />
          <SimulatorCard
            icon="📋"
            title="Comparateur Crypto"
            description="Quelle plateforme de crypto-actifs choisir ? Analyse selon l'accessibilité, les fonctionnalités, les frais et la sécurité."
          />
        </div>
      </div>
    </SuiteShell>
  );
}

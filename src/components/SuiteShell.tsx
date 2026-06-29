const NAV_ITEMS = [
  { label: "Tableau de bord", active: false },
  { label: "Les simulateurs", active: true },
  { label: "Mes simulations", active: false },
];

export default function SuiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="hidden lg:flex w-64 flex-col justify-between border-r border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-6">
        <div>
          <div className="flex items-center gap-2 px-2 mb-8">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--blue)] font-bold text-white">
              S
            </span>
            <span className="text-sm font-semibold tracking-wide text-white">
              SIMULATEURS
            </span>
          </div>
          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <span
                key={item.label}
                className={`rounded-lg px-3 py-2 text-sm font-medium ${
                  item.active
                    ? "bg-[var(--blue)]/15 text-[var(--blue)]"
                    : "text-[var(--text-muted)]"
                }`}
              >
                {item.label}
              </span>
            ))}
          </nav>
        </div>
        <span className="px-3 text-xs text-[var(--text-muted)]">Gérer mon compte</span>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
          <span className="lg:hidden flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--blue)] font-bold text-white text-sm">
              S
            </span>
            <span className="text-sm font-semibold text-white">SIMULATEURS</span>
          </span>
          <span />
          <a
            href="https://sinvestir.fr"
            className="text-sm font-medium text-[var(--blue)] hover:underline"
          >
            Découvrir S&apos;investir →
          </a>
        </header>
        <main className="flex-1 px-4 sm:px-6 py-10">{children}</main>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { label: "Tableau de bord", href: "/", disabled: true },
  { label: "Les simulateurs", href: "/" },
  { label: "Les comparateurs", href: "/comparateur" },
  { label: "Mes simulations", href: "/mes-simulations" },
];

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className="flex h-9 w-9 items-center justify-center rounded-lg text-lg font-bold"
        style={{ color: "var(--logo-gold)", border: "1px solid var(--logo-gold)" }}
      >
        S
      </span>
      <div className="leading-none">
        <p className="text-[10px] tracking-[0.25em] text-[var(--text-muted)]">S&apos;INVESTIR</p>
        <p className="text-sm font-semibold tracking-wide text-white">SIMULATEURS</p>
      </div>
    </div>
  );
}

export default function SuiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen">
      <aside className="hidden lg:flex w-64 flex-col justify-between border-r border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-6">
        <div>
          <div className="flex items-center gap-2.5 px-2 mb-8">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-white"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
            >
              ?
            </span>
            <div className="leading-tight">
              <p className="text-sm font-medium text-white">Visiteur</p>
              <p className="text-[11px] text-[var(--text-muted)]">mode démo, sans compte</p>
            </div>
          </div>

          <div className="px-2 mb-6">
            <Logo />
          </div>

          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const active = item.href === pathname;
              if (item.disabled) {
                return (
                  <span
                    key={item.label}
                    className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--text-muted)] opacity-50 cursor-not-allowed"
                  >
                    {item.label}
                  </span>
                );
              }
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`rounded-lg px-3 py-2 text-sm font-medium ${
                    active
                      ? "bg-[var(--blue)]/15 text-[var(--blue)]"
                      : "text-[var(--text-muted)] hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex flex-col gap-1 px-1 text-xs text-[var(--text-muted)]">
          <span className="px-2 py-1.5">Gérer mon compte</span>
          <span className="px-2 py-1.5">Faire une suggestion</span>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
          <span className="lg:hidden">
            <Logo />
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

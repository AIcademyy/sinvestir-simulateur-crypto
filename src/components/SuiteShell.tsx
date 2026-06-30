"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV_ITEMS = [
  { label: "Tableau de bord", href: null },
  { label: "Les simulateurs", href: "/", match: ["/", "/simulateur-crypto"] },
  { label: "Les comparateurs", href: "/comparateurs", match: ["/comparateurs", "/comparateur-crypto"] },
  { label: "Mes simulations", href: "/mes-simulations", match: ["/mes-simulations"] },
  { label: "Formation offerte", href: null },
];

function Logo() {
  return (
    <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
      <span
        className="flex h-7 w-7 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg text-sm sm:text-lg font-bold"
        style={{ color: "var(--logo-gold)", border: "1px solid var(--logo-gold)" }}
      >
        S
      </span>
      <div className="leading-none min-w-0">
        <p className="hidden sm:block text-[10px] tracking-[0.25em] text-[var(--text-muted)]">
          S&apos;INVESTIR
        </p>
        <p className="text-xs sm:text-sm font-semibold tracking-wide text-white truncate">
          SIMULATEURS
        </p>
      </div>
    </div>
  );
}

function SidebarContent({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <>
      <div>
        <div className="flex items-center gap-2.5 px-2 mb-6">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-white"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
          >
            H
          </span>
          <div className="leading-tight">
            <p className="text-sm font-medium text-white">Hugo</p>
            <p className="text-[11px] text-[var(--text-muted)]">contact.hugo.com</p>
          </div>
        </div>

        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const active = item.match?.includes(pathname) ?? false;
            if (!item.href) {
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
                onClick={onNavigate}
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

      <div className="flex flex-col gap-2 px-1">
        <span className="px-2 py-1 text-xs text-[var(--text-muted)] cursor-default">
          Gérer mon compte
        </span>
        <span className="px-2 py-1 text-xs text-[var(--text-muted)] cursor-default">
          Faire une suggestion
        </span>
        <button
          type="button"
          className="btn-pill mt-2 w-full text-white"
          style={{
            background: "linear-gradient(180deg, var(--logout-from), var(--logout-to))",
          }}
        >
          Déconnexion
        </button>
      </div>
    </>
  );
}

export default function SuiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen p-2 sm:p-5 gap-2 sm:gap-5">
      <aside
        className="hidden lg:flex w-64 shrink-0 sticky top-5 h-[calc(100vh-2.5rem)] flex-col justify-between rounded-2xl px-4 py-6 shadow-xl"
        style={{
          background: "linear-gradient(180deg, var(--sidebar-from) 0%, var(--sidebar-to) 100%)",
          border: "1px solid var(--border)",
        }}
      >
        <SidebarContent pathname={pathname} />
      </aside>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
          />
          <aside
            className="relative z-10 w-72 max-w-[80vw] flex flex-col justify-between rounded-r-2xl px-4 py-6 shadow-2xl"
            style={{
              background: "linear-gradient(180deg, var(--sidebar-from) 0%, var(--sidebar-to) 100%)",
              borderRight: "1px solid var(--border)",
            }}
          >
            <SidebarContent pathname={pathname} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between gap-2 px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Ouvrir le menu"
              className="lg:hidden flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-lg text-white"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
            >
              ⋮
            </button>
            <Logo />
          </div>
          <a
            href="https://sinvestir.fr"
            className="shrink-0 text-xs sm:text-sm font-medium text-[var(--blue)] hover:underline whitespace-nowrap"
          >
            <span className="sm:hidden">S&apos;investir →</span>
            <span className="hidden sm:inline">Découvrir S&apos;investir →</span>
          </a>
        </header>
        <main className="flex-1 px-4 sm:px-6 py-10">{children}</main>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import { Lexend } from "next/font/google";
import "./globals.css";

const lexend = Lexend({
  variable: "--font-lexend",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Simulateur Crypto-monnaie | S'investir Simulateurs",
  description:
    "Simulez un investissement unique ou un DCA (achat programmé) sur Bitcoin, Ethereum et d'autres cryptoactifs, à partir de données de marché historiques.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${lexend.variable} h-full dark`}>
      <body className="min-h-full flex flex-col bg-[var(--bg)] text-[var(--text)] font-sans antialiased">
        {children}
      </body>
    </html>
  );
}

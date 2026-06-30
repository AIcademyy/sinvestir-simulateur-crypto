import Link from "next/link";

interface SimulatorCardProps {
  icon: string;
  title: string;
  description: string;
  href?: string;
  highlight?: boolean;
}

export default function SimulatorCard({ icon, title, description, href, highlight }: SimulatorCardProps) {
  const content = (
    <div
      className={`card p-6 h-full transition-colors ${
        href ? "hover:border-[var(--blue)] cursor-pointer" : "opacity-50 cursor-not-allowed"
      } ${highlight ? "border-[var(--blue)]" : ""}`}
    >
      {highlight && (
        <span className="inline-block mb-3 text-[10px] font-semibold tracking-wide text-[var(--blue)] bg-[var(--blue)]/15 rounded-full px-2.5 py-1">
          NOUVEAU
        </span>
      )}
      <div className="w-11 h-11 rounded-full border border-[var(--border)] flex items-center justify-center text-lg mb-4">
        {icon}
      </div>
      <h3 className="text-white font-semibold mb-2">{title}</h3>
      <p className="text-sm text-[var(--text-muted)]">{description}</p>
    </div>
  );

  if (!href) return content;

  return <Link href={href}>{content}</Link>;
}

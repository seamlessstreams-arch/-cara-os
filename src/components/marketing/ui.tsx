// ══════════════════════════════════════════════════════════════════════════════
// CARA — SHARED MARKETING UI PRIMITIVES
// Reused across the public pages (/, /security, /about). Server components.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export function PrimaryButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--cs-navy)] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[var(--cs-navy-soft)] hover:shadow-md"
    >
      {children}
    </Link>
  );
}

export function GhostButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--cs-border)] bg-white/70 px-5 py-3 text-sm font-semibold text-[var(--cs-navy)] transition-colors hover:bg-white"
    >
      {children}
    </Link>
  );
}

export function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block rounded-full border border-[var(--cs-teal-soft)] bg-[var(--cs-teal-bg)] px-3 py-1 text-xs font-bold uppercase tracking-wider text-[var(--cs-teal-strong)]">
      {children}
    </span>
  );
}

export function FeatureCard({ Icon, title, body, accent }: { Icon: LucideIcon; title: string; body: string; accent: "teal" | "gold" | "navy" }) {
  const ring = accent === "teal" ? "bg-[var(--cs-teal-bg)] text-[var(--cs-teal-strong)]" : accent === "gold" ? "bg-[var(--cs-cara-gold-bg)] text-[var(--cs-cara-gold)]" : "bg-[var(--cs-navy)]/5 text-[var(--cs-navy)]";
  return (
    <div className="group rounded-2xl border border-[var(--cs-border)] bg-white p-6 shadow-[var(--cs-shadow-card)] transition-transform hover:-translate-y-0.5">
      <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${ring}`}>
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-base font-bold text-[var(--cs-navy)]">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-[var(--cs-text-secondary)]">{body}</p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — SHARED MARKETING HEADER
// Used across /, /security, /about. Hash links are absolute (/#…) so they work
// from any page. Server component; the mobile menu is the only client bit.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { MobileMenu } from "@/components/marketing/mobile-menu";

const NAV = [
  { href: "/#how", label: "How it works" },
  { href: "/product/intelligence", label: "Intelligence" },
  { href: "/product/workforce", label: "Workforce" },
  { href: "/security", label: "Security" },
  { href: "/#pricing", label: "Pricing" },
];

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--cs-border)]/70 bg-[var(--cs-bg)]/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5">
        <Link href="/" className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon-192.png" alt="Cornerstone" className="h-9 w-9 rounded-xl" />
          <span className="flex items-baseline gap-1.5">
            <span className="text-lg font-extrabold tracking-tight text-[var(--cs-navy)]">Cornerstone</span>
            <span className="rounded-md bg-[var(--cs-navy)]/5 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--cs-teal-strong)]">Care OS</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-[var(--cs-text-secondary)] lg:flex">
          {NAV.map((l) => (
            <a key={l.href} href={l.href} className="hover:text-[var(--cs-navy)]">{l.label}</a>
          ))}
        </nav>
        <div className="flex items-center gap-2.5">
          <Link href="/dashboard" className="hidden text-sm font-semibold text-[var(--cs-navy)] hover:text-[var(--cs-teal-strong)] sm:inline">Sign in</Link>
          <Link
            href="/#contact"
            className="hidden items-center justify-center gap-2 rounded-xl bg-[var(--cs-navy)] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[var(--cs-navy-soft)] hover:shadow-md sm:inline-flex"
          >
            Book a demo
          </Link>
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}

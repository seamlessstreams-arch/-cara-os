// ══════════════════════════════════════════════════════════════════════════════
// CARA — SHARED MARKETING HEADER
// Midnight glass bar — the night-world chrome every public page shares. Hash
// links are absolute (/#…) so they work from any page. Server component; the
// mobile menu is the only client bit.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { MobileMenu } from "@/components/marketing/mobile-menu";

const NAV = [
  { href: "/#layers", label: "Intelligence" },
  { href: "/product/safeguarding", label: "Safeguarding" },
  { href: "/product/compliance", label: "Compliance" },
  { href: "/product/workforce", label: "Workforce" },
  { href: "/product/tour", label: "Tour" },
  { href: "/security", label: "Security" },
  { href: "/pricing", label: "Pricing" },
];

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-[#0a1020]/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3">
        <Link href="/" className="group flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon-192.png" alt="Cara" className="h-9 w-9 rounded-xl ring-1 ring-white/10 transition-transform duration-300 group-hover:scale-105" />
          <span className="flex items-baseline gap-2">
            <span className="text-lg font-extrabold tracking-tight text-white">Cara</span>
            <span className="hidden rounded-md border border-white/10 bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-teal-300/90 sm:inline">
              Care Intelligence OS
            </span>
          </span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm font-medium text-slate-300 lg:flex">
          {NAV.map((l) => (
            <a key={l.href} href={l.href} className="mk-navlink transition-colors hover:text-white">{l.label}</a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="hidden text-sm font-semibold text-slate-300 transition-colors hover:text-white sm:inline">Sign in</Link>
          <Link
            href="/contact"
            className="hidden items-center justify-center gap-2 rounded-xl bg-[var(--cs-cara-gold)] px-5 py-2.5 text-sm font-bold text-[#0a1020] shadow-[0_0_24px_rgba(200,155,60,0.25)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_36px_rgba(200,155,60,0.4)] sm:inline-flex"
          >
            Book a Demo
          </Link>
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}

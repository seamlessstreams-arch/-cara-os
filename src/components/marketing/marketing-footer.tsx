// ══════════════════════════════════════════════════════════════════════════════
// CARA — SHARED MARKETING FOOTER
// Used across /, /security, /about. Server component.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export function MarketingFooter() {
  return (
    <footer className="border-t border-[var(--cs-border)] bg-white">
      <div className="mx-auto max-w-7xl px-5 py-12">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-xs">
            <Link href="/" className="flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icon-192.png" alt="Cara" className="h-9 w-9 rounded-xl" />
              <span className="text-lg font-extrabold tracking-tight text-[var(--cs-navy)]">Cara <span className="text-[var(--cs-teal-strong)]">Care Intelligence OS</span></span>
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-[var(--cs-text-muted)]">The Care Intelligence OS for children&rsquo;s homes. Cara turns everyday residential care into live safeguarding intelligence.</p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--cs-text-gentle)]">Platform</p>
              <ul className="mt-3 space-y-2 text-sm text-[var(--cs-text-secondary)]">
                <li><a href="/#layers" className="hover:text-[var(--cs-navy)]">Intelligence layers</a></li>
                <li><Link href="/product/safeguarding" className="hover:text-[var(--cs-navy)]">Safeguarding</Link></li>
                <li><Link href="/product/compliance" className="hover:text-[var(--cs-navy)]">Compliance</Link></li>
                <li><Link href="/product/intelligence" className="hover:text-[var(--cs-navy)]">Practice intelligence</Link></li>
                <li><Link href="/product/workforce" className="hover:text-[var(--cs-navy)]">Workforce</Link></li>
                <li><Link href="/product/tour" className="hover:text-[var(--cs-navy)]">Product tour</Link></li>
                <li><Link href="/pricing" className="hover:text-[var(--cs-navy)]">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--cs-text-gentle)]">Company</p>
              <ul className="mt-3 space-y-2 text-sm text-[var(--cs-text-secondary)]">
                <li><Link href="/about" className="hover:text-[var(--cs-navy)]">About</Link></li>
                <li><Link href="/product/workforce" className="hover:text-[var(--cs-navy)]">Cara People</Link></li>
                <li><Link href="/contact" className="hover:text-[var(--cs-navy)]">Contact</Link></li>
                <li><Link href="/dashboard" className="hover:text-[var(--cs-navy)]">Sign in</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--cs-text-gentle)]">Trust &amp; legal</p>
              <ul className="mt-3 space-y-2 text-sm text-[var(--cs-text-secondary)]">
                <li><Link href="/security" className="hover:text-[var(--cs-navy)]">Security &amp; trust</Link></li>
                <li><Link href="/privacy" className="hover:text-[var(--cs-navy)]">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-[var(--cs-navy)]">Terms</Link></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-[var(--cs-border)] pt-6 text-xs text-[var(--cs-text-muted)] sm:flex-row">
          <p>© 2026 Cara OS. All rights reserved.</p>
          <p className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-[var(--cs-teal)]" /> Safeguarding-first. Human-in-the-loop. Always.</p>
        </div>
      </div>
    </footer>
  );
}

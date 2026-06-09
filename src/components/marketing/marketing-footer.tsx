// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — SHARED MARKETING FOOTER
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
              <img src="/icon-192.png" alt="Cornerstone" className="h-9 w-9 rounded-xl" />
              <span className="text-lg font-extrabold tracking-tight text-[var(--cs-navy)]">Cornerstone <span className="text-[var(--cs-teal-strong)]">Care OS</span></span>
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-[var(--cs-text-muted)]">The operating system for children&rsquo;s residential care. Capture once. Surface everywhere.</p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--cs-text-gentle)]">Product</p>
              <ul className="mt-3 space-y-2 text-sm text-[var(--cs-text-secondary)]">
                <li><a href="/#how" className="hover:text-[var(--cs-navy)]">How it works</a></li>
                <li><a href="/#intelligence" className="hover:text-[var(--cs-navy)]">ARIA intelligence</a></li>
                <li><a href="/#features" className="hover:text-[var(--cs-navy)]">Features</a></li>
                <li><a href="/#workforce" className="hover:text-[var(--cs-navy)]">Workforce</a></li>
                <li><a href="/#pricing" className="hover:text-[var(--cs-navy)]">Pricing</a></li>
                <li><Link href="/dashboard" className="hover:text-[var(--cs-navy)]">Platform</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--cs-text-gentle)]">Trust</p>
              <ul className="mt-3 space-y-2 text-sm text-[var(--cs-text-secondary)]">
                <li><Link href="/security" className="hover:text-[var(--cs-navy)]">Security &amp; trust</Link></li>
                <li><a href="/#why" className="hover:text-[var(--cs-navy)]">Why Cornerstone</a></li>
                <li><a href="/#compliance" className="hover:text-[var(--cs-navy)]">Compliance</a></li>
                <li><a href="/#faq" className="hover:text-[var(--cs-navy)]">FAQ</a></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--cs-text-gentle)]">Company</p>
              <ul className="mt-3 space-y-2 text-sm text-[var(--cs-text-secondary)]">
                <li><Link href="/about" className="hover:text-[var(--cs-navy)]">About</Link></li>
                <li><a href="/#contact" className="hover:text-[var(--cs-navy)]">Book a demo</a></li>
                <li><Link href="/dashboard" className="hover:text-[var(--cs-navy)]">Sign in</Link></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-[var(--cs-border)] pt-6 text-xs text-[var(--cs-text-muted)] sm:flex-row">
          <p>© 2026 Cornerstone Care OS. All rights reserved.</p>
          <p className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-[var(--cs-teal)]" /> Safeguarding-first. Human-in-the-loop. Always.</p>
        </div>
      </div>
    </footer>
  );
}

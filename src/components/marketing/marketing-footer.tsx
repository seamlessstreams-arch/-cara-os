// ══════════════════════════════════════════════════════════════════════════════
// CARA — SHARED MARKETING FOOTER
// Used across /, /security, /about. Server component.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export function MarketingFooter() {
  return (
    <footer className="mk-midnight-flat relative border-t border-white/[0.07]">
      <div className="mk-aurora-line absolute inset-x-0 top-0 h-px opacity-60" aria-hidden />
      <div className="mx-auto max-w-7xl px-5 py-14">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-xs">
            <Link href="/" className="flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icon-192.png" alt="Cara" className="h-9 w-9 rounded-xl" />
              <span className="text-lg font-extrabold tracking-tight text-white">Cara <span className="text-teal-300">Care Intelligence OS</span></span>
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">The Care Intelligence OS for children&rsquo;s homes. Cara turns everyday residential care into live safeguarding intelligence.</p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Platform</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-400">
                <li><a href="/#layers" className="transition-colors hover:text-white">Intelligence layers</a></li>
                <li><Link href="/product/safeguarding" className="transition-colors hover:text-white">Safeguarding</Link></li>
                <li><Link href="/product/compliance" className="transition-colors hover:text-white">Compliance</Link></li>
                <li><Link href="/product/intelligence" className="transition-colors hover:text-white">Practice intelligence</Link></li>
                <li><Link href="/product/workforce" className="transition-colors hover:text-white">Workforce</Link></li>
                <li><Link href="/product/tour" className="transition-colors hover:text-white">Product tour</Link></li>
                <li><Link href="/pricing" className="transition-colors hover:text-white">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Company</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-400">
                <li><Link href="/about" className="transition-colors hover:text-white">About</Link></li>
                <li><Link href="/product/workforce" className="transition-colors hover:text-white">Cara People</Link></li>
                <li><Link href="/contact" className="transition-colors hover:text-white">Contact</Link></li>
                <li><Link href="/dashboard" className="transition-colors hover:text-white">Sign in</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Trust &amp; legal</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-400">
                <li><Link href="/security" className="transition-colors hover:text-white">Security &amp; trust</Link></li>
                <li><Link href="/privacy" className="transition-colors hover:text-white">Privacy</Link></li>
                <li><Link href="/terms" className="transition-colors hover:text-white">Terms</Link></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/[0.07] pt-6 text-xs text-slate-500 sm:flex-row">
          <p>© 2026 Cara OS. All rights reserved.</p>
          <p className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-teal-300" /> Safeguarding-first. Human-in-the-loop. Always.</p>
        </div>
      </div>
    </footer>
  );
}

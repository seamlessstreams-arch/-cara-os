import Link from "next/link";
import { Compass, ArrowRight } from "lucide-react";

// Custom 404. Without this file Next serves its built-in white default, which
// broke the dark skin. Rendered inside the root layout, wrapped in `.cara-dark`
// so it carries the full Ask CARA dark treatment (gradient canvas + tokens).
export default function NotFound() {
  return (
    <div className="cara-dark min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-400/20 via-blue-500/20 to-violet-500/20 ring-1 ring-white/10">
          <Compass className="h-8 w-8 text-[var(--cs-text)]" />
        </div>
        <div className="space-y-2">
          <p className="text-sm font-semibold tracking-wide text-[var(--cs-text-muted)]">404 — PAGE NOT FOUND</p>
          <h1 className="text-2xl font-bold text-[var(--cs-text)] text-balance">This page couldn&rsquo;t be found</h1>
          <p className="text-sm text-[var(--cs-text-secondary)] leading-relaxed">
            The page may have moved, or the link might be out of date. Let&rsquo;s get you back to what needs you.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-full bg-[var(--cs-cara-gold)] px-5 py-2.5 text-sm font-semibold text-[#241a08] shadow-sm transition-transform hover:scale-[1.02]"
          >
            Back to dashboard
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/ask-cara"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--cs-border)] px-5 py-2.5 text-sm font-medium text-[var(--cs-text-secondary)] hover:text-[var(--cs-text)] hover:border-[var(--cs-border-subtle)] transition-colors"
          >
            Ask CARA
          </Link>
        </div>
      </div>
    </div>
  );
}

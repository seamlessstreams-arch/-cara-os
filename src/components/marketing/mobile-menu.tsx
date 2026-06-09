"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, ArrowRight } from "lucide-react";

const LINKS = [
  { href: "#how", label: "How it works" },
  { href: "#intelligence", label: "ARIA Intelligence" },
  { href: "#features", label: "Features" },
  { href: "#workforce", label: "Workforce" },
  { href: "#platform", label: "Platform" },
  { href: "#pricing", label: "Pricing" },
  { href: "#why", label: "Why Cornerstone" },
  { href: "#compliance", label: "Compliance" },
  { href: "#faq", label: "FAQ" },
];

/** Mobile-only hamburger that opens a full-screen nav overlay. */
export function MobileMenu() {
  const [open, setOpen] = useState(false);
  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--cs-border)] bg-white/70 text-[var(--cs-navy)]"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex flex-col bg-[var(--cs-bg)]">
          <div className="flex items-center justify-between border-b border-[var(--cs-border)] px-5 py-3.5">
            <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icon-192.png" alt="Cornerstone" className="h-9 w-9 rounded-xl" />
              <span className="text-lg font-extrabold tracking-tight text-[var(--cs-navy)]">Cornerstone <span className="text-[var(--cs-teal-strong)]">Care OS</span></span>
            </Link>
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--cs-border)] bg-white/70 text-[var(--cs-navy)]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-5">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-3 text-base font-semibold text-[var(--cs-navy)] hover:bg-white"
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="flex flex-col gap-2.5 border-t border-[var(--cs-border)] p-5">
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="inline-flex items-center justify-center rounded-xl border border-[var(--cs-border)] bg-white px-5 py-3 text-sm font-semibold text-[var(--cs-navy)]"
            >
              Sign in
            </Link>
            <Link
              href="#contact"
              onClick={() => setOpen(false)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--cs-navy)] px-5 py-3 text-sm font-semibold text-white"
            >
              Book a demo <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// CARA — SHARED MARKETING PAGE HERO
// The midnight opening every public page shares: glass eyebrow chip, Fraunces
// display headline (with an optional aurora-italic turn), supporting copy and a
// CTA row — over the constellation field when asked. Server component; motion
// comes from the mk-enter load choreography and the client HeroField canvas.
// ══════════════════════════════════════════════════════════════════════════════

import React from "react";
import { HeroField } from "@/components/marketing/hero-field";

export function MarketingPageHero({
  eyebrow,
  title,
  titleAccent,
  lede,
  children,
  footnote,
  field = false,
}: {
  eyebrow: string;
  title: React.ReactNode;
  /** Rendered after the title on its own line, in the aurora italic voice. */
  titleAccent?: React.ReactNode;
  lede: React.ReactNode;
  /** CTA row (buttons/links). */
  children?: React.ReactNode;
  footnote?: React.ReactNode;
  field?: boolean;
}) {
  return (
    <section className="mk-midnight relative overflow-hidden">
      {field && <HeroField className="pointer-events-none absolute inset-0 h-full w-full opacity-60" />}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24" style={{ background: "linear-gradient(180deg, transparent, rgba(7,13,30,0.85))" }} />
      <div className="relative mx-auto max-w-4xl px-5 py-20 text-center lg:py-28">
        <div className="mk-enter" style={{ "--mk-delay": "60ms" } as React.CSSProperties}>
          <span className="mk-glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-teal-200/90">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-teal-300 shadow-[0_0_8px_rgba(45,212,191,0.9)]" />
            {eyebrow}
          </span>
        </div>
        <h1 className="mk-display mk-enter mt-7 text-[clamp(2.4rem,5.2vw,4rem)] text-white" style={{ "--mk-delay": "180ms" } as React.CSSProperties}>
          {title}
          {titleAccent && (
            <>
              <br />
              <span className="mk-display-it mk-aurora-text">{titleAccent}</span>
            </>
          )}
        </h1>
        <p className="mk-enter mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-300/90" style={{ "--mk-delay": "320ms" } as React.CSSProperties}>
          {lede}
        </p>
        {children && (
          <div className="mk-enter mt-9 flex flex-wrap items-center justify-center gap-4" style={{ "--mk-delay": "460ms" } as React.CSSProperties}>
            {children}
          </div>
        )}
        {footnote && (
          <p className="mk-enter mt-6 text-xs text-slate-500" style={{ "--mk-delay": "580ms" } as React.CSSProperties}>
            {footnote}
          </p>
        )}
      </div>
    </section>
  );
}

/** Gold primary CTA for midnight surfaces. */
export function HeroGoldCta({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--cs-cara-gold)] px-7 py-3.5 text-sm font-bold text-[#0a1020] shadow-[0_0_28px_rgba(200,155,60,0.28)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_44px_rgba(200,155,60,0.42)]">
      {children}
    </a>
  );
}

/** Glass secondary CTA for midnight surfaces. */
export function HeroGlassCta({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} className="mk-glass inline-flex items-center justify-center gap-2 rounded-2xl px-7 py-3.5 text-sm font-bold text-white transition-all duration-300 hover:-translate-y-1 hover:bg-white/10">
      {children}
    </a>
  );
}

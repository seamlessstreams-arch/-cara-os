// ══════════════════════════════════════════════════════════════════════════════
// CARA — PRICING PAGE  (route: /pricing)
//
// "Midnight & gold" treatment: midnight hero, tilting tier cards (the featured
// Group tier wears the night), warm comparison + FAQ chapters, midnight finale.
// Honest copy — pricing is "Custom / book a quote" (no fabricated numbers), and
// every listed capability is real.
// ══════════════════════════════════════════════════════════════════════════════

import type { Metadata } from "next";
import Link from "next/link";
import {
  Home, Building2, Sparkles, CheckCircle2, Minus, ArrowRight, ChevronDown,
  ShieldCheck, HeartHandshake, Smartphone,
} from "lucide-react";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingPageHero, HeroGoldCta, HeroGlassCta } from "@/components/marketing/page-hero";
import { Reveal, TiltCard, ScrollProgress } from "@/components/marketing/fx";
import { HeroField } from "@/components/marketing/hero-field";

export const metadata: Metadata = {
  title: "Pricing | Cara OS",
  description:
    "Pricing that scales with your homes. Every plan includes the full platform, onboarding and support — book a walkthrough for a quote tailored to your service.",
};

const TIERS = [
  {
    Icon: Home, name: "Single home", who: "For one registered children's home.", featured: false, cta: "Book a demo",
    points: ["Full practice intelligence & RAG ratings", "Ofsted readiness & self-evaluation", "Priority briefing, trends & reports", "Workforce, comms & safe access", "Ask CARA — governed, records-based assistant", "Mobile, installable & offline-ready"],
  },
  {
    Icon: Building2, name: "Group", who: "For providers running several homes.", featured: true, cta: "Book a demo",
    points: ["Everything in Single home", "Responsible-Individual oversight", "Cross-home readiness & direction of travel", "Per-home priority briefings", "Group-level reporting", "Priority onboarding & support"],
  },
  {
    Icon: Sparkles, name: "Enterprise", who: "For large or complex providers.", featured: false, cta: "Talk to us",
    points: ["Everything in Group", "SSO & advanced access controls", "Custom integrations & data migration", "Dedicated onboarding & success manager", "Service-level agreement", "Roadmap input"],
  },
];

const COMPARISON: { group: string; rows: { label: string; v: (boolean | string)[] }[] }[] = [
  {
    group: "Core platform", rows: [
      { label: "Practice intelligence & live RAG ratings", v: [true, true, true] },
      { label: "Ofsted readiness & self-evaluation", v: [true, true, true] },
      { label: "Priority briefing, trends & reports", v: [true, true, true] },
      { label: "Plan currency, premises & shift briefing", v: [true, true, true] },
      { label: "Workforce & safe access", v: [true, true, true] },
      { label: "Ask CARA — governed assistant, answers from your records", v: [true, true, true] },
      { label: "AI governance — no child data to public AI, hashed audit trail", v: [true, true, true] },
      { label: "Cara Practice Assistant — incident support & recording quality", v: [true, true, true] },
      { label: "Contextual safeguarding, safety planning & NRM support", v: [true, true, true] },
      { label: "Writing to the Child — child-readable recording & PACE", v: [true, true, true] },
      { label: "Mobile, installable & offline-ready", v: [true, true, true] },
    ],
  },
  {
    group: "Multi-home & oversight", rows: [
      { label: "Responsible-Individual oversight", v: [false, true, true] },
      { label: "Cross-home readiness & direction of travel", v: [false, true, true] },
      { label: "Per-home priority briefings", v: [false, true, true] },
      { label: "Group-level reporting", v: [false, true, true] },
    ],
  },
  {
    group: "Enterprise", rows: [
      { label: "SSO & advanced access controls", v: [false, false, true] },
      { label: "Custom integrations & data migration", v: [false, false, true] },
      { label: "Dedicated success manager", v: [false, false, true] },
      { label: "Service-level agreement (SLA)", v: [false, false, true] },
    ],
  },
  {
    group: "Onboarding & support", rows: [
      { label: "Onboarding", v: ["Standard", "Priority", "Dedicated"] },
      { label: "Support", v: ["Included", "Priority", "SLA-backed"] },
      { label: "Data security, audit trails & role-based access", v: [true, true, true] },
    ],
  },
];

const FAQ = [
  { q: "How is Cara priced?", a: "Pricing is tailored to your service — the number of homes and how you roll out. Every plan includes the full platform, onboarding and support, so there's no feature paywall. Book a walkthrough and we'll put together a quote for your service." },
  { q: "Do you charge per user?", a: "No — plans are scoped to your service rather than your headcount, so your whole team is included. No per-seat surprises as you grow your staff." },
  { q: "Can we start with one home and grow?", a: "Yes. Start on the Single home plan and move to Group when you add services — your data and set-up come with you." },
  { q: "What does onboarding involve?", a: "Every plan includes onboarding and support to get your home set up and your team confident. Group plans get priority onboarding, and Enterprise gets a dedicated onboarding and success manager." },
  { q: "Can we migrate our existing records?", a: "Data migration is available — included at Enterprise, and we'll scope it for any plan during your walkthrough so you're not starting from a blank page." },
  { q: "What's included as standard?", a: "Every plan includes role-based access, full audit trails, data security and the human-in-the-loop AI safeguards — they're part of the core, not paid extras." },
  { q: "Does Cara use public AI like ChatGPT?", a: "No. Ask CARA answers from your own records and runs deterministically, so no child data is ever sent to a public AI model. It's the sanctioned, in-house alternative to staff pasting sensitive information into public chatbots — and every use is logged and governable, which supports your duties under UK and EU data-protection law." },
];

function ValueCell({ v }: { v: boolean | string }) {
  if (v === true) return <CheckCircle2 className="mx-auto h-5 w-5 text-[var(--cs-teal)]" aria-label="Included" />;
  if (v === false) return <Minus className="mx-auto h-4 w-4 text-[var(--cs-text-gentle)]" aria-label="Not included" />;
  return <span className="text-xs font-semibold text-[var(--cs-navy)]">{v}</span>;
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[var(--cs-bg)] text-[var(--cs-text)]">
      <ScrollProgress />
      <MarketingHeader />

      <MarketingPageHero
        eyebrow="Pricing"
        title={<>Every plan is</>}
        titleAccent={<>the whole platform.</>}
        lede={
          <>
            Tiers add scale and oversight — never core capability. Every plan includes the full platform,
            onboarding and support, with no feature paywall. Book a walkthrough for a quote tailored to your service.
          </>
        }
      >
        <HeroGoldCta href="/contact">Book a walkthrough <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" /></HeroGoldCta>
        <HeroGlassCta href="/product/tour">See the product tour <Sparkles className="h-4 w-4 text-teal-300" /></HeroGlassCta>
      </MarketingPageHero>

      {/* Tiers — the featured Group tier wears the night */}
      <section className="mx-auto max-w-7xl px-5 pt-16 pb-4">
        <div className="grid gap-6 lg:grid-cols-3">
          {TIERS.map((t, i) => (
            <Reveal key={i} delay={i * 110}>
              <TiltCard className="h-full rounded-3xl">
                <div className={`relative flex h-full flex-col rounded-3xl p-8 shadow-[var(--cs-shadow-card)] ${t.featured ? "mk-midnight-flat text-white ring-1 ring-[var(--cs-cara-gold)]/50" : "border border-[var(--cs-border)] bg-white"}`}>
                  {t.featured && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--cs-cara-gold)] px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#0a1020] shadow-[0_0_20px_rgba(200,155,60,0.45)]">
                      Most popular
                    </span>
                  )}
                  <div className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${t.featured ? "bg-white/10 text-[var(--cs-cara-gold)]" : "bg-[var(--cs-navy)] text-[var(--cs-cara-gold)]"}`}>
                    <t.Icon className="h-6 w-6" />
                  </div>
                  <h2 className={`mt-4 text-xl font-bold ${t.featured ? "text-white" : "text-[var(--cs-navy)]"}`}>{t.name}</h2>
                  <p className={`mt-1 text-sm ${t.featured ? "text-slate-300" : "text-[var(--cs-text-secondary)]"}`}>{t.who}</p>
                  <p className={`mk-display mt-5 text-3xl ${t.featured ? "text-white" : "text-[var(--cs-navy)]"}`}>
                    Custom <span className={`text-sm font-semibold ${t.featured ? "text-slate-400" : "text-[var(--cs-text-muted)]"}`} style={{ fontFamily: "var(--font-sans)" }}>/ book a quote</span>
                  </p>
                  <ul className="mt-5 flex-1 space-y-2.5">
                    {t.points.map((p, j) => (
                      <li key={j} className={`flex items-start gap-2.5 text-sm ${t.featured ? "text-slate-200" : "text-[var(--cs-text-secondary)]"}`}>
                        <CheckCircle2 className={`mt-0.5 h-4 w-4 shrink-0 ${t.featured ? "text-teal-300" : "text-[var(--cs-teal)]"}`} /> {p}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/contact"
                    className={`mt-7 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition-all duration-300 hover:-translate-y-0.5 ${t.featured ? "bg-[var(--cs-cara-gold)] text-[#0a1020] shadow-[0_0_24px_rgba(200,155,60,0.3)]" : "border border-[var(--cs-border)] bg-white text-[var(--cs-navy)] hover:shadow-[var(--cs-shadow-card)]"}`}
                  >
                    {t.cta} <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </TiltCard>
            </Reveal>
          ))}
        </div>
        <Reveal delay={200}>
          <p className="mt-6 text-center text-sm text-[var(--cs-text-muted)]">All plans include data security, audit trails and role-based access as standard.</p>
        </Reveal>
      </section>

      {/* Everything includes band */}
      <section className="mx-auto max-w-7xl px-5 py-14">
        <div className="grid gap-5 sm:grid-cols-3">
          {[
            { Icon: ShieldCheck, t: "The full platform, every plan", d: "No feature is locked behind a higher tier — tiers add scale and oversight, not core capability." },
            { Icon: HeartHandshake, t: "Onboarding & support included", d: "We help you get set up and keep your team confident — included on every plan." },
            { Icon: Smartphone, t: "Mobile, installable & offline", d: "Works on phones and tablets, installs to the home screen, and keeps working when the connection drops." },
          ].map((c, i) => (
            <Reveal key={i} delay={i * 100}>
              <div className="h-full rounded-2xl border border-[var(--cs-border)] bg-white p-7 shadow-[var(--cs-shadow-card)] transition-transform duration-300 hover:-translate-y-1">
                <c.Icon className="h-6 w-6 text-[var(--cs-teal-strong)]" />
                <h3 className="mt-3 text-base font-bold text-[var(--cs-navy)]">{c.t}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[var(--cs-text-secondary)]">{c.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Comparison table */}
      <section className="border-y border-[var(--cs-border)] bg-white">
        <div className="mx-auto max-w-5xl px-5 py-24">
          <Reveal className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--cs-teal-strong)]">Compare plans</span>
            <h2 className="mk-display mt-4 text-4xl text-[var(--cs-navy)] sm:text-5xl">Exactly what&rsquo;s <span className="mk-display-it">in each plan.</span></h2>
          </Reveal>
          <Reveal delay={120} className="mt-12 overflow-x-auto rounded-2xl border border-[var(--cs-border)] shadow-[var(--cs-shadow-card)]">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-[var(--cs-border)] bg-[var(--cs-bg)]">
                  <th className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-wide text-[var(--cs-text-muted)]">Capability</th>
                  {TIERS.map((t) => (
                    <th key={t.name} className={`px-4 py-3.5 text-center text-xs font-bold ${t.featured ? "text-[var(--cs-cara-gold)]" : "text-[var(--cs-navy)]"}`}>
                      {t.name}{t.featured && <span className="ml-1 align-middle text-[9px] font-bold uppercase text-[var(--cs-cara-gold)]">★</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              {COMPARISON.map((grp) => (
                <tbody key={grp.group}>
                  <tr className="bg-[var(--cs-bg)]/50">
                    <td colSpan={4} className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-[var(--cs-teal-strong)]">{grp.group}</td>
                  </tr>
                  {grp.rows.map((r) => (
                    <tr key={r.label} className="border-b border-[var(--cs-border)]/40 last:border-0">
                      <td className="px-4 py-2.5 text-[var(--cs-text)]">{r.label}</td>
                      {r.v.map((val, k) => (
                        <td key={k} className="px-4 py-2.5 text-center"><ValueCell v={val} /></td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              ))}
            </table>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-4 text-center text-xs text-[var(--cs-text-muted)]">Tiers add scale and oversight — never core capability. Pricing is tailored to your service.</p>
          </Reveal>
        </div>
      </section>

      {/* Pricing FAQ */}
      <section className="mx-auto max-w-3xl px-5 py-24">
        <Reveal className="text-center">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--cs-teal-strong)]">Pricing FAQ</span>
          <h2 className="mk-display mt-4 text-4xl text-[var(--cs-navy)] sm:text-5xl">The questions <span className="mk-display-it">buyers ask us.</span></h2>
        </Reveal>
        <div className="mt-12 space-y-3">
          {FAQ.map((f, i) => (
            <Reveal key={i} delay={i * 60}>
              <details className="group rounded-2xl border border-[var(--cs-border)] bg-white px-5 py-4 shadow-[var(--cs-shadow-card)] transition-shadow hover:shadow-[var(--cs-shadow-elevated)] [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-bold text-[var(--cs-navy)]">
                  {f.q}
                  <ChevronDown className="h-5 w-5 shrink-0 text-[var(--cs-cara-gold)] transition-transform duration-300 group-open:rotate-180" />
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-[var(--cs-text-secondary)]">{f.a}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Finale — back into the night */}
      <section className="mk-midnight relative overflow-hidden">
        <HeroField className="pointer-events-none absolute inset-0 h-full w-full opacity-35" />
        <div className="relative mx-auto max-w-4xl px-5 py-24 text-center">
          <Reveal>
            <h2 className="mk-display text-4xl text-white sm:text-5xl">Let&rsquo;s build a quote <span className="mk-display-it mk-aurora-text">that fits.</span></h2>
            <p className="mx-auto mt-5 max-w-xl text-lg text-slate-300/90">Tell us about your service and we&rsquo;ll tailor a plan and price — or step into the live demo first.</p>
          </Reveal>
          <Reveal delay={130} className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <HeroGoldCta href="/contact">Book a walkthrough <ArrowRight className="h-4 w-4" /></HeroGoldCta>
            <HeroGlassCta href="/product/tour">See the product tour</HeroGlassCta>
          </Reveal>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}

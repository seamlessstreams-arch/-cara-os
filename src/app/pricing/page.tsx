// ══════════════════════════════════════════════════════════════════════════════
// CARA — PRICING PAGE  (route: /pricing)
//
// Standalone pricing page: tiers, a full feature-comparison table, and a pricing
// FAQ. Static server component. Honest copy — pricing is "Custom / book a quote"
// (no fabricated numbers), and every listed capability is real.
// ══════════════════════════════════════════════════════════════════════════════

import type { Metadata } from "next";
import Link from "next/link";
import {
  Home, Building2, Sparkles, CheckCircle2, Minus, ArrowRight, ChevronDown,
  ShieldCheck, HeartHandshake, Smartphone,
} from "lucide-react";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { SectionEyebrow } from "@/components/marketing/ui";

export const metadata: Metadata = {
  title: "Pricing | Cara OS",
  description:
    "Pricing that scales with your homes. Every plan includes the full platform, onboarding and support — book a walkthrough for a quote tailored to your service.",
};

const TIERS = [
  {
    Icon: Home, name: "Single home", who: "For one registered children's home.", featured: false, cta: "Book a demo",
    points: ["Full practice intelligence & RAG ratings", "Ofsted readiness & self-evaluation", "Priority briefing, trends & reports", "Workforce, comms & safe access", "Cara assistant (human-in-the-loop)", "Mobile, installable & offline-ready"],
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
      { label: "Cara assistant (human-in-the-loop)", v: [true, true, true] },
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
];

function ValueCell({ v }: { v: boolean | string }) {
  if (v === true) return <CheckCircle2 className="mx-auto h-5 w-5 text-[var(--cs-teal)]" aria-label="Included" />;
  if (v === false) return <Minus className="mx-auto h-4 w-4 text-[var(--cs-text-gentle)]" aria-label="Not included" />;
  return <span className="text-xs font-semibold text-[var(--cs-navy)]">{v}</span>;
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[var(--cs-bg)] text-[var(--cs-text)]">
      <MarketingHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-70" style={{ background: "radial-gradient(55% 50% at 50% 0%, var(--cs-teal-glow) 0%, transparent 60%)" }} />
        <div className="relative mx-auto max-w-3xl px-5 py-16 text-center lg:py-20">
          <SectionEyebrow>Pricing</SectionEyebrow>
          <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] tracking-tight text-[var(--cs-navy)] sm:text-5xl">Pricing that scales with your homes.</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-[var(--cs-text-secondary)]">
            Every plan includes the <span className="font-semibold text-[var(--cs-navy)]">full platform</span>, onboarding and support — no feature paywall. Book a walkthrough for a quote tailored to your service.
          </p>
        </div>
      </section>

      {/* Tiers */}
      <section className="mx-auto max-w-7xl px-5 pb-4">
        <div className="grid gap-6 lg:grid-cols-3">
          {TIERS.map((t, i) => (
            <div key={i} className={`relative flex flex-col rounded-3xl border p-7 shadow-[var(--cs-shadow-card)] ${t.featured ? "border-[var(--cs-teal)] bg-[var(--cs-teal-bg)]/40 ring-1 ring-[var(--cs-teal)]" : "border-[var(--cs-border)] bg-white"}`}>
              {t.featured && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--cs-teal)] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">Most popular</span>}
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--cs-navy)] text-white"><t.Icon className="h-6 w-6" /></div>
              <h2 className="mt-4 text-xl font-bold text-[var(--cs-navy)]">{t.name}</h2>
              <p className="mt-1 text-sm text-[var(--cs-text-secondary)]">{t.who}</p>
              <p className="mt-4 text-3xl font-extrabold text-[var(--cs-navy)]">Custom <span className="text-sm font-semibold text-[var(--cs-text-muted)]">/ book a quote</span></p>
              <ul className="mt-5 flex-1 space-y-2.5">
                {t.points.map((p, j) => (
                  <li key={j} className="flex items-start gap-2.5 text-sm text-[var(--cs-text-secondary)]"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--cs-teal)]" /> {p}</li>
                ))}
              </ul>
              <Link href="/contact" className={`mt-7 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-colors ${t.featured ? "bg-[var(--cs-navy)] text-white hover:bg-[var(--cs-navy-soft)]" : "border border-[var(--cs-border)] bg-white text-[var(--cs-navy)] hover:bg-[var(--cs-bg)]"}`}>
                {t.cta} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>
        <p className="mt-6 text-center text-sm text-[var(--cs-text-muted)]">All plans include data security, audit trails and role-based access as standard.</p>
      </section>

      {/* Everything includes band */}
      <section className="mx-auto max-w-7xl px-5 py-12">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { Icon: ShieldCheck, t: "The full platform, every plan", d: "No feature is locked behind a higher tier — tiers add scale and oversight, not core capability." },
            { Icon: HeartHandshake, t: "Onboarding & support included", d: "We help you get set up and keep your team confident — included on every plan." },
            { Icon: Smartphone, t: "Mobile, installable & offline", d: "Works on phones and tablets, installs to the home screen, and keeps working when the connection drops." },
          ].map((c, i) => (
            <div key={i} className="rounded-2xl border border-[var(--cs-border)] bg-white p-6 shadow-[var(--cs-shadow-card)]">
              <c.Icon className="h-6 w-6 text-[var(--cs-teal-strong)]" />
              <h3 className="mt-3 text-base font-bold text-[var(--cs-navy)]">{c.t}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-[var(--cs-text-secondary)]">{c.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison table */}
      <section className="border-y border-[var(--cs-border)] bg-white">
        <div className="mx-auto max-w-5xl px-5 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <SectionEyebrow>Compare plans</SectionEyebrow>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[var(--cs-navy)] sm:text-4xl">Exactly what&rsquo;s in each plan.</h2>
          </div>
          <div className="mt-10 overflow-x-auto rounded-2xl border border-[var(--cs-border)]">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-[var(--cs-border)] bg-[var(--cs-bg)]">
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-[var(--cs-text-muted)]">Capability</th>
                  {TIERS.map((t) => (
                    <th key={t.name} className={`px-4 py-3 text-center text-xs font-bold ${t.featured ? "text-[var(--cs-teal-strong)]" : "text-[var(--cs-navy)]"}`}>
                      {t.name}{t.featured && <span className="ml-1 align-middle text-[9px] font-bold uppercase text-[var(--cs-teal)]">★</span>}
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
          </div>
          <p className="mt-4 text-center text-xs text-[var(--cs-text-muted)]">Tiers add scale and oversight — never core capability. Pricing is tailored to your service.</p>
        </div>
      </section>

      {/* Pricing FAQ */}
      <section className="mx-auto max-w-3xl px-5 py-20">
        <div className="text-center">
          <SectionEyebrow>Pricing FAQ</SectionEyebrow>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[var(--cs-navy)] sm:text-4xl">The questions buyers ask us.</h2>
        </div>
        <div className="mt-10 space-y-3">
          {FAQ.map((f, i) => (
            <details key={i} className="group rounded-2xl border border-[var(--cs-border)] bg-white px-5 py-4 shadow-[var(--cs-shadow-card)] [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-bold text-[var(--cs-navy)]">
                {f.q}
                <ChevronDown className="h-5 w-5 shrink-0 text-[var(--cs-teal)] transition-transform group-open:rotate-180" />
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-[var(--cs-text-secondary)]">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-5 pb-20">
        <div className="relative overflow-hidden rounded-3xl bg-[var(--cs-navy)] px-6 py-16 text-center text-white shadow-[var(--cs-shadow-card)]">
          <div className="pointer-events-none absolute inset-0 opacity-50" style={{ background: "radial-gradient(50% 80% at 50% 0%, var(--cs-teal-glow) 0%, transparent 60%)" }} />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Let&rsquo;s build a quote that fits.</h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-white/75">Tell us about your service and we&rsquo;ll tailor a plan and price — or step into the live demo first.</p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="/contact" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-[var(--cs-navy)] transition-transform hover:-translate-y-0.5">Book a walkthrough <ArrowRight className="h-4 w-4" /></Link>
              <Link href="/product/tour" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/5 px-6 py-3.5 text-sm font-bold text-white transition-colors hover:bg-white/10">See the product tour</Link>
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}

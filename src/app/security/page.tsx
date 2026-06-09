// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — TRUST & SECURITY PAGE  (route: /security)
//
// Static, on-brand. Honest copy: describes the security MODEL and principles
// genuinely built into the platform (role-based access, audit trails, the ARIA
// safety contract, safeguarding-first design) and frames compliance as
// "designed around" the frameworks — no fabricated certifications.
// ══════════════════════════════════════════════════════════════════════════════

import type { Metadata } from "next";
import Link from "next/link";
import {
  ShieldCheck, Lock, Eye, KeyRound, ScrollText, UserCheck, ShieldAlert,
  GitMerge, Brain, Database, ArrowRight, FileText,
} from "lucide-react";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { SectionEyebrow, FeatureCard } from "@/components/marketing/ui";

export const metadata: Metadata = {
  title: "Security & trust | Cornerstone Care OS",
  description:
    "How Cornerstone protects the most sensitive data in care — role-based access, audit trails, sensitive-screen protection, and an AI safety contract that keeps a human in the loop on anything that matters.",
};

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-[var(--cs-bg)] text-[var(--cs-text)]">
      <MarketingHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-70" style={{ background: "radial-gradient(55% 50% at 80% 0%, var(--cs-teal-glow) 0%, transparent 60%)" }} />
        <div className="relative mx-auto max-w-4xl px-5 py-16 text-center lg:py-24">
          <SectionEyebrow>Security &amp; trust</SectionEyebrow>
          <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] tracking-tight text-[var(--cs-navy)] sm:text-5xl">
            Built for the most sensitive data in care.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-[var(--cs-text-secondary)]">
            A children&rsquo;s home holds some of the most sensitive personal data there is. Cornerstone treats it that way —
            with access control, audit trails and AI safeguards built into the core, not bolted on.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link href="/#contact" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--cs-navy)] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[var(--cs-navy-soft)] hover:shadow-md">Talk to us about your data <ArrowRight className="h-4 w-4" /></Link>
            <Link href="/#faq" className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--cs-border)] bg-white/70 px-5 py-3 text-sm font-semibold text-[var(--cs-navy)] transition-colors hover:bg-white">Read the FAQ</Link>
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section className="border-y border-[var(--cs-border)] bg-white">
        <div className="mx-auto max-w-7xl px-5 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <SectionEyebrow>How your data is protected</SectionEyebrow>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[var(--cs-navy)] sm:text-4xl">Controls built into the core.</h2>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard accent="navy" Icon={KeyRound} title="Role-based access" body="People see only what their role and shift require. Access follows the rota — granted when staff are on, scoped to what they need." />
            <FeatureCard accent="teal" Icon={ScrollText} title="Audit trail on everything" body="Every record and change is attributed and time-stamped. Nothing happens anonymously, and the history is always there to show." />
            <FeatureCard accent="gold" Icon={Eye} title="Sensitive-screen protection" body="Confidential information is shielded on shared and public-facing screens, so the wrong eyes never land on the wrong record." />
            <FeatureCard accent="teal" Icon={Lock} title="Least-privilege by default" body="Permissions start closed and open only where needed — no blanket access, and changes to who-can-see-what are controlled and logged." />
            <FeatureCard accent="navy" Icon={Database} title="Data minimisation" body="Capture once, store once. One canonical record instead of copies scattered across books, inboxes and spreadsheets." />
            <FeatureCard accent="gold" Icon={ShieldCheck} title="Safeguarding-first design" body="High and critical safeguarding flags can never be silently deleted — the platform protects the record of a concern." />
          </div>
        </div>
      </section>

      {/* AI safety — the standout */}
      <section className="relative overflow-hidden bg-[var(--cs-navy)] text-white">
        <div className="pointer-events-none absolute inset-0 opacity-40" style={{ background: "radial-gradient(50% 60% at 0% 0%, var(--cs-aria-glow) 0%, transparent 55%), radial-gradient(45% 55% at 100% 100%, var(--cs-teal-glow) 0%, transparent 50%)" }} />
        <div className="relative mx-auto max-w-7xl px-5 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-block rounded-full border border-[var(--cs-aria-gold)]/30 bg-[var(--cs-aria-gold)]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[var(--cs-aria-gold-soft)]">The ARIA safety contract</span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">AI that assists — and never oversteps.</h2>
            <p className="mt-4 text-lg text-white/75">
              Your RAG ratings come from deterministic, explainable engines — not a language model guessing. Where AI does help,
              it operates inside hard limits that put the practitioner in charge of every decision that matters.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {[
              { Icon: Eye, t: "Explainable, not a black box", d: "Every rating traces back to the records behind it. You can show an inspector exactly why a score is what it is." },
              { Icon: ShieldAlert, t: "Never auto-decides thresholds", d: "ARIA will flag when a LADO or notifiable-event threshold may be met — but the decision is always a person's to make." },
              { Icon: UserCheck, t: "Human in the loop", d: "Anything safeguarding-critical is held for human review. AI drafts and suggests; it does not act on its own." },
              { Icon: ShieldCheck, t: "Protected flags", d: "High and critical risk flags are never deleted by automation — the record of a concern is preserved." },
            ].map((w, i) => (
              <div key={i} className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--cs-teal)]/20 text-[var(--cs-teal-soft)]"><w.Icon className="h-6 w-6" /></div>
                <div>
                  <h3 className="text-lg font-bold">{w.t}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-white/70">{w.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Frameworks */}
      <section className="mx-auto max-w-5xl px-5 py-20 text-center">
        <SectionEyebrow>Designed around the rules you&rsquo;re held to</SectionEyebrow>
        <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[var(--cs-navy)] sm:text-4xl">Aligned to the frameworks that govern your data and your care.</h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-[var(--cs-text-secondary)]">
          Cornerstone is built to support your obligations under data-protection law and the regulations that govern
          children&rsquo;s homes — so the way data is handled and evidenced matches the way you&rsquo;re inspected.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {["UK GDPR & Data Protection Act 2018", "Children's Homes Regs 2015", "Quality Standards", "Ofsted SCCIF", "Working Together 2025", "Reg 44 & 45"].map((t) => (
            <span key={t} className="rounded-full border border-[var(--cs-teal-soft)] bg-[var(--cs-teal-bg)] px-4 py-2 text-sm font-semibold text-[var(--cs-teal-strong)]">{t}</span>
          ))}
        </div>
        <p className="mx-auto mt-6 max-w-2xl text-sm text-[var(--cs-text-muted)]">
          Alignment with these frameworks describes how the platform is designed; it is not a claim of independent certification.
          We&rsquo;re happy to walk your DPO or compliance lead through our data-handling model.
        </p>
      </section>

      {/* Your data is yours */}
      <section className="border-y border-[var(--cs-border)] bg-white">
        <div className="mx-auto max-w-5xl px-5 py-16">
          <div className="grid gap-5 sm:grid-cols-3">
            {[
              { Icon: GitMerge, t: "One source of truth", d: "No duplicate records drifting out of sync — capture once, and every view reads the same canonical entry." },
              { Icon: FileText, t: "Evidence you can export", d: "One-click, print-ready packs you can share with the LA, an IRO or an inspector — your data, on your terms." },
              { Icon: Brain, t: "Transparent by design", d: "The logic behind every signal is auditable. We'd rather you trust the method than take the score on faith." },
            ].map((c, i) => (
              <div key={i} className="rounded-2xl border border-[var(--cs-border)] bg-[var(--cs-bg)] p-6">
                <c.Icon className="h-6 w-6 text-[var(--cs-teal-strong)]" />
                <h3 className="mt-3 text-base font-bold text-[var(--cs-navy)]">{c.t}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[var(--cs-text-secondary)]">{c.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-5 py-20">
        <div className="relative overflow-hidden rounded-3xl bg-[var(--cs-navy)] px-6 py-16 text-center text-white shadow-[var(--cs-shadow-card)]">
          <div className="pointer-events-none absolute inset-0 opacity-50" style={{ background: "radial-gradient(50% 80% at 50% 0%, var(--cs-teal-glow) 0%, transparent 60%)" }} />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl text-3xl font-extrabold tracking-tight sm:text-4xl">Questions about your data? Let&rsquo;s talk.</h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-white/75">We&rsquo;ll happily walk your team through how Cornerstone handles, protects and evidences the records you keep.</p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="mailto:hello@cornerstonecare.app?subject=Cornerstone%20security%20%26%20data%20handling" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-[var(--cs-navy)] transition-transform hover:-translate-y-0.5">
                Talk to us <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/5 px-6 py-3.5 text-sm font-bold text-white transition-colors hover:bg-white/10">
                Back to home
              </Link>
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}

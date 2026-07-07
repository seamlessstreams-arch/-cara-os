// ══════════════════════════════════════════════════════════════════════════════
// CARA — COMPLIANCE INTELLIGENCE DEEP-DIVE  (route: /product/compliance)
// Honest copy: helps evidence / prompts / supports — never "guarantees".
// ══════════════════════════════════════════════════════════════════════════════

import type { Metadata } from "next";
import Link from "next/link";
import {
  ClipboardCheck, ShieldCheck, GraduationCap, Pill, Flame, MessageSquare,
  ScrollText, ArrowRight, CheckCircle2, FileCheck, UserCheck, Scale, Eye,
} from "lucide-react";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { ShadowAiCallout } from "@/components/marketing/shadow-ai-callout";
import { SectionEyebrow, FeatureCard } from "@/components/marketing/ui";

export const metadata: Metadata = {
  title: "Compliance Intelligence | Cara",
  description:
    "Regulation 40 prompts, Annex A readiness, Reg 44/45 evidence support, safer recruitment, supervision, training, medication and premises checks — maintained live with full audit trails.",
};

const STACK = [
  { Icon: Scale, t: "Regulation 40 prompts", d: "When an event may meet a notification threshold, Cara prompts: 'the manager should consider whether notification is required' — the decision is always the manager's, with the rationale recorded." },
  { Icon: FileCheck, t: "Annex A readiness", d: "The lists inspectors ask for, maintained as a living snapshot rather than a panic-built spreadsheet." },
  { Icon: Eye, t: "Reg 44 & 45 evidence", d: "Independent-visitor packs and quality-of-care evidence drawn from the records the home already keeps." },
  { Icon: UserCheck, t: "Safer recruitment", d: "A per-candidate compliance gate: traffic lights, Schedule 2 file index, reference chasing and exceptional-start controls — clearance always needs a named human sign-off." },
  { Icon: MessageSquare, t: "Supervision tracking", d: "Sessions, themes and overdue supervision surfaced before they lapse — including safeguarding supervision." },
  { Icon: GraduationCap, t: "Training matrix", d: "Mandatory and role-specific training RAG-rated by currency, with gaps flagged early." },
  { Icon: Pill, t: "Medication records", d: "MAR-style recording with the audit trail regulators expect — and errors surfaced for follow-up, never buried." },
  { Icon: Flame, t: "Fire, health & safety", d: "Premises certificates, routine checks and drills RAG-rated by currency, failed or overdue items first." },
  { Icon: ScrollText, t: "Restraints, sanctions & complaints", d: "Recorded with manager oversight and pattern visibility — including what the child said about it." },
];

export default function CompliancePage() {
  return (
    <div className="min-h-screen bg-[var(--cs-bg)] text-[var(--cs-text)]">
      <MarketingHeader />

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-70" style={{ background: "radial-gradient(55% 50% at 50% 0%, var(--cs-teal-glow) 0%, transparent 60%)" }} />
        <div className="relative mx-auto max-w-4xl px-5 py-16 text-center lg:py-24">
          <SectionEyebrow>Compliance Intelligence</SectionEyebrow>
          <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] tracking-tight text-[var(--cs-navy)] sm:text-5xl">The evidence trail builds itself as you work.</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-[var(--cs-text-secondary)]">
            Reg 40 prompts, Annex A readiness, supervision, training, safer recruitment, medication and premises checks —
            Cara keeps the compliance picture live all year, with leadership oversight and a full audit trail underneath it.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link href="/contact" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--cs-navy)] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[var(--cs-navy-soft)] hover:shadow-md">Book a Demo <ArrowRight className="h-4 w-4" /></Link>
            <Link href="/product/tour" className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--cs-border)] bg-white/70 px-5 py-3 text-sm font-semibold text-[var(--cs-navy)] transition-colors hover:bg-white">See it in the tour</Link>
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--cs-border)] bg-white">
        <div className="mx-auto max-w-7xl px-5 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <SectionEyebrow>The compliance stack</SectionEyebrow>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[var(--cs-navy)] sm:text-4xl">Everything a regulated home has to hold — held live.</h2>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {STACK.map((s, i) => (
              <FeatureCard key={i} accent={(["teal", "gold", "navy"] as const)[i % 3]} Icon={s.Icon} title={s.t} body={s.d} />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-20">
        <div className="rounded-3xl border border-[var(--cs-border)] bg-[var(--cs-bg)] p-8 sm:p-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-2xl">
              <SectionEyebrow>Leadership oversight</SectionEyebrow>
              <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-[var(--cs-navy)] sm:text-3xl">Grip you can demonstrate.</h2>
              <p className="mt-3 text-base leading-relaxed text-[var(--cs-text-secondary)]">
                Every sensitive action is auditable: who recorded, who reviewed, what changed, when. Manager review is
                built into the workflows — incidents, AI drafts, recruitment clearances, threshold decisions — so
                oversight is evidence, not assertion.
              </p>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {["Audit trails on sensitive actions", "Manager review queues built in", "Role-based access by job, home and shift", "Decisions recorded with rationale"].map((t) => (
                  <li key={t} className="flex items-start gap-2 text-sm text-[var(--cs-text)]"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--cs-teal)]" /> {t}</li>
                ))}
              </ul>
            </div>
            <Link href="/security" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[var(--cs-navy)] px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-[var(--cs-navy-soft)] hover:shadow-md">Security &amp; trust <ShieldCheck className="h-4 w-4" /></Link>
          </div>
        </div>
      </section>

      {/* Shadow AI — data-protection lens */}
      <ShadowAiCallout lens="Ungoverned AI is a data-protection gap. Cara closes it." />

      <section className="mx-auto max-w-7xl px-5 pb-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-[var(--cs-navy)] sm:text-4xl">Inspection-season calm, all year round.</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-[var(--cs-text-secondary)]">Cara helps you evidence quality and oversight — honestly, traceably, and without the midnight spreadsheet rebuild.</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/contact" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--cs-navy)] px-6 py-3.5 text-sm font-bold text-white transition-all hover:bg-[var(--cs-navy-soft)] hover:shadow-md">Book a Demo <ArrowRight className="h-4 w-4" /></Link>
            <Link href="/product/safeguarding" className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--cs-border)] bg-white px-6 py-3.5 text-sm font-bold text-[var(--cs-navy)] transition-colors hover:bg-[var(--cs-bg)]">Safeguarding Intelligence <ClipboardCheck className="h-4 w-4 text-[var(--cs-teal)]" /></Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}

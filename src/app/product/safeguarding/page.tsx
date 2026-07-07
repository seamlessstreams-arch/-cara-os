// ══════════════════════════════════════════════════════════════════════════════
// CARA — SAFEGUARDING INTELLIGENCE DEEP-DIVE  (route: /product/safeguarding)
//
// Honest copy: every capability maps to a real platform feature. Supports /
// prompts / helps identify — humans decide, always.
// ══════════════════════════════════════════════════════════════════════════════

import type { Metadata } from "next";
import Link from "next/link";
import {
  ShieldAlert, MapPin, Users, Wifi, Siren, ArrowRight, CheckCircle2, Radar,
  Footprints, HeartHandshake, Eye, LineChart, Bell, ScrollText,
  Compass, ShieldCheck, Scale, PenLine,
} from "lucide-react";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { ShadowAiCallout } from "@/components/marketing/shadow-ai-callout";
import { SectionEyebrow, FeatureCard } from "@/components/marketing/ui";

export const metadata: Metadata = {
  title: "Safeguarding Intelligence | Cara",
  description:
    "Cara helps children's homes see safeguarding patterns while they're still patterns — missing episodes, exploitation indicators, peer and location risk, escalation over time — with humans making every decision.",
};

export default function SafeguardingPage() {
  return (
    <div className="min-h-screen bg-[var(--cs-bg)] text-[var(--cs-text)]">
      <MarketingHeader />

      {/* Hero */}
      <section className="relative overflow-hidden bg-[var(--cs-navy)] text-white">
        <div className="pointer-events-none absolute inset-0 opacity-50" style={{ background: "radial-gradient(50% 60% at 15% 0%, var(--cs-cara-glow) 0%, transparent 55%), radial-gradient(45% 55% at 100% 100%, var(--cs-teal-glow) 0%, transparent 50%)" }} />
        <div className="relative mx-auto max-w-4xl px-5 py-20 text-center lg:py-28">
          <span className="inline-block rounded-full border border-[var(--cs-cara-gold)]/30 bg-[var(--cs-cara-gold)]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[var(--cs-cara-gold-soft)]">Safeguarding Intelligence</span>
          <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-5xl">See the pattern before it becomes the incident.</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-white/75">
            Missing episodes, exploitation indicators, peer dynamics, places, times and online pressure — Cara connects
            what your team records into a live safeguarding picture, and puts it in front of the people who decide.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/contact" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-[var(--cs-navy)] transition-transform hover:-translate-y-0.5">Book a Demo <ArrowRight className="h-4 w-4" /></Link>
            <Link href="/dashboard" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/5 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-white/10">Explore the platform</Link>
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="mx-auto max-w-7xl px-5 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <SectionEyebrow>What Cara watches with you</SectionEyebrow>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[var(--cs-navy)] sm:text-4xl">Contextual safeguarding, made visible.</h2>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard accent="gold" Icon={Footprints} title="Missing episodes" body="Every episode recorded with push-button structure — and return home welfare checks prompted so the conversation that matters most never gets skipped." />
          <FeatureCard accent="navy" Icon={ShieldAlert} title="CCE / CSE indicators" body="Grooming signs, gifts, new contacts, debt and pressure — surfaced from the records your team already keeps, never minimised." />
          <FeatureCard accent="teal" Icon={Users} title="Peer mapping" body="Who's connecting with whom — inside the home and outside it — so peer influence is understood, not guessed." />
          <FeatureCard accent="teal" Icon={MapPin} title="Location risks" body="The places that keep appearing in episodes and concerns, building a contextual picture over time." />
          <FeatureCard accent="navy" Icon={Wifi} title="Online risk" body="Pressure, contact and content concerns connected to the wider picture — because exploitation rarely stays offline." />
          <FeatureCard accent="gold" Icon={LineChart} title="Escalation & de-escalation" body="Direction of travel per child and per risk theme — improving, worsening or stable, called honestly either way." />
        </div>
      </section>

      {/* Grounded in trusted practice */}
      <section className="border-y border-[var(--cs-border)] bg-white">
        <div className="mx-auto max-w-7xl px-5 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <SectionEyebrow>Grounded in the practice the sector trusts</SectionEyebrow>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[var(--cs-navy)] sm:text-4xl">Not just risk-spotting &mdash; the frameworks behind it.</h2>
            <p className="mt-4 text-lg text-[var(--cs-text-secondary)]">Cara&rsquo;s safeguarding intelligence is built on the models residential childcare relies on &mdash; so it challenges practice the way a great safeguarding lead would, and keeps a child a child.</p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <FeatureCard accent="navy" Icon={Compass} title="Contextual Safeguarding" body="Carlene Firmin's model, built in: harm beyond the front door — peers, places, transport and online. Cara frames guardianship, never surveillance, and treats a young person's survival strategies as something to understand, not to criminalise." />
            <FeatureCard accent="teal" Icon={ShieldCheck} title="Safety planning" body="Co-created WITH the young person, never done to them — across physical, emotional, financial and community safety, with a trauma-informed lens and components that actually keep them safer." />
            <FeatureCard accent="gold" Icon={Scale} title="Modern slavery & the NRM" body="Recognises trafficking and exploitation indicators and prompts the manager to consider a National Referral Mechanism referral. A child who is exploited is a victim, not an offender (Section 45). Cara advises; the DSL decides." />
            <FeatureCard accent="navy" Icon={PenLine} title="Writing to the Child" body="Records written as evidence for professionals and memory for the child — flagging shaming or institutional language and offering careful, child-readable wording that keeps the risk clear." />
          </div>
        </div>
      </section>

      {/* How oversight works */}
      <section className="border-y border-[var(--cs-border)] bg-white">
        <div className="mx-auto max-w-5xl px-5 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <SectionEyebrow>How it stays safe</SectionEyebrow>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[var(--cs-navy)] sm:text-4xl">Cara flags. Humans decide. Always.</h2>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {[
              { Icon: Radar, t: "Surfaced", d: "Signals rank by severity in the Priority Briefing and manager alerts — each deep-linked to the records behind it." },
              { Icon: Eye, t: "Reviewed", d: "Thresholds — LADO, Regulation 40, referrals — are prompted with 'the manager should consider…', never decided by the system." },
              { Icon: ScrollText, t: "Evidenced", d: "Every flag, decision and action lands in the audit trail, so the home can show exactly what it knew and what it did." },
            ].map((s, i) => (
              <div key={i} className="rounded-2xl border border-[var(--cs-border)] bg-[var(--cs-bg)] p-6 text-center">
                <s.Icon className="mx-auto h-7 w-7 text-[var(--cs-teal-strong)]" />
                <h3 className="mt-3 text-base font-bold text-[var(--cs-navy)]">{s.t}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[var(--cs-text-secondary)]">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* In the moment */}
      <section className="mx-auto max-w-5xl px-5 py-20">
        <div className="rounded-3xl border-2 border-[var(--cs-teal)] bg-[var(--cs-teal-bg)]/30 p-8 sm:p-10">
          <div className="flex flex-col items-start gap-6 sm:flex-row">
            <div className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--cs-navy)] text-white"><Siren className="h-7 w-7" /></div>
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-[var(--cs-navy)] sm:text-3xl">In the moment support, when it&rsquo;s hardest</h2>
              <p className="mt-3 text-base leading-relaxed text-[var(--cs-text-secondary)]">
                During an incident, Cara supports staff with co-regulation prompts, the right workflow checklist,
                professional language and safeguarding reminders — then helps turn what happened into non-shaming
                learning for the child and a reflective debrief for staff.
              </p>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {["Live incident timeline with voice dictation", "Co-regulation prompts matched to what's happening", "Restorative follow-up — repair before lessons", "Every AI draft held for manager review"].map((t) => (
                  <li key={t} className="flex items-start gap-2 text-sm text-[var(--cs-text)]"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--cs-teal)]" /> {t}</li>
                ))}
              </ul>
              <Link href="/product/tour" className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--cs-navy)] hover:text-[var(--cs-teal-strong)]">See Incident Mode in the tour <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </div>
        </div>
      </section>

      {/* Shadow AI — online safety lens */}
      <ShadowAiCallout lens="Keeping children safe online means keeping their data safe too." />

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-5 pb-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-[var(--cs-navy)] sm:text-4xl">Safeguarding grip you can show, not just feel.</h2>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/contact" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--cs-navy)] px-6 py-3.5 text-sm font-bold text-white transition-all hover:bg-[var(--cs-navy-soft)] hover:shadow-md">Book a Demo <ArrowRight className="h-4 w-4" /></Link>
            <Link href="/product/compliance" className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--cs-border)] bg-white px-6 py-3.5 text-sm font-bold text-[var(--cs-navy)] transition-colors hover:bg-[var(--cs-bg)]">Compliance Intelligence <HeartHandshake className="h-4 w-4 text-[var(--cs-teal)]" /></Link>
          </div>
          <p className="mt-5 text-xs text-[var(--cs-text-muted)]"><Bell className="mr-1 inline h-3.5 w-3.5" />Cara supports professional judgement. Staff and managers remain responsible for decisions, recording, and safeguarding actions.</p>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}

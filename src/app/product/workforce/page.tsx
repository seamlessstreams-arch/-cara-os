// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — WORKFORCE & SAFE ACCESS DEEP-DIVE PAGE  (route: /workforce)
//
// Standalone deep-dive on the staff-management layer. Static server component.
// Honest copy — every capability maps to a real part of the platform.
// ══════════════════════════════════════════════════════════════════════════════

import type { Metadata } from "next";
import Link from "next/link";
import {
  CalendarClock, Fingerprint, MapPin, ShieldAlert, MessageSquare, GraduationCap,
  UserCheck, Bell, Sunrise, Eye, Building2, ClipboardCheck, ArrowRight,
  CheckCircle2, Users, ScrollText,
} from "lucide-react";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { SectionEyebrow, FeatureCard } from "@/components/marketing/ui";

export const metadata: Metadata = {
  title: "Workforce & safe access | Cornerstone Care OS",
  description:
    "Run the whole staffing picture — rotas and shift-based access, Smart Sign-In, safe staffing, supervision, training, safer recruitment and oversight — and turn it into evidence you can show an inspector.",
};

export default function WorkforcePage() {
  return (
    <div className="min-h-screen bg-[var(--cs-bg)] text-[var(--cs-text)]">
      <MarketingHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-70" style={{ background: "radial-gradient(55% 50% at 80% 0%, var(--cs-teal-glow) 0%, transparent 60%), radial-gradient(45% 45% at 0% 30%, var(--cs-aria-glow) 0%, transparent 55%)" }} />
        <div className="relative mx-auto max-w-4xl px-5 py-16 text-center lg:py-24">
          <SectionEyebrow>Workforce &amp; safe access</SectionEyebrow>
          <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] tracking-tight text-[var(--cs-navy)] sm:text-5xl">
            The right people, on shift, with the right access.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-[var(--cs-text-secondary)]">
            Cornerstone runs the whole staffing picture — from the rota to the doorway — and turns supervision, training and
            recruitment into evidence you can show an inspector. One workforce, one source of truth.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link href="/#contact" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--cs-navy)] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[var(--cs-navy-soft)] hover:shadow-md">Book a demo <ArrowRight className="h-4 w-4" /></Link>
            <Link href="/dashboard" className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--cs-border)] bg-white/70 px-5 py-3 text-sm font-semibold text-[var(--cs-navy)] transition-colors hover:bg-white">Explore the platform</Link>
          </div>
        </div>
      </section>

      {/* Three jobs */}
      <section className="border-y border-[var(--cs-border)] bg-white">
        <div className="mx-auto max-w-7xl px-5 py-16">
          <div className="grid gap-5 sm:grid-cols-3">
            {[
              { Icon: UserCheck, t: "The right people", d: "Confirm who is actually on shift and in the building — and that they're cleared, trained and inducted to be there." },
              { Icon: ShieldAlert, t: "The right access", d: "Access follows the rota and the role — staff see what their shift needs, only while they're on it." },
              { Icon: ScrollText, t: "The evidence", d: "Supervision, training and recruitment captured as evidence, ready for Reg 32 and an inspector's questions." },
            ].map((c, i) => (
              <div key={i} className="rounded-2xl border border-[var(--cs-border)] bg-[var(--cs-bg)] p-6">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--cs-navy)] text-white"><c.Icon className="h-6 w-6" /></div>
                <h3 className="mt-4 text-base font-bold text-[var(--cs-navy)]">{c.t}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[var(--cs-text-secondary)]">{c.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Capability grid */}
      <section className="mx-auto max-w-7xl px-5 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <SectionEyebrow>Everything the staffing picture needs</SectionEyebrow>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[var(--cs-navy)] sm:text-4xl">From the rota to the doorway.</h2>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard accent="navy" Icon={CalendarClock} title="Rotas & shift-based access" body="Plan the rota and let it drive access — staff see exactly what their shift needs, only while they're on it." />
          <FeatureCard accent="teal" Icon={Fingerprint} title="Smart Sign-In" body="Clock on with confidence. The right person, on the right shift, before the system unlocks what they need." />
          <FeatureCard accent="gold" Icon={MapPin} title="Geofence, QR & kiosk presence" body="Confirm who is actually in the building — by location, a scan at the door, or a shared kiosk." />
          <FeatureCard accent="teal" Icon={ShieldAlert} title="Safe staffing & emergency" body="Live ratios with alerts the moment cover dips below safe — and an emergency protocol always to hand." />
          <FeatureCard accent="navy" Icon={MessageSquare} title="Supervision & reflective practice" body="1:1s, safeguarding supervision and theme tracking — never an overdue supervision slipping through again." />
          <FeatureCard accent="gold" Icon={GraduationCap} title="Training matrix & CPD" body="Every mandatory course RAG-rated by currency, with the gaps surfaced before they ever lapse." />
          <FeatureCard accent="teal" Icon={UserCheck} title="Safer recruitment & vetting" body="DBS renewals, right-to-work and the full safer-recruitment audit trail, tracked end to end." />
          <FeatureCard accent="navy" Icon={Bell} title="Comms Centre & governance" body="Team messaging with the oversight a regulated setting needs — nothing important lost in a group chat." />
          <FeatureCard accent="gold" Icon={Eye} title="Sensitive-screen protection" body="Confidential information stays protected on shared and public-facing screens." />
        </div>
      </section>

      {/* Sign-in & presence highlight */}
      <section className="border-y border-[var(--cs-border)] bg-white">
        <div className="mx-auto max-w-7xl px-5 py-20">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <SectionEyebrow>Sign-in &amp; presence</SectionEyebrow>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[var(--cs-navy)] sm:text-4xl">Access that knows who&rsquo;s really here.</h2>
              <p className="mt-4 text-lg text-[var(--cs-text-secondary)]">
                Sign-in is more than a clock — it&rsquo;s the gate. Cornerstone confirms presence, ties it to the rota, and only then opens up what a shift needs. When cover dips below safe, you know straight away.
              </p>
              <ul className="mt-6 space-y-2.5">
                {[
                  "Geofence, QR-at-the-door or shared-kiosk presence",
                  "Access scoped to the role and the live shift",
                  "Live ratios with safe-staffing alerts",
                  "Sensitive screens protected on shared devices",
                ].map((t, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-[var(--cs-text-secondary)]"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--cs-teal)]" /> {t}</li>
                ))}
              </ul>
            </div>
            {/* On-duty mock panel */}
            <div className="rounded-3xl border border-[var(--cs-border)] bg-white p-5 shadow-[var(--cs-shadow-card)]">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-bold text-[var(--cs-navy)]"><Users className="h-4 w-4 text-[var(--cs-teal-strong)]" /> On duty now</span>
                <span className="rounded-full bg-[var(--cs-teal-bg)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--cs-teal-strong)]">Safe staffing ✓</span>
              </div>
              <div className="mt-3 space-y-2">
                {[
                  { n: "Olivia Hayes", r: "Day · 08:00–17:00", on: true },
                  { n: "Marcus Bell", r: "Day · 08:00–17:00", on: true },
                  { n: "Samuel Boateng", r: "Day · 10:00–20:00", on: true },
                  { n: "Priya Sharma", r: "Sleep-in · 22:00–07:00", on: false },
                ].map((m, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl border border-[var(--cs-border)]/60 bg-[var(--cs-bg)] px-3 py-2.5">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${m.on ? "bg-[var(--cs-teal)]" : "bg-[var(--cs-text-gentle)]"}`} />
                    <span className="flex-1 text-xs font-semibold text-[var(--cs-navy)]">{m.n}</span>
                    <span className="text-[10px] font-medium text-[var(--cs-text-muted)]">{m.r}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${m.on ? "bg-[var(--cs-teal-bg)] text-[var(--cs-teal-strong)]" : "bg-[var(--cs-border)]/40 text-[var(--cs-text-muted)]"}`}>{m.on ? "On now" : "Later"}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-2xl border border-[var(--cs-border)]/60 bg-[var(--cs-aria-gold-bg)]/50 px-4 py-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[var(--cs-navy)]"><GraduationCap className="h-4 w-4 text-[var(--cs-aria-gold)]" /> Training currency</div>
                <p className="mt-1 text-[11px] text-[var(--cs-text-secondary)]">Safeguarding, first aid, medication &amp; Team-Teach all in date for staff on shift.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Develop & evidence */}
      <section className="mx-auto max-w-7xl px-5 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <SectionEyebrow>Develop &amp; evidence your team</SectionEyebrow>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[var(--cs-navy)] sm:text-4xl">Supervision, training and recruitment — never out of date.</h2>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-3">
          {[
            { Icon: MessageSquare, t: "Supervise & reflect", points: ["1:1 & safeguarding supervision", "Reflective-practice themes", "Overdue supervision surfaced", "Patterns across the team"] },
            { Icon: GraduationCap, t: "Train & develop", points: ["Mandatory-training matrix", "RAG-rated by currency", "CPD & specialist courses", "Gaps flagged before they lapse"] },
            { Icon: UserCheck, t: "Recruit safely", points: ["Safer-recruitment audit trail", "DBS renewals tracked", "Right-to-work checks", "Reg 32 evidence, ready"] },
          ].map((b, i) => (
            <div key={i} className="rounded-2xl border border-[var(--cs-border)] bg-white p-6 shadow-[var(--cs-shadow-card)]">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--cs-teal-bg)] text-[var(--cs-teal-strong)]"><b.Icon className="h-6 w-6" /></div>
              <h3 className="mt-4 text-base font-bold text-[var(--cs-navy)]">{b.t}</h3>
              <ul className="mt-3 space-y-1.5">
                {b.points.map((p, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm text-[var(--cs-text-secondary)]"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--cs-teal)]" /> {p}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Oversight band */}
      <section className="relative overflow-hidden bg-[var(--cs-navy)] text-white">
        <div className="pointer-events-none absolute inset-0 opacity-40" style={{ background: "radial-gradient(50% 60% at 100% 0%, var(--cs-teal-glow) 0%, transparent 55%)" }} />
        <div className="relative mx-auto max-w-7xl px-5 py-20">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <span className="inline-block rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[var(--cs-teal-soft)]">Leadership &amp; oversight</span>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">Lead the shift today. Oversee the group from anywhere.</h2>
              <p className="mt-4 text-lg text-white/75">
                The <span className="font-semibold text-white">Shift Briefing</span> gives staff coming on duty one screen — who&rsquo;s on, what&rsquo;s due this shift, and what happened overnight. For Responsible Individuals, oversight rolls up across every home — readiness, risk and direction of travel, without chasing.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { Icon: Sunrise, t: "Shift Briefing", d: "Who's on, what's due, overnight events — for whoever's coming on duty." },
                { Icon: ClipboardCheck, t: "Workforce oversight", d: "Wellbeing, conduct and capacity — captured as evidence, not anecdote." },
                { Icon: Building2, t: "RI oversight", d: "Readiness, risk and direction of travel across every home in the group." },
                { Icon: ShieldAlert, t: "Safe staffing", d: "Live ratios and alerts the moment cover dips below safe." },
              ].map((c, i) => (
                <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                  <c.Icon className="h-6 w-6 text-[var(--cs-teal-soft)]" />
                  <h3 className="mt-3 text-sm font-bold">{c.t}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-white/65">{c.d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-5 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-[var(--cs-navy)] sm:text-4xl">Run a safer, calmer staffing operation.</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-[var(--cs-text-secondary)]">See how Cornerstone joins the rota, the doorway and the evidence into one picture.</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/#contact" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--cs-navy)] px-6 py-3.5 text-sm font-bold text-white transition-all hover:bg-[var(--cs-navy-soft)] hover:shadow-md">Book a demo <ArrowRight className="h-4 w-4" /></Link>
            <Link href="/product/intelligence" className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--cs-border)] bg-white px-6 py-3.5 text-sm font-bold text-[var(--cs-navy)] transition-colors hover:bg-[var(--cs-bg)]">Explore intelligence <CheckCircle2 className="h-4 w-4 text-[var(--cs-teal)]" /></Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}

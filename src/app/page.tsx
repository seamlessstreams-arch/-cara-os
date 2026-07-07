// ══════════════════════════════════════════════════════════════════════════════
// CARA — PUBLIC MARKETING HOME PAGE  (route: /)
//
// Positioning: THE CARE INTELLIGENCE OS FOR CHILDREN'S HOMES.
// "Cara turns everyday residential care into live safeguarding intelligence."
// Leads with the real buyer fear (something happens, recording is weak, the
// child's voice is missed, patterns aren't spotted, leaders can't prove grip)
// and resolves it through five intelligence layers. Honest wording throughout:
// supports / prompts / helps evidence — never guarantees, never replaces
// professional judgement. Static server component; every claim maps to a real
// capability in the platform.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight, PenLine, ShieldAlert, HeartHandshake, ClipboardCheck, GraduationCap,
  Radar, Eye, Quote, CheckCircle2, Siren, Users, Baby, Lock, ScrollText,
  KeyRound, UserCheck, Brain, FileCheck, Ear, Sparkles, Cpu, ShieldCheck,
} from "lucide-react";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { SectionEyebrow, PrimaryButton, GhostButton } from "@/components/marketing/ui";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Cara | The Care Intelligence OS for children's homes",
  description: BRAND.description,
};

// ── The five intelligence layers ──────────────────────────────────────────────

const LAYERS = [
  {
    Icon: PenLine, accent: "teal", href: "/product/tour",
    t: "Care Recording Intelligence",
    d: "Record the whole day the natural way — and let every entry work harder than the page it's written on.",
    pts: ["Daily logs, handovers & key work", "Health, education & family time", "Sleep, food, mood & routines", "Positive moments & the child's voice"],
  },
  {
    Icon: ShieldAlert, accent: "gold", href: "/product/safeguarding",
    t: "Safeguarding Intelligence",
    d: "Patterns surface while they're still patterns — not after they've become incidents.",
    pts: ["Missing episodes & return welfare", "CCE/CSE & grooming indicators", "Peer, location & online risk", "Escalation and de-escalation over time"],
  },
  {
    Icon: HeartHandshake, accent: "navy", href: "/product/intelligence#practice-assistant",
    t: "Practice Quality Intelligence",
    d: "A highly-trained critical friend that professionally challenges your language, stance and thinking — PACE- and trauma-informed, always with the child in mind.",
    pts: ["Language checks & re-writes", "Co-regulation prompts in the moment", "Reflective questions & debriefs", "Staff development themes"],
  },
  {
    Icon: ClipboardCheck, accent: "teal", href: "/product/compliance",
    t: "Compliance Intelligence",
    d: "Reg 40 prompts, Annex A readiness and the evidence trail — maintained live, not rebuilt the night before.",
    pts: ["Regulation 40/44/45 support", "Supervision, training & safer recruitment", "Medication, fire & premises checks", "Leadership oversight & audit trail"],
  },
  {
    Icon: GraduationCap, accent: "gold", href: "/product/intelligence",
    t: "Learning & Curriculum Intelligence",
    d: "Turn what the records reveal into learning the child can actually use — adapted to how they learn.",
    pts: ["Patterns → learning plans", "Emotional & situational literacy", "Exploitation awareness & online safety", "SEND-adapted sessions & materials"],
  },
];

const MANAGER_POINTS = ["Recording gaps highlighted before they become inspection findings", "Risk patterns across children, places and times", "Supervision themes and compliance tasks in one view", "Evidence of each child's progress from their starting point"];
const STAFF_POINTS = ["Plain-English prompts that show what good recording looks like", "Trauma-informed language support as you write", "The child's voice captured in every record type", "Reflective questions that build confidence, not judgement"];
const CHILD_POINTS = ["Their voice, feelings and wishes recorded and surfaced — not lost in paperwork", "Triggers, calming strategies and routines known by every shift", "Progress measured from their starting point, not an average", "Learning that fits how they actually learn"];

const TRUST = [
  { Icon: Brain, t: "Human decisions stay central" },
  { Icon: KeyRound, t: "Role-based access" },
  { Icon: ScrollText, t: "Audit trails throughout" },
  { Icon: Lock, t: "Sensitive data protected" },
  { Icon: UserCheck, t: "Manager review built in" },
  { Icon: Eye, t: "Explainable, never a black box" },
  { Icon: FileCheck, t: "Evidence you can stand behind" },
  { Icon: Ear, t: "The child's voice, kept" },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--cs-bg)] text-[var(--cs-text)]">
      <MarketingHeader />

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-70" style={{ background: "radial-gradient(60% 50% at 75% 0%, var(--cs-teal-glow) 0%, transparent 60%), radial-gradient(50% 45% at 0% 25%, var(--cs-cara-glow) 0%, transparent 55%)" }} />
        <div className="relative mx-auto max-w-4xl px-5 py-16 text-center lg:py-24">
          <SectionEyebrow>{BRAND.category}</SectionEyebrow>
          <h1 className="mt-5 text-4xl font-extrabold leading-[1.07] tracking-tight text-[var(--cs-navy)] sm:text-5xl lg:text-6xl">
            Cara turns everyday residential care into live safeguarding intelligence.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[var(--cs-text-secondary)]">
            Cara helps children&rsquo;s homes record in the moment, identify safeguarding patterns, support reflective
            practice, and evidence the impact of care — without losing professional judgement or the child&rsquo;s voice.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <PrimaryButton href="/contact">Book a Demo <ArrowRight className="h-4 w-4" /></PrimaryButton>
            <GhostButton href="/product/intelligence">Explore Cara Intelligence</GhostButton>
          </div>
          <p className="mt-6 text-xs text-[var(--cs-text-muted)]">One total system: recording, safeguarding, workforce, compliance and learning — together.</p>
        </div>
      </section>

      {/* ── Promise bar ──────────────────────────────────────────────────────── */}
      <section className="border-y border-[var(--cs-border)] bg-white/60">
        <div className="mx-auto max-w-4xl px-5 py-6 text-center">
          <p className="text-base font-bold text-[var(--cs-navy)]">Stay one step ahead of risk, recording, safeguarding and Ofsted evidence.</p>
          <p className="mt-1 text-sm text-[var(--cs-text-secondary)]">Cara turns daily care into live care intelligence — so nothing important waits for the monthly audit to be noticed.</p>
        </div>
      </section>

      {/* ── The problem ──────────────────────────────────────────────────────── */}
      <section id="problem" className="mx-auto max-w-4xl px-5 py-20">
        <div className="text-center">
          <SectionEyebrow>The problem</SectionEyebrow>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[var(--cs-navy)] sm:text-4xl">The information is all there. It just isn&rsquo;t connected.</h2>
        </div>
        <div className="mt-8 space-y-5 text-lg leading-relaxed text-[var(--cs-text-secondary)]">
          <p>
            Children&rsquo;s homes are full of information — incidents, risks, emotions, patterns, conversations, missing
            episodes, staff decisions, and children&rsquo;s voices. Too often, that information is recorded late, recorded
            inconsistently, or never connected.
          </p>
          <p className="font-medium text-[var(--cs-navy)]">
            And underneath the paperwork sits the fear every leader knows: what if something happens, the recording is
            weak, the child&rsquo;s voice is missed, the pattern isn&rsquo;t spotted — and you can&rsquo;t show you had grip?
          </p>
          <p>Cara changes that.</p>
        </div>
      </section>

      {/* ── The solution ─────────────────────────────────────────────────────── */}
      <section id="solution" className="border-y border-[var(--cs-border)] bg-white">
        <div className="mx-auto max-w-4xl px-5 py-16 text-center">
          <SectionEyebrow>The Cara solution</SectionEyebrow>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[var(--cs-navy)] sm:text-4xl">Daily records become live intelligence.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-[var(--cs-text-secondary)]">
            Cara turns daily care records into live intelligence, helping staff and managers see what is happening,
            what is changing, what needs attention, and what evidence shows impact — the moment a record lands, across
            around 300 explainable engines.
          </p>
        </div>
      </section>

      {/* ── Meet Ask CARA ────────────────────────────────────────────────────── */}
      <section id="ask-cara" className="border-y border-[var(--cs-border)] bg-white">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 lg:grid-cols-2">
          {/* Copy */}
          <div>
            <SectionEyebrow>New · Ask CARA</SectionEyebrow>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[var(--cs-navy)] sm:text-4xl">Just ask. CARA answers from your records — never a guess.</h2>
            <p className="mt-4 text-lg leading-relaxed text-[var(--cs-text-secondary)]">
              A governed AI assistant on every page. Ask anything about the home, a child or your team —
              &ldquo;what&rsquo;s overdue?&rdquo;, &ldquo;who needs a review?&rdquo;, &ldquo;what should I do after this
              incident?&rdquo; — and CARA answers instantly from your live records, with the sources shown. It drafts,
              checks and routes the work; it never decides safeguarding, and it never invents a fact.
            </p>
            <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
              {[
                { Icon: Cpu, t: "Deterministic — every answer traces to a record" },
                { Icon: Lock, t: "No child data leaves the platform" },
                { Icon: ShieldCheck, t: "Prompt-injection guarded, fail-closed" },
                { Icon: ScrollText, t: "Every answer hashed & audited" },
                { Icon: Brain, t: "Refuses to decide safeguarding — that stays human" },
                { Icon: KeyRound, t: "Role-based — sees only what you may" },
              ].map((c, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-[var(--cs-text-secondary)]"><c.Icon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--cs-teal-strong)]" /> {c.t}</li>
              ))}
            </ul>
            <p className="mt-6 text-xs text-[var(--cs-text-muted)]">CARA is the sanctioned, deterministic replacement for staff pasting sensitive information into public chatbots — the answers come from your records, and the audit trail is yours.</p>
          </div>

          {/* Dark app visual — a look at Ask CARA in the platform's immersive skin */}
          <div className="relative">
            <div className="pointer-events-none absolute -inset-4 opacity-60" style={{ background: "radial-gradient(60% 50% at 80% 0%, var(--cs-teal-glow) 0%, transparent 60%)" }} />
            <div className="relative overflow-hidden rounded-3xl border border-white/10 p-5 shadow-[var(--cs-shadow-elevated)]" style={{ background: "radial-gradient(120% 90% at 100% -10%, rgba(99,102,241,0.20) 0%, transparent 52%), linear-gradient(180deg,#0a0f1f 0%,#0c1226 55%,#0e1730 100%)" }}>
              {/* greeting */}
              <div className="flex items-center gap-3">
                <svg viewBox="0 0 24 24" className="h-8 w-8 drop-shadow-[0_0_12px_rgba(96,165,250,0.5)]" aria-hidden><defs><linearGradient id="mk-spark" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#2dd4bf" /><stop offset="0.5" stopColor="#60a5fa" /><stop offset="1" stopColor="#a78bfa" /></linearGradient></defs><path d="M12 0C13.4 6.9 17.1 10.6 24 12C17.1 13.4 13.4 17.1 12 24C10.6 17.1 6.9 13.4 0 12C6.9 10.6 10.6 6.9 12 0Z" fill="url(#mk-spark)" /></svg>
                <div>
                  <div className="text-[15px] font-light text-slate-100">Hi Darren — ready when you are</div>
                  <div className="text-[11px] text-slate-400">I answer from this home&rsquo;s records — never a guess.</div>
                </div>
              </div>
              {/* thread */}
              <div className="mt-5 space-y-3">
                <div className="flex justify-end"><div className="max-w-[80%] rounded-3xl rounded-br-lg bg-indigo-500/90 px-3.5 py-2 text-[13px] text-white shadow-lg">What&rsquo;s overdue across the home right now?</div></div>
                <div className="flex gap-2.5">
                  <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0" aria-hidden><defs><linearGradient id="mk-spark2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#2dd4bf" /><stop offset="0.5" stopColor="#60a5fa" /><stop offset="1" stopColor="#a78bfa" /></linearGradient></defs><path d="M12 0C13.4 6.9 17.1 10.6 24 12C17.1 13.4 13.4 17.1 12 24C10.6 17.1 6.9 13.4 0 12C6.9 10.6 10.6 6.9 12 0Z" fill="url(#mk-spark2)" /></svg>
                  <div className="min-w-0">
                    <p className="text-[13px] leading-relaxed text-slate-200">Three things need attention today: <b className="text-white">Alex&rsquo;s restraint on 5 Jul has no debrief</b>, a <b className="text-white">return interview is missing</b> for Jordan (back 4 Jul), and <b className="text-white">Ellie&rsquo;s LAC review</b> falls due in 6 days. Two daily logs are waiting for your oversight sign-off.</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {["Incidents · 1", "Missing episodes · 1", "Reviews · 1", "Oversight · 2"].map((s) => (
                        <span key={s} className="rounded-full bg-white/[0.07] px-2 py-0.5 text-[10.5px] text-slate-300">{s}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              {/* composer */}
              <div className="mt-5 flex items-center gap-1 rounded-full border border-white/10 bg-[#161b2b]/95 px-1.5 py-1.5 shadow-2xl">
                <span className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400">+</span>
                <span className="flex-1 px-1 text-[13px] text-slate-500">Ask CARA…</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500 text-white">↑</span>
              </div>
              <p className="mt-2 text-center text-[10px] text-slate-500">Deterministic · from your live records · never a safeguarding decision</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Five intelligence layers ─────────────────────────────────────────── */}
      <section id="layers" className="mx-auto max-w-7xl px-5 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <SectionEyebrow>Five intelligence layers</SectionEyebrow>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[var(--cs-navy)] sm:text-4xl">One system. Five ways it thinks with you.</h2>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {LAYERS.map((l, i) => {
            const ring = l.accent === "teal" ? "bg-[var(--cs-teal-bg)] text-[var(--cs-teal-strong)]" : l.accent === "gold" ? "bg-[var(--cs-cara-gold-bg)] text-[var(--cs-cara-gold)]" : "bg-[var(--cs-navy)]/5 text-[var(--cs-navy)]";
            return (
              <Link key={i} href={l.href} className="group flex flex-col rounded-2xl border border-[var(--cs-border)] bg-white p-6 shadow-[var(--cs-shadow-card)] transition-transform hover:-translate-y-0.5">
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${ring}`}><l.Icon className="h-6 w-6" /></div>
                <h3 className="mt-4 text-base font-bold text-[var(--cs-navy)]">{l.t}</h3>
                <p className="mt-1 text-sm leading-relaxed text-[var(--cs-text-secondary)]">{l.d}</p>
                <ul className="mt-3 flex-1 space-y-1.5">
                  {l.pts.map((p, j) => (
                    <li key={j} className="flex items-start gap-2 text-xs text-[var(--cs-text-secondary)]"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--cs-teal)]" /> {p}</li>
                  ))}
                </ul>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[var(--cs-teal-strong)]">Explore <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" /></span>
              </Link>
            );
          })}
          {/* In-the-moment card completes the grid */}
          <div className="flex flex-col rounded-2xl border-2 border-[var(--cs-teal)] bg-[var(--cs-teal-bg)]/30 p-6 shadow-[var(--cs-shadow-card)]">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--cs-navy)] text-white"><Siren className="h-6 w-6" /></div>
            <h3 className="mt-4 text-base font-bold text-[var(--cs-navy)]">In the moment, on the hardest shifts</h3>
            <p className="mt-1 flex-1 text-sm leading-relaxed text-[var(--cs-text-secondary)]">
              During an incident, Cara supports staff with co-regulation prompts, reflective recording, professional
              language, safeguarding reminders and follow-up actions — while the manager keeps oversight of every draft.
            </p>
            <Link href="/product/tour" className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[var(--cs-teal-strong)]">See Incident Mode in the tour <ArrowRight className="h-3 w-3" /></Link>
          </div>
        </div>
      </section>

      {/* ── Reliable by design ───────────────────────────────────────────────── */}
      <section id="reliability" className="mx-auto max-w-7xl px-5 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <SectionEyebrow>Reliable by design</SectionEyebrow>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[var(--cs-navy)] sm:text-4xl">Built to keep working — with or without AI.</h2>
          <p className="mt-4 text-lg text-[var(--cs-text-secondary)]">
            Cara&rsquo;s intelligence runs on around 300 deterministic engines — transparent rules that read your records the
            same way every time. AI adds extra help on top, but it&rsquo;s an enhancement, never a dependency: if AI is ever
            unavailable, every core feature keeps working.
          </p>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {[
            { Icon: Cpu, t: "Deterministic at the core", d: "Patterns, RAG ratings, compliance and evidence are computed by auditable rules — not an AI black box. Same records in, same result out, every time." },
            { Icon: Sparkles, t: "AI as enhancement, not dependency", d: "When AI is available it drafts, narrates and rewrites. When it isn't, Cara falls back to deterministic output — you still get the report, the plan and the analysis." },
            { Icon: ShieldCheck, t: "No single point of failure", d: "Live care data is never trapped behind a model call. Recording, intelligence and evidence stay available on the hardest shifts — when you need them most." },
          ].map((c, i) => (
            <div key={i} className="rounded-2xl border border-[var(--cs-border)] bg-white p-7 shadow-[var(--cs-shadow-card)]">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--cs-teal-bg)] text-[var(--cs-teal-strong)]"><c.Icon className="h-6 w-6" /></div>
              <h3 className="mt-4 text-lg font-bold text-[var(--cs-navy)]">{c.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--cs-text-secondary)]">{c.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── For managers / staff / children ──────────────────────────────────── */}
      <section id="who" className="border-y border-[var(--cs-border)] bg-white">
        <div className="mx-auto max-w-7xl px-5 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <SectionEyebrow>Built for the whole home</SectionEyebrow>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[var(--cs-navy)] sm:text-4xl">Grip for managers. Confidence for staff. A voice for children.</h2>
          </div>
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {[
              { Icon: Radar, t: "For managers", d: "Maintain grip across the home without chasing paper.", pts: MANAGER_POINTS },
              { Icon: Users, t: "For staff", d: "Record confidently, reflect honestly, grow professionally.", pts: STAFF_POINTS },
              { Icon: Baby, t: "For children", d: "Nothing about them gets lost in the system meant to protect them.", pts: CHILD_POINTS },
            ].map((c, i) => (
              <div key={i} className="rounded-2xl border border-[var(--cs-border)] bg-[var(--cs-bg)] p-6">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--cs-navy)] text-white"><c.Icon className="h-6 w-6" /></div>
                <h3 className="mt-4 text-lg font-bold text-[var(--cs-navy)]">{c.t}</h3>
                <p className="mt-1 text-sm text-[var(--cs-text-secondary)]">{c.d}</p>
                <ul className="mt-3 space-y-2">
                  {c.pts.map((p, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-[var(--cs-text-secondary)]"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--cs-teal)]" /> {p}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Inspection readiness ─────────────────────────────────────────────── */}
      <section id="inspection" className="mx-auto max-w-4xl px-5 py-20">
        <div className="text-center">
          <SectionEyebrow>Inspection readiness</SectionEyebrow>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[var(--cs-navy)] sm:text-4xl">When Ofsted asks, the evidence is already there.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-[var(--cs-text-secondary)]">
            Cara supports leaders to evidence safeguarding, progress, management oversight, staff practice, learning
            from incidents, and impact from each child&rsquo;s starting point — maintained live across the year, mapped to
            the way inspectors read a home.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {["Live readiness across all judgement areas", "Reg 40 prompts — the decision stays the manager's", "Annex A & Reg 44/45 evidence support", "Print-ready home & child report packs"].map((t) => (
              <span key={t} className="rounded-full border border-[var(--cs-teal-soft)] bg-[var(--cs-teal-bg)] px-4 py-2 text-sm font-semibold text-[var(--cs-teal-strong)]">{t}</span>
            ))}
          </div>
          <p className="mt-6 text-xs text-[var(--cs-text-muted)]">Cara helps you evidence quality — no system can (or should) promise inspection outcomes.</p>
        </div>
      </section>

      {/* ── Security & trust ─────────────────────────────────────────────────── */}
      <section id="trust" className="border-y border-[var(--cs-border)] bg-white">
        <div className="mx-auto max-w-5xl px-5 py-20 text-center">
          <SectionEyebrow>Security &amp; trust</SectionEyebrow>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[var(--cs-navy)] sm:text-4xl">Built for the most sensitive records there are.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-[var(--cs-text-secondary)]">
            Cara&rsquo;s intelligence supports, prompts and summarises — it never replaces professional judgement, and a
            human reviews anything that matters. {BRAND.assistDisclaimer}
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TRUST.map((s, i) => (
              <div key={i} className="flex flex-col items-center gap-2 rounded-2xl border border-[var(--cs-border)] bg-[var(--cs-bg)] p-5">
                <s.Icon className="h-6 w-6 text-[var(--cs-teal-strong)]" />
                <span className="text-sm font-semibold text-[var(--cs-navy)]">{s.t}</span>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <Link href="/security" className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--cs-border)] bg-white px-5 py-3 text-sm font-semibold text-[var(--cs-navy)] transition-colors hover:bg-[var(--cs-bg)]">Read about security &amp; trust <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </section>

      {/* ── Story ────────────────────────────────────────────────────────────── */}
      <section id="story" className="mx-auto max-w-3xl px-5 py-20">
        <div className="rounded-3xl border border-[var(--cs-border)] bg-[var(--cs-cara-gold-bg)] p-8 text-center">
          <Quote className="mx-auto h-7 w-7 text-[var(--cs-cara-gold)]" />
          <p className="mt-3 text-lg font-medium leading-relaxed text-[var(--cs-navy)]">
            &ldquo;Cara was built inside a real children&rsquo;s home — by people who&rsquo;ve run the shift, written the Reg 40 at
            2am, and sat across from the inspector. The records were never the point. The children are.&rdquo;
          </p>
          <Link href="/about" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--cs-navy)] hover:text-[var(--cs-teal-strong)]">Our story <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-5 pb-20">
        <div className="relative overflow-hidden rounded-3xl bg-[var(--cs-navy)] px-6 py-16 text-center text-white shadow-[var(--cs-shadow-card)]">
          <div className="pointer-events-none absolute inset-0 opacity-50" style={{ background: "radial-gradient(50% 80% at 50% 0%, var(--cs-teal-glow) 0%, transparent 60%)" }} />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Ready to turn recording into intelligence?</h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-white/75">See Cara on a real home&rsquo;s rhythm — recording, intelligence, oversight and evidence, live.</p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="/contact" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-[var(--cs-navy)] transition-transform hover:-translate-y-0.5">Book a Demo <ArrowRight className="h-4 w-4" /></Link>
              <Link href="/product/tour" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/5 px-6 py-3.5 text-sm font-bold text-white transition-colors hover:bg-white/10">Take the product tour <Sparkles className="h-4 w-4" /></Link>
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// CARA — PUBLIC MARKETING HOME PAGE  (route: /)
//
// "Midnight & gold — the lights are on all night."
// A children's home never sleeps, and neither does the intelligence holding the
// thread. The page opens in the platform's own midnight world (a living
// constellation — one node per deterministic engine), flows through warm paper
// chapters, and closes in midnight. Fraunces carries the display voice.
//
// Positioning unchanged and HONEST throughout: supports / prompts / helps
// evidence — never guarantees, never replaces professional judgement. Every
// claim maps to a shipped capability. Motion respects prefers-reduced-motion.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight, PenLine, ShieldAlert, HeartHandshake, ClipboardCheck, GraduationCap,
  Radar, Eye, CheckCircle2, Siren, Users, Baby, Lock, ScrollText,
  KeyRound, UserCheck, Brain, FileCheck, Ear, Sparkles, Cpu, ShieldCheck,
} from "lucide-react";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { Reveal, TiltCard, CountUp, Marquee, ScrollProgress } from "@/components/marketing/fx";
import { HeroField } from "@/components/marketing/hero-field";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Cara | The Care Intelligence OS for children's homes",
  description: BRAND.description,
};

// ── The five intelligence layers ──────────────────────────────────────────────

const LAYERS = [
  {
    Icon: PenLine, accent: "teal", href: "/product/tour", n: "01",
    t: "Care Recording Intelligence",
    d: "Record the whole day the natural way — and let every entry work harder than the page it's written on.",
    pts: ["Daily logs, handovers & key work", "Health, education & family time", "Sleep, food, mood & routines", "Positive moments & the child's voice"],
  },
  {
    Icon: ShieldAlert, accent: "gold", href: "/product/safeguarding", n: "02",
    t: "Safeguarding Intelligence",
    d: "Patterns surface while they're still patterns — not after they've become incidents.",
    pts: ["Missing episodes & return welfare", "CCE/CSE & grooming indicators", "Peer, location & online risk", "Escalation and de-escalation over time"],
  },
  {
    Icon: HeartHandshake, accent: "navy", href: "/product/intelligence#practice-assistant", n: "03",
    t: "Practice Quality Intelligence",
    d: "A highly-trained critical friend that professionally challenges your language, stance and thinking — PACE- and trauma-informed, always with the child in mind.",
    pts: ["Language checks & re-writes", "Co-regulation prompts in the moment", "Reflective questions & debriefs", "Staff development themes"],
  },
  {
    Icon: ClipboardCheck, accent: "teal", href: "/product/compliance", n: "04",
    t: "Compliance Intelligence",
    d: "Reg 40 prompts, Annex A readiness and the evidence trail — maintained live, not rebuilt the night before.",
    pts: ["Regulation 40/44/45 support", "Supervision, training & safer recruitment", "Medication, fire & premises checks", "Leadership oversight & audit trail"],
  },
  {
    Icon: GraduationCap, accent: "gold", href: "/product/intelligence", n: "05",
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

// Every name below is genuinely in Cara's knowledge base / regulatory scope.
const FRAMEWORKS = [
  "PACE", "Dyadic Developmental Practice", "The CARE Model", "Non-Violent Resistance",
  "Social Pedagogy", "ACEs & Trauma-Informed Practice", "Window of Tolerance",
  "Rupture & Repair", "Contextual Safeguarding", "Children's Homes Regulations 2015",
  "SCCIF", "Regulation 40 · 44 · 45",
];

const spark = (id: string) => (
  <svg viewBox="0 0 24 24" className="h-8 w-8 drop-shadow-[0_0_12px_rgba(96,165,250,0.5)]" aria-hidden>
    <defs><linearGradient id={id} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#2dd4bf" /><stop offset="0.5" stopColor="#60a5fa" /><stop offset="1" stopColor="#a78bfa" /></linearGradient></defs>
    <path d="M12 0C13.4 6.9 17.1 10.6 24 12C17.1 13.4 13.4 17.1 12 24C10.6 17.1 6.9 13.4 0 12C6.9 10.6 10.6 6.9 12 0Z" fill={`url(#${id})`} />
  </svg>
);

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--cs-bg)] text-[var(--cs-text)]">
      <ScrollProgress />
      <MarketingHeader />

      {/* ── HERO — the constellation ─────────────────────────────────────────── */}
      <section className="mk-midnight relative overflow-hidden">
        <HeroField className="pointer-events-none absolute inset-0 h-full w-full opacity-90" />
        {/* horizon glow that grounds the sphere */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40" style={{ background: "linear-gradient(180deg, transparent, rgba(7,13,30,0.9))" }} />

        <div className="relative mx-auto flex min-h-[88vh] max-w-5xl flex-col items-center justify-center px-5 py-24 text-center">
          <div className="mk-enter" style={{ "--mk-delay": "80ms" } as React.CSSProperties}>
            <span className="mk-glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-teal-200/90">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-teal-300 shadow-[0_0_8px_rgba(45,212,191,0.9)]" />
              {BRAND.category}
            </span>
          </div>

          <h1 className="mk-display mk-enter mt-8 text-[clamp(2.6rem,6.2vw,4.9rem)] text-white" style={{ "--mk-delay": "220ms" } as React.CSSProperties}>
            Every record.
            <br />
            Every pattern.
            <br />
            <span className="mk-display-it mk-aurora-text">Every child, seen.</span>
          </h1>

          <p className="mk-enter mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-slate-300/90 sm:text-xl" style={{ "--mk-delay": "400ms" } as React.CSSProperties}>
            Cara turns everyday residential care into live safeguarding intelligence — recording in the moment,
            surfacing patterns early, supporting reflective practice and evidencing impact, without ever losing
            professional judgement or the child&rsquo;s voice.
          </p>

          <div className="mk-enter mt-10 flex flex-wrap items-center justify-center gap-4" style={{ "--mk-delay": "560ms" } as React.CSSProperties}>
            <Link href="/contact" className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--cs-cara-gold)] px-7 py-4 text-sm font-bold text-[#0a1020] shadow-[0_0_32px_rgba(200,155,60,0.3)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_48px_rgba(200,155,60,0.45)]">
              Book a Demo <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>
            <Link href="/product/tour" className="mk-glass inline-flex items-center justify-center gap-2 rounded-2xl px-7 py-4 text-sm font-bold text-white transition-all duration-300 hover:-translate-y-1 hover:bg-white/10">
              Take the tour <Sparkles className="h-4 w-4 text-teal-300" />
            </Link>
          </div>

          <div className="mk-enter mt-14 grid w-full max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3" style={{ "--mk-delay": "720ms" } as React.CSSProperties}>
            {[
              { v: <CountUp to={300} prefix="~" />, l: "deterministic engines reading every record" },
              { v: <CountUp to={5} />, l: "intelligence layers across one connected home" },
              { v: <CountUp to={0} />, l: "child data sent to public AI — ever" },
            ].map((s, i) => (
              <div key={i} className="mk-glass mk-float rounded-2xl px-5 py-4 text-left" style={{ animationDelay: `${i * 1.2}s` }}>
                <div className="text-2xl font-extrabold text-white">{s.v}</div>
                <div className="mt-1 text-xs leading-snug text-slate-400">{s.l}</div>
              </div>
            ))}
          </div>

          <div className="mk-enter mt-16 flex flex-col items-center gap-2 text-slate-500" style={{ "--mk-delay": "900ms" } as React.CSSProperties} aria-hidden>
            <span className="text-[10px] font-bold uppercase tracking-[0.25em]">The whole story</span>
            <span className="block h-9 w-px animate-pulse bg-gradient-to-b from-slate-500 to-transparent" />
          </div>
        </div>
      </section>

      {/* ── Framework marquee — the practice knowledge Cara stands on ────────── */}
      <section className="border-b border-white/[0.06] bg-[#070d1e] py-6">
        <p className="mb-4 text-center text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">Grounded in the practice frameworks your home already lives by</p>
        <Marquee>
          {FRAMEWORKS.map((f) => (
            <span key={f} className="flex items-center gap-3 whitespace-nowrap text-sm font-semibold text-slate-400">
              <span className="inline-block h-1 w-1 rounded-full bg-teal-400/60" /> {f}
            </span>
          ))}
        </Marquee>
      </section>

      {/* ── THE PROBLEM — daylight chapter ───────────────────────────────────── */}
      <section id="problem" className="mx-auto max-w-4xl px-5 py-24 lg:py-32">
        <Reveal className="text-center">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--cs-teal-strong)]">The problem</span>
          <h2 className="mk-display mt-5 text-4xl text-[var(--cs-navy)] sm:text-5xl">
            The information is all there.
            <br />
            <span className="mk-display-it text-[var(--cs-text-muted)]">It just isn&rsquo;t connected.</span>
          </h2>
        </Reveal>
        <Reveal delay={120} className="mt-10 space-y-6 text-lg leading-relaxed text-[var(--cs-text-secondary)]">
          <p>
            Children&rsquo;s homes are full of information — incidents, risks, emotions, patterns, conversations, missing
            episodes, staff decisions, and children&rsquo;s voices. Too often, that information is recorded late, recorded
            inconsistently, or never connected.
          </p>
        </Reveal>
        <Reveal delay={200} className="mt-10">
          <p className="mk-display-it border-l-2 border-[var(--cs-cara-gold)] pl-6 text-2xl leading-snug text-[var(--cs-navy)] sm:text-[1.7rem]">
            And underneath the paperwork sits the fear every leader knows: what if something happens, the recording is
            weak, the child&rsquo;s voice is missed, the pattern isn&rsquo;t spotted — and you can&rsquo;t show you had grip?
          </p>
        </Reveal>
      </section>

      {/* ── THE TURN — a midnight beat ───────────────────────────────────────── */}
      <section className="mk-midnight-flat relative overflow-hidden py-20">
        <div className="mk-aurora-line absolute inset-x-0 top-0 h-px opacity-70" aria-hidden />
        <div className="mx-auto max-w-4xl px-5 text-center">
          <Reveal>
            <h2 className="mk-display text-4xl text-white sm:text-5xl">Cara changes that.</h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-slate-300/90">
              The moment a record lands, around 300 explainable engines read it — connecting what is happening, what is
              changing, what needs attention, and what evidence shows impact. Daily records become live intelligence.
            </p>
          </Reveal>
        </div>
        <div className="mk-aurora-line absolute inset-x-0 bottom-0 h-px opacity-40" aria-hidden />
      </section>

      {/* ── FIVE LAYERS — numbered, tilting ──────────────────────────────────── */}
      <section id="layers" className="mx-auto max-w-7xl px-5 py-24 lg:py-28">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--cs-teal-strong)]">Five intelligence layers</span>
          <h2 className="mk-display mt-5 text-4xl text-[var(--cs-navy)] sm:text-5xl">One system. <span className="mk-display-it">Five ways it thinks with you.</span></h2>
        </Reveal>
        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {LAYERS.map((l, i) => {
            const ring = l.accent === "teal" ? "bg-[var(--cs-teal-bg)] text-[var(--cs-teal-strong)]" : l.accent === "gold" ? "bg-[var(--cs-cara-gold-bg)] text-[var(--cs-cara-gold)]" : "bg-[var(--cs-navy)]/5 text-[var(--cs-navy)]";
            return (
              <Reveal key={i} delay={i * 90}>
                <TiltCard className="h-full rounded-3xl">
                  <Link href={l.href} className="group flex h-full flex-col rounded-3xl border border-[var(--cs-border)] bg-white p-7 shadow-[var(--cs-shadow-card)]">
                    <div className="flex items-start justify-between">
                      <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${ring}`}><l.Icon className="h-6 w-6" /></div>
                      <span className="mk-display text-3xl leading-none text-[var(--cs-border)] transition-colors duration-300 group-hover:text-[var(--cs-cara-gold)]">{l.n}</span>
                    </div>
                    <h3 className="mt-5 text-lg font-bold text-[var(--cs-navy)]">{l.t}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-[var(--cs-text-secondary)]">{l.d}</p>
                    <ul className="mt-4 flex-1 space-y-1.5">
                      {l.pts.map((p, j) => (
                        <li key={j} className="flex items-start gap-2 text-xs text-[var(--cs-text-secondary)]"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--cs-teal)]" /> {p}</li>
                      ))}
                    </ul>
                    <span className="mt-5 inline-flex items-center gap-1 text-xs font-semibold text-[var(--cs-teal-strong)]">Explore <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-1" /></span>
                  </Link>
                </TiltCard>
              </Reveal>
            );
          })}
          {/* In-the-moment card completes the grid */}
          <Reveal delay={450}>
            <TiltCard className="h-full rounded-3xl">
              <div className="flex h-full flex-col rounded-3xl bg-[var(--cs-navy)] p-7 text-white shadow-[var(--cs-shadow-card)]">
                <div className="flex items-start justify-between">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-[var(--cs-cara-gold)]"><Siren className="h-6 w-6" /></div>
                  <span className="mk-display text-3xl leading-none text-white/15">06</span>
                </div>
                <h3 className="mt-5 text-lg font-bold text-white">In the moment, on the hardest shifts</h3>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-slate-300">
                  During an incident, Cara supports staff with co-regulation prompts, reflective recording, professional
                  language, safeguarding reminders and follow-up actions — while the manager keeps oversight of every draft.
                </p>
                <Link href="/product/tour" className="mt-5 inline-flex items-center gap-1 text-xs font-semibold text-teal-300">See Incident Mode in the tour <ArrowRight className="h-3 w-3" /></Link>
              </div>
            </TiltCard>
          </Reveal>
        </div>
      </section>

      {/* ── ASK CARA — midnight immersive ────────────────────────────────────── */}
      <section id="ask-cara" className="mk-midnight relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 py-24 lg:grid-cols-2 lg:py-32">
          <Reveal>
            <span className="mk-glass inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-teal-200/90">New · Ask CARA</span>
            <h2 className="mk-display mt-6 text-4xl text-white sm:text-5xl">Just ask. <span className="mk-display-it mk-aurora-text">CARA answers from your records</span> — never a guess.</h2>
            <p className="mt-6 text-lg leading-relaxed text-slate-300/90">
              A governed AI assistant on every page. Ask anything about the home, a child or your team —
              &ldquo;what&rsquo;s overdue?&rdquo;, &ldquo;who needs a review?&rdquo;, &ldquo;what should I do after this
              incident?&rdquo; — and CARA answers instantly from your live records, with the sources shown. It drafts,
              checks and routes the work; it never decides safeguarding, and it never invents a fact.
            </p>
            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {[
                { Icon: Cpu, t: "Deterministic — every answer traces to a record" },
                { Icon: Lock, t: "No child data leaves the platform" },
                { Icon: ShieldCheck, t: "Prompt-injection guarded, fail-closed" },
                { Icon: ScrollText, t: "Every answer hashed & audited" },
                { Icon: Brain, t: "Refuses to decide safeguarding — that stays human" },
                { Icon: KeyRound, t: "Role-based — sees only what you may" },
              ].map((c, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-slate-300"><c.Icon className="mt-0.5 h-4 w-4 shrink-0 text-teal-300" /> {c.t}</li>
              ))}
            </ul>
            <p className="mt-7 text-xs text-slate-500">CARA is the sanctioned, deterministic replacement for staff pasting sensitive information into public chatbots — the answers come from your records, and the audit trail is yours.</p>
          </Reveal>

          {/* The app, floating in its own world */}
          <Reveal delay={150} scale>
            <TiltCard max={5} className="rounded-[1.75rem]">
              <div className="relative overflow-hidden rounded-[1.75rem] border border-white/10 p-6 shadow-[0_40px_120px_rgba(0,0,0,0.5)]" style={{ background: "radial-gradient(120% 90% at 100% -10%, rgba(99,102,241,0.22) 0%, transparent 52%), linear-gradient(180deg,#0a0f1f 0%,#0c1226 55%,#0e1730 100%)" }}>
                <div className="flex items-center gap-3">
                  {spark("mk-spark")}
                  <div>
                    <div className="text-[15px] font-light text-slate-100">Hi Darren — ready when you are</div>
                    <div className="text-[11px] text-slate-400">I answer from this home&rsquo;s records — never a guess.</div>
                  </div>
                </div>
                <div className="mt-6 space-y-3.5">
                  <div className="flex justify-end"><div className="max-w-[80%] rounded-3xl rounded-br-lg bg-indigo-500/90 px-4 py-2 text-[13px] text-white shadow-lg">What&rsquo;s overdue across the home right now?</div></div>
                  <div className="flex gap-2.5">
                    <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0" aria-hidden><defs><linearGradient id="mk-spark2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#2dd4bf" /><stop offset="0.5" stopColor="#60a5fa" /><stop offset="1" stopColor="#a78bfa" /></linearGradient></defs><path d="M12 0C13.4 6.9 17.1 10.6 24 12C17.1 13.4 13.4 17.1 12 24C10.6 17.1 6.9 13.4 0 12C6.9 10.6 10.6 6.9 12 0Z" fill="url(#mk-spark2)" /></svg>
                    <div className="min-w-0">
                      <p className="text-[13px] leading-relaxed text-slate-200">Three things need attention today: <b className="text-white">Alex&rsquo;s restraint on 5 Jul has no debrief</b>, a <b className="text-white">return interview is missing</b> for Jordan (back 4 Jul), and <b className="text-white">Ellie&rsquo;s LAC review</b> falls due in 6 days. Two daily logs are waiting for your oversight sign-off.</p>
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {["Incidents · 1", "Missing episodes · 1", "Reviews · 1", "Oversight · 2"].map((s) => (
                          <span key={s} className="rounded-full bg-white/[0.07] px-2 py-0.5 text-[10.5px] text-slate-300">{s}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex items-center gap-1 rounded-full border border-white/10 bg-[#161b2b]/95 px-1.5 py-1.5 shadow-2xl">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400">+</span>
                  <span className="flex-1 px-1 text-[13px] text-slate-500">Ask CARA…</span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500 text-white">↑</span>
                </div>
                <p className="mt-2.5 text-center text-[10px] text-slate-500">Deterministic · from your live records · never a safeguarding decision</p>
              </div>
            </TiltCard>
          </Reveal>
        </div>
      </section>

      {/* ── SHADOW AI — daylight, the risk chapter ───────────────────────────── */}
      <section id="shadow-ai" className="mx-auto max-w-5xl px-5 py-24">
        <Reveal>
          <div className="overflow-hidden rounded-[1.75rem] border border-[var(--cs-risk-soft)] bg-[var(--cs-risk-bg)] p-8 sm:p-12">
            <div className="flex items-center gap-2 text-[var(--cs-risk)]">
              <ShieldAlert className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-[0.18em]">The risk nobody&rsquo;s governing</span>
            </div>
            <h2 className="mk-display mt-5 text-3xl text-[var(--cs-navy)] sm:text-4xl">Your team is already using AI. <span className="mk-display-it">The question is whether it&rsquo;s safe.</span></h2>
            <div className="mt-6 space-y-4 text-lg leading-relaxed text-[var(--cs-text-secondary)]">
              <p>
                To save time, staff paste incident notes, children&rsquo;s names, histories and risks into ChatGPT and other
                public chatbots — usually meaning well. But that is confidential data about a child leaving your control,
                shared without consent, with a third party you have no agreement with.
              </p>
              <p className="font-medium text-[var(--cs-navy)]">
                It puts homes at risk of breaching UK and EU data-protection law — UK GDPR, the EU GDPR and the Data
                Protection Act 2018 — and it sits directly at odds with the duty to keep children safe online. Worst of all,
                you can&rsquo;t govern what you can&rsquo;t see: for most leaders, it&rsquo;s happening invisibly.
              </p>
            </div>

            <div className="mt-9 rounded-2xl border border-[var(--cs-border)] bg-white p-7 shadow-[var(--cs-shadow-soft)]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-[var(--cs-teal-strong)]" />
                <h3 className="text-lg font-bold text-[var(--cs-navy)]">With Cara, this is addressed.</h3>
              </div>
              <p className="mt-2 text-[var(--cs-text-secondary)]">
                Ask CARA gives staff a sanctioned, in-house assistant that does the very thing they were reaching for —
                without the risk. Shadow AI becomes visible, governed AI.
              </p>
              <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
                {[
                  { Icon: Lock, t: "Confidential data never leaves the platform — nothing is sent to a public model" },
                  { Icon: UserCheck, t: "No unconsented sharing with a third party you have no agreement with" },
                  { Icon: Sparkles, t: "A sanctioned tool staff actually want to use — so they stop reaching for ChatGPT" },
                  { Icon: Eye, t: "Any external-AI use is declared, not hidden — shadow AI becomes visible" },
                  { Icon: ScrollText, t: "Every AI interaction is logged and hashed — a defensible audit trail" },
                  { Icon: ShieldCheck, t: "Evidence to your DPO and Ofsted that AI is governed, not ungoverned" },
                ].map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[var(--cs-text-secondary)]"><c.Icon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--cs-teal-strong)]" /> {c.t}</li>
                ))}
              </ul>
            </div>
            <p className="mt-5 text-xs text-[var(--cs-text-muted)]">Cara helps you govern AI use and meet your data-protection duties; it supports compliance rather than certifying it.</p>
          </div>
        </Reveal>
      </section>

      {/* ── RELIABLE BY DESIGN ───────────────────────────────────────────────── */}
      <section id="reliability" className="border-y border-[var(--cs-border)] bg-white">
        <div className="mx-auto max-w-7xl px-5 py-24">
          <Reveal className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--cs-teal-strong)]">Reliable by design</span>
            <h2 className="mk-display mt-5 text-4xl text-[var(--cs-navy)] sm:text-5xl">Built to keep working — <span className="mk-display-it">with or without AI.</span></h2>
            <p className="mt-5 text-lg text-[var(--cs-text-secondary)]">
              Cara&rsquo;s intelligence runs on around 300 deterministic engines — transparent rules that read your records the
              same way every time. AI adds extra help on top, but it&rsquo;s an enhancement, never a dependency: if AI is ever
              unavailable, every core feature keeps working.
            </p>
          </Reveal>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {[
              { Icon: Cpu, t: "Deterministic at the core", d: "Patterns, RAG ratings, compliance and evidence are computed by auditable rules — not an AI black box. Same records in, same result out, every time." },
              { Icon: Sparkles, t: "AI as enhancement, not dependency", d: "When AI is available it drafts, narrates and rewrites. When it isn't, Cara falls back to deterministic output — you still get the report, the plan and the analysis." },
              { Icon: ShieldCheck, t: "No single point of failure", d: "Live care data is never trapped behind a model call. Recording, intelligence and evidence stay available on the hardest shifts — when you need them most." },
            ].map((c, i) => (
              <Reveal key={i} delay={i * 110}>
                <TiltCard className="h-full rounded-3xl">
                  <div className="h-full rounded-3xl border border-[var(--cs-border)] bg-[var(--cs-bg)] p-8 shadow-[var(--cs-shadow-card)]">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--cs-teal-bg)] text-[var(--cs-teal-strong)]"><c.Icon className="h-6 w-6" /></div>
                    <h3 className="mt-5 text-lg font-bold text-[var(--cs-navy)]">{c.t}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--cs-text-secondary)]">{c.d}</p>
                  </div>
                </TiltCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOR THE WHOLE HOME ───────────────────────────────────────────────── */}
      <section id="who" className="mx-auto max-w-7xl px-5 py-24">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--cs-teal-strong)]">Built for the whole home</span>
          <h2 className="mk-display mt-5 text-4xl text-[var(--cs-navy)] sm:text-5xl">Grip for managers. Confidence for staff. <span className="mk-display-it mk-gold-text">A voice for children.</span></h2>
        </Reveal>
        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {[
            { Icon: Radar, t: "For managers", d: "Maintain grip across the home without chasing paper.", pts: MANAGER_POINTS },
            { Icon: Users, t: "For staff", d: "Record confidently, reflect honestly, grow professionally.", pts: STAFF_POINTS },
            { Icon: Baby, t: "For children", d: "Nothing about them gets lost in the system meant to protect them.", pts: CHILD_POINTS },
          ].map((c, i) => (
            <Reveal key={i} delay={i * 110}>
              <div className="h-full rounded-3xl border border-[var(--cs-border)] bg-white p-7 shadow-[var(--cs-shadow-card)]">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--cs-navy)] text-[var(--cs-cara-gold)]"><c.Icon className="h-6 w-6" /></div>
                <h3 className="mt-4 text-lg font-bold text-[var(--cs-navy)]">{c.t}</h3>
                <p className="mt-1 text-sm text-[var(--cs-text-secondary)]">{c.d}</p>
                <ul className="mt-4 space-y-2.5">
                  {c.pts.map((p, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-[var(--cs-text-secondary)]"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--cs-teal)]" /> {p}</li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── INSPECTION READINESS + TRUST ─────────────────────────────────────── */}
      <section id="inspection" className="border-y border-[var(--cs-border)] bg-white">
        <div className="mx-auto max-w-5xl px-5 py-24 text-center">
          <Reveal>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--cs-teal-strong)]">Inspection readiness</span>
            <h2 className="mk-display mt-5 text-4xl text-[var(--cs-navy)] sm:text-5xl">When Ofsted asks, <span className="mk-display-it">the evidence is already there.</span></h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-[var(--cs-text-secondary)]">
              Cara supports leaders to evidence safeguarding, progress, management oversight, staff practice, learning
              from incidents, and impact from each child&rsquo;s starting point — maintained live across the year, mapped to
              the way inspectors read a home.
            </p>
          </Reveal>
          <Reveal delay={120} className="mt-9 flex flex-wrap items-center justify-center gap-3">
            {["Live readiness across all judgement areas", "Reg 40 prompts — the decision stays the manager's", "Annex A & Reg 44/45 evidence support", "Print-ready home & child report packs"].map((t) => (
              <span key={t} className="rounded-full border border-[var(--cs-teal-soft)] bg-[var(--cs-teal-bg)] px-4 py-2 text-sm font-semibold text-[var(--cs-teal-strong)]">{t}</span>
            ))}
          </Reveal>
          <Reveal delay={180}>
            <p className="mt-6 text-xs text-[var(--cs-text-muted)]">Cara helps you evidence quality — no system can (or should) promise inspection outcomes.</p>
          </Reveal>

          <Reveal delay={220} className="mt-16">
            <p className="mx-auto max-w-2xl text-lg text-[var(--cs-text-secondary)]">
              Cara&rsquo;s intelligence supports, prompts and summarises — it never replaces professional judgement, and a
              human reviews anything that matters. {BRAND.assistDisclaimer}
            </p>
          </Reveal>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TRUST.map((s, i) => (
              <Reveal key={i} delay={i * 60}>
                <div className="flex h-full flex-col items-center gap-2 rounded-2xl border border-[var(--cs-border)] bg-[var(--cs-bg)] p-5 transition-transform duration-300 hover:-translate-y-1">
                  <s.Icon className="h-6 w-6 text-[var(--cs-teal-strong)]" />
                  <span className="text-sm font-semibold text-[var(--cs-navy)]">{s.t}</span>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={200} className="mt-9">
            <Link href="/security" className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--cs-border)] bg-white px-5 py-3 text-sm font-semibold text-[var(--cs-navy)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--cs-shadow-card)]">Read about security &amp; trust <ArrowRight className="h-4 w-4" /></Link>
          </Reveal>
        </div>
      </section>

      {/* ── STORY ────────────────────────────────────────────────────────────── */}
      <section id="story" className="mx-auto max-w-3xl px-5 py-24">
        <Reveal scale>
          <div className="relative rounded-[1.75rem] border border-[var(--cs-cara-gold-soft)] bg-[var(--cs-cara-gold-bg)] p-10 text-center sm:p-12">
            <span className="mk-display absolute left-6 top-2 text-7xl leading-none text-[var(--cs-cara-gold)]/30" aria-hidden>&ldquo;</span>
            <p className="mk-display-it text-2xl leading-snug text-[var(--cs-navy)] sm:text-[1.65rem]">
              Cara was built inside a real children&rsquo;s home — by people who&rsquo;ve run the shift, written the Reg 40 at
              2am, and sat across from the inspector. The records were never the point. The children are.
            </p>
            <Link href="/about" className="mt-6 inline-flex items-center gap-1.5 text-sm font-bold text-[var(--cs-navy)] transition-colors hover:text-[var(--cs-cara-gold)]">Our story <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </Reveal>
      </section>

      {/* ── FINAL CTA — back into the night ──────────────────────────────────── */}
      <section className="mk-midnight relative overflow-hidden">
        <HeroField className="pointer-events-none absolute inset-0 h-full w-full opacity-40" />
        <div className="relative mx-auto max-w-4xl px-5 py-28 text-center">
          <Reveal>
            <h2 className="mk-display text-4xl text-white sm:text-6xl">Ready to turn recording <br /><span className="mk-display-it mk-aurora-text">into intelligence?</span></h2>
            <p className="mx-auto mt-6 max-w-xl text-lg text-slate-300/90">See Cara on a real home&rsquo;s rhythm — recording, intelligence, oversight and evidence, live.</p>
          </Reveal>
          <Reveal delay={140} className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link href="/contact" className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--cs-cara-gold)] px-8 py-4 text-sm font-bold text-[#0a1020] shadow-[0_0_32px_rgba(200,155,60,0.3)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_48px_rgba(200,155,60,0.45)]">
              Book a Demo <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>
            <Link href="/product/tour" className="mk-glass inline-flex items-center justify-center gap-2 rounded-2xl px-8 py-4 text-sm font-bold text-white transition-all duration-300 hover:-translate-y-1 hover:bg-white/10">
              Take the product tour <Sparkles className="h-4 w-4 text-teal-300" />
            </Link>
          </Reveal>
          <Reveal delay={240}>
            <p className="mt-10 text-xs text-slate-500">One total system: recording, safeguarding, workforce, compliance and learning — together.</p>
          </Reveal>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE CARE OS — PUBLIC MARKETING HOME PAGE  (route: /)
//
// Positioning: the missing WORKFORCE / recruitment / culture / supervision /
// practice-intelligence layer for children's homes — NOT a care-recording clone.
// "Care quality starts with workforce quality." Static server component; every
// claim maps to a real capability. The platform itself lives at /dashboard.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight, HeartHandshake, CheckCircle2, RefreshCw, UserX, FileWarning,
  ClipboardList, CheckSquare, Activity, Flame, CalendarClock, BarChart3, Quote,
  UserCheck, Fingerprint, MessageSquare, GraduationCap, Brain, FileText, Sparkles,
  ShieldCheck, Lock, ScrollText, KeyRound, FileCheck, Heart, Users, X, Check,
} from "lucide-react";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { SectionEyebrow, PrimaryButton, GhostButton } from "@/components/marketing/ui";

export const metadata: Metadata = {
  title: "Cornerstone Care OS | Care quality starts with workforce quality",
  description:
    "Cornerstone Care OS is one complete system to run your children's home — recording, safeguarding, medication, care planning, workforce, practice intelligence and Ofsted evidence in one place. Care quality starts with workforce quality.",
};

const PROBLEMS = [
  { Icon: RefreshCw, t: "Recruitment is reactive", d: "Hiring happens in a rush to fill a gap — expensive, stressful and rarely strategic." },
  { Icon: UserX, t: "Hired for availability, not values", d: "Whoever can start Monday gets the shift — fit with the home's values comes second." },
  { Icon: FileWarning, t: "Fragmented safer-recruitment evidence", d: "Checks live in folders, inboxes and spreadsheets — hard to assemble, harder to assure." },
  { Icon: ClipboardList, t: "Inconsistent induction & probation", d: "New starters get different experiences; probation review dates quietly slip." },
  { Icon: CheckSquare, t: "Supervision becomes tick-box", d: "Sessions happen, but reflection, wellbeing and practice quality aren't really captured." },
  { Icon: Activity, t: "Managers are overloaded", d: "RMs hold too much in their heads, with no single view of their workforce." },
  { Icon: Flame, t: "Burnout affects care", d: "Tired, unsupported staff can't offer children the steady, regulated relationships they need." },
  { Icon: CalendarClock, t: "Ofsted evidence is late", d: "Workforce evidence gets pulled together in a panic, not maintained over time." },
  { Icon: HeartHandshake, t: "Relational practice goes uncaptured", d: "The PACE, co-regulation and attunement that define good care leave no trace." },
  { Icon: BarChart3, t: "Workforce quality is hard to evidence", d: "Providers struggle to show, clearly, that their team is strong enough for the children in their care." },
];

const PILLARS = [
  "Values-led recruitment", "Safer recruitment tracker", "AI-supported job adverts & candidate profiles",
  "Staff onboarding & induction pathway", "Probation review tracking", "Supervision & reflective practice tools",
  "Training matrix & development planning", "Burnout & retention risk indicators", "Ofsted-readiness dashboard",
  "Practice quality intelligence", "PACE, trauma-informed & relational safeguarding prompts",
];

const STEPS = [
  { n: "01", Icon: Heart, t: "Build your employer values profile", d: "Define what your home stands for — your care approach, PACE commitment, trauma-informed expectations and non-negotiables." },
  { n: "02", Icon: Users, t: "Attract & assess candidates", d: "AI-supported adverts and candidate profiles, with values-based matching that supports — never replaces — your judgement." },
  { n: "03", Icon: ShieldCheck, t: "Complete safer recruitment checks", d: "Track every check, reference and clearance to evidence safer recruitment, with a clear audit trail." },
  { n: "04", Icon: GraduationCap, t: "Onboard, supervise & develop staff", d: "Consistent induction and probation, reflective supervision, and a living training matrix for every team member." },
  { n: "05", Icon: BarChart3, t: "Evidence workforce quality & improve practice", d: "See retention risk early, surface practice-quality intelligence, and keep Ofsted workforce evidence ready year-round." },
];

const MODULES = [
  { Icon: UserCheck, t: "Recruitment OS", href: "/product/workforce", d: "Values-led hiring from advert to appointment.", pts: ["AI-supported adverts & candidate profiles", "Values-based matching (decision-support)", "Pipeline from enquiry to ready-to-start"] },
  { Icon: Fingerprint, t: "Safer Recruitment", href: "/security", d: "Evidence safe hiring, end to end.", pts: ["DBS, references, right-to-work & ID", "Owner, due date & evidence per check", "Audit-ready completion view"] },
  { Icon: ClipboardList, t: "Onboarding", href: "/product/workforce", d: "Consistent inductions, every time.", pts: ["Pre-start to probation pathways", "Mandatory training & policy sign-off", "Probation review tracking"] },
  { Icon: MessageSquare, t: "Supervision", href: "/product/workforce", d: "Reflective practice, not tick-box.", pts: ["Wellbeing, workload & safeguarding", "PACE & reflective-practice prompts", "Actions with follow-up dates"] },
  { Icon: GraduationCap, t: "Training & Development", href: "/product/workforce", d: "A living view of capability.", pts: ["Mandatory & role-specific training", "Expiry & currency, RAG-rated", "Development planning"] },
  { Icon: Brain, t: "Practice Intelligence", href: "/product/intelligence", d: "Understand how care is really going.", pts: ["Relational & trauma-informed signals", "Direction of travel over time", "Explainable, never a black box"] },
  { Icon: FileText, t: "Ofsted Evidence", href: "/product/intelligence", d: "Inspection-ready, all year.", pts: ["Workforce evidence maintained live", "Mapped to the way inspectors read", "Export when you need it"] },
  { Icon: Sparkles, t: "AI Assistant for Managers", href: "/product/intelligence", d: "A draft-first co-pilot for RMs.", pts: ["Adverts, questions & summaries", "Supervision & action-plan prompts", "Human approval on everything"] },
];

const OLD_WAY = ["A separate recording system", "Spreadsheets for recruitment & training", "Supervision in Word documents", "Evidence scattered across folders", "No single view of your home", "Manual, last-minute Ofsted prep"];
const ALL_IN_ONE = ["Daily recording, incidents & safeguarding", "Medication, health & care planning", "Young person records, wishes & feelings", "Values-led recruitment & matching", "Reflective supervision & training", "Retention & support indicators", "Live practice intelligence", "Ofsted evidence — always ready"];

const SAFEGUARDING = [
  { Icon: Fingerprint, t: "Safer recruitment" }, { Icon: ScrollText, t: "Audit trails" },
  { Icon: KeyRound, t: "Role-based permissions" }, { Icon: Brain, t: "Human-in-the-loop AI" },
  { Icon: UserCheck, t: "Manager approval" }, { Icon: FileCheck, t: "Evidence logs" },
  { Icon: Lock, t: "Data-protection awareness" }, { Icon: ShieldCheck, t: "Ofsted preparation" },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--cs-bg)] text-[var(--cs-text)]">
      <MarketingHeader />

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-70" style={{ background: "radial-gradient(60% 50% at 75% 0%, var(--cs-teal-glow) 0%, transparent 60%), radial-gradient(50% 45% at 0% 25%, var(--cs-aria-glow) 0%, transparent 55%)" }} />
        <div className="relative mx-auto max-w-4xl px-5 py-16 text-center lg:py-24">
          <SectionEyebrow>The complete operating system for children&rsquo;s homes</SectionEyebrow>
          <h1 className="mt-5 text-4xl font-extrabold leading-[1.07] tracking-tight text-[var(--cs-navy)] sm:text-5xl lg:text-6xl">
            Build safer, stronger children&rsquo;s homes from the people up.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[var(--cs-text-secondary)]">
            Cornerstone Care OS helps children&rsquo;s home providers recruit, onboard, supervise and develop values-led teams
            while strengthening Ofsted readiness, safer recruitment and practice quality.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <PrimaryButton href="/contact">Request early access <ArrowRight className="h-4 w-4" /></PrimaryButton>
            <GhostButton href="#how">See how it works</GhostButton>
          </div>
          <div className="mx-auto mt-10 max-w-2xl rounded-2xl border border-[var(--cs-teal-soft)] bg-[var(--cs-teal-bg)]/50 px-5 py-4">
            <p className="flex items-start gap-2.5 text-left text-sm font-medium text-[var(--cs-navy)]">
              <HeartHandshake className="mt-0.5 h-5 w-5 shrink-0 text-[var(--cs-teal-strong)]" />
              Because the quality of care children receive is shaped by the quality, stability and support of the adults around them.
            </p>
          </div>
        </div>
      </section>

      {/* ── Positioning bar ──────────────────────────────────────────────────── */}
      <section className="border-y border-[var(--cs-border)] bg-white/60">
        <div className="mx-auto max-w-4xl px-5 py-6 text-center">
          <p className="text-base font-bold text-[var(--cs-navy)]">Care quality starts with workforce quality.</p>
          <p className="mt-1 text-sm text-[var(--cs-text-secondary)]">One total system to run your whole home — recruitment, recording, safeguarding, supervision, practice intelligence and Ofsted evidence, together.</p>
        </div>
      </section>

      {/* ── Problem ──────────────────────────────────────────────────────────── */}
      <section id="problem" className="mx-auto max-w-7xl px-5 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <SectionEyebrow>The reality in children&rsquo;s homes</SectionEyebrow>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[var(--cs-navy)] sm:text-4xl">Good care is too often undermined before it starts.</h2>
          <p className="mt-4 text-lg text-[var(--cs-text-secondary)]">The hardest part isn&rsquo;t recording what happened — it&rsquo;s building and supporting a team strong enough to make good care happen.</p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PROBLEMS.map((p, i) => (
            <div key={i} className="rounded-2xl border border-[var(--cs-border)] bg-white p-5 shadow-[var(--cs-shadow-card)]">
              <p.Icon className="h-6 w-6 text-[var(--cs-text-muted)]" />
              <h3 className="mt-3 text-base font-bold text-[var(--cs-navy)]">{p.t}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-[var(--cs-text-secondary)]">{p.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Solution / pillars ───────────────────────────────────────────────── */}
      <section id="solution" className="border-y border-[var(--cs-border)] bg-white">
        <div className="mx-auto max-w-7xl px-5 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <SectionEyebrow>One complete system</SectionEyebrow>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[var(--cs-navy)] sm:text-4xl">Everything your home needs, working together.</h2>
            <p className="mt-4 text-lg text-[var(--cs-text-secondary)]">Cornerstone Care OS brings the whole home into one place — the children, the records, the workforce and the evidence — from the first advert to the moment an inspector reads it.</p>
          </div>
          <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PILLARS.map((p) => (
              <div key={p} className="flex items-center gap-3 rounded-xl border border-[var(--cs-border)] bg-[var(--cs-bg)] px-4 py-3">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-[var(--cs-teal)]" />
                <span className="text-sm font-semibold text-[var(--cs-navy)]">{p}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────────── */}
      <section id="how" className="mx-auto max-w-7xl px-5 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <SectionEyebrow>How it works</SectionEyebrow>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[var(--cs-navy)] sm:text-4xl">From values to evidence — in five steps.</h2>
        </div>
        <div className="mt-12 space-y-4">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-start gap-5 rounded-2xl border border-[var(--cs-border)] bg-white p-6 shadow-[var(--cs-shadow-card)]">
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-sm font-extrabold text-[var(--cs-teal)]">{s.n}</span>
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--cs-navy)] text-white"><s.Icon className="h-6 w-6" /></div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-[var(--cs-navy)]">{s.t}</h3>
                <p className="mt-1 text-sm leading-relaxed text-[var(--cs-text-secondary)]">{s.d}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link href="/product/tour" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--cs-navy)] hover:text-[var(--cs-teal-strong)]">See it in action <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>

      {/* ── Modules ──────────────────────────────────────────────────────────── */}
      <section id="modules" className="border-y border-[var(--cs-border)] bg-white">
        <div className="mx-auto max-w-7xl px-5 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <SectionEyebrow>One platform, eight modules</SectionEyebrow>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[var(--cs-navy)] sm:text-4xl">Everything the people-side of a home needs.</h2>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {MODULES.map((m, i) => (
              <Link key={i} href={m.href} className="group flex flex-col rounded-2xl border border-[var(--cs-border)] bg-white p-6 shadow-[var(--cs-shadow-card)] transition-transform hover:-translate-y-0.5">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--cs-teal-bg)] text-[var(--cs-teal-strong)]"><m.Icon className="h-6 w-6" /></div>
                <h3 className="mt-4 text-base font-bold text-[var(--cs-navy)]">{m.t}</h3>
                <p className="mt-1 text-sm text-[var(--cs-text-secondary)]">{m.d}</p>
                <ul className="mt-3 flex-1 space-y-1.5">
                  {m.pts.map((p, j) => (
                    <li key={j} className="flex items-start gap-2 text-xs text-[var(--cs-text-secondary)]"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--cs-teal)]" /> {p}</li>
                  ))}
                </ul>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[var(--cs-teal-strong)]">Learn more <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" /></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Comparison ───────────────────────────────────────────────────────── */}
      <section id="comparison" className="mx-auto max-w-7xl px-5 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <SectionEyebrow>One system, the whole home</SectionEyebrow>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[var(--cs-navy)] sm:text-4xl">Everything your home needs — in one system.</h2>
          <p className="mt-4 text-lg text-[var(--cs-text-secondary)]">
            No more juggling a recording tool here, spreadsheets there, and separate documents for recruitment, training and supervision.
            Cornerstone Care OS runs your whole home — the children, the records, the workforce and the evidence — in one place.
          </p>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2">
          <div className="rounded-3xl border border-[var(--cs-border)] bg-white p-7 shadow-[var(--cs-shadow-card)]">
            <h3 className="text-lg font-bold text-[var(--cs-navy)]">The old way</h3>
            <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-[var(--cs-text-muted)]">Disconnected tools &amp; spreadsheets</p>
            <ul className="mt-4 space-y-2.5">
              {OLD_WAY.map((r) => (
                <li key={r} className="flex items-center gap-2.5 text-sm text-[var(--cs-text-secondary)]"><span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-400"><X className="h-3 w-3" /></span> {r}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl border-2 border-[var(--cs-teal)] bg-[var(--cs-teal-bg)]/30 p-7 shadow-[var(--cs-shadow-card)]">
            <h3 className="text-lg font-bold text-[var(--cs-navy)]">Cornerstone Care OS</h3>
            <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-[var(--cs-teal-strong)]">One total system for everything</p>
            <ul className="mt-4 space-y-2.5">
              {ALL_IN_ONE.map((c) => (
                <li key={c} className="flex items-center gap-2.5 text-sm font-medium text-[var(--cs-navy)]"><span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--cs-teal)] text-white"><Check className="h-3 w-3" /></span> {c}</li>
              ))}
            </ul>
          </div>
        </div>
        <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-[var(--cs-text-muted)]">
          One login. One source of truth. One system for the whole home — so the people, the practice and the records all work together.
        </p>
      </section>

      {/* ── Safeguarding & compliance ────────────────────────────────────────── */}
      <section id="safeguarding" className="border-y border-[var(--cs-border)] bg-white">
        <div className="mx-auto max-w-5xl px-5 py-20 text-center">
          <SectionEyebrow>Built responsibly</SectionEyebrow>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[var(--cs-navy)] sm:text-4xl">Designed with safeguarding, safer recruitment and compliance in mind.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-[var(--cs-text-secondary)]">
            Permissions, audit trails and human review are part of the core — not bolted on. AI assists; people decide.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SAFEGUARDING.map((s, i) => (
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

      {/* ── Founder / story ──────────────────────────────────────────────────── */}
      <section id="story" className="mx-auto max-w-3xl px-5 py-20">
        <div className="text-center">
          <SectionEyebrow>Our story</SectionEyebrow>
          <h2 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-[var(--cs-navy)] sm:text-4xl">
            Built from lived experience, practice wisdom and a belief that children deserve emotionally safe adults.
          </h2>
        </div>
        <div className="mt-8 space-y-5 text-lg leading-relaxed text-[var(--cs-text-secondary)]">
          <p>
            Cornerstone Care OS is shaped by real experience of children&rsquo;s residential care — of leading teams, of safeguarding,
            of youth-violence prevention, and of seeing first-hand how much a child&rsquo;s outcomes depend on the adults around them.
          </p>
          <p>
            It&rsquo;s also shaped by watching good practitioners burn out: people who care deeply, stretched too thin, unsupported,
            until they leave the sector altogether. <span className="font-semibold text-[var(--cs-navy)]">We believe protecting the workforce is part of protecting children.</span>
          </p>
          <p>
            So we built the layer the sector was missing — one that helps leaders recruit for values, support staff properly,
            strengthen supervision and reflective practice, and evidence the quality of their workforce with confidence.
          </p>
        </div>
        <div className="mt-8 rounded-3xl border border-[var(--cs-border)] bg-[var(--cs-aria-gold-bg)] p-7 text-center">
          <Quote className="mx-auto h-7 w-7 text-[var(--cs-aria-gold)]" />
          <p className="mt-3 text-lg font-medium leading-relaxed text-[var(--cs-navy)]">&ldquo;Children deserve emotionally safe adults. That starts with how we choose, support and keep the people who care for them.&rdquo;</p>
        </div>
        <div className="mt-6 text-center">
          <Link href="/about" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--cs-navy)] hover:text-[var(--cs-teal-strong)]">More about why we exist <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-5 py-20">
        <div className="relative overflow-hidden rounded-3xl bg-[var(--cs-navy)] px-6 py-16 text-center text-white shadow-[var(--cs-shadow-card)]">
          <div className="pointer-events-none absolute inset-0 opacity-50" style={{ background: "radial-gradient(50% 80% at 50% 0%, var(--cs-teal-glow) 0%, transparent 60%)" }} />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl text-3xl font-extrabold tracking-tight sm:text-4xl">Ready to build a stronger care team?</h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-white/75">Join the providers building safer, more stable homes from the people up.</p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="/contact" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-[var(--cs-navy)] transition-transform hover:-translate-y-0.5">Request early access <ArrowRight className="h-4 w-4" /></Link>
              <Link href="/contact" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/5 px-6 py-3.5 text-sm font-bold text-white transition-colors hover:bg-white/10">Book a conversation</Link>
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}

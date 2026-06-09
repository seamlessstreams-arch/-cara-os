// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE CARE OS — PUBLIC MARKETING HOME PAGE
// Route: / (the platform itself lives at /dashboard and all its sub-routes)
//
// A static, on-brand business landing page. Server component — no client JS,
// no data fetching. Honest copy: every claim maps to a real platform capability.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import type { Metadata } from "next";
import {
  ShieldCheck, ClipboardCheck, Radar, LineChart, FileText, Users, Sparkles,
  HeartHandshake, Pill, ArrowRight, CheckCircle2, Eye, Lock, GitMerge,
  Mic, Brain, Bell, TrendingUp, TrendingDown, Minus, Quote,
  Home, Building2, ChevronDown,
  CalendarCheck, CalendarClock, Activity, Layers, Fingerprint, MapPin,
  GraduationCap, UserCheck, MessageSquare, ShieldAlert, BookOpen, Award,
  PenLine, Scale, Stethoscope, Sunrise,
} from "lucide-react";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { MarketingFooter } from "@/components/marketing/marketing-footer";

export const metadata: Metadata = {
  title: "Cornerstone Care OS | The operating system for children's homes",
  description:
    "Cornerstone turns the records your team already keeps into live safeguarding intelligence, a clear direction of travel, and Ofsted-ready evidence. Capture once, surface everywhere, never duplicate.",
};

// ── Small building blocks ─────────────────────────────────────────────────────

function PrimaryButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--cs-navy)] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[var(--cs-navy-soft)] hover:shadow-md"
    >
      {children}
    </Link>
  );
}

function GhostButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--cs-border)] bg-white/70 px-5 py-3 text-sm font-semibold text-[var(--cs-navy)] transition-colors hover:bg-white"
    >
      {children}
    </Link>
  );
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block rounded-full border border-[var(--cs-teal-soft)] bg-[var(--cs-teal-bg)] px-3 py-1 text-xs font-bold uppercase tracking-wider text-[var(--cs-teal-strong)]">
      {children}
    </span>
  );
}

function FeatureCard({ Icon, title, body, accent }: { Icon: typeof ShieldCheck; title: string; body: string; accent: "teal" | "gold" | "navy" }) {
  const ring = accent === "teal" ? "bg-[var(--cs-teal-bg)] text-[var(--cs-teal-strong)]" : accent === "gold" ? "bg-[var(--cs-aria-gold-bg)] text-[var(--cs-aria-gold)]" : "bg-[var(--cs-navy)]/5 text-[var(--cs-navy)]";
  return (
    <div className="group rounded-2xl border border-[var(--cs-border)] bg-white p-6 shadow-[var(--cs-shadow-card)] transition-transform hover:-translate-y-0.5">
      <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${ring}`}>
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-base font-bold text-[var(--cs-navy)]">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-[var(--cs-text-secondary)]">{body}</p>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--cs-bg)] text-[var(--cs-text)]">
      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <MarketingHeader />

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{ background: "radial-gradient(60% 50% at 80% 0%, var(--cs-teal-glow) 0%, transparent 60%), radial-gradient(50% 40% at 0% 30%, var(--cs-aria-glow) 0%, transparent 55%)" }}
        />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <SectionEyebrow>The Care OS for children&rsquo;s homes</SectionEyebrow>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.08] tracking-tight text-[var(--cs-navy)] sm:text-5xl">
              Run an outstanding home —<br className="hidden sm:block" /> calm, clear, and always inspection-ready.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-[var(--cs-text-secondary)]">
              Cornerstone turns the records your team already keeps into live safeguarding intelligence, a clear direction of travel,
              and Ofsted-ready evidence. <span className="font-semibold text-[var(--cs-navy)]">Capture once. Surface everywhere. Never duplicate.</span>
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <PrimaryButton href="#contact">Book a demo <ArrowRight className="h-4 w-4" /></PrimaryButton>
              <GhostButton href="/dashboard">Explore the platform</GhostButton>
            </div>
            <p className="mt-5 flex items-center gap-2 text-sm text-[var(--cs-text-muted)]">
              <HeartHandshake className="h-4 w-4 text-[var(--cs-teal)]" />
              Built in a real children&rsquo;s home, by a Registered Manager.
            </p>
          </div>

          {/* Product preview panel */}
          <div className="relative">
            <div className="rounded-3xl border border-[var(--cs-border)] bg-white p-5 shadow-[var(--cs-shadow-card)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-bold text-[var(--cs-navy)]"><Radar className="h-4 w-4 text-[var(--cs-teal)]" /> Priority Briefing</div>
                <span className="rounded-full bg-[var(--cs-risk-bg)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-700">3 critical</span>
              </div>
              <div className="mt-3 space-y-2">
                {[
                  { c: "bg-red-500", t: "Self-harm safety plan overdue review", d: "Safeguarding" },
                  { c: "bg-amber-400", t: "Medication audit pass-rate 75%", d: "Health" },
                  { c: "bg-amber-400", t: "PEP targets behind for 1 child", d: "Education" },
                ].map((r, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl border border-[var(--cs-border)]/60 bg-[var(--cs-bg)] px-3 py-2.5">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${r.c}`} />
                    <span className="flex-1 text-xs font-medium text-[var(--cs-text)]">{r.t}</span>
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--cs-text-gentle)]">{r.d}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-2xl border border-[var(--cs-border)]/60 bg-[var(--cs-teal-bg)]/60 p-4">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-xs font-bold text-[var(--cs-navy)]"><LineChart className="h-4 w-4 text-[var(--cs-teal-strong)]" /> Direction of travel</span>
                  <span className="flex items-center gap-1 text-[11px] font-bold text-[var(--cs-teal-strong)]"><TrendingUp className="h-3.5 w-3.5" /> Rewards improving</span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-3">
                  {[
                    { label: "Incidents", dir: <TrendingDown className="h-3 w-3 text-green-600" />, bars: [6, 5, 5, 4, 3, 2, 2, 1], col: "bg-green-500" },
                    { label: "Behaviour", dir: <Minus className="h-3 w-3 text-slate-400" />, bars: [3, 4, 3, 4, 3, 3, 4, 3], col: "bg-slate-400" },
                    { label: "Rewards", dir: <TrendingUp className="h-3 w-3 text-[var(--cs-teal-strong)]" />, bars: [1, 1, 2, 2, 3, 3, 4, 5], col: "bg-[var(--cs-teal)]" },
                  ].map((m, i) => (
                    <div key={i}>
                      <div className="flex h-8 items-end gap-0.5">
                        {m.bars.map((b, j) => (
                          <div key={j} className={`flex-1 rounded-t-sm ${m.col}`} style={{ height: `${(b / 6) * 100}%`, opacity: 0.55 + j * 0.05 }} />
                        ))}
                      </div>
                      <div className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-[var(--cs-text-muted)]">{m.dir}{m.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="absolute -bottom-4 -right-3 hidden rotate-2 rounded-2xl border border-[var(--cs-border)] bg-white px-4 py-3 shadow-[var(--cs-shadow-card)] sm:block">
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--cs-navy)]"><ShieldCheck className="h-4 w-4 text-[var(--cs-teal)]" /> Ofsted readiness</div>
              <div className="mt-1 text-2xl font-extrabold text-[var(--cs-teal-strong)]">Good <span className="text-sm font-semibold text-[var(--cs-text-muted)]">· improving</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust / framework bar ────────────────────────────────────────────── */}
      <section className="border-y border-[var(--cs-border)] bg-white/60">
        <div className="mx-auto max-w-7xl px-5 py-7">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-[var(--cs-text-muted)]">Designed around the frameworks you&rsquo;re held to</p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm font-bold text-[var(--cs-navy)]/70">
            <span>Children&rsquo;s Homes Regs 2015</span>
            <span className="text-[var(--cs-border)]">•</span>
            <span>Quality Standards</span>
            <span className="text-[var(--cs-border)]">•</span>
            <span>Ofsted SCCIF</span>
            <span className="text-[var(--cs-border)]">•</span>
            <span>Working Together 2025</span>
            <span className="text-[var(--cs-border)]">•</span>
            <span>Reg 44 &amp; 45</span>
          </div>
        </div>
      </section>

      {/* ── Problem ──────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-5 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <SectionEyebrow>Sound familiar?</SectionEyebrow>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[var(--cs-navy)] sm:text-4xl">Running a home shouldn&rsquo;t mean drowning in paperwork.</h2>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { Icon: GitMerge, t: "Records everywhere", d: "Notes scattered across books, folders and spreadsheets — re-keyed three times, trusted nowhere." },
            { Icon: ClipboardCheck, t: "Inspection panic", d: "Ofsted calls and the next two weeks vanish into frantic evidence-gathering." },
            { Icon: TrendingUp, t: "No direction of travel", d: "No straight answer to the question that matters most: are we actually getting better?" },
            { Icon: Eye, t: "Signals get buried", d: "Safeguarding patterns hide in the noise until they’ve already become incidents." },
          ].map((p, i) => (
            <div key={i} className="rounded-2xl border border-[var(--cs-border)] bg-white p-6 shadow-[var(--cs-shadow-card)]">
              <p.Icon className="h-6 w-6 text-[var(--cs-text-muted)]" />
              <h3 className="mt-3 text-base font-bold text-[var(--cs-navy)]">{p.t}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-[var(--cs-text-secondary)]">{p.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────────── */}
      <section id="how" className="border-y border-[var(--cs-border)] bg-white">
        <div className="mx-auto max-w-7xl px-5 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <SectionEyebrow>How it works</SectionEyebrow>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[var(--cs-navy)] sm:text-4xl">Capture once. Surface everywhere.</h2>
            <p className="mt-4 text-lg text-[var(--cs-text-secondary)]">One canonical record flows everywhere it&rsquo;s needed — validated once, never duplicated.</p>
          </div>
          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {[
              { n: "01", Icon: Mic, t: "Capture", d: "Record naturally — type, talk, or tap “Record anything”. One entry lands in the right place, with the child, shift and evidence attached." },
              { n: "02", Icon: Brain, t: "Understand", d: "Around 300 deterministic intelligence engines turn those records into clear RAG ratings across every domain — explainable, auditable, never a black box." },
              { n: "03", Icon: Bell, t: "Act", d: "Priority Briefing, trends and one-click reports surface exactly what needs your attention — and the evidence to back it — before Ofsted ever asks." },
            ].map((s, i) => (
              <div key={i} className="relative rounded-2xl border border-[var(--cs-border)] bg-[var(--cs-bg)] p-7">
                <span className="text-sm font-extrabold text-[var(--cs-teal)]">{s.n}</span>
                <div className="mt-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--cs-navy)] text-white"><s.Icon className="h-6 w-6" /></div>
                <h3 className="mt-4 text-xl font-bold text-[var(--cs-navy)]">{s.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--cs-text-secondary)]">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ARIA real-time intelligence ──────────────────────────────────────── */}
      <section id="intelligence" className="relative overflow-hidden bg-[var(--cs-navy)] text-white">
        <div className="pointer-events-none absolute inset-0 opacity-40" style={{ background: "radial-gradient(50% 60% at 0% 0%, var(--cs-aria-glow) 0%, transparent 55%), radial-gradient(45% 55% at 100% 100%, var(--cs-teal-glow) 0%, transparent 50%)" }} />
        <div className="relative mx-auto max-w-7xl px-5 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-block rounded-full border border-[var(--cs-aria-gold)]/30 bg-[var(--cs-aria-gold)]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[var(--cs-aria-gold-soft)]">ARIA · real-time intelligence</span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">Your records, analysed the moment they land.</h2>
            <p className="mt-4 text-lg text-white/75">
              Every entry your team makes flows through around <span className="font-semibold text-white">300 deterministic intelligence engines</span> — turning today&rsquo;s notes into live RAG ratings, ranked priorities and a clear direction of travel. No overnight batch. No black box.
            </p>
          </div>

          <div className="mt-14 grid items-start gap-8 lg:grid-cols-2">
            {/* How ARIA thinks */}
            <div>
              <h3 className="text-xl font-bold">How ARIA thinks — fast first, deep only when needed</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/70">
                ARIA resolves most signals instantly with transparent rules, falls back to a learned cache for the rest, and escalates to the AI model only for the genuinely novel — so it&rsquo;s fast, low-cost and explainable, with the records behind every rating one click away.
              </p>
              <div className="mt-5 space-y-3">
                {[
                  { Icon: Scale, t: "Deterministic rules", d: "Auditable logic resolves the vast majority of cases — the same way every time, traceable to the record." },
                  { Icon: Layers, t: "Learned cache", d: "Recognises patterns it has reasoned about before and answers instantly." },
                  { Icon: Brain, t: "ARIA model", d: "Escalates to AI only for the genuinely new — always with a human in the loop on anything that matters." },
                ].map((s, i) => (
                  <div key={i} className="flex gap-3.5 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--cs-teal)]/20 text-[var(--cs-teal-soft)]"><s.Icon className="h-5 w-5" /></div>
                    <div>
                      <div className="flex items-center gap-2 text-sm font-bold">{s.t}{i < 2 && <span className="text-[var(--cs-teal-soft)]">→</span>}</div>
                      <p className="mt-0.5 text-xs leading-relaxed text-white/65">{s.d}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {[
                  { Icon: PenLine, t: "Draft", d: "Turns a few words into a structured, professional record." },
                  { Icon: ShieldAlert, t: "Advise", d: "Flags when a threshold (LADO, notifiable event) may be met — for you to decide." },
                  { Icon: Award, t: "Recognise", d: "Surfaces good practice worth celebrating, not just risk." },
                ].map((s, i) => (
                  <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <s.Icon className="h-5 w-5 text-[var(--cs-aria-gold-soft)]" />
                    <div className="mt-2 text-sm font-bold">{s.t}</div>
                    <p className="mt-0.5 text-xs leading-relaxed text-white/65">{s.d}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Live analysis panel */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-5 shadow-[var(--cs-shadow-card)]">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-bold"><Activity className="h-4 w-4 text-[var(--cs-teal-soft)]" /> Live analysis</span>
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-white/60"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--cs-teal)]" /> updating as you record</span>
              </div>
              <div className="mt-4 space-y-2">
                {[
                  { d: "Safeguarding", s: "Requires attention", c: "bg-amber-400", w: "82%" },
                  { d: "Health & medication", s: "Good", c: "bg-[var(--cs-teal)]", w: "91%" },
                  { d: "Education", s: "Good", c: "bg-[var(--cs-teal)]", w: "88%" },
                  { d: "Relationships", s: "Good", c: "bg-[var(--cs-teal)]", w: "94%" },
                  { d: "Care & wellbeing", s: "Requires attention", c: "bg-amber-400", w: "76%" },
                  { d: "Leadership", s: "Good", c: "bg-[var(--cs-teal)]", w: "90%" },
                ].map((r, i) => (
                  <div key={i} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-white/90">{r.d}</span>
                      <span className="text-white/55">{r.s}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div className={`h-full rounded-full ${r.c}`} style={{ width: r.w }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/10 bg-[var(--cs-teal)]/10 px-4 py-3">
                <span className="text-xs font-semibold text-white/80">237 signals analysed across 78 engines</span>
                <span className="flex items-center gap-1 text-[11px] font-bold text-[var(--cs-teal-soft)]"><Radar className="h-3.5 w-3.5" /> ranked &amp; deep-linked</span>
              </div>
            </div>
          </div>

          {/* What it produces */}
          <div className="mt-16">
            <h3 className="text-center text-sm font-bold uppercase tracking-widest text-white/55">What real-time intelligence puts in front of you</h3>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { Icon: Radar, t: "Priority Briefing", d: "One ranked feed of what needs attention across every engine — deep-linked to act." },
                { Icon: LineChart, t: "Direction of Travel", d: "Home and per-child trends: are your safety and wellbeing signals improving?" },
                { Icon: CalendarCheck, t: "Plan Currency", d: "Every statutory plan and assessment, RAG-rated by review date, on one board." },
                { Icon: ShieldCheck, t: "Premises Compliance", d: "Are all building-safety checks and certificates in date? One Reg-31 view." },
                { Icon: Sunrise, t: "Shift Briefing", d: "What must happen this shift — who&rsquo;s on, what&rsquo;s due, what happened overnight." },
                { Icon: ClipboardCheck, t: "Ofsted Readiness", d: "A live composite rating across all six judgement areas — today, not on the night." },
                { Icon: Brain, t: "Manager Briefing", d: "The core domains distilled for leadership, with the one thing that matters next." },
                { Icon: FileText, t: "Report Packs", d: "Home Summary and Child Review packs in one click — ARIA-narrated, print-ready." },
              ].map((o, i) => (
                <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                  <o.Icon className="h-6 w-6 text-[var(--cs-teal-soft)]" />
                  <h4 className="mt-3 text-sm font-bold">{o.t}</h4>
                  <p className="mt-1 text-xs leading-relaxed text-white/65">{o.d}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 text-center">
              <Link href="/product/intelligence" className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-white/10">Explore ARIA intelligence in depth <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────────── */}
      <section id="features" className="mx-auto max-w-7xl px-5 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <SectionEyebrow>One platform, the whole home</SectionEyebrow>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[var(--cs-navy)] sm:text-4xl">Everything a Registered Manager needs to lead — in one place.</h2>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard accent="navy" Icon={ShieldCheck} title="Practice Intelligence" body="Live RAG ratings across safeguarding, health, education, relationships, care and leadership — computed from your real records." />
          <FeatureCard accent="teal" Icon={ClipboardCheck} title="Ofsted Readiness" body="Self-evaluation, inspection readiness and a live composite score that tells you where you stand — today, not the night before." />
          <FeatureCard accent="gold" Icon={Radar} title="Priority Briefing" body="One ranked feed of what needs your attention, pulled from across every engine and deep-linked to the page to act on it." />
          <FeatureCard accent="teal" Icon={LineChart} title="Direction of Travel" body="Home and per-child trends answer the question inspectors love: are your safety and wellbeing signals improving or worsening?" />
          <FeatureCard accent="navy" Icon={FileText} title="Print-ready Reports" body="Home Summary and Child Review packs generated in one click — shareable with the LA, your board or an IRO, ARIA-narrated optional." />
          <FeatureCard accent="gold" Icon={Users} title="Workforce & Safe Access" body="Shifts, smart sign-in, safe-staffing alerts, geofence and kiosk presence — the right people, on shift, with the right access." />
          <FeatureCard accent="teal" Icon={Sparkles} title="ARIA Assistant" body="AI that drafts, summarises and surfaces patterns across the home — always with a human in the loop on anything that matters." />
          <FeatureCard accent="navy" Icon={HeartHandshake} title="Safeguarding & Child Voice" body="Capture concerns, escalate to the right people, and never lose a high or critical flag. The child&rsquo;s voice, kept central." />
          <FeatureCard accent="gold" Icon={Pill} title="Medication Governance" body="MAR, stock and storage audits, errors and near-misses — tracked, scored, and ready to evidence." />
        </div>
      </section>

      {/* ── Workforce & safe access ──────────────────────────────────────────── */}
      <section id="workforce" className="border-y border-[var(--cs-border)] bg-white">
        <div className="mx-auto max-w-7xl px-5 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <SectionEyebrow>Workforce &amp; safe access</SectionEyebrow>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[var(--cs-navy)] sm:text-4xl">The right people, on shift, with the right access.</h2>
            <p className="mt-4 text-lg text-[var(--cs-text-secondary)]">
              Cornerstone runs the whole staffing picture — from the rota to the doorway — and turns supervision, training and recruitment into evidence you can show an inspector.
            </p>
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
            <FeatureCard accent="gold" Icon={Sunrise} title="Shift Briefing" body="Coming on shift? One screen: who's on, what's due this shift, and what happened overnight." />
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              { Icon: Eye, t: "Sensitive-screen protection", d: "Confidential information stays protected on shared and public-facing screens." },
              { Icon: ClipboardCheck, t: "Workforce oversight & evidence", d: "Wellbeing, conduct and capacity — captured as evidence, not anecdote." },
              { Icon: Building2, t: "Responsible-Individual oversight", d: "Readiness, risk and direction of travel across every home — without chasing." },
            ].map((w, i) => (
              <div key={i} className="flex items-start gap-3 rounded-2xl border border-[var(--cs-border)] bg-[var(--cs-bg)] p-5">
                <w.Icon className="h-5 w-5 shrink-0 text-[var(--cs-teal-strong)]" />
                <div>
                  <h3 className="text-sm font-bold text-[var(--cs-navy)]">{w.t}</h3>
                  <p className="mt-0.5 text-xs leading-relaxed text-[var(--cs-text-secondary)]">{w.d}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link href="/product/workforce" className="inline-flex items-center gap-2 rounded-xl bg-[var(--cs-navy)] px-5 py-3 text-sm font-bold text-white transition-all hover:bg-[var(--cs-navy-soft)] hover:shadow-md">Explore workforce in depth <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </section>

      {/* ── Platform breadth ─────────────────────────────────────────────────── */}
      <section id="platform" className="mx-auto max-w-7xl px-5 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <SectionEyebrow>The whole home, end to end</SectionEyebrow>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[var(--cs-navy)] sm:text-4xl">If you do it in the home, it&rsquo;s in Cornerstone.</h2>
          <p className="mt-4 text-lg text-[var(--cs-text-secondary)]">
            Hundreds of connected workflows across every part of running a children&rsquo;s home — all feeding the same intelligence, all inspection-ready.
          </p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { Icon: HeartHandshake, t: "Children & care planning", items: ["Child profiles & 360° view", "Care, placement & pathway plans", "LAC reviews & PEPs", "Wishes, feelings & participation"] },
            { Icon: BookOpen, t: "Daily practice", items: ["Daily logs & key-working", "Care events & handovers", "House meetings & activities", "“Record anything” — type or talk"] },
            { Icon: ShieldCheck, t: "Safeguarding & risk", items: ["Concerns & LADO referrals", "Missing-from-care & return interviews", "Exploitation & contextual safeguarding", "Risk management plans"] },
            { Icon: Stethoscope, t: "Health & medication", items: ["MAR & medication governance", "Health assessments & plans", "Self-harm safety plans", "Therapeutic & MDT input"] },
            { Icon: GraduationCap, t: "Education & aspirations", items: ["PEP tracking & attendance", "Engagement & attainment", "Aspirations & independence", "Travel & life skills"] },
            { Icon: MessageSquare, t: "Family & relationships", items: ["Family time & contact", "Supervised contact reports", "Sibling & social-worker contact", "Advocacy & independent voice"] },
            { Icon: Users, t: "Workforce", items: ["Rotas, shifts & safe staffing", "Supervision & training matrix", "Safer recruitment & vetting", "Comms & oversight"] },
            { Icon: Building2, t: "Premises & H&S", items: ["Fire, gas, electrical & water safety", "Premises compliance currency", "Maintenance & environment", "Vehicles & visits"] },
            { Icon: ClipboardCheck, t: "Compliance & Ofsted", items: ["Reg 44 & 45 visits", "Notifiable events", "Complaints & SARs", "Self-evaluation & readiness"] },
          ].map((m, i) => (
            <div key={i} className="rounded-2xl border border-[var(--cs-border)] bg-white p-6 shadow-[var(--cs-shadow-card)]">
              <div className="flex items-center gap-2.5">
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--cs-teal-bg)] text-[var(--cs-teal-strong)]"><m.Icon className="h-5 w-5" /></div>
                <h3 className="text-base font-bold text-[var(--cs-navy)]">{m.t}</h3>
              </div>
              <ul className="mt-3.5 space-y-1.5">
                {m.items.map((it, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm text-[var(--cs-text-secondary)]">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--cs-teal)]" /> {it}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-8 text-center text-sm text-[var(--cs-text-muted)]">
          …plus reporting, finance and provider oversight on top — every workflow feeding the same captured-once record.
        </p>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────────────────── */}
      <section id="pricing" className="border-y border-[var(--cs-border)] bg-white">
        <div className="mx-auto max-w-7xl px-5 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <SectionEyebrow>Pricing</SectionEyebrow>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[var(--cs-navy)] sm:text-4xl">Pricing that scales with your homes.</h2>
            <p className="mt-4 text-lg text-[var(--cs-text-secondary)]">Every plan includes the full platform, onboarding and support. Book a walkthrough for a quote tailored to your service.</p>
          </div>
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {[
              { Icon: Home, name: "Single home", who: "For one registered children's home.", featured: false,
                points: ["Full practice intelligence & RAG ratings", "Ofsted readiness & self-evaluation", "Priority briefing, trends & reports", "Workforce, comms & safe access", "ARIA assistant (human-in-the-loop)", "Mobile, installable & offline-ready"], cta: "Book a demo" },
              { Icon: Building2, name: "Group", who: "For providers running several homes.", featured: true,
                points: ["Everything in Single home", "Responsible-Individual oversight", "Cross-home readiness & direction of travel", "Per-home priority briefings", "Group-level reporting", "Priority onboarding & support"], cta: "Book a demo" },
              { Icon: Sparkles, name: "Enterprise", who: "For large or complex providers.", featured: false,
                points: ["Everything in Group", "SSO & advanced access controls", "Custom integrations & data migration", "Dedicated onboarding & success manager", "Service-level agreement", "Roadmap input"], cta: "Talk to us" },
            ].map((t, i) => (
              <div key={i} className={`relative flex flex-col rounded-3xl border p-7 shadow-[var(--cs-shadow-card)] ${t.featured ? "border-[var(--cs-teal)] bg-[var(--cs-teal-bg)]/40 ring-1 ring-[var(--cs-teal)]" : "border-[var(--cs-border)] bg-white"}`}>
                {t.featured && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--cs-teal)] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">Most popular</span>}
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--cs-navy)] text-white"><t.Icon className="h-6 w-6" /></div>
                <h3 className="mt-4 text-xl font-bold text-[var(--cs-navy)]">{t.name}</h3>
                <p className="mt-1 text-sm text-[var(--cs-text-secondary)]">{t.who}</p>
                <p className="mt-4 text-3xl font-extrabold text-[var(--cs-navy)]">Custom <span className="text-sm font-semibold text-[var(--cs-text-muted)]">/ book a quote</span></p>
                <ul className="mt-5 flex-1 space-y-2.5">
                  {t.points.map((p, j) => (
                    <li key={j} className="flex items-start gap-2.5 text-sm text-[var(--cs-text-secondary)]">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--cs-teal)]" /> {p}
                    </li>
                  ))}
                </ul>
                <Link href="#contact" className={`mt-7 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-colors ${t.featured ? "bg-[var(--cs-navy)] text-white hover:bg-[var(--cs-navy-soft)]" : "border border-[var(--cs-border)] bg-white text-[var(--cs-navy)] hover:bg-[var(--cs-bg)]"}`}>
                  {t.cta} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-sm text-[var(--cs-text-muted)]">All plans include data security, audit trails and role-based access as standard.</p>
        </div>
      </section>

      {/* ── Why Cornerstone ──────────────────────────────────────────────────── */}
      <section id="why" className="relative overflow-hidden bg-[var(--cs-navy)] text-white">
        <div className="pointer-events-none absolute inset-0 opacity-40" style={{ background: "radial-gradient(50% 60% at 100% 0%, var(--cs-teal-glow) 0%, transparent 55%), radial-gradient(40% 50% at 0% 100%, var(--cs-aria-glow) 0%, transparent 50%)" }} />
        <div className="relative mx-auto max-w-7xl px-5 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-block rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[var(--cs-teal-soft)]">Why Cornerstone</span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">Intelligence you can stand behind in inspection.</h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {[
              { Icon: Eye, t: "Explainable by design", d: "Every rating traces back to the records behind it. No black-box scores — just defensible evidence you can show an inspector." },
              { Icon: Lock, t: "Safety first, always", d: "ARIA never auto-decides statutory thresholds. Anything safeguarding-critical forces human review, and high-risk flags are never deleted." },
              { Icon: GitMerge, t: "One source of truth", d: "Capture once and it surfaces everywhere — no duplicate records, no re-keying, no conflicting versions of the truth." },
              { Icon: HeartHandshake, t: "Built by a practitioner", d: "Designed in a real children’s home by a Registered Manager — for the realities of a handover, not a boardroom." },
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

      {/* ── Who it's for ─────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-5 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <SectionEyebrow>Who it&rsquo;s for</SectionEyebrow>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[var(--cs-navy)] sm:text-4xl">One home, every role, on the same page.</h2>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { t: "Registered Managers", d: "See the whole home at a glance, evidence quality of care, and lead with confidence." },
            { t: "Responsible Individuals", d: "Oversight across homes — readiness, risk and direction of travel without chasing." },
            { t: "Deputies & team leaders", d: "Run the shift, action what matters today, and keep recording on track." },
            { t: "Support workers", d: "Record naturally in seconds and get back to the young people — where it counts." },
          ].map((r, i) => (
            <div key={i} className="rounded-2xl border border-[var(--cs-border)] bg-white p-6 shadow-[var(--cs-shadow-card)]">
              <CheckCircle2 className="h-6 w-6 text-[var(--cs-teal)]" />
              <h3 className="mt-3 text-base font-bold text-[var(--cs-navy)]">{r.t}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-[var(--cs-text-secondary)]">{r.d}</p>
            </div>
          ))}
        </div>

        {/* Practitioner note (authentic, not a fabricated testimonial) */}
        <div className="mx-auto mt-14 max-w-3xl rounded-3xl border border-[var(--cs-border)] bg-[var(--cs-aria-gold-bg)] p-8 text-center shadow-[var(--cs-shadow-card)]">
          <Quote className="mx-auto h-7 w-7 text-[var(--cs-aria-gold)]" />
          <p className="mt-4 text-lg font-medium leading-relaxed text-[var(--cs-navy)]">
            &ldquo;I built Cornerstone because I was tired of brilliant care being let down by paperwork. Capture it once, and let the home show its own story.&rdquo;
          </p>
          <p className="mt-4 text-sm font-semibold text-[var(--cs-text-muted)]">— A Registered Manager, and the person who built this</p>
        </div>
      </section>

      {/* ── Compliance band ──────────────────────────────────────────────────── */}
      <section id="compliance" className="border-y border-[var(--cs-border)] bg-white">
        <div className="mx-auto max-w-5xl px-5 py-16 text-center">
          <SectionEyebrow>Inspection-ready by design</SectionEyebrow>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[var(--cs-navy)] sm:text-4xl">Built to the standards you&rsquo;re measured against.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-[var(--cs-text-secondary)]">
            Every engine is mapped to the Children&rsquo;s Homes Regulations 2015 and the Quality Standards, and framed around
            Ofsted&rsquo;s SCCIF — so the evidence is already organised the way an inspector reads it.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {["Help & protect", "Care & support", "Education & learning", "Health & wellbeing", "Positive relationships", "Leadership & management"].map((t) => (
              <span key={t} className="rounded-full border border-[var(--cs-teal-soft)] bg-[var(--cs-teal-bg)] px-4 py-2 text-sm font-semibold text-[var(--cs-teal-strong)]">{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────────── */}
      <section id="faq" className="mx-auto max-w-3xl px-5 py-20">
        <div className="text-center">
          <SectionEyebrow>FAQ</SectionEyebrow>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[var(--cs-navy)] sm:text-4xl">Questions, answered.</h2>
        </div>
        <div className="mt-10 space-y-3">
          {[
            { q: "Is our data secure?", a: "Yes. Access is role-based, every change is audit-logged, and sensitive screens are protected. Permissions, audit trails and human review are built into the core — not bolted on." },
            { q: "How does the AI (ARIA) work — and is it safe?", a: "Your RAG ratings come from deterministic, explainable engines — not a language model guessing. ARIA assists with drafting, summarising and spotting patterns, but it never auto-decides statutory thresholds: anything safeguarding-critical forces human review, and high or critical flags are never deleted." },
            { q: "Is it really Ofsted-ready?", a: "Every engine is mapped to the Children's Homes Regulations 2015 and the Quality Standards, and framed around Ofsted's SCCIF — so your evidence is already organised the way an inspector reads it, with the records behind every rating one click away." },
            { q: "Will my team actually use it?", a: "Recording is fast and natural — type, talk, or tap “Record anything”. Support workers capture in seconds and get back to the young people; managers get the intelligence without chasing." },
            { q: "Does it work on mobile and offline?", a: "Yes. Cornerstone installs to the home screen as an app, works on phones and tablets, and keeps working when the connection drops." },
            { q: "Who is it for?", a: "From a single registered home to multi-home providers and Responsible Individuals who need oversight across a group — one platform, every role, on the same page." },
          ].map((f, i) => (
            <details key={i} className="group rounded-2xl border border-[var(--cs-border)] bg-white px-5 py-4 shadow-[var(--cs-shadow-card)] [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-bold text-[var(--cs-navy)]">
                {f.q}
                <ChevronDown className="h-5 w-5 shrink-0 text-[var(--cs-teal)] transition-transform group-open:rotate-180" />
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-[var(--cs-text-secondary)]">{f.a}</p>
            </details>
          ))}
        </div>
        <p className="mt-8 text-center text-sm text-[var(--cs-text-muted)]">Still have questions? <a href="#contact" className="font-semibold text-[var(--cs-teal-strong)] hover:underline">Book a demo</a> and we&rsquo;ll walk you through it.</p>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────────── */}
      <section id="contact" className="mx-auto max-w-7xl px-5 py-20">
        <div className="relative overflow-hidden rounded-3xl bg-[var(--cs-navy)] px-6 py-16 text-center text-white shadow-[var(--cs-shadow-card)]">
          <div className="pointer-events-none absolute inset-0 opacity-50" style={{ background: "radial-gradient(50% 80% at 50% 0%, var(--cs-teal-glow) 0%, transparent 60%)" }} />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl text-3xl font-extrabold tracking-tight sm:text-4xl">Ready to run an outstanding home?</h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-white/75">
              See Cornerstone Care OS on your own home&rsquo;s data. Book a walkthrough, or step straight into the platform.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="mailto:hello@cornerstonecare.app?subject=Cornerstone%20Care%20OS%20demo" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-[var(--cs-navy)] transition-transform hover:-translate-y-0.5">
                Book a demo <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/dashboard" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/5 px-6 py-3.5 text-sm font-bold text-white transition-colors hover:bg-white/10">
                Explore the platform
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <MarketingFooter />
    </div>
  );
}

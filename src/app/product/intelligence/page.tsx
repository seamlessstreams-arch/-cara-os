// ══════════════════════════════════════════════════════════════════════════════
// CARA — Cara INTELLIGENCE DEEP-DIVE PAGE  (route: /intelligence)
//
// Standalone deep-dive on the real-time intelligence layer. Static server
// component. Honest copy — every capability maps to something real in the app.
// ══════════════════════════════════════════════════════════════════════════════

import type { Metadata } from "next";
import Link from "next/link";
import {
  Brain, Radar, LineChart, CalendarCheck, ShieldCheck, Sunrise, ClipboardCheck,
  FileText, Scale, Layers, PenLine, ShieldAlert, Award, Activity, Eye, GitMerge,
  ArrowRight, CheckCircle2, Lock, Siren, HeartHandshake, BookOpen, FileLock2,
} from "lucide-react";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { SectionEyebrow } from "@/components/marketing/ui";

export const metadata: Metadata = {
  title: "Cara real-time intelligence | Cara OS",
  description:
    "How Cara turns the records your team already keeps into live RAG ratings, ranked priorities and a clear direction of travel — plus the Cara Practice Assistant: live support during incidents, quality-checked recording and manager-reviewed drafts.",
};

const OUTPUTS = [
  { Icon: Radar, t: "Priority Briefing", d: "One ranked feed of what needs attention across every engine — each signal deep-linked to the page to act on it." },
  { Icon: LineChart, t: "Direction of Travel", d: "Home and per-child trends that answer the question inspectors love: are your safety and wellbeing signals improving or worsening?" },
  { Icon: CalendarCheck, t: "Plan Currency", d: "Every statutory plan and assessment, RAG-rated by review date, across every child — one board, no silos." },
  { Icon: ShieldCheck, t: "Premises Compliance", d: "Are all building-safety checks and certificates in date? Gas, electrical, fire, water and more in one Reg-31 view." },
  { Icon: Sunrise, t: "Shift Briefing", d: "What must happen this shift — who's on, tasks and reviews due, medications, and overnight events." },
  { Icon: ClipboardCheck, t: "Ofsted Readiness", d: "A live composite rating across all six judgement areas — where you stand today, not on the night before." },
  { Icon: Brain, t: "Manager Briefing", d: "The core domains distilled for leadership, with the single thing that most needs your attention next." },
  { Icon: FileText, t: "Report Packs", d: "Home Summary and Child Review packs generated in one click — print-ready and optionally Cara-narrated." },
];

const DOMAINS = ["Safeguarding", "Health & medication", "Education", "Positive relationships", "Care & wellbeing", "Leadership & management"];

export default function IntelligencePage() {
  return (
    <div className="min-h-screen bg-[var(--cs-bg)] text-[var(--cs-text)]">
      <MarketingHeader />

      {/* Hero */}
      <section className="relative overflow-hidden bg-[var(--cs-navy)] text-white">
        <div className="pointer-events-none absolute inset-0 opacity-50" style={{ background: "radial-gradient(50% 60% at 15% 0%, var(--cs-cara-glow) 0%, transparent 55%), radial-gradient(45% 55% at 100% 100%, var(--cs-teal-glow) 0%, transparent 50%)" }} />
        <div className="relative mx-auto max-w-4xl px-5 py-20 text-center lg:py-28">
          <span className="inline-block rounded-full border border-[var(--cs-cara-gold)]/30 bg-[var(--cs-cara-gold)]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[var(--cs-cara-gold-soft)]">Cara · real-time intelligence</span>
          <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-5xl">Your records, analysed the moment they land.</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-white/75">
            Cara turns the notes your team already keeps into live RAG ratings, ranked priorities and a clear direction of travel — computed from your real records by around 300 deterministic engines. No overnight batch. No black box.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/contact" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-[var(--cs-navy)] transition-transform hover:-translate-y-0.5">Book a demo <ArrowRight className="h-4 w-4" /></Link>
            <Link href="/dashboard" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/5 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-white/10">Explore the platform</Link>
          </div>
        </div>
      </section>

      {/* From records to intelligence */}
      <section className="mx-auto max-w-7xl px-5 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <SectionEyebrow>From records to intelligence</SectionEyebrow>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[var(--cs-navy)] sm:text-4xl">The recording you already do, made to work for you.</h2>
          <p className="mt-4 text-lg text-[var(--cs-text-secondary)]">Capture an entry the natural way, and it&rsquo;s scored across every domain the instant it lands — no extra forms, no separate &ldquo;analytics&rdquo; step.</p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-3">
          {[
            { n: "01", Icon: PenLine, t: "You record", d: "A daily log, an incident, a key-working session — typed, spoken, or tapped in seconds, with the child and shift attached." },
            { n: "02", Icon: Activity, t: "Cara analyses", d: "Around 300 deterministic engines re-evaluate the relevant domains immediately, producing explainable RAG ratings." },
            { n: "03", Icon: Radar, t: "You see what matters", d: "Ranked priorities, trends and ready evidence surface across the platform — before anyone has to ask for them." },
          ].map((s, i) => (
            <div key={i} className="rounded-2xl border border-[var(--cs-border)] bg-white p-7 shadow-[var(--cs-shadow-card)]">
              <span className="text-sm font-extrabold text-[var(--cs-teal)]">{s.n}</span>
              <div className="mt-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--cs-navy)] text-white"><s.Icon className="h-6 w-6" /></div>
              <h3 className="mt-4 text-lg font-bold text-[var(--cs-navy)]">{s.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--cs-text-secondary)]">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* The chain */}
      <section className="border-y border-[var(--cs-border)] bg-white">
        <div className="mx-auto max-w-7xl px-5 py-20">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <SectionEyebrow>How Cara thinks</SectionEyebrow>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[var(--cs-navy)] sm:text-4xl">Fast first. Deep only when needed.</h2>
              <p className="mt-4 text-lg text-[var(--cs-text-secondary)]">
                Most signals never need an AI model at all. Cara resolves them with transparent rules, falls back to a learned cache for the rest, and escalates to the model only for the genuinely novel — so it stays fast, low-cost and explainable.
              </p>
              <div className="mt-6 space-y-3">
                {[
                  { Icon: Scale, t: "Deterministic rules", d: "Auditable logic resolves the vast majority of cases — the same way every time, always traceable to the record behind it." },
                  { Icon: Layers, t: "Learned cache", d: "Patterns Cara has already reasoned about are recognised and answered instantly, without re-computing from scratch." },
                  { Icon: Brain, t: "Cara model", d: "Only the genuinely new escalates to the AI — and even then, anything that matters is held for human review." },
                ].map((s, i) => (
                  <div key={i} className="flex gap-3.5 rounded-2xl border border-[var(--cs-border)] bg-[var(--cs-bg)] p-4">
                    <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--cs-teal-bg)] text-[var(--cs-teal-strong)]"><s.Icon className="h-5 w-5" /></div>
                    <div>
                      <div className="text-sm font-bold text-[var(--cs-navy)]">{s.t}{i < 2 && <span className="ml-1.5 text-[var(--cs-teal)]">↓</span>}</div>
                      <p className="mt-0.5 text-xs leading-relaxed text-[var(--cs-text-secondary)]">{s.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Live analysis panel */}
            <div className="rounded-3xl border border-[var(--cs-border)] bg-[var(--cs-navy)] p-5 text-white shadow-[var(--cs-shadow-card)]">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-bold"><Activity className="h-4 w-4 text-[var(--cs-teal-soft)]" /> Live analysis</span>
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-white/60"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--cs-teal)]" /> updating as you record</span>
              </div>
              <div className="mt-4 space-y-2">
                {[
                  { d: "Safeguarding", s: "Requires attention", w: "82%", c: "bg-amber-400" },
                  { d: "Health & medication", s: "Good", w: "91%", c: "bg-[var(--cs-teal)]" },
                  { d: "Education", s: "Good", w: "88%", c: "bg-[var(--cs-teal)]" },
                  { d: "Relationships", s: "Good", w: "94%", c: "bg-[var(--cs-teal)]" },
                  { d: "Care & wellbeing", s: "Requires attention", w: "76%", c: "bg-amber-400" },
                  { d: "Leadership", s: "Good", w: "90%", c: "bg-[var(--cs-teal)]" },
                ].map((r, i) => (
                  <div key={i} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-white/90">{r.d}</span>
                      <span className="text-white/55">{r.s}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10"><div className={`h-full rounded-full ${r.c}`} style={{ width: r.w }} /></div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/10 bg-[var(--cs-teal)]/10 px-4 py-3">
                <span className="text-xs font-semibold text-white/80">237 signals across 78 engines</span>
                <span className="flex items-center gap-1 text-[11px] font-bold text-[var(--cs-teal-soft)]"><Radar className="h-3.5 w-3.5" /> ranked &amp; deep-linked</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Practice intelligence */}
      <section className="mx-auto max-w-7xl px-5 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <SectionEyebrow>Practice intelligence</SectionEyebrow>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[var(--cs-navy)] sm:text-4xl">Three ways Cara supports good practice.</h2>
          <p className="mt-4 text-lg text-[var(--cs-text-secondary)]">Not just risk-spotting — Cara helps your team record well, decide safely, and notice what&rsquo;s going right.</p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            { Icon: PenLine, t: "Draft", d: "Turns a few words into a structured, professional record — so good practice on the floor becomes good evidence on the page, without the writing burden.", accent: "teal" },
            { Icon: ShieldAlert, t: "Advise", d: "Flags when a threshold may be met — a LADO referral, a notifiable event — and points to the right next step. It surfaces the decision; you make it.", accent: "gold" },
            { Icon: Award, t: "Recognise", d: "Surfaces good practice worth celebrating, not just problems — the progress, the wins and the small moments that evidence quality of care.", accent: "navy" },
          ].map((s, i) => {
            const ring = s.accent === "teal" ? "bg-[var(--cs-teal-bg)] text-[var(--cs-teal-strong)]" : s.accent === "gold" ? "bg-[var(--cs-cara-gold-bg)] text-[var(--cs-cara-gold)]" : "bg-[var(--cs-navy)]/5 text-[var(--cs-navy)]";
            return (
              <div key={i} className="rounded-2xl border border-[var(--cs-border)] bg-white p-7 shadow-[var(--cs-shadow-card)]">
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${ring}`}><s.Icon className="h-6 w-6" /></div>
                <h3 className="mt-4 text-xl font-bold text-[var(--cs-navy)]">{s.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--cs-text-secondary)]">{s.d}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Cara Practice Assistant */}
      <section id="practice-assistant" className="relative overflow-hidden bg-[var(--cs-navy)] text-white">
        <div className="pointer-events-none absolute inset-0 opacity-40" style={{ background: "radial-gradient(50% 60% at 85% 0%, var(--cs-cara-glow) 0%, transparent 55%), radial-gradient(45% 55% at 0% 100%, var(--cs-teal-glow) 0%, transparent 50%)" }} />
        <div className="relative mx-auto max-w-7xl px-5 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-block rounded-full border border-[var(--cs-cara-gold)]/30 bg-[var(--cs-cara-gold)]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[var(--cs-cara-gold-soft)]">Cara Practice Assistant</span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Live support when practice is hardest.</h2>
            <p className="mt-4 text-lg leading-relaxed text-white/75">
              Intelligence isn&rsquo;t only hindsight. During and after an incident, Cara works alongside your team — in the moment, in the write-up, and in the follow-up.
            </p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { Icon: Siren, t: "Incident Mode", d: "Open a live session as events unfold — a timestamped timeline you can dictate to, co-regulation prompts matched to what's happening, and the right workflow checklist so nothing statutory is missed." },
              { Icon: PenLine, t: "Recording Assistant", d: "Reviews the language of any record — flagging judgemental phrasing, missing child voice and factual gaps — and offers a professional re-write you accept or decline. It can even re-write a record to the child, warmly and honestly." },
              { Icon: HeartHandshake, t: "Restorative follow-up", d: "Structured restorative conversations and post-incident reflection for staff — so relationships are repaired and the learning is captured, not lost." },
              { Icon: ClipboardCheck, t: "Manager oversight", d: "Every AI draft waits in a manager approval queue, alerts clear by doing the practice — not by dismissing them — and pattern recognition surfaces what repeats." },
            ].map((c, i) => (
              <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-[var(--cs-teal-soft)]"><c.Icon className="h-6 w-6" /></div>
                <h3 className="mt-4 text-base font-bold text-white">{c.t}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-white/70">{c.d}</p>
              </div>
            ))}
          </div>
          <div className="mx-auto mt-10 max-w-4xl rounded-3xl border border-white/15 bg-white/[0.05] p-7 text-center sm:p-9">
            <p className="text-xl font-extrabold tracking-tight sm:text-2xl">AI suggests. Staff decide. Manager reviews. System audits.</p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              {[
                { Icon: FileLock2, t: "Raw, AI & final versions preserved" },
                { Icon: ShieldCheck, t: "Never decides a statutory threshold" },
                { Icon: CheckCircle2, t: "Quality gate before anything saves" },
                { Icon: BookOpen, t: "Practice library built in" },
              ].map((c, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-white/85"><c.Icon className="h-3.5 w-3.5 text-[var(--cs-teal-soft)]" /> {c.t}</span>
              ))}
            </div>
            <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-white/60">
              Nothing is ever sent externally by automation, and every draft keeps the original words alongside the suggestion — so the record stays honest and the judgement stays human.
            </p>
          </div>
        </div>
      </section>

      {/* Domains */}
      <section className="border-y border-[var(--cs-border)] bg-white">
        <div className="mx-auto max-w-5xl px-5 py-16 text-center">
          <SectionEyebrow>Every domain, all the time</SectionEyebrow>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[var(--cs-navy)] sm:text-4xl">Live RAG across the whole quality picture.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-[var(--cs-text-secondary)]">Each domain is rated from your real records and rolled up the way Ofsted reads a home — so nothing important sits in a blind spot.</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {DOMAINS.map((d) => (
              <span key={d} className="rounded-full border border-[var(--cs-teal-soft)] bg-[var(--cs-teal-bg)] px-4 py-2 text-sm font-semibold text-[var(--cs-teal-strong)]">{d}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Outputs */}
      <section className="mx-auto max-w-7xl px-5 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <SectionEyebrow>What it puts in front of you</SectionEyebrow>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[var(--cs-navy)] sm:text-4xl">Intelligence you can act on — and stand behind.</h2>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {OUTPUTS.map((o, i) => (
            <div key={i} className="rounded-2xl border border-[var(--cs-border)] bg-white p-6 shadow-[var(--cs-shadow-card)]">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--cs-teal-bg)] text-[var(--cs-teal-strong)]"><o.Icon className="h-6 w-6" /></div>
              <h3 className="mt-3 text-sm font-bold text-[var(--cs-navy)]">{o.t}</h3>
              <p className="mt-1 text-xs leading-relaxed text-[var(--cs-text-secondary)]">{o.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Safe by design */}
      <section className="border-t border-[var(--cs-border)] bg-white">
        <div className="mx-auto max-w-5xl px-5 py-16">
          <div className="rounded-3xl border border-[var(--cs-border)] bg-[var(--cs-bg)] p-8 sm:p-10">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="max-w-2xl">
                <SectionEyebrow>Safe by design</SectionEyebrow>
                <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-[var(--cs-navy)] sm:text-3xl">Explainable, and always human-in-the-loop.</h2>
                <p className="mt-3 text-base leading-relaxed text-[var(--cs-text-secondary)]">
                  Ratings trace back to the records behind them, Cara never auto-decides a statutory threshold, and high or critical flags are never deleted by automation. The intelligence supports your judgement — it never replaces it.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {[{ Icon: Eye, t: "Explainable" }, { Icon: ShieldCheck, t: "Human-in-the-loop" }, { Icon: GitMerge, t: "One source of truth" }, { Icon: Lock, t: "Protected flags" }].map((c, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 rounded-full border border-[var(--cs-border)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--cs-navy)]"><c.Icon className="h-3.5 w-3.5 text-[var(--cs-teal-strong)]" /> {c.t}</span>
                  ))}
                </div>
              </div>
              <Link href="/security" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[var(--cs-navy)] px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-[var(--cs-navy-soft)] hover:shadow-md">Read about security <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-5 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-[var(--cs-navy)] sm:text-4xl">See the intelligence on your own home&rsquo;s data.</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-[var(--cs-text-secondary)]">Book a walkthrough, or step into the platform and watch the ratings move as you record.</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/contact" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--cs-navy)] px-6 py-3.5 text-sm font-bold text-white transition-all hover:bg-[var(--cs-navy-soft)] hover:shadow-md">Book a demo <ArrowRight className="h-4 w-4" /></Link>
            <Link href="/product/workforce" className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--cs-border)] bg-white px-6 py-3.5 text-sm font-bold text-[var(--cs-navy)] transition-colors hover:bg-[var(--cs-bg)]">Explore workforce <CheckCircle2 className="h-4 w-4 text-[var(--cs-teal)]" /></Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}

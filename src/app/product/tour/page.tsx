// ══════════════════════════════════════════════════════════════════════════════
// CARA — PRODUCT TOUR  (route: /product/tour)
//
// A visual "see it in action" walkthrough using REAL screenshots of the live
// platform (captured from the live demo deployment). Each step
// links straight into the corresponding live page.
// ══════════════════════════════════════════════════════════════════════════════

import type { Metadata } from "next";
import Link from "next/link";
import {
  LayoutDashboard, Radar, Sunrise, CalendarCheck, ShieldCheck, LineChart, Siren,
  ArrowRight, ArrowUpRight, CheckCircle2, PenLine,
} from "lucide-react";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { SectionEyebrow } from "@/components/marketing/ui";

export const metadata: Metadata = {
  title: "Product tour | Cara OS",
  description:
    "See Cara in action — real screens from the live platform: the Command Centre, Priority Briefing, Shift Briefing, Cara Incident Mode, Plan Currency, Premises Compliance and Direction of Travel.",
};

const STEPS = [
  {
    Icon: LayoutDashboard, eyebrow: "Command Centre", href: "/dashboard", img: "/tour/dashboard.jpg",
    title: "Your whole home, the moment you log in.",
    body: "Open the platform to a calm, prioritised picture of the home — a handover prompt, the alerts that matter, and Cara's read on what needs you today.",
    points: ["Live handover prompt & alerts", "Cara intelligence up top", "Everything one click away"],
  },
  {
    Icon: Radar, eyebrow: "Priority Briefing", href: "/priority-briefing", img: "/tour/priority-briefing.jpg",
    title: "What needs you — ranked, and deep-linked.",
    body: "One feed pulls the most important signals from across every engine, ranked by severity, each linked straight to the page where you act on it.",
    points: ["Critical → watch, in order", "Pulled from ~78 engines", "Click a signal, act on it"],
  },
  {
    Icon: Sunrise, eyebrow: "Shift Briefing", href: "/shift-briefing", img: "/tour/shift-briefing.jpg",
    title: "Everything this shift, on one screen.",
    body: "Coming on duty? See who's on, the tasks and plan reviews due, active medications and overnight events — with a must-not-miss attention list at the top.",
    points: ["Who's on & what's due now", "Overnight incidents flagged", "Every item links to act"],
  },
  {
    Icon: Siren, eyebrow: "Incident Mode", href: "/cara/incident-mode", img: "/tour/incident-mode.jpg",
    title: "Live support while an incident is happening.",
    body: "When things escalate, open a live session — pick the child, what's happening and the risk level, and Cara stays alongside you: co-regulation prompts, the right workflow checklist, a timestamped timeline you can dictate to, and a quality-checked draft record at the end. Cara suggests; staff decide; the manager reviews.",
    points: ["Guided start: who, what, risk level", "Live timeline with voice dictation", "Draft record held for manager review"],
  },
  {
    Icon: PenLine, eyebrow: "Writing to the Child", href: "/writing-to-child", img: "/tour/writing-to-child.jpg",
    title: "A critical friend for every record.",
    body: "Paste a draft and Cara challenges it the way a great supervisor would — flagging shaming or institutional language (“refused to engage”, “returned safe and well”), checking the child’s voice is there, and offering careful, child-readable wording that keeps the risk clear. Write the record as evidence for professionals, but as memory for the child.",
    points: ["Child-readable score & language flags", "Reflective questions before you record", "PACE & contextual-safeguarding lenses built in"],
  },
  {
    Icon: CalendarCheck, eyebrow: "Plan Currency", href: "/plan-currency", img: "/tour/plan-currency.jpg",
    title: "Are every child's plans in date?",
    body: "A RAG matrix across every statutory plan and child, with the overdue reviews listed for action — no more opening twelve pages to find the one that's lapsed.",
    points: ["Every plan type × every child", "Overdue reviews, ranked", "Currency rate at a glance"],
  },
  {
    Icon: ShieldCheck, eyebrow: "Premises Compliance", href: "/premises-compliance", img: "/tour/premises-compliance.jpg",
    title: "Every safety check, one board.",
    body: "Gas, electrical, fire, water, drills and servicing — RAG-rated by currency, with failed and overdue checks surfaced first and the gaps with no record on file made honest.",
    points: ["Certificates & routine checks", "Failed / overdue first", "Reg 31, answered"],
  },
  {
    Icon: LineChart, eyebrow: "Direction of Travel", href: "/home-trends", img: "/tour/home-trends.jpg",
    title: "Are things getting better or worse?",
    body: "The longitudinal view inspectors love — home-wide and per-child trends across incidents, behaviour, rewards and more, with the direction called out honestly.",
    points: ["8-week trend per metric", "Polarity-aware direction", "Improving, worsening or stable"],
  },
];

function BrowserFrame({ img, alt, href }: { img: string; alt: string; href: string }) {
  return (
    <Link href={href} className="group block overflow-hidden rounded-2xl border border-[var(--cs-border)] bg-white shadow-[var(--cs-shadow-card)] transition-transform hover:-translate-y-0.5">
      <div className="flex items-center gap-1.5 border-b border-[var(--cs-border)] bg-[var(--cs-bg)] px-3 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-green-300" />
        <span className="ml-2 hidden truncate rounded-md bg-white px-2.5 py-1 text-[11px] font-medium text-[var(--cs-text-muted)] sm:inline-block">cara-os.app{href}</span>
        <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--cs-teal-strong)] opacity-0 transition-opacity group-hover:opacity-100">Open live <ArrowUpRight className="h-3 w-3" /></span>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={img} alt={alt} className="block w-full" loading="lazy" />
    </Link>
  );
}

export default function TourPage() {
  return (
    <div className="min-h-screen bg-[var(--cs-bg)] text-[var(--cs-text)]">
      <MarketingHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-70" style={{ background: "radial-gradient(55% 50% at 50% 0%, var(--cs-teal-glow) 0%, transparent 60%)" }} />
        <div className="relative mx-auto max-w-3xl px-5 py-16 text-center lg:py-20">
          <SectionEyebrow>Product tour</SectionEyebrow>
          <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] tracking-tight text-[var(--cs-navy)] sm:text-5xl">See Cara in action.</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-[var(--cs-text-secondary)]">
            Real screens from the live platform — running on a demo home&rsquo;s data. Every screenshot is a live page; click any one to step straight into it.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link href="/dashboard" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--cs-navy)] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[var(--cs-navy-soft)] hover:shadow-md">Open the live demo <ArrowRight className="h-4 w-4" /></Link>
            <Link href="/contact" className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--cs-border)] bg-white/70 px-5 py-3 text-sm font-semibold text-[var(--cs-navy)] transition-colors hover:bg-white">Book a walkthrough</Link>
          </div>
          <p className="mt-4 text-xs text-[var(--cs-text-muted)]">Demo data — a fictional home, fictional people. No real child or staff information.</p>
        </div>
      </section>

      {/* Steps */}
      <section className="mx-auto max-w-7xl px-5 pb-8">
        <div className="space-y-16 lg:space-y-24">
          {STEPS.map((s, i) => {
            const flip = i % 2 === 1;
            return (
              <div key={s.href} className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
                <div className={flip ? "lg:order-2" : ""}>
                  <div className="flex items-center gap-2.5">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--cs-teal-bg)] text-[var(--cs-teal-strong)]"><s.Icon className="h-5 w-5" /></span>
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--cs-teal-strong)]">{s.eyebrow}</span>
                  </div>
                  <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-[var(--cs-navy)] sm:text-3xl">{s.title}</h2>
                  <p className="mt-3 text-base leading-relaxed text-[var(--cs-text-secondary)]">{s.body}</p>
                  <ul className="mt-5 space-y-2">
                    {s.points.map((p, j) => (
                      <li key={j} className="flex items-start gap-2.5 text-sm font-medium text-[var(--cs-text)]"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--cs-teal)]" /> {p}</li>
                    ))}
                  </ul>
                  <Link href={s.href} className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--cs-navy)] hover:text-[var(--cs-teal-strong)]">Open {s.eyebrow} in the platform <ArrowUpRight className="h-4 w-4" /></Link>
                </div>
                <div className={flip ? "lg:order-1" : ""}>
                  <BrowserFrame img={s.img} alt={`${s.eyebrow} — ${s.title}`} href={s.href} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-5 py-20">
        <div className="relative overflow-hidden rounded-3xl bg-[var(--cs-navy)] px-6 py-16 text-center text-white shadow-[var(--cs-shadow-card)]">
          <div className="pointer-events-none absolute inset-0 opacity-50" style={{ background: "radial-gradient(50% 80% at 50% 0%, var(--cs-teal-glow) 0%, transparent 60%)" }} />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl text-3xl font-extrabold tracking-tight text-white sm:text-4xl">That&rsquo;s the tour. Now try it yourself.</h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-white/75">Step into the live demo and click around, or book a walkthrough on your own home&rsquo;s data.</p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="/dashboard" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-[var(--cs-navy)] transition-transform hover:-translate-y-0.5">Open the live demo <ArrowRight className="h-4 w-4" /></Link>
              <Link href="/contact" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/5 px-6 py-3.5 text-sm font-bold text-white transition-colors hover:bg-white/10">Book a walkthrough</Link>
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}

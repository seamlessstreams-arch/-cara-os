// ══════════════════════════════════════════════════════════════════════════════
// CARA — ABOUT / STORY PAGE  (route: /about)
//
// Static, on-brand. The authentic, practitioner-built narrative and the
// principles behind the product. No fabricated team, funding or testimonials.
// ══════════════════════════════════════════════════════════════════════════════

import type { Metadata } from "next";
import Link from "next/link";
import {
  HeartHandshake, GitMerge, ShieldCheck, Eye, Sparkles, Users, Quote,
  ArrowRight, CheckCircle2,
} from "lucide-react";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { SectionEyebrow } from "@/components/marketing/ui";

export const metadata: Metadata = {
  title: "About | Cara OS",
  description:
    "Cara was built inside a real children's home by a Registered Manager — to stop brilliant care being let down by paperwork. Capture once, surface everywhere, never duplicate.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[var(--cs-bg)] text-[var(--cs-text)]">
      <MarketingHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-70" style={{ background: "radial-gradient(55% 50% at 20% 0%, var(--cs-cara-glow) 0%, transparent 60%)" }} />
        <div className="relative mx-auto max-w-4xl px-5 py-16 text-center lg:py-24">
          <SectionEyebrow>Our story</SectionEyebrow>
          <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] tracking-tight text-[var(--cs-navy)] sm:text-5xl">
            Built in a real children&rsquo;s home.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-[var(--cs-text-secondary)]">
            Not in a boardroom, and not by people who&rsquo;ve never run a shift. Cara was built by a Registered Manager
            who was tired of watching brilliant care get let down by paperwork.
          </p>
        </div>
      </section>

      {/* The story */}
      <section className="border-y border-[var(--cs-border)] bg-white">
        <div className="mx-auto max-w-3xl px-5 py-20">
          <SectionEyebrow>Why it exists</SectionEyebrow>
          <div className="mt-6 space-y-5 text-lg leading-relaxed text-[var(--cs-text-secondary)]">
            <p>
              In a children&rsquo;s home, the care is the easy part to be proud of. The hard part is proving it — the records
              scattered across books, folders and spreadsheets, re-keyed three times and trusted nowhere, the fortnight that
              vanishes when Ofsted calls, the safeguarding pattern that only became obvious after it became an incident.
            </p>
            <p>
              Cara started as a simple frustration: <span className="font-semibold text-[var(--cs-navy)]">the home was already
              capturing everything it needed to tell its own story — it just couldn&rsquo;t see it.</span> The notes existed. The
              evidence existed. It was buried in the noise of a dozen disconnected systems.
            </p>
            <p>
              So the principle came first, and everything else followed from it: <span className="font-semibold text-[var(--cs-navy)]">capture
              once, surface everywhere, never duplicate.</span> Record something the natural way — type it, say it, tap it — and let
              the platform put it where it&rsquo;s needed, turn it into live intelligence, and have the evidence ready before anyone asks.
            </p>
            <p>
              There was one more thing. To make sense of it all, staff — like everywhere — had started quietly reaching for
              public AI tools, pasting a child&rsquo;s details into a chatbot to save time. Well-meant, but a real risk to some of
              the most sensitive data there is. So Cara has its own assistant, <span className="font-semibold text-[var(--cs-navy)]">Ask
              CARA</span>: it answers from the home&rsquo;s own records, keeps everything in-house, and never sends a child&rsquo;s
              information to an outside model. The help staff wanted — without the risk.
            </p>
          </div>

          <div className="mt-10 rounded-3xl border border-[var(--cs-border)] bg-[var(--cs-cara-gold-bg)] p-8 text-center">
            <Quote className="mx-auto h-7 w-7 text-[var(--cs-cara-gold)]" />
            <p className="mt-4 text-lg font-medium leading-relaxed text-[var(--cs-navy)]">
              &ldquo;I built Cara because I was tired of brilliant care being let down by paperwork. Capture it once, and let the home show its own story.&rdquo;
            </p>
            <p className="mt-4 text-sm font-semibold text-[var(--cs-text-muted)]">— A Registered Manager, and the person who built this</p>
          </div>
        </div>
      </section>

      {/* What we believe */}
      <section className="mx-auto max-w-7xl px-5 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <SectionEyebrow>What we believe</SectionEyebrow>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[var(--cs-navy)] sm:text-4xl">The principles the platform is built on.</h2>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { Icon: HeartHandshake, t: "The child comes first", d: "Every record, rating and report exists to serve the young person — their safety, their voice, their outcomes. Never the other way round." },
            { Icon: GitMerge, t: "Capture once", d: "Good people shouldn't spend their shift re-typing. One canonical record flows everywhere it's needed, validated once." },
            { Icon: ShieldCheck, t: "Safeguarding first", d: "When it matters, a human decides. AI never auto-decides a threshold, and a high or critical concern is never quietly lost." },
            { Icon: Eye, t: "Evidence, not anecdote", d: "Every rating traces back to a real record. If we can't show our working, we don't show a score." },
            { Icon: Sparkles, t: "Calm over chaos", d: "The job is hard enough. The tools should make a shift calmer and clearer — not add another thing to manage." },
            { Icon: Users, t: "Built with practitioners", d: "Designed for the realities of a handover, a 2am incident and an Ofsted morning — because that's where it was made." },
          ].map((b, i) => (
            <div key={i} className="rounded-2xl border border-[var(--cs-border)] bg-white p-6 shadow-[var(--cs-shadow-card)]">
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--cs-teal-bg)] text-[var(--cs-teal-strong)]"><b.Icon className="h-6 w-6" /></div>
              <h3 className="text-base font-bold text-[var(--cs-navy)]">{b.t}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-[var(--cs-text-secondary)]">{b.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Mission band */}
      <section className="relative overflow-hidden bg-[var(--cs-navy)] text-white">
        <div className="pointer-events-none absolute inset-0 opacity-40" style={{ background: "radial-gradient(50% 60% at 100% 0%, var(--cs-teal-glow) 0%, transparent 55%)" }} />
        <div className="relative mx-auto max-w-4xl px-5 py-20 text-center">
          <span className="inline-block rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[var(--cs-teal-soft)]">Our mission</span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Let great care speak for itself.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/75">
            To give every children&rsquo;s home the clarity, confidence and evidence to do its best work — so the people doing
            the caring can spend less time proving it, and more time doing it.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {["Capture once", "Surface everywhere", "Never duplicate"].map((t) => (
              <span key={t} className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/90"><CheckCircle2 className="h-4 w-4 text-[var(--cs-teal-soft)]" /> {t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-5 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-[var(--cs-navy)] sm:text-4xl">See it on your own home&rsquo;s data.</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-[var(--cs-text-secondary)]">Book a walkthrough, or step straight into the platform and have a look around.</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/contact" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--cs-navy)] px-6 py-3.5 text-sm font-bold text-white transition-all hover:bg-[var(--cs-navy-soft)] hover:shadow-md">Book a demo <ArrowRight className="h-4 w-4" /></Link>
            <Link href="/dashboard" className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--cs-border)] bg-white px-6 py-3.5 text-sm font-bold text-[var(--cs-navy)] transition-colors hover:bg-[var(--cs-bg)]">Explore the platform</Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}

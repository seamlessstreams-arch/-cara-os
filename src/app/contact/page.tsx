// ══════════════════════════════════════════════════════════════════════════════
// CARA — CONTACT / EARLY ACCESS  (route: /contact)
// ══════════════════════════════════════════════════════════════════════════════

import type { Metadata } from "next";
import { Mail, Clock, ShieldCheck } from "lucide-react";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { SectionEyebrow } from "@/components/marketing/ui";
import { EarlyAccessForm } from "@/components/marketing/early-access-form";

export const metadata: Metadata = {
  title: "Book a Demo | Cara",
  description:
    "Book a demo of Cara — the Care Intelligence OS for children's homes — or start a conversation about recording, safeguarding and evidence in your home.",
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[var(--cs-bg)] text-[var(--cs-text)]">
      <MarketingHeader />

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-70" style={{ background: "radial-gradient(55% 50% at 50% 0%, var(--cs-teal-glow) 0%, transparent 60%)" }} />
        <div className="relative mx-auto max-w-5xl px-5 py-14 lg:py-16">
          <div className="mx-auto max-w-2xl text-center">
            <SectionEyebrow>Book a Demo</SectionEyebrow>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] tracking-tight text-[var(--cs-navy)] sm:text-5xl">Ready to turn recording into intelligence?</h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-[var(--cs-text-secondary)]">
              Tell us a little about your service and we&rsquo;ll arrange a demo on a realistic home&rsquo;s rhythm — recording, safeguarding intelligence, oversight and evidence, live. Or just start a conversation.
            </p>
          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
            <EarlyAccessForm />

            <div className="space-y-4">
              {[
                { Icon: Mail, t: "A personal reply", d: <>Every message comes straight to the team — we read and reply personally, usually within one working day.</> },
                { Icon: Clock, t: "What happens next", d: <>A short, no-pressure conversation to understand your service — then a walkthrough on relevant, realistic examples.</> },
                { Icon: ShieldCheck, t: "Your details are safe", d: <>We only use what you share to talk to you about Cara. See our <a className="font-semibold text-[var(--cs-teal-strong)] hover:underline" href="/privacy">privacy summary</a>.</> },
              ].map((c, i) => (
                <div key={i} className="rounded-2xl border border-[var(--cs-border)] bg-white p-5 shadow-[var(--cs-shadow-card)]">
                  <c.Icon className="h-6 w-6 text-[var(--cs-teal-strong)]" />
                  <h3 className="mt-3 text-base font-bold text-[var(--cs-navy)]">{c.t}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-[var(--cs-text-secondary)]">{c.d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}

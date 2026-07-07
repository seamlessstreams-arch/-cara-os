// ══════════════════════════════════════════════════════════════════════════════
// CARA — SHADOW-AI CALLOUT  (reusable marketing band)
//
// Names the real risk — staff pasting confidential child data into public
// chatbots (unsanctioned, without consent, in breach of UK/EU data-protection
// law and at odds with keeping children safe online) — and resolves it to the
// shipped capability: Ask CARA as the sanctioned, governed, in-house assistant.
// Honest copy: Cara supports compliance, it does not certify it. The `lens`
// prop tailors the headline to each page's theme.
// ══════════════════════════════════════════════════════════════════════════════

import { ShieldAlert, ShieldCheck, Lock, Eye, ScrollText } from "lucide-react";

const POINTS = [
  { Icon: Lock, t: "Nothing sent to a public model" },
  { Icon: Eye, t: "External-AI use declared, not hidden" },
  { Icon: ScrollText, t: "Every interaction logged & hashed" },
  { Icon: ShieldCheck, t: "Evidence AI is governed for your DPO" },
];

export function ShadowAiCallout({
  lens = "Sensitive data is being pasted into public chatbots. Cara gives it somewhere safe to go.",
}: {
  lens?: string;
}) {
  return (
    <section className="mx-auto max-w-5xl px-5 py-16">
      <div className="rounded-3xl border border-[var(--cs-risk-soft)] bg-[var(--cs-risk-bg)] p-8 sm:p-10">
        <div className="grid gap-8 md:grid-cols-[1.4fr_1fr] md:items-center">
          <div>
            <div className="flex items-center gap-2 text-[var(--cs-risk)]">
              <ShieldAlert className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-wider">Shadow AI</span>
            </div>
            <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-[var(--cs-navy)] sm:text-3xl">{lens}</h2>
            <p className="mt-4 text-base leading-relaxed text-[var(--cs-text-secondary)]">
              When staff drop a child&rsquo;s name, history or risk into ChatGPT to save time, confidential data leaves
              your control and is shared without consent — a real risk under UK GDPR, the EU GDPR and the Data Protection
              Act 2018, and at odds with the duty to keep children safe online. Ask CARA gives teams a sanctioned,
              in-house assistant that answers only from your own records, so the data stays on your platform and every
              use is logged and governable — shadow AI becomes visible, governed AI.
            </p>
            <p className="mt-3 text-xs text-[var(--cs-text-muted)]">Cara helps you govern AI use and meet your data-protection duties; it supports compliance rather than certifying it.</p>
          </div>
          <ul className="space-y-3">
            {POINTS.map((c, i) => (
              <li key={i} className="flex items-center gap-2.5 rounded-xl border border-[var(--cs-border)] bg-white px-4 py-3 text-sm font-semibold text-[var(--cs-navy)]">
                <c.Icon className="h-4 w-4 shrink-0 text-[var(--cs-teal-strong)]" /> {c.t}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// CARA — ASK CARA BAND  (reusable marketing section)
//
// The governed, deterministic assistant on every page — with the specific AI
// safeguards and a dark visual that shows the platform's immersive Ask CARA
// look. Honest copy: answers from records, never invents, never decides
// safeguarding. Maps to shipped capability (the Ask CARA shadow-AI replacement).
// ══════════════════════════════════════════════════════════════════════════════

import { Cpu, Lock, ShieldCheck, ScrollText, Brain, KeyRound } from "lucide-react";
import { SectionEyebrow } from "@/components/marketing/ui";

const SAFEGUARDS = [
  { Icon: Cpu, t: "Deterministic — every answer traces to a record" },
  { Icon: Lock, t: "No child data leaves the platform" },
  { Icon: ShieldCheck, t: "Prompt-injection guarded, fail-closed" },
  { Icon: ScrollText, t: "Every answer hashed & audited" },
  { Icon: Brain, t: "Refuses to decide safeguarding — that stays human" },
  { Icon: KeyRound, t: "Role-based — sees only what you may" },
];

export function AskCaraBand() {
  return (
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
            {SAFEGUARDS.map((c, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-[var(--cs-text-secondary)]"><c.Icon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--cs-teal-strong)]" /> {c.t}</li>
            ))}
          </ul>
        </div>

        {/* Dark app visual — a look at Ask CARA in the platform's immersive skin */}
        <div className="relative">
          <div className="pointer-events-none absolute -inset-4 opacity-60" style={{ background: "radial-gradient(60% 50% at 80% 0%, var(--cs-teal-glow) 0%, transparent 60%)" }} />
          <div className="relative overflow-hidden rounded-3xl border border-white/10 p-5 shadow-[var(--cs-shadow-elevated)]" style={{ background: "radial-gradient(120% 90% at 100% -10%, rgba(99,102,241,0.20) 0%, transparent 52%), linear-gradient(180deg,#0a0f1f 0%,#0c1226 55%,#0e1730 100%)" }}>
            <div className="flex items-center gap-3">
              <svg viewBox="0 0 24 24" className="h-8 w-8 drop-shadow-[0_0_12px_rgba(96,165,250,0.5)]" aria-hidden><defs><linearGradient id="acb-spark" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#2dd4bf" /><stop offset="0.5" stopColor="#60a5fa" /><stop offset="1" stopColor="#a78bfa" /></linearGradient></defs><path d="M12 0C13.4 6.9 17.1 10.6 24 12C17.1 13.4 13.4 17.1 12 24C10.6 17.1 6.9 13.4 0 12C6.9 10.6 10.6 6.9 12 0Z" fill="url(#acb-spark)" /></svg>
              <div>
                <div className="text-[15px] font-light text-slate-100">Hi Darren — ready when you are</div>
                <div className="text-[11px] text-slate-400">I answer from this home&rsquo;s records — never a guess.</div>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              <div className="flex justify-end"><div className="max-w-[80%] rounded-3xl rounded-br-lg bg-indigo-500/90 px-3.5 py-2 text-[13px] text-white shadow-lg">What&rsquo;s overdue across the home right now?</div></div>
              <div className="flex gap-2.5">
                <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0" aria-hidden><defs><linearGradient id="acb-spark2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#2dd4bf" /><stop offset="0.5" stopColor="#60a5fa" /><stop offset="1" stopColor="#a78bfa" /></linearGradient></defs><path d="M12 0C13.4 6.9 17.1 10.6 24 12C17.1 13.4 13.4 17.1 12 24C10.6 17.1 6.9 13.4 0 12C6.9 10.6 10.6 6.9 12 0Z" fill="url(#acb-spark2)" /></svg>
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
  );
}

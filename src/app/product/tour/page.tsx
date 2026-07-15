// ══════════════════════════════════════════════════════════════════════════════
// CARA — PRODUCT TOUR  (route: /product/tour)
//
// Visual "see it in action" walkthrough. Each step uses an inline JSX mockup
// built from real Cara design tokens — always accurate, never a stale screenshot.
// ══════════════════════════════════════════════════════════════════════════════

import type { Metadata } from "next";
import Link from "next/link";
import {
  LayoutDashboard, Radar, CalendarCheck2, ShieldCheck, LineChart, Siren,
  ArrowRight, ArrowUpRight, CheckCircle2, PenLine, ClipboardCheck,
  Users, Clock, AlertTriangle, Sparkles, Brain, CheckCircle,
  Zap, Shield, Target, TrendingUp, TrendingDown, Minus,
  Bell, FileText, Eye, ChevronRight,
} from "lucide-react";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingPageHero, HeroGoldCta, HeroGlassCta } from "@/components/marketing/page-hero";
import { Reveal, TiltCard, ScrollProgress } from "@/components/marketing/fx";
import { HeroField } from "@/components/marketing/hero-field";

export const metadata: Metadata = {
  title: "Product tour | Cara OS",
  description:
    "See Cara in action — real screens from the live platform: the Manager Control Centre, Priority Briefing, Shift Plan, Incident Mode, Management Oversight, Writing Assistant, Safeguarding Intelligence, and Direction of Travel.",
};

// ── Browser chrome wrapper ────────────────────────────────────────────────────

function MockupFrame({ children, href, url }: { children: React.ReactNode; href: string; url: string }) {
  return (
    <Link
      href={href}
      className="group block overflow-hidden rounded-2xl border border-[var(--cs-border)] bg-white shadow-[var(--cs-shadow-card)] transition-transform hover:-translate-y-0.5"
    >
      <div className="flex items-center gap-1.5 border-b border-[var(--cs-border)] bg-[var(--cs-bg)] px-3 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-green-300" />
        <span className="ml-2 hidden truncate rounded-md bg-white px-2.5 py-1 text-[11px] font-medium text-[var(--cs-text-muted)] sm:inline-block">
          cara-os.app{url}
        </span>
        <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--cs-teal-strong)] opacity-0 transition-opacity group-hover:opacity-100">
          Open live <ArrowUpRight className="h-3 w-3" />
        </span>
      </div>
      <div className="overflow-hidden">{children}</div>
    </Link>
  );
}

// ── Shared mini-UI primitives ─────────────────────────────────────────────────

function SevDot({ sev }: { sev: "critical" | "high" | "medium" | "low" }) {
  const c = { critical: "bg-red-500", high: "bg-orange-400", medium: "bg-amber-400", low: "bg-slate-300" }[sev];
  return <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${c}`} />;
}
function SevBadge({ sev }: { sev: "critical" | "high" | "medium" | "low" }) {
  const c = { critical: "bg-red-100 text-red-700", high: "bg-orange-100 text-orange-700", medium: "bg-amber-100 text-amber-700", low: "bg-slate-100 text-slate-600" }[sev];
  return <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase ${c}`}>{sev}</span>;
}

// ── Step 1: Manager Control Centre ───────────────────────────────────────────

function MockupManagerControl() {
  return (
    <div className="bg-[#f8f6f2] p-3 text-[var(--cs-navy)] select-none">
      {/* Page header */}
      <div className="mb-2.5 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--cs-teal-strong)]">Manager Control Centre</p>
          <p className="text-sm font-bold text-[var(--cs-navy)]">Oak House · Tuesday</p>
        </div>
        <span className="rounded-lg bg-[var(--cs-navy)] px-2.5 py-1 text-[10px] font-bold text-white">Cara intelligence active</span>
      </div>

      {/* Attention banner */}
      <div className="mb-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2">
        <div className="flex items-center gap-1.5">
          <Bell className="h-3 w-3 text-red-600 shrink-0" />
          <span className="text-[11px] font-bold text-red-700">3 items need your attention now</span>
        </div>
        <div className="mt-1.5 space-y-1">
          {[
            { txt: "Alex W — missing episode 14 h unresolved", sev: "critical" as const },
            { txt: "Oversight outstanding — 3 incidents awaiting RM sign-off", sev: "high" as const },
            { txt: "Casey T — risk assessment overdue by 12 days", sev: "high" as const },
          ].map((a) => (
            <div key={a.txt} className="flex items-start gap-1.5">
              <SevDot sev={a.sev} />
              <span className="text-[10px] text-red-700 leading-tight">{a.txt}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Metric strip */}
      <div className="mb-2 grid grid-cols-4 gap-1.5">
        {[
          { label: "30d incidents", value: "14", colour: "text-red-600" },
          { label: "PI rate", value: "21%", colour: "text-amber-600" },
          { label: "Oversight %", value: "79%", colour: "text-amber-600" },
          { label: "Children", value: "4", colour: "text-[var(--cs-navy)]" },
        ].map((m) => (
          <div key={m.label} className="rounded-lg border border-[var(--cs-border)] bg-white p-2 text-center">
            <p className={`text-base font-extrabold tabular-nums ${m.colour}`}>{m.value}</p>
            <p className="text-[8px] leading-tight text-[var(--cs-text-muted)]">{m.label}</p>
          </div>
        ))}
      </div>

      {/* Two-col bottom */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-[var(--cs-border)] bg-white p-2.5">
          <p className="mb-1.5 text-[10px] font-bold text-[var(--cs-navy)] flex items-center gap-1"><Users className="h-3 w-3 text-[var(--cs-teal)]" /> Staff compliance</p>
          <div className="space-y-1">
            {[
              { name: "O. Hayes", ok: true }, { name: "M. Bell", ok: true },
              { name: "A. Carter", ok: false }, { name: "L. Singh", ok: true },
            ].map((s) => (
              <div key={s.name} className="flex items-center justify-between">
                <span className="text-[9px] text-[var(--cs-text-secondary)]">{s.name}</span>
                {s.ok ? <CheckCircle className="h-2.5 w-2.5 text-emerald-500" /> : <AlertTriangle className="h-2.5 w-2.5 text-amber-500" />}
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-[var(--cs-border)] bg-white p-2.5">
          <p className="mb-1.5 text-[10px] font-bold text-[var(--cs-navy)] flex items-center gap-1"><ClipboardCheck className="h-3 w-3 text-[var(--cs-teal)]" /> Oversight queue</p>
          <div className="space-y-1">
            {[
              { ref: "INC-042", yp: "Alex W", sev: "critical" as const },
              { ref: "INC-041", yp: "Casey T", sev: "high" as const },
              { ref: "INC-039", yp: "Jordan M", sev: "medium" as const },
            ].map((o) => (
              <div key={o.ref} className="flex items-center justify-between">
                <span className="text-[9px] text-[var(--cs-text-secondary)]">{o.ref} · {o.yp}</span>
                <SevBadge sev={o.sev} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Step 2: Priority Briefing ─────────────────────────────────────────────────

function MockupPriorityBriefing() {
  const items = [
    { sev: "critical" as const, src: "Safeguarding", title: "Alex W — CSE risk unreviewed", age: "6 h" },
    { sev: "high" as const, src: "Incidents", title: "Casey T — physical intervention, no oversight", age: "1 d" },
    { sev: "high" as const, src: "Supervision", title: "Marcus Bell — overdue 18 days", age: "18 d" },
    { sev: "high" as const, src: "Plan Currency", title: "Jordan M — care plan expired", age: "3 d" },
    { sev: "medium" as const, src: "Medication", title: "Casey T — PRN not recorded", age: "2 h" },
    { sev: "medium" as const, src: "Reg 44", title: "Visit due in 4 days — schedule now", age: "4 d" },
  ];
  return (
    <div className="bg-[#f8f6f2] p-3 select-none">
      <div className="mb-2.5 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--cs-teal-strong)]">Priority Briefing</p>
          <p className="text-sm font-bold text-[var(--cs-navy)]">What needs you · 6 signals</p>
        </div>
        <span className="text-[10px] text-[var(--cs-text-muted)]">~78 engines</span>
      </div>
      <div className="space-y-1.5">
        {items.map((it, i) => (
          <div key={i} className="flex items-center gap-2 rounded-xl border border-[var(--cs-border)] bg-white px-2.5 py-2">
            <SevDot sev={it.sev} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-semibold text-[var(--cs-navy)]">{it.title}</p>
              <p className="text-[9px] text-[var(--cs-text-muted)]">{it.src}</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <SevBadge sev={it.sev} />
              <span className="text-[9px] text-[var(--cs-text-muted)]">{it.age}</span>
              <ChevronRight className="h-3 w-3 text-[var(--cs-text-muted)]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Step 3: Shift Plan ────────────────────────────────────────────────────────

function MockupShiftPlan() {
  const running = [
    { time: "11:00", title: "Key-working session — Alex", kind: "Key-work" },
    { time: "14:30", title: "CAMHS appointment — Jordan", kind: "Appointment" },
    { time: "16:30", title: "Family time — Casey", kind: "Contact" },
  ];
  const mustDo = [
    { sev: "high" as const, title: "Overdue: Care plan — Alex W", detail: "Was due 3 days ago." },
    { sev: "medium" as const, title: "Due: Risk assessment review — Jordan", detail: "Due today." },
  ];
  return (
    <div className="bg-[#f8f6f2] p-3 select-none">
      {/* Staffing banner */}
      <div className="mb-2 flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2 text-emerald-800 border border-emerald-200">
        <div className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5 shrink-0" />
          <div>
            <p className="text-[11px] font-bold">2 on shift (minimum 2)</p>
            <p className="text-[9px] opacity-75">On shift: Olivia Hayes, Marcus Bell</p>
          </div>
        </div>
        <span className="text-[9px] font-bold bg-emerald-100 rounded-full px-2 py-0.5">Day · 08:00–20:00</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {/* Running order */}
        <div className="rounded-xl border border-[var(--cs-border)] bg-white p-2">
          <p className="mb-1.5 flex items-center gap-1 text-[10px] font-bold text-[var(--cs-navy)]"><Clock className="h-3 w-3 text-[var(--cs-teal)]" /> Running order</p>
          <div className="space-y-1.5">
            {running.map((r) => (
              <div key={r.title} className="flex items-start gap-1.5">
                <span className="w-8 shrink-0 text-[9px] font-semibold tabular-nums text-[var(--cs-text-muted)]">{r.time}</span>
                <div>
                  <p className="text-[10px] font-medium text-[var(--cs-navy)] leading-tight">{r.title}</p>
                  <p className="text-[8px] text-[var(--cs-text-muted)]">{r.kind}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Must-do */}
        <div className="space-y-1.5">
          <div className="rounded-xl border border-[var(--cs-border)] bg-white p-2">
            <p className="mb-1.5 flex items-center gap-1 text-[10px] font-bold text-[var(--cs-navy)]"><CheckCircle2 className="h-3 w-3 text-[var(--cs-navy)]" /> To complete</p>
            <div className="space-y-1">
              {mustDo.map((m) => (
                <div key={m.title} className={`rounded-lg border border-[var(--cs-border)] p-1.5 border-l-2 ${m.sev === "high" ? "border-l-orange-500" : "border-l-amber-400"}`}>
                  <p className="text-[9px] font-semibold text-[var(--cs-navy)] leading-tight">{m.title}</p>
                  <p className="text-[8px] text-[var(--cs-text-muted)]">{m.detail}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-[var(--cs-border)] bg-white p-2">
            <p className="mb-1 flex items-center gap-1 text-[10px] font-bold text-[var(--cs-navy)]"><Eye className="h-3 w-3 text-[var(--cs-teal)]" /> Medication</p>
            <p className="text-[9px] text-[var(--cs-text-secondary)]">3 regular medications to administer, 1 PRN available.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Step 4: Incident Mode + Practice Intelligence ─────────────────────────────

function MockupIncidentMode() {
  return (
    <div className="bg-[#f8f6f2] p-3 select-none">
      <div className="mb-2 flex items-center gap-2">
        <div className="rounded-lg bg-red-600 p-1.5"><Siren className="h-3.5 w-3.5 text-white" /></div>
        <div>
          <p className="text-xs font-bold text-[var(--cs-navy)]">Incident Mode — live session</p>
          <p className="text-[9px] text-[var(--cs-text-muted)]">Alex W · Peer conflict · Risk: HIGH</p>
        </div>
        <span className="ml-auto animate-pulse rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-bold text-red-600">● LIVE</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {/* Timeline */}
        <div className="rounded-xl border border-[var(--cs-border)] bg-white p-2">
          <p className="mb-1.5 text-[10px] font-bold text-[var(--cs-navy)]">Timeline</p>
          <div className="space-y-1.5">
            {[
              { t: "14:32", txt: "Conflict started in lounge, verbal escalation" },
              { t: "14:35", txt: "Staff intervened — de-escalation attempted" },
              { t: "14:41", txt: "Physical intervention required, safe hold used" },
              { t: "14:47", txt: "Alex calm, offered space in bedroom" },
            ].map((e) => (
              <div key={e.t} className="flex items-start gap-1.5">
                <span className="w-7 shrink-0 text-[8px] font-mono text-[var(--cs-text-muted)]">{e.t}</span>
                <span className="text-[9px] text-[var(--cs-text-secondary)] leading-tight">{e.txt}</span>
              </div>
            ))}
          </div>
        </div>

        {/* PACE panel */}
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-2">
          <div className="mb-1.5 flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-amber-600" />
            <span className="text-[10px] font-bold text-amber-800">PACE — practice intelligence</span>
          </div>
          <div className="space-y-1.5">
            <div>
              <p className="text-[9px] font-semibold text-amber-800">Curiosity</p>
              <p className="text-[9px] text-amber-700 leading-tight">What was Alex communicating? Peer conflict after family contact often signals unprocessed anxiety.</p>
            </div>
            <div>
              <p className="text-[9px] font-semibold text-amber-800">Acceptance</p>
              <p className="text-[9px] text-amber-700 leading-tight">Validate the feeling before addressing the behaviour.</p>
            </div>
            <div className="mt-2 rounded-lg bg-amber-100 border border-amber-200 px-2 py-1">
              <p className="text-[9px] font-bold text-amber-800">Cara advises · Staff decide · Manager reviews</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Step 5: Management Oversight Engine ──────────────────────────────────────

function MockupOversightEngine() {
  const scores = [
    { label: "Recording quality", val: 82, colour: "bg-emerald-500" },
    { label: "Child voice", val: 71, colour: "bg-teal-500" },
    { label: "Risk analysis", val: 65, colour: "bg-amber-400" },
    { label: "Safeguarding", val: 88, colour: "bg-emerald-500" },
    { label: "PACE alignment", val: 74, colour: "bg-teal-500" },
    { label: "Professional language", val: 91, colour: "bg-emerald-500" },
  ];
  return (
    <div className="bg-[#f8f6f2] p-3 select-none">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--cs-teal-strong)]">Management Oversight Engine</p>
          <p className="text-sm font-bold text-[var(--cs-navy)]">INC-042 · Alex W · Physical intervention</p>
        </div>
        <span className="rounded-lg bg-amber-100 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-700">Awaiting sign-off</span>
      </div>

      {/* 6-score grid */}
      <div className="mb-2 grid grid-cols-3 gap-1.5">
        {scores.map((s) => (
          <div key={s.label} className="rounded-lg border border-[var(--cs-border)] bg-white p-1.5">
            <p className="text-[8px] text-[var(--cs-text-muted)] leading-tight">{s.label}</p>
            <div className="mt-1 flex items-center gap-1">
              <div className="h-1 flex-1 rounded-full bg-slate-100 overflow-hidden">
                <div className={`h-full ${s.colour} rounded-full`} style={{ width: `${s.val}%` }} />
              </div>
              <span className="text-[9px] font-bold tabular-nums text-[var(--cs-navy)]">{s.val}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Reasoning panel */}
      <div className="rounded-xl border border-[var(--cs-teal-bg)] bg-[var(--cs-teal-bg)] p-2">
        <div className="mb-1 flex items-center gap-1">
          <Brain className="h-3 w-3 text-[var(--cs-teal-strong)]" />
          <span className="text-[10px] font-bold text-[var(--cs-teal-strong)]">Cara Reasoning — DefensibleDecision</span>
        </div>
        <p className="text-[9px] text-[var(--cs-text-secondary)] leading-tight">Evidence shows 3 peer conflicts in 10 days, 2 involving physical intervention. Pattern suggests the trigger is not the peer dynamic but transition from family contact. Recommendation: schedule strategy discussion before next contact session.</p>
        <div className="mt-1.5 flex items-center justify-between">
          <span className="text-[9px] font-medium text-[var(--cs-teal-strong)]">Confidence: Possible · Human review required</span>
          <button className="rounded-lg bg-[var(--cs-navy)] px-2 py-0.5 text-[9px] font-bold text-white">Sign off RM</button>
        </div>
      </div>
    </div>
  );
}

// ── Step 6: Writing Assistant ─────────────────────────────────────────────────

function MockupWritingAssistant() {
  return (
    <div className="bg-[#f8f6f2] p-3 select-none">
      <div className="mb-2 flex items-center gap-1.5">
        <PenLine className="h-3.5 w-3.5 text-[var(--cs-teal-strong)]" />
        <p className="text-[10px] font-bold text-[var(--cs-navy)]">Cara Writing Assistant — Daily log · Alex W</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {/* Text field */}
        <div className="rounded-xl border border-[var(--cs-border)] bg-white p-2.5">
          <p className="mb-2 text-[9px] font-bold text-[var(--cs-text-muted)] uppercase tracking-wide">Daily log</p>
          <p className="text-[10px] leading-relaxed text-[var(--cs-navy)]">
            Alex{" "}
            <span className="rounded bg-amber-100 px-0.5 border-b border-amber-400 text-amber-800">refused to engage</span>
            {" "}with the planned activity this afternoon. He was{" "}
            <span className="rounded bg-amber-100 px-0.5 border-b border-amber-400 text-amber-800">challenging</span>
            {" "}and staff found it{" "}
            <span className="rounded bg-blue-100 px-0.5 border-b border-blue-400 text-blue-800">difficult to manage</span>
            . He later{" "}
            <span className="rounded bg-amber-100 px-0.5 border-b border-amber-400 text-amber-800">returned safe and well</span>
            {" "}at 19:30 and settled well.
          </p>
        </div>

        {/* Issues panel */}
        <div className="rounded-xl border border-[var(--cs-border)] bg-white p-2">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[10px] font-bold text-[var(--cs-navy)]">Cara has noticed</p>
            <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-700">3 issues</span>
          </div>
          <div className="space-y-1.5">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-1.5">
              <p className="text-[9px] font-bold text-amber-800">Blame language</p>
              <p className="text-[9px] text-amber-700">"refused to engage" places fault — try "Alex found it hard to join the activity today"</p>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-1.5">
              <p className="text-[9px] font-bold text-amber-800">Institutional phrase</p>
              <p className="text-[9px] text-amber-700">"returned safe and well" — if Alex went missing, use MFC language; otherwise describe what actually happened</p>
            </div>
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-1.5">
              <p className="text-[9px] font-bold text-blue-700">Missing child voice</p>
              <p className="text-[9px] text-blue-700">Record what Alex said or expressed about the afternoon</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Step 7: Safeguarding Intelligence ────────────────────────────────────────

function MockupSafeguarding() {
  return (
    <div className="bg-[#f8f6f2] p-3 select-none">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--cs-teal-strong)]">Safeguarding</p>
          <p className="text-sm font-bold text-[var(--cs-navy)]">4 open concerns · 1 critical</p>
        </div>
        <button className="flex items-center gap-1 rounded-lg bg-violet-600 px-2.5 py-1 text-[10px] font-bold text-white">
          <Sparkles className="h-3 w-3" /> Cara Scan
        </button>
      </div>

      <div className="mb-2 space-y-1.5">
        {[
          { ref: "SAF-004", yp: "Alex W", type: "CSE concern", sev: "critical" as const, action: "MACE referral pending" },
          { ref: "SAF-003", yp: "Casey T", type: "Exploitation concern", sev: "high" as const, action: "NRM screen complete" },
          { ref: "SAF-002", yp: "Jordan M", type: "Online safety", sev: "medium" as const, action: "Safety plan in place" },
        ].map((c) => (
          <div key={c.ref} className="flex items-center gap-2 rounded-xl border border-[var(--cs-border)] bg-white px-2.5 py-1.5">
            <SevDot sev={c.sev} />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold text-[var(--cs-navy)]">{c.ref} · {c.yp} — {c.type}</p>
              <p className="text-[9px] text-[var(--cs-text-muted)]">{c.action}</p>
            </div>
            <SevBadge sev={c.sev} />
          </div>
        ))}
      </div>

      {/* Scan result strip */}
      <div className="rounded-xl border border-violet-200 bg-violet-50 p-2.5">
        <div className="flex items-center gap-1.5 mb-1.5">
          <Brain className="h-3 w-3 text-violet-700 shrink-0" />
          <span className="text-[10px] font-bold text-violet-800">Cara Safeguarding Scan — Overall risk: HIGH</span>
        </div>
        <p className="text-[9px] text-violet-700 leading-tight">CSE concern is affecting 2 young people — whole-home response indicated. Review strategy discussion outcomes. Consider NRM referral timeline.</p>
        <div className="mt-1.5 text-[9px] font-bold text-violet-700">Cara advises · humans decide</div>
      </div>
    </div>
  );
}

// ── Step 8: Direction of Travel ───────────────────────────────────────────────

function MockupDirectionOfTravel() {
  const metrics = [
    { label: "Incidents", weeks: [9, 11, 8, 7, 6, 5, 7, 5], dir: "decreasing", icon: <TrendingDown className="h-3 w-3 text-emerald-500" /> },
    { label: "Missing episodes", weeks: [3, 2, 4, 3, 2, 1, 1, 0], dir: "decreasing", icon: <TrendingDown className="h-3 w-3 text-emerald-500" /> },
    { label: "Physical interventions", weeks: [4, 3, 5, 4, 3, 4, 3, 2], dir: "stable", icon: <Minus className="h-3 w-3 text-blue-400" /> },
    { label: "Supervision complete", weeks: [70, 75, 80, 80, 85, 90, 88, 92], dir: "improving", icon: <TrendingUp className="h-3 w-3 text-emerald-500" /> },
  ];
  return (
    <div className="bg-[#f8f6f2] p-3 select-none">
      <div className="mb-2.5 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--cs-teal-strong)]">Direction of Travel</p>
          <p className="text-sm font-bold text-[var(--cs-navy)]">8-week view · Oak House</p>
        </div>
        <span className="text-[10px] text-[var(--cs-text-muted)]">Week ending today</span>
      </div>
      <div className="space-y-2">
        {metrics.map((m) => {
          const peak = Math.max(...m.weeks);
          return (
            <div key={m.label} className="rounded-xl border border-[var(--cs-border)] bg-white px-2.5 py-2">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-[10px] font-semibold text-[var(--cs-navy)]">{m.label}</span>
                <div className="flex items-center gap-1">
                  {m.icon}
                  <span className="text-[9px] text-[var(--cs-text-muted)] capitalize">{m.dir}</span>
                </div>
              </div>
              <div className="flex items-end gap-0.5 h-6">
                {m.weeks.map((v, i) => (
                  <div
                    key={i}
                    className={`flex-1 rounded-t-sm ${m.dir === "decreasing" ? "bg-emerald-400" : m.dir === "improving" ? "bg-teal-400" : "bg-slate-300"}`}
                    style={{ height: `${Math.round((v / peak) * 100)}%` }}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Steps config ──────────────────────────────────────────────────────────────

// ── Ask CARA (the dark immersive assistant, on every page) ───────────────────
function MockupAskCara() {
  return (
    <div className="select-none p-3" style={{ background: "radial-gradient(120% 90% at 100% -10%, rgba(99,102,241,0.20) 0%, transparent 52%), linear-gradient(180deg,#0a0f1f 0%,#0c1226 55%,#0e1730 100%)" }}>
      <div className="flex items-center gap-2">
        <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0" aria-hidden>
          <defs><linearGradient id="tour-spark" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#2dd4bf" /><stop offset="0.5" stopColor="#60a5fa" /><stop offset="1" stopColor="#a78bfa" /></linearGradient></defs>
          <path d="M12 0C13.4 6.9 17.1 10.6 24 12C17.1 13.4 13.4 17.1 12 24C10.6 17.1 6.9 13.4 0 12C6.9 10.6 10.6 6.9 12 0Z" fill="url(#tour-spark)" />
        </svg>
        <div>
          <p className="text-[11px] font-light text-slate-100">Hi Darren — ready when you are</p>
          <p className="text-[8px] text-slate-400">Answers from this home&rsquo;s records — never a guess</p>
        </div>
        <span className="ml-auto rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[7.5px] font-semibold text-slate-300">Deterministic</span>
      </div>

      <div className="mt-2.5 space-y-2">
        <div className="flex justify-end">
          <div className="max-w-[85%] rounded-2xl rounded-br-md bg-indigo-500/90 px-2.5 py-1.5 text-[9px] leading-snug text-white">What&rsquo;s overdue across the home right now?</div>
        </div>
        <div className="flex gap-1.5">
          <svg viewBox="0 0 24 24" className="mt-0.5 h-3 w-3 shrink-0" aria-hidden>
            <defs><linearGradient id="tour-spark2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#2dd4bf" /><stop offset="0.5" stopColor="#60a5fa" /><stop offset="1" stopColor="#a78bfa" /></linearGradient></defs>
            <path d="M12 0C13.4 6.9 17.1 10.6 24 12C17.1 13.4 13.4 17.1 12 24C10.6 17.1 6.9 13.4 0 12C6.9 10.6 10.6 6.9 12 0Z" fill="url(#tour-spark2)" />
          </svg>
          <div className="min-w-0">
            <p className="text-[9px] leading-relaxed text-slate-200">Three things need you today: <b className="text-white">Alex&rsquo;s restraint (5 Jul) has no debrief</b>, a <b className="text-white">return interview is missing</b> for Jordan, and <b className="text-white">Ellie&rsquo;s LAC review</b> is due in 6 days. Two daily logs await your oversight.</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {["Incidents · 1", "Missing · 1", "Reviews · 1", "Oversight · 2"].map((s) => (
                <span key={s} className="rounded-full bg-white/[0.08] px-1.5 py-0.5 text-[7.5px] text-slate-300">{s}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2.5 flex items-center gap-1 rounded-full border border-white/10 bg-[#161b2b] px-1.5 py-1">
        <span className="flex h-5 w-5 items-center justify-center rounded-full text-[11px] text-slate-400">+</span>
        <span className="flex-1 px-0.5 text-[9px] text-slate-500">Ask CARA…</span>
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500 text-[10px] font-bold text-white">↑</span>
      </div>
      <p className="mt-1.5 text-center text-[7.5px] text-slate-500">From live records · never a safeguarding decision</p>
    </div>
  );
}

const STEPS = [
  {
    Icon: LayoutDashboard,
    eyebrow: "Manager Control Centre",
    href: "/dashboard/manager-control-centre",
    title: "Your whole home, the moment you open Cara.",
    body: "A calm, ranked picture of the home — the alerts that matter, Cara's read on what needs you today, staff compliance, incident patterns and the oversight queue, all on one screen.",
    points: ["Attention items ranked by severity", "Incident analytics computed from real records", "Staff compliance + oversight queue at a glance"],
    Mockup: MockupManagerControl,
  },
  {
    Icon: Sparkles,
    eyebrow: "Ask CARA",
    href: "/ask-cara",
    title: "Just ask — CARA answers from your records.",
    body: "A governed assistant on every page. Ask anything about the home, a child or your team — “what’s overdue?”, “what should I do after this incident?” — and CARA answers instantly from your live records, with the sources shown. Deterministic, so it works even with no AI available; it never invents a fact and never decides safeguarding. It’s also the sanctioned alternative to staff pasting sensitive information into public chatbots.",
    points: ["Answers from records — sources shown, never a guess", "Deterministic: keeps working with no AI credit", "No child data leaves the platform; every ask is logged"],
    Mockup: MockupAskCara,
  },
  {
    Icon: Radar,
    eyebrow: "Priority Briefing",
    href: "/priority-briefing",
    title: "Every engine. One ranked feed.",
    body: "One feed pulls the most important signals from across every engine — incidents, safeguarding, supervision, plan currency, medication — ranked by severity, deep-linked straight to where you act.",
    points: ["Critical → watch, in order", "Pulled from ~78 engines across the whole system", "Click a signal, act on it immediately"],
    Mockup: MockupPriorityBriefing,
  },
  {
    Icon: CalendarCheck2,
    eyebrow: "Shift Plan",
    href: "/shift-plan",
    title: "Your shift, planned before you arrive.",
    body: "Open Cara before you come on duty: who's rostered, every appointment and key-working session in your shift window, what must be completed today, and the medication picture — with per-child watch-points from recent incidents.",
    points: ["Running order: timed appointments + all-day events", "Must-do: overdue + due-today tasks, ranked", "Per-child watch-points from recent records"],
    Mockup: MockupShiftPlan,
  },
  {
    Icon: Siren,
    eyebrow: "Incident Mode",
    href: "/cara/incident-mode",
    title: "Live support while it's happening.",
    body: "When things escalate, open a live session. PACE-informed prompts help you stay regulated while you record; the timestamped timeline captures the sequence; and a DefensibleDecision-ready draft is held for manager review at the end.",
    points: ["Guided start: who, what, risk level", "PACE practice intelligence inline — not a separate page", "Draft record held for RM oversight and sign-off"],
    Mockup: MockupIncidentMode,
  },
  {
    Icon: ClipboardCheck,
    eyebrow: "Management Oversight Engine",
    href: "/workforce/oversight-workflow",
    title: "Oversight that reasons with you.",
    body: "Cara doesn't just prompt for oversight — it brings the reasoning to you. Six quality scores, a DefensibleDecision summary of patterns and risk, and a structured sign-off flow. Evidence-grade oversight at the point of practice.",
    points: ["6 quality scores: recording, child voice, risk, safeguarding, PACE, language", "Reasoning engine surfaces patterns and escalation signals", "Role-gated sign-off persisted back to the record"],
    Mockup: MockupOversightEngine,
  },
  {
    Icon: PenLine,
    eyebrow: "Writing Assistant",
    href: "/incidents",
    title: "A critical friend in every field.",
    body: `Cara reads what you’re writing as you record — flagging blame language (“refused to engage”), institutional phrases (“returned safe and well”), missing child voice, and writing-to-the-child opportunities. It suggests; you decide; nothing is auto-changed.`,
    points: ["Inline issues panel: vague, blame, slang, institutional phrases", "Child-voice check on every record type", "Score + reflective questions, not just corrections"],
    Mockup: MockupWritingAssistant,
  },
  {
    Icon: ShieldCheck,
    eyebrow: "Safeguarding Intelligence",
    href: "/safeguarding",
    title: "Patterns before they become crises.",
    body: "Open safeguarding concerns ranked by severity, with Contextual Safeguarding and NRM frameworks built in. The Cara Safeguarding Scan reads across all open concerns, surfaces cross-child patterns, and recommends escalation steps — deterministically, no AI key required.",
    points: ["Concerns ranked by severity + oversight status", "Cara Scan: themes, cross-YP patterns, recommended actions", "NRM and contextual safeguarding frameworks built in"],
    Mockup: MockupSafeguarding,
  },
  {
    Icon: LineChart,
    eyebrow: "Direction of Travel",
    href: "/home-trends",
    title: "Are things getting better or worse?",
    body: "The longitudinal view inspectors look for — home-wide and per-child trends across incidents, missing episodes, physical interventions, supervision and more, with the direction called out honestly and the 8-week pattern visible at a glance.",
    points: ["8-week trend per metric, per child or home-wide", "Polarity-aware direction: improving, worsening, stable", "Honest about regression — not just what to celebrate"],
    Mockup: MockupDirectionOfTravel,
  },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TourPage() {
  return (
    <div className="min-h-screen bg-[var(--cs-bg)] text-[var(--cs-text)]">
      <ScrollProgress />
      <MarketingHeader />

      <MarketingPageHero
        eyebrow="Product tour"
        title={<>See Cara</>}
        titleAccent={<>think.</>}
        lede={
          <>
            Live screens from the demo platform — running on a fictional home&rsquo;s data. Every mockup is a
            real page; click any one to step straight into it.
          </>
        }
        footnote={<>Demo data — a fictional home, fictional people. No real child or staff information.</>}
        field
      >
        <HeroGoldCta href="/dashboard/manager-control-centre">Open the live demo <ArrowRight className="h-4 w-4" /></HeroGoldCta>
        <HeroGlassCta href="/contact">Book a walkthrough</HeroGlassCta>
      </MarketingPageHero>

      {/* Feature strip */}
      <div className="mx-auto max-w-5xl px-5 pb-10">
        <div className="-mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 rounded-2xl border border-[var(--cs-border)] bg-white px-6 py-4 shadow-[var(--cs-shadow-card)]">
          {[
            { Icon: Sparkles, label: "Ask CARA" },
            { Icon: Brain, label: "Practice Intelligence" },
            { Icon: PenLine, label: "Cara Writing Assistant" },
            { Icon: Shield, label: "Safeguarding Engine" },
            { Icon: Target, label: "PACE Framework" },
            { Icon: Zap, label: "DefensibleDecision" },
            { Icon: Users, label: "Workforce Cockpit" },
          ].map(({ Icon, label }) => (
            <div key={label} className="flex items-center gap-1.5 text-[var(--cs-text-secondary)]">
              <Icon className="h-3.5 w-3.5 text-[var(--cs-teal-strong)]" />
              <span className="text-xs font-medium">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Steps */}
      <section className="mx-auto max-w-7xl px-5 pb-8">
        <div className="space-y-16 lg:space-y-24">
          {STEPS.map((s, i) => {
            const flip = i % 2 === 1;
            return (
              <div key={s.href} className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
                <Reveal className={flip ? "lg:order-2" : ""}>
                  <div className="flex items-center gap-3">
                    <span className="mk-display text-4xl leading-none text-[var(--cs-cara-gold)]/60">{String(i + 1).padStart(2, "0")}</span>
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--cs-teal-bg)] text-[var(--cs-teal-strong)]">
                      <s.Icon className="h-5 w-5" />
                    </span>
                    <span className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--cs-teal-strong)]">{s.eyebrow}</span>
                  </div>
                  <h2 className="mk-display mt-4 text-3xl text-[var(--cs-navy)] sm:text-4xl">{s.title}</h2>
                  <p className="mt-3 text-base leading-relaxed text-[var(--cs-text-secondary)]">{s.body}</p>
                  <ul className="mt-5 space-y-2">
                    {s.points.map((p, j) => (
                      <li key={j} className="flex items-start gap-2.5 text-sm font-medium text-[var(--cs-text)]">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--cs-teal)]" /> {p}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={s.href}
                    className="mt-6 inline-flex items-center gap-1.5 text-sm font-bold text-[var(--cs-navy)] transition-colors hover:text-[var(--cs-cara-gold)]"
                  >
                    Open {s.eyebrow} in the platform <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </Reveal>
                <Reveal delay={140} scale className={flip ? "lg:order-1" : ""}>
                  <TiltCard max={5} className="rounded-2xl">
                    <MockupFrame href={s.href} url={s.href}>
                      <s.Mockup />
                    </MockupFrame>
                  </TiltCard>
                </Reveal>
              </div>
            );
          })}
        </div>
      </section>

      {/* Finale — back into the night */}
      <section className="mk-midnight relative mt-8 overflow-hidden">
        <HeroField className="pointer-events-none absolute inset-0 h-full w-full opacity-35" />
        <div className="relative mx-auto max-w-4xl px-5 py-24 text-center">
          <Reveal>
            <h2 className="mk-display text-4xl text-white sm:text-5xl">That&rsquo;s the tour. <span className="mk-display-it mk-aurora-text">Now try it yourself.</span></h2>
            <p className="mx-auto mt-5 max-w-xl text-lg text-slate-300/90">
              Step into the live demo and click around, or book a walkthrough on your own home&rsquo;s data.
            </p>
          </Reveal>
          <Reveal delay={130} className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <HeroGoldCta href="/dashboard/manager-control-centre">Open the live demo <ArrowRight className="h-4 w-4" /></HeroGoldCta>
            <HeroGlassCta href="/contact">Book a walkthrough</HeroGlassCta>
          </Reveal>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}

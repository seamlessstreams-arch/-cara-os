"use client";

// ══════════════════════════════════════════════════════════════════════════════
// Cara STUDIO — DECISION SUPPORT
//
// Structured decision trees: what's known, unknown, the options, risks,
// pros/cons. Helps managers make evidence-informed decisions with Cara
// surfacing the relevant context and flagging what's missing.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Scale, CheckCircle2, AlertTriangle, HelpCircle,
  Sparkles, Eye, Target, ThumbsUp, ThumbsDown,
  Clock, ArrowRight,
} from "lucide-react";
import { demoSeed } from "@/lib/demo/demo-seed";

// ── Types ───────────────────────────────────────────────────────────────────

interface DecisionOption {
  label: string;
  pros: string[];
  cons: string[];
  riskLevel: "low" | "medium" | "high";
}

interface DecisionRecord {
  id: string;
  title: string;
  childName: string | null;
  status: "open" | "decided" | "review";
  createdAt: string;
  decidedAt: string | null;
  decisionMade: string | null;
  knownFacts: string[];
  unknowns: string[];
  risks: string[];
  options: DecisionOption[];
}

// ── Demo data ───────────────────────────────────────────────────────────────

const DEMO_DECISIONS: DecisionRecord[] = [
  {
    id: "dec-1", title: "Placement Move — Amara", childName: "Amara",
    status: "open", createdAt: "2026-05-10T09:00:00Z", decidedAt: null, decisionMade: null,
    knownFacts: [
      "Current placement has been stable for 8 months",
      "Amara has built a strong relationship with key worker Sarah",
      "School attendance has improved to 92%",
      "Potential placement closer to extended family in Birmingham",
    ],
    unknowns: [
      "Whether new placement has availability",
      "School provision quality in new area",
      "Whether Amara wants to move closer to family",
      "Impact of another placement move on attachment",
    ],
    risks: [
      "Disruption to recently stabilised placement",
      "Loss of therapeutic relationship with current key worker",
      "Potential regression in school attendance",
      "But: continued distance from family network also carries risk",
    ],
    options: [
      {
        label: "Remain in current placement",
        pros: ["Stability maintained", "Key worker relationship preserved", "Good school attendance"],
        cons: ["Distance from family", "Cultural needs harder to meet"],
        riskLevel: "low",
      },
      {
        label: "Move to Birmingham placement",
        pros: ["Closer to family", "Cultural community access", "Potentially stronger identity support"],
        cons: ["Another placement move", "Loss of key worker bond", "Unknown school quality", "Transition period risk"],
        riskLevel: "high",
      },
      {
        label: "Explore increased family contact first",
        pros: ["Tests family relationship without disruption", "Maintains stability", "Gives time for proper assessment"],
        cons: ["May not fully address distance issue", "Takes time"],
        riskLevel: "low",
      },
    ],
  },
  {
    id: "dec-2", title: "De-escalation Approach — Reuben", childName: "Reuben",
    status: "decided", createdAt: "2026-05-08T14:00:00Z", decidedAt: "2026-05-09T10:00:00Z",
    decisionMade: "Implement 'phone call protocol' with structured support before, during, and after family calls. Review after 2 weeks.",
    knownFacts: [
      "Three incidents of dysregulation following phone calls in the past month",
      "Reuben's relationship with dad is complex — positive but emotionally intense",
      "Reuben responds well to predictable routines",
    ],
    unknowns: [
      "Whether dad is aware of the impact of certain topics",
      "Whether Reuben would prefer shorter, more frequent calls",
    ],
    risks: ["Continued dysregulation without intervention", "Risk of property damage", "Risk to staff safety"],
    options: [
      { label: "Structured phone call protocol", pros: ["Proactive support", "Predictable routine", "Maintains contact"], cons: ["Takes staff time", "May feel controlling to Reuben"], riskLevel: "low" },
      { label: "Reduce call frequency", pros: ["Fewer trigger moments"], cons: ["Reduces family contact", "May feel punitive"], riskLevel: "medium" },
    ],
  },
];

const RISK_STYLES: Record<string, string> = {
  low: "bg-emerald-50 text-emerald-700 border-emerald-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  high: "bg-red-50 text-red-700 border-red-200",
};

// ══════════════════════════════════════════════════════════════════════════════

export default function DecisionSupportPage() {
  const [decisions] = useState<DecisionRecord[]>(demoSeed(DEMO_DECISIONS));
  const [selectedId, setSelectedId] = useState<string>(demoSeed(DEMO_DECISIONS)[0]?.id ?? "");

  const current = decisions.find((d) => d.id === selectedId);

  return (
    <PageShell title="Decision Support" subtitle="Evidence-informed decision frameworks">
      <div className="space-y-6 pb-12">

        <div className="rounded-2xl border border-[var(--cs-cara-gold-soft)] bg-gradient-to-r from-[var(--cs-cara-gold-bg)] to-white p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--cs-navy)]">
              <Scale className="h-5 w-5 text-[var(--cs-cara-gold)]" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-bold text-[var(--cs-navy)]">Decision Support</h2>
              <p className="text-xs text-[var(--cs-text-secondary)] mt-0.5">
                Structured decision frameworks: known facts, unknowns, risks, and options with pros and cons. Cara surfaces the evidence — humans decide.
              </p>
            </div>
          </div>
        </div>

        {/* ── Decision selector ────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-2">
          {decisions.map((d) => (
            <button key={d.id} onClick={() => setSelectedId(d.id)}
              className={cn("inline-flex items-center gap-2 rounded-lg border px-3 py-2 transition-all",
                selectedId === d.id ? "border-[var(--cs-cara-gold)] bg-[var(--cs-cara-gold-bg)] ring-1 ring-[var(--cs-cara-gold-soft)]" : "border-[var(--cs-border)] bg-white hover:border-[var(--cs-cara-gold-soft)]")}>
              <Scale className={cn("h-4 w-4", selectedId === d.id ? "text-[var(--cs-cara-gold)]" : "text-[var(--cs-text-muted)]")} />
              <span className="text-xs font-medium text-[var(--cs-navy)]">{d.title}</span>
              <Badge className={cn("text-[9px] border", d.status === "decided" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : d.status === "open" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-blue-50 text-blue-600 border-blue-200")}>
                {d.status}
              </Badge>
            </button>
          ))}
        </div>

        {current && (
          <>
            {/* ── Decision made banner ──────────────────────────────────────── */}
            {current.decisionMade && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-800">Decision Made</p>
                    <p className="text-xs text-emerald-700 mt-1 leading-relaxed">{current.decisionMade}</p>
                    {current.decidedAt && (
                      <p className="text-[10px] text-emerald-600 mt-1">{new Date(current.decidedAt).toLocaleDateString("en-GB")}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── Known / Unknown / Risks ──────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-xl border border-emerald-200 bg-white overflow-hidden">
                <div className="px-4 py-2.5 bg-emerald-50 border-b border-emerald-200 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs font-semibold text-emerald-800">Known Facts</span>
                </div>
                <div className="p-4 space-y-2">
                  {current.knownFacts.map((f, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <p className="text-xs text-[var(--cs-text-secondary)] leading-relaxed">{f}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-amber-200 bg-white overflow-hidden">
                <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-200 flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-amber-600" />
                  <span className="text-xs font-semibold text-amber-800">Unknowns</span>
                </div>
                <div className="p-4 space-y-2">
                  {current.unknowns.map((u, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                      <p className="text-xs text-[var(--cs-text-secondary)] leading-relaxed">{u}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-red-200 bg-white overflow-hidden">
                <div className="px-4 py-2.5 bg-red-50 border-b border-red-200 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-xs font-semibold text-red-800">Risks</span>
                </div>
                <div className="p-4 space-y-2">
                  {current.risks.map((r, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                      <p className="text-xs text-[var(--cs-text-secondary)] leading-relaxed">{r}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Options with pros/cons ────────────────────────────────────── */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-[var(--cs-navy)] uppercase tracking-wide">Options</h3>
              {current.options.map((opt, i) => (
                <div key={i} className="rounded-xl border border-[var(--cs-border)] bg-white p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--cs-navy)] text-white text-[10px] font-bold">{i + 1}</span>
                    <span className="text-sm font-semibold text-[var(--cs-navy)]">{opt.label}</span>
                    <Badge className={cn("text-[9px] border", RISK_STYLES[opt.riskLevel])}>Risk: {opt.riskLevel}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wide mb-1.5 flex items-center gap-1"><ThumbsUp className="h-3 w-3" />Pros</p>
                      {opt.pros.map((p, j) => (
                        <div key={j} className="flex items-start gap-1.5 mb-1">
                          <CheckCircle2 className="h-3 w-3 text-emerald-500 mt-0.5 shrink-0" />
                          <span className="text-xs text-[var(--cs-text-secondary)]">{p}</span>
                        </div>
                      ))}
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-red-700 uppercase tracking-wide mb-1.5 flex items-center gap-1"><ThumbsDown className="h-3 w-3" />Cons</p>
                      {opt.cons.map((c, j) => (
                        <div key={j} className="flex items-start gap-1.5 mb-1">
                          <AlertTriangle className="h-3 w-3 text-red-400 mt-0.5 shrink-0" />
                          <span className="text-xs text-[var(--cs-text-secondary)]">{c}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </PageShell>
  );
}

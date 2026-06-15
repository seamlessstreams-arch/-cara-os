"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — Oversight score bar: risk + outcome + the six 0–100 assurance scores.
// One status pill per concept; calm hairline rows; navy text on white. No colour-
// only meaning (every pill carries a label).
// ══════════════════════════════════════════════════════════════════════════════

import React from "react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { OversightResult, RiskLevel, OversightOutcome } from "@/lib/oversight/types";

const RISK_STYLE: Record<RiskLevel, { label: string; cls: string }> = {
  low: { label: "Low risk", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  medium: { label: "Medium risk", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  high: { label: "High risk", cls: "bg-orange-50 text-orange-700 border-orange-200" },
  critical: { label: "Critical risk", cls: "bg-red-50 text-red-700 border-red-200" },
};

const OUTCOME_STYLE: Record<OversightOutcome, { label: string; cls: string }> = {
  satisfactory: { label: "Satisfactory", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  requires_clarification: { label: "Requires clarification", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  requires_action: { label: "Requires action", cls: "bg-orange-50 text-orange-700 border-orange-200" },
  requires_escalation: { label: "Requires escalation", cls: "bg-red-50 text-red-700 border-red-200" },
  senior_review_required: { label: "Senior review required", cls: "bg-red-50 text-red-700 border-red-200" },
};

function scoreColor(v: number): string {
  if (v >= 80) return "bg-emerald-500";
  if (v >= 60) return "bg-amber-500";
  return "bg-red-500";
}

function Pill({ label, cls }: { label: string; cls: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", cls)}>
      {label}
    </span>
  );
}

function ScoreRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="w-40 shrink-0 text-sm text-[var(--cs-text-muted)]">{label}</span>
      <Progress value={value} color={scoreColor(value)} className="flex-1" />
      <span className="w-12 shrink-0 text-right text-sm font-medium tabular-nums text-[var(--cs-navy)]">{value}</span>
    </div>
  );
}

export function OversightScoreBar({ result }: { result: OversightResult }) {
  const scores: Array<[string, number]> = [
    ["Evidence quality", result.evidenceQualityScore],
    ["Workflow completion", result.workflowScore],
    ["Plan adherence", result.planAdherenceScore],
    ["Practice response", result.practiceResponseScore],
    ["Referral completion", result.referralCompletionScore],
    ["Policy compliance", result.policyComplianceScore],
  ];
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Pill {...RISK_STYLE[result.riskLevel]} />
        <Pill {...OUTCOME_STYLE[result.oversightOutcome]} />
        {result.escalationRequired && (
          <Pill label="Escalation required" cls="bg-red-50 text-red-700 border-red-200" />
        )}
        {result.apiCallRecommended && (
          <Pill label="Enhanced AI drafting suggested" cls="bg-sky-50 text-sky-700 border-sky-200" />
        )}
      </div>
      <div className="divide-y divide-[var(--cs-border-subtle)]">
        {scores.map(([label, value]) => (
          <ScoreRow key={label} label={label} value={value} />
        ))}
      </div>
    </div>
  );
}

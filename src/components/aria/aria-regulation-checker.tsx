// ══════════════════════════════════════════════════════════════════════════════
// AriaRegulationChecker — Real-time regulation compliance dashboard
//
// Tracks compliance status against the key Children's Homes Regulations 2015.
// Shows which regulations are fully evidenced, partially evidenced, or have
// gaps. ARIA analyses the evidence base and identifies where action is needed.
// ══════════════════════════════════════════════════════════════════════════════

"use client";

import React, { useState } from "react";
import {
  Sparkles, CheckCircle2, AlertCircle, XCircle,
  ChevronDown, ChevronUp, Shield, Scale,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

type ComplianceStatus = "compliant" | "partially_compliant" | "non_compliant" | "not_assessed";

interface RegulationEntry {
  id: string;
  number: string;
  title: string;
  description: string;
  status: ComplianceStatus;
  evidenceCount: number;
  lastEvidenced: string;
  gaps: string[];
  ariaSuggestion?: string;
}

// ── Config ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ComplianceStatus, { label: string; colour: string; bg: string; icon: React.ReactNode }> = {
  compliant:            { label: "Compliant",     colour: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> },
  partially_compliant:  { label: "Partial",       colour: "text-amber-700",   bg: "bg-amber-50 border-amber-200",     icon: <AlertCircle className="h-3.5 w-3.5 text-amber-500" /> },
  non_compliant:        { label: "Non-Compliant", colour: "text-red-700",     bg: "bg-red-50 border-red-200",         icon: <XCircle className="h-3.5 w-3.5 text-red-500" /> },
  not_assessed:         { label: "Not Assessed",  colour: "text-slate-500",   bg: "bg-slate-50 border-slate-200",     icon: <AlertCircle className="h-3.5 w-3.5 text-slate-400" /> },
};

// ── Demo data ────────────────────────────────────────────────────────────────

function getDemoRegulations(): RegulationEntry[] {
  return [
    {
      id: "reg_05", number: "Reg 5", title: "Quality and purpose of care standard",
      description: "The quality and purpose of care standard ensures that children receive care designed to meet needs and protect them.",
      status: "compliant", evidenceCount: 24, lastEvidenced: "2026-05-12", gaps: [],
    },
    {
      id: "reg_06", number: "Reg 6", title: "Children's views, wishes and feelings standard",
      description: "Children must be enabled to express views, wishes and feelings about their care.",
      status: "partially_compliant", evidenceCount: 18, lastEvidenced: "2026-05-10",
      gaps: ["1 child without key work session in 28 days", "Wishes and feelings forms overdue for 2 children"],
      ariaSuggestion: "Schedule key work session for Jordan M and update wishes-and-feelings records.",
    },
    {
      id: "reg_07", number: "Reg 7", title: "Education standard",
      description: "Children must be helped to achieve their education potential.",
      status: "compliant", evidenceCount: 31, lastEvidenced: "2026-05-11", gaps: [],
    },
    {
      id: "reg_08", number: "Reg 8", title: "Enjoyment and achievement standard",
      description: "Children must have opportunities to participate in activities and develop their talents.",
      status: "compliant", evidenceCount: 15, lastEvidenced: "2026-05-09", gaps: [],
    },
    {
      id: "reg_09", number: "Reg 9", title: "Health and wellbeing standard",
      description: "Children must receive appropriate healthcare and have their emotional wellbeing supported.",
      status: "partially_compliant", evidenceCount: 22, lastEvidenced: "2026-05-11",
      gaps: ["CAMHS referral pending for 1 child", "Annual dental check overdue for 1 child"],
      ariaSuggestion: "Chase CAMHS referral for Riley P and book dental appointment for Casey T.",
    },
    {
      id: "reg_10", number: "Reg 10", title: "Positive relationships standard",
      description: "Children must be helped to develop and maintain positive relationships.",
      status: "compliant", evidenceCount: 20, lastEvidenced: "2026-05-12", gaps: [],
    },
    {
      id: "reg_11", number: "Reg 11", title: "Protection of children standard",
      description: "Children must be protected from harm and enabled to keep themselves safe.",
      status: "compliant", evidenceCount: 28, lastEvidenced: "2026-05-12", gaps: [],
    },
    {
      id: "reg_12", number: "Reg 12", title: "The protection of children standard",
      description: "Ensure children are protected from significant harm through effective safeguarding practices.",
      status: "partially_compliant", evidenceCount: 19, lastEvidenced: "2026-05-10",
      gaps: ["1 risk assessment review overdue"],
      ariaSuggestion: "Complete risk assessment review for Alex W — triggered by recent incident pattern.",
    },
    {
      id: "reg_13", number: "Reg 13", title: "Leadership and management standard",
      description: "The registered person must ensure effective leadership and management.",
      status: "compliant", evidenceCount: 16, lastEvidenced: "2026-05-12", gaps: [],
    },
    {
      id: "reg_14", number: "Reg 14", title: "Care planning standard",
      description: "Children must have a care plan that sets out how their needs will be met.",
      status: "compliant", evidenceCount: 12, lastEvidenced: "2026-05-08", gaps: [],
    },
    {
      id: "reg_33", number: "Reg 33", title: "Employment of staff",
      description: "Sufficient, suitably qualified, and competent staff must be deployed.",
      status: "partially_compliant", evidenceCount: 14, lastEvidenced: "2026-05-11",
      gaps: ["1 supervision overdue beyond 4-week cycle", "1 staff member below 80% training compliance"],
      ariaSuggestion: "Schedule supervision for Jordan P and review training plan.",
    },
    {
      id: "reg_34", number: "Reg 34", title: "Staff supervision and appraisal",
      description: "All staff must receive regular supervision and annual appraisal.",
      status: "partially_compliant", evidenceCount: 11, lastEvidenced: "2026-05-11",
      gaps: ["1 supervision overdue"],
    },
    {
      id: "reg_35", number: "Reg 35", title: "Restraint and deprivation of liberty",
      description: "Restraint must only be used where necessary and recorded fully.",
      status: "compliant", evidenceCount: 8, lastEvidenced: "2026-05-10", gaps: [],
    },
    {
      id: "reg_40", number: "Reg 40", title: "Notification of significant events",
      description: "Significant events must be notified to the appropriate bodies.",
      status: "partially_compliant", evidenceCount: 14, lastEvidenced: "2026-05-12",
      gaps: ["3 incidents awaiting management oversight"],
      ariaSuggestion: "Complete management oversight for outstanding incidents within 24 hours.",
    },
    {
      id: "reg_45", number: "Reg 45", title: "Review of quality of care",
      description: "Monthly quality of care review covering all 9 subsections.",
      status: "compliant", evidenceCount: 9, lastEvidenced: "2026-05-01", gaps: [],
    },
  ];
}

// ── Component ────────────────────────────────────────────────────────────────

export function AriaRegulationChecker() {
  const [showGapsOnly, setShowGapsOnly] = useState(false);
  const [expandedReg, setExpandedReg] = useState<string | null>(null);
  const regulations = getDemoRegulations();

  const displayed = showGapsOnly
    ? regulations.filter((r) => r.status !== "compliant")
    : regulations;

  const compliantCount = regulations.filter((r) => r.status === "compliant").length;
  const partialCount = regulations.filter((r) => r.status === "partially_compliant").length;
  const nonCompliantCount = regulations.filter((r) => r.status === "non_compliant").length;
  const totalGaps = regulations.reduce((sum, r) => sum + r.gaps.length, 0);
  const complianceRate = Math.round((compliantCount / regulations.length) * 100);

  return (
    <div className="rounded-2xl border border-[var(--cs-border)] bg-white overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[var(--cs-border)] bg-gradient-to-r from-[var(--cs-aria-gold-bg)] to-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[var(--cs-aria-gold-soft)] rounded-lg">
              <Sparkles className="h-4 w-4 text-[var(--cs-aria-gold)]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--cs-navy)]">Regulation Compliance Checker</h3>
              <p className="text-[10px] text-[var(--cs-text-muted)]">Children's Homes Regulations 2015 — live status</p>
            </div>
          </div>
          <div className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${complianceRate >= 80 ? "bg-emerald-50 text-emerald-700 border-emerald-200" : complianceRate >= 60 ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-red-50 text-red-700 border-red-200"}`}>
            {complianceRate}% Compliant
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-4 divide-x divide-[var(--cs-border)] border-b border-[var(--cs-border)]">
        {[
          { label: "Compliant",     value: compliantCount,    colour: "text-emerald-600" },
          { label: "Partial",       value: partialCount,      colour: partialCount > 0 ? "text-amber-600" : "text-emerald-600" },
          { label: "Non-Compliant", value: nonCompliantCount, colour: nonCompliantCount > 0 ? "text-red-600" : "text-emerald-600" },
          { label: "Total Gaps",    value: totalGaps,         colour: totalGaps > 0 ? "text-amber-600" : "text-emerald-600" },
        ].map((s) => (
          <div key={s.label} className="px-3 py-2.5 text-center">
            <div className={`text-lg font-bold tabular-nums ${s.colour}`}>{s.value}</div>
            <div className="text-[10px] text-[var(--cs-text-muted)]">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter toggle */}
      <div className="px-4 py-2 border-b border-[var(--cs-border)] flex items-center gap-2">
        <button
          className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-colors ${!showGapsOnly ? "bg-[var(--cs-navy)] text-white" : "bg-slate-100 text-[var(--cs-text-secondary)] hover:bg-slate-200"}`}
          onClick={() => setShowGapsOnly(false)}
        >
          All ({regulations.length})
        </button>
        <button
          className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-colors ${showGapsOnly ? "bg-amber-500 text-white" : "bg-slate-100 text-[var(--cs-text-secondary)] hover:bg-slate-200"}`}
          onClick={() => setShowGapsOnly(true)}
        >
          Gaps Only ({regulations.length - compliantCount})
        </button>
      </div>

      {/* Regulation list */}
      <div className="divide-y divide-[var(--cs-border)]">
        {displayed.map((reg) => {
          const cfg = STATUS_CONFIG[reg.status];
          const isOpen = expandedReg === reg.id;

          return (
            <div key={reg.id}>
              <button
                className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-slate-50/50 transition-colors"
                onClick={() => setExpandedReg(isOpen ? null : reg.id)}
              >
                {cfg.icon}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[var(--cs-navy)]">{reg.number}</span>
                    <span className="text-xs text-[var(--cs-text-secondary)] truncate">{reg.title}</span>
                  </div>
                </div>
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium border ${cfg.bg} ${cfg.colour}`}>
                  {cfg.label}
                </span>
                <span className="text-[var(--cs-text-muted)] shrink-0">
                  {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </span>
              </button>

              {isOpen && (
                <div className="px-4 pb-3 pl-11 space-y-2 animate-fade-in">
                  <p className="text-[11px] text-[var(--cs-text-muted)]">{reg.description}</p>

                  <div className="flex items-center gap-3 text-[10px] text-[var(--cs-text-gentle)]">
                    <span>{reg.evidenceCount} evidence items</span>
                    <span>Last: {new Date(reg.lastEvidenced + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
                  </div>

                  {reg.gaps.length > 0 && (
                    <div className="space-y-1">
                      {reg.gaps.map((gap, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-[11px] text-amber-700">
                          <AlertCircle className="h-3 w-3 shrink-0" />
                          <span>{gap}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {reg.ariaSuggestion && (
                    <div className="rounded-xl bg-[var(--cs-aria-gold-bg)] border border-[var(--cs-aria-gold-soft)] p-2.5">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Sparkles className="h-3 w-3 text-[var(--cs-aria-gold)]" />
                        <span className="text-[10px] font-semibold text-[var(--cs-navy)]">ARIA Suggestion</span>
                      </div>
                      <p className="text-[11px] text-[var(--cs-text-secondary)]">{reg.ariaSuggestion}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-[var(--cs-border)] bg-slate-50/50">
        <p className="text-[10px] text-[var(--cs-text-muted)] text-center">
          Compliance assessed from care records, incident logs, supervision records, and evidence uploads. Review with professional judgement.
        </p>
      </div>
    </div>
  );
}

// ── Testing exports ──────────────────────────────────────────────────────────

export const _testing = { STATUS_CONFIG, getDemoRegulations };

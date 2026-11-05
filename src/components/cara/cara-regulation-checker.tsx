// ══════════════════════════════════════════════════════════════════════════════
// CaraRegulationChecker — Children's Homes Regulations 2015 reference
//
// Lists the key Children's Homes Regulations 2015 as a reference checklist.
// Regulation numbers, titles and descriptions are published reference material,
// not records about any child, so they are shown here directly.
//
// NB: this widget previously rendered a hardcoded demo dataset unconditionally —
// per-regulation compliance statuses, evidence counts, "gaps" and Cara
// suggestions that named fictional children. On the live tenant that surfaced
// invented assessments and references to children who are not resident.
// Fabricated records must never
// appear on a live care-record system, so all per-child and per-regulation
// assessment data has been removed. A compliance status, evidence count or gap
// must come from the home's real recorded evidence; until records are assessed
// the widget shows an honest "not assessed" state rather than inventing one, and
// does NOT fetch or fabricate a compliance picture.
// ══════════════════════════════════════════════════════════════════════════════

"use client";

import React, { useState } from "react";
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

type ComplianceStatus = "compliant" | "partially_compliant" | "non_compliant" | "not_assessed";

/**
 * Generic reference content for a single regulation. Deliberately holds only
 * published reference fields — number, title, description. It carries NO
 * compliance status, evidence count, gap list or per-child suggestion: those
 * are assessments of a specific home's records and must never be fabricated.
 */
interface RegulationReference {
  id: string;
  number: string;
  title: string;
  description: string;
}

// ── Config ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ComplianceStatus, { label: string; colour: string; bg: string; icon: React.ReactNode }> = {
  compliant:            { label: "Compliant",     colour: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> },
  partially_compliant:  { label: "Partial",       colour: "text-amber-700",   bg: "bg-amber-50 border-amber-200",     icon: <AlertCircle className="h-3.5 w-3.5 text-amber-500" /> },
  non_compliant:        { label: "Non-Compliant", colour: "text-red-700",     bg: "bg-red-50 border-red-200",         icon: <XCircle className="h-3.5 w-3.5 text-red-500" /> },
  not_assessed:         { label: "Not Assessed",  colour: "text-slate-500",   bg: "bg-slate-50 border-slate-200",     icon: <AlertCircle className="h-3.5 w-3.5 text-slate-400" /> },
};

// ── Regulation reference content ───────────────────────────────────────────────
// Published reference only — the Children's Homes Regulations 2015. No child is
// named and no compliance assessment is asserted here.

const REGULATION_REFERENCE: RegulationReference[] = [
  { id: "reg_05", number: "Reg 5",  title: "Quality and purpose of care standard",            description: "The quality and purpose of care standard ensures that children receive care designed to meet needs and protect them." },
  { id: "reg_06", number: "Reg 6",  title: "Children's views, wishes and feelings standard",   description: "Children must be enabled to express views, wishes and feelings about their care." },
  { id: "reg_07", number: "Reg 7",  title: "Education standard",                               description: "Children must be helped to achieve their education potential." },
  { id: "reg_08", number: "Reg 8",  title: "Enjoyment and achievement standard",               description: "Children must have opportunities to participate in activities and develop their talents." },
  { id: "reg_09", number: "Reg 9",  title: "Health and wellbeing standard",                    description: "Children must receive appropriate healthcare and have their emotional wellbeing supported." },
  { id: "reg_10", number: "Reg 10", title: "Positive relationships standard",                  description: "Children must be helped to develop and maintain positive relationships." },
  { id: "reg_11", number: "Reg 11", title: "Protection of children standard",                  description: "Children must be protected from harm and enabled to keep themselves safe." },
  { id: "reg_12", number: "Reg 12", title: "The protection of children standard",              description: "Ensure children are protected from significant harm through effective safeguarding practices." },
  { id: "reg_13", number: "Reg 13", title: "Leadership and management standard",               description: "The registered person must ensure effective leadership and management." },
  { id: "reg_14", number: "Reg 14", title: "Care planning standard",                           description: "Children must have a care plan that sets out how their needs will be met." },
  { id: "reg_33", number: "Reg 33", title: "Employment of staff",                              description: "Sufficient, suitably qualified, and competent staff must be deployed." },
  { id: "reg_34", number: "Reg 34", title: "Staff supervision and appraisal",                  description: "All staff must receive regular supervision and annual appraisal." },
  { id: "reg_35", number: "Reg 35", title: "Restraint and deprivation of liberty",            description: "Restraint must only be used where necessary and recorded fully." },
  { id: "reg_40", number: "Reg 40", title: "Notification of significant events",               description: "Significant events must be notified to the appropriate bodies." },
  { id: "reg_45", number: "Reg 45", title: "Review of quality of care",                        description: "Monthly quality of care review covering all 9 subsections." },
];

// ── Component ────────────────────────────────────────────────────────────────

export function CaraRegulationChecker() {
  const [expandedReg, setExpandedReg] = useState<string | null>(null);
  const regulations = REGULATION_REFERENCE;
  const notAssessed = STATUS_CONFIG.not_assessed;

  return (
    <div className="rounded-2xl border border-[var(--cs-border)] bg-white overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[var(--cs-border)] bg-gradient-to-r from-[var(--cs-cara-gold-bg)] to-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[var(--cs-cara-gold-soft)] rounded-lg">
              <Sparkles className="h-4 w-4 text-[var(--cs-cara-gold)]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--cs-navy)]">Regulation Compliance Checker</h3>
              <p className="text-[10px] text-[var(--cs-text-muted)]">Children&apos;s Homes Regulations 2015 — reference</p>
            </div>
          </div>
          <div className="px-2.5 py-1 rounded-full text-[10px] font-semibold border bg-slate-50 text-slate-500 border-slate-200">
            Not assessed
          </div>
        </div>
      </div>

      {/* Honest neutral state — nothing is assessed until real evidence exists */}
      <div className="px-5 py-4 border-b border-[var(--cs-border)] bg-slate-50/60">
        <div className="flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
          <p className="text-[11px] leading-relaxed text-[var(--cs-text-secondary)]">
            Compliance status, evidence counts and gaps are not shown here because
            none have been assessed from the home&apos;s records yet. The regulations
            below are provided for reference. A status is only reported once it is
            evidenced from real care records — Cara does not estimate or infer one.
          </p>
        </div>
      </div>

      {/* Regulation reference list */}
      <div className="divide-y divide-[var(--cs-border)]">
        {regulations.map((reg) => {
          const isOpen = expandedReg === reg.id;

          return (
            <div key={reg.id}>
              <button
                className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-slate-50/50 transition-colors"
                onClick={() => setExpandedReg(isOpen ? null : reg.id)}
              >
                {notAssessed.icon}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[var(--cs-navy)]">{reg.number}</span>
                    <span className="text-xs text-[var(--cs-text-secondary)] truncate">{reg.title}</span>
                  </div>
                </div>
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium border ${notAssessed.bg} ${notAssessed.colour}`}>
                  {notAssessed.label}
                </span>
                <span className="text-[var(--cs-text-muted)] shrink-0">
                  {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </span>
              </button>

              {isOpen && (
                <div className="px-4 pb-3 pl-11 space-y-2 animate-fade-in">
                  <p className="text-[11px] text-[var(--cs-text-muted)]">{reg.description}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-[var(--cs-border)] bg-slate-50/50">
        <p className="text-[10px] text-[var(--cs-text-muted)] text-center">
          Children&apos;s Homes Regulations 2015 — reference only. Compliance is assessed from care records, incident logs, supervision records, and evidence uploads with professional judgement.
        </p>
      </div>
    </div>
  );
}

// ── Testing exports ──────────────────────────────────────────────────────────
// Pure config + reference content only — no fabricated assessment data.

export const _testing = { STATUS_CONFIG, REGULATION_REFERENCE };

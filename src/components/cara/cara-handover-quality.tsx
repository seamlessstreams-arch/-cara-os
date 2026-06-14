// ══════════════════════════════════════════════════════════════════════════════
// CaraHandoverQuality — AI quality scoring for shift handover completeness
//
// Analyses handover entries against Reg 34 requirements, flags missing info,
// and provides an overall quality score. Helps ensure handovers are thorough
// enough to maintain continuity of care across shifts.
// ══════════════════════════════════════════════════════════════════════════════

"use client";

import React, { useState } from "react";
import {
  Sparkles, CheckCircle2, AlertCircle, XCircle,
  ChevronDown, ChevronUp, ClipboardCheck, TrendingUp,
  TrendingDown, Minus, Pill, Heart, Smile, FileText,
  ShieldAlert, MessageCircle,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

type QualityLevel = "excellent" | "good" | "needs_improvement" | "poor";

type CheckCategory =
  | "child_updates"
  | "medication"
  | "incidents"
  | "mood_wellbeing"
  | "safeguarding"
  | "tasks_handover"
  | "communication"
  | "management_notes";

interface QualityCheck {
  id: string;
  category: CheckCategory;
  label: string;
  description: string;
  status: "pass" | "warning" | "fail";
  detail: string;
  regulation?: string;
}

interface HandoverQualityData {
  shiftDate: string;
  shiftType: string;
  qualityScore: number;
  qualityLevel: QualityLevel;
  checks: QualityCheck[];
  trend: "improving" | "stable" | "declining";
  averageScore7d: number;
  suggestion?: string;
}

// ── Config ───────────────────────────────────────────────────────────────────

const QUALITY_CONFIG: Record<QualityLevel, { label: string; colour: string; bg: string }> = {
  excellent:         { label: "Excellent",         colour: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
  good:              { label: "Good",              colour: "text-blue-700",    bg: "bg-blue-50 border-blue-200" },
  needs_improvement: { label: "Needs Improvement", colour: "text-amber-700",   bg: "bg-amber-50 border-amber-200" },
  poor:              { label: "Poor",              colour: "text-red-700",     bg: "bg-red-50 border-red-200" },
};

const CHECK_STATUS_CONFIG = {
  pass:    { icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />, label: "Complete" },
  warning: { icon: <AlertCircle className="h-3.5 w-3.5 text-amber-500" />,    label: "Partial" },
  fail:    { icon: <XCircle className="h-3.5 w-3.5 text-red-500" />,          label: "Missing" },
};

const CATEGORY_ICONS: Record<CheckCategory, React.ReactNode> = {
  child_updates:    <Smile className="h-3.5 w-3.5" />,
  medication:       <Pill className="h-3.5 w-3.5" />,
  incidents:        <ShieldAlert className="h-3.5 w-3.5" />,
  mood_wellbeing:   <Heart className="h-3.5 w-3.5" />,
  safeguarding:     <ShieldAlert className="h-3.5 w-3.5" />,
  tasks_handover:   <ClipboardCheck className="h-3.5 w-3.5" />,
  communication:    <MessageCircle className="h-3.5 w-3.5" />,
  management_notes: <FileText className="h-3.5 w-3.5" />,
};

const TREND_CONFIG = {
  improving: { icon: <TrendingUp className="h-3 w-3 text-emerald-500" />,  label: "Improving", colour: "text-emerald-600" },
  stable:    { icon: <Minus className="h-3 w-3 text-blue-500" />,          label: "Stable",    colour: "text-blue-600" },
  declining: { icon: <TrendingDown className="h-3 w-3 text-amber-500" />,  label: "Declining", colour: "text-amber-600" },
};

// ── Demo data ────────────────────────────────────────────────────────────────

function getDemoHandoverQuality(): HandoverQualityData {
  return {
    shiftDate: "2026-05-12",
    shiftType: "Day shift",
    qualityScore: 72,
    qualityLevel: "good",
    trend: "improving",
    averageScore7d: 68,
    suggestion: "Add mood scores for all young people and include management notes about the upcoming Ofsted preparation.",
    checks: [
      {
        id: "qc_01",
        category: "child_updates",
        label: "Individual child updates",
        description: "Each young person has a handover update",
        status: "pass",
        detail: "All 4 young people have individual updates with sufficient detail.",
        regulation: "Reg 34 — review of quality of care",
      },
      {
        id: "qc_02",
        category: "medication",
        label: "Medication handover",
        description: "Medication administration recorded and handed over",
        status: "pass",
        detail: "All scheduled medications administered and signed. No PRN given.",
      },
      {
        id: "qc_03",
        category: "incidents",
        label: "Incident reporting",
        description: "All incidents documented and flagged to incoming staff",
        status: "warning",
        detail: "1 incident logged but management oversight not yet completed. Flagged to incoming shift.",
        regulation: "Reg 40 — notification of incidents",
      },
      {
        id: "qc_04",
        category: "mood_wellbeing",
        label: "Mood & wellbeing scores",
        description: "Mood ratings recorded for each young person",
        status: "warning",
        detail: "Mood scores recorded for 3 of 4 young people. Jordan M is missing a mood entry.",
      },
      {
        id: "qc_05",
        category: "safeguarding",
        label: "Safeguarding updates",
        description: "Any safeguarding concerns flagged and communicated",
        status: "pass",
        detail: "No new safeguarding concerns. Existing concern for Casey T discussed with incoming team.",
      },
      {
        id: "qc_06",
        category: "tasks_handover",
        label: "Task handover",
        description: "Outstanding tasks passed to incoming shift",
        status: "pass",
        detail: "3 tasks passed to incoming shift: GP appointment, key work session, building check.",
      },
      {
        id: "qc_07",
        category: "communication",
        label: "Key communications",
        description: "External contact updates and messages noted",
        status: "fail",
        detail: "No record of social worker callback for Alex W that was due today.",
      },
      {
        id: "qc_08",
        category: "management_notes",
        label: "Management notes",
        description: "Registered Manager observations or directives",
        status: "fail",
        detail: "No management notes included for this handover.",
      },
    ],
  };
}

// ── Component ────────────────────────────────────────────────────────────────

export function CaraHandoverQuality() {
  const [showDetails, setShowDetails] = useState(false);
  const data = getDemoHandoverQuality();
  const qualityCfg = QUALITY_CONFIG[data.qualityLevel];
  const trendCfg = TREND_CONFIG[data.trend];

  const passCount = data.checks.filter((c) => c.status === "pass").length;
  const warnCount = data.checks.filter((c) => c.status === "warning").length;
  const failCount = data.checks.filter((c) => c.status === "fail").length;

  // Score ring colour
  const ringColour =
    data.qualityScore >= 80 ? "stroke-emerald-500" :
    data.qualityScore >= 60 ? "stroke-amber-500" : "stroke-red-500";

  const circumference = 2 * Math.PI * 28;
  const offset = circumference - (data.qualityScore / 100) * circumference;

  return (
    <div className="rounded-2xl border border-[var(--cs-border)] bg-white overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[var(--cs-border)] bg-gradient-to-r from-[var(--cs-cara-gold-bg)] to-white">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-[var(--cs-cara-gold-soft)] rounded-lg">
            <Sparkles className="h-4 w-4 text-[var(--cs-cara-gold)]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[var(--cs-navy)]">Handover Quality Check</h3>
            <p className="text-[10px] text-[var(--cs-text-muted)]">{data.shiftType} — {new Date(data.shiftDate + "T00:00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" })}</p>
          </div>
        </div>
      </div>

      {/* Score and summary */}
      <div className="px-5 py-4 flex items-center gap-5 border-b border-[var(--cs-border)]">
        {/* Score ring */}
        <div className="relative shrink-0">
          <svg width="72" height="72" className="-rotate-90">
            <circle cx="36" cy="36" r="28" fill="none" stroke="var(--cs-border)" strokeWidth="5" />
            <circle
              cx="36" cy="36" r="28" fill="none"
              className={ringColour}
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ transition: "stroke-dashoffset 0.6s ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-bold text-[var(--cs-navy)] tabular-nums">{data.qualityScore}</span>
            <span className="text-[8px] text-[var(--cs-text-muted)] -mt-0.5">/ 100</span>
          </div>
        </div>

        {/* Details */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${qualityCfg.bg} ${qualityCfg.colour}`}>
              {qualityCfg.label}
            </span>
            <span className={`flex items-center gap-1 text-[10px] ${trendCfg.colour}`}>
              {trendCfg.icon} {trendCfg.label}
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1 text-emerald-600">
              <CheckCircle2 className="h-3 w-3" /> {passCount} pass
            </span>
            <span className="flex items-center gap-1 text-amber-600">
              <AlertCircle className="h-3 w-3" /> {warnCount} partial
            </span>
            <span className="flex items-center gap-1 text-red-600">
              <XCircle className="h-3 w-3" /> {failCount} missing
            </span>
          </div>

          <p className="text-[10px] text-[var(--cs-text-muted)]">
            7-day average: <span className="font-medium">{data.averageScore7d}%</span>
          </p>
        </div>
      </div>

      {/* Cara suggestion */}
      {data.suggestion && (
        <div className="mx-4 mt-3 rounded-xl bg-[var(--cs-cara-gold-bg)] border border-[var(--cs-cara-gold-soft)] p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Sparkles className="h-3 w-3 text-[var(--cs-cara-gold)]" />
            <span className="text-[10px] font-semibold text-[var(--cs-navy)]">Cara Suggestion</span>
          </div>
          <p className="text-[11px] text-[var(--cs-text-secondary)]">{data.suggestion}</p>
        </div>
      )}

      {/* Expand/collapse checks */}
      <div className="px-4 py-2 mt-1">
        <button
          className="flex items-center gap-1.5 text-xs text-[var(--cs-text-secondary)] hover:text-[var(--cs-navy)] transition-colors w-full justify-center"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          {showDetails ? "Hide" : "Show"} detailed checks ({data.checks.length})
        </button>
      </div>

      {/* Detailed checks */}
      {showDetails && (
        <div className="divide-y divide-[var(--cs-border)] border-t border-[var(--cs-border)] animate-fade-in">
          {data.checks.map((check) => {
            const statusCfg = CHECK_STATUS_CONFIG[check.status];
            return (
              <div key={check.id} className="px-4 py-2.5 flex items-start gap-3">
                <span className="mt-0.5 text-[var(--cs-text-muted)]">{CATEGORY_ICONS[check.category]}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-[var(--cs-navy)]">{check.label}</span>
                    <span className="flex items-center gap-1 text-[10px]">
                      {statusCfg.icon}
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--cs-text-muted)] mt-0.5">{check.detail}</p>
                  {check.regulation && (
                    <p className="text-[10px] text-[var(--cs-text-gentle)] mt-0.5">{check.regulation}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-[var(--cs-border)] bg-slate-50/50">
        <p className="text-[10px] text-[var(--cs-text-muted)] text-center">
          Quality checks run automatically at handover. Score reflects Reg 34 and your Statement of Purpose requirements.
        </p>
      </div>
    </div>
  );
}

// ── Testing exports ──────────────────────────────────────────────────────────

export const _testing = { QUALITY_CONFIG, CHECK_STATUS_CONFIG, TREND_CONFIG, getDemoHandoverQuality };

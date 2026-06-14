// ══════════════════════════════════════════════════════════════════════════════
// CaraRotaIntelligence — AI-powered rota analysis & staffing alerts
//
// Shows Cara-detected issues with the weekly rota: lone-working risk,
// overtime patterns, ratio non-compliance, fatigue risk, and optimal
// suggestions. Designed for the Rota page sidebar or inline placement.
// ══════════════════════════════════════════════════════════════════════════════

"use client";

import React, { useState } from "react";
import {
  Sparkles, AlertTriangle, Clock, Users, ShieldAlert,
  ChevronDown, ChevronUp, TrendingUp, Moon, Coffee,
  CheckCircle2, XCircle,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

type AlertSeverity = "critical" | "high" | "medium" | "low" | "info";

type RotaAlertType =
  | "lone_working"
  | "overtime_risk"
  | "ratio_breach"
  | "fatigue_risk"
  | "gap_detected"
  | "pattern_concern"
  | "positive";

interface RotaAlert {
  id: string;
  type: RotaAlertType;
  severity: AlertSeverity;
  title: string;
  detail: string;
  regulation?: string;
  staffAffected?: string[];
  dateRange?: string;
  suggestion?: string;
}

interface RotaIntelligenceData {
  weekLabel: string;
  overallRisk: "low" | "medium" | "high";
  alerts: RotaAlert[];
  complianceScore: number;
  totalShiftHours: number;
  staffCount: number;
  nightsCovered: number;
  nightsRequired: number;
}

// ── Status configs ───────────────────────────────────────────────────────────

const SEVERITY_CONFIG: Record<AlertSeverity, { label: string; colour: string; bg: string; dot: string }> = {
  critical: { label: "Critical", colour: "text-red-700",     bg: "bg-red-50 border-red-200",        dot: "bg-red-500" },
  high:     { label: "High",     colour: "text-orange-700",  bg: "bg-orange-50 border-orange-200",  dot: "bg-orange-500" },
  medium:   { label: "Medium",   colour: "text-amber-700",   bg: "bg-amber-50 border-amber-200",    dot: "bg-amber-500" },
  low:      { label: "Low",      colour: "text-blue-700",    bg: "bg-blue-50 border-blue-200",      dot: "bg-blue-400" },
  info:     { label: "Info",     colour: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", dot: "bg-emerald-400" },
};

const TYPE_ICONS: Record<RotaAlertType, React.ReactNode> = {
  lone_working:    <ShieldAlert className="h-4 w-4" />,
  overtime_risk:   <Clock className="h-4 w-4" />,
  ratio_breach:    <Users className="h-4 w-4" />,
  fatigue_risk:    <Coffee className="h-4 w-4" />,
  gap_detected:    <XCircle className="h-4 w-4" />,
  pattern_concern: <TrendingUp className="h-4 w-4" />,
  positive:        <CheckCircle2 className="h-4 w-4" />,
};

// ── Demo data ────────────────────────────────────────────────────────────────

function getDemoRotaIntelligence(): RotaIntelligenceData {
  return {
    weekLabel: "12 – 18 May 2026",
    overallRisk: "medium",
    complianceScore: 82,
    totalShiftHours: 312,
    staffCount: 8,
    nightsCovered: 6,
    nightsRequired: 7,
    alerts: [
      {
        id: "ra_001",
        type: "lone_working",
        severity: "critical",
        title: "Lone working risk — Wednesday night",
        detail: "Only one waking night staff member rostered for Wed 14 May. Minimum two required for 4-bed home.",
        regulation: "Reg 40(2)(c) — adequate staffing",
        staffAffected: ["Jordan P"],
        dateRange: "14 May 22:00 – 15 May 07:00",
        suggestion: "Assign a second waking night staff member or arrange on-call cover.",
      },
      {
        id: "ra_002",
        type: "overtime_risk",
        severity: "high",
        title: "Overtime threshold — Sam K (52h rostered)",
        detail: "Sam K is rostered for 52 hours this week, exceeding the 48-hour Working Time Directive limit.",
        regulation: "Working Time Regulations 1998",
        staffAffected: ["Sam K"],
        suggestion: "Redistribute 4+ hours to available staff or record opt-out agreement.",
      },
      {
        id: "ra_003",
        type: "fatigue_risk",
        severity: "high",
        title: "Insufficient rest — Alex R",
        detail: "Alex R has a sleep-in ending at 07:00 followed by a day shift starting at 07:30 on Thursday. Only 30 minutes between shifts.",
        regulation: "Working Time Regulations — 11 hours daily rest",
        staffAffected: ["Alex R"],
        dateRange: "Thu 15 May",
        suggestion: "Move day shift start to 09:00 or assign sleep-in to different staff.",
      },
      {
        id: "ra_004",
        type: "gap_detected",
        severity: "medium",
        title: "Sunday afternoon gap (14:00 – 17:00)",
        detail: "No shifts rostered between 14:00 and 17:00 on Sunday. This falls below minimum staffing level.",
        dateRange: "Sun 18 May 14:00 – 17:00",
        suggestion: "Extend existing day shift or create an additional short shift.",
      },
      {
        id: "ra_005",
        type: "ratio_breach",
        severity: "medium",
        title: "Staff-to-child ratio below 1:2 — Friday evening",
        detail: "Only 1 staff member rostered for evening (17:00–22:00) with 4 young people in placement.",
        regulation: "Statement of Purpose — staffing ratios",
        dateRange: "Fri 16 May 17:00 – 22:00",
        suggestion: "Add evening cover or extend a day shift to overlap.",
      },
      {
        id: "ra_006",
        type: "positive",
        severity: "info",
        title: "Good continuity — Mon/Tue key worker alignment",
        detail: "Key workers for all 4 young people are rostered on their allocated key work days (Monday and Tuesday).",
        suggestion: "No action needed — strong practice.",
      },
    ],
  };
}

// ── Component ────────────────────────────────────────────────────────────────

export function CaraRotaIntelligence() {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const data = getDemoRotaIntelligence();

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  const criticalCount = data.alerts.filter((a) => a.severity === "critical").length;
  const highCount = data.alerts.filter((a) => a.severity === "high").length;
  const actionableCount = data.alerts.filter((a) => a.severity !== "info").length;

  const riskColour =
    data.overallRisk === "high" ? "text-red-600" :
    data.overallRisk === "medium" ? "text-amber-600" : "text-emerald-600";

  const riskBg =
    data.overallRisk === "high" ? "bg-red-50 border-red-200" :
    data.overallRisk === "medium" ? "bg-amber-50 border-amber-200" : "bg-emerald-50 border-emerald-200";

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
              <h3 className="text-sm font-semibold text-[var(--cs-navy)]">Cara Rota Intelligence</h3>
              <p className="text-[10px] text-[var(--cs-text-muted)]">{data.weekLabel}</p>
            </div>
          </div>
          <div className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${riskBg} ${riskColour}`}>
            {data.overallRisk.toUpperCase()} RISK
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-4 divide-x divide-[var(--cs-border)] border-b border-[var(--cs-border)]">
        {[
          { label: "Compliance", value: `${data.complianceScore}%`, colour: data.complianceScore >= 90 ? "text-emerald-600" : data.complianceScore >= 70 ? "text-amber-600" : "text-red-600" },
          { label: "Shift Hours", value: `${data.totalShiftHours}h`, colour: "text-[var(--cs-navy)]" },
          { label: "Night Cover", value: `${data.nightsCovered}/${data.nightsRequired}`, colour: data.nightsCovered >= data.nightsRequired ? "text-emerald-600" : "text-amber-600" },
          { label: "Alerts", value: String(actionableCount), colour: actionableCount === 0 ? "text-emerald-600" : "text-amber-600" },
        ].map((s) => (
          <div key={s.label} className="px-3 py-2.5 text-center">
            <div className={`text-lg font-bold tabular-nums ${s.colour}`}>{s.value}</div>
            <div className="text-[10px] text-[var(--cs-text-muted)]">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Critical/high summary */}
      {(criticalCount > 0 || highCount > 0) && (
        <div className="px-4 py-2.5 border-b border-[var(--cs-border)] bg-red-50/50 flex items-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5 text-red-600 shrink-0" />
          <span className="text-xs text-red-800">
            {criticalCount > 0 && <strong>{criticalCount} critical</strong>}
            {criticalCount > 0 && highCount > 0 && " and "}
            {highCount > 0 && <strong>{highCount} high</strong>}
            {" "}priority alert{(criticalCount + highCount) !== 1 ? "s" : ""} require attention
          </span>
        </div>
      )}

      {/* Alerts list */}
      <div className="divide-y divide-[var(--cs-border)]">
        {data.alerts.map((alert) => {
          const cfg = SEVERITY_CONFIG[alert.severity];
          const isOpen = expanded.has(alert.id);

          return (
            <div key={alert.id} className="group">
              <button
                className="w-full px-4 py-3 flex items-start gap-3 text-left hover:bg-slate-50/50 transition-colors"
                onClick={() => toggle(alert.id)}
              >
                <span className={`mt-0.5 ${cfg.colour}`}>
                  {TYPE_ICONS[alert.type]}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-[var(--cs-navy)] line-clamp-1">{alert.title}</span>
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium border ${cfg.bg} ${cfg.colour}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                      {cfg.label}
                    </span>
                  </div>
                  {!isOpen && (
                    <p className="text-[11px] text-[var(--cs-text-muted)] line-clamp-1 mt-0.5">{alert.detail}</p>
                  )}
                </div>
                <span className="mt-1 text-[var(--cs-text-muted)] shrink-0">
                  {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </span>
              </button>

              {isOpen && (
                <div className="px-4 pb-3 pl-11 space-y-2 animate-fade-in">
                  <p className="text-xs text-[var(--cs-text-secondary)]">{alert.detail}</p>

                  {alert.regulation && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-[var(--cs-text-muted)]">Regulation:</span>
                      <span className="text-[10px] font-medium text-[var(--cs-navy)]">{alert.regulation}</span>
                    </div>
                  )}

                  {alert.dateRange && (
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3 text-[var(--cs-text-muted)]" />
                      <span className="text-[10px] text-[var(--cs-text-secondary)]">{alert.dateRange}</span>
                    </div>
                  )}

                  {alert.staffAffected && alert.staffAffected.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3 w-3 text-[var(--cs-text-muted)]" />
                      <span className="text-[10px] text-[var(--cs-text-secondary)]">{alert.staffAffected.join(", ")}</span>
                    </div>
                  )}

                  {alert.suggestion && (
                    <div className="rounded-xl bg-[var(--cs-cara-gold-bg)] border border-[var(--cs-cara-gold-soft)] p-2.5 mt-1">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Sparkles className="h-3 w-3 text-[var(--cs-cara-gold)]" />
                        <span className="text-[10px] font-semibold text-[var(--cs-navy)]">Cara Suggestion</span>
                      </div>
                      <p className="text-[11px] text-[var(--cs-text-secondary)]">{alert.suggestion}</p>
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
          Cara analyses rota patterns against regulations and your Statement of Purpose. All suggestions require human review.
        </p>
      </div>
    </div>
  );
}

// ── Testing exports ──────────────────────────────────────────────────────────

export const _testing = { SEVERITY_CONFIG, getDemoRotaIntelligence };

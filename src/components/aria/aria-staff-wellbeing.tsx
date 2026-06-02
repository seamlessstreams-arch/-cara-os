// ══════════════════════════════════════════════════════════════════════════════
// AriaStaffWellbeing — AI-tracked staff wellbeing indicators
//
// Monitors supervision adherence, overtime patterns, training compliance,
// absence trends, and workload balance. Flags staff at risk of burnout
// or non-compliance, with ARIA-generated recommendations.
// ══════════════════════════════════════════════════════════════════════════════

"use client";

import React, { useState } from "react";
import {
  Sparkles, Heart, Clock, BookOpen, AlertTriangle,
  CheckCircle2, TrendingUp, TrendingDown, Minus,
  ChevronDown, ChevronUp, Users, Shield, Coffee,
  Calendar,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

type WellbeingLevel = "good" | "caution" | "concern" | "critical";
type TrendDir = "improving" | "stable" | "declining";

interface StaffWellbeingEntry {
  staffId: string;
  staffName: string;
  role: string;
  wellbeingLevel: WellbeingLevel;
  supervisionStatus: "on_track" | "due_soon" | "overdue";
  daysSinceSupervision: number;
  weeklyHoursAvg4w: number;
  contractedHours: number;
  overtimeWeeks: number;       // weeks with overtime in last 4
  trainingCompliance: number;  // percentage
  absenceDays30d: number;
  consecutiveShifts: number;
  trend: TrendDir;
  flags: string[];
  suggestion?: string;
}

// ── Config ───────────────────────────────────────────────────────────────────

const WELLBEING_CONFIG: Record<WellbeingLevel, { label: string; colour: string; bg: string; dot: string }> = {
  good:     { label: "Good",     colour: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", dot: "bg-emerald-500" },
  caution:  { label: "Caution",  colour: "text-amber-700",   bg: "bg-amber-50 border-amber-200",     dot: "bg-amber-400" },
  concern:  { label: "Concern",  colour: "text-orange-700",  bg: "bg-orange-50 border-orange-200",   dot: "bg-orange-500" },
  critical: { label: "Critical", colour: "text-red-700",     bg: "bg-red-50 border-red-200",         dot: "bg-red-500" },
};

const SUP_STATUS_CONFIG = {
  on_track:  { label: "On Track", colour: "text-emerald-600", icon: <CheckCircle2 className="h-3 w-3" /> },
  due_soon:  { label: "Due Soon", colour: "text-amber-600",   icon: <Clock className="h-3 w-3" /> },
  overdue:   { label: "Overdue",  colour: "text-red-600",     icon: <AlertTriangle className="h-3 w-3" /> },
};

const TREND_CONFIG: Record<TrendDir, { icon: React.ReactNode; colour: string }> = {
  improving: { icon: <TrendingUp className="h-3 w-3" />,    colour: "text-emerald-500" },
  stable:    { icon: <Minus className="h-3 w-3" />,         colour: "text-blue-400" },
  declining: { icon: <TrendingDown className="h-3 w-3" />,  colour: "text-red-500" },
};

// ── Demo data ────────────────────────────────────────────────────────────────

function getDemoStaffWellbeing(): StaffWellbeingEntry[] {
  return [
    {
      staffId: "stf_001",
      staffName: "Sam K",
      role: "Senior Residential Worker",
      wellbeingLevel: "concern",
      supervisionStatus: "on_track",
      daysSinceSupervision: 14,
      weeklyHoursAvg4w: 51,
      contractedHours: 40,
      overtimeWeeks: 3,
      trainingCompliance: 88,
      absenceDays30d: 0,
      consecutiveShifts: 6,
      trend: "declining",
      flags: ["Overtime in 3 of last 4 weeks", "6 consecutive shifts without rest day"],
      suggestion: "Review workload distribution and ensure rest day is scheduled this week.",
    },
    {
      staffId: "stf_002",
      staffName: "Jordan P",
      role: "Residential Worker",
      wellbeingLevel: "critical",
      supervisionStatus: "overdue",
      daysSinceSupervision: 35,
      weeklyHoursAvg4w: 38,
      contractedHours: 37.5,
      overtimeWeeks: 0,
      trainingCompliance: 72,
      absenceDays30d: 4,
      consecutiveShifts: 3,
      trend: "declining",
      flags: ["Supervision 7 days overdue", "4 absence days in 30 days", "Training compliance below 80%"],
      suggestion: "Schedule supervision urgently. Discuss absence pattern and training plan.",
    },
    {
      staffId: "stf_003",
      staffName: "Alex R",
      role: "Residential Worker",
      wellbeingLevel: "caution",
      supervisionStatus: "due_soon",
      daysSinceSupervision: 24,
      weeklyHoursAvg4w: 42,
      contractedHours: 40,
      overtimeWeeks: 1,
      trainingCompliance: 95,
      absenceDays30d: 0,
      consecutiveShifts: 4,
      trend: "stable",
      flags: ["Supervision due within 4 days"],
      suggestion: "Book supervision before end of week to maintain 4-week cycle.",
    },
    {
      staffId: "stf_004",
      staffName: "Pat M",
      role: "Residential Worker",
      wellbeingLevel: "good",
      supervisionStatus: "on_track",
      daysSinceSupervision: 10,
      weeklyHoursAvg4w: 38,
      contractedHours: 37.5,
      overtimeWeeks: 0,
      trainingCompliance: 100,
      absenceDays30d: 0,
      consecutiveShifts: 3,
      trend: "improving",
      flags: [],
    },
    {
      staffId: "stf_005",
      staffName: "Taylor H",
      role: "Waking Night Worker",
      wellbeingLevel: "good",
      supervisionStatus: "on_track",
      daysSinceSupervision: 18,
      weeklyHoursAvg4w: 40,
      contractedHours: 40,
      overtimeWeeks: 0,
      trainingCompliance: 92,
      absenceDays30d: 1,
      consecutiveShifts: 4,
      trend: "stable",
      flags: [],
    },
  ];
}

// ── Component ────────────────────────────────────────────────────────────────

export function AriaStaffWellbeing() {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const staff = getDemoStaffWellbeing();

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  // Sort by wellbeing level (worst first)
  const wellbeingOrder: Record<WellbeingLevel, number> = { critical: 0, concern: 1, caution: 2, good: 3 };
  const sorted = [...staff].sort((a, b) => wellbeingOrder[a.wellbeingLevel] - wellbeingOrder[b.wellbeingLevel]);

  const criticalCount = staff.filter((s) => s.wellbeingLevel === "critical").length;
  const concernCount = staff.filter((s) => s.wellbeingLevel === "concern").length;
  const avgTraining = Math.round(staff.reduce((sum, s) => sum + s.trainingCompliance, 0) / staff.length);
  const overdueSupCount = staff.filter((s) => s.supervisionStatus === "overdue").length;

  return (
    <div className="rounded-2xl border border-[var(--cs-border)] bg-white overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[var(--cs-border)] bg-gradient-to-r from-[var(--cs-aria-gold-bg)] to-white">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-[var(--cs-aria-gold-soft)] rounded-lg">
            <Sparkles className="h-4 w-4 text-[var(--cs-aria-gold)]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[var(--cs-navy)]">Staff Wellbeing Tracker</h3>
            <p className="text-[10px] text-[var(--cs-text-muted)]">ARIA-analysed staffing health — {staff.length} staff members</p>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-4 divide-x divide-[var(--cs-border)] border-b border-[var(--cs-border)]">
        {[
          { label: "At Risk",        value: criticalCount + concernCount, colour: (criticalCount + concernCount) > 0 ? "text-red-600" : "text-emerald-600" },
          { label: "Sup. Overdue",   value: overdueSupCount,              colour: overdueSupCount > 0 ? "text-red-600" : "text-emerald-600" },
          { label: "Avg Training",   value: `${avgTraining}%`,            colour: avgTraining >= 90 ? "text-emerald-600" : avgTraining >= 80 ? "text-amber-600" : "text-red-600" },
          { label: "Team Size",      value: staff.length,                  colour: "text-[var(--cs-navy)]" },
        ].map((s) => (
          <div key={s.label} className="px-3 py-2.5 text-center">
            <div className={`text-lg font-bold tabular-nums ${s.colour}`}>{s.value}</div>
            <div className="text-[10px] text-[var(--cs-text-muted)]">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Staff list */}
      <div className="divide-y divide-[var(--cs-border)]">
        {sorted.map((entry) => {
          const wCfg = WELLBEING_CONFIG[entry.wellbeingLevel];
          const sCfg = SUP_STATUS_CONFIG[entry.supervisionStatus];
          const tCfg = TREND_CONFIG[entry.trend];
          const isOpen = expanded.has(entry.staffId);

          return (
            <div key={entry.staffId}>
              <button
                className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-slate-50/50 transition-colors"
                onClick={() => toggle(entry.staffId)}
              >
                {/* Wellbeing dot */}
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${wCfg.dot}`} />

                {/* Name and role */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-[var(--cs-navy)]">{entry.staffName}</span>
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium border ${wCfg.bg} ${wCfg.colour}`}>
                      {wCfg.label}
                    </span>
                    <span className={`flex items-center gap-0.5 text-[10px] ${tCfg.colour}`}>
                      {tCfg.icon}
                    </span>
                  </div>
                  <span className="text-[10px] text-[var(--cs-text-muted)]">{entry.role}</span>
                </div>

                {/* Key metrics */}
                <div className="flex items-center gap-3 shrink-0 text-[10px]">
                  <span className={`flex items-center gap-1 ${sCfg.colour}`}>
                    {sCfg.icon} {entry.daysSinceSupervision}d
                  </span>
                  <span className={entry.weeklyHoursAvg4w > entry.contractedHours ? "text-amber-600 font-medium" : "text-[var(--cs-text-muted)]"}>
                    {entry.weeklyHoursAvg4w}h avg
                  </span>
                  <span className={entry.trainingCompliance >= 90 ? "text-emerald-600" : entry.trainingCompliance >= 80 ? "text-amber-600" : "text-red-600"}>
                    {entry.trainingCompliance}%
                  </span>
                </div>

                <span className="text-[var(--cs-text-muted)] shrink-0">
                  {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </span>
              </button>

              {isOpen && (
                <div className="px-4 pb-3 pl-10 space-y-2 animate-fade-in">
                  {/* Metrics grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[
                      { label: "Supervision", value: `${entry.daysSinceSupervision}d ago`, icon: <Users className="h-3 w-3" />, status: sCfg.colour },
                      { label: "Avg Hours/Wk", value: `${entry.weeklyHoursAvg4w}h / ${entry.contractedHours}h`, icon: <Clock className="h-3 w-3" />, status: entry.weeklyHoursAvg4w > entry.contractedHours ? "text-amber-600" : "text-emerald-600" },
                      { label: "Training", value: `${entry.trainingCompliance}%`, icon: <BookOpen className="h-3 w-3" />, status: entry.trainingCompliance >= 90 ? "text-emerald-600" : "text-amber-600" },
                      { label: "Absences (30d)", value: `${entry.absenceDays30d} day${entry.absenceDays30d !== 1 ? "s" : ""}`, icon: <Calendar className="h-3 w-3" />, status: entry.absenceDays30d > 2 ? "text-red-600" : "text-[var(--cs-text-secondary)]" },
                    ].map((m) => (
                      <div key={m.label} className="rounded-lg border border-[var(--cs-border)] p-2 bg-white">
                        <div className="flex items-center gap-1 text-[var(--cs-text-muted)] mb-0.5">
                          {m.icon}
                          <span className="text-[9px]">{m.label}</span>
                        </div>
                        <span className={`text-xs font-medium ${m.status}`}>{m.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Flags */}
                  {(entry.flags?.length ?? 0) > 0 && (
                    <div className="space-y-1">
                      {(entry.flags ?? []).map((flag, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-[11px] text-amber-700">
                          <AlertTriangle className="h-3 w-3 shrink-0" />
                          <span>{flag}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* ARIA suggestion */}
                  {entry.suggestion && (
                    <div className="rounded-xl bg-[var(--cs-aria-gold-bg)] border border-[var(--cs-aria-gold-soft)] p-2.5">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Sparkles className="h-3 w-3 text-[var(--cs-aria-gold)]" />
                        <span className="text-[10px] font-semibold text-[var(--cs-navy)]">ARIA Suggestion</span>
                      </div>
                      <p className="text-[11px] text-[var(--cs-text-secondary)]">{entry.suggestion}</p>
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
          Wellbeing indicators analysed from supervision records, timesheets, training logs, and absence data.
        </p>
      </div>
    </div>
  );
}

// ── Testing exports ──────────────────────────────────────────────────────────

export const _testing = { WELLBEING_CONFIG, SUP_STATUS_CONFIG, getDemoStaffWellbeing };

// ══════════════════════════════════════════════════════════════════════════════
// CaraComplianceCalendar — Upcoming compliance deadlines tracked by Cara
//
// Shows a timeline of regulatory deadlines: Reg 45 reports, supervision
// cycles, training renewals, risk assessment reviews, care plan reviews,
// fire drills, and medication audits. Colour-coded by urgency.
// ══════════════════════════════════════════════════════════════════════════════

"use client";

import React, { useState } from "react";
import {
  Sparkles, Calendar, Clock, AlertTriangle, CheckCircle2,
  ChevronDown, ChevronUp, FileText, Users, Shield,
  Flame, Pill, BookOpen, ClipboardCheck, Star,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

type DeadlineStatus = "overdue" | "due_today" | "due_soon" | "upcoming" | "complete";

type DeadlineType =
  | "reg45_report"
  | "supervision"
  | "training_renewal"
  | "risk_assessment_review"
  | "care_plan_review"
  | "fire_drill"
  | "medication_audit"
  | "lac_review"
  | "annual_review";

interface ComplianceDeadline {
  id: string;
  type: DeadlineType;
  title: string;
  description: string;
  dueDate: string;
  daysUntilDue: number;
  status: DeadlineStatus;
  regulation?: string;
  assignedTo?: string;
  relatedPerson?: string;
}

// ── Config ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<DeadlineStatus, { label: string; colour: string; bg: string; dot: string }> = {
  overdue:   { label: "Overdue",   colour: "text-red-700",     bg: "bg-red-50 border-red-200",        dot: "bg-red-500" },
  due_today: { label: "Due Today", colour: "text-orange-700",  bg: "bg-orange-50 border-orange-200",  dot: "bg-orange-500" },
  due_soon:  { label: "Due Soon",  colour: "text-amber-700",   bg: "bg-amber-50 border-amber-200",    dot: "bg-amber-400" },
  upcoming:  { label: "Upcoming",  colour: "text-blue-700",    bg: "bg-blue-50 border-blue-200",      dot: "bg-blue-400" },
  complete:  { label: "Complete",  colour: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", dot: "bg-emerald-500" },
};

const TYPE_ICONS: Record<DeadlineType, React.ReactNode> = {
  reg45_report:            <FileText className="h-3.5 w-3.5" />,
  supervision:             <Users className="h-3.5 w-3.5" />,
  training_renewal:        <BookOpen className="h-3.5 w-3.5" />,
  risk_assessment_review:  <Shield className="h-3.5 w-3.5" />,
  care_plan_review:        <ClipboardCheck className="h-3.5 w-3.5" />,
  fire_drill:              <Flame className="h-3.5 w-3.5" />,
  medication_audit:        <Pill className="h-3.5 w-3.5" />,
  lac_review:              <Star className="h-3.5 w-3.5" />,
  annual_review:           <Calendar className="h-3.5 w-3.5" />,
};

// ── Demo data ────────────────────────────────────────────────────────────────

function getDemoDeadlines(): ComplianceDeadline[] {
  return [
    {
      id: "cd_001",
      type: "supervision",
      title: "Supervision overdue — Jordan P",
      description: "Supervision cycle exceeded 4-week maximum.",
      dueDate: "2026-05-08",
      daysUntilDue: -4,
      status: "overdue",
      regulation: "Reg 33 — Employment of staff",
      assignedTo: "Olivia H (RM)",
      relatedPerson: "Jordan P",
    },
    {
      id: "cd_002",
      type: "fire_drill",
      title: "Monthly fire drill due",
      description: "Last drill: 14 Apr 2026. Monthly cycle requires completion by today.",
      dueDate: "2026-05-12",
      daysUntilDue: 0,
      status: "due_today",
      regulation: "Fire Safety Order 2005",
      assignedTo: "Sam K (Senior)",
    },
    {
      id: "cd_003",
      type: "risk_assessment_review",
      title: "Risk assessment review — Alex W",
      description: "Behaviour pattern escalation triggered Cara flag for risk assessment review.",
      dueDate: "2026-05-14",
      daysUntilDue: 2,
      status: "due_soon",
      regulation: "Reg 12 — Health and safety",
      relatedPerson: "Alex W",
    },
    {
      id: "cd_004",
      type: "reg45_report",
      title: "Reg 45 monthly report — May 2026",
      description: "Monthly report covering all 9 Reg 45(2) subsections.",
      dueDate: "2026-05-25",
      daysUntilDue: 13,
      status: "upcoming",
      regulation: "Reg 45 — Review of quality of care",
      assignedTo: "Olivia H (RM)",
    },
    {
      id: "cd_005",
      type: "care_plan_review",
      title: "Care plan review — Casey T",
      description: "6-month care plan review due. Last reviewed 28 Nov 2025.",
      dueDate: "2026-05-28",
      daysUntilDue: 16,
      status: "upcoming",
      regulation: "Reg 14 — Care planning",
      relatedPerson: "Casey T",
    },
    {
      id: "cd_006",
      type: "training_renewal",
      title: "First Aid certificate renewal — Pat M",
      description: "First Aid at Work certificate expires 30 May 2026.",
      dueDate: "2026-05-30",
      daysUntilDue: 18,
      status: "upcoming",
      relatedPerson: "Pat M",
    },
    {
      id: "cd_007",
      type: "medication_audit",
      title: "Monthly medication audit",
      description: "All MAR charts require monthly audit and sign-off.",
      dueDate: "2026-05-31",
      daysUntilDue: 19,
      status: "upcoming",
      regulation: "Reg 23 — Health of children",
      assignedTo: "Senior on shift",
    },
    {
      id: "cd_008",
      type: "lac_review",
      title: "LAC review — Jordan M",
      description: "Looked After Child statutory review due.",
      dueDate: "2026-06-05",
      daysUntilDue: 24,
      status: "upcoming",
      relatedPerson: "Jordan M",
    },
    {
      id: "cd_009",
      type: "supervision",
      title: "Supervision — Alex R",
      description: "Supervision due within standard 4-week cycle.",
      dueDate: "2026-05-11",
      daysUntilDue: -1,
      status: "complete",
      assignedTo: "Olivia H (RM)",
      relatedPerson: "Alex R",
    },
  ];
}

// ── Component ────────────────────────────────────────────────────────────────

export function CaraComplianceCalendar() {
  const [showAll, setShowAll] = useState(false);
  const deadlines = getDemoDeadlines();

  const activeDeadlines = deadlines.filter((d) => d.status !== "complete");
  const completedCount = deadlines.filter((d) => d.status === "complete").length;
  const overdueCount = deadlines.filter((d) => d.status === "overdue").length;
  const dueTodayCount = deadlines.filter((d) => d.status === "due_today").length;
  const dueSoonCount = deadlines.filter((d) => d.status === "due_soon").length;

  // Sort: overdue first, then by days until due
  const sorted = [...(showAll ? deadlines : activeDeadlines)].sort((a, b) => {
    const statusOrder: Record<DeadlineStatus, number> = {
      overdue: 0, due_today: 1, due_soon: 2, upcoming: 3, complete: 4,
    };
    return (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9) || a.daysUntilDue - b.daysUntilDue;
  });

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
              <h3 className="text-sm font-semibold text-[var(--cs-navy)]">Compliance Calendar</h3>
              <p className="text-[10px] text-[var(--cs-text-muted)]">Cara-tracked regulatory deadlines</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {overdueCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-700 border border-red-200">
                {overdueCount} overdue
              </span>
            )}
            {dueTodayCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-100 text-orange-700 border border-orange-200">
                {dueTodayCount} today
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-4 divide-x divide-[var(--cs-border)] border-b border-[var(--cs-border)]">
        {[
          { label: "Overdue",    value: overdueCount,    colour: overdueCount > 0 ? "text-red-600" : "text-emerald-600" },
          { label: "Due Today",  value: dueTodayCount,   colour: dueTodayCount > 0 ? "text-orange-600" : "text-[var(--cs-navy)]" },
          { label: "Due Soon",   value: dueSoonCount,    colour: dueSoonCount > 0 ? "text-amber-600" : "text-[var(--cs-navy)]" },
          { label: "Complete",   value: completedCount,  colour: "text-emerald-600" },
        ].map((s) => (
          <div key={s.label} className="px-3 py-2.5 text-center">
            <div className={`text-lg font-bold tabular-nums ${s.colour}`}>{s.value}</div>
            <div className="text-[10px] text-[var(--cs-text-muted)]">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Deadline list */}
      <div className="divide-y divide-[var(--cs-border)]">
        {sorted.map((deadline) => {
          const cfg = STATUS_CONFIG[deadline.status];
          const icon = TYPE_ICONS[deadline.type];

          return (
            <div key={deadline.id} className="px-4 py-3 flex items-start gap-3 hover:bg-slate-50/50 transition-colors">
              <span className={`mt-0.5 ${cfg.colour}`}>{icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-[var(--cs-navy)] line-clamp-1">{deadline.title}</span>
                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium border ${cfg.bg} ${cfg.colour}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                    {cfg.label}
                  </span>
                </div>
                <p className="text-[11px] text-[var(--cs-text-muted)] line-clamp-1 mt-0.5">{deadline.description}</p>
                <div className="flex items-center gap-3 mt-1 text-[10px] text-[var(--cs-text-gentle)]">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-2.5 w-2.5" />
                    {new Date(deadline.dueDate + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  </span>
                  {deadline.regulation && (
                    <span className="flex items-center gap-1">
                      <Shield className="h-2.5 w-2.5" /> {deadline.regulation}
                    </span>
                  )}
                  {deadline.assignedTo && (
                    <span className="flex items-center gap-1">
                      <Users className="h-2.5 w-2.5" /> {deadline.assignedTo}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0">
                {deadline.status === "complete" ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : deadline.daysUntilDue < 0 ? (
                  <span className="text-[11px] font-semibold text-red-600 tabular-nums">
                    {Math.abs(deadline.daysUntilDue)}d overdue
                  </span>
                ) : deadline.daysUntilDue === 0 ? (
                  <span className="text-[11px] font-semibold text-orange-600">Today</span>
                ) : (
                  <span className="text-[11px] font-medium text-[var(--cs-text-secondary)] tabular-nums">
                    {deadline.daysUntilDue}d
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Toggle completed */}
      <div className="px-4 py-2 border-t border-[var(--cs-border)]">
        <button
          className="flex items-center gap-1.5 text-xs text-[var(--cs-text-secondary)] hover:text-[var(--cs-navy)] transition-colors w-full justify-center"
          onClick={() => setShowAll(!showAll)}
        >
          {showAll ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          {showAll ? "Hide" : "Show"} completed ({completedCount})
        </button>
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-[var(--cs-border)] bg-slate-50/50">
        <p className="text-[10px] text-[var(--cs-text-muted)] text-center">
          Cara tracks deadlines from regulations, your Statement of Purpose, and care planning cycles.
        </p>
      </div>
    </div>
  );
}

// ── Testing exports ──────────────────────────────────────────────────────────

export const _testing = { STATUS_CONFIG, TYPE_ICONS, getDemoDeadlines };

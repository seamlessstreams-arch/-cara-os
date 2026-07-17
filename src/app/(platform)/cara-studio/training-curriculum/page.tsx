"use client";

// ══════════════════════════════════════════════════════════════════════════════
// PRACTICE INTELLIGENCE — TRAINING CURRICULUM OVERVIEW
//
// Shows staff competency gaps, learning pathways, completed training,
// and the connection between practice evidence and training delivery.
// Combines Learning Pathways with Practice Intelligence training alerts.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  GraduationCap, Users, TrendingUp, AlertTriangle,
  CheckCircle2, Clock, Target, BookOpen, Award,
  ChevronDown, ChevronRight,
} from "lucide-react";
import { demoSeed } from "@/lib/demo/demo-seed";

// ── Types ───────────────────────────────────────────────────────────────────

interface StaffCompetency {
  staffId: string;
  staffName: string;
  role: string;
  overallProgress: number;
  criticalGaps: number;
  overdueItems: number;
  completedCount: number;
  competencies: { area: string; level: string; nextReview: string | null }[];
}

interface CompetencyGap {
  area: string;
  areaLabel: string;
  staffCount: number;
  priority: "low" | "medium" | "high" | "critical";
  suggestedAction: string;
}

// ── Demo data ───────────────────────────────────────────────────────────────

const DEMO_STAFF: StaffCompetency[] = [
  {
    staffId: "staff-1", staffName: "Sarah Thompson", role: "Senior Residential Care Worker",
    overallProgress: 80, criticalGaps: 0, overdueItems: 0, completedCount: 12,
    competencies: [
      { area: "Safeguarding", level: "proficient", nextReview: "2026-09-01" },
      { area: "Therapeutic Care", level: "competent", nextReview: "2026-08-01" },
      { area: "De-escalation", level: "proficient", nextReview: "2026-10-01" },
      { area: "Recording Practice", level: "competent", nextReview: "2026-07-01" },
      { area: "Medication Management", level: "competent", nextReview: "2026-08-15" },
    ],
  },
  {
    staffId: "staff-2", staffName: "Marcus Williams", role: "Residential Care Worker",
    overallProgress: 45, criticalGaps: 1, overdueItems: 2, completedCount: 5,
    competencies: [
      { area: "Safeguarding", level: "developing", nextReview: "2026-06-01" },
      { area: "Therapeutic Care", level: "developing", nextReview: "2026-06-15" },
      { area: "De-escalation", level: "not_assessed", nextReview: null },
      { area: "Recording Practice", level: "developing", nextReview: "2026-06-01" },
      { area: "Medication Management", level: "competent", nextReview: "2026-09-01" },
    ],
  },
  {
    staffId: "staff-3", staffName: "Jamie Chen", role: "Residential Care Worker",
    overallProgress: 65, criticalGaps: 0, overdueItems: 1, completedCount: 8,
    competencies: [
      { area: "Safeguarding", level: "competent", nextReview: "2026-07-01" },
      { area: "Therapeutic Care", level: "competent", nextReview: "2026-08-01" },
      { area: "De-escalation", level: "developing", nextReview: "2026-06-15" },
      { area: "Recording Practice", level: "developing", nextReview: "2026-06-01" },
      { area: "Medication Management", level: "competent", nextReview: "2026-09-01" },
    ],
  },
];

const DEMO_GAPS: CompetencyGap[] = [
  { area: "de_escalation", areaLabel: "De-escalation", staffCount: 2, priority: "high", suggestedAction: "Generate role-play scenario training" },
  { area: "recording_practice", areaLabel: "Recording Practice", staffCount: 2, priority: "medium", suggestedAction: "Create quick reference card + team briefing" },
  { area: "therapeutic_care", areaLabel: "Therapeutic Care", staffCount: 1, priority: "medium", suggestedAction: "Generate PACE language alternatives resource" },
  { area: "safeguarding", areaLabel: "Safeguarding", staffCount: 1, priority: "high", suggestedAction: "Safeguarding Level 3 refresher quiz" },
];

const LEVEL_STYLES: Record<string, string> = {
  not_assessed: "bg-gray-50 text-gray-600 border-gray-200",
  developing: "bg-amber-50 text-amber-700 border-amber-200",
  competent: "bg-blue-50 text-blue-600 border-blue-200",
  proficient: "bg-emerald-50 text-emerald-700 border-emerald-200",
  expert: "bg-purple-50 text-purple-600 border-purple-200",
};

const PRIORITY_STYLES: Record<string, string> = {
  low: "bg-blue-50 text-blue-600 border-blue-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  high: "bg-red-50 text-red-700 border-red-200",
  critical: "bg-red-100 text-red-800 border-red-300",
};

// ══════════════════════════════════════════════════════════════════════════════

export default function TrainingCurriculumPage() {
  const [staff] = useState(demoSeed(DEMO_STAFF));
  const [gaps] = useState(demoSeed(DEMO_GAPS));
  const [expandedStaff, setExpandedStaff] = useState<Set<string>>(new Set<string>());

  const toggleStaff = (id: string) => {
    setExpandedStaff((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const totalOverdue = staff.reduce((sum, s) => sum + s.overdueItems, 0);
  const totalCritical = staff.reduce((sum, s) => sum + s.criticalGaps, 0);
  const avgProgress = staff.length > 0 ? Math.round(staff.reduce((sum, s) => sum + s.overallProgress, 0) / staff.length) : 0;

  return (
    <PageShell title="Training Curriculum" subtitle="Staff competency & learning pathways">
      <div className="space-y-6 pb-12">

        <div className="rounded-2xl border border-[var(--cs-cara-gold-soft)] bg-gradient-to-r from-[var(--cs-cara-gold-bg)] to-white p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--cs-navy)]">
              <GraduationCap className="h-5 w-5 text-[var(--cs-cara-gold)]" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-bold text-[var(--cs-navy)]">Training & Curriculum</h2>
              <p className="text-xs text-[var(--cs-text-secondary)] mt-0.5">
                Staff competency tracking, learning pathways, and practice-linked training. Cara identifies gaps from real evidence and generates targeted resources.
              </p>
            </div>
          </div>
        </div>

        {/* ── Stats ──────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="rounded-xl border border-[var(--cs-border)] bg-white p-4">
            <p className="text-2xl font-bold text-[var(--cs-navy)]">{staff.length}</p>
            <p className="text-[10px] text-[var(--cs-text-muted)] uppercase tracking-wide mt-1">Staff</p>
          </div>
          <div className="rounded-xl border border-[var(--cs-border)] bg-white p-4">
            <p className="text-2xl font-bold text-[var(--cs-navy)]">{avgProgress}%</p>
            <p className="text-[10px] text-[var(--cs-text-muted)] uppercase tracking-wide mt-1">Avg Progress</p>
          </div>
          <div className={cn("rounded-xl border p-4", totalCritical > 0 ? "border-red-200 bg-red-50" : "border-emerald-200 bg-emerald-50")}>
            <p className={cn("text-2xl font-bold", totalCritical > 0 ? "text-red-700" : "text-emerald-700")}>{totalCritical}</p>
            <p className="text-[10px] uppercase tracking-wide mt-1">Critical Gaps</p>
          </div>
          <div className={cn("rounded-xl border p-4", totalOverdue > 0 ? "border-amber-200 bg-amber-50" : "border-[var(--cs-border)] bg-white")}>
            <p className={cn("text-2xl font-bold", totalOverdue > 0 ? "text-amber-700" : "text-[var(--cs-navy)]")}>{totalOverdue}</p>
            <p className="text-[10px] text-[var(--cs-text-muted)] uppercase tracking-wide mt-1">Overdue</p>
          </div>
          <div className="rounded-xl border border-[var(--cs-border)] bg-white p-4">
            <p className="text-2xl font-bold text-[var(--cs-navy)]">{gaps.length}</p>
            <p className="text-[10px] text-[var(--cs-text-muted)] uppercase tracking-wide mt-1">Competency Gaps</p>
          </div>
        </div>

        {/* ── Competency Gaps ────────────────────────────────────────────── */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-[var(--cs-navy)] uppercase tracking-wide flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" /> Competency Gaps
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {gaps.map((gap) => (
              <div key={gap.area} className="rounded-xl border border-[var(--cs-border)] bg-white p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-[var(--cs-navy)]">{gap.areaLabel}</span>
                  <Badge className={cn("text-[9px] border", PRIORITY_STYLES[gap.priority])}>{gap.priority}</Badge>
                </div>
                <p className="text-xs text-[var(--cs-text-secondary)]">{gap.staffCount} staff member{gap.staffCount !== 1 ? "s" : ""} below expected level</p>
                <div className="flex items-center gap-1.5 text-[10px] text-[var(--cs-cara-gold)]">
                  <Target className="h-3 w-3" />
                  <span className="font-medium">{gap.suggestedAction}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Staff Competency ───────────────────────────────────────────── */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-[var(--cs-navy)] uppercase tracking-wide flex items-center gap-2">
            <Users className="h-4 w-4 text-[var(--cs-navy)]" /> Staff Competency
          </h3>
          {staff.map((s) => {
            const isExpanded = expandedStaff.has(s.staffId);
            return (
              <div key={s.staffId} className="rounded-xl border border-[var(--cs-border)] bg-white overflow-hidden">
                <button onClick={() => toggleStaff(s.staffId)} className="w-full px-5 py-3 flex items-center gap-3 text-left hover:bg-[var(--cs-surface)] transition-colors">
                  {isExpanded ? <ChevronDown className="h-4 w-4 text-[var(--cs-text-muted)]" /> : <ChevronRight className="h-4 w-4 text-[var(--cs-text-muted)]" />}
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--cs-navy)] text-white text-[10px] font-bold">
                    {s.staffName.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-semibold text-[var(--cs-navy)]">{s.staffName}</span>
                    <span className="text-[10px] text-[var(--cs-text-muted)] ml-2">{s.role}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-20">
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className={cn("h-2 rounded-full transition-all", s.overallProgress >= 70 ? "bg-emerald-500" : s.overallProgress >= 40 ? "bg-amber-500" : "bg-red-500")}
                          style={{ width: `${s.overallProgress}%` }} />
                      </div>
                    </div>
                    <span className="text-xs font-bold text-[var(--cs-navy)] w-10 text-right">{s.overallProgress}%</span>
                  </div>
                </button>
                {isExpanded && (
                  <div className="px-5 pb-4 border-t border-[var(--cs-border)]">
                    <div className="pt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {s.competencies.map((c, i) => (
                        <div key={i} className="rounded-lg border border-[var(--cs-border)] p-3 flex items-center justify-between">
                          <div>
                            <p className="text-xs font-medium text-[var(--cs-navy)]">{c.area}</p>
                            {c.nextReview && <p className="text-[10px] text-[var(--cs-text-muted)]">Review: {new Date(c.nextReview).toLocaleDateString("en-GB")}</p>}
                          </div>
                          <Badge className={cn("text-[9px] border", LEVEL_STYLES[c.level])}>{c.level.replace(/_/g, " ")}</Badge>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-4 mt-3 text-[10px] text-[var(--cs-text-muted)]">
                      <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> {s.completedCount} completed</span>
                      {s.overdueItems > 0 && <span className="flex items-center gap-1 text-amber-700"><Clock className="h-3 w-3" /> {s.overdueItems} overdue</span>}
                      {s.criticalGaps > 0 && <span className="flex items-center gap-1 text-red-700"><AlertTriangle className="h-3 w-3" /> {s.criticalGaps} critical</span>}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </PageShell>
  );
}

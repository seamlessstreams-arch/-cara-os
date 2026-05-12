"use client";

// ══════════════════════════════════════════════════════════════════════════════
// ARIA STUDIO — STAFF LEARNING PATHWAYS
//
// Personalised learning dashboards for each staff member. Shows objectives,
// competency gaps, linked training, progress tracking, and manager oversight.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  GraduationCap, Target, CheckCircle2, AlertTriangle,
  Clock, TrendingUp, Users, Sparkles, AlertCircle,
  ChevronDown, ChevronRight, BookOpen,
} from "lucide-react";

// ── Types ───────────────────────────────────────────────────────────────────

interface LearningObjective {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  competencyArea: string;
  dueDate: string | null;
  completedDate: string | null;
}

interface StaffPathway {
  staffId: string;
  staffName: string;
  role: string;
  objectives: LearningObjective[];
  overallProgress: number;
  criticalCount: number;
  overdueCount: number;
  completedCount: number;
}

interface PathwaySummary {
  totalStaff: number;
  averageProgress: number;
  staffWithOverdue: number;
  criticalObjectives: number;
  topCompetencyGaps: { area: string; staffCount: number }[];
  pathways: StaffPathway[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const PRIORITY_STYLES: Record<string, string> = {
  critical: "bg-red-100 text-red-700 border-red-200",
  high: "bg-amber-50 text-amber-700 border-amber-200",
  medium: "bg-blue-50 text-blue-700 border-blue-200",
  low: "bg-gray-50 text-gray-600 border-gray-200",
};

const STATUS_STYLES: Record<string, string> = {
  not_started: "bg-gray-50 text-gray-600 border-gray-200",
  in_progress: "bg-blue-50 text-blue-700 border-blue-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  overdue: "bg-red-50 text-red-700 border-red-200",
};

const COMPETENCY_LABELS: Record<string, string> = {
  safeguarding: "Safeguarding",
  therapeutic_care: "Therapeutic Care",
  behaviour_management: "Behaviour Management",
  recording_practice: "Recording Practice",
  medication_management: "Medication Management",
  key_working: "Key Working",
  risk_assessment: "Risk Assessment",
  professional_boundaries: "Professional Boundaries",
  de_escalation: "De-escalation",
  trauma_informed_practice: "Trauma-Informed Practice",
  attachment_theory: "Attachment Theory",
  child_development: "Child Development",
  mental_health_awareness: "Mental Health",
  first_aid: "First Aid",
  fire_safety: "Fire Safety",
  equality_diversity: "Equality & Diversity",
};

// ══════════════════════════════════════════════════════════════════════════════

export default function LearningPathwaysPage() {
  const [summary, setSummary] = useState<PathwaySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedStaff, setExpandedStaff] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/aria-studio/learning-pathways")
      .then((r) => r.json())
      .then((data) => setSummary(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const toggleStaff = (staffId: string) => {
    setExpandedStaff((prev) => {
      const next = new Set(prev);
      if (next.has(staffId)) next.delete(staffId);
      else next.add(staffId);
      return next;
    });
  };

  return (
    <PageShell title="Learning Pathways" subtitle="Personalised staff development tracking">
      <div className="space-y-6 pb-12">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-[var(--cs-aria-gold-soft)] bg-gradient-to-r from-[var(--cs-aria-gold-bg)] to-white p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--cs-navy)]">
              <GraduationCap className="h-5 w-5 text-[var(--cs-aria-gold)]" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-bold text-[var(--cs-navy)]">Staff Learning Pathways</h2>
              <p className="text-xs text-[var(--cs-text-secondary)] mt-0.5">
                Evidence-led learning objectives built from practice themes, incidents, and training gaps. ARIA links real evidence to targeted development.
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-[var(--cs-border)] bg-white p-12 text-center">
            <Sparkles className="h-8 w-8 animate-pulse text-[var(--cs-aria-gold)] mx-auto mb-3" />
            <p className="text-sm text-[var(--cs-text-muted)]">Loading learning pathways...</p>
          </div>
        ) : summary ? (
          <>
            {/* ── Stats ────────────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="rounded-xl border border-[var(--cs-border)] bg-white p-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <Users className="h-3.5 w-3.5 text-blue-500" />
                  <span className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wide">Staff</span>
                </div>
                <p className="text-2xl font-bold text-[var(--cs-navy)]">{summary.totalStaff}</p>
              </div>
              <div className={cn("rounded-xl border p-4", summary.averageProgress >= 60 ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50")}>
                <div className="flex items-center gap-1.5 mb-2">
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wide">Avg Progress</span>
                </div>
                <p className={cn("text-2xl font-bold", summary.averageProgress >= 60 ? "text-emerald-700" : "text-amber-700")}>{summary.averageProgress}%</p>
              </div>
              <div className={cn("rounded-xl border p-4", summary.staffWithOverdue > 0 ? "border-red-200 bg-red-50" : "border-[var(--cs-border)] bg-white")}>
                <div className="flex items-center gap-1.5 mb-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                  <span className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wide">Overdue</span>
                </div>
                <p className={cn("text-2xl font-bold", summary.staffWithOverdue > 0 ? "text-red-700" : "text-[var(--cs-navy)]")}>{summary.staffWithOverdue}</p>
              </div>
              <div className={cn("rounded-xl border p-4", summary.criticalObjectives > 0 ? "border-red-200 bg-red-50" : "border-[var(--cs-border)] bg-white")}>
                <div className="flex items-center gap-1.5 mb-2">
                  <AlertCircle className="h-3.5 w-3.5 text-red-600" />
                  <span className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wide">Critical</span>
                </div>
                <p className={cn("text-2xl font-bold", summary.criticalObjectives > 0 ? "text-red-700" : "text-[var(--cs-navy)]")}>{summary.criticalObjectives}</p>
              </div>
            </div>

            {/* ── Top competency gaps ──────────────────────────────────────── */}
            {summary.topCompetencyGaps.length > 0 && (
              <div className="rounded-2xl border border-[var(--cs-border)] bg-white p-5 space-y-3">
                <h3 className="text-xs font-semibold text-[var(--cs-navy)] uppercase tracking-wide">Top Competency Gaps</h3>
                <div className="space-y-2">
                  {summary.topCompetencyGaps.map(({ area, staffCount }) => (
                    <div key={area} className="flex items-center gap-3">
                      <span className="text-xs font-medium text-[var(--cs-text-secondary)] w-48 shrink-0">
                        {COMPETENCY_LABELS[area] ?? area.replace(/_/g, " ")}
                      </span>
                      <div className="flex-1 h-2 bg-[var(--cs-surface)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full"
                          style={{ width: `${Math.min(100, (staffCount / summary.totalStaff) * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-amber-600 min-w-[4rem] text-right">{staffCount} staff</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Staff pathways ───────────────────────────────────────────── */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-[var(--cs-navy)] uppercase tracking-wide">Individual Pathways</h3>
              {summary.pathways.map((pathway) => {
                const isExpanded = expandedStaff.has(pathway.staffId);
                return (
                  <div key={pathway.staffId} className="rounded-xl border border-[var(--cs-border)] bg-white overflow-hidden">
                    <button
                      onClick={() => toggleStaff(pathway.staffId)}
                      className="w-full flex items-center gap-3 p-4 hover:bg-[var(--cs-surface)] transition-colors"
                    >
                      {isExpanded ? <ChevronDown className="h-4 w-4 text-[var(--cs-text-muted)]" /> : <ChevronRight className="h-4 w-4 text-[var(--cs-text-muted)]" />}
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-[var(--cs-navy)]">{pathway.staffName}</span>
                          <Badge className="text-[9px] bg-[var(--cs-surface)] text-[var(--cs-text-muted)] border-[var(--cs-border)]">
                            {pathway.role.replace(/_/g, " ")}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {pathway.overdueCount > 0 && (
                          <Badge className="text-[9px] bg-red-50 text-red-700 border-red-200">{pathway.overdueCount} overdue</Badge>
                        )}
                        {pathway.criticalCount > 0 && (
                          <Badge className="text-[9px] bg-red-100 text-red-700 border-red-300">{pathway.criticalCount} critical</Badge>
                        )}
                        <div className="flex items-center gap-2 min-w-[8rem]">
                          <div className="flex-1 h-2 bg-[var(--cs-surface)] rounded-full overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full",
                                pathway.overallProgress >= 70 ? "bg-emerald-500" : pathway.overallProgress >= 40 ? "bg-amber-500" : "bg-red-400",
                              )}
                              style={{ width: `${pathway.overallProgress}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-[var(--cs-text-secondary)]">{pathway.overallProgress}%</span>
                        </div>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-[var(--cs-border)] p-4 space-y-2">
                        {pathway.objectives.map((obj) => (
                          <div key={obj.id} className="flex items-start gap-3 rounded-lg border border-[var(--cs-border-subtle)] p-3">
                            {obj.status === "completed" ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                            ) : obj.status === "overdue" ? (
                              <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                            ) : obj.status === "in_progress" ? (
                              <Clock className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                            ) : (
                              <Target className="h-4 w-4 text-[var(--cs-text-muted)] shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-semibold text-[var(--cs-navy)]">{obj.title}</span>
                                <Badge className={cn("text-[9px] border", PRIORITY_STYLES[obj.priority])}>{obj.priority}</Badge>
                                <Badge className={cn("text-[9px] border", STATUS_STYLES[obj.status])}>{obj.status.replace(/_/g, " ")}</Badge>
                              </div>
                              <p className="text-[11px] text-[var(--cs-text-muted)] mt-0.5 leading-relaxed">{obj.description}</p>
                              <div className="flex items-center gap-3 mt-1 text-[10px] text-[var(--cs-text-muted)]">
                                <span>{COMPETENCY_LABELS[obj.competencyArea] ?? obj.competencyArea}</span>
                                {obj.dueDate && <span>Due: {new Date(obj.dueDate).toLocaleDateString("en-GB")}</span>}
                                {obj.completedDate && <span>Completed: {new Date(obj.completedDate).toLocaleDateString("en-GB")}</span>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        ) : null}
      </div>
    </PageShell>
  );
}

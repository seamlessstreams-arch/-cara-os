"use client";

// ══════════════════════════════════════════════════════════════════════════════
// Cara STUDIO — OUTCOME LOOP DASHBOARD
//
// Tracks whether Cara's outputs lead to real outcomes. Shows completion rates
// for committed artifacts and their linked actions. Helps managers see
// the real-world impact of Cara-generated content over time.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  BarChart3, CheckCircle2, Clock, Target, TrendingUp,
  AlertCircle, Sparkles, ArrowRight, Percent,
} from "lucide-react";

// ── Types ───────────────────────────────────────────────────────────────────

interface OutcomeLoopSummary {
  totalCommitted: number;
  withActions: number;
  actionsCompleted: number;
  actionsTotal: number;
  completionRate: number;
  followUpRate: number;
  byType: { type: string; count: number; completionRate: number }[];
}

// ── Artifact type labels ────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  management_oversight: "Management Oversight",
  keywork_session: "Key Work Session",
  risk_review: "Risk Review",
  action_plan: "Action Plan",
  safeguarding_review: "Safeguarding Review",
  incident_learning_review: "Incident Learning",
  staff_training: "Staff Training",
  reg45_summary: "Reg 45 Summary",
  social_worker_update: "Social Worker Update",
};

// ══════════════════════════════════════════════════════════════════════════════

export default function OutcomeLoopPage() {
  const [summary, setSummary] = useState<OutcomeLoopSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/cara-studio/outcome-loop")
      .then((r) => r.json())
      .then((data) => setSummary(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <PageShell title="Outcome Loop" subtitle="Tracking real-world impact of Cara outputs">
      <div className="space-y-6 pb-12">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-[var(--cs-cara-gold-soft)] bg-gradient-to-r from-[var(--cs-cara-gold-bg)] to-white p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--cs-navy)]">
              <Target className="h-5 w-5 text-[var(--cs-cara-gold)]" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-bold text-[var(--cs-navy)]">Outcome Loop</h2>
              <p className="text-xs text-[var(--cs-text-secondary)] mt-0.5">
                Did the action plan get completed? Did the key work session happen? Track whether Cara outputs lead to real outcomes.
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-[var(--cs-border)] bg-white p-12 text-center">
            <Sparkles className="h-8 w-8 animate-pulse text-[var(--cs-cara-gold)] mx-auto mb-3" />
            <p className="text-sm text-[var(--cs-text-muted)]">Loading outcome data...</p>
          </div>
        ) : summary ? (
          <>
            {/* ── Summary stats ────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="rounded-xl border border-[var(--cs-border)] bg-white p-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />
                  <span className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wide">Committed</span>
                </div>
                <p className="text-2xl font-bold text-[var(--cs-navy)]">{summary.totalCommitted}</p>
              </div>
              <div className="rounded-xl border border-[var(--cs-border)] bg-white p-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <Target className="h-3.5 w-3.5 text-[var(--cs-cara-gold)]" />
                  <span className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wide">With Actions</span>
                </div>
                <p className="text-2xl font-bold text-[var(--cs-navy)]">{summary.withActions}</p>
              </div>
              <div className="rounded-xl border border-[var(--cs-border)] bg-white p-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <BarChart3 className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wide">Actions Done</span>
                </div>
                <p className="text-2xl font-bold text-[var(--cs-navy)]">{summary.actionsCompleted}/{summary.actionsTotal}</p>
              </div>
              <div className={cn("rounded-xl border p-4", summary.completionRate >= 70 ? "border-emerald-200 bg-emerald-50" : summary.completionRate >= 50 ? "border-amber-200 bg-amber-50" : "border-red-200 bg-red-50")}>
                <div className="flex items-center gap-1.5 mb-2">
                  <Percent className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wide">Completion</span>
                </div>
                <p className={cn("text-2xl font-bold", summary.completionRate >= 70 ? "text-emerald-700" : summary.completionRate >= 50 ? "text-amber-700" : "text-red-700")}>
                  {summary.completionRate}%
                </p>
              </div>
              <div className={cn("rounded-xl border p-4", summary.followUpRate >= 70 ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50")}>
                <div className="flex items-center gap-1.5 mb-2">
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wide">Follow-up</span>
                </div>
                <p className={cn("text-2xl font-bold", summary.followUpRate >= 70 ? "text-emerald-700" : "text-amber-700")}>
                  {summary.followUpRate}%
                </p>
              </div>
              <div className="rounded-xl border border-[var(--cs-border)] bg-white p-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <Clock className="h-3.5 w-3.5 text-[var(--cs-text-muted)]" />
                  <span className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wide">Types</span>
                </div>
                <p className="text-2xl font-bold text-[var(--cs-navy)]">{summary.byType.length}</p>
              </div>
            </div>

            {/* ── Completion progress bar ──────────────────────────────────── */}
            <div className="rounded-2xl border border-[var(--cs-border)] bg-white p-5 space-y-4">
              <h3 className="text-xs font-semibold text-[var(--cs-navy)] uppercase tracking-wide">Overall Action Completion</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-4 bg-[var(--cs-surface)] rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        summary.completionRate >= 70 ? "bg-emerald-500" : summary.completionRate >= 50 ? "bg-amber-500" : "bg-red-500",
                      )}
                      style={{ width: `${summary.completionRate}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-[var(--cs-navy)] min-w-[3rem] text-right">{summary.completionRate}%</span>
                </div>
                <p className="text-xs text-[var(--cs-text-muted)]">
                  {summary.actionsCompleted} of {summary.actionsTotal} actions completed across {summary.withActions} artifacts with linked actions.
                </p>
              </div>
            </div>

            {/* ── Breakdown by type ───────────────────────────────────────── */}
            <div className="rounded-2xl border border-[var(--cs-border)] bg-white p-5 space-y-4">
              <h3 className="text-xs font-semibold text-[var(--cs-navy)] uppercase tracking-wide">Completion by Artifact Type</h3>
              <div className="space-y-3">
                {summary.byType.map(({ type, count, completionRate }) => (
                  <div key={type} className="flex items-center gap-3">
                    <span className="text-xs font-medium text-[var(--cs-text-secondary)] w-40 shrink-0">
                      {TYPE_LABELS[type] ?? type.replace(/_/g, " ")}
                    </span>
                    <Badge className="text-[9px] bg-[var(--cs-surface)] text-[var(--cs-text-muted)] border-[var(--cs-border)] shrink-0">{count}</Badge>
                    <div className="flex-1 h-2.5 bg-[var(--cs-surface)] rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          completionRate >= 70 ? "bg-emerald-500" : completionRate >= 50 ? "bg-amber-500" : "bg-red-400",
                        )}
                        style={{ width: `${completionRate}%` }}
                      />
                    </div>
                    <span className={cn("text-xs font-bold min-w-[2.5rem] text-right", completionRate >= 70 ? "text-emerald-600" : completionRate >= 50 ? "text-amber-600" : "text-red-500")}>
                      {completionRate}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Impact insight ───────────────────────────────────────────── */}
            <div className="rounded-2xl border border-[var(--cs-cara-gold-soft)] bg-[var(--cs-cara-gold-bg)] p-5">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-[var(--cs-cara-gold)] shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-[var(--cs-navy)]">Impact Insight</h3>
                  <p className="text-xs text-[var(--cs-text-secondary)] mt-1 leading-relaxed">
                    {summary.completionRate >= 75
                      ? "Strong outcome loop — the majority of Cara-generated actions are being completed. This indicates good integration between Cara outputs and daily practice."
                      : summary.completionRate >= 50
                        ? "Moderate outcome loop — over half of actions are being completed but there is room for improvement. Consider reviewing which artifact types have lower completion rates and whether actions are realistic and achievable."
                        : "The outcome loop needs attention — fewer than half of Cara-generated actions are being completed. This may indicate that actions are too ambitious, staff capacity is stretched, or follow-up processes need strengthening."}
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </PageShell>
  );
}

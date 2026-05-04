"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — CARE PLAN DETAIL
// Single care plan: domain overview, goals, evidence, ARIA analysis.
// Care Planning, Placement and Case Review (England) Regulations 2010.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, use, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatDate } from "@/lib/utils";
import { useCarePlan, useUpdateCarePlan } from "@/hooks/use-care-plans";
import { useStaff } from "@/hooks/use-staff";
import { useDailyLog } from "@/hooks/use-daily-log";
import { useIncidents } from "@/hooks/use-incidents";
import { getYPName } from "@/lib/seed-data";
import { api } from "@/hooks/use-api";
import { PrintButton } from "@/components/common/print-button";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";
import type { CarePlanGoal, CarePlanGoalStatus, CarePlanDomain } from "@/types/extended";
import {
  ArrowLeft, Heart, GraduationCap, Brain, Fingerprint, Users,
  Zap, Home, Shield, CheckCircle2, Clock, AlertTriangle,
  ChevronDown, ChevronUp, Calendar, Sparkles, ArrowRight,
  BookOpen, Loader2, X, Activity, User,
} from "lucide-react";
import Link from "next/link";

// ── Domain config ─────────────────────────────────────────────────────────────

const DOMAIN_CONFIG: Record<CarePlanDomain, {
  label: string;
  icon: React.ElementType;
  colour: string;
  bg: string;
  border: string;
  ring: string;
}> = {
  health:                { label: "Health",                icon: Heart,         colour: "text-rose-600",    bg: "bg-rose-50",    border: "border-rose-200",   ring: "ring-rose-200"   },
  education:             { label: "Education",             icon: GraduationCap, colour: "text-blue-600",    bg: "bg-blue-50",    border: "border-blue-200",   ring: "ring-blue-200"   },
  emotional_behavioural: { label: "Emotional & Behavioural", icon: Brain,       colour: "text-violet-600",  bg: "bg-violet-50",  border: "border-violet-200", ring: "ring-violet-200" },
  identity:              { label: "Identity & Culture",    icon: Fingerprint,   colour: "text-amber-600",   bg: "bg-amber-50",   border: "border-amber-200",  ring: "ring-amber-200"  },
  family_social:         { label: "Family & Social",       icon: Users,         colour: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200",ring: "ring-emerald-200"},
  independence:          { label: "Independence",          icon: Zap,           colour: "text-sky-600",     bg: "bg-sky-50",     border: "border-sky-200",    ring: "ring-sky-200"    },
  placement_stability:   { label: "Placement Stability",   icon: Home,          colour: "text-slate-600",   bg: "bg-slate-100",  border: "border-slate-300",  ring: "ring-slate-300"  },
  safety:                { label: "Safety",                icon: Shield,        colour: "text-red-600",     bg: "bg-red-50",     border: "border-red-200",    ring: "ring-red-200"    },
};

const ALL_DOMAINS = Object.keys(DOMAIN_CONFIG) as CarePlanDomain[];

const GOAL_STATUS_CONFIG: Record<CarePlanGoalStatus, {
  label: string;
  colour: string;
  icon: React.ElementType;
}> = {
  not_started:      { label: "Not Started",      colour: "text-slate-600 bg-slate-100 border-slate-200",                icon: Clock         },
  in_progress:      { label: "In Progress",      colour: "text-blue-700 bg-blue-50 border-blue-200",                   icon: Clock         },
  on_track:         { label: "On Track",         colour: "text-emerald-700 bg-emerald-50 border-emerald-200",          icon: CheckCircle2  },
  attention_needed: { label: "Attention Needed", colour: "text-red-700 bg-red-50 border-red-200",                      icon: AlertTriangle },
  achieved:         { label: "Achieved",         colour: "text-emerald-800 bg-emerald-100 border-emerald-300",         icon: CheckCircle2  },
  closed:           { label: "Closed",           colour: "text-slate-500 bg-slate-50 border-slate-200",                icon: CheckCircle2  },
};

const LOG_TYPE_COLOURS: Record<string, string> = {
  general:   "bg-slate-100 text-slate-600",
  behaviour: "bg-orange-100 text-orange-700",
  health:    "bg-red-100 text-red-700",
  education: "bg-blue-100 text-blue-700",
  contact:   "bg-violet-100 text-violet-700",
  activity:  "bg-emerald-100 text-emerald-700",
  mood:      "bg-amber-100 text-amber-700",
  sleep:     "bg-indigo-100 text-indigo-700",
  food:      "bg-teal-100 text-teal-700",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function lacCountdown(dateStr: string | null): { days: number; label: string; colour: string } | null {
  if (!dateStr) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr); target.setHours(0, 0, 0, 0);
  const days = Math.round((target.getTime() - today.getTime()) / 86400000);
  if (days < 0)  return { days, label: `${Math.abs(days)}d overdue`, colour: "text-red-700 bg-red-50 border-red-200" };
  if (days === 0) return { days, label: "Today",                      colour: "text-red-700 bg-red-50 border-red-200" };
  if (days <= 14) return { days, label: `in ${days}d`,               colour: "text-amber-700 bg-amber-50 border-amber-200" };
  return { days, label: `in ${days}d`, colour: "text-slate-600 bg-slate-50 border-slate-200" };
}

function domainRAG(goals: CarePlanGoal[], domain: CarePlanDomain): "green" | "amber" | "red" | "none" {
  const dGoals = goals.filter((g) => g.domain === domain);
  if (!dGoals.length) return "none";
  if (dGoals.some((g) => g.status === "attention_needed")) return "red";
  if (dGoals.some((g) => g.status === "not_started" || g.status === "in_progress")) return "amber";
  return "green";
}

// ── Domain Overview Card ──────────────────────────────────────────────────────

function DomainCard({
  domain, goals, isActive, onClick,
}: {
  domain: CarePlanDomain;
  goals: CarePlanGoal[];
  isActive: boolean;
  onClick: () => void;
}) {
  const cfg    = DOMAIN_CONFIG[domain];
  const Icon   = cfg.icon;
  const dGoals = goals.filter((g) => g.domain === domain);
  const rag    = domainRAG(goals, domain);
  const ragDot = rag === "red" ? "bg-red-500" : rag === "amber" ? "bg-amber-400" : rag === "green" ? "bg-emerald-500" : "bg-slate-300";
  const attentionCount = dGoals.filter((g) => g.status === "attention_needed").length;

  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-2xl border p-3 text-left transition-all hover:shadow-sm w-full",
        isActive
          ? `${cfg.bg} ${cfg.border} shadow-sm ring-1 ${cfg.ring}`
          : "bg-white border-slate-200 hover:border-slate-300",
      )}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <Icon className={cn("h-3.5 w-3.5 shrink-0", isActive ? cfg.colour : "text-slate-400")} />
        <span className={cn("text-[11px] font-semibold leading-tight flex-1", isActive ? cfg.colour : "text-slate-700")}>{cfg.label}</span>
        <div className={cn("h-2 w-2 rounded-full shrink-0", ragDot)} />
      </div>
      <div className="text-[10px] text-slate-500">
        {dGoals.length === 0
          ? "No goals set"
          : `${dGoals.length} goal${dGoals.length !== 1 ? "s" : ""}${attentionCount > 0 ? ` · ${attentionCount} ⚠` : ""}`}
      </div>
    </button>
  );
}

// ── Goal Card ─────────────────────────────────────────────────────────────────

function GoalCard({
  goal, onStatusChange, updating,
}: {
  goal: CarePlanGoal;
  onStatusChange: (goalId: string, status: CarePlanGoalStatus) => void;
  updating: boolean;
}) {
  const [open, setOpen]                     = useState(false);
  const [showStatusPicker, setShowPicker]   = useState(false);
  const cfg       = GOAL_STATUS_CONFIG[goal.status];
  const StatusIcon = cfg.icon;
  const domainCfg = DOMAIN_CONFIG[goal.domain];

  return (
    <div className={cn(
      "rounded-2xl border bg-white overflow-hidden transition-shadow hover:shadow-sm",
      goal.status === "attention_needed" ? "border-red-200"
        : goal.status === "on_track" || goal.status === "achieved" ? "border-emerald-200"
        : "border-slate-200",
    )}>
      {/* Header */}
      <div
        className="flex items-start gap-3 p-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <StatusIcon className={cn(
          "h-4 w-4 shrink-0 mt-0.5",
          goal.status === "attention_needed" ? "text-red-500"
            : goal.status === "on_track" || goal.status === "achieved" ? "text-emerald-500"
            : "text-slate-400",
        )} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-sm font-semibold text-slate-900">{goal.title}</span>
            <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 border", domainCfg.bg, domainCfg.border, domainCfg.colour)}>
              {domainCfg.label}
            </Badge>
            <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 border", cfg.colour)}>
              {cfg.label}
            </Badge>
          </div>
          {!open && goal.progress_note && (
            <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{goal.progress_note}</p>
          )}
          {!open && goal.target_date && (
            <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
              <Calendar className="h-2.5 w-2.5" />Target: {formatDate(goal.target_date)}
            </p>
          )}
        </div>
        {open
          ? <ChevronUp className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
          : <ChevronDown className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
        }
      </div>

      {/* Expanded detail */}
      {open && (
        <div className="border-t border-slate-100 px-4 pb-4 pt-3 space-y-3">
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Description</p>
            <p className="text-sm text-slate-700 leading-relaxed">{goal.description}</p>
          </div>

          <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-3">
            <p className="text-[10px] font-semibold text-indigo-700 uppercase tracking-wide mb-1">Desired Outcome</p>
            <p className="text-sm text-indigo-900 leading-relaxed">{goal.desired_outcome}</p>
          </div>

          {goal.actions.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Actions</p>
              <ul className="space-y-1">
                {goal.actions.map((a, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                    <ArrowRight className="h-3 w-3 text-slate-300 mt-0.5 shrink-0" />
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {goal.progress_note && (
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Latest Progress</p>
              <p className="text-sm text-slate-700 leading-relaxed">{goal.progress_note}</p>
            </div>
          )}

          {goal.evidence && (
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3">
              <p className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wide mb-1">Evidence</p>
              <p className="text-xs text-emerald-900 leading-relaxed">{goal.evidence}</p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-4 pt-1 text-[10px] text-slate-400 border-t border-slate-50">
            {goal.target_date && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />Target: {formatDate(goal.target_date)}
              </span>
            )}
            {goal.achieved_date && (
              <span className="flex items-center gap-1 text-emerald-600">
                <CheckCircle2 className="h-3 w-3" />Achieved: {formatDate(goal.achieved_date)}
              </span>
            )}
            {goal.last_reviewed && (
              <span>Reviewed: {formatDate(goal.last_reviewed)}</span>
            )}
          </div>

          {/* Inline status update */}
          <div className="flex items-start gap-2 pt-1">
            {showStatusPicker ? (
              <div className="flex flex-wrap gap-1.5 items-center">
                <span className="text-[10px] text-slate-500 shrink-0">Change to:</span>
                {(["not_started", "in_progress", "on_track", "attention_needed", "achieved", "closed"] as CarePlanGoalStatus[])
                  .filter((s) => s !== goal.status)
                  .map((s) => {
                    const sCfg = GOAL_STATUS_CONFIG[s];
                    return (
                      <button
                        key={s}
                        disabled={updating}
                        onClick={() => { onStatusChange(goal.id, s); setShowPicker(false); }}
                        className={cn(
                          "rounded-full border px-2.5 py-1 text-[10px] font-semibold transition-all hover:opacity-80 disabled:opacity-40",
                          sCfg.colour,
                        )}
                      >
                        {sCfg.label}
                      </button>
                    );
                  })}
                <button
                  onClick={() => setShowPicker(false)}
                  className="rounded-full border border-slate-200 px-2 py-1 text-slate-500 hover:bg-slate-50"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </div>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs gap-1.5"
                onClick={(e) => { e.stopPropagation(); setShowPicker(true); }}
                disabled={updating}
              >
                Update Status
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function CarePlanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [selectedDomain, setSelectedDomain] = useState<CarePlanDomain | "all">("all");
  const [ariaOverview, setAriaOverview]     = useState<string | null>(null);
  const [ariaLoading, setAriaLoading]       = useState(false);
  const [updatingGoalId, setUpdatingGoalId] = useState<string | null>(null);

  const planQuery  = useCarePlan(id);
  const staffQuery = useStaff();
  const updatePlan = useUpdateCarePlan();

  // Always call hooks unconditionally — filter client-side once data loads
  const allIncidentsQuery = useIncidents();
  const allLogsQuery      = useDailyLog({ days: 30 });

  const plan      = planQuery.data?.data;
  const staffList = staffQuery.data?.data ?? [];

  const getStaff = (sid: string | null | undefined) =>
    staffList.find((s) => s.id === sid)?.full_name ?? sid ?? "—";

  const ypName = plan ? getYPName(plan.child_id) : "";
  const lac    = plan ? lacCountdown(plan.next_lac_review) : null;

  // Filtered data for this child
  const childIncidents = useMemo(() => {
    if (!plan) return [];
    return (allIncidentsQuery.data?.data ?? []).filter((i) => i.child_id === plan.child_id);
  }, [allIncidentsQuery.data, plan]);

  const childLogs = useMemo(() => {
    if (!plan) return [];
    return (allLogsQuery.data?.data ?? []).filter((l) => l.child_id === plan.child_id);
  }, [allLogsQuery.data, plan]);

  const filteredGoals = useMemo(() => {
    if (!plan) return [];
    return selectedDomain === "all"
      ? plan.goals
      : plan.goals.filter((g) => g.domain === selectedDomain);
  }, [plan, selectedDomain]);

  const openIncidents   = childIncidents.filter((i) => i.status === "open").slice(0, 4);
  const recentLogs      = childLogs.slice(0, 6);

  const attentionCount  = plan?.goals.filter((g) => g.status === "attention_needed").length ?? 0;
  const onTrackCount    = plan?.goals.filter((g) => g.status === "on_track").length ?? 0;
  const achievedCount   = plan?.goals.filter((g) => g.status === "achieved").length ?? 0;
  const totalGoals      = plan?.goals.length ?? 0;

  async function handleStatusChange(goalId: string, newStatus: CarePlanGoalStatus) {
    if (!plan) return;
    setUpdatingGoalId(goalId);
    try {
      const updatedGoals = plan.goals.map((g) =>
        g.id === goalId ? { ...g, status: newStatus } : g,
      );
      await updatePlan.mutateAsync({ id: plan.id, data: { goals: updatedGoals } });
    } finally {
      setUpdatingGoalId(null);
    }
  }

  async function generateAriaOverview() {
    if (!plan) return;
    setAriaLoading(true);
    setAriaOverview(null);
    try {
      const goalSummary = plan.goals
        .map((g) => `${g.title} (${g.domain.replace(/_/g, " ")}): ${g.status.replace(/_/g, " ")}`)
        .join("; ");
      const res = await api.post<{ data: { response?: string } }>("/aria", {
        mode: "care_plan_overview",
        style: "clinical_summary",
        source_content: `Care plan for ${ypName}. Legal status: ${plan.legal_status}. Version ${plan.version}. Goals: ${goalSummary}. Strengths: ${plan.strengths_summary ?? "not recorded"}. Concerns: ${plan.concerns_summary ?? "not recorded"}.`,
        page_context: "Care Plan Review",
        record_type: "care_plan",
        user_role: "registered_manager",
      });
      setAriaOverview(res.data?.response ?? null);
    } catch {
      // silently fail
    } finally {
      setAriaLoading(false);
    }
  }

  // ── Loading / not found ────────────────────────────────────────────────────

  if (planQuery.isPending) {
    return (
      <PageShell title="Care Plan" subtitle="Loading…">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      </PageShell>
    );
  }

  if (!plan) {
    return (
      <PageShell title="Care Plan" subtitle="Record not found">
        <div className="text-center py-16 text-slate-400">
          <BookOpen className="h-10 w-10 mx-auto mb-3 text-slate-300" />
          <p className="text-sm font-medium text-slate-600">Care plan not found</p>
          <Link href="/care-plans" className="text-xs text-indigo-600 hover:underline mt-2 inline-block">
            Back to Care Plans
          </Link>
        </div>
      </PageShell>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <PageShell
      title={`${ypName} — Care Plan`}
      subtitle={`v${plan.version} · ${plan.legal_status} · Updated ${formatDate(plan.updated_at)}`}
      quickCreateContext={{ module: "care_plans", defaultTaskCategory: "young_person_plans" }}
      ariaContext={{ pageTitle: `Care Plan — ${ypName}`, sourceType: "care_plan" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Care Plan" subtitle="Oak House — Care Plan Detail" targetId="care-plan-detail-content" />
          <Link href="/care-plans">
            <Button variant="outline" size="sm" className="gap-1.5">
              <ArrowLeft className="h-3.5 w-3.5" />Back
            </Button>
          </Link>
          <SmartUploadButton
            variant="inline"
            label="Upload Evidence"
            uploadContext={`Care plan evidence — ${ypName}`}
          />
          <Button
            size="sm"
            className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
            onClick={generateAriaOverview}
            disabled={ariaLoading}
          >
            <Sparkles className="h-3.5 w-3.5" />
            {ariaLoading ? "Analysing…" : "ARIA Overview"}
          </Button>
        </div>
      }
    >
      <div id="care-plan-detail-content" className="space-y-6 animate-fade-in">

        {/* ── ARIA Overview (when generated) ── */}
        {ariaOverview && (
          <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-violet-50 p-5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-600" />
                <p className="text-sm font-semibold text-indigo-900">ARIA Care Plan Overview</p>
              </div>
              <button onClick={() => setAriaOverview(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm text-indigo-800 leading-relaxed">{ariaOverview}</p>
          </div>
        )}

        {/* ── Hero stats strip ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Goals",       value: totalGoals,       colour: "text-slate-800",   bg: "border-slate-200 bg-white" },
            { label: "Attention Needed",  value: attentionCount,   colour: attentionCount > 0 ? "text-red-600" : "text-slate-400",    bg: attentionCount > 0 ? "border-red-200 bg-red-50" : "border-slate-200 bg-white" },
            { label: "On Track",          value: onTrackCount,     colour: "text-emerald-600", bg: "border-emerald-200 bg-emerald-50" },
            { label: "Achieved",          value: achievedCount,    colour: "text-emerald-700", bg: "border-emerald-200 bg-white" },
          ].map(({ label, value, colour, bg }) => (
            <div key={label} className={cn("rounded-2xl border p-4 text-center", bg)}>
              <p className={cn("text-2xl font-bold tabular-nums", colour)}>{value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* ── Plan metadata ── */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-start gap-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-slate-400" />
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wide">Key Worker</p>
                <p className="text-sm font-semibold text-slate-800">{getStaff(plan.keyworker_id)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-slate-400" />
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wide">Registered Manager</p>
                <p className="text-sm font-semibold text-slate-800">{getStaff(plan.rm_id)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-slate-400" />
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wide">Placement Start</p>
                <p className="text-sm font-semibold text-slate-800">{formatDate(plan.placement_start)}</p>
              </div>
            </div>
            {lac && (
              <div className="flex items-center gap-2 ml-auto">
                <Calendar className="h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide">Next LAC Review</p>
                  <Badge variant="outline" className={cn("text-xs border font-semibold mt-0.5", lac.colour)}>
                    {formatDate(plan.next_lac_review!)} · {lac.label}
                  </Badge>
                </div>
              </div>
            )}
            {plan.rm_sign_off_date && (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide">RM Sign-off</p>
                  <p className="text-sm font-semibold text-emerald-700">{formatDate(plan.rm_sign_off_date)}</p>
                </div>
              </div>
            )}
          </div>

          {/* Strengths / concerns */}
          {(plan.strengths_summary || plan.concerns_summary) && (
            <div className="grid sm:grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-100">
              {plan.strengths_summary && (
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3">
                  <p className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wide mb-1">Strengths</p>
                  <p className="text-xs text-emerald-900 leading-relaxed">{plan.strengths_summary}</p>
                </div>
              )}
              {plan.concerns_summary && (
                <div className="rounded-xl border border-amber-100 bg-amber-50/40 p-3">
                  <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wide mb-1">Concerns</p>
                  <p className="text-xs text-amber-900 leading-relaxed">{plan.concerns_summary}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Domain overview grid ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">8 Care Domains</h2>
            {selectedDomain !== "all" && (
              <button
                onClick={() => setSelectedDomain("all")}
                className="text-xs text-indigo-600 hover:underline"
              >
                Show all
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {ALL_DOMAINS.map((domain) => (
              <DomainCard
                key={domain}
                domain={domain}
                goals={plan.goals}
                isActive={selectedDomain === domain}
                onClick={() => setSelectedDomain((prev) => prev === domain ? "all" : domain)}
              />
            ))}
          </div>
        </div>

        {/* ── Goals list ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
              {selectedDomain === "all"
                ? `All Goals (${filteredGoals.length})`
                : `${DOMAIN_CONFIG[selectedDomain].label} Goals (${filteredGoals.length})`}
            </h2>
            <Link href={`/young-people/${plan.child_id}`} className="text-xs text-indigo-600 hover:underline">
              View YP profile →
            </Link>
          </div>

          {filteredGoals.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
              <BookOpen className="h-8 w-8 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-medium text-slate-700">No goals in this domain</p>
              <p className="text-xs text-slate-400 mt-1">Goals for this domain haven't been set yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredGoals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onStatusChange={handleStatusChange}
                  updating={updatingGoalId === goal.id}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Evidence strip: recent logs + incidents ── */}
        <div className="grid gap-4 md:grid-cols-2">

          {/* Recent daily log entries */}
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 bg-slate-50">
              <Activity className="h-4 w-4 text-slate-500" />
              <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Recent Log Entries</p>
              <span className="ml-auto text-[10px] text-slate-400">Last 30 days</span>
            </div>
            {recentLogs.length === 0 ? (
              <div className="p-6 text-center text-slate-400">
                <p className="text-xs">No log entries in the last 30 days</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {recentLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 px-4 py-2.5">
                    <span className={cn(
                      "rounded-full px-1.5 py-0.5 text-[9px] font-semibold shrink-0 mt-0.5 capitalize",
                      LOG_TYPE_COLOURS[log.entry_type] ?? "bg-slate-100 text-slate-600",
                    )}>
                      {log.entry_type}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-700 line-clamp-2 leading-relaxed">{log.content}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{formatDate(log.date)} · {log.time}</p>
                    </div>
                    {log.is_significant && (
                      <div className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0 mt-1.5" title="Significant entry" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Open incidents */}
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 bg-slate-50">
              <AlertTriangle className="h-4 w-4 text-slate-500" />
              <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Open Incidents</p>
              <Link href="/incidents" className="ml-auto text-[10px] text-indigo-600 hover:underline">View all →</Link>
            </div>
            {openIncidents.length === 0 ? (
              <div className="p-6 text-center text-slate-400">
                <CheckCircle2 className="h-6 w-6 mx-auto mb-1 text-emerald-300" />
                <p className="text-xs">No open incidents</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {openIncidents.map((inc) => (
                  <Link
                    key={inc.id}
                    href={`/incidents/${inc.id}`}
                    className="flex items-start gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors"
                  >
                    <AlertTriangle className={cn(
                      "h-3.5 w-3.5 shrink-0 mt-0.5",
                      inc.severity === "critical" ? "text-red-500" : "text-amber-500",
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800">{inc.reference}</p>
                      <p className="text-[10px] text-slate-500 capitalize">{inc.type.replace(/_/g, " ")} · {formatDate(inc.date)}</p>
                    </div>
                    <Badge className={cn(
                      "text-[9px] shrink-0",
                      inc.severity === "critical" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700",
                    )}>
                      {inc.severity}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Regulatory footer */}
        <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-500">
          <span className="font-semibold text-slate-600">Regulatory Basis — </span>
          Care Planning, Placement and Case Review (England) Regulations 2010. The registered person must ensure
          each child&apos;s care plan is maintained, reviewed at each LAC review, and reflects the child&apos;s
          current needs, voice, and progress across all eight domains. Inspectors will assess whether plans drive
          meaningful change and evidence the child&apos;s outcomes.
        </div>
      </div>
    </PageShell>
  );
}

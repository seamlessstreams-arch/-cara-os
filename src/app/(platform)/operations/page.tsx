"use client";

// ══════════════════════════════════════════════════════════════════════════════
// OPERATIONS DASHBOARD — Manager+ governance command centre
// Unified view: task overview, workflow status, oversight gaps, evidence
// coverage, Cara recommendations, and inspection readiness.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import {
  Sparkles, ClipboardList, GitBranch, Shield, FileCheck2,
  Eye, BarChart3, AlertTriangle, CheckCircle2, Clock,
  ArrowRight, ChevronRight, TrendingUp, Activity,
  BookOpen, Layers, Target, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CaraPatternAlert,
  CaraDailyIntelligence,
} from "@/components/cara";
import { demoSeed } from "@/lib/demo/demo-seed";

// ── Types ───────────────────────────────────────────────────────────────────

type TabId = "overview" | "tasks" | "workflows" | "evidence" | "oversight" | "readiness" | "intelligence" | "audit";

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "tasks", label: "Tasks", icon: ClipboardList },
  { id: "workflows", label: "Workflows", icon: GitBranch },
  { id: "evidence", label: "Evidence", icon: FileCheck2 },
  { id: "oversight", label: "Oversight", icon: Eye },
  { id: "readiness", label: "Inspection Readiness", icon: Shield },
  { id: "intelligence", label: "Cara Intelligence", icon: Sparkles },
  { id: "audit", label: "Audit Trail", icon: BookOpen },
];

// ── Demo stats ──────────────────────────────────────────────────────────────

const DEMO_TASK_STATS = {
  total: 47,
  overdue: 5,
  due_today: 8,
  in_progress: 12,
  awaiting_sign_off: 3,
  completed_this_week: 18,
  unassigned: 2,
  critical: 1,
};

const DEMO_WORKFLOW_STATS = {
  active: 4,
  completed_this_month: 7,
  blocked: 1,
  templates: [
    { code: "new_placement", title: "New Placement Admission", active: 1, progress: 62 },
    { code: "incident_response", title: "Incident Response", active: 2, progress: 83 },
    { code: "reg44_report", title: "Reg 44 Monthly Visit", active: 1, progress: 33 },
    { code: "staff_onboarding", title: "Staff Onboarding", active: 0, progress: 0 },
  ],
};

const DEMO_OVERSIGHT_STATS = {
  total_this_month: 24,
  avg_quality_score: 7.2,
  needing_oversight: 6,
  by_type: [
    { type: "incident", count: 8, needing: 2 },
    { type: "safeguarding", count: 4, needing: 1 },
    { type: "missing_episode", count: 3, needing: 1 },
    { type: "complaint", count: 2, needing: 0 },
    { type: "restraint", count: 3, needing: 1 },
    { type: "daily_log", count: 4, needing: 1 },
  ],
};

const DEMO_READINESS = {
  overall: 72,
  grade: "Good" as string,
  modules: [
    { label: "Safeguarding", score: 85, colour: "bg-emerald-500" },
    { label: "Daily Recording", score: 78, colour: "bg-blue-500" },
    { label: "Management Oversight", score: 68, colour: "bg-amber-500" },
    { label: "Young People Outcomes", score: 74, colour: "bg-sky-500" },
    { label: "Staffing & Training", score: 82, colour: "bg-violet-500" },
    { label: "Medication", score: 90, colour: "bg-emerald-500" },
    { label: "Compliance", score: 55, colour: "bg-orange-500" },
    { label: "Contact & Family", score: 65, colour: "bg-amber-500" },
  ],
};

// ── Stat card ───────────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, colour, sub }: {
  label: string; value: number | string; icon: React.ElementType;
  colour: string; sub?: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--cs-border)] bg-white p-4 flex items-start gap-3">
      <div className={cn("flex items-center justify-center w-9 h-9 rounded-lg shrink-0", colour)}>
        <Icon className="h-4.5 w-4.5 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-[var(--cs-navy)]">{value}</p>
        <p className="text-xs text-[var(--cs-text-muted)]">{label}</p>
        {sub && <p className="text-[10px] text-[var(--cs-text-muted)] mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ── Overview tab ────────────────────────────────────────────────────────────

function OverviewTab() {
  return (
    <div className="space-y-6">
      {/* Cara Intelligence */}
      <CaraDailyIntelligence />

      {/* Key Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Active Tasks" value={DEMO_TASK_STATS.total} icon={ClipboardList} colour="bg-blue-500" sub={`${DEMO_TASK_STATS.overdue} overdue`} />
        <StatCard label="Due Today" value={DEMO_TASK_STATS.due_today} icon={Clock} colour="bg-amber-500" />
        <StatCard label="Active Workflows" value={DEMO_WORKFLOW_STATS.active} icon={GitBranch} colour="bg-purple-500" sub={`${DEMO_WORKFLOW_STATS.blocked} blocked`} />
        <StatCard label="Needing Oversight" value={DEMO_OVERSIGHT_STATS.needing_oversight} icon={Eye} colour="bg-red-500" />
      </div>

      {/* Cara Pattern Intelligence */}
      <CaraPatternAlert homeId="home_oak" />

      {/* Quick Workflow Status */}
      <div className="rounded-xl border border-[var(--cs-border)] bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--cs-border-subtle)] flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-purple-500" />
          <h3 className="text-sm font-semibold text-[var(--cs-navy)]">Active Workflows</h3>
        </div>
        <div className="divide-y divide-[var(--cs-border-subtle)]">
          {DEMO_WORKFLOW_STATS.templates.filter((t) => t.active > 0).map((t) => (
            <div key={t.code} className="px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--cs-navy)]">{t.title}</p>
                <p className="text-xs text-[var(--cs-text-muted)]">{t.active} active</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-24 h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-purple-500 transition-all"
                    style={{ width: `${t.progress}%` }}
                  />
                </div>
                <span className="text-xs text-[var(--cs-text-muted)] w-8 text-right">{t.progress}%</span>
                <ChevronRight className="h-3.5 w-3.5 text-[var(--cs-text-muted)]" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Inspection Readiness Summary */}
      <div className="rounded-xl border border-[var(--cs-border)] bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--cs-border-subtle)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-semibold text-[var(--cs-navy)]">Inspection Readiness</h3>
          </div>
          <span className={cn(
            "text-xs font-semibold px-2 py-0.5 rounded-full",
            DEMO_READINESS.grade === "Outstanding" ? "bg-emerald-100 text-emerald-700" :
            DEMO_READINESS.grade === "Good" ? "bg-blue-100 text-blue-700" :
            "bg-amber-100 text-amber-700"
          )}>
            {DEMO_READINESS.grade} — {DEMO_READINESS.overall}%
          </span>
        </div>
        <div className="px-4 py-3 space-y-2">
          {DEMO_READINESS.modules.map((m) => (
            <div key={m.label} className="flex items-center gap-3">
              <span className="text-xs text-[var(--cs-text-secondary)] w-36 shrink-0">{m.label}</span>
              <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all", m.colour)}
                  style={{ width: `${m.score}%` }}
                />
              </div>
              <span className="text-xs text-[var(--cs-text-muted)] w-8 text-right">{m.score}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Tasks tab ───────────────────────────────────────────────────────────────

function TasksTab() {
  const PRIORITY_COLOURS: Record<string, string> = {
    critical: "bg-red-100 text-red-700 border-red-200",
    urgent: "bg-red-50 text-red-600 border-red-200",
    high: "bg-orange-50 text-orange-600 border-orange-200",
    medium: "bg-blue-50 text-blue-600 border-blue-200",
    low: "bg-slate-50 text-slate-600 border-slate-200",
  };

  const DEMO_TASKS = [
    { ref: "SFG-A1K001", title: "Review safeguarding concern — Alex W", category: "safeguarding", priority: "urgent", status: "in_progress", due: "Today", assigned: "Sarah M", riskScore: 72 },
    { ref: "CMP-B2L002", title: "Update Reg 45 evidence folder", category: "compliance", priority: "high", status: "not_started", due: "Tomorrow", assigned: "Darren L", riskScore: 55 },
    { ref: "MED-C3M003", title: "Medication stock check — monthly", category: "medication", priority: "medium", status: "awaiting_sign_off", due: "14 May", assigned: "James H", riskScore: 30 },
    { ref: "TRN-D4N004", title: "Book restraint refresher training", category: "training", priority: "high", status: "overdue", due: "10 May", assigned: "Unassigned", riskScore: 68 },
    { ref: "ARA-E5O005", title: "Cara: Pattern detected — weekend incident increase", category: "cara_generated", priority: "high", status: "not_started", due: "15 May", assigned: "Darren L", riskScore: 61 },
  ];

  return (
    <div className="space-y-4">
      {/* Task Stats Bar */}
      <div className="grid grid-cols-3 md:grid-cols-7 gap-2">
        {[
          { label: "Total", value: DEMO_TASK_STATS.total, colour: "text-[var(--cs-navy)]" },
          { label: "Overdue", value: DEMO_TASK_STATS.overdue, colour: "text-red-600" },
          { label: "Due Today", value: DEMO_TASK_STATS.due_today, colour: "text-amber-600" },
          { label: "In Progress", value: DEMO_TASK_STATS.in_progress, colour: "text-blue-600" },
          { label: "Sign Off", value: DEMO_TASK_STATS.awaiting_sign_off, colour: "text-purple-600" },
          { label: "Done (7d)", value: DEMO_TASK_STATS.completed_this_week, colour: "text-emerald-600" },
          { label: "Unassigned", value: DEMO_TASK_STATS.unassigned, colour: "text-orange-600" },
        ].map((s) => (
          <div key={s.label} className="text-center px-2 py-2 rounded-lg bg-white border border-[var(--cs-border)]">
            <p className={cn("text-lg font-bold", s.colour)}>{s.value}</p>
            <p className="text-[10px] text-[var(--cs-text-muted)]">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Task List */}
      <div className="rounded-xl border border-[var(--cs-border)] bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--cs-border-subtle)] flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[var(--cs-navy)]">Task Explorer</h3>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[var(--cs-text-muted)] bg-slate-100 px-2 py-0.5 rounded-full">
              Sorted by Cara risk score
            </span>
          </div>
        </div>
        <div className="divide-y divide-[var(--cs-border-subtle)]">
          {demoSeed(DEMO_TASKS).map((task) => (
            <div key={task.ref} className="px-4 py-3 hover:bg-slate-50/50 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono text-[var(--cs-text-muted)]">{task.ref}</span>
                    <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full border", PRIORITY_COLOURS[task.priority])}>
                      {task.priority}
                    </span>
                    {task.category === "cara_generated" && (
                      <span className="flex items-center gap-0.5 text-[10px] text-[var(--cs-cara-gold)]">
                        <Sparkles className="h-2.5 w-2.5" /> Cara
                      </span>
                    )}
                    {task.status === "overdue" && (
                      <span className="flex items-center gap-0.5 text-[10px] text-red-600 font-semibold">
                        <AlertTriangle className="h-2.5 w-2.5" /> Overdue
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-[var(--cs-navy)] mt-0.5">{task.title}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] text-[var(--cs-text-muted)]">Due: {task.due}</span>
                    <span className="text-[10px] text-[var(--cs-text-muted)]">{task.assigned}</span>
                  </div>
                </div>
                {/* Cara Risk Score */}
                <div className="flex flex-col items-center shrink-0">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border-2",
                    task.riskScore >= 70 ? "border-red-300 bg-red-50 text-red-700" :
                    task.riskScore >= 50 ? "border-orange-300 bg-orange-50 text-orange-700" :
                    task.riskScore >= 25 ? "border-amber-300 bg-amber-50 text-amber-700" :
                    "border-emerald-300 bg-emerald-50 text-emerald-700"
                  )}>
                    {task.riskScore}
                  </div>
                  <span className="text-[8px] text-[var(--cs-text-muted)] mt-0.5">Risk</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Workflows tab ───────────────────────────────────────────────────────────

function WorkflowsTab() {
  const DEMO_ACTIVE = [
    {
      id: "w1", template: "New Placement Admission", child: "Alex W",
      status: "in_progress", step: 5, totalSteps: 8, progress: 62,
      currentStep: "Staff Briefing", initiatedBy: "Darren L", date: "8 May 2026",
    },
    {
      id: "w2", template: "Incident Response", child: "Jordan M",
      status: "in_progress", step: 4, totalSteps: 6, progress: 67,
      currentStep: "Management Oversight", initiatedBy: "Sarah M", date: "11 May 2026",
    },
    {
      id: "w3", template: "Incident Response", child: "Casey T",
      status: "in_progress", step: 6, totalSteps: 6, progress: 100,
      currentStep: "Review & Learning", initiatedBy: "Darren L", date: "9 May 2026",
    },
    {
      id: "w4", template: "Reg 44 Monthly Visit", child: null,
      status: "in_progress", step: 2, totalSteps: 6, progress: 33,
      currentStep: "Young People Consultation", initiatedBy: "Darren L", date: "1 May 2026",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Active Workflows" value={4} icon={GitBranch} colour="bg-purple-500" />
        <StatCard label="Completed (30d)" value={7} icon={CheckCircle2} colour="bg-emerald-500" />
        <StatCard label="Blocked" value={1} icon={AlertTriangle} colour="bg-red-500" />
        <StatCard label="Templates" value={7} icon={BookOpen} colour="bg-sky-500" />
      </div>

      <div className="rounded-xl border border-[var(--cs-border)] bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--cs-border-subtle)]">
          <h3 className="text-sm font-semibold text-[var(--cs-navy)]">Active Workflows</h3>
        </div>
        <div className="divide-y divide-[var(--cs-border-subtle)]">
          {demoSeed(DEMO_ACTIVE).map((w) => (
            <div key={w.id} className="px-4 py-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[var(--cs-navy)]">{w.template}</span>
                    {w.child && (
                      <span className="text-xs text-[var(--cs-text-muted)] bg-slate-100 px-1.5 py-0.5 rounded-full">
                        {w.child}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--cs-text-muted)] mt-0.5">
                    Step {w.step}/{w.totalSteps}: {w.currentStep}
                  </p>
                  <p className="text-[10px] text-[var(--cs-text-muted)] mt-0.5">
                    Started {w.date} by {w.initiatedBy}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        w.progress >= 100 ? "bg-emerald-500" :
                        w.progress >= 50 ? "bg-purple-500" : "bg-amber-500"
                      )}
                      style={{ width: `${Math.min(w.progress, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-[var(--cs-text-muted)] w-8 text-right">{w.progress}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Available Templates */}
      <div className="rounded-xl border border-[var(--cs-border)] bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--cs-border-subtle)]">
          <h3 className="text-sm font-semibold text-[var(--cs-navy)]">Workflow Templates</h3>
          <p className="text-[10px] text-[var(--cs-text-muted)]">Pre-built regulated care processes</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[var(--cs-border-subtle)]">
          {[
            { code: "new_placement", label: "New Placement", steps: 8, icon: Target, colour: "text-purple-500" },
            { code: "incident_response", label: "Incident Response", steps: 6, icon: AlertTriangle, colour: "text-red-500" },
            { code: "missing_episode", label: "Missing Episode", steps: 7, icon: Activity, colour: "text-orange-500" },
            { code: "reg44_report", label: "Reg 44 Visit", steps: 6, icon: BookOpen, colour: "text-sky-500" },
            { code: "reg45_review", label: "Reg 45 Review", steps: 7, icon: FileCheck2, colour: "text-emerald-500" },
            { code: "staff_onboarding", label: "Staff Onboarding", steps: 7, icon: Layers, colour: "text-violet-500" },
            { code: "placement_ending", label: "Placement Ending", steps: 5, icon: ArrowRight, colour: "text-amber-500" },
          ].map((t) => (
            <div key={t.code} className="px-4 py-3 flex items-center gap-3 hover:bg-slate-50/50 transition-colors cursor-pointer">
              <t.icon className={cn("h-4 w-4 shrink-0", t.colour)} />
              <div className="flex-1">
                <p className="text-sm font-medium text-[var(--cs-navy)]">{t.label}</p>
                <p className="text-[10px] text-[var(--cs-text-muted)]">{t.steps} steps</p>
              </div>
              <Zap className="h-3.5 w-3.5 text-[var(--cs-text-muted)]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Evidence tab ────────────────────────────────────────────────────────────

function EvidenceTab() {
  const EVIDENCE_TYPES = [
    { type: "incident_report", count: 42, colour: "bg-red-500" },
    { type: "daily_log", count: 180, colour: "bg-blue-500" },
    { type: "form_submission", count: 67, colour: "bg-purple-500" },
    { type: "meeting_minutes", count: 23, colour: "bg-sky-500" },
    { type: "training_certificate", count: 34, colour: "bg-emerald-500" },
    { type: "policy", count: 18, colour: "bg-amber-500" },
    { type: "risk_assessment", count: 15, colour: "bg-orange-500" },
    { type: "care_plan", count: 8, colour: "bg-violet-500" },
    { type: "correspondence", count: 56, colour: "bg-slate-500" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Evidence" value={443} icon={FileCheck2} colour="bg-sky-500" />
        <StatCard label="Verified" value={312} icon={CheckCircle2} colour="bg-emerald-500" />
        <StatCard label="Unverified" value={131} icon={Clock} colour="bg-amber-500" />
        <StatCard label="Linked" value={289} icon={TrendingUp} colour="bg-purple-500" />
      </div>

      {/* Evidence by Type */}
      <div className="rounded-xl border border-[var(--cs-border)] bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--cs-border-subtle)]">
          <h3 className="text-sm font-semibold text-[var(--cs-navy)]">Evidence by Type</h3>
        </div>
        <div className="px-4 py-3 space-y-2">
          {EVIDENCE_TYPES.map((e) => (
            <div key={e.type} className="flex items-center gap-3">
              <span className="text-xs text-[var(--cs-text-secondary)] w-36 shrink-0 capitalize">
                {e.type.replace(/_/g, " ")}
              </span>
              <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all", e.colour)}
                  style={{ width: `${Math.min((e.count / 200) * 100, 100)}%` }}
                />
              </div>
              <span className="text-xs font-medium text-[var(--cs-text-muted)] w-8 text-right">{e.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Oversight tab ───────────────────────────────────────────────────────────

function OversightTab() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="This Month" value={DEMO_OVERSIGHT_STATS.total_this_month} icon={Eye} colour="bg-purple-500" />
        <StatCard label="Avg Quality" value={`${DEMO_OVERSIGHT_STATS.avg_quality_score}/10`} icon={TrendingUp} colour="bg-emerald-500" />
        <StatCard label="Needing Oversight" value={DEMO_OVERSIGHT_STATS.needing_oversight} icon={AlertTriangle} colour="bg-red-500" />
        <StatCard label="Cara Assisted" value="67%" icon={Sparkles} colour="bg-[var(--cs-cara-gold)]" />
      </div>

      {/* Oversight by record type */}
      <div className="rounded-xl border border-[var(--cs-border)] bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--cs-border-subtle)]">
          <h3 className="text-sm font-semibold text-[var(--cs-navy)]">Oversight Coverage by Record Type</h3>
        </div>
        <div className="divide-y divide-[var(--cs-border-subtle)]">
          {DEMO_OVERSIGHT_STATS.by_type.map((r) => (
            <div key={r.type} className="px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--cs-navy)] capitalize">{r.type.replace(/_/g, " ")}</p>
                <p className="text-xs text-[var(--cs-text-muted)]">{r.count} oversight notes this month</p>
              </div>
              <div className="flex items-center gap-2">
                {r.needing > 0 ? (
                  <span className="flex items-center gap-1 text-xs text-red-600 font-semibold bg-red-50 px-2 py-0.5 rounded-full">
                    <AlertTriangle className="h-3 w-3" /> {r.needing} needing
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="h-3 w-3" /> All covered
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Readiness tab ───────────────────────────────────────────────────────────

function ReadinessTab() {
  return (
    <div className="space-y-4">
      {/* Overall Score */}
      <div className="rounded-xl border border-[var(--cs-border)] bg-white p-6 text-center">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full border-4 border-blue-200 bg-blue-50 mb-3">
          <span className="text-3xl font-bold text-blue-700">{DEMO_READINESS.overall}%</span>
        </div>
        <p className="text-lg font-semibold text-[var(--cs-navy)]">Inspection Readiness: {DEMO_READINESS.grade}</p>
        <p className="text-xs text-[var(--cs-text-muted)] mt-1">
          Based on evidence coverage, oversight quality, compliance status, and documentation completeness
        </p>
      </div>

      {/* Module Breakdown */}
      <div className="rounded-xl border border-[var(--cs-border)] bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--cs-border-subtle)]">
          <h3 className="text-sm font-semibold text-[var(--cs-navy)]">Module Readiness</h3>
        </div>
        <div className="px-4 py-3 space-y-3">
          {DEMO_READINESS.modules.map((m) => (
            <div key={m.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-[var(--cs-text-secondary)]">{m.label}</span>
                <span className={cn(
                  "text-xs font-semibold",
                  m.score >= 80 ? "text-emerald-600" :
                  m.score >= 60 ? "text-amber-600" : "text-red-600"
                )}>
                  {m.score}%
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all", m.colour)}
                  style={{ width: `${m.score}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Regulation Coverage */}
      <div className="rounded-xl border border-[var(--cs-border)] bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--cs-border-subtle)]">
          <h3 className="text-sm font-semibold text-[var(--cs-navy)]">Regulatory Framework Coverage</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4">
          {[
            { framework: "CHR 2015", coverage: 78, total: 12 },
            { framework: "SCCIF", coverage: 72, total: 3 },
            { framework: "Reg 44", coverage: 85, total: 1 },
            { framework: "Reg 45", coverage: 60, total: 1 },
            { framework: "Annex A", coverage: 45, total: 8 },
            { framework: "KCSIE", coverage: 70, total: 5 },
          ].map((f) => (
            <div key={f.framework} className="rounded-lg border border-[var(--cs-border)] p-3 text-center">
              <p className="text-xs font-semibold text-[var(--cs-navy)]">{f.framework}</p>
              <p className={cn(
                "text-2xl font-bold mt-1",
                f.coverage >= 80 ? "text-emerald-600" :
                f.coverage >= 60 ? "text-amber-600" : "text-red-600"
              )}>
                {f.coverage}%
              </p>
              <p className="text-[10px] text-[var(--cs-text-muted)]">{f.total} requirements</p>
            </div>
          ))}
        </div>
      </div>

      {/* Cara note */}
      <div className="rounded-xl border border-[var(--cs-border)] bg-[var(--cs-cara-gold-bg)] p-3 flex items-start gap-2">
        <Sparkles className="h-4 w-4 text-[var(--cs-cara-gold)] shrink-0 mt-0.5" />
        <p className="text-xs text-[var(--cs-text-secondary)] leading-relaxed">
          Cara analyses your evidence coverage against each regulation and generates gap recommendations. Run a full scan to identify exactly which evidence is missing for each requirement.
        </p>
      </div>
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────

export default function OperationsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  return (
    <PageShell
      title="Operations Centre"
      subtitle="Manager+ governance, compliance, and operational intelligence"
    >
      {/* Tab bar */}
      <div className="flex gap-1 overflow-x-auto pb-1 mb-4 border-b border-[var(--cs-border-subtle)]">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-lg whitespace-nowrap transition-colors",
                activeTab === tab.id
                  ? "text-[var(--cs-navy)] bg-white border border-b-0 border-[var(--cs-border)] -mb-px"
                  : "text-[var(--cs-text-muted)] hover:text-[var(--cs-navy)] hover:bg-slate-50"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === "overview" && <OverviewTab />}
      {activeTab === "tasks" && <TasksTab />}
      {activeTab === "workflows" && <WorkflowsTab />}
      {activeTab === "evidence" && <EvidenceTab />}
      {activeTab === "oversight" && <OversightTab />}
      {activeTab === "readiness" && <ReadinessTab />}
      {activeTab === "intelligence" && <IntelligenceTab />}
      {activeTab === "audit" && <AuditTab />}
    </PageShell>
  );
}

// ── Cara Intelligence Tab ──────────────────────────────────────────────────

const DEMO_RECOMMENDATIONS = [
  {
    id: "r1", type: "missing_oversight", severity: "critical" as const,
    title: "4 records without management oversight",
    description: "4 significant records have been open for more than 48 hours without management oversight. 2 incidents, 1 safeguarding concern, 1 restraint. Ofsted expects timely, reflective management oversight of all significant events.",
    suggested_action: "Prioritise providing written oversight for these records. Use Cara's oversight quality prompts to ensure your oversight demonstrates reflective analysis, child focus, and clear actions.",
    data_points: 4, confidence: 0.98, status: "active" as const,
    created_at: "2026-05-12T08:00:00Z",
  },
  {
    id: "r2", type: "staffing_concern", severity: "high" as const,
    title: "3 unfilled shifts this week",
    description: "There are 3 shifts without an assigned staff member in the next 7 days. Staffing gaps may affect the quality of care and regulatory compliance.",
    suggested_action: "Fill the open shifts by assigning available staff, contacting bank workers, or reviewing whether shift patterns need adjustment.",
    data_points: 3, confidence: 0.95, status: "active" as const,
    created_at: "2026-05-12T06:00:00Z",
  },
  {
    id: "r3", type: "incident_trend", severity: "medium" as const,
    title: "Incident rate increased 67%",
    description: "There have been 10 incidents in the last 30 days, compared to 6 in the previous 30 days — a 67% increase. Consider whether this reflects a genuine change in risk or improved recording.",
    suggested_action: "Analyse the incidents for common themes, triggers, or contributing factors. Consider whether staffing, group dynamics, or external factors have changed.",
    data_points: 16, confidence: 0.8, status: "active" as const,
    created_at: "2026-05-11T18:00:00Z",
  },
  {
    id: "r4", type: "training_due", severity: "high" as const,
    title: "3 expired mandatory training records",
    description: "3 mandatory training records have expired. Expired mandatory training is a regulatory compliance issue that Ofsted will scrutinise (CHR2015 Reg 34).",
    suggested_action: "Book renewal training immediately. Prioritise safeguarding, first aid, and medication training.",
    data_points: 3, confidence: 0.98, status: "acknowledged" as const,
    created_at: "2026-05-10T12:00:00Z",
  },
  {
    id: "r5", type: "positive_recognition", severity: "info" as const,
    title: "Improving mood trend for Sophia",
    description: "Average mood score has improved from 4.2 to 6.8 over recent recordings. This positive trajectory suggests current care arrangements are supporting this young person's emotional wellbeing.",
    suggested_action: "Recognise this improvement with the young person and team. Record in the care plan review.",
    data_points: 14, confidence: 0.75, status: "active" as const,
    created_at: "2026-05-11T10:00:00Z",
  },
  {
    id: "r6", type: "weak_recording", severity: "medium" as const,
    title: "Brief daily log entries for Tyler",
    description: "8 of 14 recent daily log entries are very brief (under 50 characters). Short entries may not provide sufficient detail for regulatory compliance.",
    suggested_action: "Discuss recording standards with the team. Entries should capture the child's experience, mood, activities, and significant observations.",
    data_points: 14, confidence: 0.8, status: "active" as const,
    created_at: "2026-05-11T09:00:00Z",
  },
  {
    id: "r7", type: "handover_quality", severity: "low" as const,
    title: "Handover notes missing young person updates",
    description: "5 of 10 recent handover notes do not contain individual young person updates. Effective handovers should include updates on each young person.",
    suggested_action: "Remind staff that handover notes should include individual updates for each young person.",
    data_points: 10, confidence: 0.8, status: "actioned" as const,
    created_at: "2026-05-09T14:00:00Z",
  },
];

const SEVERITY_STYLES: Record<string, { bg: string; text: string; border: string; icon: string }> = {
  critical: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", icon: "text-red-600" },
  high: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", icon: "text-orange-600" },
  medium: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", icon: "text-amber-600" },
  low: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", icon: "text-blue-600" },
  info: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", icon: "text-emerald-600" },
};

const STATUS_BADGE: Record<string, string> = {
  active: "bg-blue-100 text-blue-700",
  acknowledged: "bg-amber-100 text-amber-700",
  actioned: "bg-emerald-100 text-emerald-700",
  dismissed: "bg-gray-100 text-gray-500",
};

function IntelligenceTab() {
  const [severityFilter, setSeverityFilter] = useState<string>("all");

  const filtered = severityFilter === "all"
    ? DEMO_RECOMMENDATIONS
    : demoSeed(DEMO_RECOMMENDATIONS).filter((r) => r.severity === severityFilter);

  const active = demoSeed(DEMO_RECOMMENDATIONS).filter((r) => r.status === "active");
  const bySeverity = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
  for (const r of active) bySeverity[r.severity] = (bySeverity[r.severity] ?? 0) + 1;

  return (
    <div className="space-y-4">
      {/* Cara header */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-violet-50 border border-violet-100">
        <Sparkles className="h-5 w-5 text-violet-500 shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-semibold text-violet-800">Cara Operational Intelligence</h3>
          <p className="text-xs text-violet-600 mt-0.5">
            Cara analyses patterns across all modules — incidents, daily logs, staffing, training, oversight,
            and medication — to surface actionable intelligence. All recommendations require human review.
          </p>
        </div>
      </div>

      {/* Severity summary */}
      <div className="grid grid-cols-5 gap-2">
        {(["critical", "high", "medium", "low", "info"] as const).map((sev) => {
          const s = SEVERITY_STYLES[sev];
          return (
            <button
              key={sev}
              onClick={() => setSeverityFilter(severityFilter === sev ? "all" : sev)}
              className={cn(
                "rounded-xl p-3 text-center border transition-all",
                severityFilter === sev ? `${s.bg} ${s.border} ring-2 ring-offset-1` : "bg-white border-gray-200 hover:bg-gray-50",
              )}
            >
              <p className={cn("text-xl font-bold", severityFilter === sev ? s.text : "text-gray-900")}>{bySeverity[sev]}</p>
              <p className="text-[10px] text-gray-500 capitalize">{sev}</p>
            </button>
          );
        })}
      </div>

      {/* Recommendation cards */}
      <div className="space-y-3">
        {filtered.map((rec) => {
          const s = SEVERITY_STYLES[rec.severity];
          return (
            <div key={rec.id} className={cn("rounded-xl border p-4", s.bg, s.border)}>
              <div className="flex items-start gap-3">
                <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", s.bg)}>
                  {rec.severity === "info" ? (
                    <CheckCircle2 className={cn("h-4 w-4", s.icon)} />
                  ) : (
                    <AlertTriangle className={cn("h-4 w-4", s.icon)} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className={cn("text-sm font-semibold", s.text)}>{rec.title}</h4>
                    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium", STATUS_BADGE[rec.status])}>
                      {rec.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed mb-2">{rec.description}</p>
                  <div className={cn("px-3 py-2 rounded-lg bg-white/60 border", s.border)}>
                    <p className="text-xs font-medium text-gray-700 mb-0.5">Suggested Action</p>
                    <p className="text-xs text-gray-600">{rec.suggested_action}</p>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-[10px] text-gray-500">
                    <span>{rec.data_points} data points</span>
                    <span>{Math.round(rec.confidence * 100)}% confidence</span>
                    <span>{new Date(rec.created_at).toLocaleDateString("en-GB")}</span>
                  </div>
                </div>
              </div>
              {rec.status === "active" && (
                <div className="flex gap-2 mt-3 ml-11">
                  <button className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
                    Acknowledge
                  </button>
                  <button className="px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">
                    Take Action
                  </button>
                  <button className="px-3 py-1.5 text-xs font-medium rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
                    Dismiss
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Audit Trail Tab ────────────────────────────────────────────────────────

const DEMO_AUDIT_ENTRIES = [
  { id: "a1", action: "create", entity_type: "incident", entity_id: "inc-042", reference: "INC-042", performed_by: "Sarah Mitchell", created_at: "2026-05-12T15:32:00Z", details: "Created incident: Physical intervention with Jayden" },
  { id: "a2", action: "update", entity_type: "daily_log", entity_id: "dl-189", reference: "DL-189", performed_by: "James Wilson", created_at: "2026-05-12T14:15:00Z", details: "Updated daily log entry for Tyler" },
  { id: "a3", action: "oversight_added", entity_type: "incident", entity_id: "inc-040", reference: "INC-040", performed_by: "Darren Laville", created_at: "2026-05-12T13:45:00Z", details: "Management oversight added: Quality score 4/5" },
  { id: "a4", action: "approve", entity_type: "form_submission", entity_id: "fs-023", reference: "FS-023", performed_by: "Darren Laville", created_at: "2026-05-12T11:20:00Z", details: "Approved medication administration form" },
  { id: "a5", action: "complete", entity_type: "task", entity_id: "tsk-076", reference: "SFG-A1K076", performed_by: "Emily Chen", created_at: "2026-05-12T10:45:00Z", details: "Completed safeguarding task: Update risk assessment for Amara" },
  { id: "a6", action: "workflow_advance", entity_type: "workflow", entity_id: "wf-012", reference: "WF-012", performed_by: "Darren Laville", created_at: "2026-05-12T09:30:00Z", details: "Advanced New Placement workflow to Pre-Admission phase" },
  { id: "a7", action: "create", entity_type: "oversight_note", entity_id: "on-034", reference: "ON-034", performed_by: "Darren Laville", created_at: "2026-05-12T09:00:00Z", details: "Oversight note for missing from care episode (Tyler)" },
  { id: "a8", action: "sign_off", entity_type: "task", entity_id: "tsk-074", reference: "MED-B2K074", performed_by: "Darren Laville", created_at: "2026-05-11T18:30:00Z", details: "Signed off medication audit task" },
  { id: "a9", action: "create", entity_type: "evidence_item", entity_id: "ev-019", reference: "EV-019", performed_by: "James Wilson", created_at: "2026-05-11T17:00:00Z", details: "Uploaded evidence: Fire drill log May 2026" },
  { id: "a10", action: "escalate", entity_type: "task", entity_id: "tsk-071", reference: "CMP-C3K071", performed_by: "Sarah Mitchell", created_at: "2026-05-11T16:15:00Z", details: "Escalated complaint task to Registered Manager" },
  { id: "a11", action: "create", entity_type: "communication_draft", entity_id: "cd-007", reference: "CD-007", performed_by: "Cara", created_at: "2026-05-11T15:30:00Z", details: "Cara generated shift briefing draft for night shift" },
  { id: "a12", action: "update", entity_type: "young_person", entity_id: "yp-003", reference: "Tyler Robinson", performed_by: "Emily Chen", created_at: "2026-05-11T14:00:00Z", details: "Updated risk flags: Added substance experimentation" },
];

const ACTION_STYLES: Record<string, string> = {
  create: "bg-emerald-100 text-emerald-700",
  update: "bg-blue-100 text-blue-700",
  approve: "bg-green-100 text-green-700",
  sign_off: "bg-green-100 text-green-700",
  complete: "bg-emerald-100 text-emerald-700",
  escalate: "bg-red-100 text-red-700",
  oversight_added: "bg-purple-100 text-purple-700",
  workflow_advance: "bg-indigo-100 text-indigo-700",
};

function AuditTab() {
  const [entityFilter, setEntityFilter] = useState<string>("all");

  const entityTypes = [...new Set(demoSeed(DEMO_AUDIT_ENTRIES).map((e) => e.entity_type))];
  const filtered = entityFilter === "all"
    ? DEMO_AUDIT_ENTRIES
    : demoSeed(DEMO_AUDIT_ENTRIES).filter((e) => e.entity_type === entityFilter);

  return (
    <div className="space-y-4">
      {/* Info banner */}
      <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200">
        <BookOpen className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-semibold text-slate-700">Immutable Audit Trail</h3>
          <p className="text-xs text-slate-500">Every action in Cara is immutably logged. Records cannot be edited or deleted. This trail provides evidence of due diligence for regulatory inspections.</p>
        </div>
      </div>

      {/* Entity filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setEntityFilter("all")}
          className={cn("px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
            entityFilter === "all" ? "bg-[var(--cs-primary)] text-white" : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200")}
        >
          All ({DEMO_AUDIT_ENTRIES.length})
        </button>
        {entityTypes.map((et) => (
          <button
            key={et}
            onClick={() => setEntityFilter(entityFilter === et ? "all" : et)}
            className={cn("px-3 py-1.5 rounded-full text-xs font-medium transition-colors capitalize",
              entityFilter === et ? "bg-[var(--cs-primary)] text-white" : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200")}
          >
            {et.replace(/_/g, " ")} ({demoSeed(DEMO_AUDIT_ENTRIES).filter((e) => e.entity_type === et).length})
          </button>
        ))}
      </div>

      {/* Audit entries */}
      <div className="space-y-1">
        {filtered.map((entry) => (
          <div key={entry.id} className="flex items-start gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors">
            {/* Timeline dot */}
            <div className="flex flex-col items-center mt-1">
              <div className="h-2.5 w-2.5 rounded-full bg-slate-300" />
              <div className="w-px h-full bg-slate-200 mt-1" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className={cn("px-2 py-0.5 rounded text-[10px] font-medium capitalize", ACTION_STYLES[entry.action] ?? "bg-gray-100 text-gray-600")}>
                  {entry.action.replace(/_/g, " ")}
                </span>
                <span className="text-[10px] text-gray-400 capitalize">{entry.entity_type.replace(/_/g, " ")}</span>
                <span className="text-[10px] text-gray-400 font-mono">{entry.reference}</span>
              </div>
              <p className="text-sm text-gray-700">{entry.details}</p>
              <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-400">
                <span>{entry.performed_by}</span>
                <span>{new Date(entry.created_at).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

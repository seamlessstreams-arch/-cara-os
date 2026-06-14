"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — CARE PLANS
// Care Planning, Placement and Case Review (England) Regulations 2010
// Children's Homes Quality Standards — Standard 1 (Care and Support)
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatDate, generateId } from "@/lib/utils";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";
import { ExportButton, type ExportColumn } from "@/components/common/export-button";
import { useCarePlans, useUpdateCarePlan } from "@/hooks/use-care-plans";
import { getYPName, getStaffName, STAFF } from "@/lib/seed-data";
import type {
  CarePlan, CarePlanGoal, CarePlanGoalStatus, CarePlanDomain,
} from "@/types/extended";
import {
  ClipboardList, CheckCircle2, Clock, AlertTriangle, ChevronDown, ChevronUp,
  Sparkles, User, Calendar, Heart, Target, ArrowRight, BookOpen, BarChart3,
  Search, ListCollapse, Expand, Trophy, Activity, ArrowUpDown, Plus,
} from "lucide-react";
import Link from "next/link";
import { api } from "@/hooks/use-api";
import { PrintButton } from "@/components/common/print-button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { toastSuccess } from "@/lib/toast";

// ── Filter types ─────────────────────────────────────────────────────────────

type RAGFilter = "all" | "red" | "amber" | "green";

const CARE_PLAN_EXPORT_COLS: ExportColumn<CarePlan>[] = [
  { header: "Young Person", accessor: (p) => getYPName(p.child_id) },
  { header: "Status", accessor: (p) => p.status },
  { header: "Legal Status", accessor: (p) => p.legal_status },
  { header: "Placement Type", accessor: (p) => p.current_placement_type },
  { header: "Version", accessor: (p) => String(p.version) },
  { header: "Total Goals", accessor: (p) => String(p.goals.length) },
  { header: "Attention Goals", accessor: (p) => String(p.goals.filter((g) => g.status === "attention_needed").length) },
  { header: "On Track Goals", accessor: (p) => String(p.goals.filter((g) => g.status === "on_track").length) },
  { header: "Next LAC Review", accessor: (p) => p.next_lac_review ?? "" },
  { header: "Key Worker", accessor: (p) => p.keyworker_id ? getStaffName(p.keyworker_id) : "" },
  { header: "Strengths", accessor: (p) => p.strengths_summary ?? "" },
  { header: "Concerns", accessor: (p) => p.concerns_summary ?? "" },
];

// ── Constants ──────────────────────────────────────────────────────────────────

const DOMAIN_LABELS: Record<CarePlanDomain, string> = {
  health:                "Health",
  education:             "Education",
  emotional_behavioural: "Emotional & Behavioural",
  identity:              "Identity & Culture",
  family_social:         "Family & Social",
  independence:          "Independence",
  placement_stability:   "Placement Stability",
  safety:                "Safety",
};

const DOMAIN_COLOUR: Record<CarePlanDomain, string> = {
  health:                "text-rose-600 bg-rose-50 border-rose-200",
  education:             "text-blue-600 bg-blue-50 border-blue-200",
  emotional_behavioural: "text-[var(--cs-cara-gold)] bg-[var(--cs-cara-gold-bg)] border-[var(--cs-cara-gold-soft)]",
  identity:              "text-amber-600 bg-amber-50 border-amber-200",
  family_social:         "text-emerald-600 bg-emerald-50 border-emerald-200",
  independence:          "text-sky-600 bg-sky-50 border-sky-200",
  placement_stability:   "text-[var(--cs-text-secondary)] bg-slate-50 border-[var(--cs-border)]",
  safety:                "text-red-600 bg-red-50 border-red-200",
};

const GOAL_STATUS_LABELS: Record<CarePlanGoalStatus, string> = {
  not_started:      "Not Started",
  in_progress:      "In Progress",
  on_track:         "On Track",
  attention_needed: "Attention Needed",
  achieved:         "Achieved",
  closed:           "Closed",
};

const GOAL_STATUS_COLOUR: Record<CarePlanGoalStatus, string> = {
  not_started:      "bg-slate-100 text-[var(--cs-text-secondary)] border-[var(--cs-border)]",
  in_progress:      "bg-blue-50 text-blue-700 border-blue-200",
  on_track:         "bg-emerald-50 text-emerald-700 border-emerald-200",
  attention_needed: "bg-red-50 text-red-700 border-red-200",
  achieved:         "bg-emerald-100 text-emerald-800 border-emerald-300",
  closed:           "bg-slate-50 text-[var(--cs-text-muted)] border-[var(--cs-border)]",
};

const GOAL_STATUS_ICON: Record<CarePlanGoalStatus, React.ElementType> = {
  not_started:      Clock,
  in_progress:      Clock,
  on_track:         CheckCircle2,
  attention_needed: AlertTriangle,
  achieved:         CheckCircle2,
  closed:           CheckCircle2,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function lacDaysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function overallRAG(plan: CarePlan): "green" | "amber" | "red" {
  const attention = plan.goals.filter((g) => g.status === "attention_needed").length;
  const notStarted = plan.goals.filter((g) => g.status === "not_started").length;
  if (attention >= 2 || (attention >= 1 && notStarted >= 2)) return "red";
  if (attention >= 1 || notStarted >= 1) return "amber";
  return "green";
}

// ── Goal Row ──────────────────────────────────────────────────────────────────

function GoalRow({ goal }: { goal: CarePlanGoal }) {
  const [open, setOpen] = useState(false);
  const Icon = GOAL_STATUS_ICON[goal.status];

  return (
    <div className={cn(
      "rounded-xl border transition-all",
      goal.status === "attention_needed" ? "bg-red-50/50 border-red-100" :
      goal.status === "on_track" || goal.status === "achieved" ? "bg-emerald-50/40 border-emerald-100" :
      "bg-white border-[var(--cs-border-subtle)]",
    )}>
      <div
        className="flex items-start gap-2.5 p-3 cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        <Icon className={cn(
          "h-4 w-4 shrink-0 mt-0.5",
          goal.status === "attention_needed" ? "text-red-500" :
          goal.status === "on_track" || goal.status === "achieved" ? "text-emerald-500" :
          "text-[var(--cs-text-muted)]",
        )} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-[var(--cs-navy)]">{goal.title}</span>
            <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 border", DOMAIN_COLOUR[goal.domain])}>
              {DOMAIN_LABELS[goal.domain]}
            </Badge>
            <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 border", GOAL_STATUS_COLOUR[goal.status])}>
              {GOAL_STATUS_LABELS[goal.status]}
            </Badge>
          </div>
          {!open && goal.progress_note && (
            <p className="text-[10px] text-[var(--cs-text-muted)] mt-0.5 line-clamp-1">{goal.progress_note}</p>
          )}
        </div>
        {open ? <ChevronUp className="h-3.5 w-3.5 text-[var(--cs-text-muted)] shrink-0 mt-0.5" />
               : <ChevronDown className="h-3.5 w-3.5 text-[var(--cs-text-muted)] shrink-0 mt-0.5" />}
      </div>

      {open && (
        <div className="border-t border-[var(--cs-border-subtle)] px-3 pb-3 pt-2 space-y-2.5">
          <p className="text-xs text-[var(--cs-text-secondary)]">{goal.description}</p>

          <div className="rounded-lg border border-indigo-100 bg-indigo-50/40 p-2">
            <p className="text-[10px] font-semibold text-indigo-700 uppercase tracking-wide mb-0.5">Desired Outcome</p>
            <p className="text-xs text-[var(--cs-text-secondary)]">{goal.desired_outcome}</p>
          </div>

          {goal.actions.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wide mb-1">Actions</p>
              <ul className="space-y-0.5">
                {goal.actions.map((a, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-[var(--cs-text-secondary)]">
                    <ArrowRight className="h-3 w-3 text-[var(--cs-text-gentle)] mt-0.5 shrink-0" />
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {goal.progress_note && (
            <div>
              <p className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wide mb-0.5">Progress</p>
              <p className="text-xs text-[var(--cs-text-secondary)]">{goal.progress_note}</p>
            </div>
          )}

          <div className="flex items-center gap-4 text-[10px] text-[var(--cs-text-muted)]">
            {goal.target_date && <span>Target: {formatDate(goal.target_date)}</span>}
            {goal.last_reviewed && <span>Reviewed: {formatDate(goal.last_reviewed)}{goal.reviewed_by ? ` · ${getStaffName(goal.reviewed_by)}` : ""}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

// ── New Goal Dialog ──────────────────────────────────────────────────────────

function NewGoalDialog({
  plan,
  open,
  onOpenChange,
  onSave,
}: {
  plan: CarePlan;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (planId: string, goal: CarePlanGoal) => void;
}) {
  const [domain, setDomain] = useState<CarePlanDomain>("health");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [desiredOutcome, setDesiredOutcome] = useState("");
  const [successCriteria, setSuccessCriteria] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [responsibleStaff, setResponsibleStaff] = useState("");
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setDomain("health");
    setTitle("");
    setDescription("");
    setDesiredOutcome("");
    setSuccessCriteria("");
    setTargetDate("");
    setResponsibleStaff("");
  };

  const handleSave = async () => {
    if (!title.trim() || !description.trim()) return;
    setSaving(true);
    try {
      const goal: CarePlanGoal = {
        id: generateId("cpg"),
        domain,
        title: title.trim(),
        description: description.trim(),
        desired_outcome: desiredOutcome.trim() || successCriteria.trim(),
        actions: successCriteria.trim() ? [successCriteria.trim()] : [],
        status: "not_started",
        progress_note: null,
        target_date: targetDate || null,
        achieved_date: null,
        last_reviewed: null,
        reviewed_by: responsibleStaff || null,
        evidence: null,
      };
      onSave(plan.id, goal);
      resetForm();
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const staffList = STAFF.filter((s) => s.role !== "responsible_individual" && s.is_active);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            New Goal — {getYPName(plan.child_id)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="space-y-1">
            <Label className="text-xs text-[var(--cs-text-secondary)]">Domain</Label>
            <Select value={domain} onValueChange={(v) => setDomain(v as CarePlanDomain)}>
              <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.entries(DOMAIN_LABELS) as [CarePlanDomain, string][]).map(([k, v]) => (
                  <SelectItem key={k} value={k} className="text-xs">{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-[var(--cs-text-secondary)]">Goal Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Improve school attendance to 90%"
              className="text-xs"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-[var(--cs-text-secondary)]">Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the goal, context, and rationale..."
              className="text-xs min-h-[60px]"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-[var(--cs-text-secondary)]">Desired Outcome / Success Criteria</Label>
            <Textarea
              value={desiredOutcome}
              onChange={(e) => setDesiredOutcome(e.target.value)}
              placeholder="What does success look like?"
              className="text-xs min-h-[50px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-[var(--cs-text-secondary)]">Target Date</Label>
              <Input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-[var(--cs-text-secondary)]">Responsible Staff</Label>
              <Select value={responsibleStaff} onValueChange={setResponsibleStaff}>
                <SelectTrigger className="text-xs"><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {staffList.map((s) => (
                    <SelectItem key={s.id} value={s.id} className="text-xs">{s.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-xs">Cancel</Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!title.trim() || !description.trim() || saving}
            className="text-xs gap-1.5"
          >
            {saving ? "Adding..." : <><Plus className="h-3.5 w-3.5" />Add Goal</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Care Plan Card ────────────────────────────────────────────────────────────

function CarePlanCard({
  plan,
  onCaraOverview,
  caraBusy,
  defaultExpanded = true,
  onAddGoal,
}: {
  plan: CarePlan;
  onCaraOverview: (p: CarePlan) => void;
  caraBusy: string | null;
  defaultExpanded?: boolean;
  onAddGoal: (plan: CarePlan) => void;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const ypName   = getYPName(plan.child_id);
  const rag      = overallRAG(plan);
  const lacDays  = lacDaysUntil(plan.next_lac_review);

  const attentionGoals = plan.goals.filter((g) => g.status === "attention_needed");
  const onTrackGoals   = plan.goals.filter((g) => g.status === "on_track");
  const inProgGoals    = plan.goals.filter((g) => g.status === "in_progress");
  const achievedGoals  = plan.goals.filter((g) => g.status === "achieved");

  return (
    <div className={cn(
      "rounded-2xl border bg-white overflow-hidden",
      rag === "red" ? "border-red-200" : rag === "amber" ? "border-amber-200" : "border-emerald-200",
    )}>
      {/* Header */}
      <div className="flex items-start gap-3 p-4">
        {/* RAG + avatar */}
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm",
          rag === "red" ? "bg-red-100 text-red-700" :
          rag === "amber" ? "bg-amber-100 text-amber-700" :
          "bg-emerald-100 text-emerald-700",
        )}>
          {ypName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <Link href={`/young-people/${plan.child_id}`} className="text-sm font-bold text-[var(--cs-navy)] hover:text-indigo-600 transition-colors">
              {ypName}
            </Link>
            <Badge variant="outline" className={cn(
              "text-[10px] px-1.5 py-0 border",
              rag === "red" ? "bg-red-50 text-red-700 border-red-200" :
              rag === "amber" ? "bg-amber-50 text-amber-700 border-amber-200" :
              "bg-emerald-50 text-emerald-700 border-emerald-200",
            )}>
              {rag === "red" ? "⚠ Needs attention" : rag === "amber" ? "Review recommended" : "On track"}
            </Badge>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-slate-50 text-[var(--cs-text-secondary)] border-[var(--cs-border)]">
              v{plan.version} · {plan.legal_status}
            </Badge>
          </div>

          <div className="flex items-center gap-3 text-xs text-[var(--cs-text-muted)] flex-wrap">
            {plan.keyworker_id && (
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />Key worker: {getStaffName(plan.keyworker_id)}
              </span>
            )}
            {lacDays !== null && (
              <span className={cn(
                "flex items-center gap-1",
                lacDays < 0 ? "text-red-600 font-medium" : lacDays <= 30 ? "text-amber-600 font-medium" : "",
              )}>
                <Calendar className="h-3 w-3" />
                LAC review: {lacDays < 0 ? `${Math.abs(lacDays)}d overdue` : lacDays === 0 ? "today" : `in ${lacDays}d`}
              </span>
            )}
          </div>

          {/* Quick goal counts */}
          <div className="flex items-center gap-3 mt-1.5 text-[10px]">
            {attentionGoals.length > 0 && <span className="text-red-600 font-medium">{attentionGoals.length} attention needed</span>}
            {onTrackGoals.length > 0 && <span className="text-emerald-600 font-medium">{onTrackGoals.length} on track</span>}
            {inProgGoals.length > 0 && <span className="text-blue-600 font-medium">{inProgGoals.length} in progress</span>}
            {achievedGoals.length > 0 && <span className="text-emerald-700 font-medium">{achievedGoals.length} achieved</span>}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link href={`/care-plans/${plan.id}`} className="text-[11px] font-medium text-indigo-600 hover:underline" onClick={(e) => e.stopPropagation()}>
            Detail →
          </Link>
          <button onClick={() => setExpanded(!expanded)} className="text-[var(--cs-text-muted)] hover:text-[var(--cs-text-secondary)]">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-[var(--cs-border-subtle)] px-4 pb-4 pt-3 space-y-4">
          {/* Summaries */}
          {(plan.strengths_summary || plan.concerns_summary) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {plan.strengths_summary && (
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3">
                  <p className="text-[10px] font-semibold text-emerald-700 uppercase tracking-widest mb-1">Strengths</p>
                  <p className="text-xs text-[var(--cs-text-secondary)]">{plan.strengths_summary}</p>
                </div>
              )}
              {plan.concerns_summary && (
                <div className="rounded-xl border border-red-100 bg-red-50/40 p-3">
                  <p className="text-[10px] font-semibold text-red-700 uppercase tracking-widest mb-1">Concerns</p>
                  <p className="text-xs text-[var(--cs-text-secondary)]">{plan.concerns_summary}</p>
                </div>
              )}
            </div>
          )}

          {/* Goals — attention needed first */}
          <div>
            <p className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-widest mb-2">Goals ({plan.goals.length})</p>
            <div className="space-y-2">
              {[...plan.goals]
                .sort((a, b) => {
                  const order: Record<CarePlanGoalStatus, number> = {
                    attention_needed: 0, not_started: 1, in_progress: 2,
                    on_track: 3, achieved: 4, closed: 5,
                  };
                  return order[a.status] - order[b.status];
                })
                .map((goal) => (
                  <GoalRow key={goal.id} goal={goal} />
                ))}
            </div>
          </div>

          {/* Cara overview */}
          {plan.cara_overview ? (
            <div className="rounded-xl border border-teal-100 bg-teal-50/40 p-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Sparkles className="h-3.5 w-3.5 text-teal-600" />
                <p className="text-[10px] font-semibold text-teal-700 uppercase tracking-widest">Cara Overview</p>
              </div>
              <p className="text-xs text-[var(--cs-text-secondary)]">{plan.cara_overview}</p>
            </div>
          ) : (
            <button
              onClick={() => onCaraOverview(plan)}
              disabled={caraBusy === plan.id}
              className="inline-flex items-center gap-1.5 text-xs text-teal-600 hover:text-teal-800 disabled:opacity-50"
            >
              {caraBusy === plan.id
                ? <><Sparkles className="h-3.5 w-3.5 animate-spin" />Cara generating…</>
                : <><Sparkles className="h-3.5 w-3.5" />Generate Cara overview</>}
            </button>
          )}

          {/* Add Goal button */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onAddGoal(plan)}
              className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            >
              <Plus className="h-3.5 w-3.5" />Add Goal
            </button>
          </div>

          {/* Smart Links */}
          <SmartLinkPanel
            sourceType="care_plan"
            sourceId={plan.id}
            childId={plan.child_id}
            compact
          />

          {/* Sign-off */}
          {plan.rm_sign_off_date && (
            <p className="text-[10px] text-[var(--cs-text-muted)]">
              RM signed off {formatDate(plan.rm_sign_off_date)}{plan.rm_sign_off_by ? ` · ${getStaffName(plan.rm_sign_off_by)}` : ""}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CarePlansPage() {
  const plansQuery  = useCarePlans({ homeId: "home_oak" });
  const updatePlan  = useUpdateCarePlan();

  const plans  = plansQuery.data?.data ?? [];
  const meta   = plansQuery.data?.meta;

  const [caraBusy, setCaraBusy]   = useState<string | null>(null);
  const [caraError, setCaraError] = useState<string | null>(null);
  const [search, setSearch]       = useState("");
  const [ragFilter, setRAGFilter] = useState<RAGFilter>("all");
  const [sortBy, setSortBy]       = useState<"rag" | "name" | "lac" | "goals">("rag");
  const [allExpanded, setAllExpanded] = useState(true);
  const [goalDialogPlan, setGoalDialogPlan] = useState<CarePlan | null>(null);

  // ── Compute stats ─────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const totalGoals = plans.reduce((n, p) => n + p.goals.length, 0);
    const achievedGoals = plans.reduce((n, p) => n + p.goals.filter((g) => g.status === "achieved").length, 0);
    const totalAttention = plans.reduce((n, p) => n + p.goals.filter((g) => g.status === "attention_needed").length, 0);
    const lacOverdue = plans.filter((p) => {
      const d = lacDaysUntil(p.next_lac_review);
      return d !== null && d < 0;
    }).length;
    const lacDueWithin30 = plans.filter((p) => {
      const d = lacDaysUntil(p.next_lac_review);
      return d !== null && d >= 0 && d <= 30;
    }).length;
    const withoutCaraOverview = plans.filter((p) => !p.cara_overview).length;

    const redCount   = plans.filter((p) => overallRAG(p) === "red").length;
    const amberCount = plans.filter((p) => overallRAG(p) === "amber").length;
    const greenCount = plans.filter((p) => overallRAG(p) === "green").length;

    return {
      total: plans.length, totalGoals, achievedGoals, totalAttention,
      lacOverdue, lacDueWithin30, withoutCaraOverview,
      redCount, amberCount, greenCount,
    };
  }, [plans]);

  // ── Filtered & sorted plans ───────────────────────────────────────────────
  const filteredPlans = useMemo(() => {
    const q = search.toLowerCase().trim();
    let list = plans;

    // RAG filter
    if (ragFilter !== "all") {
      list = list.filter((p) => overallRAG(p) === ragFilter);
    }

    // Search by child name or key worker
    if (q) {
      list = list.filter((p) => {
        const ypName = getYPName(p.child_id).toLowerCase();
        const kwName = p.keyworker_id ? getStaffName(p.keyworker_id).toLowerCase() : "";
        const legalStatus = p.legal_status.toLowerCase();
        return ypName.includes(q) || kwName.includes(q) || legalStatus.includes(q);
      });
    }

    // Sort
    const ragOrder = { red: 0, amber: 1, green: 2 };
    return [...list].sort((a, b) => {
      switch (sortBy) {
        case "name": return getYPName(a.child_id).localeCompare(getYPName(b.child_id));
        case "lac": {
          const da = lacDaysUntil(a.next_lac_review) ?? 999;
          const db = lacDaysUntil(b.next_lac_review) ?? 999;
          return da - db;
        }
        case "goals": return b.goals.filter((g) => g.status === "attention_needed").length - a.goals.filter((g) => g.status === "attention_needed").length;
        default: return ragOrder[overallRAG(a)] - ragOrder[overallRAG(b)];
      }
    });
  }, [plans, search, ragFilter, sortBy]);

  const handleCaraOverview = async (plan: CarePlan) => {
    setCaraBusy(plan.id);
    setCaraError(null);
    try {
      const ypName = getYPName(plan.child_id);
      const goalSummary = plan.goals
        .map((g) => `[${GOAL_STATUS_LABELS[g.status].toUpperCase()}] ${DOMAIN_LABELS[g.domain]}: ${g.title}`)
        .join("\n");

      const prompt = `You are Cara, a regulatory compliance and care quality AI for a children's residential home. Analyse this care plan and produce a concise 2–3 sentence professional overview for the registered manager, covering: overall care plan status, the most pressing priorities, and any regulatory or placement stability considerations.

Young person: ${ypName}
Legal status: ${plan.legal_status}
Placement started: ${plan.placement_start}
Next LAC review: ${plan.next_lac_review ?? "not set"}

Goals:
${goalSummary}

Strengths: ${plan.strengths_summary ?? "not recorded"}
Concerns: ${plan.concerns_summary ?? "not recorded"}`;

      const response = await api.post<{ choices: { message: { content: string } }[] }>(
        "/cara/chat",
        { messages: [{ role: "user", content: prompt }], context: "care_plan_overview" },
      );

      const overview =
        response?.choices?.[0]?.message?.content ??
        `${ypName}'s care plan (v${plan.version}) has ${plan.goals.length} goals — ${plan.goals.filter((g) => g.status === "attention_needed").length} requiring attention, ${plan.goals.filter((g) => g.status === "on_track").length} on track. ${plan.next_lac_review ? `Next LAC review ${formatDate(plan.next_lac_review)}.` : "LAC review date not set."} ${plan.concerns_summary ? "Key concerns: " + plan.concerns_summary.slice(0, 100) + "…" : ""}`;

      await updatePlan.mutateAsync({ id: plan.id, data: { cara_overview: overview } });
    } catch {
      setCaraError("Cara generation failed — please try again");
    } finally {
      setCaraBusy(null);
    }
  };

  const handleAddGoal = async (planId: string, goal: CarePlanGoal) => {
    const plan = plans.find((p) => p.id === planId);
    if (!plan) return;
    const updatedGoals = [...plan.goals, goal];
    await updatePlan.mutateAsync({ id: planId, data: { goals: updatedGoals } });
    toastSuccess("Goal added", `"${goal.title}" added to ${getYPName(plan.child_id)}'s care plan`);
  };

  const RAG_TABS: { key: RAGFilter; label: string; count: number; colour: string }[] = [
    { key: "all",   label: "All Plans",        count: stats.total,      colour: "" },
    { key: "red",   label: "Needs Attention",  count: stats.redCount,   colour: "text-red-600" },
    { key: "amber", label: "Review",           count: stats.amberCount, colour: "text-amber-600" },
    { key: "green", label: "On Track",         count: stats.greenCount, colour: "text-emerald-600" },
  ];

  return (
    <PageShell
      title="Care Plans"
      subtitle="Statutory care plan goals, progress and LAC review tracking"
      showQuickCreate={false}
      caraContext={{ pageTitle: "Care Plans", sourceType: "care_plan" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={filteredPlans} columns={CARE_PLAN_EXPORT_COLS} filename="care-plans" />
          <PrintButton title="Care Plans" subtitle="Chamberlain House — Statutory Care Plan Overview" targetId="care-plans-content" />
          <SmartUploadButton
            variant="inline"
            label="Upload Care Plan"
            uploadContext="Care Plans — care plan document, placement plan or LAC review upload"
          />
          <Link href="/young-people">
            <button className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--cs-border)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--cs-text-secondary)] hover:bg-[var(--cs-surface)] transition-colors">
              <Heart className="h-3.5 w-3.5" />
              Young People
            </button>
          </Link>
          <CaraStudioQuickActionButton context={{ record_type: "care_plan", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="care-plans-content" className="space-y-5">

      <CaraPanel
        mode="assist"
        pageContext="Care Plans — Statutory planning"
        recordType="care_plan"
        userRole="registered_manager"
        className="mb-5"
      />

      {/* ── LAC review alerts ── */}
      {stats.lacOverdue > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 flex items-center gap-3">
          <div className="rounded-full bg-red-100 p-1.5">
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-800">
              {stats.lacOverdue} LAC review{stats.lacOverdue !== 1 ? "s" : ""} overdue
            </p>
            <p className="text-xs text-red-600 mt-0.5">
              Overdue LAC reviews must be escalated to the IRO immediately. This is a statutory requirement.
            </p>
          </div>
        </div>
      )}
      {stats.lacDueWithin30 > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-center gap-3">
          <div className="rounded-full bg-amber-100 p-1.5">
            <Calendar className="h-4 w-4 text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">
              {stats.lacDueWithin30} LAC review{stats.lacDueWithin30 !== 1 ? "s" : ""} due within 30 days
            </p>
            <p className="text-xs text-amber-600 mt-0.5">
              Ensure IRO is notified and review paperwork is prepared.
            </p>
          </div>
        </div>
      )}

      {/* ── Summary stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          {
            label: "Active Plans",
            value: stats.total,
            icon: ClipboardList,
            colour: "text-indigo-600",
            bg: "bg-indigo-50 border-indigo-100",
          },
          {
            label: "Total Goals",
            value: stats.totalGoals,
            icon: Target,
            colour: "text-blue-600",
            bg: "bg-blue-50 border-blue-100",
          },
          {
            label: "Achieved",
            value: stats.achievedGoals,
            icon: Trophy,
            colour: "text-emerald-600",
            bg: "bg-emerald-50 border-emerald-100",
          },
          {
            label: "Attention Needed",
            value: stats.totalAttention,
            icon: AlertTriangle,
            colour: stats.totalAttention > 0 ? "text-red-600" : "text-emerald-600",
            bg: stats.totalAttention > 0 ? "bg-red-50 border-red-100" : "bg-emerald-50 border-emerald-100",
          },
          {
            label: "LAC Reviews Due",
            value: stats.lacDueWithin30,
            icon: Calendar,
            colour: stats.lacDueWithin30 > 0 ? "text-amber-600" : "text-emerald-600",
            bg: stats.lacDueWithin30 > 0 ? "bg-amber-50 border-amber-100" : "bg-emerald-50 border-emerald-100",
          },
          {
            label: "LAC Overdue",
            value: stats.lacOverdue,
            icon: Clock,
            colour: stats.lacOverdue > 0 ? "text-red-600" : "text-emerald-600",
            bg: stats.lacOverdue > 0 ? "bg-red-50 border-red-100" : "bg-emerald-50 border-emerald-100",
          },
        ].map(({ label, value, icon: Icon, colour, bg }) => (
          <div key={label} className={cn("rounded-xl border p-3", bg)}>
            <div className="flex items-center gap-2 mb-1">
              <Icon className={cn("h-4 w-4 shrink-0", colour)} />
              <span className="text-[10px] text-[var(--cs-text-muted)] font-medium">{label}</span>
            </div>
            <p className={cn("text-lg font-bold", colour)}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── RAG filter tabs + search ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {RAG_TABS.map(({ key, label, count, colour }) => (
            <button
              key={key}
              onClick={() => setRAGFilter(key)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5",
                ragFilter === key
                  ? "bg-white text-[var(--cs-navy)] shadow-sm"
                  : "text-[var(--cs-text-muted)] hover:text-[var(--cs-text-secondary)]",
              )}
            >
              {label}
              <span className={cn(
                "text-[10px] tabular-nums",
                ragFilter === key ? colour || "text-[var(--cs-text-secondary)]" : "text-[var(--cs-text-muted)]",
              )}>{count}</span>
            </button>
          ))}
        </div>

        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--cs-text-muted)]" />
          <input
            type="text"
            placeholder="Search by child, key worker, or legal status..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-[var(--cs-border)] bg-white py-1.5 pl-9 pr-3 text-xs text-[var(--cs-text-secondary)] placeholder:text-[var(--cs-text-muted)] focus:border-[var(--cs-cara-gold)] focus:ring-1 focus:ring-[var(--cs-cara-gold)]/30 outline-none transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs text-[var(--cs-text-muted)] shrink-0">
          <ArrowUpDown className="h-3.5 w-3.5" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="rounded-lg border border-[var(--cs-border)] bg-white px-2 py-1.5 text-xs text-[var(--cs-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--cs-cara-gold)]/40"
          >
            <option value="rag">RAG Status</option>
            <option value="name">Child Name</option>
            <option value="lac">LAC Review</option>
            <option value="goals">Attention Goals</option>
          </select>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="text-xs gap-1.5 shrink-0"
          onClick={() => setAllExpanded((p) => !p)}
        >
          {allExpanded ? <ListCollapse className="h-3.5 w-3.5" /> : <Expand className="h-3.5 w-3.5" />}
          {allExpanded ? "Collapse All" : "Expand All"}
        </Button>
      </div>

      {/* Results count when filtered */}
      {(search || ragFilter !== "all") && (
        <p className="text-xs text-[var(--cs-text-muted)]">
          Showing {filteredPlans.length} of {stats.total} plan{stats.total !== 1 ? "s" : ""}
          {search && <span className="text-[var(--cs-text-muted)]"> matching &ldquo;{search}&rdquo;</span>}
        </p>
      )}

      {/* ── Care plan cards ── */}
      <div className="space-y-4">
        {filteredPlans.map((plan) => (
          <CarePlanCard
            key={plan.id}
            plan={plan}
            onCaraOverview={handleCaraOverview}
            caraBusy={caraBusy}
            defaultExpanded={allExpanded}
            onAddGoal={(p) => setGoalDialogPlan(p)}
          />
        ))}
        {caraError && <p className="text-xs text-red-600 text-right">{caraError}</p>}
        {filteredPlans.length === 0 && plans.length > 0 && (
          <div className="text-center py-12 text-[var(--cs-text-muted)]">
            <Search className="h-8 w-8 mx-auto mb-2 text-[var(--cs-text-gentle)]" />
            <p className="text-sm">No care plans match your filters</p>
            <button onClick={() => { setSearch(""); setRAGFilter("all"); }} className="text-xs text-indigo-600 hover:underline mt-1">
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* ── Domain coverage matrix ── */}
      {plans.length > 0 && (
        <div className="rounded-2xl border border-[var(--cs-border)] bg-white overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--cs-border-subtle)] bg-slate-50 flex items-center gap-2">
            <BarChart3 className="h-3.5 w-3.5 text-indigo-500" />
            <p className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase tracking-widest">Domain Coverage Across All Plans</p>
          </div>
          <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(Object.entries(DOMAIN_LABELS) as [CarePlanDomain, string][]).map(([domain, label]) => {
              const goalCount = plans.reduce((n, p) => n + p.goals.filter((g) => g.domain === domain).length, 0);
              const attentionCount = plans.reduce((n, p) => n + p.goals.filter((g) => g.domain === domain && g.status === "attention_needed").length, 0);
              const achievedCount = plans.reduce((n, p) => n + p.goals.filter((g) => g.domain === domain && g.status === "achieved").length, 0);
              return (
                <div key={domain} className={cn("rounded-xl border p-2.5", DOMAIN_COLOUR[domain])}>
                  <p className="text-[11px] font-semibold">{label}</p>
                  <div className="flex items-center gap-2 mt-1 text-[10px]">
                    <span>{goalCount} goal{goalCount !== 1 ? "s" : ""}</span>
                    {attentionCount > 0 && <span className="text-red-600 font-medium">{attentionCount} attention</span>}
                    {achievedCount > 0 && <span className="text-emerald-700 font-medium">{achievedCount} achieved</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Goal progress overview ── */}
      {stats.totalGoals > 0 && (
        <div className="rounded-2xl border border-[var(--cs-border)] bg-white overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--cs-border-subtle)] bg-slate-50 flex items-center gap-2">
            <Activity className="h-3.5 w-3.5 text-indigo-500" />
            <p className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase tracking-widest">Goal Status Overview</p>
          </div>
          <div className="p-4 space-y-3">
            {/* Progress bar showing all goal statuses stacked */}
            {(() => {
              const allCounts = [
                { status: "achieved" as CarePlanGoalStatus,         count: plans.reduce((n, p) => n + p.goals.filter((g) => g.status === "achieved").length, 0),         colour: "bg-emerald-500", label: "Achieved" },
                { status: "on_track" as CarePlanGoalStatus,         count: plans.reduce((n, p) => n + p.goals.filter((g) => g.status === "on_track").length, 0),         colour: "bg-emerald-300", label: "On Track" },
                { status: "in_progress" as CarePlanGoalStatus,      count: plans.reduce((n, p) => n + p.goals.filter((g) => g.status === "in_progress").length, 0),      colour: "bg-blue-400",    label: "In Progress" },
                { status: "not_started" as CarePlanGoalStatus,      count: plans.reduce((n, p) => n + p.goals.filter((g) => g.status === "not_started").length, 0),      colour: "bg-slate-300",   label: "Not Started" },
                { status: "attention_needed" as CarePlanGoalStatus, count: plans.reduce((n, p) => n + p.goals.filter((g) => g.status === "attention_needed").length, 0), colour: "bg-red-400",     label: "Attention" },
                { status: "closed" as CarePlanGoalStatus,           count: plans.reduce((n, p) => n + p.goals.filter((g) => g.status === "closed").length, 0),           colour: "bg-slate-200",   label: "Closed" },
              ];
              const counts = allCounts.filter((c) => c.count > 0);
              const total = stats.totalGoals;

              return (
                <>
                  <div className="h-4 w-full rounded-full overflow-hidden flex bg-slate-100">
                    {counts.map(({ status, count, colour }) => (
                      <div
                        key={status}
                        className={cn("h-full transition-all", colour)}
                        style={{ width: `${(count / total) * 100}%` }}
                        title={`${count} ${status.replace(/_/g, " ")}`}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-4 flex-wrap">
                    {counts.map(({ status, count, colour, label }) => (
                      <div key={status} className="flex items-center gap-1.5 text-[10px] text-[var(--cs-text-secondary)]">
                        <span className={cn("w-2.5 h-2.5 rounded-full", colour)} />
                        <span className="font-medium">{label}</span>
                        <span className="text-[var(--cs-text-muted)] tabular-nums">{count}</span>
                      </div>
                    ))}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* ── Regulatory note ── */}
      <div className="rounded-xl border border-[var(--cs-border-subtle)] bg-slate-50 px-4 py-3 text-xs text-[var(--cs-text-muted)]">
        <span className="font-semibold text-[var(--cs-text-secondary)]">Regulatory Basis — </span>
        Care Planning, Placement and Case Review (England) Regulations 2010: every looked-after child
        must have a care plan that is reviewed at each LAC review (within 20 days of placement, then
        3-monthly, then 6-monthly). The home must implement the care plan and record progress.
        Children&apos;s Homes Quality Standard 1 requires evidence of individual, child-centred care
        planning and measurable outcomes — assessed at every ILACS inspection.
      </div>

      </div>{/* close #care-plans-content */}

      {/* New Goal Dialog */}
      {goalDialogPlan && (
        <NewGoalDialog
          plan={goalDialogPlan}
          open={!!goalDialogPlan}
          onOpenChange={(open) => { if (!open) setGoalDialogPlan(null); }}
          onSave={handleAddGoal}
        />
      )}
      <CareEventsPanel
        title="Care Events — Care Planning"
        category={["general", "behaviour", "health"]}
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}

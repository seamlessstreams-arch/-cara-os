"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — INTERVENTIONS TRACKER
// Tracks active interventions for each young person — rationale, review dates,
// effectiveness, and linked evidence. Directly supports Ofsted ILACS evidence
// that the home takes purposeful, child-centred action when patterns emerge.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn, formatDate, todayStr } from "@/lib/utils";
import { useAuthContext } from "@/contexts/auth-context";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";
import { PrintButton } from "@/components/common/print-button";
import { ExportButton, type ExportColumn } from "@/components/common/export-button";
import {
  useAllInterventions,
  useCreateIntervention,
  useUpdateIntervention,
} from "@/hooks/use-intelligence";
import { getYPName, getStaffName } from "@/lib/seed-data";
import type { Intervention, InterventionStatus, InterventionOutcome } from "@/types/extended";
import {
  Activity, CheckCircle2, Clock, AlertTriangle, ChevronDown, ChevronUp,
  Plus, Pause, Play, Square, Search, ArrowUpDown, Filter,
  Target, TrendingUp, TrendingDown, Minus, Eye, User, Calendar,
  Sparkles, FileText, LinkIcon, Loader2, RefreshCw, X,
} from "lucide-react";

// ── Constants ──────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<InterventionStatus, string> = {
  active:       "Active",
  paused:       "Paused",
  completed:    "Completed",
  stopped:      "Stopped",
  under_review: "Under Review",
};

const STATUS_COLOUR: Record<InterventionStatus, string> = {
  active:       "bg-emerald-50 text-emerald-700 border-emerald-200",
  paused:       "bg-amber-50 text-amber-700 border-amber-200",
  completed:    "bg-blue-50 text-blue-700 border-blue-200",
  stopped:      "bg-red-50 text-red-700 border-red-200",
  under_review: "bg-[var(--cs-aria-gold-bg)] text-[var(--cs-aria-gold)] border-[var(--cs-aria-gold-soft)]",
};

const STATUS_ICONS: Record<InterventionStatus, React.ElementType> = {
  active:       Play,
  paused:       Pause,
  completed:    CheckCircle2,
  stopped:      Square,
  under_review: Eye,
};

const OUTCOME_LABELS: Record<InterventionOutcome, string> = {
  working:            "Working",
  not_working:        "Not Working",
  partially_working:  "Partially Working",
  too_early:          "Too Early to Tell",
  unknown:            "Unknown",
};

const OUTCOME_COLOUR: Record<InterventionOutcome, string> = {
  working:           "bg-emerald-50 text-emerald-700 border-emerald-200",
  not_working:       "bg-red-50 text-red-700 border-red-200",
  partially_working: "bg-amber-50 text-amber-700 border-amber-200",
  too_early:         "bg-slate-50 text-[var(--cs-text-secondary)] border-[var(--cs-border)]",
  unknown:           "bg-slate-50 text-[var(--cs-text-muted)] border-[var(--cs-border)]",
};

const OUTCOME_ICONS: Record<InterventionOutcome, React.ElementType> = {
  working:           TrendingUp,
  not_working:       TrendingDown,
  partially_working: Minus,
  too_early:         Clock,
  unknown:           Minus,
};

const INTERVENTION_EXPORT_COLS: ExportColumn<Intervention>[] = [
  { header: "Young Person", accessor: (r) => getYPName(r.child_id) },
  { header: "Title", accessor: (r) => r.title },
  { header: "Description", accessor: (r) => r.description },
  { header: "Rationale", accessor: (r) => r.rationale },
  { header: "Status", accessor: (r) => STATUS_LABELS[r.status] },
  { header: "Outcome", accessor: (r) => OUTCOME_LABELS[r.outcome] },
  { header: "Outcome Notes", accessor: (r) => r.outcome_notes ?? "" },
  { header: "Intended Outcome", accessor: (r) => r.intended_outcome },
  { header: "Started", accessor: (r) => r.started_at },
  { header: "Review Date", accessor: (r) => r.review_date ?? "" },
  { header: "Ended", accessor: (r) => r.ended_at ?? "" },
  { header: "Agreed By", accessor: (r) => r.agreed_by ? getStaffName(r.agreed_by) : "" },
  { header: "Created By", accessor: (r) => getStaffName(r.created_by) },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr); target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

function reviewBadge(reviewDate: string | null): { label: string; cls: string } | null {
  const d = daysUntil(reviewDate);
  if (d === null) return null;
  if (d < 0) return { label: `${Math.abs(d)}d overdue`, cls: "bg-red-100 text-red-700 border-red-200" };
  if (d === 0) return { label: "Today", cls: "bg-amber-100 text-amber-700 border-amber-200" };
  if (d <= 3) return { label: `${d}d`, cls: "bg-amber-100 text-amber-700 border-amber-200" };
  if (d <= 7) return { label: `${d}d`, cls: "bg-blue-100 text-blue-700 border-blue-200" };
  return { label: `${d}d`, cls: "bg-slate-100 text-[var(--cs-text-secondary)] border-[var(--cs-border)]" };
}

function daysSince(dateStr: string): number {
  const d = daysUntil(dateStr);
  return d === null ? 0 : -d;
}

// ── Intervention Card ────────────────────────────────────────────────────────

function InterventionCard({
  intervention,
  onStatusChange,
  onOutcomeChange,
  isBusy,
}: {
  intervention: Intervention;
  onStatusChange: (id: string, status: InterventionStatus) => void;
  onOutcomeChange: (id: string, outcome: InterventionOutcome, notes?: string) => void;
  isBusy: boolean;
}) {
  const [expanded, setExpanded] = useState(intervention.status === "active");
  const review = reviewBadge(intervention.review_date);
  const StatusIcon = STATUS_ICONS[intervention.status];
  const OutcomeIcon = OUTCOME_ICONS[intervention.outcome];
  const isActive = intervention.status === "active";
  const durationDays = daysSince(intervention.started_at);

  return (
    <div className={cn(
      "rounded-2xl border bg-white overflow-hidden transition-all",
      isActive && review && (daysUntil(intervention.review_date) ?? 99) < 0
        ? "border-red-200"
        : isActive
          ? "border-emerald-200"
          : intervention.status === "paused"
            ? "border-amber-200"
            : "border-[var(--cs-border)]",
    )}>
      {/* Header */}
      <div className="flex items-start gap-3 p-4">
        {/* Status indicator */}
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
          isActive ? "bg-emerald-100" :
          intervention.status === "paused" ? "bg-amber-100" :
          intervention.status === "completed" ? "bg-blue-100" :
          "bg-slate-100",
        )}>
          <StatusIcon className={cn(
            "h-4 w-4",
            isActive ? "text-emerald-700" :
            intervention.status === "paused" ? "text-amber-700" :
            intervention.status === "completed" ? "text-blue-700" :
            "text-[var(--cs-text-muted)]",
          )} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-sm font-bold text-[var(--cs-navy)]">{intervention.title}</span>
            <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 border", STATUS_COLOUR[intervention.status])}>
              {STATUS_LABELS[intervention.status]}
            </Badge>
            <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 border", OUTCOME_COLOUR[intervention.outcome])}>
              <OutcomeIcon className="h-2.5 w-2.5 mr-0.5 inline" />
              {OUTCOME_LABELS[intervention.outcome]}
            </Badge>
            {review && isActive && (
              <span className={cn("text-[9px] font-semibold px-2 py-0.5 rounded-full border", review.cls)}>
                Review {review.label}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-[var(--cs-text-muted)] flex-wrap">
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {getYPName(intervention.child_id)}
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Started {formatDate(intervention.started_at)}
              <span className="text-[var(--cs-text-muted)]">({durationDays}d ago)</span>
            </span>
            {intervention.agreed_by && (
              <>
                <span>·</span>
                <span>Agreed by {getStaffName(intervention.agreed_by)}</span>
              </>
            )}
          </div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="text-[var(--cs-text-muted)] hover:text-[var(--cs-text-secondary)] shrink-0"
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {expanded && (
        <div className="border-t border-[var(--cs-border-subtle)] px-4 pb-4 pt-3 space-y-3">
          {/* Description */}
          <div className="rounded-xl border border-[var(--cs-border)] bg-slate-50 p-3">
            <p className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-widest mb-1">What We Are Doing</p>
            <p className="text-xs text-[var(--cs-text-secondary)] leading-relaxed">{intervention.description}</p>
          </div>

          {/* Rationale */}
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-3">
            <p className="text-[10px] font-semibold text-indigo-700 uppercase tracking-widest mb-1">Why — Rationale</p>
            <p className="text-xs text-[var(--cs-text-secondary)] leading-relaxed">{intervention.rationale}</p>
          </div>

          {/* Intended outcome */}
          <div className="rounded-xl border border-teal-100 bg-teal-50/40 p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Target className="h-3 w-3 text-teal-600" />
              <p className="text-[10px] font-semibold text-teal-700 uppercase tracking-widest">Intended Outcome</p>
            </div>
            <p className="text-xs text-[var(--cs-text-secondary)] leading-relaxed">{intervention.intended_outcome}</p>
          </div>

          {/* Outcome notes (if any) */}
          {intervention.outcome_notes && (
            <div className={cn(
              "rounded-xl border p-3",
              OUTCOME_COLOUR[intervention.outcome],
            )}>
              <div className="flex items-center gap-1.5 mb-1">
                <OutcomeIcon className="h-3 w-3" />
                <p className="text-[10px] font-semibold uppercase tracking-widest opacity-80">
                  Progress Update — {OUTCOME_LABELS[intervention.outcome]}
                </p>
              </div>
              <p className="text-xs leading-relaxed">{intervention.outcome_notes}</p>
            </div>
          )}

          {/* Evidence links */}
          {intervention.evidence_refs.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-widest mb-2">Linked Evidence</p>
              <div className="space-y-1.5">
                {intervention.evidence_refs.map((ref, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 rounded-lg border border-[var(--cs-border-subtle)] bg-white px-3 py-2"
                  >
                    <LinkIcon className="h-3 w-3 text-[var(--cs-text-muted)] shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <span className="font-medium text-[var(--cs-text-secondary)] capitalize">{ref.type.replace(/_/g, " ")}</span>
                      <span className="text-[var(--cs-text-muted)] ml-1.5">{formatDate(ref.date)}</span>
                      <p className="text-[var(--cs-text-muted)] mt-0.5 leading-relaxed">{ref.excerpt}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Review & timeline info */}
          <div className="flex items-center gap-4 text-[10px] text-[var(--cs-text-muted)] flex-wrap">
            {intervention.review_date && (
              <span>Review: {formatDate(intervention.review_date)}</span>
            )}
            {intervention.ended_at && (
              <span>Ended: {formatDate(intervention.ended_at)}</span>
            )}
            <span>Created by {getStaffName(intervention.created_by)} · {formatDate(intervention.created_at)}</span>
          </div>

          {/* Status actions */}
          {(isActive || intervention.status === "paused" || intervention.status === "under_review") && (
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              {isActive && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs text-amber-700 border-amber-200 hover:bg-amber-50"
                    onClick={() => onStatusChange(intervention.id, "paused")}
                    disabled={isBusy}
                  >
                    <Pause className="h-3 w-3 mr-1" />Pause
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs text-[var(--cs-aria-gold)] border-[var(--cs-aria-gold-soft)] hover:bg-[var(--cs-aria-gold-bg)]"
                    onClick={() => onStatusChange(intervention.id, "under_review")}
                    disabled={isBusy}
                  >
                    <Eye className="h-3 w-3 mr-1" />Mark for Review
                  </Button>
                  <Button
                    size="sm"
                    className="h-7 text-xs bg-blue-600 hover:bg-blue-700"
                    onClick={() => onStatusChange(intervention.id, "completed")}
                    disabled={isBusy}
                  >
                    <CheckCircle2 className="h-3 w-3 mr-1" />Complete
                  </Button>
                </>
              )}
              {intervention.status === "paused" && (
                <>
                  <Button
                    size="sm"
                    className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => onStatusChange(intervention.id, "active")}
                    disabled={isBusy}
                  >
                    <Play className="h-3 w-3 mr-1" />Resume
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs text-red-700 border-red-200 hover:bg-red-50"
                    onClick={() => onStatusChange(intervention.id, "stopped")}
                    disabled={isBusy}
                  >
                    <Square className="h-3 w-3 mr-1" />Stop
                  </Button>
                </>
              )}
              {intervention.status === "under_review" && (
                <>
                  <Button
                    size="sm"
                    className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => onStatusChange(intervention.id, "active")}
                    disabled={isBusy}
                  >
                    <Play className="h-3 w-3 mr-1" />Continue Active
                  </Button>
                  <Button
                    size="sm"
                    className="h-7 text-xs bg-blue-600 hover:bg-blue-700"
                    onClick={() => onStatusChange(intervention.id, "completed")}
                    disabled={isBusy}
                  >
                    <CheckCircle2 className="h-3 w-3 mr-1" />Complete
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs text-red-700 border-red-200 hover:bg-red-50"
                    onClick={() => onStatusChange(intervention.id, "stopped")}
                    disabled={isBusy}
                  >
                    <Square className="h-3 w-3 mr-1" />Stop
                  </Button>
                </>
              )}

              {/* Outcome assessment */}
              <div className="ml-auto flex items-center gap-1.5">
                <span className="text-[10px] text-[var(--cs-text-muted)] font-medium">Effectiveness:</span>
                <select
                  value={intervention.outcome}
                  onChange={(e) => onOutcomeChange(intervention.id, e.target.value as InterventionOutcome)}
                  disabled={isBusy}
                  className="rounded-lg border border-[var(--cs-border)] bg-white px-2 py-1 text-[11px] text-[var(--cs-text-secondary)] focus:border-teal-300 focus:ring-1 focus:ring-teal-200 outline-none"
                >
                  {(Object.entries(OUTCOME_LABELS) as [InterventionOutcome, string][]).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── New Intervention Dialog ──────────────────────────────────────────────────

function NewInterventionDialog({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<Intervention>) => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    child_id: "yp_alex",
    title: "",
    description: "",
    rationale: "",
    intended_outcome: "",
    review_date: "",
  });

  const handleSave = async () => {
    if (!form.title.trim() || !form.description.trim() || !form.rationale.trim()) return;
    setSaving(true);
    try {
      await onSave({
        ...form,
        home_id: "home_oak",
        started_at: todayStr(),
        review_date: form.review_date || null,
        agreed_by: "staff_darren",
        status: "active",
        outcome: "too_early",
        outcome_notes: null,
        ended_at: null,
        evidence_refs: [],
        created_by: "staff_darren",
      });
      onClose();
      setForm({ child_id: "yp_alex", title: "", description: "", rationale: "", intended_outcome: "", review_date: "" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Activity className="h-4 w-4 text-emerald-600" />
            Create New Intervention
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[var(--cs-text-muted)] font-medium mb-1 block">Young person <span className="text-red-500">*</span></label>
              <Select
                value={form.child_id}
                onValueChange={(v) => setForm((p) => ({ ...p, child_id: v }))}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["yp_alex", "yp_jordan", "yp_casey"].map((id) => (
                    <SelectItem key={id} value={id} className="text-xs">{getYPName(id)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-[var(--cs-text-muted)] font-medium mb-1 block">Review date</label>
              <Input
                type="date"
                value={form.review_date}
                onChange={(e) => setForm((p) => ({ ...p, review_date: e.target.value }))}
                className="h-8 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-[var(--cs-text-muted)] font-medium mb-1 block">Intervention title <span className="text-red-500">*</span></label>
            <Input
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="e.g. Evening transition support plan"
              className="h-8 text-xs"
            />
          </div>

          <div>
            <label className="text-xs text-[var(--cs-text-muted)] font-medium mb-1 block">What are we doing? <span className="text-red-500">*</span></label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Describe the intervention — what staff will do, when, and how…"
              rows={3}
              className="text-xs"
            />
          </div>

          <div>
            <label className="text-xs text-[var(--cs-text-muted)] font-medium mb-1 block">Why — rationale <span className="text-red-500">*</span></label>
            <Textarea
              value={form.rationale}
              onChange={(e) => setForm((p) => ({ ...p, rationale: e.target.value }))}
              placeholder="Evidence base, pattern identified, professional reasoning…"
              rows={3}
              className="text-xs"
            />
          </div>

          <div>
            <label className="text-xs text-[var(--cs-text-muted)] font-medium mb-1 block">Intended outcome</label>
            <Textarea
              value={form.intended_outcome}
              onChange={(e) => setForm((p) => ({ ...p, intended_outcome: e.target.value }))}
              placeholder="What measurable change are we looking for?"
              rows={2}
              className="text-xs"
            />
          </div>

          <p className="text-[10px] text-[var(--cs-text-muted)]">
            Interventions should be evidence-based, proportionate, and reviewed regularly.
            Link to pattern alerts, incidents, or observations where possible.
          </p>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving || !form.title.trim() || !form.description.trim() || !form.rationale.trim()}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {saving ? "Saving…" : "Create Intervention"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

type ViewTab = "active" | "all" | "completed" | "review_due";

export default function InterventionsPage() {
  const interventionsQuery = useAllInterventions("home_oak");
  const createIntervention = useCreateIntervention();
  const updateIntervention = useUpdateIntervention();

  const interventions = interventionsQuery.data?.data ?? [];
  const isLoading = interventionsQuery.isPending;

  const [showNew, setShowNew] = useState(false);
  const [viewTab, setViewTab] = useState<ViewTab>("active");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "child" | "outcome" | "review">("date");
  const [childFilter, setChildFilter] = useState<string>("all");

  // Compute counts
  const activeList = useMemo(() => interventions.filter((i) => i.status === "active"), [interventions]);
  const completedList = useMemo(() => interventions.filter((i) => i.status === "completed" || i.status === "stopped"), [interventions]);
  const reviewDueList = useMemo(() => {
    const today = todayStr();
    return interventions.filter((i) =>
      (i.status === "active" || i.status === "under_review") &&
      i.review_date &&
      i.review_date <= today,
    );
  }, [interventions]);

  const workingCount = useMemo(() => activeList.filter((i) => i.outcome === "working").length, [activeList]);
  const notWorkingCount = useMemo(() =>
    activeList.filter((i) => i.outcome === "not_working").length, [activeList]);

  // Unique children for filter
  const childIds = useMemo(() => {
    const ids = new Set(interventions.map((i) => i.child_id));
    return Array.from(ids).sort();
  }, [interventions]);

  // Filtered + sorted list
  const filtered = useMemo(() => {
    let list = interventions;

    // Tab filter
    switch (viewTab) {
      case "active":
        list = list.filter((i) => i.status === "active" || i.status === "paused" || i.status === "under_review");
        break;
      case "completed":
        list = list.filter((i) => i.status === "completed" || i.status === "stopped");
        break;
      case "review_due":
        list = reviewDueList;
        break;
      // "all" — no filter
    }

    // Child filter
    if (childFilter !== "all") {
      list = list.filter((i) => i.child_id === childFilter);
    }

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((i) =>
        i.title.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        i.rationale.toLowerCase().includes(q) ||
        getYPName(i.child_id).toLowerCase().includes(q) ||
        i.intended_outcome.toLowerCase().includes(q)
      );
    }

    // Sort
    list = [...list].sort((a, b) => {
      switch (sortBy) {
        case "child":
          return getYPName(a.child_id).localeCompare(getYPName(b.child_id));
        case "outcome": {
          const outcomeOrder: Record<string, number> = {
            not_working: 0, partially_working: 1, too_early: 2, unknown: 3, working: 4,
          };
          return (outcomeOrder[a.outcome] ?? 5) - (outcomeOrder[b.outcome] ?? 5);
        }
        case "review": {
          const aDate = a.review_date ?? "9999-12-31";
          const bDate = b.review_date ?? "9999-12-31";
          return aDate.localeCompare(bDate);
        }
        default:
          return b.started_at.localeCompare(a.started_at);
      }
    });

    return list;
  }, [interventions, viewTab, childFilter, search, sortBy, reviewDueList]);

  const handleStatusChange = async (id: string, status: InterventionStatus) => {
    await updateIntervention.mutateAsync({
      id,
      status,
      ...(status === "completed" || status === "stopped" ? { ended_at: todayStr() } : {}),
    });
  };

  const handleOutcomeChange = async (id: string, outcome: InterventionOutcome, notes?: string) => {
    await updateIntervention.mutateAsync({ id, outcome, ...(notes ? { outcome_notes: notes } : {}) });
  };

  const handleCreate = async (data: Partial<Intervention>) => {
    await createIntervention.mutateAsync(data);
  };

  return (
    <PageShell
      title="Interventions"
      subtitle="Child-centred interventions — tracking what we are doing, why, and whether it is working"
      quickCreateContext={{ module: "young-people", defaultTaskCategory: "young_person_plans" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={filtered} columns={INTERVENTION_EXPORT_COLS} filename="interventions" />
          <PrintButton title="Interventions" subtitle="Oak House — Interventions Tracker" targetId="interventions-content" />
          <SmartUploadButton variant="inline" label="Upload" uploadContext="Interventions — evidence or supporting document upload" />
          <Button
            size="sm"
            onClick={() => setShowNew(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 h-8 text-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            New Intervention
          </Button>
        </div>
      }
    >
      <div id="interventions-content" className="space-y-5 animate-fade-in">

        {/* ── Summary stats ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            {
              label: "Active",
              value: activeList.length,
              icon: Activity,
              colour: activeList.length > 0 ? "text-emerald-600" : "text-[var(--cs-text-muted)]",
              bg: activeList.length > 0 ? "bg-emerald-50 border-emerald-100" : "bg-slate-50 border-[var(--cs-border-subtle)]",
            },
            {
              label: "Review Due",
              value: reviewDueList.length,
              icon: AlertTriangle,
              colour: reviewDueList.length > 0 ? "text-red-600" : "text-emerald-600",
              bg: reviewDueList.length > 0 ? "bg-red-50 border-red-100" : "bg-emerald-50 border-emerald-100",
            },
            {
              label: "Working",
              value: workingCount,
              icon: TrendingUp,
              colour: "text-emerald-600",
              bg: "bg-emerald-50 border-emerald-100",
            },
            {
              label: "Not Working",
              value: notWorkingCount,
              icon: TrendingDown,
              colour: notWorkingCount > 0 ? "text-red-600" : "text-emerald-600",
              bg: notWorkingCount > 0 ? "bg-red-50 border-red-100" : "bg-emerald-50 border-emerald-100",
            },
            {
              label: "Completed",
              value: completedList.length,
              icon: CheckCircle2,
              colour: "text-blue-600",
              bg: "bg-blue-50 border-blue-100",
            },
          ].map(({ label, value, icon: Icon, colour, bg }) => (
            <div key={label} className={cn("rounded-2xl border p-4 text-center", bg)}>
              <Icon className={cn("h-4 w-4 mx-auto mb-1", colour)} />
              <div className={cn("text-2xl font-bold tabular-nums", colour)}>{value}</div>
              <div className="text-[10px] text-[var(--cs-text-muted)] mt-0.5 font-medium">{label}</div>
            </div>
          ))}
        </div>

        {/* ── Review due alert ─────────────────────────────────────────────── */}
        {reviewDueList.length > 0 && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-3 flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-red-800">
                {reviewDueList.length} intervention{reviewDueList.length !== 1 ? "s" : ""} overdue for review
              </p>
              <p className="text-[11px] text-red-700 mt-0.5">
                {reviewDueList.map((i) => `${i.title} (${getYPName(i.child_id)})`).join("; ")}
              </p>
            </div>
          </div>
        )}

        {/* ── Tab bar ──────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--cs-text-muted)]" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search interventions, young people…"
              className="pl-9 h-8 text-xs"
            />
          </div>
          <div className="flex gap-2 shrink-0">
            {([
              { key: "active" as const, label: `Active (${activeList.length})` },
              { key: "review_due" as const, label: `Review Due (${reviewDueList.length})` },
              { key: "completed" as const, label: `Completed (${completedList.length})` },
              { key: "all" as const, label: `All (${interventions.length})` },
            ]).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setViewTab(key)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  viewTab === key
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-[var(--cs-text-secondary)] hover:bg-slate-200",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Filters ──────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-[var(--cs-text-muted)]" />
            <select
              value={childFilter}
              onChange={(e) => setChildFilter(e.target.value)}
              className="rounded-lg border border-[var(--cs-border)] bg-white px-2.5 py-1 text-[11px] text-[var(--cs-text-secondary)] focus:border-emerald-300 focus:ring-1 focus:ring-emerald-200 outline-none"
            >
              <option value="all">All young people</option>
              {childIds.map((id) => (
                <option key={id} value={id}>{getYPName(id)}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="h-3.5 w-3.5 text-[var(--cs-text-muted)]" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="rounded-lg border border-[var(--cs-border)] bg-white px-2.5 py-1 text-[11px] text-[var(--cs-text-secondary)] focus:border-emerald-300 focus:ring-1 focus:ring-emerald-200 outline-none"
            >
              <option value="date">Start date</option>
              <option value="child">Young person</option>
              <option value="outcome">Effectiveness</option>
              <option value="review">Review date</option>
            </select>
          </div>

          {(search || childFilter !== "all") && (
            <p className="text-xs text-[var(--cs-text-muted)] ml-auto">
              {filtered.length} result{filtered.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        {/* ── Loading ──────────────────────────────────────────────────────── */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--cs-text-muted)]" />
            <span className="ml-2 text-sm text-[var(--cs-text-muted)]">Loading interventions…</span>
          </div>
        )}

        {/* ── Interventions list ───────────────────────────────────────────── */}
        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-16 text-[var(--cs-text-muted)]">
            <Activity className="h-10 w-10 text-[var(--cs-text-gentle)] mx-auto mb-3" />
            <p className="text-sm font-medium">
              {search ? `No interventions match "${search}"` : "No interventions in this view"}
            </p>
            <p className="text-xs text-[var(--cs-text-muted)] mt-1">
              {viewTab === "active" ? "Create a new intervention to track your work with young people." : "Try a different filter."}
            </p>
          </div>
        )}

        {!isLoading && filtered.length > 0 && (
          <div className="space-y-3">
            {filtered.map((intervention) => (
              <InterventionCard
                key={intervention.id}
                intervention={intervention}
                onStatusChange={handleStatusChange}
                onOutcomeChange={handleOutcomeChange}
                isBusy={updateIntervention.isPending}
              />
            ))}
          </div>
        )}

        {/* ── Regulatory note ──────────────────────────────────────────────── */}
        <div className="rounded-xl border border-[var(--cs-border-subtle)] bg-slate-50 px-4 py-3 text-xs text-[var(--cs-text-muted)]">
          <span className="font-semibold text-[var(--cs-text-secondary)]">Regulatory Basis — </span>
          Children&apos;s Homes Quality Standards 2015, Standard 2 (Quality of Care) &amp; Standard 6
          (Child-Centred Care): interventions must be purposeful, evidence-based, and regularly reviewed.
          Ofsted ILACS inspections specifically assess whether the home takes timely and proportionate
          action when patterns emerge, and whether interventions are making a measurable difference
          to children&apos;s lives. All interventions should link to identified patterns, be agreed by management,
          and have clear intended outcomes with regular review dates.
        </div>
      </div>

      <NewInterventionDialog
        open={showNew}
        onClose={() => setShowNew(false)}
        onSave={handleCreate}
      />
    </PageShell>
  );
}

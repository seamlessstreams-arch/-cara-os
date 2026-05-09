"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — MEDICATION ERRORS & NEAR-MISSES REGISTER
// Tracks medication administration errors, near-misses, and adverse drug
// reactions. Regulatory requirement under Regulation 23 (health) following
// NICE guidelines for medication error reporting in care settings.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus, Search, Filter, ArrowUpDown, ChevronDown, ChevronUp,
  AlertTriangle, CheckCircle2, Clock, XCircle, Loader2,
} from "lucide-react";
import { cn, formatDate, todayStr } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";
import { toast } from "sonner";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { useMedicationErrors, useCreateMedicationError } from "@/hooks/use-medication-errors";
import type {
  MedErrorType,
  MedErrorSeverity,
  MedErrorStatus,
  MedRemedialStatus,
  MedRemedialAction,
  MedicationError,
} from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

// ── Config ────────────────────────────────────────────────────────────────────

const ERROR_TYPE_CONFIG: Record<MedErrorType, { label: string; color: string; bg: string; border: string }> = {
  wrong_dose:          { label: "Wrong Dose",          color: "text-orange-700",  bg: "bg-orange-50",  border: "border-orange-200"  },
  wrong_medication:    { label: "Wrong Medication",    color: "text-red-700",     bg: "bg-red-50",     border: "border-red-200"     },
  wrong_time:          { label: "Wrong Time",          color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200"   },
  wrong_person:        { label: "Wrong Person",        color: "text-rose-700",    bg: "bg-rose-50",    border: "border-rose-200"    },
  omission:            { label: "Omission",            color: "text-yellow-700",  bg: "bg-yellow-50",  border: "border-yellow-200"  },
  wrong_route:         { label: "Wrong Route",         color: "text-pink-700",    bg: "bg-pink-50",    border: "border-pink-200"    },
  expired_medication:  { label: "Expired Medication",  color: "text-stone-700",   bg: "bg-stone-50",   border: "border-stone-200"   },
  documentation_error: { label: "Documentation Error", color: "text-slate-700",   bg: "bg-slate-100",  border: "border-slate-200"   },
  near_miss:           { label: "Near Miss",           color: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-200"    },
  adverse_reaction:    { label: "Adverse Reaction",    color: "text-purple-700",  bg: "bg-purple-50",  border: "border-purple-200"  },
};

const SEVERITY_CONFIG: Record<MedErrorSeverity, { label: string; color: string; bg: string; border: string }> = {
  no_harm:   { label: "No Harm",   color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  low:       { label: "Low",       color: "text-yellow-700",  bg: "bg-yellow-50",  border: "border-yellow-200"  },
  moderate:  { label: "Moderate",  color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200"   },
  severe:    { label: "Severe",    color: "text-red-700",     bg: "bg-red-50",     border: "border-red-200"     },
  death:     { label: "Death",     color: "text-white",       bg: "bg-slate-900",  border: "border-slate-700"   },
};

const STATUS_CONFIG: Record<MedErrorStatus, { label: string; color: string; bg: string; border: string }> = {
  reported:              { label: "Reported",             color: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-200"    },
  under_investigation:   { label: "Under Investigation", color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200"   },
  action_required:       { label: "Action Required",     color: "text-orange-700",  bg: "bg-orange-50",  border: "border-orange-200"  },
  closed:                { label: "Closed",              color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  escalated:             { label: "Escalated",           color: "text-rose-700",    bg: "bg-rose-50",    border: "border-rose-200"    },
};

const REMEDIAL_STATUS_CONFIG: Record<MedRemedialStatus, { label: string; color: string; bg: string }> = {
  pending:     { label: "Pending",     color: "text-amber-700",   bg: "bg-amber-50"   },
  in_progress: { label: "In Progress", color: "text-blue-700",    bg: "bg-blue-50"    },
  completed:   { label: "Completed",   color: "text-emerald-700", bg: "bg-emerald-50" },
};

const PERSONS_OPTIONS = ["Manager", "GP", "Parent", "Social Worker", "Pharmacist", "LADO", "Ofsted", "IRO"];

// ── Main Page ────────────────────────────────────────────────────────────────

export default function MedicationErrorsPage() {
  const { data: result, isLoading } = useMedicationErrors();
  const errors = result?.data ?? [];
  const createMutation = useCreateMedicationError();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showNewDialog, setShowNewDialog] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<MedErrorType | "all">("all");
  const [severityFilter, setSeverityFilter] = useState<MedErrorSeverity | "all">("all");
  const [statusFilter, setStatusFilter] = useState<MedErrorStatus | "all">("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "severity">("newest");

  const today = todayStr();

  // ── Filtered + sorted list ────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...errors];

    if (typeFilter !== "all") {
      list = list.filter((e) => e.error_type === typeFilter);
    }
    if (severityFilter !== "all") {
      list = list.filter((e) => e.severity === severityFilter);
    }
    if (statusFilter !== "all") {
      list = list.filter((e) => e.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) =>
          e.medication.toLowerCase().includes(q) ||
          getYPName(e.child_id).toLowerCase().includes(q) ||
          e.what_happened.toLowerCase().includes(q) ||
          getStaffName(e.reported_by).toLowerCase().includes(q) ||
          ERROR_TYPE_CONFIG[e.error_type].label.toLowerCase().includes(q)
      );
    }

    const SEV_ORDER: Record<MedErrorSeverity, number> = { death: 0, severe: 1, moderate: 2, low: 3, no_harm: 4 };
    switch (sortBy) {
      case "newest":
        list.sort((a, b) => b.date_occurred.localeCompare(a.date_occurred));
        break;
      case "oldest":
        list.sort((a, b) => a.date_occurred.localeCompare(b.date_occurred));
        break;
      case "severity":
        list.sort((a, b) => SEV_ORDER[a.severity] - SEV_ORDER[b.severity]);
        break;
    }

    return list;
  }, [errors, typeFilter, severityFilter, statusFilter, search, sortBy]);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = errors.length;
    const open = errors.filter((e) => e.status !== "closed").length;
    const nearMisses = errors.filter((e) => e.error_type === "near_miss").length;

    const closedErrors = errors.filter((e) => e.status === "closed" && e.review_date && e.date_occurred);
    const avgDays =
      closedErrors.length > 0
        ? Math.round(
            closedErrors.reduce((sum, e) => {
              const start = new Date(e.date_occurred).getTime();
              const end = new Date(e.review_date!).getTime();
              return sum + (end - start) / (1000 * 60 * 60 * 24);
            }, 0) / closedErrors.length
          )
        : 0;

    return { total, open, nearMisses, avgDays };
  }, [errors]);

  // ── Per-child summary ─────────────────────────────────────────────────────
  const childSummaries = useMemo(() => {
    const map = new Map<string, { types: Record<string, number>; severities: Record<string, number>; lastDate: string; count: number }>();
    for (const e of errors) {
      if (!map.has(e.child_id)) {
        map.set(e.child_id, { types: {}, severities: {}, lastDate: e.date_occurred, count: 0 });
      }
      const s = map.get(e.child_id)!;
      s.count++;
      s.types[e.error_type] = (s.types[e.error_type] || 0) + 1;
      s.severities[e.severity] = (s.severities[e.severity] || 0) + 1;
      if (e.date_occurred > s.lastDate) s.lastDate = e.date_occurred;
    }
    return Array.from(map.entries()).map(([id, data]) => ({ id, name: getYPName(id), ...data }));
  }, [errors]);

  // ── Export columns ────────────────────────────────────────────────────────
  const exportColumns = useMemo<ExportColumn<MedicationError>[]>(() => [
    { header: "Date",               accessor: (r: MedicationError) => r.date_occurred },
    { header: "Time",               accessor: (r: MedicationError) => r.time_occurred },
    { header: "Young Person",       accessor: (r: MedicationError) => getYPName(r.child_id) },
    { header: "Medication",         accessor: (r: MedicationError) => r.medication },
    { header: "Error Type",         accessor: (r: MedicationError) => ERROR_TYPE_CONFIG[r.error_type].label },
    { header: "Severity",           accessor: (r: MedicationError) => SEVERITY_CONFIG[r.severity].label },
    { header: "Prescribed Dose",    accessor: (r: MedicationError) => r.prescribed_dose },
    { header: "Actual Dose",        accessor: (r: MedicationError) => r.actual_dose },
    { header: "Reported By",        accessor: (r: MedicationError) => getStaffName(r.reported_by) },
    { header: "Status",             accessor: (r: MedicationError) => STATUS_CONFIG[r.status].label },
    { header: "Root Cause",         accessor: (r: MedicationError) => r.root_cause },
    { header: "Persons Informed",   accessor: (r: MedicationError) => r.person_informed.join(", ") },
  ], []);

  // ── Alert banner check ────────────────────────────────────────────────────
  const openCases = errors.filter(
    (e) => e.status === "under_investigation" || e.status === "action_required"
  );

  const hasFilters = search || typeFilter !== "all" || severityFilter !== "all" || statusFilter !== "all";

  // ── Create handler ────────────────────────────────────────────────────────
  const handleCreate = (error: Partial<MedicationError>) => {
    createMutation.mutate(error, {
      onSuccess: () => toast.success("Medication error reported"),
    });
  };

  // ── Loading state ─────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <PageShell title="Medication Errors & Near-Misses" subtitle="Regulation 23 — Medication error reporting and learning">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      </PageShell>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <PageShell
      title="Medication Errors & Near-Misses"
      subtitle="Regulation 23 — Medication error reporting and learning"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Medication Errors Register" />
          <ExportButton<MedicationError>
            data={filtered}
            columns={exportColumns}
            filename="medication-errors"
          />
          <Button size="sm" className="h-8 text-xs gap-1.5" onClick={() => setShowNewDialog(true)}>
            <Plus className="h-3.5 w-3.5" />
            Report Error
          </Button>
        </div>
      }
    >
      {/* ── Summary Strip ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <Card className="border-slate-200">
          <CardContent className="p-3">
            <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Total Errors</div>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-3">
            <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Open Cases</div>
            <div className={cn("text-2xl font-bold mt-0.5", stats.open > 0 ? "text-amber-600" : "text-emerald-600")}>{stats.open}</div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-3">
            <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Near Misses</div>
            <div className="text-2xl font-bold text-blue-600 mt-0.5">{stats.nearMisses}</div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-3">
            <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Avg Resolution</div>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">{stats.avgDays} <span className="text-sm font-normal text-slate-400">days</span></div>
          </CardContent>
        </Card>
      </div>

      {/* ── Alert Banner ──────────────────────────────────────────────────── */}
      {openCases.length > 0 && (
        <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-3 flex items-start gap-2.5">
          <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-amber-800">
              {openCases.length} case{openCases.length !== 1 ? "s" : ""} requiring attention
            </p>
            <p className="text-[11px] text-amber-700 mt-0.5">
              {openCases.map((c) => `${getYPName(c.child_id)} — ${ERROR_TYPE_CONFIG[c.error_type].label}`).join(" | ")}
            </p>
          </div>
        </div>
      )}

      {/* ── Per-Child Summary Cards ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        {childSummaries.map((child) => (
          <Card key={child.id} className="border-slate-200">
            <CardHeader className="pb-2 pt-3 px-3">
              <CardTitle className="text-sm font-semibold text-slate-900">{child.name}</CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Total incidents</span>
                <span className="font-semibold text-slate-700">{child.count}</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {Object.entries(child.types).map(([type, count]) => {
                  const cfg = ERROR_TYPE_CONFIG[type as MedErrorType];
                  return (
                    <Badge key={type} className={cn("text-[9px] px-1.5 py-0 border", cfg.bg, cfg.color, cfg.border)}>
                      {cfg.label} ({count})
                    </Badge>
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-1">
                {Object.entries(child.severities).map(([sev, count]) => {
                  const cfg = SEVERITY_CONFIG[sev as MedErrorSeverity];
                  return (
                    <Badge key={sev} className={cn("text-[9px] px-1.5 py-0 border", cfg.bg, cfg.color, cfg.border)}>
                      {cfg.label} ({count})
                    </Badge>
                  );
                })}
              </div>
              <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                Last incident: {formatDate(child.lastDate)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Filter Bar ────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search errors..."
            className="h-8 pl-8 text-xs"
          />
        </div>

        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as MedErrorType | "all")}>
          <SelectTrigger className="h-8 text-xs w-[160px]">
            <Filter className="h-3 w-3 mr-1 text-slate-400" />
            <SelectValue placeholder="Error type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {(Object.keys(ERROR_TYPE_CONFIG) as MedErrorType[]).map((t) => (
              <SelectItem key={t} value={t}>{ERROR_TYPE_CONFIG[t].label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={severityFilter} onValueChange={(v) => setSeverityFilter(v as MedErrorSeverity | "all")}>
          <SelectTrigger className="h-8 text-xs w-[130px]">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severity</SelectItem>
            {(Object.keys(SEVERITY_CONFIG) as MedErrorSeverity[]).map((s) => (
              <SelectItem key={s} value={s}>{SEVERITY_CONFIG[s].label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as MedErrorStatus | "all")}>
          <SelectTrigger className="h-8 text-xs w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {(Object.keys(STATUS_CONFIG) as MedErrorStatus[]).map((s) => (
              <SelectItem key={s} value={s}>{STATUS_CONFIG[s].label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
          <SelectTrigger className="h-8 text-xs w-[130px]">
            <ArrowUpDown className="h-3 w-3 mr-1 text-slate-400" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="oldest">Oldest first</SelectItem>
            <SelectItem value="severity">By severity</SelectItem>
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-slate-400 hover:text-slate-600"
            onClick={() => { setSearch(""); setTypeFilter("all"); setSeverityFilter("all"); setStatusFilter("all"); }}
          >
            <XCircle className="h-3 w-3 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* ── Results count ─────────────────────────────────────────────────── */}
      <p className="text-[11px] text-slate-400 mb-3">
        Showing {filtered.length} of {errors.length} record{errors.length !== 1 ? "s" : ""}
      </p>

      {/* ── Error Cards ───────────────────────────────────────────────────── */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-sm text-slate-400">
            No medication errors match the current filters.
          </div>
        )}

        {filtered.map((error) => {
          const isExpanded = expandedId === error.id;
          const etCfg = ERROR_TYPE_CONFIG[error.error_type];
          const sevCfg = SEVERITY_CONFIG[error.severity];
          const stCfg = STATUS_CONFIG[error.status];

          const hasOverdueActions = error.remedial_actions.some(
            (a) => a.status !== "completed" && a.due_date < today
          );

          return (
            <div
              key={error.id}
              className={cn(
                "rounded-lg border bg-white transition-all",
                error.status === "escalated" && "ring-2 ring-rose-300 border-rose-200",
                error.status === "under_investigation" && "border-amber-300",
                hasOverdueActions && "border-orange-300",
              )}
            >
              {/* Card Header */}
              <div
                className="flex items-start gap-3 p-4 cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : error.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs font-medium text-slate-500">{formatDate(error.date_occurred)}</span>
                    <span className="text-[10px] text-slate-400">{error.time_occurred}</span>
                    <span className="text-xs font-semibold text-slate-900">— {error.medication}</span>
                    <span className="text-[11px] text-slate-500">({getYPName(error.child_id)})</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge className={cn("text-[10px] px-2 py-0 border", etCfg.bg, etCfg.color, etCfg.border)}>
                      {etCfg.label}
                    </Badge>
                    <Badge className={cn("text-[10px] px-2 py-0 border", sevCfg.bg, sevCfg.color, sevCfg.border)}>
                      {sevCfg.label}
                    </Badge>
                    <Badge className={cn("text-[10px] px-2 py-0 border", stCfg.bg, stCfg.color, stCfg.border)}>
                      {stCfg.label}
                    </Badge>
                    {hasOverdueActions && (
                      <Badge className="text-[9px] px-1.5 py-0 bg-orange-100 text-orange-700 border border-orange-200">
                        Overdue actions
                      </Badge>
                    )}
                    {error.duty_of_candour && (
                      <Badge className="text-[9px] px-1.5 py-0 bg-violet-100 text-violet-700 border border-violet-200">
                        Duty of Candour
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[10px] text-slate-400">
                    Reported by {getStaffName(error.reported_by)}
                  </span>
                  {isExpanded
                    ? <ChevronUp className="h-4 w-4 text-slate-400" />
                    : <ChevronDown className="h-4 w-4 text-slate-400" />
                  }
                </div>
              </div>

              {/* Expanded Body */}
              {isExpanded && (
                <div className="border-t px-4 pb-4 pt-3 space-y-4">
                  {/* What happened — red panel */}
                  <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                    <h4 className="text-[11px] font-semibold text-red-700 uppercase tracking-wide mb-1">What Happened</h4>
                    <p className="text-xs text-red-900 leading-relaxed">{error.what_happened}</p>
                    <div className="mt-2 flex items-center gap-3 text-[10px] text-red-600">
                      <span>Prescribed: <strong>{error.prescribed_dose}</strong></span>
                      <span>Actual: <strong>{error.actual_dose}</strong></span>
                    </div>
                  </div>

                  {/* Immediate action — blue panel */}
                  <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                    <h4 className="text-[11px] font-semibold text-blue-700 uppercase tracking-wide mb-1">Immediate Action Taken</h4>
                    <p className="text-xs text-blue-900 leading-relaxed">{error.immediate_action}</p>
                  </div>

                  {/* Persons informed */}
                  <div>
                    <h4 className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Persons Informed</h4>
                    <div className="flex flex-wrap gap-1">
                      {error.person_informed.map((p) => (
                        <Badge key={p} className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200">
                          {p}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Root cause — amber panel */}
                  <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                    <h4 className="text-[11px] font-semibold text-amber-700 uppercase tracking-wide mb-1">Root Cause Analysis</h4>
                    <p className="text-xs text-amber-900 leading-relaxed">{error.root_cause}</p>
                  </div>

                  {/* Contributing factors */}
                  {error.contributing_factors.length > 0 && (
                    <div>
                      <h4 className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Contributing Factors</h4>
                      <div className="flex flex-wrap gap-1">
                        {error.contributing_factors.map((f, i) => (
                          <Badge key={i} className="text-[10px] px-2 py-0.5 bg-orange-50 text-orange-700 border border-orange-200">
                            {f}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Remedial actions table */}
                  {error.remedial_actions.length > 0 && (
                    <div>
                      <h4 className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide mb-2">
                        Remedial Actions ({error.remedial_actions.length})
                      </h4>
                      <div className="rounded-lg border border-slate-200 overflow-hidden">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                              <th className="text-left px-3 py-1.5 text-[10px] font-semibold text-slate-500 uppercase">Action</th>
                              <th className="text-left px-3 py-1.5 text-[10px] font-semibold text-slate-500 uppercase">Owner</th>
                              <th className="text-left px-3 py-1.5 text-[10px] font-semibold text-slate-500 uppercase">Due</th>
                              <th className="text-left px-3 py-1.5 text-[10px] font-semibold text-slate-500 uppercase">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {error.remedial_actions.map((a, i) => {
                              const isOverdue = a.status !== "completed" && a.due_date < today;
                              const rsCfg = REMEDIAL_STATUS_CONFIG[a.status];
                              return (
                                <tr
                                  key={i}
                                  className={cn(
                                    "border-b border-slate-100 last:border-0",
                                    isOverdue && "bg-orange-50",
                                  )}
                                >
                                  <td className="px-3 py-2 text-slate-700">{a.action}</td>
                                  <td className="px-3 py-2 text-slate-600">{getStaffName(a.owner)}</td>
                                  <td className={cn("px-3 py-2", isOverdue ? "text-orange-700 font-semibold" : "text-slate-600")}>
                                    {formatDate(a.due_date)}
                                    {isOverdue && <span className="ml-1 text-[9px] text-orange-600">(overdue)</span>}
                                  </td>
                                  <td className="px-3 py-2">
                                    <Badge className={cn("text-[9px] px-1.5 py-0 border", rsCfg.bg, rsCfg.color)}>
                                      {rsCfg.label}
                                    </Badge>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Lessons learned — purple panel */}
                  <div className="rounded-lg bg-purple-50 border border-purple-200 p-3">
                    <h4 className="text-[11px] font-semibold text-purple-700 uppercase tracking-wide mb-1">Lessons Learned</h4>
                    <p className="text-xs text-purple-900 leading-relaxed">{error.lessons_learned}</p>
                  </div>

                  {/* Duty of candour */}
                  {error.duty_of_candour && (
                    <div className="rounded-lg bg-violet-50 border border-violet-200 p-3">
                      <h4 className="text-[11px] font-semibold text-violet-700 uppercase tracking-wide mb-1">Duty of Candour</h4>
                      <div className="flex items-center gap-2 text-xs">
                        {error.duty_of_candour_completed ? (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            <span className="text-violet-800">Completed on {formatDate(error.duty_of_candour_completed)}</span>
                          </>
                        ) : (
                          <>
                            <Clock className="h-3.5 w-3.5 text-amber-600" />
                            <span className="text-violet-800">Duty of candour notification pending</span>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Outcome */}
                  <div>
                    <h4 className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide mb-1">Outcome</h4>
                    <p className="text-xs text-slate-700 leading-relaxed">{error.outcome}</p>
                  </div>

                  {/* Smart Link Panel */}
                  <SmartLinkPanel
                    sourceType="medication_error"
                    sourceId={error.id}
                    childId={error.child_id}
                    compact
                  />

                  {/* Footer meta */}
                  <div className="flex items-center gap-4 text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                    <span>Reported: {formatDate(error.reported_date)} by {getStaffName(error.reported_by)}</span>
                    {error.review_date && <span>Review date: {formatDate(error.review_date)}</span>}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Regulatory Note ───────────────────────────────────────────────── */}
      <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <p className="text-[10px] text-slate-500 leading-relaxed">
          <strong>Regulatory context:</strong> This register supports compliance with{" "}
          <strong>Regulation 23 (Health)</strong> of the Children's Homes (England) Regulations 2015 and follows{" "}
          <strong>NICE guidelines</strong> on medication safety in care settings. All medication errors, near-misses, and
          adverse drug reactions must be recorded, investigated, and used to improve practice. Duty of candour applies to
          incidents of moderate severity or above. Records are subject to Ofsted inspection and should be maintained in
          accordance with data protection requirements.
        </p>
      </div>

      {/* ── New Error Dialog ──────────────────────────────────────────────── */}
      <NewErrorDialog
        open={showNewDialog}
        onClose={() => setShowNewDialog(false)}
        onSubmit={handleCreate}
      />
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}

// ── New Error Report Dialog ─────────────────────────────────────────────────

function NewErrorDialog({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (error: Partial<MedicationError>) => void;
}) {
  const [child_id, setChildId] = useState("yp_alex");
  const [date_occurred, setDateOccurred] = useState("");
  const [time_occurred, setTimeOccurred] = useState("");
  const [error_type, setErrorType] = useState<MedErrorType>("wrong_dose");
  const [severity, setSeverity] = useState<MedErrorSeverity>("no_harm");
  const [medication, setMedication] = useState("");
  const [prescribed_dose, setPrescribedDose] = useState("");
  const [actual_dose, setActualDose] = useState("");
  const [what_happened, setWhatHappened] = useState("");
  const [immediate_action, setImmediateAction] = useState("");
  const [personsInformed, setPersonsInformed] = useState<string[]>([]);
  const [duty_of_candour, setDutyOfCandour] = useState(false);
  const [root_cause, setRootCause] = useState("");
  const [contributing_factors, setContributingFactors] = useState("");
  const [lessons_learned, setLessonsLearned] = useState("");

  function togglePerson(person: string) {
    setPersonsInformed((prev) =>
      prev.includes(person) ? prev.filter((p) => p !== person) : [...prev, person]
    );
  }

  function handleSubmit() {
    if (!medication.trim() || !what_happened.trim() || !date_occurred) return;

    const error: Partial<MedicationError> = {
      child_id,
      date_occurred,
      time_occurred: time_occurred || "00:00",
      reported_by: "staff_darren",
      reported_date: new Date().toISOString().slice(0, 10),
      error_type,
      severity,
      medication: medication.trim(),
      prescribed_dose: prescribed_dose.trim(),
      actual_dose: actual_dose.trim(),
      what_happened: what_happened.trim(),
      immediate_action: immediate_action.trim(),
      person_informed: personsInformed,
      duty_of_candour,
      duty_of_candour_completed: null,
      root_cause: root_cause.trim(),
      contributing_factors: contributing_factors.split("\n").filter(Boolean),
      remedial_actions: [],
      lessons_learned: lessons_learned.trim(),
      status: "reported",
      review_date: null,
      outcome: "",
    };

    onSubmit(error);
    onClose();
    resetForm();
  }

  function resetForm() {
    setChildId("yp_alex");
    setDateOccurred("");
    setTimeOccurred("");
    setErrorType("wrong_dose");
    setSeverity("no_harm");
    setMedication("");
    setPrescribedDose("");
    setActualDose("");
    setWhatHappened("");
    setImmediateAction("");
    setPersonsInformed([]);
    setDutyOfCandour(false);
    setRootCause("");
    setContributingFactors("");
    setLessonsLearned("");
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            Report Medication Error
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {/* Young person + date/time */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-medium text-slate-600 mb-1 block">Young Person *</label>
              <Select value={child_id} onValueChange={setChildId}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="yp_alex">{getYPName("yp_alex")}</SelectItem>
                  <SelectItem value="yp_jordan">{getYPName("yp_jordan")}</SelectItem>
                  <SelectItem value="yp_casey">{getYPName("yp_casey")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-600 mb-1 block">Date Occurred *</label>
              <Input type="date" value={date_occurred} onChange={(e) => setDateOccurred(e.target.value)} className="h-8 text-xs" />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-600 mb-1 block">Time Occurred</label>
              <Input type="time" value={time_occurred} onChange={(e) => setTimeOccurred(e.target.value)} className="h-8 text-xs" />
            </div>
          </div>

          {/* Error type + severity */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-slate-600 mb-1 block">Error Type *</label>
              <Select value={error_type} onValueChange={(v) => setErrorType(v as MedErrorType)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(ERROR_TYPE_CONFIG) as MedErrorType[]).map((t) => (
                    <SelectItem key={t} value={t}>{ERROR_TYPE_CONFIG[t].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-600 mb-1 block">Severity</label>
              <Select value={severity} onValueChange={(v) => setSeverity(v as MedErrorSeverity)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(SEVERITY_CONFIG) as MedErrorSeverity[]).map((s) => (
                    <SelectItem key={s} value={s}>{SEVERITY_CONFIG[s].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Medication + doses */}
          <div>
            <label className="text-[11px] font-medium text-slate-600 mb-1 block">Medication *</label>
            <Input value={medication} onChange={(e) => setMedication(e.target.value)} placeholder="e.g. Melatonin 3mg" className="h-8 text-xs" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-slate-600 mb-1 block">Prescribed Dose</label>
              <Input value={prescribed_dose} onChange={(e) => setPrescribedDose(e.target.value)} placeholder="e.g. 3mg" className="h-8 text-xs" />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-600 mb-1 block">Actual Dose</label>
              <Input value={actual_dose} onChange={(e) => setActualDose(e.target.value)} placeholder="e.g. 5mg or Not given" className="h-8 text-xs" />
            </div>
          </div>

          {/* What happened */}
          <div>
            <label className="text-[11px] font-medium text-slate-600 mb-1 block">What Happened *</label>
            <Textarea
              value={what_happened}
              onChange={(e) => setWhatHappened(e.target.value)}
              placeholder="Describe what happened in detail..."
              className="text-xs min-h-[80px]"
            />
          </div>

          {/* Immediate action */}
          <div>
            <label className="text-[11px] font-medium text-slate-600 mb-1 block">Immediate Action Taken</label>
            <Textarea
              value={immediate_action}
              onChange={(e) => setImmediateAction(e.target.value)}
              placeholder="What was done immediately in response?"
              className="text-xs min-h-[60px]"
            />
          </div>

          {/* Persons informed */}
          <div>
            <label className="text-[11px] font-medium text-slate-600 mb-1.5 block">Persons Informed</label>
            <div className="flex flex-wrap gap-1.5">
              {PERSONS_OPTIONS.map((p) => (
                <Button
                  key={p}
                  type="button"
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-6 text-[10px] px-2",
                    personsInformed.includes(p)
                      ? "bg-blue-100 text-blue-700 border-blue-300"
                      : "bg-white text-slate-500 border-slate-200"
                  )}
                  onClick={() => togglePerson(p)}
                >
                  {personsInformed.includes(p) && <CheckCircle2 className="h-2.5 w-2.5 mr-1" />}
                  {p}
                </Button>
              ))}
            </div>
          </div>

          {/* Duty of candour */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="doc-checkbox"
              checked={duty_of_candour}
              onChange={(e) => setDutyOfCandour(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600"
            />
            <label htmlFor="doc-checkbox" className="text-xs text-slate-600">Duty of Candour applies</label>
          </div>

          {/* Root cause */}
          <div>
            <label className="text-[11px] font-medium text-slate-600 mb-1 block">Root Cause</label>
            <Textarea
              value={root_cause}
              onChange={(e) => setRootCause(e.target.value)}
              placeholder="What was the root cause of this error?"
              className="text-xs min-h-[60px]"
            />
          </div>

          {/* Contributing factors */}
          <div>
            <label className="text-[11px] font-medium text-slate-600 mb-1 block">Contributing Factors (one per line)</label>
            <Textarea
              value={contributing_factors}
              onChange={(e) => setContributingFactors(e.target.value)}
              placeholder="Enter each factor on a new line..."
              className="text-xs min-h-[50px]"
            />
          </div>

          {/* Lessons learned */}
          <div>
            <label className="text-[11px] font-medium text-slate-600 mb-1 block">Lessons Learned</label>
            <Textarea
              value={lessons_learned}
              onChange={(e) => setLessonsLearned(e.target.value)}
              placeholder="What can be learned from this incident?"
              className="text-xs min-h-[50px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" className="text-xs" onClick={onClose}>Cancel</Button>
          <Button
            size="sm"
            className="text-xs"
            onClick={handleSubmit}
            disabled={!medication.trim() || !what_happened.trim() || !date_occurred}
          >
            Submit Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

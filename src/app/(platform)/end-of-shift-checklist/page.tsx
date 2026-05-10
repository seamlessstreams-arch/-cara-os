"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — END-OF-SHIFT CHECKLIST
// Standardised closing-down tasks completed by staff before handover.
// Required by Quality Standard 13 (Leadership & Management) and Reg 33.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useMemo, useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ClipboardCheck,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldCheck,
  Pill,
  Building2,
  BookOpen,
  Heart,
  Users,
  Clock,
  CalendarClock,
  Lock,
  ChefHat,
  PawPrint,
  MessageSquare,
  ArrowRightLeft,
  Sparkles,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";
import { useShiftChecklists } from "@/hooks/use-shift-checklists";
import type { ShiftChecklist, ChecklistItem } from "@/types/extended";
import {
  END_OF_SHIFT_TYPE_LABEL,
  CHECKLIST_CATEGORY_LABEL,
} from "@/types/extended";
import type { EndOfShiftType, ChecklistCategory } from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

// ── Helpers ──────────────────────────────────────────────────────────────────
const shiftColour = (s: EndOfShiftType): string => {
  switch (s) {
    case "early":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "late":
      return "bg-indigo-100 text-indigo-800 border-indigo-200";
    case "sleep_in":
      return "bg-violet-100 text-violet-800 border-violet-200";
    case "wake_night":
      return "bg-slate-200 text-slate-800 border-slate-300";
  }
};

const categoryIcon: Record<ChecklistCategory, React.ReactNode> = {
  safeguarding: <ShieldCheck className="h-4 w-4" />,
  medication: <Pill className="h-4 w-4" />,
  environment_security: <Building2 className="h-4 w-4" />,
  records: <BookOpen className="h-4 w-4" />,
  childrens_wellbeing: <Heart className="h-4 w-4" />,
  communication: <MessageSquare className="h-4 w-4" />,
};

const formatPretty = (iso: string): string => {
  const date = new Date(iso);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const completionPct = (r: ShiftChecklist): number => {
  if (r.checks.length === 0) return 0;
  const done = r.checks.filter((c) => c.completed).length;
  return Math.round((done / r.checks.length) * 100);
};

// ── Sort options ─────────────────────────────────────────────────────────────
type SortKey =
  | "date_desc"
  | "date_asc"
  | "completion_desc"
  | "completion_asc"
  | "shift";

// ── Page ─────────────────────────────────────────────────────────────────────
export default function EndOfShiftChecklistPage() {
  const { data: res, isLoading } = useShiftChecklists();
  const records = useMemo(() => res?.data ?? [], [res]);

  const [sortKey, setSortKey] = useState<SortKey>("date_desc");
  const [filterShift, setFilterShift] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // ── Summary stats ──────────────────────────────────────────────────────────
  const summary = useMemo(() => {
    const seven = new Date();
    seven.setDate(seven.getDate() - 7);
    const recent = records.filter((r) => new Date(r.date) >= seven);
    const totalChecks = records.reduce((s, r) => s + r.checks.length, 0);
    const completed = records.reduce(
      (s, r) => s + r.checks.filter((c) => c.completed).length,
      0,
    );
    const completionRate =
      totalChecks > 0 ? Math.round((completed / totalChecks) * 100) : 0;
    const escalations = recent.reduce(
      (s, r) => s + r.any_escalations.length,
      0,
    );
    const avgComplete = Math.round(
      records.reduce((s, r) => s + completionPct(r), 0) /
        Math.max(records.length, 1),
    );
    return {
      shiftsLogged: records.length,
      completionRate,
      escalations,
      avgComplete,
    };
  }, [records]);

  // ── Filtered + sorted ──────────────────────────────────────────────────────
  const visible = useMemo(() => {
    let list = [...records];
    if (filterShift !== "all") {
      list = list.filter((r) => r.shift_type === filterShift);
    }
    switch (sortKey) {
      case "date_desc":
        list.sort((a, b) => b.date.localeCompare(a.date));
        break;
      case "date_asc":
        list.sort((a, b) => a.date.localeCompare(b.date));
        break;
      case "completion_desc":
        list.sort((a, b) => completionPct(b) - completionPct(a));
        break;
      case "completion_asc":
        list.sort((a, b) => completionPct(a) - completionPct(b));
        break;
      case "shift": {
        const order: Record<string, number> = {
          early: 0,
          late: 1,
          sleep_in: 2,
          wake_night: 3,
        };
        list.sort((a, b) => (order[a.shift_type] ?? 4) - (order[b.shift_type] ?? 4));
        break;
      }
    }
    return list;
  }, [records, sortKey, filterShift]);

  // ── Export columns ─────────────────────────────────────────────────────────
  const exportColumns: ExportColumn<ShiftChecklist>[] = [
    { header: "ID", accessor: (r) => r.id },
    { header: "Date", accessor: (r) => r.date },
    { header: "Shift type", accessor: (r) => END_OF_SHIFT_TYPE_LABEL[r.shift_type] },
    { header: "Shift start", accessor: (r) => r.shift_start },
    { header: "Shift end", accessor: (r) => r.shift_end },
    { header: "Staff member", accessor: (r) => getStaffName(r.staff_member) },
    {
      header: "Tasks complete",
      accessor: (r) =>
        `${r.checks.filter((c) => c.completed).length}/${r.checks.length}`,
    },
    {
      header: "Completion %",
      accessor: (r) => String(completionPct(r)),
    },
    {
      header: "All tasks complete",
      accessor: (r) => (r.all_tasks_complete ? "Yes" : "No"),
    },
    {
      header: "Escalations",
      accessor: (r) => r.any_escalations.join(" | "),
    },
    {
      header: "Key handover points",
      accessor: (r) => r.key_handover_points.join(" | "),
    },
    {
      header: "Child observations",
      accessor: (r) => r.child_observations,
    },
    {
      header: "Staff wellbeing check-in",
      accessor: (r) => r.staff_wellbeing_check_in,
    },
    {
      header: "Building secured",
      accessor: (r) => r.building_security_checked ? "Yes" : "No",
    },
    {
      header: "Medication cabinet locked",
      accessor: (r) => r.medication_cabinet_locked ? "Yes" : "No",
    },
    {
      header: "Pets cared for",
      accessor: (r) => (r.pets_cared_for ? "Yes" : "No"),
    },
    {
      header: "Kitchen closed",
      accessor: (r) => (r.kitchen_closed ? "Yes" : "No"),
    },
    {
      header: "Next shift staff",
      accessor: (r) => getStaffName(r.next_shift_staff),
    },
    {
      header: "Handover delivered",
      accessor: (r) => (r.handover_delivered ? "Yes" : "No"),
    },
  ];

  if (isLoading) {
    return (
      <PageShell title="End-of-Shift Checklist" subtitle="Loading...">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="End-of-Shift Checklist"
      subtitle="Standardised closing-down tasks completed by every member of staff before handover."
      ariaContext={{ pageTitle: "End-of-Shift Checklist", sourceType: "general" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton
            data={visible}
            columns={exportColumns}
            filename="end-of-shift-checklist"
          />
          <PrintButton title="End-of-Shift Checklists" />
          <AriaStudioQuickActionButton context={{ record_type: "handover", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      {/* Banner */}
      <div className="mb-6 rounded-lg border border-indigo-200 bg-indigo-50 p-4">
        <div className="flex items-start gap-3">
          <ClipboardCheck className="h-5 w-5 flex-shrink-0 text-indigo-700 mt-0.5" />
          <div className="text-sm text-indigo-900">
            <p className="font-semibold">
              Closing the shift well is part of safeguarding.
            </p>
            <p className="mt-1">
              A consistent end-of-shift discipline protects children's safety,
              continuity of medication, and quality of records — and gives the
              incoming team the steady foundation they need. Each completed
              checklist forms part of the evidence base for Quality Standard 13
              and Reg 33.
            </p>
          </div>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4 mb-6">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-xs text-slate-600 uppercase tracking-wide">
            <CalendarClock className="h-4 w-4" /> Shifts logged
          </div>
          <div className="mt-2 text-3xl font-semibold text-slate-900">
            {summary.shiftsLogged}
          </div>
          <div className="mt-1 text-xs text-slate-500">recent shifts</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-xs text-slate-600 uppercase tracking-wide">
            <CheckCircle2 className="h-4 w-4" /> Completion rate
          </div>
          <div
            className={cn(
              "mt-2 text-3xl font-semibold",
              summary.completionRate >= 95
                ? "text-emerald-700"
                : summary.completionRate >= 85
                  ? "text-amber-700"
                  : "text-rose-700",
            )}
          >
            {summary.completionRate}%
          </div>
          <div className="mt-1 text-xs text-slate-500">across all tasks</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-xs text-slate-600 uppercase tracking-wide">
            <AlertTriangle className="h-4 w-4" /> Escalations (week)
          </div>
          <div
            className={cn(
              "mt-2 text-3xl font-semibold",
              summary.escalations === 0 ? "text-emerald-700" : "text-amber-700",
            )}
          >
            {summary.escalations}
          </div>
          <div className="mt-1 text-xs text-slate-500">last 7 days</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-xs text-slate-600 uppercase tracking-wide">
            <Sparkles className="h-4 w-4" /> Avg tasks complete
          </div>
          <div className="mt-2 text-3xl font-semibold text-slate-900">
            {summary.avgComplete}%
          </div>
          <div className="mt-1 text-xs text-slate-500">per shift</div>
        </div>
      </div>

      {/* Filters / sort */}
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white p-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-600">Shift</span>
          <Select value={filterShift} onValueChange={setFilterShift}>
            <SelectTrigger className="w-[160px] h-9">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {Object.entries(END_OF_SHIFT_TYPE_LABEL).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 text-slate-500" />
          <span className="text-xs font-medium text-slate-600">Sort by</span>
          <Select
            value={sortKey}
            onValueChange={(v: string) => setSortKey(v as SortKey)}
          >
            <SelectTrigger className="w-[220px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date_desc">Date (newest first)</SelectItem>
              <SelectItem value="date_asc">Date (oldest first)</SelectItem>
              <SelectItem value="completion_desc">
                Completion (highest)
              </SelectItem>
              <SelectItem value="completion_asc">
                Completion (lowest)
              </SelectItem>
              <SelectItem value="shift">Shift type</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="ml-auto text-xs text-slate-500">
          Showing {visible.length} of {records.length}
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {visible.map((r) => {
          const isOpen = expandedId === r.id;
          const pct = completionPct(r);
          const totalDone = r.checks.filter((c) => c.completed).length;
          return (
            <div
              key={r.id}
              className="rounded-lg border border-slate-200 bg-white shadow-sm"
            >
              {/* Header */}
              <button
                type="button"
                onClick={() =>
                  setExpandedId((current) => (current === r.id ? null : r.id))
                }
                className="flex w-full items-start justify-between gap-4 p-4 text-left"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-slate-900">
                      {getStaffName(r.staff_member)}
                    </span>
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-xs font-medium",
                        shiftColour(r.shift_type),
                      )}
                    >
                      {END_OF_SHIFT_TYPE_LABEL[r.shift_type]}
                    </span>
                    {r.all_tasks_complete ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        All complete
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Outstanding
                      </span>
                    )}
                    {r.any_escalations.length > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-800">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Escalation
                      </span>
                    )}
                    <span className="text-sm font-semibold text-slate-700">
                      {totalDone}/{r.checks.length} ({pct}%)
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                    <span className="flex items-center gap-1">
                      <CalendarClock className="h-3.5 w-3.5" />
                      {formatPretty(r.date)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {r.shift_start}–{r.shift_end}
                    </span>
                    <span className="flex items-center gap-1">
                      <ArrowRightLeft className="h-3.5 w-3.5" />
                      Handover to {getStaffName(r.next_shift_staff)}
                    </span>
                  </div>
                </div>
                <div className="flex-shrink-0 pt-1">
                  {isOpen ? (
                    <ChevronUp className="h-5 w-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-slate-400" />
                  )}
                </div>
              </button>

              {/* Body */}
              {isOpen && (
                <div className="border-t border-slate-200 p-4 space-y-5">
                  {/* Closing-down summary */}
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    <div
                      className={cn(
                        "rounded-md border p-3",
                        r.building_security_checked
                          ? "border-emerald-200 bg-emerald-50"
                          : "border-rose-200 bg-rose-50",
                      )}
                    >
                      <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
                        <Lock className="h-4 w-4" /> Building secured
                      </div>
                      <div
                        className={cn(
                          "mt-1 text-sm font-semibold",
                          r.building_security_checked
                            ? "text-emerald-800"
                            : "text-rose-800",
                        )}
                      >
                        {r.building_security_checked ? "Yes" : "No"}
                      </div>
                    </div>
                    <div
                      className={cn(
                        "rounded-md border p-3",
                        r.medication_cabinet_locked
                          ? "border-emerald-200 bg-emerald-50"
                          : "border-rose-200 bg-rose-50",
                      )}
                    >
                      <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
                        <Pill className="h-4 w-4" /> Med cabinet locked
                      </div>
                      <div
                        className={cn(
                          "mt-1 text-sm font-semibold",
                          r.medication_cabinet_locked
                            ? "text-emerald-800"
                            : "text-rose-800",
                        )}
                      >
                        {r.medication_cabinet_locked ? "Yes" : "No"}
                      </div>
                    </div>
                    <div
                      className={cn(
                        "rounded-md border p-3",
                        r.kitchen_closed
                          ? "border-emerald-200 bg-emerald-50"
                          : "border-rose-200 bg-rose-50",
                      )}
                    >
                      <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
                        <ChefHat className="h-4 w-4" /> Kitchen closed
                      </div>
                      <div
                        className={cn(
                          "mt-1 text-sm font-semibold",
                          r.kitchen_closed
                            ? "text-emerald-800"
                            : "text-rose-800",
                        )}
                      >
                        {r.kitchen_closed ? "Yes" : "No"}
                      </div>
                    </div>
                    <div
                      className={cn(
                        "rounded-md border p-3",
                        r.pets_cared_for
                          ? "border-emerald-200 bg-emerald-50"
                          : "border-rose-200 bg-rose-50",
                      )}
                    >
                      <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
                        <PawPrint className="h-4 w-4" /> Pets cared for
                      </div>
                      <div
                        className={cn(
                          "mt-1 text-sm font-semibold",
                          r.pets_cared_for
                            ? "text-emerald-800"
                            : "text-rose-800",
                        )}
                      >
                        {r.pets_cared_for ? "Yes" : "No"}
                      </div>
                    </div>
                  </div>

                  {/* Checks grouped by category */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-2">
                      <ClipboardCheck className="h-4 w-4" /> Checklist items
                    </h3>
                    <div className="space-y-3">
                      {(
                        [
                          "safeguarding",
                          "medication",
                          "environment_security",
                          "records",
                          "childrens_wellbeing",
                          "communication",
                        ] as ChecklistCategory[]
                      ).map((cat) => {
                        const items = r.checks.filter((c) => c.category === cat);
                        if (items.length === 0) return null;
                        return (
                          <div
                            key={cat}
                            className="rounded-md border border-slate-200"
                          >
                            <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 uppercase tracking-wide">
                              {categoryIcon[cat]}
                              {CHECKLIST_CATEGORY_LABEL[cat]}
                            </div>
                            <ul className="divide-y divide-slate-100">
                              {items.map((it, i) => (
                                <li
                                  key={i}
                                  className="flex items-start gap-3 px-3 py-2 text-sm"
                                >
                                  {it.completed ? (
                                    <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-600 mt-0.5" />
                                  ) : (
                                    <XCircle className="h-4 w-4 flex-shrink-0 text-rose-600 mt-0.5" />
                                  )}
                                  <div className="flex-1">
                                    <div
                                      className={cn(
                                        "text-slate-800",
                                        !it.completed && "font-medium",
                                      )}
                                    >
                                      {it.item}
                                    </div>
                                    {it.notes && (
                                      <div className="mt-1 text-xs text-slate-600 italic">
                                        {it.notes}
                                      </div>
                                    )}
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Escalations */}
                  {r.any_escalations.length > 0 && (
                    <div className="rounded-md border border-rose-200 bg-rose-50 p-3">
                      <h4 className="text-sm font-semibold text-rose-900 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" /> Escalations during
                        shift
                      </h4>
                      <ul className="mt-2 list-disc pl-5 space-y-1 text-sm text-rose-900">
                        {r.any_escalations.map((e, i) => (
                          <li key={i}>{e}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Key handover points */}
                  <div className="rounded-md border border-indigo-200 bg-indigo-50 p-3">
                    <h4 className="text-sm font-semibold text-indigo-900 flex items-center gap-2">
                      <ArrowRightLeft className="h-4 w-4" /> Key handover points
                    </h4>
                    {r.key_handover_points.length > 0 ? (
                      <ul className="mt-2 list-disc pl-5 space-y-1 text-sm text-indigo-900">
                        {r.key_handover_points.map((p, i) => (
                          <li key={i}>{p}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-sm text-indigo-800 italic">
                        Nothing additional handed over.
                      </p>
                    )}
                  </div>

                  {/* Observations + wellbeing */}
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="rounded-md border border-slate-200 p-3">
                      <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                        <Heart className="h-4 w-4" /> Child observations
                      </h4>
                      <p className="mt-1 text-sm text-slate-700">
                        {r.child_observations}
                      </p>
                    </div>
                    <div className="rounded-md border border-slate-200 p-3">
                      <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                        <Users className="h-4 w-4" /> Staff wellbeing check-in
                      </h4>
                      <p className="mt-1 text-sm text-slate-700">
                        {r.staff_wellbeing_check_in}
                      </p>
                    </div>
                  </div>

                  {/* Footer line */}
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-slate-500 border-t border-slate-100 pt-3">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3.5 w-3.5" />
                      Record ID: {r.id}
                    </span>
                    <span className="flex items-center gap-1">
                      <ArrowRightLeft className="h-3.5 w-3.5" />
                      Handover delivered:{" "}
                      <span
                        className={cn(
                          "font-medium",
                          r.handover_delivered
                            ? "text-emerald-700"
                            : "text-rose-700",
                        )}
                      >
                        {r.handover_delivered ? "Yes" : "No"}
                      </span>
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {visible.length === 0 && (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            No checklists match the current filters.
          </div>
        )}
      </div>

      {/* Regulatory note */}
      <div className="mt-8 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
        <h3 className="font-semibold text-slate-900 mb-1 flex items-center gap-2">
          <BookOpen className="h-4 w-4" /> Regulatory basis
        </h3>
        <p>
          The Children's Homes (England) Regulations 2015 — Quality Standard 13
          (Leadership and Management) requires the Registered Manager to ensure
          staff work as a team and that systems for safeguarding, medication,
          environment, and records are robust at every transition between
          shifts. Reg 33 visits ask the Independent Person to confirm that
          children are effectively safeguarded and that information flows
          reliably between staff. A standardised end-of-shift checklist — with
          consistent escalation and handover behaviour — is one of the clearest
          direct evidence sources for both, feeding Reg 45 quality of care
          reviews and the SCCIF self-evaluation.
        </p>
      </div>
      <CareEventsPanel
        title="Care Events — Daily Log"
        category="general"
        days={14}
        defaultCollapsed
      />
    </PageShell>
  );
}

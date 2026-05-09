"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import {
  Search, CheckCircle2, Circle, Clock, Ban,
  AlertTriangle, Flame, ArrowUp, ArrowRight, ArrowDown, Shield,
  Heart, Timer, CalendarDays, RotateCcw, X,
  User, CheckSquare, ChevronRight, Sparkles, Link2,
  Target, ArrowUpDown, Star,
} from "lucide-react";

type SortKey = "priority" | "due_date" | "assignee" | "category" | "status";
import { getStaffName, getYPName } from "@/lib/seed-data";
import { useTasks } from "@/hooks/use-tasks";
import { useStaff } from "@/hooks/use-staff";
import { cn, todayStr, formatRelative, isOverdue, isDueToday } from "@/lib/utils";
import { TASK_CATEGORY_LABELS, TASK_PRIORITIES } from "@/lib/constants";
import { EmptyState } from "@/components/ui/empty-state";
import type { Task } from "@/types";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";
import { PrintButton } from "@/components/common/print-button";
import { ExportButton, type ExportColumn } from "@/components/common/export-button";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

const TASK_EXPORT_COLS: ExportColumn<Task>[] = [
  { header: "Title", accessor: (t) => t.title },
  { header: "Category", accessor: (t) => t.category },
  { header: "Priority", accessor: (t) => t.priority },
  { header: "Status", accessor: (t) => t.status },
  { header: "Assigned To", accessor: (t) => t.assigned_to ? getStaffName(t.assigned_to) : "" },
  { header: "Due Date", accessor: (t) => t.due_date ?? "" },
  { header: "Young Person", accessor: (t) => t.linked_child_id ? getYPName(t.linked_child_id) : "" },
  { header: "Description", accessor: (t) => t.description },
  { header: "Recurring", accessor: (t) => t.recurring ? `Yes (${t.recurring_schedule ?? ""})` : "No" },
  { header: "Escalated", accessor: (t) => t.escalated ? "Yes" : "No" },
  { header: "Created", accessor: (t) => t.created_at },
];

// ── Module-level quick create context (pre-fills the modal for this page) ─────
const TASKS_QUICK_CREATE_CONTEXT = { module: "tasks" } as const;

// ── Status and priority display config ───────────────────────────────────────

const STATUS_CONFIG: Record<string, { color: string; bgColor: string; icon: React.ElementType; label: string }> = {
  not_started: { color: "text-slate-500", bgColor: "bg-slate-100", icon: Circle, label: "Not Started" },
  in_progress:  { color: "text-blue-600",   bgColor: "bg-blue-100",   icon: Clock,       label: "In Progress" },
  blocked:      { color: "text-red-600",     bgColor: "bg-red-100",    icon: Ban,         label: "Blocked" },
  completed:    { color: "text-emerald-600", bgColor: "bg-emerald-100",icon: CheckCircle2,label: "Completed" },
  cancelled:    { color: "text-slate-400",   bgColor: "bg-slate-100",  icon: X,           label: "Cancelled" },
};

const PRIORITY_CONFIG: Record<string, { color: string; border: string; icon: React.ElementType; label: string }> = {
  urgent: { color: "bg-red-100 text-red-800",       border: "border-l-red-600",   icon: Flame,     label: "Urgent" },
  high:   { color: "bg-orange-100 text-orange-800", border: "border-l-orange-500",icon: ArrowUp,   label: "High"   },
  medium: { color: "bg-blue-100 text-blue-800",     border: "border-l-blue-400",  icon: ArrowRight,label: "Medium" },
  low:    { color: "bg-slate-100 text-slate-600",   border: "border-l-slate-300", icon: ArrowDown, label: "Low"    },
};

type ViewMode = "list" | "kanban";

// ─────────────────────────────────────────────────────────────────────────────

export default function TasksPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filterPerson, setFilterPerson] = useState<string | null>(null);
  const [ariaLinkContext, setAriaLinkContext] = useState<{ childId: string; linkedId: string; sourceType: string } | null>(null);

  // Handle ARIA "Create Follow-Up Task" quick-action — pre-filter by child and show prompt
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const isNew = p.get("new") === "1";
    const childId = p.get("child_id");
    const linkedId = p.get("linked_id") ?? "";
    const sourceType = p.get("source_type") ?? "";
    if (isNew && childId) {
      setFilterPerson(childId);
      setAriaLinkContext({ childId, linkedId, sourceType });
    }
  }, []);
  const [filterPriority, setFilterPriority] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [showCompleted, setShowCompleted] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("priority");
  const today = todayStr();

  const tasksQuery = useTasks();
  const staffQuery = useStaff();
  const allTasks: Task[] = tasksQuery.data?.data ?? [];

  // ── Stats ──────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const active = allTasks.filter((t) => t.status !== "completed" && t.status !== "cancelled");
    const overdue = active.filter((t) => isOverdue(t.due_date, t.status));
    const dueToday = active.filter((t) => isDueToday(t.due_date));
    const blocked = active.filter((t) => t.status === "blocked");
    const awaitingSignOff = allTasks.filter((t) => t.requires_sign_off && !t.signed_off_by && t.status === "completed");
    const urgent = active.filter((t) => t.priority === "urgent");
    const completedAll = allTasks.filter((t) => t.status === "completed");
    const unassigned = active.filter((t) => !t.assigned_to);
    return {
      active: active.length, overdue: overdue.length, dueToday: dueToday.length,
      blocked: blocked.length, awaitingSignOff: awaitingSignOff.length,
      urgent: urgent.length, completed: completedAll.length,
      unassigned: unassigned.length,
    };
  }, [allTasks]);

  // ── Available categories ───────────────────────────────────────────────
  const availableCategories = useMemo(() => {
    const cats = new Set(allTasks.map((t) => t.category));
    return Array.from(cats).sort();
  }, [allTasks]);

  const filtered = useMemo(() => {
    let list = allTasks;
    if (!showCompleted) list = list.filter((t) => t.status !== "completed" && t.status !== "cancelled");
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((t) => t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q));
    }
    if (filterPerson)   list = list.filter((t) => t.assigned_to === filterPerson);
    if (filterPriority) list = list.filter((t) => t.priority === filterPriority);
    if (filterCategory) list = list.filter((t) => t.category === filterCategory);

    // Sort
    const pw: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
    return [...list].sort((a, b) => {
      switch (sortKey) {
        case "due_date": {
          if (!a.due_date && !b.due_date) return 0;
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return a.due_date.localeCompare(b.due_date);
        }
        case "assignee": return (getStaffName(a.assigned_to ?? "")).localeCompare(getStaffName(b.assigned_to ?? ""));
        case "category": return (a.category ?? "").localeCompare(b.category ?? "");
        case "status": {
          const sw: Record<string, number> = { blocked: 0, not_started: 1, in_progress: 2, completed: 3, cancelled: 4 };
          return (sw[a.status] ?? 2) - (sw[b.status] ?? 2);
        }
        default: {
          const aO = isOverdue(a.due_date, a.status) ? -10 : 0;
          const bO = isOverdue(b.due_date, b.status) ? -10 : 0;
          return (aO + (pw[a.priority] ?? 2)) - (bO + (pw[b.priority] ?? 2));
        }
      }
    });
  }, [allTasks, search, filterPerson, filterPriority, filterCategory, showCompleted, sortKey]);

  const kanban = useMemo(() => ({
    not_started: filtered.filter((t) => t.status === "not_started"),
    in_progress:  filtered.filter((t) => t.status === "in_progress"),
    blocked:      filtered.filter((t) => t.status === "blocked"),
    completed:    filtered.filter((t) => t.status === "completed").slice(0, 10),
  }), [filtered]);

  const clearFilters = () => {
    setSearch(""); setFilterPerson(null); setFilterPriority(null); setFilterCategory(null);
  };
  const hasFilters = search || filterPerson || filterPriority || filterCategory;
  const activeStaff = (staffQuery.data?.data ?? []).filter((s) => s.is_active && s.role !== "responsible_individual");

  return (
    <PageShell
      title="Tasks"
      subtitle={`${filtered.length} task${filtered.length !== 1 ? "s" : ""} ${hasFilters ? "(filtered)" : ""}`}
      ariaContext={{ pageTitle: "Related Care Events", sourceType: "child_record" }}
      quickCreateContext={TASKS_QUICK_CREATE_CONTEXT}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={filtered} columns={TASK_EXPORT_COLS} filename="tasks" />
          <PrintButton title="Tasks" subtitle="Oak House — Task Management" targetId="tasks-content" />
          <SmartUploadButton variant="inline" label="Upload" uploadContext="Tasks — supporting document upload" />
        </div>
      }
    >
      <div id="tasks-content" className="space-y-4 animate-fade-in">

        {/* ── Stats row ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {[
            { label: "Active",       value: stats.active,         icon: Target,       colour: "text-indigo-600", bg: "bg-indigo-50" },
            { label: "Overdue",      value: stats.overdue,        icon: AlertTriangle, colour: stats.overdue > 0 ? "text-red-600" : "text-emerald-600", bg: stats.overdue > 0 ? "bg-red-50" : "bg-emerald-50" },
            { label: "Due Today",    value: stats.dueToday,       icon: CalendarDays,  colour: stats.dueToday > 0 ? "text-amber-600" : "text-slate-400", bg: stats.dueToday > 0 ? "bg-amber-50" : "bg-slate-50" },
            { label: "Urgent",       value: stats.urgent,         icon: Flame,         colour: stats.urgent > 0 ? "text-red-600" : "text-slate-400", bg: stats.urgent > 0 ? "bg-red-50" : "bg-slate-50" },
            { label: "Blocked",      value: stats.blocked,        icon: Ban,           colour: stats.blocked > 0 ? "text-red-600" : "text-slate-400", bg: stats.blocked > 0 ? "bg-red-50" : "bg-slate-50" },
            { label: "Sign-off",     value: stats.awaitingSignOff,icon: Star,          colour: stats.awaitingSignOff > 0 ? "text-amber-600" : "text-slate-400", bg: stats.awaitingSignOff > 0 ? "bg-amber-50" : "bg-slate-50" },
            { label: "Unassigned",   value: stats.unassigned,     icon: User,          colour: stats.unassigned > 0 ? "text-orange-600" : "text-slate-400", bg: stats.unassigned > 0 ? "bg-orange-50" : "bg-slate-50" },
            { label: "Completed",    value: stats.completed,      icon: CheckCircle2,  colour: "text-emerald-600", bg: "bg-emerald-50" },
          ].map(({ label, value, icon: Icon, colour, bg }) => (
            <div key={label} className={cn("rounded-xl border border-slate-100 p-2.5 text-center", bg)}>
              <Icon className={cn("h-3 w-3 mx-auto mb-0.5", colour)} />
              <div className={cn("text-sm font-bold tabular-nums", colour)}>{value}</div>
              <div className="text-[9px] text-slate-500">{label}</div>
            </div>
          ))}
        </div>

        {/* ── Overdue alert ───────────────────────────────────────────────── */}
        {stats.overdue > 0 && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 flex items-center gap-3">
            <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-800">
                {stats.overdue} overdue task{stats.overdue !== 1 ? "s" : ""} require attention
              </p>
              <p className="text-xs text-red-600 mt-0.5">
                Overdue tasks may indicate compliance risks — review and action or escalate promptly
              </p>
            </div>
          </div>
        )}

        {/* ── ARIA follow-up task prompt ────────────────────────────────────── */}
        {ariaLinkContext && (
          <div className="flex items-start gap-3 rounded-2xl border border-violet-200 bg-violet-50 p-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-600">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-violet-900">
                Create a follow-up task for {getYPName(ariaLinkContext.childId)}
              </p>
              <p className="text-xs text-violet-700 mt-0.5 flex items-center gap-1">
                <Link2 className="h-3 w-3 shrink-0" />
                Linked from {ariaLinkContext.sourceType.replace(/_/g, " ")} record{ariaLinkContext.linkedId ? ` · ${ariaLinkContext.linkedId}` : ""}
              </p>
              <p className="text-xs text-violet-600 mt-1">
                Use the <strong>+ New Task</strong> button at the top right to create a task.
                The young person filter has been pre-set for you.
              </p>
            </div>
            <button
              onClick={() => setAriaLinkContext(null)}
              className="text-violet-400 hover:text-violet-600 shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ── Toolbar ──────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tasks…" className="pl-9" />
          </div>

          {/* Priority filter */}
          <div className="flex gap-1">
            {TASK_PRIORITIES.map((p) => {
              const cfg = PRIORITY_CONFIG[p];
              const PIcon = cfg.icon;
              return (
                <Button
                  key={p}
                  variant={filterPriority === p ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterPriority(filterPriority === p ? null : p)}
                  className="gap-1 capitalize"
                >
                  <PIcon className="h-3 w-3" />{p}
                </Button>
              );
            })}
          </div>

          {/* Person filter */}
          <select
            value={filterPerson || ""}
            onChange={(e) => setFilterPerson(e.target.value || null)}
            className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none"
          >
            <option value="">All staff</option>
            {activeStaff.map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
          </select>

          {/* Category filter */}
          <select
            value={filterCategory || ""}
            onChange={(e) => setFilterCategory(e.target.value || null)}
            className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none"
          >
            <option value="">All categories</option>
            {availableCategories.map((cat) => (
              <option key={cat} value={cat}>{TASK_CATEGORY_LABELS[cat as keyof typeof TASK_CATEGORY_LABELS] || cat}</option>
            ))}
          </select>

          {/* Sort */}
          <div className="flex items-center gap-1">
            <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none"
            >
              <option value="priority">Priority</option>
              <option value="due_date">Due date</option>
              <option value="status">Status</option>
              <option value="assignee">Assignee</option>
              <option value="category">Category</option>
            </select>
          </div>

          {/* View toggle */}
          <div className="flex gap-1 ml-auto">
            <Button variant={viewMode === "list"   ? "default" : "outline"} size="sm" onClick={() => setViewMode("list")}>List</Button>
            <Button variant={viewMode === "kanban" ? "default" : "outline"} size="sm" onClick={() => setViewMode("kanban")}>Board</Button>
          </div>

          <Button
            variant="outline" size="sm"
            onClick={() => setShowCompleted(!showCompleted)}
            className={cn(showCompleted && "bg-slate-100")}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />{showCompleted ? "Hide" : "Show"} completed
          </Button>

          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <RotateCcw className="h-3.5 w-3.5" />Clear
            </Button>
          )}
        </div>

        {/* Results count */}
        {hasFilters && (
          <p className="text-xs text-slate-500">
            Showing {filtered.length} of {allTasks.length} task{allTasks.length !== 1 ? "s" : ""}
            {search && <span className="text-slate-400"> matching &ldquo;{search}&rdquo;</span>}
          </p>
        )}

        {/* ── List View ────────────────────────────────────────────────────── */}
        {viewMode === "list" && (
          <div className="space-y-2">
            {filtered.map((task) => {
              const overdue   = isOverdue(task.due_date, task.status);
              const dueToday  = isDueToday(task.due_date);
              const prio      = PRIORITY_CONFIG[task.priority];
              const stat      = STATUS_CONFIG[task.status];
              const StatusIcon = stat.icon;
              const PrioIcon   = prio.icon;
              const isComplete = task.status === "completed";

              return (
                <div
                  key={task.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push(`/tasks/${task.id}`)}
                  onKeyDown={(e) => e.key === "Enter" && router.push(`/tasks/${task.id}`)}
                  className={cn(
                    "rounded-2xl border bg-white border-l-4 p-4 transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer group",
                    prio.border,
                    overdue && "ring-1 ring-red-200",
                    isComplete && "opacity-60",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn("mt-0.5 rounded-full p-1.5 shrink-0", stat.bgColor)}>
                      <StatusIcon className={cn("h-4 w-4", stat.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className={cn("text-sm font-semibold leading-snug", isComplete ? "line-through text-slate-400" : "text-slate-900")}>
                            {task.title}
                          </h4>
                          {task.description && (
                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{task.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {task.requires_sign_off && !task.signed_off_by && (
                            <Badge variant="warning" className="text-[9px] rounded-full gap-0.5">
                              <Shield className="h-3 w-3" />Sign-off
                            </Badge>
                          )}
                          {task.escalated && (
                            <Badge variant="destructive" className="text-[9px] rounded-full">Escalated</Badge>
                          )}
                        </div>
                      </div>

                      {/* Meta row */}
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Badge className={cn("text-[10px] rounded-full border-0", prio.color)}>
                          <PrioIcon className="h-3 w-3 mr-0.5" />{prio.label}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] rounded-full capitalize">
                          {TASK_CATEGORY_LABELS[task.category as keyof typeof TASK_CATEGORY_LABELS] || task.category}
                        </Badge>
                        {task.due_date && (
                          <span className={cn("text-[11px] font-medium flex items-center gap-1", overdue ? "text-red-600" : dueToday ? "text-orange-600" : "text-slate-500")}>
                            <CalendarDays className="h-3 w-3" />{formatRelative(task.due_date)}
                          </span>
                        )}
                        {task.estimated_minutes && (
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Timer className="h-3 w-3" />{task.estimated_minutes}m
                          </span>
                        )}
                        {task.recurring && <Badge variant="info" className="text-[9px] rounded-full">Recurring</Badge>}
                        {task.linked_child_id && (
                          <Badge variant="purple" className="text-[9px] rounded-full gap-0.5">
                            <Heart className="h-3 w-3" />{getYPName(task.linked_child_id)}
                          </Badge>
                        )}
                        {task.linked_incident_id && (
                          <Badge variant="destructive" className="text-[9px] rounded-full gap-0.5">
                            <AlertTriangle className="h-3 w-3" />{task.linked_incident_id.replace("inc_", "INC-")}
                          </Badge>
                        )}
                        {(task as never as { care_event_id?: string }).care_event_id && (
                          <Link
                            href={`/care-events/${(task as never as { care_event_id: string }).care_event_id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[9px] font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
                          >
                            <Sparkles className="h-3 w-3" />
                            Care Event
                          </Link>
                        )}
                      </div>

                      {/* Assignee + open indicator */}
                      <div className="mt-2 flex items-center justify-between">
                        {task.assigned_to ? (
                          <div className="flex items-center gap-2">
                            <Avatar name={getStaffName(task.assigned_to)} size="xs" />
                            <span className="text-xs text-slate-600">{getStaffName(task.assigned_to)}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <User className="h-3 w-3" />Unassigned
                          </span>
                        )}
                        <ChevronRight className="h-4 w-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      {isComplete && task.evidence_note && (
                        <p className="mt-1 text-[10px] text-emerald-600 italic truncate">{task.evidence_note}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {filtered.length === 0 && (
              <EmptyState
                icon={CheckSquare}
                title="No tasks match your filters"
                description="Try adjusting your search or filter criteria to find what you're looking for."
                compact
              />
            )}
          </div>
        )}

        {/* ── Kanban View ──────────────────────────────────────────────────── */}
        {viewMode === "kanban" && (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {(["not_started", "in_progress", "blocked", "completed"] as const).map((status) => {
              const cfg = STATUS_CONFIG[status];
              const colTasks = kanban[status] || [];
              return (
                <div key={status} className="flex-shrink-0 w-[300px]">
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <div className={cn(
                      "h-2 w-2 rounded-full",
                      status === "not_started" ? "bg-slate-400" :
                      status === "in_progress"  ? "bg-blue-500"  :
                      status === "blocked"       ? "bg-red-500"   : "bg-emerald-500"
                    )} />
                    <span className="text-sm font-semibold text-slate-700">{cfg.label}</span>
                    <Badge variant="outline" className="rounded-full text-xs ml-auto">{colTasks.length}</Badge>
                  </div>
                  <div className="space-y-2">
                    {colTasks.map((task) => {
                      const overdue = isOverdue(task.due_date, task.status);
                      const prio    = PRIORITY_CONFIG[task.priority];
                      return (
                        <div
                          key={task.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => router.push(`/tasks/${task.id}`)}
                          onKeyDown={(e) => e.key === "Enter" && router.push(`/tasks/${task.id}`)}
                          className={cn(
                            "rounded-xl border bg-white p-3 border-l-4 hover:shadow-md cursor-pointer transition-all",
                            prio.border,
                            overdue && "ring-1 ring-red-200",
                          )}
                        >
                          <div className="text-xs font-semibold text-slate-900 leading-snug">{task.title}</div>
                          <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            <Badge className={cn("text-[9px] rounded-full border-0", prio.color)}>{prio.label}</Badge>
                            {task.due_date && (
                              <span className={cn("text-[10px]", overdue ? "text-red-600 font-semibold" : "text-slate-400")}>
                                {formatRelative(task.due_date)}
                              </span>
                            )}
                          </div>
                          {task.assigned_to && (
                            <div className="mt-2 flex items-center gap-1.5">
                              <Avatar name={getStaffName(task.assigned_to)} size="xs" />
                              <span className="text-[10px] text-slate-500">{getStaffName(task.assigned_to).split(" ")[0]}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {colTasks.length === 0 && (
                      <EmptyState
                        icon={CheckSquare}
                        title="Empty"
                        description="No tasks in this column"
                        compact
                        className="py-6 text-xs"
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}

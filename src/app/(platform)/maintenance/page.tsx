"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — MAINTENANCE
// Building maintenance, safety checks, and scheduled works tracker.
// Covers H&S compliance, fire safety, plumbing, electrical, HVAC, and general
// maintenance for Ofsted Reg 25 (premises) requirements.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Wrench, Plus, AlertTriangle, CheckCircle2, Clock, Calendar,
  Flame, Zap, Droplets, Shield, X, Search, LayoutList,
  FolderOpen, BarChart3, Loader2, RefreshCw, ArrowUpDown,
} from "lucide-react";
import { cn, formatDate, daysFromNow, todayStr } from "@/lib/utils";
import { useMaintenance, useCreateMaintenanceItem, useUpdateMaintenanceItem } from "@/hooks/use-maintenance";
import type { MaintenanceItem } from "@/types/extended";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";
import { PrintButton } from "@/components/common/print-button";
import { ExportButton, type ExportColumn } from "@/components/common/export-button";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

type MaintenanceStatus = "open" | "scheduled" | "completed";
type MaintenancePriority = "urgent" | "high" | "medium" | "low";
type MaintenanceCategory = "hvac" | "fire_safety" | "plumbing" | "security" | "electrical" | "cleaning" | "general";

const MAINTENANCE_EXPORT_COLS: ExportColumn<MaintenanceItem>[] = [
  { header: "Title", accessor: (m) => m.title },
  { header: "Category", accessor: (m) => m.category },
  { header: "Priority", accessor: (m) => m.priority },
  { header: "Status", accessor: (m) => m.status },
  { header: "Due Date", accessor: (m) => m.due_date },
  { header: "Assigned To", accessor: (m) => m.assigned_to },
  { header: "Notes", accessor: (m) => m.notes },
  { header: "Recurring", accessor: (m) => m.recurring ? "Yes" : "No" },
];
type GroupMode = "none" | "category" | "priority";

const CAT_ICONS: Record<string, React.ElementType> = {
  hvac: Flame, fire_safety: Shield, plumbing: Droplets,
  security: Shield, electrical: Zap, cleaning: Wrench, general: Wrench, default: Wrench,
};
const CAT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  hvac:        { bg: "bg-orange-50", text: "text-orange-600", border: "border-orange-200" },
  fire_safety: { bg: "bg-red-50",    text: "text-red-600",    border: "border-red-200" },
  plumbing:    { bg: "bg-cyan-50",   text: "text-cyan-600",   border: "border-cyan-200" },
  security:    { bg: "bg-violet-50", text: "text-violet-600", border: "border-violet-200" },
  electrical:  { bg: "bg-amber-50",  text: "text-amber-600",  border: "border-amber-200" },
  cleaning:    { bg: "bg-teal-50",   text: "text-teal-600",   border: "border-teal-200" },
  general:     { bg: "bg-slate-50",  text: "text-slate-600",  border: "border-slate-200" },
};
const STATUS_COLORS: Record<string, string> = {
  open: "bg-amber-100 text-amber-700",
  scheduled: "bg-blue-100 text-blue-700",
  completed: "bg-emerald-100 text-emerald-700",
};
const PRIO_COLORS: Record<string, string> = {
  urgent: "text-red-600", high: "text-orange-600", medium: "text-blue-600", low: "text-slate-400",
};
const PRIO_SORT: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };

const CATEGORIES: { value: MaintenanceCategory; label: string }[] = [
  { value: "hvac", label: "HVAC / Heating" },
  { value: "fire_safety", label: "Fire Safety" },
  { value: "plumbing", label: "Plumbing" },
  { value: "security", label: "Security" },
  { value: "electrical", label: "Electrical" },
  { value: "cleaning", label: "Cleaning" },
  { value: "general", label: "General" },
];

const CAT_LABELS: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.value, c.label])
);

const EMPTY_FORM = {
  title: "", category: "general" as MaintenanceCategory, priority: "medium" as MaintenancePriority,
  due_date: "", assigned_to: "", notes: "", recurring: false,
};

// ── Maintenance item card ────────────────────────────────────────────────────

function MaintenanceCard({
  item,
  onMarkDone,
  updating,
}: {
  item: MaintenanceItem;
  onMarkDone: (id: string) => void;
  updating: boolean;
}) {
  const Icon = CAT_ICONS[item.category] || Wrench;
  const catColors = CAT_COLORS[item.category] || CAT_COLORS.general;
  const today = todayStr();
  const isOverdue = item.status !== "completed" && item.due_date < today;

  return (
    <div className={cn(
      "rounded-2xl border p-4 flex items-center gap-4 transition-all hover:shadow-md",
      item.priority === "urgent" && item.status !== "completed"
        ? "border-red-200 bg-red-50"
        : isOverdue
        ? "border-amber-200 bg-amber-50"
        : "border-slate-200 bg-white"
    )}>
      <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", catColors.bg)}>
        <Icon className={cn("h-4.5 w-4.5", catColors.text)} style={{ width: "1.125rem", height: "1.125rem" }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-slate-900">{item.title}</span>
          {item.recurring && (
            <Badge className="text-[9px] rounded-full bg-slate-100 text-slate-500 flex items-center gap-0.5">
              <RefreshCw className="h-2 w-2" />Recurring
            </Badge>
          )}
          {isOverdue && (
            <Badge className="text-[9px] rounded-full bg-red-100 text-red-700">Overdue</Badge>
          )}
        </div>
        <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">
          {item.notes || CAT_LABELS[item.category] || item.category}
          {item.assigned_to && <span className="ml-1">· {item.assigned_to}</span>}
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-xs text-slate-500">{formatDate(item.due_date)}</div>
        {isOverdue && (
          <div className="text-[10px] text-red-600 font-medium mt-0.5">
            {Math.ceil((new Date(today).getTime() - new Date(item.due_date).getTime()) / 86400000)}d overdue
          </div>
        )}
      </div>
      <Badge className={cn("text-[9px] rounded-full capitalize shrink-0", PRIO_COLORS[item.priority])}>
        {item.priority}
      </Badge>
      <Badge className={cn("text-[10px] rounded-full capitalize shrink-0", STATUS_COLORS[item.status] || "bg-slate-100")}>
        {item.status}
      </Badge>
      <div className="flex gap-1.5 shrink-0">
        {item.status !== "completed" && (
          <Button
            size="sm"
            className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700"
            onClick={() => onMarkDone(item.id)}
            disabled={updating}
          >
            <CheckCircle2 className="h-3 w-3 mr-0.5" />Done
          </Button>
        )}
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function MaintenancePage() {
  const maintenanceQuery = useMaintenance();
  const items: MaintenanceItem[] = maintenanceQuery.data?.data ?? [];
  const createItem = useCreateMaintenanceItem();
  const updateItem = useUpdateMaintenanceItem();

  const [filter, setFilter] = useState<"all" | "open" | "completed">("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"smart" | "priority" | "date" | "category">("smart");
  const [groupBy, setGroupBy] = useState<GroupMode>("none");
  const [showLog, setShowLog] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const today = todayStr();

  // Derived stats
  const stats = useMemo(() => {
    const open = items.filter((m) => m.status === "open");
    const scheduled = items.filter((m) => m.status === "scheduled");
    const completed = items.filter((m) => m.status === "completed");
    const urgent = items.filter((m) => m.priority === "urgent" && m.status !== "completed");
    const overdue = items.filter((m) => m.status !== "completed" && m.due_date < today);
    return {
      open: open.length,
      scheduled: scheduled.length,
      completed: completed.length,
      urgent: urgent.length,
      overdue: overdue.length,
      total: items.length,
    };
  }, [items, today]);

  // Category breakdown
  const categoryStats = useMemo(() => {
    const map: Record<string, { total: number; open: number; completed: number }> = {};
    for (const item of items) {
      const cat = item.category || "general";
      if (!map[cat]) map[cat] = { total: 0, open: 0, completed: 0 };
      map[cat].total++;
      if (item.status === "completed") map[cat].completed++;
      else map[cat].open++;
    }
    return map;
  }, [items]);

  // Filtering
  const filtered = useMemo(() => {
    let list = items;
    if (filter === "open") list = list.filter((m) => m.status === "open" || m.status === "scheduled");
    else if (filter === "completed") list = list.filter((m) => m.status === "completed");

    if (search) {
      const q = search.toLowerCase();
      list = list.filter((m) =>
        m.title.toLowerCase().includes(q) ||
        (m.notes || "").toLowerCase().includes(q) ||
        (m.assigned_to || "").toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q)
      );
    }

    // Sort
    return [...list].sort((a, b) => {
      switch (sortBy) {
        case "priority": {
          const aPrio = PRIO_SORT[a.priority] ?? 99;
          const bPrio = PRIO_SORT[b.priority] ?? 99;
          return aPrio !== bPrio ? aPrio - bPrio : a.due_date.localeCompare(b.due_date);
        }
        case "date":
          return a.due_date.localeCompare(b.due_date);
        case "category":
          return a.category.localeCompare(b.category);
        case "smart":
        default: {
          const aOverdue = a.status !== "completed" && a.due_date < today ? 0 : 1;
          const bOverdue = b.status !== "completed" && b.due_date < today ? 0 : 1;
          if (aOverdue !== bOverdue) return aOverdue - bOverdue;
          const aPrio = PRIO_SORT[a.priority] ?? 99;
          const bPrio = PRIO_SORT[b.priority] ?? 99;
          if (aPrio !== bPrio) return aPrio - bPrio;
          return a.due_date.localeCompare(b.due_date);
        }
      }
    });
  }, [items, filter, search, today, sortBy]);

  // Grouping
  const grouped = useMemo(() => {
    if (groupBy === "none") return null;
    const map = new Map<string, MaintenanceItem[]>();
    for (const item of filtered) {
      const key = groupBy === "category"
        ? (CAT_LABELS[item.category] || item.category)
        : item.priority;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return map;
  }, [filtered, groupBy]);

  function handleMarkDone(id: string) {
    updateItem.mutate({ id, data: { status: "completed" } });
  }

  function handleLogIssue() {
    if (!form.title.trim()) { setFormError("Title is required"); return; }
    setFormError("");
    createItem.mutate(
      {
        title: form.title.trim(),
        category: form.category,
        priority: form.priority,
        status: "open",
        due_date: form.due_date || daysFromNow(7),
        assigned_to: form.assigned_to?.trim() || null,
        notes: form.notes.trim(),
        recurring: form.recurring,
      },
      {
        onSuccess: () => {
          setShowLog(false);
          setForm(EMPTY_FORM);
        },
      }
    );
  }

  return (
    <>
      <PageShell
        title="Maintenance"
        subtitle="Property maintenance, safety checks, and scheduled works"
      ariaContext={{ pageTitle: "Building Maintenance Log", sourceType: "home_check" }}
        quickCreateContext={{ module: "maintenance", defaultTaskCategory: "maintenance", defaultFormType: "health_safety_check" }}
        actions={
          <div className="flex items-center gap-2">
            <ExportButton<MaintenanceItem> filename="maintenance-export" data={filtered} columns={MAINTENANCE_EXPORT_COLS} label="Export" />
            <PrintButton title="Maintenance" subtitle="Oak House — Building Maintenance Log" targetId="maintenance-content" />
            <SmartUploadButton variant="inline" label="Upload Photo" uploadContext="Maintenance — photo or report upload" />
            <Button size="sm" onClick={() => setShowLog(true)}>
              <Plus className="h-3.5 w-3.5 mr-1" />Log Issue
            </Button>
            <AriaStudioQuickActionButton context={{ record_type: "policy", record_id: "home_oak", home_id: "home_oak" }} />
          </div>
        }
      >
        <div id="maintenance-content" className="space-y-6">

          {/* ── Urgent / overdue alert ─────────────────────────────────────────── */}
          {(stats.urgent > 0 || stats.overdue > 0) && (
            <div className={cn(
              "rounded-2xl border p-4 flex items-start gap-3",
              stats.urgent > 0 ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200",
            )}>
              <AlertTriangle className={cn("h-5 w-5 shrink-0 mt-0.5", stats.urgent > 0 ? "text-red-600" : "text-amber-600")} />
              <div className="flex-1">
                <div className={cn("text-sm font-semibold", stats.urgent > 0 ? "text-red-800" : "text-amber-800")}>
                  {stats.urgent > 0 && <>{stats.urgent} urgent issue{stats.urgent > 1 ? "s" : ""} requiring immediate attention. </>}
                  {stats.overdue > 0 && <>{stats.overdue} maintenance item{stats.overdue > 1 ? "s" : ""} overdue.</>}
                </div>
                <p className={cn("text-xs mt-1", stats.urgent > 0 ? "text-red-700" : "text-amber-700")}>
                  Overdue maintenance may impact Reg 25 (Premises) compliance during Ofsted inspections.
                </p>
              </div>
            </div>
          )}

          {/* ── Stat cards ─────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {[
              { label: "Open Issues", value: stats.open, icon: Wrench, color: "text-amber-600", bg: "bg-amber-50" },
              { label: "Urgent", value: stats.urgent, icon: AlertTriangle, color: stats.urgent > 0 ? "text-red-600" : "text-emerald-600", bg: stats.urgent > 0 ? "bg-red-50" : "bg-emerald-50" },
              { label: "Overdue", value: stats.overdue, icon: Clock, color: stats.overdue > 0 ? "text-red-600" : "text-emerald-600", bg: stats.overdue > 0 ? "bg-red-50" : "bg-emerald-50" },
              { label: "Scheduled", value: stats.scheduled, icon: Calendar, color: "text-blue-600", bg: "bg-blue-50" },
              { label: "Completed", value: stats.completed, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{label}</div>
                    <div className={cn("mt-1 text-3xl font-bold tabular-nums", color)}>{value}</div>
                  </div>
                  <div className={cn("rounded-2xl p-3", bg)}><Icon className={cn("h-5 w-5", color)} /></div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Category breakdown card ────────────────────────────────────────── */}
          {Object.keys(categoryStats).length > 0 && (
            <Card className="rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-blue-500" />
                  Category Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {CATEGORIES.map(({ value: cat, label }) => {
                    const data = categoryStats[cat];
                    if (!data) return null;
                    const Icon = CAT_ICONS[cat] || Wrench;
                    const colors = CAT_COLORS[cat] || CAT_COLORS.general;
                    const pct = data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0;
                    return (
                      <div key={cat} className={cn("rounded-xl border p-3 space-y-2", colors.border)}>
                        <div className="flex items-center gap-2">
                          <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center", colors.bg)}>
                            <Icon className={cn("h-3.5 w-3.5", colors.text)} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-slate-900 truncate">{label}</div>
                            <div className="text-[10px] text-slate-500">{data.open} open · {data.completed} done</div>
                          </div>
                        </div>
                        <Progress value={pct} className="h-1.5" />
                        <div className="text-[10px] text-slate-400 text-right">{pct}% complete</div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Search + filter + grouping toolbar ─────────────────────────────── */}
          <Card className="rounded-2xl">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3 flex-wrap">
                <CardTitle className="text-base flex-1">Maintenance Log</CardTitle>
                <div className="relative min-w-48 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    placeholder="Search issues..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 shrink-0">
                  <ArrowUpDown className="h-3.5 w-3.5" />
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} className="bg-white border rounded-md px-2 py-1.5 text-xs">
                    <option value="smart">Smart (overdue → priority)</option>
                    <option value="priority">Priority only</option>
                    <option value="date">Due date (earliest)</option>
                    <option value="category">Category A–Z</option>
                  </select>
                </div>
                <div className="flex gap-1">
                  {(["all", "open", "completed"] as const).map((f) => (
                    <button key={f} onClick={() => setFilter(f)}
                      className={cn("px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors",
                        filter === f ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      )}
                    >{f}</button>
                  ))}
                </div>
                <div className="flex gap-0.5 rounded-lg border border-slate-200 bg-white p-0.5">
                  <button
                    onClick={() => setGroupBy("none")}
                    className={cn("rounded-md px-2 py-1 text-xs transition-colors",
                      groupBy === "none" ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-700"
                    )}
                    title="Flat list"
                  >
                    <LayoutList className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setGroupBy("category")}
                    className={cn("rounded-md px-2 py-1 text-xs transition-colors",
                      groupBy === "category" ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-700"
                    )}
                    title="Group by category"
                  >
                    <FolderOpen className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setGroupBy("priority")}
                    className={cn("rounded-md px-2 py-1 text-xs transition-colors",
                      groupBy === "priority" ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-700"
                    )}
                    title="Group by priority"
                  >
                    <AlertTriangle className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {maintenanceQuery.isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-5 w-5 animate-spin text-slate-400 mr-2" />
                  <span className="text-sm text-slate-400">Loading maintenance items…</span>
                </div>
              ) : grouped ? (
                /* Grouped view */
                <div className="space-y-6">
                  {Array.from(grouped.entries()).map(([key, groupItems]) => (
                    <div key={key}>
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide capitalize">
                          {key.replace(/_/g, " ")}
                        </span>
                        <span className="text-[10px] text-slate-400">({groupItems.length})</span>
                        <div className="flex-1 h-px bg-slate-100" />
                      </div>
                      <div className="space-y-2">
                        {groupItems.map((item) => (
                          <MaintenanceCard
                            key={item.id}
                            item={item}
                            onMarkDone={handleMarkDone}
                            updating={updateItem.isPending}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                  {grouped.size === 0 && (
                    <div className="py-8 text-center text-sm text-slate-400">No items in this view.</div>
                  )}
                </div>
              ) : (
                /* Flat list view */
                <div className="space-y-2">
                  {filtered.map((item) => (
                    <MaintenanceCard
                      key={item.id}
                      item={item}
                      onMarkDone={handleMarkDone}
                      updating={updateItem.isPending}
                    />
                  ))}
                  {filtered.length === 0 && (
                    <div className="py-8 text-center text-sm text-slate-400">No items match your search or filter.</div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Regulatory compliance note ─────────────────────────────────────── */}
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-500">
            <span className="font-semibold text-slate-600">Regulatory Basis — </span>
            Children&apos;s Homes Regulations 2015 Reg 25 (Premises) requires that premises are
            maintained to a standard appropriate for the care of children, kept in good repair,
            and that all health and safety matters (fire safety, electrical testing, gas safety,
            water hygiene) are current. Ofsted will review maintenance logs during inspection.
          </div>
        </div>
        <CareEventsPanel
        title="Care Events — General"
        category="general"
        days={28}
        defaultCollapsed
      />
      <AriaPanel
        mode="assist"
        pageContext="Building Maintenance Log — repairs, planned maintenance, contractor visits, gas safety, electrical checks, fire equipment, plumbing, Reg 44 premises, Ofsted evidence"
        recordType="policy"
        className="mt-6"
      />
    </PageShell>

      {/* Log Issue Modal */}
      {showLog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          onClick={() => setShowLog(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-base font-bold text-slate-900">Log Maintenance Issue</span>
                <p className="text-xs text-slate-500 mt-0.5">Record a new maintenance issue or scheduled work</p>
              </div>
              <button onClick={() => setShowLog(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">Title <span className="text-red-500">*</span></label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Describe the issue…"
                  className="text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1.5">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as MaintenanceCategory }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1.5">Priority</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as MaintenancePriority }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400"
                  >
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1.5">Due Date</label>
                  <Input
                    type="date"
                    value={form.due_date}
                    onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
                    className="text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1.5">Assigned To</label>
                  <Input
                    value={form.assigned_to ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, assigned_to: e.target.value }))}
                    placeholder="Contractor or staff"
                    className="text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={3}
                  placeholder="Additional details, location within building, photos needed…"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-slate-400 placeholder:text-slate-400"
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.recurring}
                  onChange={(e) => setForm((f) => ({ ...f, recurring: e.target.checked }))}
                  className="rounded"
                />
                Recurring issue (e.g. scheduled annual service)
              </label>

              {formError && <p className="text-xs text-red-600 font-medium">{formError}</p>}
            </div>

            <div className="mt-4 flex gap-3">
              <Button
                className="flex-1"
                onClick={handleLogIssue}
                disabled={createItem.isPending}
              >
                {createItem.isPending ? (
                  <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />Logging…</>
                ) : (
                  <><Plus className="h-4 w-4 mr-1" />Log Issue</>
                )}
              </Button>
              <Button variant="outline" onClick={() => setShowLog(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

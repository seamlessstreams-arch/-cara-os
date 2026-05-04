"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME IMPROVEMENT PLAN
// Post-inspection actions, quality improvement objectives, Reg 45
// recommendations, and self-identified development goals.
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useMemo } from "react";
import {
  Target, Plus, Search, ArrowUpDown, Filter,
  CheckCircle2, AlertTriangle, Clock, TrendingUp,
  ChevronDown, ChevronUp, Calendar, User, Flag,
  FileText, ClipboardList, Hammer, ShieldCheck, BookOpen,
} from "lucide-react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";

/* ── helpers ─────────────────────────────────────────────────────────── */
const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

/* ── types ───────────────────────────────────────────────────────────── */
type ObjectiveSource = "reg44" | "ofsted" | "reg45" | "self" | "maintenance" | "regulatory";
type ObjectivePriority = "high" | "medium" | "low";
type ObjectiveStatus = "planned" | "in_progress" | "completed" | "overdue";

interface ObjectiveUpdate {
  date: string;
  note: string;
  updatedBy: string;
}

interface ImprovementObjective {
  id: string;
  title: string;
  source: ObjectiveSource;
  priority: ObjectivePriority;
  status: ObjectiveStatus;
  owner: string;
  targetDate: string;
  completedDate: string | null;
  progress: number;
  budget: number | null;
  notes: string;
  updates: ObjectiveUpdate[];
}

const SOURCE_LABELS: Record<ObjectiveSource, string> = {
  reg44: "Reg 44 Recommendation",
  ofsted: "Ofsted Inspection",
  reg45: "Reg 45 Recommendation",
  self: "Self-identified (RM)",
  maintenance: "Maintenance Inspection",
  regulatory: "Regulatory Requirement",
};

const SOURCE_COLOUR: Record<ObjectiveSource, string> = {
  reg44: "bg-violet-50 text-violet-700 border-violet-200",
  ofsted: "bg-blue-50 text-blue-700 border-blue-200",
  reg45: "bg-indigo-50 text-indigo-700 border-indigo-200",
  self: "bg-teal-50 text-teal-700 border-teal-200",
  maintenance: "bg-orange-50 text-orange-700 border-orange-200",
  regulatory: "bg-rose-50 text-rose-700 border-rose-200",
};

const PRIORITY_COLOUR: Record<ObjectivePriority, string> = {
  high: "bg-red-50 text-red-700 border-red-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  low: "bg-slate-50 text-slate-600 border-slate-200",
};

const STATUS_COLOUR: Record<ObjectiveStatus, string> = {
  planned: "bg-blue-50 text-blue-700 border-blue-200",
  in_progress: "bg-amber-50 text-amber-700 border-amber-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  overdue: "bg-red-50 text-red-700 border-red-200",
};

const STATUS_LABELS: Record<ObjectiveStatus, string> = {
  planned: "Planned",
  in_progress: "In Progress",
  completed: "Completed",
  overdue: "Overdue",
};

const STATUS_CARD_BORDER: Record<ObjectiveStatus, string> = {
  planned: "border-l-blue-400",
  in_progress: "border-l-amber-400",
  completed: "border-l-emerald-400",
  overdue: "border-l-red-400",
};

const PRIORITY_ORDER: Record<ObjectivePriority, number> = { high: 0, medium: 1, low: 2 };
const STATUS_ORDER: Record<ObjectiveStatus, number> = { overdue: 0, in_progress: 1, planned: 2, completed: 3 };

/* ── seed data ───────────────────────────────────────────────────────── */
const SEED: ImprovementObjective[] = [
  {
    id: "hip_1",
    title: "Develop outdoor recreation space",
    source: "reg44",
    priority: "medium",
    status: "in_progress",
    owner: "staff_darren",
    targetDate: d(90),
    completedDate: null,
    progress: 40,
    budget: null,
    notes: "Basketball hoop ordered, garden furniture quotes received. Linked to children's meeting request.",
    updates: [
      { date: d(-30), note: "Initial scoping completed. Measured garden area and identified suitable zones for activity equipment.", updatedBy: "staff_darren" },
      { date: d(-14), note: "Basketball hoop ordered from supplier. Expected delivery within 2 weeks.", updatedBy: "staff_darren" },
      { date: d(-5), note: "Three quotes received for garden furniture. Awaiting budget sign-off from RI.", updatedBy: "staff_darren" },
    ],
  },
  {
    id: "hip_2",
    title: "Improve night-time supervision recording",
    source: "ofsted",
    priority: "high",
    status: "completed",
    owner: "staff_ryan",
    targetDate: d(-30),
    completedDate: d(-10),
    progress: 100,
    budget: null,
    notes: "New digital night check system implemented, training completed for all staff.",
    updates: [
      { date: d(-60), note: "Ofsted inspector recommended formalising night-time supervision records as part of Good rating action plan.", updatedBy: "staff_darren" },
      { date: d(-45), note: "Digital night check template designed and tested on tablet devices.", updatedBy: "staff_ryan" },
      { date: d(-20), note: "All staff completed training on new digital night check system.", updatedBy: "staff_ryan" },
      { date: d(-10), note: "System fully embedded. All night checks now recorded digitally with timestamps and welfare observations.", updatedBy: "staff_ryan" },
    ],
  },
  {
    id: "hip_3",
    title: "Strengthen exploitation awareness training",
    source: "self",
    priority: "high",
    status: "in_progress",
    owner: "staff_chervelle",
    targetDate: d(60),
    completedDate: null,
    progress: 60,
    budget: null,
    notes: "External trainer booked, 4 of 7 staff completed module 1.",
    updates: [
      { date: d(-40), note: "RM identified need for enhanced exploitation awareness training following local MACE panel briefing.", updatedBy: "staff_darren" },
      { date: d(-25), note: "External trainer from Derby Safeguarding Partnership booked for two sessions.", updatedBy: "staff_chervelle" },
      { date: d(-10), note: "Module 1 delivered. 4 of 7 staff attended. Remaining 3 booked for next session.", updatedBy: "staff_chervelle" },
    ],
  },
  {
    id: "hip_4",
    title: "Kitchen refurbishment",
    source: "maintenance",
    priority: "medium",
    status: "planned",
    owner: "staff_darren",
    targetDate: d(180),
    completedDate: null,
    progress: 0,
    budget: 8500,
    notes: "Quotes obtained, LA approval pending.",
    updates: [
      { date: d(-35), note: "Maintenance inspection flagged kitchen units and worktops as worn. Recommended refurbishment within 6 months.", updatedBy: "staff_darren" },
      { date: d(-20), note: "Three contractor quotes obtained. Mid-range option selected at £8,500.", updatedBy: "staff_darren" },
      { date: d(-7), note: "Budget proposal submitted to responsible individual for LA capital approval.", updatedBy: "staff_darren" },
    ],
  },
  {
    id: "hip_5",
    title: "Develop parent engagement strategy",
    source: "reg45",
    priority: "medium",
    status: "in_progress",
    owner: "staff_anna",
    targetDate: d(120),
    completedDate: null,
    progress: 30,
    budget: null,
    notes: "Parent partnership log now in use, quarterly newsletters planned.",
    updates: [
      { date: d(-50), note: "Reg 45 visitor recommended developing a structured parent engagement strategy.", updatedBy: "staff_darren" },
      { date: d(-30), note: "Parent partnership log created and introduced to team. Initial entries recorded for all placed children.", updatedBy: "staff_anna" },
      { date: d(-12), note: "First quarterly newsletter draft prepared. Content includes home updates, activities schedule, and key contact information.", updatedBy: "staff_anna" },
    ],
  },
  {
    id: "hip_6",
    title: "Review and update Statement of Purpose",
    source: "regulatory",
    priority: "high",
    status: "overdue",
    owner: "staff_darren",
    targetDate: d(-14),
    completedDate: null,
    progress: 0,
    budget: null,
    notes: "Last updated 14 months ago, must reflect recent staffing changes and new admission criteria.",
    updates: [
      { date: d(-60), note: "Annual review due date identified. Statement of Purpose last updated 14 months ago.", updatedBy: "staff_darren" },
      { date: d(-30), note: "Reminder set. Must reflect new deputy manager appointment and updated admission criteria.", updatedBy: "staff_darren" },
      { date: d(-7), note: "Still outstanding. RM to prioritise this week. Draft sections on staffing structure and admissions need rewriting.", updatedBy: "staff_darren" },
    ],
  },
];

/* ── component ───────────────────────────────────────────────────────── */
export default function HomeImprovementPlanPage() {
  const [entries] = useState<ImprovementObjective[]>(SEED);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterSource, setFilterSource] = useState("all");
  const [sortBy, setSortBy] = useState<"priority" | "status" | "target">("priority");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  /* ── filtering & sorting ────────────────────────────────────────── */
  const filtered = useMemo(() => {
    let list = [...entries];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.notes.toLowerCase().includes(q) ||
          getStaffName(e.owner).toLowerCase().includes(q)
      );
    }
    if (filterStatus !== "all") list = list.filter((e) => e.status === filterStatus);
    if (filterPriority !== "all") list = list.filter((e) => e.priority === filterPriority);
    if (filterSource !== "all") list = list.filter((e) => e.source === filterSource);

    list.sort((a, b) => {
      switch (sortBy) {
        case "priority":
          return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] || STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
        case "status":
          return STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
        case "target":
          return a.targetDate.localeCompare(b.targetDate);
        default:
          return 0;
      }
    });
    return list;
  }, [entries, search, filterStatus, filterPriority, filterSource, sortBy]);

  /* ── stats ──────────────────────────────────────────────────────── */
  const total = entries.length;
  const completedCount = entries.filter((e) => e.status === "completed").length;
  const inProgressCount = entries.filter((e) => e.status === "in_progress").length;
  const overdueCount = entries.filter((e) => e.status === "overdue").length;

  /* ── export columns ─────────────────────────────────────────────── */
  const exportCols: ExportColumn<ImprovementObjective>[] = [
    { header: "ID", accessor: (r: ImprovementObjective) => r.id },
    { header: "Title", accessor: (r: ImprovementObjective) => r.title },
    { header: "Source", accessor: (r: ImprovementObjective) => SOURCE_LABELS[r.source] },
    { header: "Priority", accessor: (r: ImprovementObjective) => r.priority },
    { header: "Status", accessor: (r: ImprovementObjective) => STATUS_LABELS[r.status] },
    { header: "Owner", accessor: (r: ImprovementObjective) => getStaffName(r.owner) },
    { header: "Target Date", accessor: (r: ImprovementObjective) => r.targetDate },
    { header: "Completed Date", accessor: (r: ImprovementObjective) => r.completedDate ?? "" },
    { header: "Progress (%)", accessor: (r: ImprovementObjective) => r.progress },
    { header: "Budget", accessor: (r: ImprovementObjective) => r.budget ? `£${r.budget.toLocaleString()}` : "" },
    { header: "Notes", accessor: (r: ImprovementObjective) => r.notes },
    { header: "Updates", accessor: (r: ImprovementObjective) => r.updates.map((u) => `${u.date}: ${u.note}`).join("; ") },
  ];

  return (
    <PageShell
      title="Home Improvement Plan"
      subtitle="Post-inspection actions, quality objectives, Reg 45 recommendations, and development goals"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Home Improvement Plan" />
          <ExportButton data={filtered} columns={exportCols} filename="home-improvement-plan" />
          <Button>
            <Plus className="h-4 w-4 mr-2" /> Add Objective
          </Button>
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        {/* ── overdue alert ─────────────────────────────────────────── */}
        {overdueCount > 0 && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 flex items-center gap-3">
            <div className="rounded-full bg-red-100 p-1.5">
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-800">
                {overdueCount} objective{overdueCount !== 1 ? "s" : ""} overdue
              </p>
              <p className="text-xs text-red-600 mt-0.5">
                Overdue objectives require immediate attention. Review and update target dates or escalate as needed.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-100"
              onClick={() => setFilterStatus("overdue")}
            >
              View overdue
            </Button>
          </div>
        )}

        {/* ── stat strip ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Objectives", value: total, icon: Target, colour: "text-indigo-600" },
            { label: "Completed", value: completedCount, icon: CheckCircle2, colour: "text-emerald-600" },
            { label: "In Progress", value: inProgressCount, icon: TrendingUp, colour: "text-amber-600" },
            { label: "Overdue", value: overdueCount, icon: AlertTriangle, colour: overdueCount > 0 ? "text-red-600" : "text-emerald-600" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border bg-white p-4 flex items-center gap-3">
              <s.icon className={cn("h-5 w-5", s.colour)} />
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-lg font-bold">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── filters & sort ─────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 items-end">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              placeholder="Search objectives, notes, owners..."
              className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="all">All Statuses</option>
              <option value="planned">Planned</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <option value="all">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <option value="all">All Sources</option>
            <option value="reg44">Reg 44</option>
            <option value="ofsted">Ofsted</option>
            <option value="reg45">Reg 45</option>
            <option value="self">Self-identified</option>
            <option value="maintenance">Maintenance</option>
            <option value="regulatory">Regulatory</option>
          </select>
          <div className="flex items-center gap-1">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "priority" | "status" | "target")}
              className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="priority">Priority</option>
              <option value="status">Status</option>
              <option value="target">Target Date</option>
            </select>
          </div>
        </div>

        {/* ── objective cards ─────────────────────────────────────── */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Target className="h-10 w-10 mx-auto mb-3 text-slate-300" />
              No objectives match your filters.
            </div>
          )}
          {filtered.map((obj) => {
            const isExpanded = expandedId === obj.id;
            return (
              <div
                key={obj.id}
                className={cn(
                  "rounded-xl border border-l-4 bg-white overflow-hidden",
                  STATUS_CARD_BORDER[obj.status]
                )}
              >
                {/* collapsed header */}
                <button
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : obj.id)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Target className={cn(
                      "h-5 w-5 shrink-0",
                      obj.status === "completed" ? "text-emerald-600"
                        : obj.status === "overdue" ? "text-red-600"
                        : obj.status === "in_progress" ? "text-amber-600"
                        : "text-blue-600"
                    )} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium">{obj.title}</p>
                        <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 border", STATUS_COLOUR[obj.status])}>
                          {STATUS_LABELS[obj.status]}
                        </Badge>
                        <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 border", PRIORITY_COLOUR[obj.priority])}>
                          {obj.priority.charAt(0).toUpperCase() + obj.priority.slice(1)}
                        </Badge>
                        <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 border", SOURCE_COLOUR[obj.source])}>
                          {SOURCE_LABELS[obj.source]}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Owner: {getStaffName(obj.owner)} · Target: {obj.targetDate}
                        {obj.completedDate ? ` · Completed: ${obj.completedDate}` : ""}
                        {obj.budget ? ` · Budget: £${obj.budget.toLocaleString()}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {/* progress indicator */}
                    {obj.status !== "planned" && obj.status !== "completed" && (
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              obj.status === "overdue" ? "bg-red-400" : "bg-amber-400"
                            )}
                            style={{ width: `${obj.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-500 tabular-nums">{obj.progress}%</span>
                      </div>
                    )}
                    {obj.status === "completed" && (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    )}
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>

                {/* expanded detail */}
                {isExpanded && (
                  <div className="border-t bg-slate-50 p-4 space-y-4">
                    {/* notes */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <FileText className="h-4 w-4 text-slate-500" />
                          Notes
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-slate-700">{obj.notes}</p>
                      </CardContent>
                    </Card>

                    {/* progress bar (full width in detail) */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-indigo-500" />
                          Progress
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2.5 rounded-full bg-slate-200 overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all",
                                obj.progress === 100 ? "bg-emerald-500"
                                  : obj.status === "overdue" ? "bg-red-500"
                                  : obj.progress >= 50 ? "bg-amber-500"
                                  : "bg-blue-500"
                              )}
                              style={{ width: `${obj.progress}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold text-slate-700 tabular-nums w-12 text-right">{obj.progress}%</span>
                        </div>
                      </CardContent>
                    </Card>

                    {/* updates timeline */}
                    {obj.updates.length > 0 && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Clock className="h-4 w-4 text-teal-500" />
                            Update History
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {obj.updates.map((update, i) => (
                              <div key={i} className="flex gap-3">
                                <div className="flex flex-col items-center">
                                  <div className={cn(
                                    "h-2.5 w-2.5 rounded-full shrink-0 mt-1.5",
                                    i === obj.updates.length - 1 ? "bg-indigo-500" : "bg-slate-300"
                                  )} />
                                  {i < obj.updates.length - 1 && (
                                    <div className="w-px flex-1 bg-slate-200 mt-1" />
                                  )}
                                </div>
                                <div className="pb-3">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs font-medium text-slate-500">{update.date}</span>
                                    <span className="text-xs text-slate-400">by {getStaffName(update.updatedBy)}</span>
                                  </div>
                                  <p className="text-sm text-slate-700 mt-0.5">{update.note}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* metadata grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Owner:</span>{" "}
                        <span className="font-medium">{getStaffName(obj.owner)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Source:</span>{" "}
                        <span className="font-medium">{SOURCE_LABELS[obj.source]}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Target Date:</span>{" "}
                        <span className="font-medium">{obj.targetDate}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Completed:</span>{" "}
                        <span className={cn("font-medium", obj.completedDate ? "text-emerald-600" : "text-slate-500")}>
                          {obj.completedDate ?? "Pending"}
                        </span>
                      </div>
                      {obj.budget && (
                        <div>
                          <span className="text-muted-foreground">Budget:</span>{" "}
                          <span className="font-medium">{`£${obj.budget.toLocaleString()}`}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── regulatory note ──────────────────────────────────────── */}
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-900">
          <strong>Regulatory Basis:</strong> The Children&apos;s Homes (England) Regulations 2015 require
          the registered person to maintain a culture of continuous improvement. Regulation 45 quality of
          care reviews must evaluate the home&apos;s development plan and track progress against identified
          objectives. Regulation 44 independent visitor recommendations, Ofsted inspection actions, and
          self-identified development goals should all be recorded, monitored, and evidenced as part of
          the home&apos;s ongoing improvement journey. The registered manager must be able to demonstrate
          that identified areas for improvement are acted upon within reasonable timescales.
        </div>
      </div>
    </PageShell>
  );
}

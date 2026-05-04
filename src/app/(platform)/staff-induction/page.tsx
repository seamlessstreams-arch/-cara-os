"use client";

import { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  UserCheck,
  Plus,
  ArrowUpDown,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Circle,
} from "lucide-react";
import { PageShell }    from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton }  from "@/components/ui/print-button";
import { cn }           from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

/* ── types ─────────────────────────────────────────────────────────────── */

type TaskStatus = "not_started" | "in_progress" | "completed" | "overdue";
type InductionPhase = "pre_start" | "week_1" | "month_1" | "month_3" | "month_6" | "ongoing";

interface InductionTask {
  id: string;
  task: string;
  phase: InductionPhase;
  status: TaskStatus;
  completedDate: string | null;
  completedBy: string | null;
  dueDate: string;
  evidence: string;
  notes: string;
}

interface InductionRecord {
  id: string;
  staffId: string;
  staffName: string;
  role: string;
  startDate: string;
  inductionLead: string;
  overallStatus: "in_progress" | "completed" | "overdue";
  tasks: InductionTask[];
}

/* ── seed ──────────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const PHASE_LABELS: Record<InductionPhase, string> = {
  pre_start: "Pre-Start", week_1: "Week 1", month_1: "Month 1",
  month_3: "Month 3", month_6: "Month 6", ongoing: "Ongoing",
};

const SEED: InductionRecord[] = [
  {
    id: "ind1", staffId: "staff_mirela", staffName: "Mirela Popescu", role: "Residential Care Worker",
    startDate: d(-21), inductionLead: "staff_darren", overallStatus: "in_progress",
    tasks: [
      { id: "t1", task: "DBS clearance confirmed", phase: "pre_start", status: "completed", completedDate: d(-30), completedBy: "staff_darren", dueDate: d(-28), evidence: "DBS cert on file — Ref: DBS-2025-44821", notes: "Enhanced DBS with barred list — clear." },
      { id: "t2", task: "References verified (2 minimum)", phase: "pre_start", status: "completed", completedDate: d(-28), completedBy: "staff_darren", dueDate: d(-25), evidence: "Two professional references received and verified", notes: "Previous employer and university tutor." },
      { id: "t3", task: "Right to work documentation", phase: "pre_start", status: "completed", completedDate: d(-30), completedBy: "staff_darren", dueDate: d(-28), evidence: "Settled status share code verified", notes: "" },
      { id: "t4", task: "Health declaration completed", phase: "pre_start", status: "completed", completedDate: d(-25), completedBy: "staff_darren", dueDate: d(-22), evidence: "Occupational health form returned — fit to work", notes: "" },
      { id: "t5", task: "Contract and policies signed", phase: "pre_start", status: "completed", completedDate: d(-22), completedBy: "staff_darren", dueDate: d(-21), evidence: "Signed contract and policy acknowledgments on file", notes: "All 12 key policies signed." },
      { id: "t6", task: "Building tour and H&S orientation", phase: "week_1", status: "completed", completedDate: d(-21), completedBy: "staff_ryan", dueDate: d(-18), evidence: "Tour checklist signed", notes: "Fire exits, first aid, medication room, secure areas all covered." },
      { id: "t7", task: "Introduction to young people", phase: "week_1", status: "completed", completedDate: d(-20), completedBy: "staff_anna", dueDate: d(-18), evidence: "Introductions completed with all 3 YP", notes: "Gradual introductions over 2 days. All YP comfortable." },
      { id: "t8", task: "Safeguarding Level 1 training", phase: "week_1", status: "completed", completedDate: d(-19), completedBy: "staff_darren", dueDate: d(-14), evidence: "Certificate — online course completed", notes: "Score 92%. Good understanding demonstrated." },
      { id: "t9", task: "Fire safety and evacuation drill", phase: "week_1", status: "completed", completedDate: d(-18), completedBy: "staff_ryan", dueDate: d(-14), evidence: "Drill participation recorded", notes: "Participated in live drill on third day." },
      { id: "t10", task: "Medication administration training", phase: "week_1", status: "completed", completedDate: d(-17), completedBy: "staff_anna", dueDate: d(-14), evidence: "Observed 3 medication rounds before sign-off", notes: "Competent — signed off by senior." },
      { id: "t11", task: "Read all care plans and risk assessments", phase: "month_1", status: "in_progress", completedDate: null, completedBy: null, dueDate: d(7), evidence: "", notes: "Alex and Casey plans read. Jordan's plan outstanding." },
      { id: "t12", task: "Shadow 3 shifts (day, evening, waking night)", phase: "month_1", status: "in_progress", completedDate: null, completedBy: null, dueDate: d(7), evidence: "Day and evening shadowed. Waking night scheduled.", notes: "" },
      { id: "t13", task: "Lone working competency assessment", phase: "month_1", status: "not_started", completedDate: null, completedBy: null, dueDate: d(7), evidence: "", notes: "Cannot complete until all 3 shadow shifts done." },
      { id: "t14", task: "PRICE physical intervention training", phase: "month_1", status: "not_started", completedDate: null, completedBy: null, dueDate: d(14), evidence: "", notes: "Course booked for next week — 2-day course." },
      { id: "t15", task: "Complete Children's Home regulations awareness module", phase: "month_3", status: "not_started", completedDate: null, completedBy: null, dueDate: d(70), evidence: "", notes: "" },
      { id: "t16", task: "First supervision session", phase: "month_1", status: "not_started", completedDate: null, completedBy: null, dueDate: d(7), evidence: "", notes: "Scheduled with RM." },
      { id: "t17", task: "Probation review (3 months)", phase: "month_3", status: "not_started", completedDate: null, completedBy: null, dueDate: d(70), evidence: "", notes: "" },
      { id: "t18", task: "Probation review (6 months)", phase: "month_6", status: "not_started", completedDate: null, completedBy: null, dueDate: d(160), evidence: "", notes: "" },
    ],
  },
  {
    id: "ind2", staffId: "staff_lackson", staffName: "Lackson Banda", role: "Residential Care Worker",
    startDate: d(-180), inductionLead: "staff_darren", overallStatus: "completed",
    tasks: [
      { id: "t19", task: "DBS clearance confirmed", phase: "pre_start", status: "completed", completedDate: d(-195), completedBy: "staff_darren", dueDate: d(-190), evidence: "DBS cert on file", notes: "Clear." },
      { id: "t20", task: "References verified", phase: "pre_start", status: "completed", completedDate: d(-193), completedBy: "staff_darren", dueDate: d(-188), evidence: "Two references verified", notes: "" },
      { id: "t21", task: "Safeguarding Level 1 training", phase: "week_1", status: "completed", completedDate: d(-175), completedBy: "staff_darren", dueDate: d(-173), evidence: "Certificate on file", notes: "Score 96%." },
      { id: "t22", task: "PRICE physical intervention training", phase: "month_1", status: "completed", completedDate: d(-160), completedBy: "staff_darren", dueDate: d(-150), evidence: "Certificate on file", notes: "Passed — competent." },
      { id: "t23", task: "Probation review (6 months)", phase: "month_6", status: "completed", completedDate: d(-5), completedBy: "staff_darren", dueDate: d(-2), evidence: "Review document on file", notes: "Passed probation. Permanent contract confirmed. Excellent progress." },
    ],
  },
];

/* ── constants ─────────────────────────────────────────────────────────── */

const STATUS_META: Record<TaskStatus, { label: string; colour: string; icon: typeof CheckCircle2 }> = {
  not_started: { label: "Not Started",  colour: "bg-gray-100 text-gray-700", icon: Circle },
  in_progress: { label: "In Progress",  colour: "bg-blue-100 text-blue-700", icon: Clock },
  completed:   { label: "Completed",    colour: "bg-green-100 text-green-700", icon: CheckCircle2 },
  overdue:     { label: "Overdue",      colour: "bg-red-100 text-red-700", icon: AlertTriangle },
};

/* ── component ─────────────────────────────────────────────────────────── */

export default function StaffInductionPage() {
  const [data] = useState<InductionRecord[]>(SEED);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [showDialog, setShowDialog] = useState(false);

  const stats = useMemo(() => {
    const allTasks = data.flatMap((r) => r.tasks);
    return {
      totalInductions: data.length,
      active: data.filter((r) => r.overallStatus === "in_progress").length,
      completed: data.filter((r) => r.overallStatus === "completed").length,
      totalTasks: allTasks.length,
      completedTasks: allTasks.filter((t) => t.status === "completed").length,
      overdueTasks: allTasks.filter((t) => t.status === "overdue" || (t.status !== "completed" && t.dueDate < d(0))).length,
    };
  }, [data]);

  const filtered = useMemo(() => {
    let list = [...data];
    if (filterStatus !== "all") list = list.filter((r) => r.overallStatus === filterStatus);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((r) => r.staffName.toLowerCase().includes(q) || r.role.toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "name":   return a.staffName.localeCompare(b.staffName);
        case "status": return a.overallStatus.localeCompare(b.overallStatus);
        default:       return b.startDate.localeCompare(a.startDate);
      }
    });
    return list;
  }, [data, filterStatus, search, sortBy]);

  const exportData = useMemo(() => data.flatMap((r) => r.tasks.map((t) => ({
    staffName: r.staffName,
    role: r.role,
    startDate: r.startDate,
    inductionLead: getStaffName(r.inductionLead),
    task: t.task,
    phase: PHASE_LABELS[t.phase],
    status: STATUS_META[t.status].label,
    dueDate: t.dueDate,
    completedDate: t.completedDate || "",
    completedBy: t.completedBy ? getStaffName(t.completedBy) : "",
    evidence: t.evidence,
    notes: t.notes,
  }))), [data]);

  const exportCols: ExportColumn<typeof exportData[number]>[] = [
    { header: "Staff Name",     accessor: (r: typeof exportData[number]) => r.staffName },
    { header: "Role",           accessor: (r: typeof exportData[number]) => r.role },
    { header: "Start Date",     accessor: (r: typeof exportData[number]) => r.startDate },
    { header: "Induction Lead", accessor: (r: typeof exportData[number]) => r.inductionLead },
    { header: "Task",           accessor: (r: typeof exportData[number]) => r.task },
    { header: "Phase",          accessor: (r: typeof exportData[number]) => r.phase },
    { header: "Status",         accessor: (r: typeof exportData[number]) => r.status },
    { header: "Due Date",       accessor: (r: typeof exportData[number]) => r.dueDate },
    { header: "Completed",      accessor: (r: typeof exportData[number]) => r.completedDate },
    { header: "Completed By",   accessor: (r: typeof exportData[number]) => r.completedBy },
    { header: "Evidence",       accessor: (r: typeof exportData[number]) => r.evidence },
    { header: "Notes",          accessor: (r: typeof exportData[number]) => r.notes },
  ];

  return (
    <PageShell
      title="Staff Induction Tracker"
      subtitle="Reg 33 — structured induction programme tracking and compliance"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={exportData} columns={exportCols} filename="staff-induction" />
          <PrintButton title="Staff Induction Tracker" />
          <button onClick={() => setShowDialog(true)} className="inline-flex items-center gap-1 rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand/90">
            <Plus className="h-4 w-4" /> New Induction
          </button>
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {[
            { l: "Inductions",     v: stats.totalInductions, icon: UserCheck, c: "text-blue-600" },
            { l: "Active",         v: stats.active, icon: Clock, c: "text-amber-600" },
            { l: "Completed",      v: stats.completed, icon: CheckCircle2, c: "text-green-600" },
            { l: "Total Tasks",    v: stats.totalTasks, icon: Circle, c: "text-gray-600" },
            { l: "Tasks Done",     v: stats.completedTasks, icon: CheckCircle2, c: "text-green-600" },
            { l: "Overdue",        v: stats.overdueTasks, icon: AlertTriangle, c: stats.overdueTasks > 0 ? "text-red-600" : "text-gray-400" },
          ].map((s) => (
            <div key={s.l} className="rounded-lg border bg-white p-3 text-center">
              <s.icon className={cn("mx-auto h-5 w-5 mb-1", s.c)} />
              <p className="text-2xl font-bold">{s.v}</p>
              <p className="text-xs text-muted-foreground">{s.l}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search staff…" className="w-full rounded-md border pl-8 pr-3 py-2 text-sm" />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1 text-sm">
            <ArrowUpDown className="h-4 w-4" />
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="rounded border px-2 py-1.5 text-sm">
              <option value="date">Start Date</option>
              <option value="name">Name</option>
              <option value="status">Status</option>
            </select>
          </div>
        </div>

        {filtered.map((rec) => {
          const total = rec.tasks.length;
          const done = rec.tasks.filter((t) => t.status === "completed").length;
          const pct = Math.round((done / total) * 100);
          return (
            <div key={rec.id} className="rounded-lg border bg-white overflow-hidden">
              <button onClick={() => setExpanded(expanded === rec.id ? null : rec.id)} className="w-full flex items-center justify-between p-4 hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <UserCheck className="h-5 w-5 text-brand" />
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{rec.staffName}</h3>
                      <span className="text-xs text-muted-foreground">{rec.role}</span>
                      <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium",
                        rec.overallStatus === "completed" ? "bg-green-100 text-green-700" :
                        rec.overallStatus === "overdue" ? "bg-red-100 text-red-700" :
                        "bg-blue-100 text-blue-700"
                      )}>{rec.overallStatus === "in_progress" ? "In Progress" : rec.overallStatus.charAt(0).toUpperCase() + rec.overallStatus.slice(1)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Started {rec.startDate} · {done}/{total} tasks ({pct}%) · Lead: {getStaffName(rec.inductionLead)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-2 rounded-full bg-gray-100 overflow-hidden hidden sm:block">
                    <div className="h-full bg-green-400 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  {expanded === rec.id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </div>
              </button>

              {expanded === rec.id && (
                <div className="border-t p-4 space-y-4">
                  {(["pre_start", "week_1", "month_1", "month_3", "month_6", "ongoing"] as InductionPhase[]).map((phase) => {
                    const phaseTasks = rec.tasks.filter((t) => t.phase === phase);
                    if (!phaseTasks.length) return null;
                    return (
                      <div key={phase}>
                        <h4 className="text-sm font-semibold mb-2">{PHASE_LABELS[phase]}</h4>
                        <div className="space-y-2">
                          {phaseTasks.map((t) => {
                            const meta = STATUS_META[t.status];
                            const Icon = meta.icon;
                            const isOverdue = t.status !== "completed" && t.dueDate < d(0);
                            return (
                              <div key={t.id} className={cn("rounded border p-3", isOverdue ? "border-red-200 bg-red-50" : "")}>
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-start gap-2">
                                    <Icon className={cn("h-4 w-4 mt-0.5 flex-shrink-0", isOverdue ? "text-red-600" : t.status === "completed" ? "text-green-600" : "text-gray-400")} />
                                    <div>
                                      <p className="text-sm font-medium">{t.task}</p>
                                      {t.evidence && <p className="text-xs text-muted-foreground mt-0.5">{t.evidence}</p>}
                                      {t.notes && <p className="text-xs text-muted-foreground mt-0.5 italic">{t.notes}</p>}
                                    </div>
                                  </div>
                                  <div className="text-right flex-shrink-0">
                                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", isOverdue ? STATUS_META.overdue.colour : meta.colour)}>{isOverdue ? "Overdue" : meta.label}</span>
                                    <p className="text-xs text-muted-foreground mt-0.5">Due: {t.dueDate}</p>
                                    {t.completedDate && <p className="text-xs text-green-600">Done: {t.completedDate}</p>}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        <div className="rounded-lg border-l-4 border-blue-400 bg-blue-50 p-4 text-sm text-blue-900">
          <strong>Reg 33 — Employment of Staff</strong> — The registered person must ensure staff receive induction training, including an understanding of the home&apos;s statement of purpose, the children in the home, safeguarding procedures, and behaviour management. The induction must be completed within a reasonable timeframe and evidenced.
        </div>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>New Staff Induction</DialogTitle></DialogHeader>
          <div className="grid gap-3 py-2">
            <input placeholder="Staff member name" className="rounded border px-3 py-2 text-sm" />
            <input placeholder="Role" className="rounded border px-3 py-2 text-sm" />
            <input type="date" className="rounded border px-3 py-2 text-sm" />
            <select className="rounded border px-3 py-2 text-sm">
              <option value="">Induction lead…</option>
              <option value="staff_darren">{getStaffName("staff_darren")}</option>
              <option value="staff_ryan">{getStaffName("staff_ryan")}</option>
            </select>
          </div>
          <DialogFooter>
            <button onClick={() => setShowDialog(false)} className="rounded-md border px-4 py-2 text-sm">Cancel</button>
            <button onClick={() => setShowDialog(false)} className="rounded-md bg-brand px-4 py-2 text-sm text-white hover:bg-brand/90">Create Induction</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

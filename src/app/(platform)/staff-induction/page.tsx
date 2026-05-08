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
  Loader2,
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
import { useStaffInductionRecords } from "@/hooks/use-staff-induction-records";
import type { StaffInductionRecord, StaffInductionPhase, StaffInductionTaskStatus } from "@/types/extended";
import {
  STAFF_INDUCTION_PHASE_LABEL,
  STAFF_INDUCTION_TASK_STATUS_LABEL,
} from "@/types/extended";

/* ── local config (icons not serializable) ────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const STATUS_META: Record<StaffInductionTaskStatus, { colour: string; icon: typeof CheckCircle2 }> = {
  not_started: { colour: "bg-gray-100 text-gray-700", icon: Circle },
  in_progress: { colour: "bg-blue-100 text-blue-700", icon: Clock },
  completed:   { colour: "bg-green-100 text-green-700", icon: CheckCircle2 },
  overdue:     { colour: "bg-red-100 text-red-700", icon: AlertTriangle },
};

/* ── component ─────────────────────────────────────────────────────────── */

export default function StaffInductionPage() {
  const { data: records = [], isLoading } = useStaffInductionRecords();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [showDialog, setShowDialog] = useState(false);

  const stats = useMemo(() => {
    const allTasks = records.flatMap((r) => r.tasks);
    return {
      totalInductions: records.length,
      active: records.filter((r) => r.overall_status === "in_progress").length,
      completed: records.filter((r) => r.overall_status === "completed").length,
      totalTasks: allTasks.length,
      completedTasks: allTasks.filter((t) => t.status === "completed").length,
      overdueTasks: allTasks.filter((t) => t.status === "overdue" || (t.status !== "completed" && t.due_date < d(0))).length,
    };
  }, [records]);

  const filtered = useMemo(() => {
    let list = [...records];
    if (filterStatus !== "all") list = list.filter((r) => r.overall_status === filterStatus);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((r) => r.staff_name.toLowerCase().includes(q) || r.role.toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "name":   return a.staff_name.localeCompare(b.staff_name);
        case "status": return a.overall_status.localeCompare(b.overall_status);
        default:       return b.start_date.localeCompare(a.start_date);
      }
    });
    return list;
  }, [records, filterStatus, search, sortBy]);

  const exportData = useMemo(() => records.flatMap((r) => r.tasks.map((t) => ({
    staffName: r.staff_name,
    role: r.role,
    startDate: r.start_date,
    inductionLead: getStaffName(r.induction_lead),
    task: t.task,
    phase: STAFF_INDUCTION_PHASE_LABEL[t.phase],
    status: STAFF_INDUCTION_TASK_STATUS_LABEL[t.status],
    dueDate: t.due_date,
    completedDate: t.completed_date || "",
    completedBy: t.completed_by ? getStaffName(t.completed_by) : "",
    evidence: t.evidence,
    notes: t.notes,
  }))), [records]);

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

  if (isLoading) {
    return (
      <PageShell title="Staff Induction Tracker" subtitle="Reg 33 — structured induction programme tracking and compliance">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

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
          const pct = total > 0 ? Math.round((done / total) * 100) : 0;
          return (
            <div key={rec.id} className="rounded-lg border bg-white overflow-hidden">
              <button onClick={() => setExpanded(expanded === rec.id ? null : rec.id)} className="w-full flex items-center justify-between p-4 hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <UserCheck className="h-5 w-5 text-brand" />
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{rec.staff_name}</h3>
                      <span className="text-xs text-muted-foreground">{rec.role}</span>
                      <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium",
                        rec.overall_status === "completed" ? "bg-green-100 text-green-700" :
                        rec.overall_status === "overdue" ? "bg-red-100 text-red-700" :
                        "bg-blue-100 text-blue-700"
                      )}>{rec.overall_status === "in_progress" ? "In Progress" : rec.overall_status.charAt(0).toUpperCase() + rec.overall_status.slice(1)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Started {rec.start_date} · {done}/{total} tasks ({pct}%) · Lead: {getStaffName(rec.induction_lead)}</p>
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
                  {(["pre_start", "week_1", "month_1", "month_3", "month_6", "ongoing"] as StaffInductionPhase[]).map((phase) => {
                    const phaseTasks = rec.tasks.filter((t) => t.phase === phase);
                    if (!phaseTasks.length) return null;
                    return (
                      <div key={phase}>
                        <h4 className="text-sm font-semibold mb-2">{STAFF_INDUCTION_PHASE_LABEL[phase]}</h4>
                        <div className="space-y-2">
                          {phaseTasks.map((t) => {
                            const meta = STATUS_META[t.status];
                            const Icon = meta.icon;
                            const isOverdue = t.status !== "completed" && t.due_date < d(0);
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
                                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", isOverdue ? STATUS_META.overdue.colour : meta.colour)}>{isOverdue ? "Overdue" : STAFF_INDUCTION_TASK_STATUS_LABEL[t.status]}</span>
                                    <p className="text-xs text-muted-foreground mt-0.5">Due: {t.due_date}</p>
                                    {t.completed_date && <p className="text-xs text-green-600">Done: {t.completed_date}</p>}
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

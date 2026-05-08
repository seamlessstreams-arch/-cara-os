"use client";

import { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  LogOut,
  Loader2,
  Plus,
  ArrowUpDown,
  Search,
  AlertTriangle,
  CheckCircle2,
  Clock,
  CalendarDays,
} from "lucide-react";
import { PageShell }    from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton }  from "@/components/ui/print-button";
import { cn }           from "@/lib/utils";
import { getYPName, getStaffName } from "@/lib/seed-data";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import type {
  DischargeRecord,
  DischargePlanStatus,
} from "@/types/extended";
import {
  DISCHARGE_REASON_LABEL,
  DISCHARGE_PLAN_STATUS_LABEL,
} from "@/types/extended";
import { useDischargeRecords, useCreateDischargeRecord } from "@/hooks/use-discharge-records";
import { toast } from "sonner";

/* ── local helpers ─────────────────────────────────────────────────────── */

const today = () => new Date().toISOString().slice(0, 10);

const STATUS_COLOURS: Record<DischargePlanStatus, string> = {
  not_started: "bg-gray-100 text-gray-700",
  in_progress: "bg-blue-100 text-blue-800",
  on_track: "bg-green-100 text-green-800",
  at_risk: "bg-red-100 text-red-800",
  completed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-gray-100 text-gray-500",
};

/* ── flat row for export ─────────────────────────────────────────────── */

interface FlatRow {
  youngPerson: string; reason: string; status: string; plannedDate: string;
  actualDate: string; destination: string; socialWorker: string; keyWorker: string;
  checklistProgress: string; actionsProgress: string; riskAssessment: string;
  belongingsReturned: string; exitInterview: string; notes: string;
}

const EXPORT_COLS: ExportColumn<FlatRow>[] = [
  { header: "Young Person",       accessor: (r: FlatRow) => r.youngPerson },
  { header: "Reason",             accessor: (r: FlatRow) => r.reason },
  { header: "Status",             accessor: (r: FlatRow) => r.status },
  { header: "Planned Date",       accessor: (r: FlatRow) => r.plannedDate },
  { header: "Actual Date",        accessor: (r: FlatRow) => r.actualDate },
  { header: "Destination",        accessor: (r: FlatRow) => r.destination },
  { header: "Social Worker",      accessor: (r: FlatRow) => r.socialWorker },
  { header: "Key Worker",         accessor: (r: FlatRow) => r.keyWorker },
  { header: "Checklist Progress", accessor: (r: FlatRow) => r.checklistProgress },
  { header: "Actions Progress",   accessor: (r: FlatRow) => r.actionsProgress },
  { header: "Risk Assessment",    accessor: (r: FlatRow) => r.riskAssessment },
  { header: "Belongings Returned",accessor: (r: FlatRow) => r.belongingsReturned },
  { header: "Exit Interview",     accessor: (r: FlatRow) => r.exitInterview },
  { header: "Notes",              accessor: (r: FlatRow) => r.notes },
];

/* ── component ────────────────────────────────────────────────────────── */

export default function DischargePage() {
  const { data: raw, isLoading } = useDischargeRecords();
  const records = raw?.data ?? [];
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [dialogOpen, setDialogOpen] = useState(false);

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  /* ── stats ────────────────────────────────────────────────────────── */
  const stats = useMemo(() => {
    const active = records.filter((r) => !["completed", "cancelled"].includes(r.status)).length;
    const completed = records.filter((r) => r.status === "completed").length;
    const atRisk = records.filter((r) => r.status === "at_risk").length;
    const overdueActions = records.reduce((s, r) => s + r.transition_actions.filter((a) => a.status === "overdue" || (a.status !== "completed" && a.due_date < today())).length, 0);
    return { active, completed, atRisk, overdueActions };
  }, [records]);

  /* ── filtered / sorted ────────────────────────────────────────────── */
  const filtered = useMemo(() => {
    let list = records;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((r) =>
        getYPName(r.child_id).toLowerCase().includes(q) ||
        r.destination.toLowerCase().includes(q)
      );
    }
    if (filterStatus !== "all") list = list.filter((r) => r.status === filterStatus);
    const out = [...list];
    switch (sortBy) {
      case "date":   out.sort((a, b) => a.planned_date.localeCompare(b.planned_date)); break;
      case "name":   out.sort((a, b) => getYPName(a.child_id).localeCompare(getYPName(b.child_id))); break;
      case "status": out.sort((a, b) => a.status.localeCompare(b.status)); break;
    }
    return out;
  }, [records, search, filterStatus, sortBy]);

  /* ── export data ──────────────────────────────────────────────────── */
  const exportData = useMemo<FlatRow[]>(() =>
    records.map((r) => {
      const done = r.checklist.filter((c) => c.completed).length;
      const actionsDone = r.transition_actions.filter((a) => a.status === "completed").length;
      return {
        youngPerson: getYPName(r.child_id),
        reason: DISCHARGE_REASON_LABEL[r.reason],
        status: DISCHARGE_PLAN_STATUS_LABEL[r.status],
        plannedDate: r.planned_date,
        actualDate: r.actual_date ?? "—",
        destination: r.destination,
        socialWorker: r.social_worker,
        keyWorker: getStaffName(r.key_worker),
        checklistProgress: `${done}/${r.checklist.length}`,
        actionsProgress: `${actionsDone}/${r.transition_actions.length}`,
        riskAssessment: r.risk_assessment_completed ? "Complete" : "Pending",
        belongingsReturned: r.belongings_returned ? "Yes" : "No",
        exitInterview: r.exit_interview.completed ? "Complete" : "Pending",
        notes: r.notes,
      };
    }), [records]);

  return (
    <PageShell
      title="Discharge & Moving On"
      subtitle="Transition planning, discharge checklists and aftercare provision"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Discharge & Moving On" />
          <ExportButton data={exportData} columns={EXPORT_COLS} filename="discharge-planning" />
          <button onClick={() => setDialogOpen(true)} className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">
            <Plus className="h-4 w-4" /> New Discharge Plan
          </button>
        </div>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
      <>
      {/* ── stat strip ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Active Plans", value: stats.active, icon: Clock, colour: "text-blue-600" },
          { label: "Completed", value: stats.completed, icon: CheckCircle2, colour: "text-green-600" },
          { label: "At Risk", value: stats.atRisk, icon: AlertTriangle, colour: stats.atRisk > 0 ? "text-red-600" : "text-gray-400" },
          { label: "Overdue Actions", value: stats.overdueActions, icon: CalendarDays, colour: stats.overdueActions > 0 ? "text-amber-600" : "text-gray-400" },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border bg-white p-4 flex items-center gap-3">
            <s.icon className={cn("h-6 w-6", s.colour)} />
            <div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── per-child summary ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {records.map((r) => {
          const done = r.checklist.filter((c) => c.completed).length;
          const pct = r.checklist.length ? Math.round((done / r.checklist.length) * 100) : 0;
          return (
            <div key={r.id} className="rounded-lg border bg-white p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{getYPName(r.child_id)}</h3>
                <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", STATUS_COLOURS[r.status])}>{DISCHARGE_PLAN_STATUS_LABEL[r.status]}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">{DISCHARGE_REASON_LABEL[r.reason]} · {r.status === "completed" ? `Left ${r.actual_date}` : `Planned ${r.planned_date}`}</p>
              <p className="text-xs text-gray-600 mt-1 truncate">{r.destination}</p>
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-500">Checklist</span>
                  <span className="font-medium">{done}/{r.checklist.length} ({pct}%)</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className={cn("h-2 rounded-full", pct === 100 ? "bg-green-500" : pct >= 50 ? "bg-blue-500" : "bg-amber-500")} style={{ width: `${pct}%` }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── filters ────────────────────────────────────────────────── */}
      <div id="discharge-list" className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search children or destinations…" className="w-full rounded-md border py-2 pl-9 pr-3 text-sm" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px] h-9 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(DISCHARGE_PLAN_STATUS_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <ArrowUpDown className="h-4 w-4" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[130px] h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="status">Status</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── cards ──────────────────────────────────────────────────── */}
      <div className="space-y-4 mb-8">
        {filtered.map((r) => {
          const open = expanded[r.id] ?? false;
          const done = r.checklist.filter((c) => c.completed).length;
          const pct = r.checklist.length ? Math.round((done / r.checklist.length) * 100) : 0;
          const categories = [...new Set(r.checklist.map((c) => c.category))];
          return (
            <div key={r.id} className="rounded-lg border bg-white">
              <button onClick={() => toggle(r.id)} className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <LogOut className="h-4 w-4 text-gray-400" />
                    <h3 className="font-semibold">{getYPName(r.child_id)}</h3>
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", STATUS_COLOURS[r.status])}>{DISCHARGE_PLAN_STATUS_LABEL[r.status]}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{DISCHARGE_REASON_LABEL[r.reason]} → {r.destination} · Checklist {pct}%</p>
                </div>
                {open ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
              </button>

              {open && (
                <div className="border-t px-4 pb-4 space-y-4">
                  {/* key details */}
                  <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div><span className="text-gray-500">Planned:</span> <span className="font-medium">{r.planned_date}</span></div>
                    <div><span className="text-gray-500">Actual:</span> <span className="font-medium">{r.actual_date ?? "—"}</span></div>
                    <div><span className="text-gray-500">SW:</span> <span className="font-medium">{r.social_worker}</span></div>
                    <div><span className="text-gray-500">Key Worker:</span> <span className="font-medium">{getStaffName(r.key_worker)}</span></div>
                    <div className="col-span-2"><span className="text-gray-500">Destination:</span> <span className="font-medium">{r.destination}</span></div>
                    {r.receiving_provider && <div className="col-span-2"><span className="text-gray-500">Provider:</span> <span className="font-medium">{r.receiving_provider}</span></div>}
                  </div>

                  {/* quick status */}
                  <div className="flex flex-wrap gap-2">
                    <span className={cn("px-2 py-1 rounded text-xs font-medium", r.risk_assessment_completed ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800")}>{r.risk_assessment_completed ? "✓ Risk Assessment" : "✗ Risk Assessment"}</span>
                    <span className={cn("px-2 py-1 rounded text-xs font-medium", r.belongings_returned ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600")}>{r.belongings_returned ? "✓ Belongings Returned" : "○ Belongings Pending"}</span>
                    <span className={cn("px-2 py-1 rounded text-xs font-medium", r.exit_interview.completed ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600")}>{r.exit_interview.completed ? "✓ Exit Interview" : "○ Exit Interview"}</span>
                  </div>

                  {/* checklist by category */}
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 mb-2">Discharge Checklist — {done}/{r.checklist.length} complete</h4>
                    <div className="w-full bg-gray-100 rounded-full h-2 mb-3">
                      <div className={cn("h-2 rounded-full", pct === 100 ? "bg-green-500" : pct >= 50 ? "bg-blue-500" : "bg-amber-500")} style={{ width: `${pct}%` }} />
                    </div>
                    {categories.map((cat) => (
                      <div key={cat} className="mb-2">
                        <p className="text-xs font-medium text-gray-600 mb-1">{cat}</p>
                        {r.checklist.filter((c) => c.category === cat).map((c) => (
                          <div key={c.id} className="flex items-start gap-2 ml-2 mb-1">
                            {c.completed ? <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" /> : <div className="h-4 w-4 rounded-full border-2 border-gray-300 mt-0.5 shrink-0" />}
                            <div>
                              <p className={cn("text-sm", c.completed ? "text-gray-500 line-through" : "")}>{c.task}</p>
                              {c.completed && c.completed_date && <p className="text-xs text-gray-400">{c.completed_date}{c.completed_by ? ` — ${getStaffName(c.completed_by)}` : ""}</p>}
                              {c.notes && <p className="text-xs text-gray-500 italic">{c.notes}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>

                  {/* transition actions */}
                  {r.transition_actions.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 mb-2">Transition Actions</h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="text-left text-xs text-gray-500 border-b">
                              <th className="py-2 pr-3">Action</th>
                              <th className="py-2 pr-3">Owner</th>
                              <th className="py-2 pr-3">Due</th>
                              <th className="py-2 pr-3">Status</th>
                              <th className="py-2">Notes</th>
                            </tr>
                          </thead>
                          <tbody>
                            {r.transition_actions.map((a) => {
                              const overdue = a.status !== "completed" && a.due_date < today();
                              return (
                                <tr key={a.id} className="border-b last:border-0">
                                  <td className="py-2 pr-3">{a.action}</td>
                                  <td className="py-2 pr-3">{getStaffName(a.owner)}</td>
                                  <td className={cn("py-2 pr-3", overdue ? "text-red-600 font-medium" : "")}>{a.due_date}</td>
                                  <td className="py-2 pr-3">
                                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium",
                                      a.status === "completed" ? "bg-green-100 text-green-800" :
                                      overdue ? "bg-red-100 text-red-800" :
                                      a.status === "in_progress" ? "bg-blue-100 text-blue-800" :
                                      "bg-gray-100 text-gray-700"
                                    )}>{overdue ? "Overdue" : a.status.replace("_", " ").replace(/\b\w/g, (ch) => ch.toUpperCase())}</span>
                                  </td>
                                  <td className="py-2 text-xs text-gray-500">{a.notes}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* aftercare */}
                  {r.aftercare_provision.length > 0 && (
                    <div className="rounded-md bg-gray-50 p-3">
                      <h4 className="text-xs font-semibold text-gray-500 mb-1">Aftercare Provision</h4>
                      <ul className="list-disc list-inside text-sm text-gray-700 space-y-0.5">
                        {r.aftercare_provision.map((a, i) => <li key={i}>{a}</li>)}
                      </ul>
                    </div>
                  )}

                  {/* stay in touch */}
                  {r.stay_in_touch_plan && (
                    <div className="rounded-md bg-gray-50 p-3">
                      <h4 className="text-xs font-semibold text-gray-500 mb-1">Stay in Touch Plan</h4>
                      <p className="text-sm">{r.stay_in_touch_plan}</p>
                    </div>
                  )}

                  {/* child's view */}
                  {r.child_views && (
                    <div className="rounded-md bg-pink-50 border border-pink-200 p-3">
                      <h4 className="text-xs font-semibold text-pink-700 mb-1">Child&apos;s Views on Moving</h4>
                      <p className="text-sm text-pink-800">{r.child_views}</p>
                    </div>
                  )}

                  {/* exit interview */}
                  {r.exit_interview.completed && r.exit_interview.child_views && (
                    <div className="rounded-md bg-pink-50 border border-pink-200 p-3">
                      <h4 className="text-xs font-semibold text-pink-700 mb-1">Exit Interview — {r.exit_interview.date} ({r.exit_interview.conducted_by ? getStaffName(r.exit_interview.conducted_by) : ""})</h4>
                      <p className="text-sm text-pink-800">{r.exit_interview.child_views}</p>
                    </div>
                  )}

                  {/* professional views */}
                  {r.professional_views && (
                    <div className="rounded-md bg-blue-50 border border-blue-200 p-3">
                      <h4 className="text-xs font-semibold text-blue-700 mb-1">Professional Views</h4>
                      <p className="text-sm text-blue-800">{r.professional_views}</p>
                    </div>
                  )}

                  {/* notes */}
                  {r.notes && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 mb-1">Notes</h4>
                      <p className="text-sm text-gray-700">{r.notes}</p>
                    </div>
                  )}

                  {/* smart links */}
                  <SmartLinkPanel sourceType="discharge" sourceId={r.id} childId={r.child_id} compact />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── regulatory note ────────────────────────────────────────── */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 mb-6">
        <strong>Discharge Planning:</strong> All children leaving care must have a planned transition with a comprehensive discharge checklist. Emergency moves require immediate risk assessment and disruption meeting within 2 weeks. Belongings must be inventoried with an independent witness. Exit interviews capture the child&apos;s voice. Aftercare provision must be documented and shared with receiving placement.
      </div>

      {/* ── dialog ─────────────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>New Discharge Plan</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-sm font-medium">Young Person</label>
              <Select><SelectTrigger className="mt-1"><SelectValue placeholder="Select child" /></SelectTrigger>
                <SelectContent>{["yp_alex","yp_jordan","yp_casey"].map((id) => <SelectItem key={id} value={id}>{getYPName(id)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Reason</label>
                <Select><SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{Object.entries(DISCHARGE_REASON_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Planned Date</label>
                <input type="date" className="mt-1 w-full rounded-md border px-3 py-2 text-sm" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Destination</label>
              <input className="mt-1 w-full rounded-md border px-3 py-2 text-sm" placeholder="e.g. Supported Lodgings – 14 Maple Avenue" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Social Worker</label>
                <input className="mt-1 w-full rounded-md border px-3 py-2 text-sm" placeholder="Name" />
              </div>
              <div>
                <label className="text-sm font-medium">SW Contact</label>
                <input className="mt-1 w-full rounded-md border px-3 py-2 text-sm" placeholder="Email" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Notes</label>
              <textarea rows={2} className="mt-1 w-full rounded-md border px-3 py-2 text-sm" placeholder="Additional context…" />
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setDialogOpen(false)} className="rounded-md border px-3 py-1.5 text-sm">Cancel</button>
            <button onClick={() => setDialogOpen(false)} className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700">Create Plan</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </>
      )}
    </PageShell>
  );
}

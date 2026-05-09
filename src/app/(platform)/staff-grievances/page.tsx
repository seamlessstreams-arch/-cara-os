"use client";

import { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  FileWarning,
  Plus,
  ArrowUpDown,
  Search,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Shield,
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
import { useStaffGrievanceRecords } from "@/hooks/use-staff-grievance-records";
import type { StaffGrievanceRecord } from "@/types/extended";
import {
  STAFF_GRIEVANCE_CATEGORY_LABEL,
  STAFF_GRIEVANCE_STATUS_LABEL,
  STAFF_GRIEVANCE_SEVERITY_LABEL,
} from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

/* ── local colour maps ────────────────────────────────────────────────── */

const STATUS_COLOURS: Record<string, string> = {
  informal_raised: "bg-blue-100 text-blue-800",
  formal_submitted: "bg-amber-100 text-amber-800",
  under_investigation: "bg-purple-100 text-purple-800",
  hearing_scheduled: "bg-orange-100 text-orange-800",
  resolved: "bg-green-100 text-green-800",
  appealed: "bg-red-100 text-red-800",
  withdrawn: "bg-gray-100 text-gray-700",
};

const SEV_COLOURS: Record<string, string> = {
  low: "bg-green-100 text-green-800", medium: "bg-amber-100 text-amber-800",
  high: "bg-orange-100 text-orange-800", critical: "bg-red-100 text-red-800",
};

/* ── flat row for export ──────────────────────────────────────────────── */

interface FlatRow {
  raisedBy: string; raisedDate: string; category: string; severity: string;
  status: string; subject: string; againstWhom: string; investigator: string;
  hearingDate: string; outcome: string; confidentiality: string; notes: string;
}

const EXPORT_COLS: ExportColumn<FlatRow>[] = [
  { header: "Raised By",       accessor: (r: FlatRow) => r.raisedBy },
  { header: "Date Raised",     accessor: (r: FlatRow) => r.raisedDate },
  { header: "Category",        accessor: (r: FlatRow) => r.category },
  { header: "Severity",        accessor: (r: FlatRow) => r.severity },
  { header: "Status",          accessor: (r: FlatRow) => r.status },
  { header: "Subject",         accessor: (r: FlatRow) => r.subject },
  { header: "Against",         accessor: (r: FlatRow) => r.againstWhom },
  { header: "Investigator",    accessor: (r: FlatRow) => r.investigator },
  { header: "Hearing Date",    accessor: (r: FlatRow) => r.hearingDate },
  { header: "Outcome",         accessor: (r: FlatRow) => r.outcome },
  { header: "Confidentiality", accessor: (r: FlatRow) => r.confidentiality },
  { header: "Notes",           accessor: (r: FlatRow) => r.notes },
];

/* ── component ────────────────────────────────────────────────────────── */

export default function StaffGrievancesPage() {
  const { data: records = [], isLoading } = useStaffGrievanceRecords();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [dialogOpen, setDialogOpen] = useState(false);

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  /* ── stats ────────────────────────────────────────────────────────── */
  const stats = useMemo(() => {
    const open = records.filter((r) => !["resolved", "withdrawn"].includes(r.status)).length;
    const resolved = records.filter((r) => r.status === "resolved").length;
    const highSeverity = records.filter((r) => ["high", "critical"].includes(r.severity) && !["resolved", "withdrawn"].includes(r.status)).length;
    const avgResolution = (() => {
      const res = records.filter((r) => r.status === "resolved");
      if (!res.length) return 0;
      const days = res.map((r) => {
        const start = new Date(r.raised_date).getTime();
        const end = new Date(r.timeline[r.timeline.length - 1].date).getTime();
        return Math.round((end - start) / 86400000);
      });
      return Math.round(days.reduce((a, b) => a + b, 0) / days.length);
    })();
    return { open, resolved, highSeverity, avgResolution };
  }, [records]);

  /* ── filtered / sorted ────────────────────────────────────────────── */
  const filtered = useMemo(() => {
    let list: StaffGrievanceRecord[] = records;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((r) =>
        getStaffName(r.raised_by).toLowerCase().includes(q) ||
        r.subject.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q)
      );
    }
    if (filterStatus !== "all") list = list.filter((r) => r.status === filterStatus);
    const out = [...list];
    switch (sortBy) {
      case "date":     out.sort((a, b) => b.raised_date.localeCompare(a.raised_date)); break;
      case "severity": out.sort((a, b) => { const o: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }; return o[a.severity] - o[b.severity]; }); break;
      case "status":   out.sort((a, b) => a.status.localeCompare(b.status)); break;
    }
    return out;
  }, [records, search, filterStatus, sortBy]);

  /* ── export ───────────────────────────────────────────────────────── */
  const exportData = useMemo<FlatRow[]>(() =>
    records.map((r) => ({
      raisedBy: getStaffName(r.raised_by),
      raisedDate: r.raised_date,
      category: STAFF_GRIEVANCE_CATEGORY_LABEL[r.category],
      severity: STAFF_GRIEVANCE_SEVERITY_LABEL[r.severity],
      status: STAFF_GRIEVANCE_STATUS_LABEL[r.status],
      subject: r.subject,
      againstWhom: r.against_whom ? getStaffName(r.against_whom) : "N/A",
      investigator: r.investigator ? getStaffName(r.investigator) : "Pending",
      hearingDate: r.hearing_date ?? "—",
      outcome: r.outcome || "Pending",
      confidentiality: r.confidentiality_level,
      notes: r.notes,
    })), [records]);

  if (isLoading) {
    return (
      <PageShell title="Staff Grievances" subtitle="Confidential grievance procedure — informal resolution through to formal hearing and appeal">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Staff Grievances"
      subtitle="Confidential grievance procedure — informal resolution through to formal hearing and appeal"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Staff Grievances" />
          <ExportButton data={exportData} columns={EXPORT_COLS} filename="staff-grievances" />
          <button onClick={() => setDialogOpen(true)} className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">
            <Plus className="h-4 w-4" /> Log Grievance
          </button>
        </div>
      }
    >
      {/* ── stat strip ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Open Grievances", value: stats.open, icon: FileWarning, colour: "text-blue-600" },
          { label: "Resolved", value: stats.resolved, icon: CheckCircle2, colour: "text-green-600" },
          { label: "High/Critical Open", value: stats.highSeverity, icon: AlertTriangle, colour: stats.highSeverity > 0 ? "text-red-600" : "text-gray-400" },
          { label: "Avg Resolution (days)", value: stats.avgResolution, icon: Clock, colour: "text-purple-600" },
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

      {/* ── alert ──────────────────────────────────────────────────── */}
      {stats.highSeverity > 0 && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-300 bg-red-50 p-4">
          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
          <div>
            <p className="font-semibold text-red-800">High Severity Grievance(s) Open</p>
            <p className="text-sm text-red-700">{stats.highSeverity} grievance(s) rated high or critical require priority attention. Ensure investigation timescales are being met.</p>
          </div>
        </div>
      )}

      {/* ── filters ────────────────────────────────────────────────── */}
      <div id="grievance-list" className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search staff or subject…" className="w-full rounded-md border py-2 pl-9 pr-3 text-sm" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px] h-9 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(STAFF_GRIEVANCE_STATUS_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <ArrowUpDown className="h-4 w-4" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[130px] h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Most Recent</SelectItem>
              <SelectItem value="severity">Severity</SelectItem>
              <SelectItem value="status">Status</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── cards ──────────────────────────────────────────────────── */}
      <div className="space-y-4 mb-8">
        {filtered.map((r) => {
          const open = expanded[r.id] ?? false;
          return (
            <div key={r.id} className="rounded-lg border bg-white">
              <button onClick={() => toggle(r.id)} className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <FileWarning className="h-4 w-4 text-gray-400" />
                    <h3 className="font-semibold">{r.subject}</h3>
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", STATUS_COLOURS[r.status])}>{STAFF_GRIEVANCE_STATUS_LABEL[r.status]}</span>
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", SEV_COLOURS[r.severity])}>{STAFF_GRIEVANCE_SEVERITY_LABEL[r.severity]}</span>
                    {r.confidentiality_level !== "standard" && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-800 text-white flex items-center gap-1"><Shield className="h-3 w-3" />{r.confidentiality_level.replace("_", " ")}</span>}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Raised by {getStaffName(r.raised_by)} · {r.raised_date} · {STAFF_GRIEVANCE_CATEGORY_LABEL[r.category]}</p>
                </div>
                {open ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
              </button>

              {open && (
                <div className="border-t px-4 pb-4 space-y-4">
                  {/* description */}
                  <div className="mt-3">
                    <h4 className="text-xs font-semibold text-gray-500 mb-1">Description</h4>
                    <p className="text-sm">{r.description}</p>
                  </div>

                  {/* key details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    {r.against_whom && <div><span className="text-gray-500">Against:</span> <span className="font-medium">{getStaffName(r.against_whom)}</span></div>}
                    <div><span className="text-gray-500">Investigator:</span> <span className="font-medium">{r.investigator ? getStaffName(r.investigator) : "Pending"}</span></div>
                    {r.hearing_date && <div><span className="text-gray-500">Hearing:</span> <span className="font-medium">{r.hearing_date}</span></div>}
                    {r.trade_union_rep && <div><span className="text-gray-500">TU Rep:</span> <span className="font-medium">{r.trade_union_rep}</span></div>}
                  </div>

                  {/* informal resolution */}
                  {r.informal_resolution_attempted && (
                    <div className="rounded-md bg-gray-50 p-3">
                      <h4 className="text-xs font-semibold text-gray-500 mb-1">Informal Resolution</h4>
                      <p className="text-sm">{r.informal_outcome}</p>
                    </div>
                  )}

                  {/* timeline */}
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 mb-2">Timeline</h4>
                    <div className="space-y-2 ml-3 border-l-2 border-gray-200 pl-4">
                      {r.timeline.map((t, i) => (
                        <div key={i} className="relative">
                          <div className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-blue-500" />
                          <p className="text-sm font-medium">{t.action}</p>
                          <p className="text-xs text-gray-500">{t.date} — {getStaffName(t.by)}</p>
                          {t.notes && <p className="text-xs text-gray-600 italic">{t.notes}</p>}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* outcome */}
                  {r.outcome && (
                    <div className="rounded-md bg-green-50 border border-green-200 p-3">
                      <h4 className="text-xs font-semibold text-green-700 mb-1">Outcome</h4>
                      <p className="text-sm text-green-800">{r.outcome}</p>
                    </div>
                  )}

                  {/* support offered */}
                  {r.support_offered.length > 0 && (
                    <div className="rounded-md bg-blue-50 border border-blue-200 p-3">
                      <h4 className="text-xs font-semibold text-blue-700 mb-1">Support Offered</h4>
                      <ul className="list-disc list-inside text-sm text-blue-800 space-y-0.5">
                        {r.support_offered.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                  )}

                  {/* lessons learned */}
                  {r.lessons_learned && (
                    <div className="rounded-md bg-purple-50 border border-purple-200 p-3">
                      <h4 className="text-xs font-semibold text-purple-700 mb-1">Lessons Learned</h4>
                      <p className="text-sm text-purple-800">{r.lessons_learned}</p>
                    </div>
                  )}

                  {/* notes */}
                  {r.notes && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 mb-1">Notes</h4>
                      <p className="text-sm text-gray-700">{r.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── regulatory note ────────────────────────────────────────── */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 mb-6">
        <strong>Grievance Procedure:</strong> All staff have the right to raise grievances without fear of reprisal. Informal resolution should be attempted first where appropriate. Formal grievances must be acknowledged within 5 working days and investigated promptly. Staff may be accompanied by a trade union representative or colleague at hearings. Confidentiality must be maintained throughout. All outcomes should be documented and lessons learned fed into practice improvement.
      </div>

      {/* ── dialog ─────────────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Log Grievance</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-sm font-medium">Raised By</label>
              <Select><SelectTrigger className="mt-1"><SelectValue placeholder="Select staff member" /></SelectTrigger>
                <SelectContent>{["staff_darren","staff_ryan","staff_edward","staff_anna","staff_chervelle","staff_diane","staff_lackson","staff_mirela"].map((id) => <SelectItem key={id} value={id}>{getStaffName(id)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Subject</label>
              <input className="mt-1 w-full rounded-md border px-3 py-2 text-sm" placeholder="Brief description of grievance" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Category</label>
                <Select><SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{Object.entries(STAFF_GRIEVANCE_CATEGORY_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Severity</label>
                <Select><SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{Object.entries(STAFF_GRIEVANCE_SEVERITY_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <textarea rows={3} className="mt-1 w-full rounded-md border px-3 py-2 text-sm" placeholder="Full details of the grievance…" />
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setDialogOpen(false)} className="rounded-md border px-3 py-1.5 text-sm">Cancel</button>
            <button onClick={() => setDialogOpen(false)} className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700">Submit Grievance</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}

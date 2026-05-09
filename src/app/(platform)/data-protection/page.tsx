"use client";

import { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  Lock,
  Plus,
  ArrowUpDown,
  Search,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
} from "lucide-react";
import { PageShell }    from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton }  from "@/components/ui/print-button";
import { cn }           from "@/lib/utils";
import { getStaffName, STAFF } from "@/lib/seed-data";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

import type {
  DataProtectionRecord,
  DataProtectionRecordType,
  DataProtectionRecordStatus,
  DataProtectionBreachSeverity,
} from "@/types/extended";
import {
  DATA_PROTECTION_RECORD_TYPE_LABEL,
  DATA_PROTECTION_RECORD_STATUS_LABEL,
  DATA_PROTECTION_BREACH_SEVERITY_LABEL,
} from "@/types/extended";
import { useDataProtectionRecords, useCreateDataProtectionRecord } from "@/hooks/use-data-protection-records";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

/* ── types ─────────────────────────────────────────────────────────────── */

interface RetentionCategory {
  category: string;
  retentionPeriod: string;
  legalBasis: string;
  lastReviewed: string;
  nextReview: string;
}

/* ── static data ──────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const STATUS_COLOURS: Record<DataProtectionRecordStatus, string> = {
  received: "bg-blue-100 text-blue-800", in_progress: "bg-amber-100 text-amber-800",
  completed: "bg-green-100 text-green-800", overdue: "bg-red-100 text-red-800",
  closed: "bg-gray-100 text-gray-700",
};
const SEV_COLOURS: Record<DataProtectionBreachSeverity, string> = {
  low: "bg-green-100 text-green-800", medium: "bg-amber-100 text-amber-800",
  high: "bg-orange-100 text-orange-800", critical: "bg-red-100 text-red-800",
};

const RETENTION: RetentionCategory[] = [
  { category: "Children's Care Records", retentionPeriod: "75 years from DOB or 15 years after last entry", legalBasis: "Regulation 35 / LA guidance", lastReviewed: d(-30), nextReview: d(335) },
  { category: "Staff Personnel Files", retentionPeriod: "6 years after employment ends", legalBasis: "Employment law / HMRC requirements", lastReviewed: d(-30), nextReview: d(335) },
  { category: "DBS Certificates", retentionPeriod: "6 months (copy destroyed, record of check retained)", legalBasis: "DBS Code of Practice", lastReviewed: d(-30), nextReview: d(335) },
  { category: "CCTV Footage", retentionPeriod: "31 days (unless incident-related)", legalBasis: "ICO CCTV guidance / GDPR", lastReviewed: d(-30), nextReview: d(335) },
  { category: "Medication Records", retentionPeriod: "25 years from date of birth of child", legalBasis: "NICE / regulatory guidance", lastReviewed: d(-30), nextReview: d(335) },
  { category: "Financial Records", retentionPeriod: "7 years", legalBasis: "HMRC / Companies Act", lastReviewed: d(-30), nextReview: d(335) },
  { category: "Incident Reports", retentionPeriod: "75 years from DOB of child", legalBasis: "Regulation 35 / safeguarding", lastReviewed: d(-30), nextReview: d(335) },
  { category: "Training Records", retentionPeriod: "6 years after employment ends", legalBasis: "Employment law", lastReviewed: d(-30), nextReview: d(335) },
];

/* ── flat row for export ─────────────────────────────────────────────── */

interface FlatRow {
  type: string; status: string; date_raised: string; due_date: string;
  completed_date: string; handled_by: string; subject: string;
  breach_severity: string; ico_notified: string; notes: string;
}

const EXPORT_COLS: ExportColumn<FlatRow>[] = [
  { header: "Type",          accessor: (r: FlatRow) => r.type },
  { header: "Status",        accessor: (r: FlatRow) => r.status },
  { header: "Date Raised",   accessor: (r: FlatRow) => r.date_raised },
  { header: "Due Date",      accessor: (r: FlatRow) => r.due_date },
  { header: "Completed",     accessor: (r: FlatRow) => r.completed_date },
  { header: "Handled By",    accessor: (r: FlatRow) => r.handled_by },
  { header: "Subject",       accessor: (r: FlatRow) => r.subject },
  { header: "Breach Severity",accessor: (r: FlatRow) => r.breach_severity },
  { header: "ICO Notified",  accessor: (r: FlatRow) => r.ico_notified },
  { header: "Notes",         accessor: (r: FlatRow) => r.notes },
];

/* ── component ────────────────────────────────────────────────────────── */

export default function DataProtectionPage() {
  const { data: raw, isLoading } = useDataProtectionRecords();
  const createRecord = useCreateDataProtectionRecord();
  const records = raw?.data ?? [];

  const [retention] = useState<RetentionCategory[]>(RETENTION);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [dialogOpen, setDialogOpen] = useState(false);

  const [dpForm, setDpForm] = useState({
    type: "" as DataProtectionRecordType | "",
    subject: "",
    description: "",
    due_date: "",
  });
  const setDPF = (k: keyof typeof dpForm, v: string) => setDpForm((p) => ({ ...p, [k]: v }));

  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dpForm.type || !dpForm.subject.trim()) {
      toast.error("Type and subject are required.");
      return;
    }
    await createRecord.mutateAsync({
      type: dpForm.type as DataProtectionRecordType,
      status: "received" as const,
      subject: dpForm.subject.trim(),
      description: dpForm.description,
      date_raised: new Date().toISOString().slice(0, 10),
      due_date: dpForm.due_date || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      completed_date: null,
      handled_by: "staff_darren",
      breach_severity: null,
      ico_notified: false,
      ico_notification_date: null,
      individuals_notified: false,
      root_cause: "",
      remedial_actions: [],
      lessons_learned: "",
      notes: "",
      created_at: new Date().toISOString(),
    });
    toast.success("Record created.");
    setDpForm({ type: "", subject: "", description: "", due_date: "" });
    setDialogOpen(false);
  };

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const stats = useMemo(() => {
    const open = records.filter((r) => ["received", "in_progress"].includes(r.status)).length;
    const breaches = records.filter((r) => r.type === "breach").length;
    const dsars = records.filter((r) => r.type === "dsar").length;
    const overdue = records.filter((r) => r.status !== "completed" && r.status !== "closed" && r.due_date < new Date().toISOString().slice(0, 10)).length;
    return { open, breaches, dsars, overdue };
  }, [records]);

  const filtered = useMemo(() => {
    let list = records;
    if (search) { const q = search.toLowerCase(); list = list.filter((r) => r.subject.toLowerCase().includes(q)); }
    if (filterType !== "all") list = list.filter((r) => r.type === filterType);
    const out = [...list];
    switch (sortBy) {
      case "date": out.sort((a, b) => b.date_raised.localeCompare(a.date_raised)); break;
      case "type": out.sort((a, b) => a.type.localeCompare(b.type)); break;
      case "status": out.sort((a, b) => a.status.localeCompare(b.status)); break;
    }
    return out;
  }, [records, search, filterType, sortBy]);

  const exportData = useMemo<FlatRow[]>(() =>
    records.map((r) => ({
      type: DATA_PROTECTION_RECORD_TYPE_LABEL[r.type], status: DATA_PROTECTION_RECORD_STATUS_LABEL[r.status],
      date_raised: r.date_raised, due_date: r.due_date,
      completed_date: r.completed_date ?? "—", handled_by: getStaffName(r.handled_by),
      subject: r.subject, breach_severity: r.breach_severity ? DATA_PROTECTION_BREACH_SEVERITY_LABEL[r.breach_severity] : "N/A",
      ico_notified: r.ico_notified ? "Yes" : "No", notes: r.notes,
    })), [records]);

  if (isLoading) return <PageShell title="Data Protection & GDPR" subtitle="Subject access requests, breach management, impact assessments and retention schedules"><div /></PageShell>;

  return (
    <PageShell
      title="Data Protection & GDPR"
      subtitle="Subject access requests, breach management, impact assessments and retention schedules"
      ariaContext={{ pageTitle: "Related Care Events", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Data Protection Register" />
          <ExportButton data={exportData} columns={EXPORT_COLS} filename="data-protection" />
          <button onClick={() => setDialogOpen(true)} className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">
            <Plus className="h-4 w-4" /> New Record
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Open Requests", value: stats.open, icon: FileText, colour: "text-blue-600" },
          { label: "Breaches Logged", value: stats.breaches, icon: AlertTriangle, colour: stats.breaches > 0 ? "text-amber-600" : "text-gray-400" },
          { label: "Total DSARs", value: stats.dsars, icon: Lock, colour: "text-purple-600" },
          { label: "Overdue", value: stats.overdue, icon: Clock, colour: stats.overdue > 0 ? "text-red-600" : "text-gray-400" },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border bg-white p-4 flex items-center gap-3">
            <s.icon className={cn("h-6 w-6", s.colour)} />
            <div><p className="text-2xl font-bold">{s.value}</p><p className="text-xs text-gray-500">{s.label}</p></div>
          </div>
        ))}
      </div>

      {stats.overdue > 0 && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-300 bg-red-50 p-4">
          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
          <div>
            <p className="font-semibold text-red-800">Overdue Data Protection Request(s)</p>
            <p className="text-sm text-red-700">{stats.overdue} request(s) past their statutory deadline. DSARs must be completed within 30 calendar days. Prioritise immediately.</p>
          </div>
        </div>
      )}

      {/* retention schedule */}
      <div className="rounded-lg border bg-white p-4 mb-6">
        <h3 className="font-semibold mb-3 flex items-center gap-2"><Lock className="h-4 w-4 text-gray-400" /> Data Retention Schedule</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead><tr className="text-left text-xs text-gray-500 border-b">
              <th className="py-2 pr-3">Category</th><th className="py-2 pr-3">Retention Period</th><th className="py-2 pr-3">Legal Basis</th><th className="py-2 pr-3">Last Reviewed</th><th className="py-2">Next Review</th>
            </tr></thead>
            <tbody>
              {retention.map((r) => (
                <tr key={r.category} className="border-b last:border-0">
                  <td className="py-2 pr-3 font-medium">{r.category}</td>
                  <td className="py-2 pr-3">{r.retentionPeriod}</td>
                  <td className="py-2 pr-3 text-xs text-gray-600">{r.legalBasis}</td>
                  <td className="py-2 pr-3">{r.lastReviewed}</td>
                  <td className="py-2">{r.nextReview}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div id="records-list" className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search records…" className="w-full rounded-md border py-2 pl-9 pr-3 text-sm" />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[200px] h-9 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(DATA_PROTECTION_RECORD_TYPE_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <ArrowUpDown className="h-4 w-4" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[130px] h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Most Recent</SelectItem>
              <SelectItem value="type">Type</SelectItem>
              <SelectItem value="status">Status</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4 mb-8">
        {filtered.map((r) => {
          const open = expanded[r.id] ?? false;
          return (
            <div key={r.id} className="rounded-lg border bg-white">
              <button onClick={() => toggle(r.id)} className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Lock className="h-4 w-4 text-gray-400" />
                    <h3 className="font-semibold">{r.subject}</h3>
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", STATUS_COLOURS[r.status])}>{DATA_PROTECTION_RECORD_STATUS_LABEL[r.status]}</span>
                    <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs font-medium text-gray-700">{DATA_PROTECTION_RECORD_TYPE_LABEL[r.type]}</span>
                    {r.breach_severity && <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", SEV_COLOURS[r.breach_severity])}>{DATA_PROTECTION_BREACH_SEVERITY_LABEL[r.breach_severity]}</span>}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Raised {r.date_raised} · Due {r.due_date} · {getStaffName(r.handled_by)}</p>
                </div>
                {open ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
              </button>

              {open && (
                <div className="border-t px-4 pb-4 space-y-4">
                  <p className="mt-3 text-sm">{r.description}</p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div><span className="text-gray-500">Raised:</span> <span className="font-medium">{r.date_raised}</span></div>
                    <div><span className="text-gray-500">Due:</span> <span className={cn("font-medium", !r.completed_date && r.due_date < new Date().toISOString().slice(0, 10) ? "text-red-600" : "")}>{r.due_date}</span></div>
                    <div><span className="text-gray-500">Completed:</span> <span className="font-medium">{r.completed_date ?? "—"}</span></div>
                    <div><span className="text-gray-500">Handler:</span> <span className="font-medium">{getStaffName(r.handled_by)}</span></div>
                  </div>

                  {r.type === "breach" && (
                    <>
                      <div className="rounded-md bg-amber-50 p-3">
                        <h4 className="text-xs font-semibold text-amber-700 mb-1">Root Cause</h4>
                        <p className="text-sm text-amber-800">{r.root_cause}</p>
                      </div>
                      <div className="flex gap-2">
                        <span className={cn("px-2 py-1 rounded text-xs font-medium", r.ico_notified ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800")}>{r.ico_notified ? "ICO Notified" : "ICO Not Required"}</span>
                        <span className={cn("px-2 py-1 rounded text-xs font-medium", r.individuals_notified ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-700")}>{r.individuals_notified ? "Individuals Notified" : "Individuals Not Notified"}</span>
                      </div>
                    </>
                  )}

                  {r.remedial_actions.length > 0 && (
                    <div className="rounded-md bg-blue-50 border border-blue-200 p-3">
                      <h4 className="text-xs font-semibold text-blue-700 mb-1">Remedial Actions</h4>
                      <ul className="list-disc list-inside text-sm text-blue-800 space-y-0.5">
                        {r.remedial_actions.map((a, i) => <li key={i}>{a}</li>)}
                      </ul>
                    </div>
                  )}

                  {r.lessons_learned && (
                    <div className="rounded-md bg-purple-50 border border-purple-200 p-3">
                      <h4 className="text-xs font-semibold text-purple-700 mb-1">Lessons Learned</h4>
                      <p className="text-sm text-purple-800">{r.lessons_learned}</p>
                    </div>
                  )}

                  {r.notes && <div><h4 className="text-xs font-semibold text-gray-500 mb-1">Notes</h4><p className="text-sm text-gray-700">{r.notes}</p></div>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 mb-6">
        <strong>GDPR &amp; Data Protection Act 2018:</strong> Children&apos;s homes process significant volumes of sensitive personal data. Subject Access Requests must be completed within 30 calendar days. Data breaches must be assessed within 72 hours — reportable breaches notified to the ICO. Data Protection Impact Assessments required for new processing activities. Retention schedules must comply with Regulation 35 and sector guidance.
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>New Data Protection Record</DialogTitle></DialogHeader>
          <form onSubmit={handleCreateRecord} className="space-y-3 py-2">
            <div><label className="text-sm font-medium">Type *</label>
              <Select value={dpForm.type} onValueChange={(v) => setDPF("type", v)}><SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{Object.entries(DATA_PROTECTION_RECORD_TYPE_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><label className="text-sm font-medium">Subject *</label><input required className="mt-1 w-full rounded-md border px-3 py-2 text-sm" placeholder="Brief title" value={dpForm.subject} onChange={(e) => setDPF("subject", e.target.value)} /></div>
            <div><label className="text-sm font-medium">Description</label><textarea rows={3} className="mt-1 w-full rounded-md border px-3 py-2 text-sm" placeholder="Full details…" value={dpForm.description} onChange={(e) => setDPF("description", e.target.value)} /></div>
            <div><label className="text-sm font-medium">Due Date</label><input type="date" className="mt-1 w-full rounded-md border px-3 py-2 text-sm" value={dpForm.due_date} onChange={(e) => setDPF("due_date", e.target.value)} /></div>
            <DialogFooter>
              <button type="button" onClick={() => setDialogOpen(false)} className="rounded-md border px-3 py-1.5 text-sm">Cancel</button>
              <button type="submit" disabled={createRecord.isPending} className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50">{createRecord.isPending ? "Saving…" : "Create Record"}</button>
            </DialogFooter>
          </form>
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

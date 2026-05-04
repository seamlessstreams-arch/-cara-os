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

type RecordType = "dsar" | "breach" | "dpia" | "consent_review" | "retention_review";
type RecordStatus = "received" | "in_progress" | "completed" | "overdue" | "closed";
type BreachSeverity = "low" | "medium" | "high" | "critical";

interface DataRecord {
  id: string;
  type: RecordType;
  status: RecordStatus;
  dateRaised: string;
  dueDate: string;
  completedDate: string | null;
  handledBy: string;
  subject: string;
  description: string;
  breachSeverity: BreachSeverity | null;
  icoNotified: boolean;
  icoNotificationDate: string | null;
  individualsNotified: boolean;
  rootCause: string;
  remedialActions: string[];
  lessonsLearned: string;
  notes: string;
}

interface RetentionCategory {
  category: string;
  retentionPeriod: string;
  legalBasis: string;
  lastReviewed: string;
  nextReview: string;
}

/* ── seed ──────────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const TYPE_LABELS: Record<RecordType, string> = {
  dsar: "Subject Access Request", breach: "Data Breach", dpia: "Impact Assessment",
  consent_review: "Consent Review", retention_review: "Retention Review",
};
const STATUS_LABELS: Record<RecordStatus, string> = {
  received: "Received", in_progress: "In Progress", completed: "Completed",
  overdue: "Overdue", closed: "Closed",
};
const STATUS_COLOURS: Record<RecordStatus, string> = {
  received: "bg-blue-100 text-blue-800", in_progress: "bg-amber-100 text-amber-800",
  completed: "bg-green-100 text-green-800", overdue: "bg-red-100 text-red-800",
  closed: "bg-gray-100 text-gray-700",
};
const SEV_LABELS: Record<BreachSeverity, string> = { low: "Low", medium: "Medium", high: "High", critical: "Critical" };
const SEV_COLOURS: Record<BreachSeverity, string> = {
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

const SEED: DataRecord[] = [
  {
    id: "dp1", type: "dsar", status: "completed", dateRaised: d(-45), dueDate: d(-15),
    completedDate: d(-18), handledBy: "staff_darren",
    subject: "Subject Access Request — Former YP (aged 18)",
    description: "Former resident (now 18) has requested access to their care records under GDPR Article 15. Request received via their solicitor. Records span 2 years of placement.",
    breachSeverity: null, icoNotified: false, icoNotificationDate: null, individualsNotified: false,
    rootCause: "", remedialActions: [],
    lessonsLearned: "Process worked well. Template response letter updated. Third-party redaction took longest — consider pre-marking files for potential DSAR content.",
    notes: "Responded within 30-day statutory deadline. 847 pages provided after third-party redaction. Solicitor confirmed satisfaction with response.",
  },
  {
    id: "dp2", type: "breach", status: "closed", dateRaised: d(-60), dueDate: d(-58),
    completedDate: d(-50), handledBy: "staff_darren",
    subject: "Misdirected email containing YP information",
    description: "Staff member sent an email containing a young person's health information to the wrong social worker (same local authority, different team). Error identified within 2 hours. Recipient confirmed deletion.",
    breachSeverity: "low", icoNotified: false, icoNotificationDate: null, individualsNotified: false,
    rootCause: "Auto-complete in email selected wrong recipient with similar name.",
    remedialActions: [
      "Staff briefing on email verification before sending — check recipient name carefully",
      "Implement email delay rule (2-minute send delay) on all staff accounts",
      "Consider using secure portal for sharing sensitive information rather than email",
    ],
    lessonsLearned: "Low-risk breach but highlighted need for email safety measures. Auto-complete is a common cause of misdirected emails. Delay rule now prevents immediate sending.",
    notes: "Not reportable to ICO (low risk, contained quickly). Logged in breach register. Staff member not disciplined — systemic issue addressed.",
  },
  {
    id: "dp3", type: "dsar", status: "in_progress", dateRaised: d(-10), dueDate: d(20),
    completedDate: null, handledBy: "staff_darren",
    subject: "Subject Access Request — Birth parent",
    description: "Birth parent of current YP has requested access to information held about them (the parent) in the child's records. Not requesting the child's records — only information relating to themselves.",
    breachSeverity: null, icoNotified: false, icoNotificationDate: null, individualsNotified: false,
    rootCause: "", remedialActions: [],
    lessonsLearned: "",
    notes: "Complex request. Consulting with LA data protection officer about scope. Need to separate parent-specific information from child's records. Redaction of third-party data required.",
  },
  {
    id: "dp4", type: "dpia", status: "completed", dateRaised: d(-30), dueDate: d(-10),
    completedDate: d(-12), handledBy: "staff_darren",
    subject: "DPIA — New digital care records system (Cornerstone)",
    description: "Data Protection Impact Assessment for the implementation of the new Cornerstone digital care management system. Assessment covers data collection, storage, access controls, retention, and third-party processing.",
    breachSeverity: null, icoNotified: false, icoNotificationDate: null, individualsNotified: false,
    rootCause: "",
    remedialActions: [
      "Role-based access controls implemented",
      "Data encryption at rest and in transit confirmed",
      "Automatic session timeout after 15 minutes",
      "Audit trail for all record access enabled",
      "Annual penetration testing scheduled",
    ],
    lessonsLearned: "DPIA identified need for stronger audit trail than initially planned. Vendor accommodated. Good practice to complete DPIA before system goes live.",
    notes: "DPIA approved by DPO. No high risks identified after mitigations. Annual review scheduled.",
  },
  {
    id: "dp5", type: "consent_review", status: "completed", dateRaised: d(-20), dueDate: d(-5),
    completedDate: d(-7), handledBy: "staff_anna",
    subject: "Annual consent review — photography and social media",
    description: "Annual review of consent for using children's images in internal communications, social media, and promotional materials. Individual consent refreshed with each child and their social worker.",
    breachSeverity: null, icoNotified: false, icoNotificationDate: null, individualsNotified: false,
    rootCause: "", remedialActions: [],
    lessonsLearned: "Consent forms updated to include specific platforms. Children appreciated being asked and having choice.",
    notes: "Alex: consents to internal only. Jordan: no consent for any images. Casey: consents to internal and Oak House website (no face — artwork only). All SWs confirmed.",
  },
];

/* ── flat row for export ─────────────────────────────────────────────── */

interface FlatRow {
  type: string; status: string; dateRaised: string; dueDate: string;
  completedDate: string; handledBy: string; subject: string;
  breachSeverity: string; icoNotified: string; notes: string;
}

const EXPORT_COLS: ExportColumn<FlatRow>[] = [
  { header: "Type",          accessor: (r: FlatRow) => r.type },
  { header: "Status",        accessor: (r: FlatRow) => r.status },
  { header: "Date Raised",   accessor: (r: FlatRow) => r.dateRaised },
  { header: "Due Date",      accessor: (r: FlatRow) => r.dueDate },
  { header: "Completed",     accessor: (r: FlatRow) => r.completedDate },
  { header: "Handled By",    accessor: (r: FlatRow) => r.handledBy },
  { header: "Subject",       accessor: (r: FlatRow) => r.subject },
  { header: "Breach Severity",accessor: (r: FlatRow) => r.breachSeverity },
  { header: "ICO Notified",  accessor: (r: FlatRow) => r.icoNotified },
  { header: "Notes",         accessor: (r: FlatRow) => r.notes },
];

/* ── component ────────────────────────────────────────────────────────── */

export default function DataProtectionPage() {
  const [data] = useState<DataRecord[]>(SEED);
  const [retention] = useState<RetentionCategory[]>(RETENTION);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [dialogOpen, setDialogOpen] = useState(false);

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const stats = useMemo(() => {
    const open = data.filter((r) => ["received", "in_progress"].includes(r.status)).length;
    const breaches = data.filter((r) => r.type === "breach").length;
    const dsars = data.filter((r) => r.type === "dsar").length;
    const overdue = data.filter((r) => r.status !== "completed" && r.status !== "closed" && r.dueDate < d(0)).length;
    return { open, breaches, dsars, overdue };
  }, [data]);

  const filtered = useMemo(() => {
    let list = data;
    if (search) { const q = search.toLowerCase(); list = list.filter((r) => r.subject.toLowerCase().includes(q)); }
    if (filterType !== "all") list = list.filter((r) => r.type === filterType);
    const out = [...list];
    switch (sortBy) {
      case "date": out.sort((a, b) => b.dateRaised.localeCompare(a.dateRaised)); break;
      case "type": out.sort((a, b) => a.type.localeCompare(b.type)); break;
      case "status": out.sort((a, b) => a.status.localeCompare(b.status)); break;
    }
    return out;
  }, [data, search, filterType, sortBy]);

  const exportData = useMemo<FlatRow[]>(() =>
    data.map((r) => ({
      type: TYPE_LABELS[r.type], status: STATUS_LABELS[r.status],
      dateRaised: r.dateRaised, dueDate: r.dueDate,
      completedDate: r.completedDate ?? "—", handledBy: getStaffName(r.handledBy),
      subject: r.subject, breachSeverity: r.breachSeverity ? SEV_LABELS[r.breachSeverity] : "N/A",
      icoNotified: r.icoNotified ? "Yes" : "No", notes: r.notes,
    })), [data]);

  return (
    <PageShell
      title="Data Protection & GDPR"
      subtitle="Subject access requests, breach management, impact assessments and retention schedules"
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
            {Object.entries(TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
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
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", STATUS_COLOURS[r.status])}>{STATUS_LABELS[r.status]}</span>
                    <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs font-medium text-gray-700">{TYPE_LABELS[r.type]}</span>
                    {r.breachSeverity && <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", SEV_COLOURS[r.breachSeverity])}>{SEV_LABELS[r.breachSeverity]}</span>}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Raised {r.dateRaised} · Due {r.dueDate} · {getStaffName(r.handledBy)}</p>
                </div>
                {open ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
              </button>

              {open && (
                <div className="border-t px-4 pb-4 space-y-4">
                  <p className="mt-3 text-sm">{r.description}</p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div><span className="text-gray-500">Raised:</span> <span className="font-medium">{r.dateRaised}</span></div>
                    <div><span className="text-gray-500">Due:</span> <span className={cn("font-medium", !r.completedDate && r.dueDate < d(0) ? "text-red-600" : "")}>{r.dueDate}</span></div>
                    <div><span className="text-gray-500">Completed:</span> <span className="font-medium">{r.completedDate ?? "—"}</span></div>
                    <div><span className="text-gray-500">Handler:</span> <span className="font-medium">{getStaffName(r.handledBy)}</span></div>
                  </div>

                  {r.type === "breach" && (
                    <>
                      <div className="rounded-md bg-amber-50 p-3">
                        <h4 className="text-xs font-semibold text-amber-700 mb-1">Root Cause</h4>
                        <p className="text-sm text-amber-800">{r.rootCause}</p>
                      </div>
                      <div className="flex gap-2">
                        <span className={cn("px-2 py-1 rounded text-xs font-medium", r.icoNotified ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800")}>{r.icoNotified ? "ICO Notified" : "ICO Not Required"}</span>
                        <span className={cn("px-2 py-1 rounded text-xs font-medium", r.individualsNotified ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-700")}>{r.individualsNotified ? "Individuals Notified" : "Individuals Not Notified"}</span>
                      </div>
                    </>
                  )}

                  {r.remedialActions.length > 0 && (
                    <div className="rounded-md bg-blue-50 border border-blue-200 p-3">
                      <h4 className="text-xs font-semibold text-blue-700 mb-1">Remedial Actions</h4>
                      <ul className="list-disc list-inside text-sm text-blue-800 space-y-0.5">
                        {r.remedialActions.map((a, i) => <li key={i}>{a}</li>)}
                      </ul>
                    </div>
                  )}

                  {r.lessonsLearned && (
                    <div className="rounded-md bg-purple-50 border border-purple-200 p-3">
                      <h4 className="text-xs font-semibold text-purple-700 mb-1">Lessons Learned</h4>
                      <p className="text-sm text-purple-800">{r.lessonsLearned}</p>
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
          <div className="space-y-3 py-2">
            <div><label className="text-sm font-medium">Type</label>
              <Select><SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{Object.entries(TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><label className="text-sm font-medium">Subject</label><input className="mt-1 w-full rounded-md border px-3 py-2 text-sm" placeholder="Brief title" /></div>
            <div><label className="text-sm font-medium">Description</label><textarea rows={3} className="mt-1 w-full rounded-md border px-3 py-2 text-sm" placeholder="Full details…" /></div>
            <div><label className="text-sm font-medium">Due Date</label><input type="date" className="mt-1 w-full rounded-md border px-3 py-2 text-sm" /></div>
          </div>
          <DialogFooter>
            <button onClick={() => setDialogOpen(false)} className="rounded-md border px-3 py-1.5 text-sm">Cancel</button>
            <button onClick={() => setDialogOpen(false)} className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700">Create Record</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

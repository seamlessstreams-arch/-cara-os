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

type GrievanceCategory = "working_conditions" | "bullying_harassment" | "pay_benefits" | "workload" | "management" | "discrimination" | "health_safety" | "policy_procedure" | "interpersonal" | "other";
type GrievanceStatus = "informal_raised" | "formal_submitted" | "under_investigation" | "hearing_scheduled" | "resolved" | "appealed" | "withdrawn";
type Severity = "low" | "medium" | "high" | "critical";

interface TimelineEntry {
  date: string;
  action: string;
  by: string;
  notes: string;
}

interface GrievanceRecord {
  id: string;
  raisedBy: string;
  raisedDate: string;
  category: GrievanceCategory;
  severity: Severity;
  status: GrievanceStatus;
  subject: string;
  description: string;
  againstWhom: string | null;
  informalResolutionAttempted: boolean;
  informalOutcome: string;
  formalSubmissionDate: string | null;
  investigator: string | null;
  hearingDate: string | null;
  hearingPanel: string[];
  outcome: string;
  appealLodged: boolean;
  appealDate: string | null;
  appealOutcome: string;
  timeline: TimelineEntry[];
  supportOffered: string[];
  confidentialityLevel: "standard" | "restricted" | "highly_restricted";
  tradeUnionRep: string | null;
  lessonsLearned: string;
  notes: string;
}

/* ── seed ──────────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const CAT_LABELS: Record<GrievanceCategory, string> = {
  working_conditions: "Working Conditions", bullying_harassment: "Bullying & Harassment",
  pay_benefits: "Pay & Benefits", workload: "Workload", management: "Management",
  discrimination: "Discrimination", health_safety: "Health & Safety",
  policy_procedure: "Policy & Procedure", interpersonal: "Interpersonal", other: "Other",
};

const STATUS_LABELS: Record<GrievanceStatus, string> = {
  informal_raised: "Informal Raised", formal_submitted: "Formal Submitted",
  under_investigation: "Under Investigation", hearing_scheduled: "Hearing Scheduled",
  resolved: "Resolved", appealed: "Appealed", withdrawn: "Withdrawn",
};

const STATUS_COLOURS: Record<GrievanceStatus, string> = {
  informal_raised: "bg-blue-100 text-blue-800",
  formal_submitted: "bg-amber-100 text-amber-800",
  under_investigation: "bg-purple-100 text-purple-800",
  hearing_scheduled: "bg-orange-100 text-orange-800",
  resolved: "bg-green-100 text-green-800",
  appealed: "bg-red-100 text-red-800",
  withdrawn: "bg-gray-100 text-gray-700",
};

const SEV_LABELS: Record<Severity, string> = { low: "Low", medium: "Medium", high: "High", critical: "Critical" };
const SEV_COLOURS: Record<Severity, string> = {
  low: "bg-green-100 text-green-800", medium: "bg-amber-100 text-amber-800",
  high: "bg-orange-100 text-orange-800", critical: "bg-red-100 text-red-800",
};

const SEED: GrievanceRecord[] = [
  {
    id: "gr1", raisedBy: "staff_edward", raisedDate: d(-45), category: "workload",
    severity: "medium", status: "resolved", subject: "Excessive consecutive shifts without adequate rest",
    description: "Staff member reports being scheduled for 5 consecutive 12-hour shifts without the required minimum rest period. This has occurred twice in the past month and is affecting wellbeing and performance.",
    againstWhom: null, informalResolutionAttempted: true,
    informalOutcome: "Discussed with deputy manager. Rota was adjusted for the immediate period but the underlying scheduling issue remained.",
    formalSubmissionDate: d(-38), investigator: "staff_darren", hearingDate: d(-25),
    hearingPanel: ["staff_darren"], outcome: "Upheld. Rota system updated to enforce minimum 11-hour rest between shifts. Back-to-back limit set at 4 shifts maximum. Retrospective TOIL of 8 hours awarded.",
    appealLodged: false, appealDate: null, appealOutcome: "",
    timeline: [
      { date: d(-45), action: "Informal grievance raised", by: "staff_edward", notes: "Discussed with staff_ryan during supervision" },
      { date: d(-42), action: "Rota adjusted for current month", by: "staff_ryan", notes: "Short-term fix applied" },
      { date: d(-38), action: "Formal grievance submitted", by: "staff_edward", notes: "Pattern continued; formal route requested" },
      { date: d(-30), action: "Investigation commenced", by: "staff_darren", notes: "Rota records reviewed for past 3 months" },
      { date: d(-25), action: "Grievance hearing held", by: "staff_darren", notes: "Edward attended with union rep" },
      { date: d(-22), action: "Outcome communicated", by: "staff_darren", notes: "Grievance upheld — systemic fix implemented" },
    ],
    supportOffered: ["Access to EAP counselling", "Additional rest day scheduled immediately", "Union representation at hearing"],
    confidentialityLevel: "standard", tradeUnionRep: "UNISON — Mark Fielding",
    lessonsLearned: "Rota system lacked automated compliance checking for rest periods. New validation rules added to prevent scheduling breaches.",
    notes: "Edward expressed satisfaction with the outcome. Monitoring rota compliance for 3 months.",
  },
  {
    id: "gr2", raisedBy: "staff_anna", raisedDate: d(-20), category: "bullying_harassment",
    severity: "high", status: "under_investigation", subject: "Persistent undermining behaviour from colleague",
    description: "Staff member reports a pattern of dismissive and undermining behaviour from a colleague during handovers and team meetings, including interrupting, eye-rolling, and contradicting care decisions in front of young people.",
    againstWhom: "staff_diane", informalResolutionAttempted: true,
    informalOutcome: "Mediation meeting held but behaviour continued. Agreed to escalate to formal process.",
    formalSubmissionDate: d(-14), investigator: "staff_darren", hearingDate: null,
    hearingPanel: [], outcome: "",
    appealLodged: false, appealDate: null, appealOutcome: "",
    timeline: [
      { date: d(-20), action: "Informal concern raised", by: "staff_anna", notes: "Discussed with RM during supervision" },
      { date: d(-18), action: "Mediation meeting arranged", by: "staff_darren", notes: "Both parties agreed to mediation" },
      { date: d(-16), action: "Mediation held", by: "staff_darren", notes: "Partial agreement reached but underlying issues remain" },
      { date: d(-14), action: "Formal grievance submitted", by: "staff_anna", notes: "Continued pattern of behaviour reported" },
      { date: d(-10), action: "Investigation commenced", by: "staff_darren", notes: "Witnesses being interviewed. Handover notes being reviewed." },
    ],
    supportOffered: ["Confidential supervision sessions", "EAP referral offered", "Shift patterns adjusted to minimise overlap during investigation"],
    confidentialityLevel: "restricted", tradeUnionRep: null,
    lessonsLearned: "",
    notes: "Highly sensitive — restricted access. Investigation ongoing. Both staff members receiving support.",
  },
  {
    id: "gr3", raisedBy: "staff_mirela", raisedDate: d(-60), category: "discrimination",
    severity: "high", status: "resolved", subject: "Concerns about language-related discrimination in team",
    description: "Staff member reports experiencing comments about their accent during team meetings and feeling excluded from informal conversations. Believes this is affecting professional development opportunities.",
    againstWhom: null, informalResolutionAttempted: false,
    informalOutcome: "",
    formalSubmissionDate: d(-60), investigator: "staff_darren", hearingDate: d(-40),
    hearingPanel: ["staff_darren"], outcome: "Partially upheld. While no deliberate discrimination found, unconscious bias acknowledged. Team equality and diversity refresher training arranged. Mentoring programme implemented for all staff. Mirela to be actively supported for next development opportunity.",
    appealLodged: false, appealDate: null, appealOutcome: "",
    timeline: [
      { date: d(-60), action: "Formal grievance submitted directly", by: "staff_mirela", notes: "Felt too sensitive for informal route" },
      { date: d(-55), action: "Investigation commenced", by: "staff_darren", notes: "Confidential interviews with team members" },
      { date: d(-45), action: "External HR advisor consulted", by: "staff_darren", notes: "To ensure impartial process" },
      { date: d(-40), action: "Grievance hearing held", by: "staff_darren", notes: "Mirela attended with colleague as support" },
      { date: d(-37), action: "Outcome communicated", by: "staff_darren", notes: "Written outcome provided" },
      { date: d(-30), action: "Equality training scheduled", by: "staff_darren", notes: "All staff — mandatory attendance" },
    ],
    supportOffered: ["Colleague support at hearing", "Ongoing supervision check-ins", "Professional development plan reviewed", "External counselling offered"],
    confidentialityLevel: "highly_restricted", tradeUnionRep: null,
    lessonsLearned: "Highlighted need for regular equality and diversity training refresh. Unconscious bias module added to annual mandatory training. Team culture audit to be conducted annually.",
    notes: "Mirela reports improvement in team dynamics since training. Follow-up review in 3 months.",
  },
  {
    id: "gr4", raisedBy: "staff_lackson", raisedDate: d(-5), category: "health_safety",
    severity: "medium", status: "formal_submitted", subject: "Inadequate lone working safety measures",
    description: "Staff member raises concern that lone working procedures during sleep-in shifts are insufficient. No personal alarm provided, mobile signal is weak in parts of the building, and check-in protocol not consistently followed.",
    againstWhom: null, informalResolutionAttempted: false,
    informalOutcome: "",
    formalSubmissionDate: d(-5), investigator: null, hearingDate: null,
    hearingPanel: [], outcome: "",
    appealLodged: false, appealDate: null, appealOutcome: "",
    timeline: [
      { date: d(-5), action: "Formal grievance submitted", by: "staff_lackson", notes: "Went direct to formal due to safety concern" },
      { date: d(-3), action: "Acknowledgment sent", by: "staff_darren", notes: "5-day acknowledgment target met" },
      { date: d(-2), action: "Immediate safety review initiated", by: "staff_darren", notes: "Personal alarms ordered. WiFi calling enabled on staff phone." },
    ],
    supportOffered: ["Immediate safety measures implemented", "Buddy system for sleep-ins pending full review"],
    confidentialityLevel: "standard", tradeUnionRep: "UNISON — Mark Fielding",
    lessonsLearned: "",
    notes: "Interim safety measures in place while full investigation and review conducted. H&S committee to review lone working policy.",
  },
];

/* ── flat row for export ─────────────────────────────────────────────── */

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
  const [data] = useState<GrievanceRecord[]>(SEED);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [dialogOpen, setDialogOpen] = useState(false);

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  /* ── stats ────────────────────────────────────────────────────────── */
  const stats = useMemo(() => {
    const open = data.filter((r) => !["resolved", "withdrawn"].includes(r.status)).length;
    const resolved = data.filter((r) => r.status === "resolved").length;
    const highSeverity = data.filter((r) => ["high", "critical"].includes(r.severity) && !["resolved", "withdrawn"].includes(r.status)).length;
    const avgResolution = (() => {
      const res = data.filter((r) => r.status === "resolved");
      if (!res.length) return 0;
      const days = res.map((r) => {
        const start = new Date(r.raisedDate).getTime();
        const end = new Date(r.timeline[r.timeline.length - 1].date).getTime();
        return Math.round((end - start) / 86400000);
      });
      return Math.round(days.reduce((a, b) => a + b, 0) / days.length);
    })();
    return { open, resolved, highSeverity, avgResolution };
  }, [data]);

  /* ── filtered / sorted ────────────────────────────────────────────── */
  const filtered = useMemo(() => {
    let list = data;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((r) =>
        getStaffName(r.raisedBy).toLowerCase().includes(q) ||
        r.subject.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q)
      );
    }
    if (filterStatus !== "all") list = list.filter((r) => r.status === filterStatus);
    const out = [...list];
    switch (sortBy) {
      case "date":     out.sort((a, b) => b.raisedDate.localeCompare(a.raisedDate)); break;
      case "severity": out.sort((a, b) => { const o = { critical: 0, high: 1, medium: 2, low: 3 }; return o[a.severity] - o[b.severity]; }); break;
      case "status":   out.sort((a, b) => a.status.localeCompare(b.status)); break;
    }
    return out;
  }, [data, search, filterStatus, sortBy]);

  /* ── export ───────────────────────────────────────────────────────── */
  const exportData = useMemo<FlatRow[]>(() =>
    data.map((r) => ({
      raisedBy: getStaffName(r.raisedBy),
      raisedDate: r.raisedDate,
      category: CAT_LABELS[r.category],
      severity: SEV_LABELS[r.severity],
      status: STATUS_LABELS[r.status],
      subject: r.subject,
      againstWhom: r.againstWhom ? getStaffName(r.againstWhom) : "N/A",
      investigator: r.investigator ? getStaffName(r.investigator) : "Pending",
      hearingDate: r.hearingDate ?? "—",
      outcome: r.outcome || "Pending",
      confidentiality: r.confidentialityLevel,
      notes: r.notes,
    })), [data]);

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
            {Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
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
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", STATUS_COLOURS[r.status])}>{STATUS_LABELS[r.status]}</span>
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", SEV_COLOURS[r.severity])}>{SEV_LABELS[r.severity]}</span>
                    {r.confidentialityLevel !== "standard" && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-800 text-white flex items-center gap-1"><Shield className="h-3 w-3" />{r.confidentialityLevel.replace("_", " ")}</span>}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Raised by {getStaffName(r.raisedBy)} · {r.raisedDate} · {CAT_LABELS[r.category]}</p>
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
                    {r.againstWhom && <div><span className="text-gray-500">Against:</span> <span className="font-medium">{getStaffName(r.againstWhom)}</span></div>}
                    <div><span className="text-gray-500">Investigator:</span> <span className="font-medium">{r.investigator ? getStaffName(r.investigator) : "Pending"}</span></div>
                    {r.hearingDate && <div><span className="text-gray-500">Hearing:</span> <span className="font-medium">{r.hearingDate}</span></div>}
                    {r.tradeUnionRep && <div><span className="text-gray-500">TU Rep:</span> <span className="font-medium">{r.tradeUnionRep}</span></div>}
                  </div>

                  {/* informal resolution */}
                  {r.informalResolutionAttempted && (
                    <div className="rounded-md bg-gray-50 p-3">
                      <h4 className="text-xs font-semibold text-gray-500 mb-1">Informal Resolution</h4>
                      <p className="text-sm">{r.informalOutcome}</p>
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
                  {r.supportOffered.length > 0 && (
                    <div className="rounded-md bg-blue-50 border border-blue-200 p-3">
                      <h4 className="text-xs font-semibold text-blue-700 mb-1">Support Offered</h4>
                      <ul className="list-disc list-inside text-sm text-blue-800 space-y-0.5">
                        {r.supportOffered.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                  )}

                  {/* lessons learned */}
                  {r.lessonsLearned && (
                    <div className="rounded-md bg-purple-50 border border-purple-200 p-3">
                      <h4 className="text-xs font-semibold text-purple-700 mb-1">Lessons Learned</h4>
                      <p className="text-sm text-purple-800">{r.lessonsLearned}</p>
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
                  <SelectContent>{Object.entries(CAT_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Severity</label>
                <Select><SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{Object.entries(SEV_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
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
    </PageShell>
  );
}

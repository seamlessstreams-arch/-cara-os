"use client";

import { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  ArrowUpDown,
  Search,
  Lock,
  FileText,
  Eye,
} from "lucide-react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { cn } from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

/* ── types ─────────────────────────────────────────────────────────────── */

type BreachType =
  | "Lost device"
  | "Lost paper"
  | "Email to wrong recipient"
  | "Unauthorised access"
  | "Unauthorised disclosure"
  | "Verbal disclosure"
  | "System error"
  | "Phishing/social engineering"
  | "Other";

type Severity = "Low" | "Medium" | "High" | "Critical";
type RiskLevel = "Low" | "Medium" | "High";
type BreachStatus = "Investigating" | "Closed - resolved" | "Reported - awaiting ICO" | "Monitoring";

interface DataBreach {
  id: string;
  dateDiscovered: string;
  dateIncident: string;
  breachType: BreachType;
  severity: Severity;
  nearMiss: boolean;
  summaryOfBreach: string;
  dataSubjects: string;
  dataCategoriesAffected: string[];
  specialCategoryData: boolean;
  riskToIndividuals: RiskLevel;
  reportedToICO: boolean;
  icoReportedDate: string;
  icoReference: string;
  dataSubjectsNotified: boolean;
  notificationDate: string;
  immediateActionsTaken: string[];
  rootCauseAnalysis: string;
  lessonsLearned: string[];
  preventiveActions: string[];
  trainingArising: string[];
  policyArising: string;
  status: BreachStatus;
  reportedTo: string[];
  reviewedBy: string;
}

/* ── helpers ───────────────────────────────────────────────────────────── */

const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const SEVERITY_COLOURS: Record<Severity, string> = {
  Low: "bg-green-100 text-green-800",
  Medium: "bg-amber-100 text-amber-800",
  High: "bg-orange-100 text-orange-800",
  Critical: "bg-red-100 text-red-800",
};

const RISK_COLOURS: Record<RiskLevel, string> = {
  Low: "bg-green-100 text-green-800",
  Medium: "bg-amber-100 text-amber-800",
  High: "bg-red-100 text-red-800",
};

const STATUS_COLOURS: Record<BreachStatus, string> = {
  "Investigating": "bg-amber-100 text-amber-800",
  "Closed - resolved": "bg-green-100 text-green-800",
  "Reported - awaiting ICO": "bg-blue-100 text-blue-800",
  "Monitoring": "bg-purple-100 text-purple-800",
};

/* ── seed ──────────────────────────────────────────────────────────────── */

const SEED: DataBreach[] = [
  {
    id: "db1",
    dateDiscovered: d(-12),
    dateIncident: d(-12),
    breachType: "Email to wrong recipient",
    severity: "Low",
    nearMiss: false,
    summaryOfBreach:
      "Staff member sent a routine update email referencing a young person's first name only to a social worker at the wrong local authority team (same authority, different team). Email contained no clinical or sensitive data. Recipient flagged immediately and confirmed deletion within 30 minutes.",
    dataSubjects: "1 young person",
    dataCategoriesAffected: ["First name", "Reference to placement status"],
    specialCategoryData: false,
    riskToIndividuals: "Low",
    reportedToICO: false,
    icoReportedDate: "",
    icoReference: "",
    dataSubjectsNotified: false,
    notificationDate: "",
    immediateActionsTaken: [
      "Recipient contacted within 30 minutes — confirmed deletion in writing",
      "Sender's manager informed",
      "Incident logged in breach register",
      "Email recall attempted (unsuccessful — already opened)",
    ],
    rootCauseAnalysis:
      "Auto-complete in Outlook selected a contact with a similar surname. No verification step before sending. Workload was high at end of shift.",
    lessonsLearned: [
      "Auto-complete is a recurring risk across the sector",
      "End-of-shift fatigue increases error rate",
      "Low-data breaches still warrant systemic response",
    ],
    preventiveActions: [
      "2-minute send delay enabled on all staff Outlook accounts",
      "Pinned 'Check recipient' reminder added to email signatures",
      "Sensitive correspondence to move to secure portal where available",
    ],
    trainingArising: [
      "Email safety refresher delivered at next team meeting",
      "Added to induction checklist",
    ],
    policyArising: "Information Sharing Policy updated to mandate send-delay and recipient verification.",
    status: "Closed - resolved",
    reportedTo: ["DPO", "Registered Manager", "Placing Authority team manager (courtesy)"],
    reviewedBy: "staff_darren",
  },
  {
    id: "db2",
    dateDiscovered: d(-30),
    dateIncident: d(-30),
    breachType: "Lost paper",
    severity: "Low",
    nearMiss: true,
    summaryOfBreach:
      "Staff member could not locate a printed handover sheet at end of shift. Search initiated immediately. Document found 20 minutes later inside a closed staff file in the office (filed in error). Document had not left the building and access was always restricted to staff.",
    dataSubjects: "All current young people",
    dataCategoriesAffected: ["First names", "Daily handover notes"],
    specialCategoryData: true,
    riskToIndividuals: "Low",
    reportedToICO: false,
    icoReportedDate: "",
    icoReference: "",
    dataSubjectsNotified: false,
    notificationDate: "",
    immediateActionsTaken: [
      "Office and communal areas searched immediately",
      "CCTV reviewed for office access",
      "Document located within 20 minutes",
      "Logged as near-miss given speed of recovery and contained location",
    ],
    rootCauseAnalysis:
      "Handover sheet placed inside the wrong folder during a phone interruption. No physical document tracking process for handover sheets.",
    lessonsLearned: [
      "Even contained near-misses must be logged to identify patterns",
      "Interruptions during filing increase misfiling risk",
      "Paper-based handover is a residual risk — digital handover preferred",
    ],
    preventiveActions: [
      "Handover sheets now kept in a single ring-bound logbook in locked office",
      "Trial of digital handover via Cornerstone scheduled",
      "Numbered handover sheets to flag if any are missing",
    ],
    trainingArising: [
      "Records-handling refresher delivered to whole team",
    ],
    policyArising: "Records Management Policy updated — handover paper retention process clarified.",
    status: "Closed - resolved",
    reportedTo: ["DPO", "Registered Manager"],
    reviewedBy: "staff_darren",
  },
  {
    id: "db3",
    dateDiscovered: d(-55),
    dateIncident: d(-55),
    breachType: "Unauthorised access",
    severity: "Medium",
    nearMiss: true,
    summaryOfBreach:
      "Visiting professional (LA reviewing officer) was briefly left in the office while staff member answered a doorbell. Staff returned within 90 seconds. Records were closed and screen was locked, however the desk had a printed agenda visible. No evidence the document was viewed beyond what was in the visitor's remit. Logged as near-miss.",
    dataSubjects: "1 young person (subject of the IRO's review)",
    dataCategoriesAffected: ["Name", "Meeting agenda items"],
    specialCategoryData: false,
    riskToIndividuals: "Low",
    reportedToICO: false,
    icoReportedDate: "",
    icoReference: "",
    dataSubjectsNotified: false,
    notificationDate: "",
    immediateActionsTaken: [
      "Visitor accompanied for remainder of visit",
      "Desk cleared and document locked away",
      "Incident discussed with the visitor (who was the legitimate audience for that document anyway)",
      "Logged as near-miss",
    ],
    rootCauseAnalysis:
      "Clear-desk policy not consistently applied during professional visits. Doorbell distraction broke planned escort protocol.",
    lessonsLearned: [
      "Visitor protocol must hold even for trusted professionals",
      "Distractions are inevitable — controls must work without them",
      "Clear-desk discipline matters most when visitors are present",
    ],
    preventiveActions: [
      "Office door now closed automatically when staff leave the room",
      "'Clear-desk before visitors' added to daily checklist",
      "Second member of staff to greet door when professional visitors are in office",
    ],
    trainingArising: [
      "Visitor management refresher with all staff",
      "Confidentiality discussion in next supervision",
    ],
    policyArising: "Visitor and Confidentiality Policy reviewed and re-issued with sign-off.",
    status: "Closed - resolved",
    reportedTo: ["DPO", "Registered Manager"],
    reviewedBy: "staff_darren",
  },
  {
    id: "db4",
    dateDiscovered: d(-7),
    dateIncident: d(-8),
    breachType: "Verbal disclosure",
    severity: "Low",
    nearMiss: true,
    summaryOfBreach:
      "Staff member began discussing a young person's appointment with a colleague while a delivery driver was at the front door (within possible earshot for ~5 seconds). Colleague stopped the conversation and moved it to the office. Driver left without indication of having heard anything substantive. Logged as near-miss.",
    dataSubjects: "1 young person",
    dataCategoriesAffected: ["First name", "Appointment context"],
    specialCategoryData: true,
    riskToIndividuals: "Low",
    reportedToICO: false,
    icoReportedDate: "",
    icoReference: "",
    dataSubjectsNotified: false,
    notificationDate: "",
    immediateActionsTaken: [
      "Conversation moved immediately to private office",
      "Colleague raised it in handover same day",
      "Logged as near-miss within 24 hours",
    ],
    rootCauseAnalysis:
      "Habit of casual professional conversation in communal areas. No specific prompt about doorway conversations.",
    lessonsLearned: [
      "Doorways and hallways are public even within the home",
      "Peer challenge worked exactly as intended — culture is healthy",
      "Verbal breaches are easy to overlook in a register that focuses on documents",
    ],
    preventiveActions: [
      "Visual reminder card placed near front door",
      "'Office-only' rule re-emphasised for any conversation involving a young person's name",
    ],
    trainingArising: [
      "Confidentiality scenarios added to next reflective practice session",
    ],
    policyArising: "Confidentiality Policy now explicitly references verbal disclosure risks at the front door.",
    status: "Closed - resolved",
    reportedTo: ["DPO", "Registered Manager"],
    reviewedBy: "staff_ryan",
  },
  {
    id: "db5",
    dateDiscovered: d(-3),
    dateIncident: d(-3),
    breachType: "Phishing/social engineering",
    severity: "Medium",
    nearMiss: true,
    summaryOfBreach:
      "Phishing email impersonating Ofsted received by Registered Manager, requesting urgent click-through to 'verify inspection details'. RM identified red flags (sender domain, urgency, generic greeting) and did not click. Email reported via Outlook 'Report Phishing' and forwarded to IT. No data lost.",
    dataSubjects: "Potentially all staff and young people (had the attack succeeded)",
    dataCategoriesAffected: ["None — attack unsuccessful"],
    specialCategoryData: false,
    riskToIndividuals: "Low",
    reportedToICO: false,
    icoReportedDate: "",
    icoReference: "",
    dataSubjectsNotified: false,
    notificationDate: "",
    immediateActionsTaken: [
      "Email reported to IT via 'Report Phishing' button",
      "All staff alerted same day with screenshot of indicators",
      "IT confirmed sender domain blocked at gateway",
      "Logged as near-miss given the credible severity if it had succeeded",
    ],
    rootCauseAnalysis:
      "External phishing campaign targeting children's services providers. Attack vector: spoofed Ofsted domain. Awareness training and reporting tools functioned correctly.",
    lessonsLearned: [
      "Sector-targeted phishing is rising — assume regular attempts",
      "Visible reporting buttons and culture of 'pause-and-check' are working",
      "Even successful defences should be logged to track threat frequency",
    ],
    preventiveActions: [
      "Phishing simulation scheduled with IT supplier next quarter",
      "Multi-factor authentication reviewed and confirmed enforced on all staff accounts",
      "Briefing on Ofsted-themed phishing shared with regional managers' network",
    ],
    trainingArising: [
      "All-staff phishing awareness refresher (annual cycle pulled forward)",
      "Specific module on impersonation of regulators",
    ],
    policyArising: "Cyber Security Policy updated — phishing reporting procedure now in induction pack.",
    status: "Monitoring",
    reportedTo: ["DPO", "Registered Manager", "IT supplier", "Responsible Individual"],
    reviewedBy: "staff_darren",
  },
];

/* ── flat row for export ──────────────────────────────────────────────── */

interface FlatRow {
  dateDiscovered: string;
  dateIncident: string;
  breachType: string;
  severity: string;
  nearMiss: string;
  summary: string;
  dataSubjects: string;
  specialCategoryData: string;
  riskToIndividuals: string;
  reportedToICO: string;
  status: string;
  reviewedBy: string;
}

const EXPORT_COLS: ExportColumn<FlatRow>[] = [
  { header: "Date Discovered", accessor: (r: FlatRow) => r.dateDiscovered },
  { header: "Date of Incident", accessor: (r: FlatRow) => r.dateIncident },
  { header: "Breach Type", accessor: (r: FlatRow) => r.breachType },
  { header: "Severity", accessor: (r: FlatRow) => r.severity },
  { header: "Near-Miss", accessor: (r: FlatRow) => r.nearMiss },
  { header: "Summary", accessor: (r: FlatRow) => r.summary },
  { header: "Data Subjects", accessor: (r: FlatRow) => r.dataSubjects },
  { header: "Special Category Data", accessor: (r: FlatRow) => r.specialCategoryData },
  { header: "Risk to Individuals", accessor: (r: FlatRow) => r.riskToIndividuals },
  { header: "Reported to ICO", accessor: (r: FlatRow) => r.reportedToICO },
  { header: "Status", accessor: (r: FlatRow) => r.status },
  { header: "Reviewed By", accessor: (r: FlatRow) => r.reviewedBy },
];

/* ── component ─────────────────────────────────────────────────────────── */

export default function DataBreachLogPage() {
  const [data] = useState<DataBreach[]>(SEED);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date");

  const toggle = (id: string) => setExpandedId((curr) => (curr === id ? null : id));

  const stats = useMemo(() => {
    const total = data.length;
    const nearMisses = data.filter((b) => b.nearMiss).length;
    const icoReported = data.filter((b) => b.reportedToICO).length;
    const resolved = data.filter((b) => b.status === "Closed - resolved").length;
    return { total, nearMisses, icoReported, resolved };
  }, [data]);

  const filtered = useMemo(() => {
    let list = data;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (b) =>
          b.summaryOfBreach.toLowerCase().includes(q) ||
          b.breachType.toLowerCase().includes(q) ||
          b.dataSubjects.toLowerCase().includes(q),
      );
    }
    if (filterType !== "all") list = list.filter((b) => b.breachType === filterType);
    if (filterStatus !== "all") list = list.filter((b) => b.status === filterStatus);
    const out = [...list];
    switch (sortBy) {
      case "date":
        out.sort((a, b) => b.dateDiscovered.localeCompare(a.dateDiscovered));
        break;
      case "severity": {
        const order: Record<Severity, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };
        out.sort((a, b) => order[a.severity] - order[b.severity]);
        break;
      }
      case "type":
        out.sort((a, b) => a.breachType.localeCompare(b.breachType));
        break;
      case "status":
        out.sort((a, b) => a.status.localeCompare(b.status));
        break;
    }
    return out;
  }, [data, search, filterType, filterStatus, sortBy]);

  const exportData = useMemo<FlatRow[]>(
    () =>
      data.map((b) => ({
        dateDiscovered: b.dateDiscovered,
        dateIncident: b.dateIncident,
        breachType: b.breachType,
        severity: b.severity,
        nearMiss: b.nearMiss ? "Yes" : "No",
        summary: b.summaryOfBreach,
        dataSubjects: b.dataSubjects,
        specialCategoryData: b.specialCategoryData ? "Yes" : "No",
        riskToIndividuals: b.riskToIndividuals,
        reportedToICO: b.reportedToICO ? "Yes" : "No",
        status: b.status,
        reviewedBy: getStaffName(b.reviewedBy),
      })),
    [data],
  );

  const BREACH_TYPES: BreachType[] = [
    "Lost device",
    "Lost paper",
    "Email to wrong recipient",
    "Unauthorised access",
    "Unauthorised disclosure",
    "Verbal disclosure",
    "System error",
    "Phishing/social engineering",
    "Other",
  ];

  const STATUSES: BreachStatus[] = [
    "Investigating",
    "Closed - resolved",
    "Reported - awaiting ICO",
    "Monitoring",
  ];

  return (
    <PageShell
      title="Data Breach Log"
      subtitle="Breach and near-miss register — GDPR Article 33-34 incident management (Data Protection Act 2018, UK GDPR)"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Data Breach Log" />
          <ExportButton data={exportData} columns={EXPORT_COLS} filename="data-breach-log" />
        </div>
      }
    >
      {/* summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total incidents", value: stats.total, icon: ShieldAlert, colour: "text-blue-600" },
          { label: "Near-misses caught", value: stats.nearMisses, icon: Eye, colour: "text-amber-600" },
          { label: "ICO-notified", value: stats.icoReported, icon: AlertTriangle, colour: stats.icoReported > 0 ? "text-red-600" : "text-gray-400" },
          { label: "Resolved", value: stats.resolved, icon: CheckCircle2, colour: "text-green-600" },
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

      {/* confidentiality banner */}
      <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4">
        <Lock className="h-5 w-5 text-amber-700 mt-0.5" />
        <div>
          <p className="font-semibold text-amber-900">Confidentiality notice</p>
          <p className="text-sm text-amber-800">
            All entries below are anonymised. Names of young people, staff and third parties are
            replaced with role identifiers. Full unredacted incident files are held securely by the
            Registered Manager and Data Protection Officer. Access is on a strict need-to-know basis
            for safeguarding, audit and regulatory purposes only.
          </p>
        </div>
      </div>

      {/* filters / sort */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search breaches…"
            className="w-full rounded-md border py-2 pl-9 pr-3 text-sm"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[200px] h-9 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {BREACH_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[200px] h-9 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <ArrowUpDown className="h-4 w-4" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px] h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Most Recent</SelectItem>
              <SelectItem value="severity">Severity</SelectItem>
              <SelectItem value="type">Type</SelectItem>
              <SelectItem value="status">Status</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* breach cards */}
      <div className="space-y-4 mb-8">
        {filtered.map((b) => {
          const open = expandedId === b.id;
          return (
            <div key={b.id} className="rounded-lg border bg-white">
              <button
                onClick={() => toggle(b.id)}
                className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <ShieldAlert className="h-4 w-4 text-gray-400" />
                    <h3 className="font-semibold">{b.breachType}</h3>
                    {b.nearMiss && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                        Near-miss
                      </span>
                    )}
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", SEVERITY_COLOURS[b.severity])}>
                      {b.severity}
                    </span>
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", STATUS_COLOURS[b.status])}>
                      {b.status}
                    </span>
                    {b.specialCategoryData && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        Special category
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Discovered {b.dateDiscovered} · Incident {b.dateIncident} · {b.dataSubjects} · Reviewed by {getStaffName(b.reviewedBy)}
                  </p>
                </div>
                {open ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
              </button>

              {open && (
                <div className="border-t px-4 pb-4 space-y-4">
                  <p className="mt-3 text-sm">{b.summaryOfBreach}</p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div><span className="text-gray-500">Discovered:</span> <span className="font-medium">{b.dateDiscovered}</span></div>
                    <div><span className="text-gray-500">Incident:</span> <span className="font-medium">{b.dateIncident}</span></div>
                    <div><span className="text-gray-500">Subjects:</span> <span className="font-medium">{b.dataSubjects}</span></div>
                    <div>
                      <span className="text-gray-500">Risk:</span>{" "}
                      <span className={cn("px-2 py-0.5 rounded text-xs font-medium", RISK_COLOURS[b.riskToIndividuals])}>{b.riskToIndividuals}</span>
                    </div>
                  </div>

                  <div className="rounded-md bg-gray-50 p-3">
                    <h4 className="text-xs font-semibold text-gray-700 mb-1">Data categories affected</h4>
                    <ul className="list-disc list-inside text-sm text-gray-700">
                      {b.dataCategoriesAffected.map((c, i) => <li key={i}>{c}</li>)}
                    </ul>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className={cn("px-2 py-1 rounded text-xs font-medium", b.reportedToICO ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800")}>
                      {b.reportedToICO ? `ICO notified ${b.icoReportedDate || ""}${b.icoReference ? ` · Ref ${b.icoReference}` : ""}` : "ICO notification not required"}
                    </span>
                    <span className={cn("px-2 py-1 rounded text-xs font-medium", b.dataSubjectsNotified ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-700")}>
                      {b.dataSubjectsNotified ? `Data subjects notified ${b.notificationDate || ""}` : "Data subjects not notified"}
                    </span>
                  </div>

                  <div className="rounded-md bg-amber-50 border border-amber-200 p-3">
                    <h4 className="text-xs font-semibold text-amber-700 mb-1">Root cause analysis</h4>
                    <p className="text-sm text-amber-800">{b.rootCauseAnalysis}</p>
                  </div>

                  <div className="rounded-md bg-blue-50 border border-blue-200 p-3">
                    <h4 className="text-xs font-semibold text-blue-700 mb-1">Immediate actions taken</h4>
                    <ul className="list-disc list-inside text-sm text-blue-800 space-y-0.5">
                      {b.immediateActionsTaken.map((a, i) => <li key={i}>{a}</li>)}
                    </ul>
                  </div>

                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="rounded-md bg-purple-50 border border-purple-200 p-3">
                      <h4 className="text-xs font-semibold text-purple-700 mb-1">Lessons learned</h4>
                      <ul className="list-disc list-inside text-sm text-purple-800 space-y-0.5">
                        {b.lessonsLearned.map((l, i) => <li key={i}>{l}</li>)}
                      </ul>
                    </div>
                    <div className="rounded-md bg-emerald-50 border border-emerald-200 p-3">
                      <h4 className="text-xs font-semibold text-emerald-700 mb-1">Preventive actions</h4>
                      <ul className="list-disc list-inside text-sm text-emerald-800 space-y-0.5">
                        {b.preventiveActions.map((p, i) => <li key={i}>{p}</li>)}
                      </ul>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="rounded-md bg-indigo-50 border border-indigo-200 p-3">
                      <h4 className="text-xs font-semibold text-indigo-700 mb-1 flex items-center gap-1">
                        <FileText className="h-3 w-3" /> Training arising
                      </h4>
                      <ul className="list-disc list-inside text-sm text-indigo-800 space-y-0.5">
                        {b.trainingArising.map((t, i) => <li key={i}>{t}</li>)}
                      </ul>
                    </div>
                    <div className="rounded-md bg-slate-50 border border-slate-200 p-3">
                      <h4 className="text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                        <FileText className="h-3 w-3" /> Policy arising
                      </h4>
                      <p className="text-sm text-slate-800">{b.policyArising}</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 mb-1">Reported to</h4>
                      <ul className="list-disc list-inside text-gray-700 space-y-0.5">
                        {b.reportedTo.map((r, i) => <li key={i}>{r}</li>)}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 mb-1">Reviewed by</h4>
                      <p className="text-gray-700">{getStaffName(b.reviewedBy)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* regulatory note */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 mb-6">
        <strong>UK GDPR Articles 33-34 &amp; Data Protection Act 2018:</strong> Personal data
        breaches must be assessed within 72 hours of becoming aware. Breaches likely to result in a
        risk to the rights and freedoms of individuals must be reported to the ICO without undue
        delay (Article 33). Where the risk is high, affected individuals must also be informed
        without undue delay (Article 34). All breaches and near-misses are recorded in this
        register, regardless of reportability, to support root cause analysis, lessons learned and
        preventive action. The register is reviewed monthly by the Registered Manager and quarterly
        by the Responsible Individual.
      </div>
    </PageShell>
  );
}

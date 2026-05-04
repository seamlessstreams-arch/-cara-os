"use client";

import { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  Mailbox,
  ArrowUpDown,
  Search,
  Activity,
  Clock,
  CalendarDays,
  Network,
  ArrowDownLeft,
  ArrowUpRight,
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

type Regulator =
  | "Local Authority — Riverside"
  | "Local Authority — Valley"
  | "Local Authority — Hillside"
  | "Ofsted (link to Ofsted log)"
  | "ICO"
  | "HMRC"
  | "HSE"
  | "Planning Authority"
  | "Environmental Health"
  | "Fire Authority"
  | "ICB / NHS Partner"
  | "DfE";

type Direction = "Incoming" | "Outgoing";
type Urgency = "Routine" | "Standard" | "Urgent";
type LetterStatus = "Open" | "Closed" | "Pending action" | "Awaiting reply";
type Confidentiality = "Standard" | "Sensitive" | "Restricted";

interface RegulatoryLetter {
  id: string;
  dateSent: string;
  dateReceived: string;
  regulator: Regulator;
  direction: Direction;
  reference: string;
  subject: string;
  summary: string;
  ourResponse: string;
  documentsAttached: string[];
  responseRequired: boolean;
  responseDeadline: string;
  responseSent: boolean;
  actionsAgreed: string[];
  urgency: Urgency;
  status: LetterStatus;
  confidentialityLevel: Confidentiality;
  recordedBy: string;
}

/* ── seed ──────────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const SEED: RegulatoryLetter[] = [
  {
    id: "reg1",
    dateSent: d(-21),
    dateReceived: d(-20),
    regulator: "Local Authority — Riverside",
    direction: "Incoming",
    reference: "RIV/CH/2026/0118",
    subject: "Quality of care query — placement of YP-A and SW request for additional information on key working records",
    summary: "Riverside LA's Independent Reviewing Officer wrote following the most recent statutory review of YP-A. The IRO requested clarity on how key working sessions are recorded and shared with the social worker, and asked for a copy of the home's key worker policy alongside the last three months of session summaries for YP-A. The letter also queried how the home evidences participation by the young person in shaping their care plan.",
    ourResponse: "RM responded within 5 working days enclosing the key worker policy (v3.2), three months of redacted session summaries for YP-A, and a covering note describing the participation framework used at Oak House (advocacy entitlement, monthly children's meeting minutes, individual one-page profiles). Offered an in-person meeting if further assurance was needed.",
    documentsAttached: ["Key Worker Policy v3.2", "Session Summaries (Feb–Apr 2026, redacted)", "Participation Framework Summary", "YP-A One-Page Profile"],
    responseRequired: true,
    responseDeadline: d(-7),
    responseSent: true,
    actionsAgreed: [
      "RM to share future key working summaries direct to SW within 7 days of session",
      "Copy of next children's meeting minutes to be CC'd to IRO",
      "IRO confirmed no further action required and noted improvements positively",
    ],
    urgency: "Standard",
    status: "Closed",
    confidentialityLevel: "Sensitive",
    recordedBy: "staff_darren",
  },
  {
    id: "reg2",
    dateSent: d(-95),
    dateReceived: d(-92),
    regulator: "ICO",
    direction: "Incoming",
    reference: "ICO/Z3041122/2026",
    subject: "Acknowledgement of annual data protection fee renewal and registration confirmation as data controller",
    summary: "ICO confirmed receipt of the annual data protection fee for Oak House Children's Home Ltd and re-issued the registration certificate as a data controller for the period commencing the renewal date. The letter included reminders on the duty to report personal data breaches within 72 hours and signposted to the ICO accountability framework self-assessment.",
    ourResponse: "Registration certificate filed in the company governance binder and uploaded to the platform's policy library. RM confirmed the breach reporting flow with all team leaders at the next team meeting and re-circulated the data protection one-pager. ICO accountability framework self-assessment scheduled into the audit calendar for Q3.",
    documentsAttached: ["ICO Registration Certificate 2026–2027", "Receipt of Annual Fee"],
    responseRequired: false,
    responseDeadline: "—",
    responseSent: false,
    actionsAgreed: [
      "Certificate filed and accessible to all SLT",
      "Breach reporting flow re-briefed at team meeting",
      "Q3 ICO accountability framework self-assessment booked",
    ],
    urgency: "Routine",
    status: "Closed",
    confidentialityLevel: "Standard",
    recordedBy: "staff_darren",
  },
  {
    id: "reg3",
    dateSent: d(-12),
    dateReceived: d(-10),
    regulator: "Fire Authority",
    direction: "Incoming",
    reference: "FRS/INS/2026/0442",
    subject: "Confirmation of annual fire safety audit visit and pre-visit information request",
    summary: "Fire and Rescue Service Protection Team confirmed the date of the annual fire safety audit visit and requested pre-visit documentation: the current Fire Risk Assessment, evacuation plan, fire drill records (last 12 months), staff training register, and PEEPs for any young person or staff member with reduced mobility. Visit will include a walk-around inspection and a discussion with the Responsible Person.",
    ourResponse: "RM, as Responsible Person, acknowledged the letter the same day and dispatched the requested documentation pack ahead of the visit. Pre-visit walk-through completed by RM and Maintenance Lead — no defects noted. Visit confirmed in the diary and team briefed.",
    documentsAttached: ["Fire Risk Assessment v2026.1", "Evacuation Plan", "Fire Drill Log 2025–2026", "Staff Fire Training Register", "PEEPs (current)"],
    responseRequired: true,
    responseDeadline: d(2),
    responseSent: true,
    actionsAgreed: [
      "Pre-visit pack sent to FRS Protection Team",
      "Internal walk-through completed; no defects",
      "Team briefed on visit format and likely questions",
    ],
    urgency: "Standard",
    status: "Awaiting reply",
    confidentialityLevel: "Standard",
    recordedBy: "staff_darren",
  },
  {
    id: "reg4",
    dateSent: d(-60),
    dateReceived: d(-58),
    regulator: "Environmental Health",
    direction: "Incoming",
    reference: "EH/FH/2026/0231",
    subject: "Food hygiene rating outcome — 5 stars (Very Good) following unannounced inspection",
    summary: "Environmental Health Officer confirmed the outcome of the unannounced food hygiene inspection at Oak House. The home was awarded the maximum 5-star rating (Very Good) across all three assessment areas: hygienic food handling, cleanliness and condition of facilities, and confidence in management. The EHO noted particular strengths in temperature monitoring records and allergen management, and made no recommendations.",
    ourResponse: "RM circulated the rating to the staff team and shared the news with the children at the next house meeting (with their consent). Certificate displayed at the entrance as required. A copy of the report was also shared with the responsible individual and placed in the next quarterly governance report.",
    documentsAttached: ["Food Hygiene Rating Certificate (5 Stars)", "Inspection Report"],
    responseRequired: false,
    responseDeadline: "—",
    responseSent: false,
    actionsAgreed: [
      "Certificate displayed at home entrance",
      "Rating shared with staff team and children",
      "Outcome reported to RI and included in governance pack",
    ],
    urgency: "Routine",
    status: "Closed",
    confidentialityLevel: "Standard",
    recordedBy: "staff_ryan",
  },
  {
    id: "reg5",
    dateSent: d(-40),
    dateReceived: d(-37),
    regulator: "Planning Authority",
    direction: "Incoming",
    reference: "PA/2026/00874/FUL",
    subject: "Grant of full planning permission for proposed garden room / therapeutic activity building",
    summary: "Local Planning Authority granted full planning permission for the proposed single-storey garden room to be used as a therapeutic activity space for the children. Permission is subject to standard conditions including completion within three years, materials to match existing dwelling, and compliance with submitted landscaping scheme. No further regulatory consents required, though Building Regulations approval will follow separately.",
    ourResponse: "RM and RI confirmed receipt and instructed the architect to proceed with detailed Building Regulations submission. Decision notice filed and shared with finance for capital project records. Children involved in selecting the internal layout and planned use through the children's meeting.",
    documentsAttached: ["Decision Notice PA/2026/00874/FUL", "Approved Plans", "Conditions Schedule"],
    responseRequired: false,
    responseDeadline: "—",
    responseSent: false,
    actionsAgreed: [
      "Architect instructed to submit Building Regs application",
      "Decision notice filed with capital project papers",
      "Children consulted on layout and intended use",
    ],
    urgency: "Routine",
    status: "Closed",
    confidentialityLevel: "Standard",
    recordedBy: "staff_darren",
  },
  {
    id: "reg6",
    dateSent: d(-8),
    dateReceived: d(-6),
    regulator: "ICB / NHS Partner",
    direction: "Incoming",
    reference: "ICB/CHI/2026/0098",
    subject: "Designated Nurse for Looked After Children — partnership letter and offer of joint working session",
    summary: "The Designated Nurse for Looked After Children at the Integrated Care Board wrote to introduce herself following a recent change in post and to offer a joint working session with the home covering: timely Initial and Review Health Assessments, immunisations, dental access, and the new pathway for emotional wellbeing checks (SDQs) shared with the LAC nurse team. Letter also asked the home to confirm its named health link.",
    ourResponse: "RM responded within two working days welcoming the offer, confirmed the named health link at the home, and proposed three possible dates for the joint working session. Information shared with the team that day. No outstanding RHA or IHA actions identified.",
    documentsAttached: ["Health Link Confirmation Letter", "Health Assessment Tracker (current)"],
    responseRequired: true,
    responseDeadline: d(7),
    responseSent: true,
    actionsAgreed: [
      "Three dates proposed for joint working session",
      "Named health link confirmed in writing",
      "Team briefed on new SDQ pathway with LAC nurse team",
    ],
    urgency: "Standard",
    status: "Pending action",
    confidentialityLevel: "Standard",
    recordedBy: "staff_darren",
  },
  {
    id: "reg7",
    dateSent: d(-30),
    dateReceived: d(-28),
    regulator: "HSE",
    direction: "Incoming",
    reference: "HSE/RIDDOR/2026/0117",
    subject: "Acknowledgement of RIDDOR report — staff member slip injury (over-7-day incapacity)",
    summary: "HSE acknowledged receipt of the RIDDOR report submitted following a staff slip injury that resulted in an over-7-day incapacity. Acknowledgement confirmed the report has been logged on the HSE database and that no further action is required at this stage unless additional information emerges. The letter signposted to HSE guidance on slips, trips and falls and the duty to keep an internal record of the investigation.",
    ourResponse: "Acknowledgement filed with the original RIDDOR report and the internal investigation record. Lessons-learned summary completed by RM with the staff team and added to the H&S induction pack. Floor surface checked, additional non-slip matting installed at the identified location.",
    documentsAttached: ["HSE Acknowledgement Email", "RIDDOR F2508", "Internal Investigation Record", "Lessons Learned Summary"],
    responseRequired: false,
    responseDeadline: "—",
    responseSent: false,
    actionsAgreed: [
      "Investigation record filed with RIDDOR submission",
      "Non-slip matting installed at identified hazard",
      "Lessons learned added to H&S induction pack",
    ],
    urgency: "Standard",
    status: "Closed",
    confidentialityLevel: "Sensitive",
    recordedBy: "staff_ryan",
  },
  {
    id: "reg8",
    dateSent: d(-3),
    dateReceived: d(-2),
    regulator: "DfE",
    direction: "Incoming",
    reference: "DfE/CONS/2026/CHR-08",
    subject: "Invitation to respond to national consultation on Children's Homes Regulations and proposed reforms to Quality Standards",
    summary: "Department for Education wrote to all registered children's homes inviting responses to a national consultation on proposed reforms to the Children's Homes (England) Regulations 2015, including potential changes to Quality Standards 7 (Health) and 13 (Leadership and Management). The consultation runs for 12 weeks and includes specific questions on workforce, registration of managers, and governance reporting.",
    ourResponse: "RM circulated the consultation pack to RI, deputy and team leaders. Response will be drafted with input from the children (where appropriate, on the questions about their experience) and submitted before the deadline. RM also flagged the consultation to the regional managers' network for collective response.",
    documentsAttached: ["DfE Consultation Letter", "Consultation Document (full)", "Easy-Read Summary for Children"],
    responseRequired: true,
    responseDeadline: d(81),
    responseSent: false,
    actionsAgreed: [
      "Consultation pack circulated internally",
      "Children to be consulted on relevant questions via house meeting",
      "Draft response to be reviewed by RI before submission",
      "Network response flagged to regional managers' group",
    ],
    urgency: "Routine",
    status: "Open",
    confidentialityLevel: "Standard",
    recordedBy: "staff_darren",
  },
];

/* ── constants ─────────────────────────────────────────────────────────── */

const REGULATORS: Regulator[] = [
  "Local Authority — Riverside",
  "Local Authority — Valley",
  "Local Authority — Hillside",
  "Ofsted (link to Ofsted log)",
  "ICO",
  "HMRC",
  "HSE",
  "Planning Authority",
  "Environmental Health",
  "Fire Authority",
  "ICB / NHS Partner",
  "DfE",
];

const DIRECTIONS: Direction[] = ["Incoming", "Outgoing"];
const URGENCIES: Urgency[] = ["Routine", "Standard", "Urgent"];
const STATUSES: LetterStatus[] = ["Open", "Closed", "Pending action", "Awaiting reply"];

const STATUS_META: Record<LetterStatus, { colour: string }> = {
  "Open":            { colour: "bg-blue-100 text-blue-700" },
  "Closed":          { colour: "bg-gray-100 text-gray-700" },
  "Pending action":  { colour: "bg-amber-100 text-amber-700" },
  "Awaiting reply":  { colour: "bg-indigo-100 text-indigo-700" },
};

const URGENCY_META: Record<Urgency, { colour: string }> = {
  "Routine":  { colour: "bg-gray-100 text-gray-700" },
  "Standard": { colour: "bg-blue-100 text-blue-700" },
  "Urgent":   { colour: "bg-red-100 text-red-700" },
};

const CONF_META: Record<Confidentiality, { colour: string }> = {
  "Standard":   { colour: "bg-gray-100 text-gray-700" },
  "Sensitive":  { colour: "bg-amber-100 text-amber-700" },
  "Restricted": { colour: "bg-red-100 text-red-700" },
};

/* ── component ─────────────────────────────────────────────────────────── */

export default function RegulatoryCorrespondenceTrackerPage() {
  const [data] = useState<RegulatoryLetter[]>(SEED);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterRegulator, setFilterRegulator] = useState("all");
  const [filterDirection, setFilterDirection] = useState("all");
  const [sortBy, setSortBy] = useState("date");

  const stats = useMemo(() => {
    const active = data.filter((r) => r.status === "Open" || r.status === "Pending action" || r.status === "Awaiting reply").length;
    const awaiting = data.filter((r) => r.responseRequired && !r.responseSent).length;
    const thisYear = new Date().getFullYear();
    const yearCount = data.filter((r) => {
      const ref = r.dateReceived || r.dateSent;
      return ref && new Date(ref).getFullYear() === thisYear;
    }).length;
    const distinctRegulators = new Set(data.map((r) => r.regulator)).size;
    return { active, awaiting, yearCount, distinctRegulators };
  }, [data]);

  const filtered = useMemo(() => {
    let list = [...data];
    if (filterStatus !== "all") list = list.filter((r) => r.status === filterStatus);
    if (filterRegulator !== "all") list = list.filter((r) => r.regulator === filterRegulator);
    if (filterDirection !== "all") list = list.filter((r) => r.direction === filterDirection);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((r) =>
        r.subject.toLowerCase().includes(q) ||
        r.summary.toLowerCase().includes(q) ||
        r.reference.toLowerCase().includes(q) ||
        r.regulator.toLowerCase().includes(q),
      );
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "urgency":    return URGENCIES.indexOf(b.urgency) - URGENCIES.indexOf(a.urgency);
        case "regulator":  return a.regulator.localeCompare(b.regulator);
        case "deadline":   return (a.responseDeadline || "9999").localeCompare(b.responseDeadline || "9999");
        case "status":     return a.status.localeCompare(b.status);
        default:           return (b.dateReceived || b.dateSent).localeCompare(a.dateReceived || a.dateSent);
      }
    });
    return list;
  }, [data, filterStatus, filterRegulator, filterDirection, search, sortBy]);

  const exportCols: ExportColumn<RegulatoryLetter>[] = [
    { header: "Date Sent",         accessor: (r: RegulatoryLetter) => r.dateSent },
    { header: "Date Received",     accessor: (r: RegulatoryLetter) => r.dateReceived },
    { header: "Regulator",         accessor: (r: RegulatoryLetter) => r.regulator },
    { header: "Direction",         accessor: (r: RegulatoryLetter) => r.direction },
    { header: "Reference",         accessor: (r: RegulatoryLetter) => r.reference },
    { header: "Subject",           accessor: (r: RegulatoryLetter) => r.subject },
    { header: "Summary",           accessor: (r: RegulatoryLetter) => r.summary },
    { header: "Our Response",      accessor: (r: RegulatoryLetter) => r.ourResponse },
    { header: "Documents",         accessor: (r: RegulatoryLetter) => r.documentsAttached.join("; ") },
    { header: "Response Required", accessor: (r: RegulatoryLetter) => r.responseRequired ? "Yes" : "No" },
    { header: "Response Deadline", accessor: (r: RegulatoryLetter) => r.responseDeadline },
    { header: "Response Sent",     accessor: (r: RegulatoryLetter) => r.responseSent ? "Yes" : "No" },
    { header: "Actions Agreed",    accessor: (r: RegulatoryLetter) => r.actionsAgreed.join("; ") },
    { header: "Urgency",           accessor: (r: RegulatoryLetter) => r.urgency },
    { header: "Status",            accessor: (r: RegulatoryLetter) => r.status },
    { header: "Confidentiality",   accessor: (r: RegulatoryLetter) => r.confidentialityLevel },
    { header: "Recorded By",       accessor: (r: RegulatoryLetter) => getStaffName(r.recordedBy) },
  ];

  return (
    <PageShell
      title="Regulatory Correspondence Tracker"
      subtitle="Quality Standard 13 (Leadership and Management) — written correspondence with all regulators and statutory partners"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={data} columns={exportCols} filename="regulatory-correspondence" />
          <PrintButton title="Regulatory Correspondence Tracker" />
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { l: "Active Threads",            v: stats.active,             icon: Activity,     c: "text-blue-600" },
            { l: "Awaiting Response",         v: stats.awaiting,           icon: Clock,        c: "text-amber-600" },
            { l: "This Year",                 v: stats.yearCount,          icon: CalendarDays, c: "text-indigo-600" },
            { l: "Multi-Regulator Engagement", v: stats.distinctRegulators, icon: Network,      c: "text-green-600" },
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
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search subject, summary, reference, regulator…"
              className="w-full rounded-md border pl-8 pr-3 py-2 text-sm"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[170px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterRegulator} onValueChange={setFilterRegulator}>
            <SelectTrigger className="w-[230px]"><SelectValue placeholder="Regulator" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Regulators</SelectItem>
              {REGULATORS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterDirection} onValueChange={setFilterDirection}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Direction" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Directions</SelectItem>
              {DIRECTIONS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1 text-sm">
            <ArrowUpDown className="h-4 w-4" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded border px-2 py-1.5 text-sm"
            >
              <option value="date">Date</option>
              <option value="urgency">Urgency</option>
              <option value="regulator">Regulator</option>
              <option value="deadline">Response Deadline</option>
              <option value="status">Status</option>
            </select>
          </div>
        </div>

        {filtered.map((rec) => (
          <div key={rec.id} className="rounded-lg border bg-white overflow-hidden">
            <button
              onClick={() => setExpandedId(expandedId === rec.id ? null : rec.id)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <Mailbox className="h-5 w-5 text-brand" />
                <div className="text-left">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">{rec.regulator}</h3>
                    <span className="text-sm text-muted-foreground">— {rec.reference}</span>
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium inline-flex items-center gap-1", rec.direction === "Incoming" ? "bg-sky-100 text-sky-700" : "bg-emerald-100 text-emerald-700")}>
                      {rec.direction === "Incoming"
                        ? <ArrowDownLeft className="h-3 w-3" />
                        : <ArrowUpRight className="h-3 w-3" />}
                      {rec.direction}
                    </span>
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", STATUS_META[rec.status].colour)}>
                      {rec.status}
                    </span>
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", URGENCY_META[rec.urgency].colour)}>
                      {rec.urgency}
                    </span>
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", CONF_META[rec.confidentialityLevel].colour)}>
                      {rec.confidentialityLevel}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {rec.subject}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Sent {rec.dateSent} · Received {rec.dateReceived} · Logged by {getStaffName(rec.recordedBy)}
                  </p>
                </div>
              </div>
              {expandedId === rec.id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>

            {expandedId === rec.id && (
              <div className="border-t p-4 space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Date Sent:</span> {rec.dateSent}</div>
                  <div><span className="text-muted-foreground">Date Received:</span> {rec.dateReceived}</div>
                  <div><span className="text-muted-foreground">Direction:</span> {rec.direction}</div>
                  <div><span className="text-muted-foreground">Reference:</span> {rec.reference}</div>
                  <div><span className="text-muted-foreground">Response Required:</span> {rec.responseRequired ? "Yes" : "No"}</div>
                  <div><span className="text-muted-foreground">Response Deadline:</span> {rec.responseDeadline}</div>
                  <div><span className="text-muted-foreground">Response Sent:</span> {rec.responseSent ? "Yes" : "No"}</div>
                  <div><span className="text-muted-foreground">Confidentiality:</span> {rec.confidentialityLevel}</div>
                </div>

                <div className="rounded-lg bg-gray-50 p-3">
                  <h4 className="text-sm font-semibold mb-1">Subject</h4>
                  <p className="text-sm text-muted-foreground">{rec.subject}</p>
                </div>

                <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                  <h4 className="text-sm font-semibold text-blue-800 mb-1">Summary of Correspondence</h4>
                  <p className="text-sm text-blue-900">{rec.summary}</p>
                </div>

                <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3">
                  <h4 className="text-sm font-semibold text-emerald-800 mb-1">Our Response</h4>
                  <p className="text-sm text-emerald-900">{rec.ourResponse}</p>
                </div>

                {rec.documentsAttached.length > 0 && (
                  <div className="rounded-lg bg-indigo-50 border border-indigo-200 p-3">
                    <h4 className="text-sm font-semibold text-indigo-800 mb-1">Documents Attached / Referenced</h4>
                    <ul className="list-disc pl-5 text-sm text-indigo-900 space-y-0.5">
                      {rec.documentsAttached.map((doc, i) => <li key={i}>{doc}</li>)}
                    </ul>
                  </div>
                )}

                {rec.actionsAgreed.length > 0 && (
                  <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                    <h4 className="text-sm font-semibold text-amber-800 mb-1">Actions Agreed / Outcomes</h4>
                    <ul className="list-disc pl-5 text-sm text-amber-900 space-y-0.5">
                      {rec.actionsAgreed.map((a, i) => <li key={i}>{a}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        <div className="rounded-lg border-l-4 border-blue-400 bg-blue-50 p-4 text-sm text-blue-900">
          <strong>Quality Standard 13 (Leadership and Management) &amp; good governance</strong> — Registered providers must maintain a clear, auditable record of all written correspondence with regulators and statutory partners (Local Authorities, Ofsted, ICO, HMRC, HSE, Planning, Environmental Health, Fire Authority, ICB / NHS partners, DfE). Each thread should evidence the regulator&apos;s query, the home&apos;s response, any documents provided, agreed actions and the outcome. This tracker sits alongside &mdash; not in place of &mdash; the dedicated Ofsted log.
        </div>
      </div>
    </PageShell>
  );
}

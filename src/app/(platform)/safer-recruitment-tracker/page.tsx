"use client";

import { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  ArrowUpDown,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Circle,
  UserCheck,
  FileCheck,
  FileWarning,
  Users,
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

type RecruitmentStatus =
  | "Applying"
  | "Interviewing"
  | "References"
  | "DBS Pending"
  | "Pre-Employment Checks"
  | "Onboarding"
  | "Employed"
  | "Withdrawn";

type ReferenceStatus = "Pending" | "Received" | "Concerns Raised";
type DbsResult = "Clear" | "Disclosure - Reviewed" | "Pending";

interface ChecklistItem {
  name: string;
  completed: boolean;
  date: string;
  notes: string;
}

interface RecruitmentReference {
  referee: string;
  organisation: string;
  status: ReferenceStatus;
  dateReceived: string;
}

interface RecruitmentRecord {
  id: string;
  candidateName: string;
  roleAppliedFor: string;
  applicationDate: string;
  status: RecruitmentStatus;
  checklistItems: ChecklistItem[];
  references: RecruitmentReference[];
  dbsApplicationDate: string;
  dbsResultDate: string;
  dbsResult: DbsResult;
  interviewers: string[];
  redFlagsRaised: string[];
  proposedStartDate: string;
  recruitedBy: string;
}

/* ── helpers ───────────────────────────────────────────────────────────── */

const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const STATUS_META: Record<RecruitmentStatus, { colour: string; icon: typeof CheckCircle2 }> = {
  "Applying":              { colour: "bg-gray-100 text-gray-700",     icon: Circle },
  "Interviewing":          { colour: "bg-blue-100 text-blue-700",     icon: Users },
  "References":            { colour: "bg-indigo-100 text-indigo-700", icon: FileCheck },
  "DBS Pending":           { colour: "bg-amber-100 text-amber-700",   icon: Clock },
  "Pre-Employment Checks": { colour: "bg-purple-100 text-purple-700", icon: ShieldCheck },
  "Onboarding":            { colour: "bg-teal-100 text-teal-700",     icon: UserCheck },
  "Employed":              { colour: "bg-green-100 text-green-700",   icon: CheckCircle2 },
  "Withdrawn":             { colour: "bg-red-100 text-red-700",       icon: AlertTriangle },
};

const REFERENCE_META: Record<ReferenceStatus, string> = {
  "Pending":          "bg-amber-100 text-amber-700",
  "Received":         "bg-green-100 text-green-700",
  "Concerns Raised":  "bg-red-100 text-red-700",
};

const DBS_META: Record<DbsResult, string> = {
  "Clear":                 "bg-green-100 text-green-700",
  "Disclosure - Reviewed": "bg-amber-100 text-amber-700",
  "Pending":               "bg-gray-100 text-gray-700",
};

const STANDARD_CHECKLIST = [
  "Application form received",
  "Identity verification (passport/photo ID)",
  "Right to work confirmed",
  "Address history (5 years) verified",
  "Employment history gaps explained",
  "Two references received",
  "Enhanced DBS with barred list",
  "Overseas police check (if applicable)",
  "Qualifications verified",
  "Health declaration completed",
  "Disqualification declaration signed",
  "Safer recruitment interview completed",
  "Contract issued and signed",
  "Statement of particulars provided",
];

/* ── seed ──────────────────────────────────────────────────────────────── */

const SEED: RecruitmentRecord[] = [
  {
    id: "rec1",
    candidateName: "Aaliyah Rahman",
    roleAppliedFor: "Residential Care Worker",
    applicationDate: d(-42),
    status: "Onboarding",
    checklistItems: [
      { name: "Application form received",                completed: true,  date: d(-42), notes: "Complete with full address history" },
      { name: "Identity verification (passport/photo ID)", completed: true,  date: d(-38), notes: "UK passport seen — original verified" },
      { name: "Right to work confirmed",                   completed: true,  date: d(-38), notes: "British citizen" },
      { name: "Address history (5 years) verified",        completed: true,  date: d(-35), notes: "No gaps" },
      { name: "Employment history gaps explained",         completed: true,  date: d(-35), notes: "All accounted for — career break 2022 (childcare)" },
      { name: "Two references received",                   completed: true,  date: d(-21), notes: "Previous RM and university tutor" },
      { name: "Enhanced DBS with barred list",             completed: true,  date: d(-14), notes: "Clear — certificate on file" },
      { name: "Overseas police check (if applicable)",     completed: true,  date: d(-30), notes: "N/A — confirmed only UK residency" },
      { name: "Qualifications verified",                   completed: true,  date: d(-28), notes: "L3 Diploma — original sighted" },
      { name: "Health declaration completed",              completed: true,  date: d(-21), notes: "Fit to work — no adjustments needed" },
      { name: "Disqualification declaration signed",       completed: true,  date: d(-14), notes: "Signed and on file" },
      { name: "Safer recruitment interview completed",     completed: true,  date: d(-25), notes: "Panel of 2 — scenarios on safeguarding probed" },
      { name: "Contract issued and signed",                completed: true,  date: d(-7),  notes: "Counter-signed" },
      { name: "Statement of particulars provided",         completed: true,  date: d(-7),  notes: "Within 2 months requirement" },
    ],
    references: [
      { referee: "Patricia Holmes",  organisation: "Bramble House Children's Home", status: "Received", dateReceived: d(-22) },
      { referee: "Dr. James Lockyer", organisation: "Sheffield Hallam University",  status: "Received", dateReceived: d(-21) },
    ],
    dbsApplicationDate: d(-30),
    dbsResultDate: d(-14),
    dbsResult: "Clear",
    interviewers: ["staff_darren", "staff_ryan"],
    redFlagsRaised: [],
    proposedStartDate: d(7),
    recruitedBy: "staff_darren",
  },
  {
    id: "rec2",
    candidateName: "Marcus Okonkwo",
    roleAppliedFor: "Senior Residential Care Worker",
    applicationDate: d(-28),
    status: "Pre-Employment Checks",
    checklistItems: [
      { name: "Application form received",                completed: true,  date: d(-28), notes: "Comprehensive application" },
      { name: "Identity verification (passport/photo ID)", completed: true,  date: d(-21), notes: "British passport verified" },
      { name: "Right to work confirmed",                   completed: true,  date: d(-21), notes: "British citizen" },
      { name: "Address history (5 years) verified",        completed: true,  date: d(-18), notes: "Full history confirmed" },
      { name: "Employment history gaps explained",         completed: true,  date: d(-18), notes: "Clear progression" },
      { name: "Two references received",                   completed: true,  date: d(-10), notes: "Both very positive" },
      { name: "Enhanced DBS with barred list",             completed: true,  date: d(-4),  notes: "Disclosure noted — see red flags" },
      { name: "Overseas police check (if applicable)",     completed: false, date: "",      notes: "N/A" },
      { name: "Qualifications verified",                   completed: true,  date: d(-15), notes: "L3 Diploma + Team Leader cert" },
      { name: "Health declaration completed",              completed: true,  date: d(-10), notes: "" },
      { name: "Disqualification declaration signed",       completed: true,  date: d(-10), notes: "" },
      { name: "Safer recruitment interview completed",     completed: true,  date: d(-14), notes: "Strong scenario responses" },
      { name: "Contract issued and signed",                completed: false, date: "",      notes: "Held pending DBS review outcome" },
      { name: "Statement of particulars provided",         completed: false, date: "",      notes: "" },
    ],
    references: [
      { referee: "Linda Foster",   organisation: "Greenfields Therapeutic Home", status: "Received", dateReceived: d(-11) },
      { referee: "Roger Thompson", organisation: "Westwood Care Group",         status: "Received", dateReceived: d(-10) },
    ],
    dbsApplicationDate: d(-21),
    dbsResultDate: d(-4),
    dbsResult: "Disclosure - Reviewed",
    interviewers: ["staff_darren", "staff_ryan", "staff_anna"],
    redFlagsRaised: [
      "DBS disclosed: minor public order offence aged 19 (12 years ago) — formal risk assessment completed by RM and considered not relevant to safeguarding role",
    ],
    proposedStartDate: d(14),
    recruitedBy: "staff_darren",
  },
  {
    id: "rec3",
    candidateName: "Sofia Martins",
    roleAppliedFor: "Residential Care Worker",
    applicationDate: d(-21),
    status: "DBS Pending",
    checklistItems: [
      { name: "Application form received",                completed: true,  date: d(-21), notes: "" },
      { name: "Identity verification (passport/photo ID)", completed: true,  date: d(-15), notes: "Portuguese passport + share code" },
      { name: "Right to work confirmed",                   completed: true,  date: d(-15), notes: "Settled status — share code valid" },
      { name: "Address history (5 years) verified",        completed: true,  date: d(-12), notes: "UK 4 years, Portugal 1 year" },
      { name: "Employment history gaps explained",         completed: true,  date: d(-12), notes: "" },
      { name: "Two references received",                   completed: true,  date: d(-7),  notes: "" },
      { name: "Enhanced DBS with barred list",             completed: false, date: "",      notes: "Submitted — awaiting result" },
      { name: "Overseas police check (if applicable)",     completed: true,  date: d(-10), notes: "Portuguese police certificate received and translated" },
      { name: "Qualifications verified",                   completed: true,  date: d(-12), notes: "Translated qualifications confirmed equivalent" },
      { name: "Health declaration completed",              completed: true,  date: d(-7),  notes: "" },
      { name: "Disqualification declaration signed",       completed: true,  date: d(-7),  notes: "" },
      { name: "Safer recruitment interview completed",     completed: true,  date: d(-10), notes: "Excellent reflective practice" },
      { name: "Contract issued and signed",                completed: false, date: "",      notes: "Pending DBS" },
      { name: "Statement of particulars provided",         completed: false, date: "",      notes: "" },
    ],
    references: [
      { referee: "Helena Costa",  organisation: "Lar Infantil Lisboa",       status: "Received", dateReceived: d(-8) },
      { referee: "Margaret Wilson", organisation: "Brookside Foster Agency", status: "Received", dateReceived: d(-7) },
    ],
    dbsApplicationDate: d(-9),
    dbsResultDate: "",
    dbsResult: "Pending",
    interviewers: ["staff_darren", "staff_anna"],
    redFlagsRaised: [],
    proposedStartDate: d(21),
    recruitedBy: "staff_darren",
  },
  {
    id: "rec4",
    candidateName: "Daniel O'Sullivan",
    roleAppliedFor: "Residential Care Worker",
    applicationDate: d(-14),
    status: "References",
    checklistItems: [
      { name: "Application form received",                completed: true,  date: d(-14), notes: "" },
      { name: "Identity verification (passport/photo ID)", completed: true,  date: d(-10), notes: "Irish passport" },
      { name: "Right to work confirmed",                   completed: true,  date: d(-10), notes: "Common Travel Area" },
      { name: "Address history (5 years) verified",        completed: false, date: "",      notes: "Outstanding — chasing third address" },
      { name: "Employment history gaps explained",         completed: false, date: "",      notes: "6 month gap 2023 — needs explanation" },
      { name: "Two references received",                   completed: false, date: "",      notes: "1 of 2 received; previous employer has concerns" },
      { name: "Enhanced DBS with barred list",             completed: false, date: "",      notes: "On hold pending reference outcome" },
      { name: "Overseas police check (if applicable)",     completed: false, date: "",      notes: "Irish Garda check requested" },
      { name: "Qualifications verified",                   completed: true,  date: d(-8),  notes: "L2 Diploma confirmed" },
      { name: "Health declaration completed",              completed: false, date: "",      notes: "" },
      { name: "Disqualification declaration signed",       completed: false, date: "",      notes: "" },
      { name: "Safer recruitment interview completed",     completed: true,  date: d(-7),  notes: "Generally strong — some hesitation on safeguarding scenarios" },
      { name: "Contract issued and signed",                completed: false, date: "",      notes: "" },
      { name: "Statement of particulars provided",         completed: false, date: "",      notes: "" },
    ],
    references: [
      { referee: "Brendan Murphy", organisation: "Cherrytree House",   status: "Concerns Raised", dateReceived: d(-3) },
      { referee: "Catherine Daly", organisation: "Hillside Children's Services", status: "Pending", dateReceived: "" },
    ],
    dbsApplicationDate: "",
    dbsResultDate: "",
    dbsResult: "Pending",
    interviewers: ["staff_darren", "staff_ryan"],
    redFlagsRaised: [
      "Reference from Cherrytree House raised concerns about timekeeping and one safeguarding-adjacent incident — RM following up directly with referee",
      "6-month employment gap in 2023 not yet satisfactorily explained on application",
    ],
    proposedStartDate: d(35),
    recruitedBy: "staff_darren",
  },
  {
    id: "rec5",
    candidateName: "Priya Sharma",
    roleAppliedFor: "Bank Residential Care Worker",
    applicationDate: d(-9),
    status: "Interviewing",
    checklistItems: [
      { name: "Application form received",                completed: true,  date: d(-9), notes: "" },
      { name: "Identity verification (passport/photo ID)", completed: true,  date: d(-5), notes: "British passport" },
      { name: "Right to work confirmed",                   completed: true,  date: d(-5), notes: "British citizen" },
      { name: "Address history (5 years) verified",        completed: false, date: "",     notes: "" },
      { name: "Employment history gaps explained",         completed: false, date: "",     notes: "" },
      { name: "Two references received",                   completed: false, date: "",     notes: "Awaiting interview before requesting" },
      { name: "Enhanced DBS with barred list",             completed: false, date: "",     notes: "" },
      { name: "Overseas police check (if applicable)",     completed: false, date: "",     notes: "N/A" },
      { name: "Qualifications verified",                   completed: false, date: "",     notes: "" },
      { name: "Health declaration completed",              completed: false, date: "",     notes: "" },
      { name: "Disqualification declaration signed",       completed: false, date: "",     notes: "" },
      { name: "Safer recruitment interview completed",     completed: false, date: "",     notes: "Interview scheduled in 2 days" },
      { name: "Contract issued and signed",                completed: false, date: "",     notes: "" },
      { name: "Statement of particulars provided",         completed: false, date: "",     notes: "" },
    ],
    references: [
      { referee: "TBC", organisation: "TBC", status: "Pending", dateReceived: "" },
      { referee: "TBC", organisation: "TBC", status: "Pending", dateReceived: "" },
    ],
    dbsApplicationDate: "",
    dbsResultDate: "",
    dbsResult: "Pending",
    interviewers: ["staff_darren", "staff_ryan"],
    redFlagsRaised: [],
    proposedStartDate: d(45),
    recruitedBy: "staff_darren",
  },
  {
    id: "rec6",
    candidateName: "Thomas Reilly",
    roleAppliedFor: "Residential Care Worker",
    applicationDate: d(-3),
    status: "Applying",
    checklistItems: [
      { name: "Application form received",                completed: true,  date: d(-3), notes: "Initial application — to be reviewed by RM" },
      { name: "Identity verification (passport/photo ID)", completed: false, date: "",     notes: "" },
      { name: "Right to work confirmed",                   completed: false, date: "",     notes: "" },
      { name: "Address history (5 years) verified",        completed: false, date: "",     notes: "" },
      { name: "Employment history gaps explained",         completed: false, date: "",     notes: "" },
      { name: "Two references received",                   completed: false, date: "",     notes: "" },
      { name: "Enhanced DBS with barred list",             completed: false, date: "",     notes: "" },
      { name: "Overseas police check (if applicable)",     completed: false, date: "",     notes: "" },
      { name: "Qualifications verified",                   completed: false, date: "",     notes: "" },
      { name: "Health declaration completed",              completed: false, date: "",     notes: "" },
      { name: "Disqualification declaration signed",       completed: false, date: "",     notes: "" },
      { name: "Safer recruitment interview completed",     completed: false, date: "",     notes: "" },
      { name: "Contract issued and signed",                completed: false, date: "",     notes: "" },
      { name: "Statement of particulars provided",         completed: false, date: "",     notes: "" },
    ],
    references: [],
    dbsApplicationDate: "",
    dbsResultDate: "",
    dbsResult: "Pending",
    interviewers: [],
    redFlagsRaised: [],
    proposedStartDate: "",
    recruitedBy: "staff_darren",
  },
];

/* ── component ─────────────────────────────────────────────────────────── */

export default function SaferRecruitmentTrackerPage() {
  const [data] = useState<RecruitmentRecord[]>(SEED);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("applicationDate");

  const stats = useMemo(() => {
    const active = data.filter((r) => r.status !== "Employed" && r.status !== "Withdrawn");
    return {
      activeApplications: active.length,
      awaitingDbs: data.filter((r) => r.dbsResult === "Pending" && r.status !== "Withdrawn" && r.status !== "Applying").length,
      awaitingRefs: data.filter((r) => r.references.some((ref) => ref.status === "Pending") && r.status !== "Withdrawn").length,
      readyToStart: data.filter((r) => r.status === "Onboarding").length,
    };
  }, [data]);

  const flaggedRecords = useMemo(
    () => data.filter((r) => r.redFlagsRaised.length > 0 || r.references.some((ref) => ref.status === "Concerns Raised")),
    [data],
  );

  const filtered = useMemo(() => {
    let list = [...data];
    if (filterStatus !== "all") list = list.filter((r) => r.status === filterStatus);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.candidateName.toLowerCase().includes(q) ||
          r.roleAppliedFor.toLowerCase().includes(q),
      );
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "name":          return a.candidateName.localeCompare(b.candidateName);
        case "status":        return a.status.localeCompare(b.status);
        case "proposedStart": return (a.proposedStartDate || "9999").localeCompare(b.proposedStartDate || "9999");
        default:              return b.applicationDate.localeCompare(a.applicationDate);
      }
    });
    return list;
  }, [data, filterStatus, search, sortBy]);

  const exportCols: ExportColumn<RecruitmentRecord>[] = [
    { header: "Candidate",          accessor: (r: RecruitmentRecord) => r.candidateName },
    { header: "Role",               accessor: (r: RecruitmentRecord) => r.roleAppliedFor },
    { header: "Application Date",   accessor: (r: RecruitmentRecord) => r.applicationDate },
    { header: "Status",             accessor: (r: RecruitmentRecord) => r.status },
    { header: "Checklist Complete", accessor: (r: RecruitmentRecord) => `${r.checklistItems.filter((c) => c.completed).length}/${r.checklistItems.length}` },
    { header: "References",         accessor: (r: RecruitmentRecord) => r.references.map((ref) => `${ref.referee} (${ref.status})`).join("; ") },
    { header: "DBS Applied",        accessor: (r: RecruitmentRecord) => r.dbsApplicationDate },
    { header: "DBS Result Date",    accessor: (r: RecruitmentRecord) => r.dbsResultDate },
    { header: "DBS Result",         accessor: (r: RecruitmentRecord) => r.dbsResult },
    { header: "Interviewers",       accessor: (r: RecruitmentRecord) => r.interviewers.map(getStaffName).join(", ") },
    { header: "Red Flags",          accessor: (r: RecruitmentRecord) => r.redFlagsRaised.join(" | ") },
    { header: "Proposed Start",     accessor: (r: RecruitmentRecord) => r.proposedStartDate },
    { header: "Recruited By",       accessor: (r: RecruitmentRecord) => getStaffName(r.recruitedBy) },
  ];

  return (
    <PageShell
      title="Safer Recruitment Tracker"
      subtitle="Schedule 2 & Reg 32 — end-to-end vetting and onboarding compliance for new staff"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={data} columns={exportCols} filename="safer-recruitment-tracker" />
          <PrintButton title="Safer Recruitment Tracker" />
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        {/* summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { l: "Active Applications", v: stats.activeApplications, icon: Users,        c: "text-blue-600" },
            { l: "Awaiting DBS",        v: stats.awaitingDbs,        icon: Clock,        c: stats.awaitingDbs > 0 ? "text-amber-600" : "text-gray-400" },
            { l: "Awaiting References", v: stats.awaitingRefs,       icon: FileWarning,  c: stats.awaitingRefs > 0 ? "text-amber-600" : "text-gray-400" },
            { l: "Ready to Start",      v: stats.readyToStart,       icon: CheckCircle2, c: "text-green-600" },
          ].map((s) => (
            <div key={s.l} className="rounded-lg border bg-white p-3 text-center">
              <s.icon className={cn("mx-auto h-5 w-5 mb-1", s.c)} />
              <p className="text-2xl font-bold">{s.v}</p>
              <p className="text-xs text-muted-foreground">{s.l}</p>
            </div>
          ))}
        </div>

        {/* alerts */}
        {flaggedRecords.length > 0 && (
          <div className="rounded-lg border-l-4 border-red-400 bg-red-50 p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-red-900">Red flags requiring registered manager review</h3>
                <ul className="mt-2 space-y-1 text-sm text-red-900">
                  {flaggedRecords.map((r) => (
                    <li key={r.id}>
                      <strong>{r.candidateName}</strong> ({r.roleAppliedFor}) —{" "}
                      {[
                        ...r.redFlagsRaised,
                        ...r.references
                          .filter((ref) => ref.status === "Concerns Raised")
                          .map((ref) => `Reference concerns from ${ref.referee} (${ref.organisation})`),
                      ].join("; ")}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* filters / sort */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search candidate or role…"
              className="w-full rounded-md border pl-8 pr-3 py-2 text-sm"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="Applying">Applying</SelectItem>
              <SelectItem value="Interviewing">Interviewing</SelectItem>
              <SelectItem value="References">References</SelectItem>
              <SelectItem value="DBS Pending">DBS Pending</SelectItem>
              <SelectItem value="Pre-Employment Checks">Pre-Employment Checks</SelectItem>
              <SelectItem value="Onboarding">Onboarding</SelectItem>
              <SelectItem value="Employed">Employed</SelectItem>
              <SelectItem value="Withdrawn">Withdrawn</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1 text-sm">
            <ArrowUpDown className="h-4 w-4" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded border px-2 py-1.5 text-sm"
            >
              <option value="applicationDate">Application Date</option>
              <option value="name">Candidate Name</option>
              <option value="status">Status</option>
              <option value="proposedStart">Proposed Start</option>
            </select>
          </div>
        </div>

        {/* card list */}
        {filtered.map((rec) => {
          const total = rec.checklistItems.length;
          const done = rec.checklistItems.filter((c) => c.completed).length;
          const pct = Math.round((done / total) * 100);
          const StatusIcon = STATUS_META[rec.status].icon;
          const hasFlags = rec.redFlagsRaised.length > 0 || rec.references.some((ref) => ref.status === "Concerns Raised");

          return (
            <div
              key={rec.id}
              className={cn(
                "rounded-lg border bg-white overflow-hidden",
                hasFlags && "border-red-300",
              )}
            >
              <button
                onClick={() => setExpandedId(expandedId === rec.id ? null : rec.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <StatusIcon className="h-5 w-5 text-brand" />
                  <div className="text-left">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{rec.candidateName}</h3>
                      <span className="text-xs text-muted-foreground">{rec.roleAppliedFor}</span>
                      <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", STATUS_META[rec.status].colour)}>
                        {rec.status}
                      </span>
                      <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", DBS_META[rec.dbsResult])}>
                        DBS: {rec.dbsResult}
                      </span>
                      {hasFlags && (
                        <span className="rounded-full bg-red-100 text-red-700 px-2 py-0.5 text-xs font-medium inline-flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" /> Review required
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Applied {rec.applicationDate} · {done}/{total} checks ({pct}%)
                      {rec.proposedStartDate && ` · Proposed start ${rec.proposedStartDate}`}
                      {" "}· Recruited by {getStaffName(rec.recruitedBy)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-2 rounded-full bg-gray-100 overflow-hidden hidden sm:block">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        pct === 100 ? "bg-green-400" : pct >= 50 ? "bg-blue-400" : "bg-amber-400",
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  {expandedId === rec.id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </div>
              </button>

              {expandedId === rec.id && (
                <div className="border-t p-4 space-y-4">
                  {/* red flags */}
                  {rec.redFlagsRaised.length > 0 && (
                    <div className="rounded border border-red-200 bg-red-50 p-3">
                      <h4 className="text-sm font-semibold text-red-900 mb-1 inline-flex items-center gap-1">
                        <AlertTriangle className="h-4 w-4" /> Red flags raised
                      </h4>
                      <ul className="list-disc pl-5 text-sm text-red-900 space-y-1">
                        {rec.redFlagsRaised.map((f, i) => <li key={i}>{f}</li>)}
                      </ul>
                    </div>
                  )}

                  {/* DBS panel */}
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="rounded border bg-gray-50 p-3">
                      <h4 className="text-sm font-semibold mb-2 inline-flex items-center gap-1">
                        <ShieldCheck className="h-4 w-4 text-brand" /> DBS check
                      </h4>
                      <dl className="text-xs space-y-1">
                        <div className="flex justify-between"><dt className="text-muted-foreground">Applied</dt><dd>{rec.dbsApplicationDate || "—"}</dd></div>
                        <div className="flex justify-between"><dt className="text-muted-foreground">Result date</dt><dd>{rec.dbsResultDate || "—"}</dd></div>
                        <div className="flex justify-between items-center">
                          <dt className="text-muted-foreground">Outcome</dt>
                          <dd>
                            <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", DBS_META[rec.dbsResult])}>
                              {rec.dbsResult}
                            </span>
                          </dd>
                        </div>
                      </dl>
                    </div>

                    {/* interview panel */}
                    <div className="rounded border bg-gray-50 p-3">
                      <h4 className="text-sm font-semibold mb-2 inline-flex items-center gap-1">
                        <Users className="h-4 w-4 text-brand" /> Interview panel
                      </h4>
                      {rec.interviewers.length === 0 ? (
                        <p className="text-xs text-muted-foreground">Not yet scheduled</p>
                      ) : (
                        <ul className="text-xs space-y-1">
                          {rec.interviewers.map((id) => (
                            <li key={id}>{getStaffName(id)}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  {/* references */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2 inline-flex items-center gap-1">
                      <FileCheck className="h-4 w-4 text-brand" /> References
                    </h4>
                    {rec.references.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No references requested yet</p>
                    ) : (
                      <div className="space-y-2">
                        {rec.references.map((ref, i) => (
                          <div
                            key={i}
                            className={cn(
                              "rounded border p-3 flex items-start justify-between gap-2",
                              ref.status === "Concerns Raised" && "border-red-200 bg-red-50",
                            )}
                          >
                            <div>
                              <p className="text-sm font-medium">{ref.referee}</p>
                              <p className="text-xs text-muted-foreground">{ref.organisation}</p>
                              {ref.dateReceived && <p className="text-xs text-muted-foreground">Received {ref.dateReceived}</p>}
                            </div>
                            <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium flex-shrink-0", REFERENCE_META[ref.status])}>
                              {ref.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* checklist */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2 inline-flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4 text-brand" /> Pre-employment checklist
                    </h4>
                    <div className="space-y-2">
                      {rec.checklistItems.map((item, i) => {
                        const Icon = item.completed ? CheckCircle2 : Circle;
                        return (
                          <div
                            key={i}
                            className={cn(
                              "rounded border p-3 flex items-start justify-between gap-2",
                              item.completed ? "" : "bg-gray-50",
                            )}
                          >
                            <div className="flex items-start gap-2">
                              <Icon className={cn("h-4 w-4 mt-0.5 flex-shrink-0", item.completed ? "text-green-600" : "text-gray-400")} />
                              <div>
                                <p className="text-sm font-medium">{item.name}</p>
                                {item.notes && <p className="text-xs text-muted-foreground mt-0.5 italic">{item.notes}</p>}
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <span className={cn(
                                "rounded-full px-2 py-0.5 text-xs font-medium",
                                item.completed ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700",
                              )}>
                                {item.completed ? "Done" : "Outstanding"}
                              </span>
                              {item.date && <p className="text-xs text-muted-foreground mt-0.5">{item.date}</p>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* regulatory note */}
        <div className="rounded-lg border-l-4 border-blue-400 bg-blue-50 p-4 text-sm text-blue-900 space-y-2">
          <div>
            <strong>Schedule 2 — Information about persons working at the home</strong> — A children&apos;s home must hold the prescribed information for every staff member before they begin work, including identity, right to work, qualifications, full employment history, two written references, an enhanced DBS with barred-list check, and a written disqualification declaration.
          </div>
          <div>
            <strong>Regulation 32 — Fitness of workers</strong> — The registered person must only employ individuals who have the qualifications, skills and experience necessary for the work, are of integrity and good character, and are physically and mentally fit for the role. Any disclosures or concerns must be risk-assessed and recorded.
          </div>
          <div>
            <strong>KCSIE 2024</strong> — Safer recruitment principles apply: at least one panel member trained in safer recruitment, scenario-based interviewing on safeguarding, and a documented rationale for any decision to proceed where information has been disclosed.
          </div>
        </div>

        {/* standard checklist reference (printed footer aid) */}
        <p className="text-xs text-muted-foreground">
          Standard pre-employment checklist applied to all candidates: {STANDARD_CHECKLIST.join(" · ")}.
        </p>
      </div>
    </PageShell>
  );
}

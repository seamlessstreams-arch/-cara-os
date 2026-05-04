"use client";

import { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  Gavel,
  ArrowUpDown,
  Search,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  Lock,
  Users,
  FileSearch,
  ExternalLink,
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

type ConcernType =
  | "Practice concerns"
  | "Safeguarding"
  | "Financial"
  | "Health & safety"
  | "Behaviour"
  | "Discrimination"
  | "Bullying";

type ReporterCategory = "Staff member" | "Anonymous" | "Parent" | "Professional";

type Outcome =
  | "Substantiated"
  | "Partially Substantiated"
  | "Unsubstantiated"
  | "Inconclusive"
  | "Ongoing";

type InvestigationStatus = "Active" | "Closed";

interface InvestigationStage {
  stage: string;
  completed: boolean;
  completionDate: string;
  notes: string;
}

interface WBInvestigation {
  id: string;
  dateRaised: string;
  concernType: ConcernType;
  summaryOfConcern: string;
  reporterCategory: ReporterCategory;
  reporterAnonymous: boolean;
  investigationLead: string;
  independent: boolean;
  externalInvestigator: string;
  stagesCompleted: InvestigationStage[];
  evidenceGathered: string[];
  peopleInterviewed: number;
  outcome: Outcome;
  findings: string;
  actionsImplemented: string[];
  policyReviewArising: string;
  referralsMade: string[];
  reporterFedBack: boolean;
  feedbackDate: string;
  learningPoints: string[];
  status: InvestigationStatus;
  closedDate: string;
  dataProtectionMaintained: boolean;
}

/* ── helpers ───────────────────────────────────────────────────────────── */

const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

/* ── seed ──────────────────────────────────────────────────────────────── */

const SEED: WBInvestigation[] = [
  {
    id: "wbi1",
    dateRaised: d(-42),
    concernType: "Safeguarding",
    summaryOfConcern:
      "Concern raised about a member of staff using a non-approved physical intervention with a young person during a low-level incident.",
    reporterCategory: "Staff member",
    reporterAnonymous: false,
    investigationLead: "staff_darren",
    independent: false,
    externalInvestigator: "",
    stagesCompleted: [
      { stage: "Concern logged & risk assessed", completed: true, completionDate: d(-42), notes: "Immediate suspension of staff pending investigation. LADO consulted day 1." },
      { stage: "Investigation plan agreed with LADO", completed: true, completionDate: d(-41), notes: "Scope, timescales and protective measures agreed." },
      { stage: "Evidence gathered & witnesses interviewed", completed: true, completionDate: d(-30), notes: "CCTV reviewed; witness statements taken; YP voice captured via advocate." },
      { stage: "Findings drafted & shared with subject", completed: true, completionDate: d(-22), notes: "Right of reply exercised; written response added to file." },
      { stage: "Outcome panel & decision", completed: true, completionDate: d(-15), notes: "Allegation partially substantiated — improper technique, no malicious intent." },
      { stage: "Actions implemented & file closed", completed: true, completionDate: d(-10), notes: "Retraining, supervision plan, policy clarification issued." },
    ],
    evidenceGathered: [
      "CCTV footage (corridor and lounge)",
      "Written statements from three staff witnesses",
      "Young person's account (via independent advocate)",
      "Restraint training records",
      "Body map and post-incident medical check",
    ],
    peopleInterviewed: 6,
    outcome: "Partially Substantiated",
    findings:
      "The technique used fell outside the home's approved physical intervention framework. There was no evidence of malicious intent or injury. The staff member acknowledged the deviation and engaged constructively with the process.",
    actionsImplemented: [
      "Mandatory re-accreditation in approved physical intervention",
      "Three-month enhanced supervision plan",
      "Refresher training delivered to whole team",
      "Update to physical intervention guidance with worked examples",
    ],
    policyReviewArising:
      "Physical intervention policy reviewed — added clearer guidance on de-escalation thresholds and post-incident debrief expectations.",
    referralsMade: ["LADO (consulted, no threshold for criminal referral)", "Ofsted (Reg 40 notification)"],
    reporterFedBack: true,
    feedbackDate: d(-9),
    learningPoints: [
      "Reporter feedback loop closed within 48 hours of outcome",
      "Whole-team learning briefing delivered without identifying individuals",
      "Independent advocacy was critical to capturing young person's voice",
    ],
    status: "Closed",
    closedDate: d(-10),
    dataProtectionMaintained: true,
  },
  {
    id: "wbi2",
    dateRaised: d(-18),
    concernType: "Practice concerns",
    summaryOfConcern:
      "Concern that night-time supervision records on a particular shift pattern may not accurately reflect checks carried out.",
    reporterCategory: "Staff member",
    reporterAnonymous: false,
    investigationLead: "staff_ryan",
    independent: false,
    externalInvestigator: "",
    stagesCompleted: [
      { stage: "Concern logged & risk assessed", completed: true, completionDate: d(-18), notes: "Immediate cover changes; night audit instated." },
      { stage: "Investigation plan agreed", completed: true, completionDate: d(-17), notes: "Scope: 30-day record review and CCTV cross-check." },
      { stage: "Evidence gathered & witnesses interviewed", completed: true, completionDate: d(-8), notes: "Records, CCTV and YP feedback triangulated." },
      { stage: "Findings drafted & shared with subjects", completed: false, completionDate: "", notes: "Drafting in progress; right of reply window opens shortly." },
      { stage: "Outcome panel & decision", completed: false, completionDate: "", notes: "" },
      { stage: "Actions implemented & file closed", completed: false, completionDate: "", notes: "" },
    ],
    evidenceGathered: [
      "Night check logs (30-day window)",
      "CCTV review (corridor & communal areas)",
      "Young person feedback (where appropriate)",
      "Shift handover notes",
    ],
    peopleInterviewed: 4,
    outcome: "Ongoing",
    findings:
      "Initial review indicates inconsistencies between recorded check times and CCTV-evidenced movement. Investigation continuing to establish whether this reflects record-keeping practice or actual non-completion of checks.",
    actionsImplemented: [
      "Interim: nightly audit by Deputy with sign-off",
      "Interim: additional waking-night cover on affected pattern",
    ],
    policyReviewArising: "Pending outcome — likely review of night supervision recording and audit cadence.",
    referralsMade: ["Ofsted (Reg 40 notification — practice concern)"],
    reporterFedBack: true,
    feedbackDate: d(-15),
    learningPoints: [
      "Early protective measures separated investigation from day-to-day operations",
      "Reporter kept informed weekly without compromising confidentiality",
    ],
    status: "Active",
    closedDate: "",
    dataProtectionMaintained: true,
  },
  {
    id: "wbi3",
    dateRaised: d(-95),
    concernType: "Financial",
    summaryOfConcern:
      "Anonymous concern that a small number of petty cash entries lacked supporting receipts over a three-month period.",
    reporterCategory: "Anonymous",
    reporterAnonymous: true,
    investigationLead: "staff_darren",
    independent: true,
    externalInvestigator: "Independent Finance Consultant — Greenfield Audit Ltd",
    stagesCompleted: [
      { stage: "Concern logged & risk assessed", completed: true, completionDate: d(-95), notes: "External independent reviewer commissioned given anonymity and subject area." },
      { stage: "Investigation plan agreed", completed: true, completionDate: d(-93), notes: "12-month transaction sample agreed." },
      { stage: "Evidence gathered & interviews", completed: true, completionDate: d(-80), notes: "All petty cash holders interviewed; bank reconciliations cross-checked." },
      { stage: "Findings drafted", completed: true, completionDate: d(-75), notes: "No evidence of misappropriation; process gaps identified." },
      { stage: "Outcome panel & decision", completed: true, completionDate: d(-72), notes: "Unsubstantiated as wrongdoing; valid process improvement concern." },
      { stage: "Actions implemented & file closed", completed: true, completionDate: d(-70), notes: "New dual-signature policy embedded and audited." },
    ],
    evidenceGathered: [
      "Petty cash log (12-month review)",
      "Receipts and reconciliation records",
      "Bank statements cross-referenced",
      "Interviews with all petty cash holders",
    ],
    peopleInterviewed: 5,
    outcome: "Unsubstantiated",
    findings:
      "No evidence of financial misappropriation. A small number of low-value entries (all under £5) lacked receipts but were supported by reasonable explanations. The concern was framed as a legitimate process improvement.",
    actionsImplemented: [
      "Dual-signature declaration introduced for any receipt-less transaction",
      "Monthly reconciliation now signed off by RM and Deputy",
      "Annual external finance spot-check added to assurance schedule",
    ],
    policyReviewArising: "Petty cash and small purchases policy updated and re-issued with worked examples.",
    referralsMade: [],
    reporterFedBack: true,
    feedbackDate: d(-68),
    learningPoints: [
      "Independent reviewer increased credibility of the outcome",
      "Anonymous concerns can still be fed back via posted summary on staff board",
      "Treating process concerns positively supports a speak-up culture",
    ],
    status: "Closed",
    closedDate: d(-70),
    dataProtectionMaintained: true,
  },
  {
    id: "wbi4",
    dateRaised: d(-55),
    concernType: "Bullying",
    summaryOfConcern:
      "Concern raised by a colleague that another staff member was experiencing persistent undermining behaviour during team handovers.",
    reporterCategory: "Staff member",
    reporterAnonymous: false,
    investigationLead: "staff_darren",
    independent: true,
    externalInvestigator: "External HR Consultant — Northstar People Ltd",
    stagesCompleted: [
      { stage: "Concern logged & risk assessed", completed: true, completionDate: d(-55), notes: "External HR consultant commissioned to ensure independence." },
      { stage: "Investigation plan agreed", completed: true, completionDate: d(-54), notes: "Bullying & dignity-at-work framework applied." },
      { stage: "Evidence gathered & interviews", completed: true, completionDate: d(-40), notes: "Six staff interviewed; handover recordings/notes reviewed." },
      { stage: "Findings drafted & shared", completed: true, completionDate: d(-32), notes: "Right of reply exercised by both parties." },
      { stage: "Outcome panel & decision", completed: true, completionDate: d(-25), notes: "Behaviour did not meet bullying threshold; communication issues identified." },
      { stage: "Actions implemented & file closed", completed: true, completionDate: d(-20), notes: "Mediation completed; handover protocol revised." },
    ],
    evidenceGathered: [
      "Handover notes and recordings",
      "Six staff interviews",
      "Wellbeing check-in records",
      "Anonymous team culture survey results",
    ],
    peopleInterviewed: 6,
    outcome: "Inconclusive",
    findings:
      "The investigation did not find that the threshold for bullying was met. It did identify communication and handover practice issues that had a cumulative impact on the affected colleague. Both parties engaged constructively with mediation.",
    actionsImplemented: [
      "Facilitated mediation between the two staff (independent mediator)",
      "Revised handover protocol — structured, time-boxed, written summary",
      "Dignity-at-work refresher delivered to whole team",
      "Six-month follow-up wellbeing review for both parties",
    ],
    policyReviewArising:
      "Dignity-at-work policy reviewed; new escalation route added so concerns can be raised earlier without formal grievance.",
    referralsMade: [],
    reporterFedBack: true,
    feedbackDate: d(-19),
    learningPoints: [
      "Earlier intervention via informal route would likely have resolved without formal investigation",
      "Independent investigator essential where parties work in same small team",
      "Aftercare and follow-up reviews protect against re-emergence",
    ],
    status: "Closed",
    closedDate: d(-20),
    dataProtectionMaintained: true,
  },
];

/* ── meta ──────────────────────────────────────────────────────────────── */

const OUTCOME_META: Record<Outcome, { colour: string }> = {
  "Substantiated":            { colour: "bg-red-100 text-red-700" },
  "Partially Substantiated":  { colour: "bg-orange-100 text-orange-700" },
  "Unsubstantiated":          { colour: "bg-green-100 text-green-700" },
  "Inconclusive":             { colour: "bg-gray-100 text-gray-700" },
  "Ongoing":                  { colour: "bg-amber-100 text-amber-700" },
};

const STATUS_META: Record<InvestigationStatus, { colour: string }> = {
  "Active": { colour: "bg-amber-100 text-amber-700" },
  "Closed": { colour: "bg-green-100 text-green-700" },
};

const CONCERN_TYPES: ConcernType[] = [
  "Practice concerns",
  "Safeguarding",
  "Financial",
  "Health & safety",
  "Behaviour",
  "Discrimination",
  "Bullying",
];

/* ── component ─────────────────────────────────────────────────────────── */

export default function WhistleblowingInvestigationsPage() {
  const [data] = useState<WBInvestigation[]>(SEED);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [sortBy, setSortBy] = useState("date");

  const stats = useMemo(() => {
    const cutoff = d(-365);
    const closedInWindow = data.filter(
      (r) => r.status === "Closed" && r.closedDate && r.closedDate >= cutoff
    );
    const decided = data.filter((r) => r.outcome !== "Ongoing");
    const substantiated = decided.filter(
      (r) => r.outcome === "Substantiated" || r.outcome === "Partially Substantiated"
    );
    const externalLed = data.filter((r) => r.independent);

    return {
      active: data.filter((r) => r.status === "Active").length,
      closedYear: closedInWindow.length,
      substantiatedRate:
        decided.length === 0
          ? 0
          : Math.round((substantiated.length / decided.length) * 100),
      externalPct:
        data.length === 0
          ? 0
          : Math.round((externalLed.length / data.length) * 100),
    };
  }, [data]);

  const filtered = useMemo(() => {
    let list = [...data];
    if (filterStatus !== "all") list = list.filter((r) => r.status === filterStatus);
    if (filterType !== "all") list = list.filter((r) => r.concernType === filterType);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.summaryOfConcern.toLowerCase().includes(q) ||
          r.concernType.toLowerCase().includes(q) ||
          r.findings.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "type":
          return a.concernType.localeCompare(b.concernType);
        case "outcome":
          return a.outcome.localeCompare(b.outcome);
        case "status":
          return a.status.localeCompare(b.status);
        default:
          return b.dateRaised.localeCompare(a.dateRaised);
      }
    });
    return list;
  }, [data, filterStatus, filterType, search, sortBy]);

  const exportCols: ExportColumn<WBInvestigation>[] = [
    { header: "Date Raised",        accessor: (r: WBInvestigation) => r.dateRaised },
    { header: "Concern Type",       accessor: (r: WBInvestigation) => r.concernType },
    { header: "Summary",            accessor: (r: WBInvestigation) => r.summaryOfConcern },
    { header: "Reporter Category",  accessor: (r: WBInvestigation) => r.reporterCategory },
    { header: "Anonymous",          accessor: (r: WBInvestigation) => (r.reporterAnonymous ? "Yes" : "No") },
    { header: "Investigation Lead", accessor: (r: WBInvestigation) => (r.independent ? r.externalInvestigator : getStaffName(r.investigationLead)) },
    { header: "Independent",        accessor: (r: WBInvestigation) => (r.independent ? "Yes" : "No") },
    { header: "People Interviewed", accessor: (r: WBInvestigation) => r.peopleInterviewed },
    { header: "Outcome",            accessor: (r: WBInvestigation) => r.outcome },
    { header: "Findings",           accessor: (r: WBInvestigation) => r.findings },
    { header: "Referrals",          accessor: (r: WBInvestigation) => r.referralsMade.join("; ") || "None" },
    { header: "Reporter Fed Back",  accessor: (r: WBInvestigation) => (r.reporterFedBack ? r.feedbackDate : "No") },
    { header: "Status",             accessor: (r: WBInvestigation) => r.status },
    { header: "Closed Date",        accessor: (r: WBInvestigation) => r.closedDate || "—" },
    { header: "Data Protection",    accessor: (r: WBInvestigation) => (r.dataProtectionMaintained ? "Maintained" : "Breach") },
  ];

  return (
    <PageShell
      title="Whistleblowing Investigations"
      subtitle="Investigations arising from whistleblowing concerns — distinct from the concerns register"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={data} columns={exportCols} filename="whistleblowing-investigations" />
          <PrintButton title="Whistleblowing Investigations" />
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        {/* confidentiality banner */}
        <div className="rounded-lg border-l-4 border-purple-400 bg-purple-50 p-3 flex items-start gap-2">
          <Lock className="h-5 w-5 text-purple-700 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-purple-900">
            <strong>Confidential record.</strong> Names of reporters, subjects and young people are anonymised on this register.
            Full identifiable case files are held securely and accessible only to the RM, RI and the named investigator. Reporter identity is protected under the Public Interest Disclosure Act 1998.
          </div>
        </div>

        {/* stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { l: "Active Investigations",   v: stats.active,                       icon: FileSearch,    c: "text-amber-600" },
            { l: "Closed (12 months)",      v: stats.closedYear,                   icon: CheckCircle2,  c: "text-green-600" },
            { l: "Substantiated Rate",      v: `${stats.substantiatedRate}%`,      icon: AlertTriangle, c: "text-orange-600" },
            { l: "External-led %",          v: `${stats.externalPct}%`,            icon: ShieldCheck,   c: "text-blue-600" },
          ].map((s) => (
            <div key={s.l} className="rounded-lg border bg-white p-3 text-center">
              <s.icon className={cn("mx-auto h-5 w-5 mb-1", s.c)} />
              <p className="text-2xl font-bold">{s.v}</p>
              <p className="text-xs text-muted-foreground">{s.l}</p>
            </div>
          ))}
        </div>

        {stats.active > 0 && (
          <div className="rounded-lg border-l-4 border-amber-400 bg-amber-50 p-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
            <p className="text-sm text-amber-900">
              <strong>{stats.active} active investigation{stats.active > 1 ? "s" : ""}</strong> in progress —
              ensure protective measures, reporter feedback and weekly RI oversight are maintained.
            </p>
          </div>
        )}

        {/* filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search investigations…"
              className="w-full rounded-md border pl-8 pr-3 py-2 text-sm"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Closed">Closed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Concern type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Concern Types</SelectItem>
              {CONCERN_TYPES.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1 text-sm">
            <ArrowUpDown className="h-4 w-4" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded border px-2 py-1.5 text-sm"
            >
              <option value="date">Date Raised</option>
              <option value="type">Concern Type</option>
              <option value="outcome">Outcome</option>
              <option value="status">Status</option>
            </select>
          </div>
        </div>

        {/* cards */}
        {filtered.map((inv) => {
          const isOpen = expandedId === inv.id;
          const stagesDone = inv.stagesCompleted.filter((s) => s.completed).length;
          const stagesTotal = inv.stagesCompleted.length;
          return (
            <div key={inv.id} className="rounded-lg border bg-white overflow-hidden">
              <button
                onClick={() => setExpandedId(isOpen ? null : inv.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <Gavel className="h-5 w-5 text-brand" />
                  <div className="text-left">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{inv.concernType}</h3>
                      <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", STATUS_META[inv.status].colour)}>
                        {inv.status}
                      </span>
                      <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", OUTCOME_META[inv.outcome].colour)}>
                        Outcome: {inv.outcome}
                      </span>
                      {inv.independent && (
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                          External-led
                        </span>
                      )}
                      {inv.reporterAnonymous && (
                        <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                          Anonymous reporter
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Raised {inv.dateRaised} · Stages {stagesDone}/{stagesTotal} · {inv.summaryOfConcern.slice(0, 90)}…
                    </p>
                  </div>
                </div>
                {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </button>

              {isOpen && (
                <div className="border-t p-4 space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div><span className="text-muted-foreground">Reporter:</span> {inv.reporterAnonymous ? "Anonymous" : inv.reporterCategory}</div>
                    <div><span className="text-muted-foreground">Lead:</span> {inv.independent ? inv.externalInvestigator : getStaffName(inv.investigationLead)}</div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">Interviewed:</span> {inv.peopleInterviewed}
                    </div>
                    <div className="flex items-center gap-1">
                      <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">Data protection:</span>{" "}
                      {inv.dataProtectionMaintained ? "Maintained" : "Breach noted"}
                    </div>
                  </div>

                  {/* concern */}
                  <div className="rounded-lg bg-gray-50 p-3">
                    <h4 className="text-sm font-semibold mb-1">Anonymised summary of concern</h4>
                    <p className="text-sm text-muted-foreground">{inv.summaryOfConcern}</p>
                  </div>

                  {/* stages */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Investigation stages</h4>
                    <div className="space-y-2 border-l-2 border-gray-200 pl-4">
                      {inv.stagesCompleted.map((s, i) => (
                        <div key={i} className="relative">
                          <div
                            className={cn(
                              "absolute -left-[21px] top-1 h-3 w-3 rounded-full border-2 bg-white",
                              s.completed ? "border-green-500" : "border-gray-300"
                            )}
                          />
                          <div className="flex items-center gap-2">
                            <p className={cn("text-sm font-medium", !s.completed && "text-muted-foreground")}>
                              {s.stage}
                            </p>
                            {s.completed && (
                              <span className="text-xs text-green-700">✓ {s.completionDate}</span>
                            )}
                          </div>
                          {s.notes && <p className="text-xs text-muted-foreground">{s.notes}</p>}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* evidence */}
                  {inv.evidenceGathered.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-1">Evidence gathered</h4>
                      <ul className="list-disc list-inside text-sm text-muted-foreground">
                        {inv.evidenceGathered.map((e, i) => <li key={i}>{e}</li>)}
                      </ul>
                    </div>
                  )}

                  {/* outcome / findings */}
                  <div className={cn("rounded-lg p-3", OUTCOME_META[inv.outcome].colour)}>
                    <h4 className="text-sm font-semibold mb-1">Outcome: {inv.outcome}</h4>
                    <p className="text-sm">{inv.findings}</p>
                  </div>

                  {/* actions */}
                  {inv.actionsImplemented.length > 0 && (
                    <div className="rounded-lg bg-blue-50 p-3">
                      <h4 className="text-sm font-semibold text-blue-800 mb-1">Actions implemented</h4>
                      <ul className="list-disc list-inside text-sm text-blue-900">
                        {inv.actionsImplemented.map((a, i) => <li key={i}>{a}</li>)}
                      </ul>
                    </div>
                  )}

                  {/* policy review */}
                  {inv.policyReviewArising && (
                    <div className="rounded-lg bg-amber-50 p-3">
                      <h4 className="text-sm font-semibold text-amber-800 mb-1">Policy review arising</h4>
                      <p className="text-sm text-amber-900">{inv.policyReviewArising}</p>
                    </div>
                  )}

                  {/* referrals */}
                  {inv.referralsMade.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-1 flex items-center gap-1">
                        <ExternalLink className="h-4 w-4" /> External referrals
                      </h4>
                      <ul className="list-disc list-inside text-sm text-muted-foreground">
                        {inv.referralsMade.map((r, i) => <li key={i}>{r}</li>)}
                      </ul>
                    </div>
                  )}

                  {/* feedback to reporter */}
                  <div className="rounded-lg bg-green-50 p-3">
                    <h4 className="text-sm font-semibold text-green-800 mb-1">Reporter feedback</h4>
                    <p className="text-sm text-green-900">
                      {inv.reporterFedBack
                        ? `Reporter fed back on ${inv.feedbackDate} — outcome and learning shared in line with confidentiality.`
                        : "Reporter feedback not yet completed — must be closed within 5 working days of outcome."}
                    </p>
                  </div>

                  {/* learning */}
                  {inv.learningPoints.length > 0 && (
                    <div className="rounded-lg bg-indigo-50 p-3">
                      <h4 className="text-sm font-semibold text-indigo-800 mb-1">Learning points</h4>
                      <ul className="list-disc list-inside text-sm text-indigo-900">
                        {inv.learningPoints.map((l, i) => <li key={i}>{l}</li>)}
                      </ul>
                    </div>
                  )}

                  {inv.status === "Closed" && inv.closedDate && (
                    <p className="text-xs text-muted-foreground">
                      File closed {inv.closedDate}. Retained securely for the period required by the home's records-retention schedule.
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* regulatory note */}
        <div className="rounded-lg border-l-4 border-blue-400 bg-blue-50 p-4 text-sm text-blue-900">
          <strong>Regulatory framework</strong> — Investigations triggered by whistleblowing must be conducted promptly, fairly
          and confidentially. The <em>Public Interest Disclosure Act 1998</em> protects qualifying disclosures from detrimental
          treatment. <em>Children's Homes Regulations 2015 (Quality Standard 5 — Protection of Children)</em> requires the
          registered person to investigate concerns about staff and practice, take appropriate action and learn from outcomes.
          <em> Working Together to Safeguard Children 2023</em> requires inter-agency cooperation, including LADO consultation,
          where allegations relate to a person who works with children.
        </div>
      </div>
    </PageShell>
  );
}

"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { PrintButton } from "@/components/ui/print-button";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getYPName, getStaffName } from "@/lib/seed-data";
import {
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  AlertTriangle,
  CheckCircle2,
  FileSearch,
  Gauge,
  ClipboardList,
  ListChecks,
  CalendarClock,
  MessageCircle,
  ShieldAlert,
} from "lucide-react";

/* ─── date helper ─── */
const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

/* ─── types ─── */
type RagRating = "Red" | "Amber" | "Green";
type AuditType =
  | "Quarterly"
  | "Annual"
  | "Pre-Inspection"
  | "Targeted"
  | "Triggered by concern";
type ActionStatus = "Open" | "In Progress" | "Complete" | "Overdue";

interface SectionAudit {
  section: string;
  score: 1 | 2 | 3 | 4 | 5;
  ragRating: RagRating;
  findings: string;
  requiredActions: string[];
}

interface PriorityAction {
  action: string;
  owner: string;
  deadline: string;
  status: ActionStatus;
}

interface CaseFileAudit {
  id: string;
  youngPerson: string;
  auditDate: string;
  auditor: string;
  auditType: AuditType;
  sectionsAudited: SectionAudit[];
  overallRagRating: RagRating;
  overallScore: number;
  strengthsIdentified: string[];
  gapsIdentified: string[];
  priorityActions: PriorityAction[];
  childContributedToAudit: boolean;
  childObservation: string;
  nextAuditDue: string;
}

/* ─── seed data ─── */
const audits: CaseFileAudit[] = [
  {
    id: "cfa_001",
    youngPerson: "yp_alex",
    auditDate: d(-7),
    auditor: "staff_darren",
    auditType: "Quarterly",
    sectionsAudited: [
      {
        section: "Care plan currency",
        score: 5,
        ragRating: "Green",
        findings: "Care plan reviewed last month, fully reflects current placement plan and Pathway Plan goals.",
        requiredActions: [],
      },
      {
        section: "Risk assessments",
        score: 4,
        ragRating: "Green",
        findings: "All current risk assessments in place; one minor formatting inconsistency on the CSE risk template.",
        requiredActions: ["Reformat CSE risk assessment to current template"],
      },
      {
        section: "Education records",
        score: 5,
        ragRating: "Green",
        findings: "PEP up to date, latest report card filed, attendance log current.",
        requiredActions: [],
      },
      {
        section: "Health records",
        score: 4,
        ragRating: "Green",
        findings: "LAC health assessment complete; dental check overdue by 2 weeks.",
        requiredActions: ["Book and confirm dental check this week"],
      },
      {
        section: "Voice of child",
        score: 5,
        ragRating: "Green",
        findings: "Strong evidence of Alex's wishes captured in keywork, reviews, and care plan reviews.",
        requiredActions: [],
      },
      {
        section: "Statutory visits documented",
        score: 5,
        ragRating: "Green",
        findings: "All Reg 44 visits and SW visits logged with outcomes recorded.",
        requiredActions: [],
      },
    ],
    overallRagRating: "Green",
    overallScore: 4.7,
    strengthsIdentified: [
      "Voice of child clearly evidenced throughout case file",
      "Excellent education engagement record",
      "Care plan reviewed promptly after every change in circumstance",
    ],
    gapsIdentified: [
      "Dental check has slipped past expected interval",
      "CSE risk assessment using older template",
    ],
    priorityActions: [
      {
        action: "Book dental check and add evidence to health record",
        owner: "staff_ryan",
        deadline: d(7),
        status: "In Progress",
      },
      {
        action: "Update CSE risk assessment to current template",
        owner: "staff_darren",
        deadline: d(14),
        status: "Open",
      },
    ],
    childContributedToAudit: true,
    childObservation:
      "I had a chat with Darren and showed him the bits I think are important — my college plan and my keywork notes. I feel my file shows who I really am.",
    nextAuditDue: d(83),
  },
  {
    id: "cfa_002",
    youngPerson: "yp_jordan",
    auditDate: d(-3),
    auditor: "staff_darren",
    auditType: "Triggered by concern",
    sectionsAudited: [
      {
        section: "Care plan currency",
        score: 2,
        ragRating: "Red",
        findings: "Care plan has not been updated since the placement move; goals reference previous home.",
        requiredActions: [
          "Convene placement planning meeting within 5 working days",
          "Issue revised care plan signed by all parties",
        ],
      },
      {
        section: "Risk assessments",
        score: 3,
        ragRating: "Amber",
        findings: "Self-harm risk assessment current; missing-from-home plan needs refresh after recent incident.",
        requiredActions: ["Refresh missing-from-home protocol with current trigger pattern"],
      },
      {
        section: "Daily logs quality",
        score: 2,
        ragRating: "Red",
        findings: "Several daily log entries lack outcomes and child voice; quality varies significantly between staff.",
        requiredActions: [
          "Targeted supervision with two staff on log quality",
          "Re-deliver daily log standard at next team meeting",
        ],
      },
      {
        section: "Voice of child",
        score: 3,
        ragRating: "Amber",
        findings: "Child voice present but not consistently captured in own words; reliance on staff summary.",
        requiredActions: ["Adopt direct-quote standard for keywork records"],
      },
      {
        section: "Incident records",
        score: 4,
        ragRating: "Green",
        findings: "Incidents logged promptly and notifications correctly raised where required.",
        requiredActions: [],
      },
      {
        section: "Statutory visits documented",
        score: 3,
        ragRating: "Amber",
        findings: "SW visit logged but Reg 44 visit summary missing for current month.",
        requiredActions: ["Chase Reg 44 visitor for written report"],
      },
    ],
    overallRagRating: "Red",
    overallScore: 2.8,
    strengthsIdentified: [
      "Incident response and notifications strong",
      "Strong relationship-based keywork visible despite recording weaknesses",
    ],
    gapsIdentified: [
      "Care plan badly out of date following placement move",
      "Daily log quality inconsistent — risk to evidence trail",
      "Voice of child diluted by staff paraphrasing",
      "Reg 44 written summary missing this month",
    ],
    priorityActions: [
      {
        action: "Convene urgent placement planning meeting and reissue care plan",
        owner: "staff_darren",
        deadline: d(5),
        status: "In Progress",
      },
      {
        action: "Targeted supervision with two staff on daily log quality",
        owner: "staff_darren",
        deadline: d(10),
        status: "Open",
      },
      {
        action: "Refresh missing-from-home protocol",
        owner: "staff_ryan",
        deadline: d(7),
        status: "Open",
      },
      {
        action: "Obtain outstanding Reg 44 written summary",
        owner: "staff_darren",
        deadline: d(3),
        status: "Overdue",
      },
    ],
    childContributedToAudit: false,
    childObservation:
      "Jordan declined to contribute on the day; staff offered a follow-up keywork session next week.",
    nextAuditDue: d(28),
  },
  {
    id: "cfa_003",
    youngPerson: "yp_casey",
    auditDate: d(-21),
    auditor: "staff_ryan",
    auditType: "Pre-Inspection",
    sectionsAudited: [
      {
        section: "Care plan currency",
        score: 4,
        ragRating: "Green",
        findings: "Care plan current and signed; one outstanding action from last review still in progress.",
        requiredActions: ["Close out outstanding review action on family contact"],
      },
      {
        section: "Risk assessments",
        score: 3,
        ragRating: "Amber",
        findings: "Risk assessments present but not all reviewed in last 3 months.",
        requiredActions: ["Re-review online safety risk assessment"],
      },
      {
        section: "Health records",
        score: 4,
        ragRating: "Green",
        findings: "Initial and review LAC health assessments in place; immunisations evidenced.",
        requiredActions: [],
      },
      {
        section: "Consent records",
        score: 3,
        ragRating: "Amber",
        findings: "Photo consent renewed; activity-specific consents need consolidating into one record.",
        requiredActions: ["Consolidate activity consents into single living document"],
      },
      {
        section: "Chronology accuracy",
        score: 4,
        ragRating: "Green",
        findings: "Chronology updated last month, reflects significant events accurately.",
        requiredActions: [],
      },
      {
        section: "Voice of child",
        score: 4,
        ragRating: "Green",
        findings: "Casey's views well represented; some advocacy-supported entries strong.",
        requiredActions: [],
      },
    ],
    overallRagRating: "Amber",
    overallScore: 3.7,
    strengthsIdentified: [
      "Chronology kept genuinely current",
      "Voice of child supported by advocacy involvement",
      "Health records well organised",
    ],
    gapsIdentified: [
      "Online safety risk assessment overdue review",
      "Consent records fragmented across templates",
    ],
    priorityActions: [
      {
        action: "Re-review online safety risk assessment",
        owner: "staff_ryan",
        deadline: d(7),
        status: "In Progress",
      },
      {
        action: "Consolidate activity consents into single living record",
        owner: "staff_ryan",
        deadline: d(14),
        status: "Open",
      },
    ],
    childContributedToAudit: true,
    childObservation:
      "Casey reviewed the file with their advocate present and asked for older incident records to be moved to archive — agreed and actioned.",
    nextAuditDue: d(70),
  },
  {
    id: "cfa_004",
    youngPerson: "yp_alex",
    auditDate: d(-95),
    auditor: "staff_darren",
    auditType: "Annual",
    sectionsAudited: [
      {
        section: "Care plan currency",
        score: 4,
        ragRating: "Green",
        findings: "Annual review evidenced; pathway plan integrated with care plan.",
        requiredActions: [],
      },
      {
        section: "Risk assessments",
        score: 4,
        ragRating: "Green",
        findings: "Comprehensive set of risk assessments, all reviewed within last 6 months.",
        requiredActions: [],
      },
      {
        section: "Education records",
        score: 5,
        ragRating: "Green",
        findings: "PEP and college engagement records exemplary.",
        requiredActions: [],
      },
      {
        section: "Health records",
        score: 4,
        ragRating: "Green",
        findings: "Annual LAC health assessment complete; SDQ submitted on time.",
        requiredActions: [],
      },
      {
        section: "Voice of child",
        score: 5,
        ragRating: "Green",
        findings: "Voice of child consistently captured across reviews and keywork.",
        requiredActions: [],
      },
      {
        section: "Daily logs quality",
        score: 3,
        ragRating: "Amber",
        findings: "Logs generally good; minority lack reflective outcomes.",
        requiredActions: ["Reinforce reflective-outcome standard at handover"],
      },
    ],
    overallRagRating: "Green",
    overallScore: 4.2,
    strengthsIdentified: [
      "Annual review process delivered on time",
      "Pathway plan and care plan well integrated",
      "Voice of child consistently captured",
    ],
    gapsIdentified: [
      "Daily log reflective-outcome quality variable",
    ],
    priorityActions: [
      {
        action: "Reinforce reflective-outcome standard at next handover",
        owner: "staff_darren",
        deadline: d(-60),
        status: "Complete",
      },
    ],
    childContributedToAudit: true,
    childObservation:
      "Alex requested a printed snapshot of the strengths section for their college portfolio — provided.",
    nextAuditDue: d(-5),
  },
];

/* ─── export columns ─── */
const exportCols: ExportColumn<CaseFileAudit>[] = [
  { header: "Audit ID", accessor: (r: CaseFileAudit) => r.id },
  { header: "Young Person", accessor: (r: CaseFileAudit) => getYPName(r.youngPerson) },
  { header: "Audit Date", accessor: (r: CaseFileAudit) => r.auditDate },
  { header: "Auditor", accessor: (r: CaseFileAudit) => getStaffName(r.auditor) },
  { header: "Audit Type", accessor: (r: CaseFileAudit) => r.auditType },
  { header: "Overall RAG", accessor: (r: CaseFileAudit) => r.overallRagRating },
  { header: "Overall Score", accessor: (r: CaseFileAudit) => r.overallScore.toFixed(1) },
  { header: "Sections Audited", accessor: (r: CaseFileAudit) => r.sectionsAudited.length.toString() },
  { header: "Strengths", accessor: (r: CaseFileAudit) => r.strengthsIdentified.join("; ") },
  { header: "Gaps", accessor: (r: CaseFileAudit) => r.gapsIdentified.join("; ") },
  { header: "Priority Actions Open", accessor: (r: CaseFileAudit) => r.priorityActions.filter((a) => a.status !== "Complete").length.toString() },
  { header: "Child Contributed", accessor: (r: CaseFileAudit) => (r.childContributedToAudit ? "Yes" : "No") },
  { header: "Next Audit Due", accessor: (r: CaseFileAudit) => r.nextAuditDue },
];

/* ─── helpers ─── */
const ragClasses = (r: RagRating) => {
  switch (r) {
    case "Green":
      return "bg-green-100 text-green-800 border-green-200";
    case "Amber":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "Red":
      return "bg-red-100 text-red-800 border-red-200";
  }
};

const ragDot = (r: RagRating) =>
  cn(
    "h-2.5 w-2.5 rounded-full inline-block",
    r === "Green" && "bg-green-500",
    r === "Amber" && "bg-amber-500",
    r === "Red" && "bg-red-500"
  );

const actionStatusBadge = (s: ActionStatus) => {
  switch (s) {
    case "Open":
      return <Badge variant="outline">Open</Badge>;
    case "In Progress":
      return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
    case "Complete":
      return <Badge className="bg-green-100 text-green-800">Complete</Badge>;
    case "Overdue":
      return <Badge className="bg-red-100 text-red-800">Overdue</Badge>;
  }
};

/* ─── component ─── */
export default function CaseFileAuditPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterRag, setFilterRag] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date");

  const filtered = useMemo(() => {
    let list = [...audits];
    if (filterRag !== "all") list = list.filter((r) => r.overallRagRating === filterRag);
    if (filterType !== "all") list = list.filter((r) => r.auditType === filterType);
    list.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return b.auditDate.localeCompare(a.auditDate);
        case "score":
          return a.overallScore - b.overallScore;
        case "rag": {
          const order: Record<RagRating, number> = { Red: 0, Amber: 1, Green: 2 };
          return order[a.overallRagRating] - order[b.overallRagRating];
        }
        case "name":
          return getYPName(a.youngPerson).localeCompare(getYPName(b.youngPerson));
        case "due":
          return a.nextAuditDue.localeCompare(b.nextAuditDue);
        default:
          return 0;
      }
    });
    return list;
  }, [filterRag, filterType, sortBy]);

  const stats = useMemo(() => {
    const avg =
      audits.reduce((s, a) => s + a.overallScore, 0) / (audits.length || 1);
    const green = audits.filter((a) => a.overallRagRating === "Green").length;
    const amberRed = audits.filter(
      (a) => a.overallRagRating === "Amber" || a.overallRagRating === "Red"
    ).length;
    const openActions = audits.reduce(
      (s, a) =>
        s +
        a.priorityActions.filter((p) => p.status !== "Complete").length,
      0
    );
    return { avg: avg.toFixed(1), green, amberRed, openActions };
  }, []);

  const toggle = (id: string) =>
    setExpandedId(expandedId === id ? null : id);

  const filesNeedingAttention = audits.filter(
    (a) => a.overallRagRating === "Red" || a.overallRagRating === "Amber"
  );

  return (
    <PageShell
      title="Case File Audit"
      subtitle="Quality audits of individual children's case files — Quality Standard 13 & Reg 36"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton
            data={audits}
            columns={exportCols}
            filename="case-file-audits"
          />
          <PrintButton title="Case File Audit" />
        </div>
      }
    >
      {/* ─── summary stats ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <Gauge className="h-4 w-4 text-muted-foreground" />
              <p className="text-2xl font-bold">{stats.avg}</p>
              <span className="text-sm text-muted-foreground">/ 5</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Avg overall score</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-green-700">{stats.green}</p>
            <p className="text-xs text-muted-foreground">Green-rated files</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-amber-700">{stats.amberRed}</p>
            <p className="text-xs text-muted-foreground">Amber / Red files</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-blue-700">{stats.openActions}</p>
            <p className="text-xs text-muted-foreground">Priority actions open</p>
          </CardContent>
        </Card>
      </div>

      {/* ─── alerts ─── */}
      {filesNeedingAttention.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-2">
            <ShieldAlert className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">
                Files requiring immediate attention
              </p>
              <ul className="text-xs text-red-700 mt-1 space-y-0.5">
                {filesNeedingAttention.map((a) => (
                  <li key={a.id} className="flex items-center gap-2">
                    <span className={ragDot(a.overallRagRating)} />
                    <span className="font-medium">
                      {getYPName(a.youngPerson)}
                    </span>
                    <span className="text-red-600">
                      — {a.overallRagRating} rating ({a.overallScore.toFixed(1)}/5),{" "}
                      {a.priorityActions.filter((p) => p.status !== "Complete").length}{" "}
                      open action(s)
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ─── filters / sort ─── */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select value={filterRag} onValueChange={setFilterRag}>
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder="RAG Rating" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All RAG Ratings</SelectItem>
            <SelectItem value="Green">Green</SelectItem>
            <SelectItem value="Amber">Amber</SelectItem>
            <SelectItem value="Red">Red</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Audit Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Audit Types</SelectItem>
            <SelectItem value="Quarterly">Quarterly</SelectItem>
            <SelectItem value="Annual">Annual</SelectItem>
            <SelectItem value="Pre-Inspection">Pre-Inspection</SelectItem>
            <SelectItem value="Targeted">Targeted</SelectItem>
            <SelectItem value="Triggered by concern">
              Triggered by concern
            </SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1 ml-auto">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Audit Date</SelectItem>
              <SelectItem value="score">Score (low first)</SelectItem>
              <SelectItem value="rag">RAG (Red first)</SelectItem>
              <SelectItem value="name">Young Person</SelectItem>
              <SelectItem value="due">Next Audit Due</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ─── audit cards ─── */}
      <div className="space-y-4">
        {filtered.map((audit) => {
          const expanded = expandedId === audit.id;
          const openActions = audit.priorityActions.filter(
            (a) => a.status !== "Complete"
          ).length;

          return (
            <Card key={audit.id} className="overflow-hidden">
              <CardHeader
                className="cursor-pointer hover:bg-muted/40 transition-colors py-4"
                onClick={() => toggle(audit.id)}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        "p-2 rounded-full shrink-0",
                        audit.overallRagRating === "Green" && "bg-green-100",
                        audit.overallRagRating === "Amber" && "bg-amber-100",
                        audit.overallRagRating === "Red" && "bg-red-100"
                      )}
                    >
                      <FileSearch
                        className={cn(
                          "h-5 w-5",
                          audit.overallRagRating === "Green" && "text-green-600",
                          audit.overallRagRating === "Amber" && "text-amber-600",
                          audit.overallRagRating === "Red" && "text-red-600"
                        )}
                      />
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-base truncate">
                        {getYPName(audit.youngPerson)}
                      </CardTitle>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <Badge
                          className={cn("border", ragClasses(audit.overallRagRating))}
                        >
                          {audit.overallRagRating}
                        </Badge>
                        <Badge variant="outline">{audit.auditType}</Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <CalendarClock className="h-3.5 w-3.5" />
                          {audit.auditDate}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Auditor: {getStaffName(audit.auditor)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="text-lg font-semibold tabular-nums">
                        {audit.overallScore.toFixed(1)}
                        <span className="text-xs text-muted-foreground"> / 5</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {openActions} open action{openActions === 1 ? "" : "s"}
                      </div>
                    </div>
                    {expanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </CardHeader>

              {expanded && (
                <CardContent className="pt-0 pb-5 space-y-5">
                  {/* Sections audited */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1.5">
                      <ClipboardList className="h-3.5 w-3.5" />
                      Sections Audited
                    </p>
                    <div className="space-y-2">
                      {audit.sectionsAudited.map((s, idx) => (
                        <div
                          key={idx}
                          className="rounded-md border p-3 bg-muted/20"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className={ragDot(s.ragRating)} />
                              <span className="text-sm font-medium truncate">
                                {s.section}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Badge
                                className={cn("border", ragClasses(s.ragRating))}
                              >
                                {s.ragRating}
                              </Badge>
                              <span className="text-xs font-semibold tabular-nums">
                                {s.score}/5
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1.5">
                            {s.findings}
                          </p>
                          {s.requiredActions.length > 0 && (
                            <ul className="text-xs mt-2 list-disc pl-4 space-y-0.5">
                              {s.requiredActions.map((a, i) => (
                                <li key={i}>{a}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Strengths & gaps */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                        Strengths Identified
                      </p>
                      <ul className="text-sm list-disc pl-4 space-y-1">
                        {audit.strengthsIdentified.map((str, i) => (
                          <li key={i}>{str}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1.5">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                        Gaps Identified
                      </p>
                      {audit.gapsIdentified.length > 0 ? (
                        <ul className="text-sm list-disc pl-4 space-y-1">
                          {audit.gapsIdentified.map((g, i) => (
                            <li key={i}>{g}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No gaps identified.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Priority actions */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1.5">
                      <ListChecks className="h-3.5 w-3.5" />
                      Priority Actions
                    </p>
                    {audit.priorityActions.length > 0 ? (
                      <div className="space-y-2">
                        {audit.priorityActions.map((p, i) => (
                          <div
                            key={i}
                            className="flex flex-wrap items-center justify-between gap-2 border rounded-md p-2.5"
                          >
                            <div className="min-w-0">
                              <p className="text-sm">{p.action}</p>
                              <p className="text-[11px] text-muted-foreground mt-0.5">
                                Owner: {getStaffName(p.owner)} • Deadline: {p.deadline}
                              </p>
                            </div>
                            {actionStatusBadge(p.status)}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No priority actions arising from this audit.
                      </p>
                    )}
                  </div>

                  {/* Child contribution */}
                  <div className="rounded-md border p-3 bg-blue-50/40">
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-800 mb-1 flex items-center gap-1.5">
                      <MessageCircle className="h-3.5 w-3.5" />
                      Child Contributed to Audit:{" "}
                      {audit.childContributedToAudit ? "Yes" : "No"}
                    </p>
                    <p className="text-sm text-blue-900/80 italic">
                      {audit.childObservation}
                    </p>
                  </div>

                  {/* Next audit */}
                  <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <CalendarClock className="h-3.5 w-3.5" />
                    Next audit due: {audit.nextAuditDue}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-10 border rounded-md">
            No audits match the current filters.
          </div>
        )}
      </div>

      {/* ─── regulatory note ─── */}
      <div className="mt-8 rounded-lg border bg-muted/30 p-4 text-xs text-muted-foreground space-y-1">
        <p className="font-semibold text-foreground">Regulatory basis</p>
        <p>
          Quality Standard 13 (the leadership and management standard) requires the
          registered manager to lead and manage the home effectively, including the
          quality assurance of records and care planning for each child.
        </p>
        <p>
          Regulation 36 (records about children) requires accurate, current and
          retained case file records. Routine case file audits provide evidence that
          children's records meet these standards and that gaps generate timely action.
        </p>
      </div>
    </PageShell>
  );
}

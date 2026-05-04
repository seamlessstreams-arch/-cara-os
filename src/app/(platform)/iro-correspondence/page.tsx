"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — IRO CORRESPONDENCE
// Tracks correspondence with Independent Reviewing Officers (IROs) — letters,
// emails, formal escalations, mid-review check-ins, and statutory dispute
// resolution communications relating to each child.
// Required by IRO Handbook 2010 and Quality Standard 4 (Care Planning).
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { PrintButton } from "@/components/ui/print-button";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getYPName, getStaffName } from "@/lib/seed-data";
import {
  ArrowUpDown, ArrowDownLeft, ArrowUpRight, AlertTriangle, Clock,
  ChevronDown, ChevronUp, Mail, Inbox, Send, Shield, FileText,
  CheckCircle2, Paperclip, User, Calendar, Scale, Eye,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type Direction = "From IRO" | "To IRO";

type CorrespondenceType =
  | "Pre-LAC review information"
  | "Post-LAC review confirmation"
  | "Formal dispute resolution"
  | "Information request"
  | "Concern raised by IRO"
  | "Update from home"
  | "Mid-review check-in"
  | "Statutory action required";

type ActionStatus = "Outstanding" | "In progress" | "Complete";

interface RequiredAction {
  action: string;
  owner: string;
  deadline: string;
  status: ActionStatus;
}

interface IroCorrespondence {
  id: string;
  date: string;
  youngPerson: string;
  iroName: string;
  iroLocalAuthority: string;
  direction: Direction;
  correspondenceType: CorrespondenceType;
  subject: string;
  summary: string;
  keyPoints: string[];
  actionsRequired: RequiredAction[];
  responseRequired: boolean;
  responseDeadline: string;
  responseSent: boolean;
  responseSentDate: string;
  attachments: string[];
  formalDispute: boolean;
  authoredBy: string;
  receivedBy: string;
  copiedTo: string[];
  filed: boolean;
}

// ── Config ────────────────────────────────────────────────────────────────────

const TYPE_COLOUR: Record<CorrespondenceType, string> = {
  "Pre-LAC review information":   "bg-blue-100 text-blue-700",
  "Post-LAC review confirmation": "bg-green-100 text-green-700",
  "Formal dispute resolution":    "bg-red-100 text-red-700",
  "Information request":          "bg-amber-100 text-amber-700",
  "Concern raised by IRO":        "bg-orange-100 text-orange-700",
  "Update from home":             "bg-indigo-100 text-indigo-700",
  "Mid-review check-in":          "bg-purple-100 text-purple-700",
  "Statutory action required":    "bg-rose-100 text-rose-700",
};

const STATUS_COLOUR: Record<ActionStatus, string> = {
  "Outstanding": "bg-red-100 text-red-700",
  "In progress": "bg-amber-100 text-amber-700",
  "Complete":    "bg-green-100 text-green-700",
};

// ── Date helper ───────────────────────────────────────────────────────────────

const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

// ── Seed Data ─────────────────────────────────────────────────────────────────

const SEED: IroCorrespondence[] = [
  {
    id: "iro_corr_001",
    date: d(-3),
    youngPerson: "yp_alex",
    iroName: "Margaret Adekunle",
    iroLocalAuthority: "Derby City Council",
    direction: "To IRO",
    correspondenceType: "Pre-LAC review information",
    subject: "Pre-review report and consultation pack — Alex W (LAC review 14d)",
    summary:
      "Pre-review report submitted ahead of Alex's statutory LAC review. Includes placement update, education progress, health update, and key worker observations. Alex's wishes and feelings consultation also enclosed.",
    keyPoints: [
      "Placement remains stable since admission 7 months ago",
      "Education attendance up to 94% following AP transition",
      "Annual health assessment completed; CAMHS engagement ongoing",
      "Alex requests fewer adults at the next review meeting",
    ],
    actionsRequired: [],
    responseRequired: false,
    responseDeadline: "",
    responseSent: false,
    responseSentDate: "",
    attachments: ["Pre-review report.pdf", "Wishes & feelings consultation.pdf", "Education update from AP.pdf"],
    formalDispute: false,
    authoredBy: "staff_darren",
    receivedBy: "",
    copiedTo: ["Karen Holding (SW)", "Nikki Atkinson (Resp. Individual)"],
    filed: true,
  },
  {
    id: "iro_corr_002",
    date: d(-12),
    youngPerson: "yp_jordan",
    iroName: "Patrick O'Connell",
    iroLocalAuthority: "Nottinghamshire County Council",
    direction: "From IRO",
    correspondenceType: "Post-LAC review confirmation",
    subject: "LAC review minutes and decisions — Jordan T",
    summary:
      "Minutes from Jordan's LAC review. Care plan approved with minor amendments. IRO confirmed placement remains in Jordan's best interests. Three review decisions logged for follow-up.",
    keyPoints: [
      "Care plan approved subject to updated contact schedule",
      "Family time to increase from monthly to fortnightly (supervised)",
      "PEP review to be brought forward by Virtual School",
      "Next review in 6 months unless circumstances change",
    ],
    actionsRequired: [
      { action: "Update placement plan to reflect new contact schedule", owner: "staff_darren", deadline: d(-5), status: "Complete" },
      { action: "Liaise with Virtual School re: PEP review date", owner: "staff_ryan", deadline: d(2), status: "In progress" },
    ],
    responseRequired: true,
    responseDeadline: d(-5),
    responseSent: true,
    responseSentDate: d(-7),
    attachments: ["LAC review minutes.pdf", "IRO decision record.pdf"],
    formalDispute: false,
    authoredBy: "",
    receivedBy: "staff_darren",
    copiedTo: ["Michael Osei (SW)"],
    filed: true,
  },
  {
    id: "iro_corr_003",
    date: d(-6),
    youngPerson: "yp_casey",
    iroName: "Helena Burch",
    iroLocalAuthority: "Derbyshire County Council",
    direction: "From IRO",
    correspondenceType: "Mid-review check-in",
    subject: "Mid-review check-in — concerns about contact arrangements for Casey",
    summary:
      "IRO writing mid-review to flag concerns raised directly by Casey during recent visit. Casey reports feeling unheard about reduced sibling contact. IRO requests the home's response and proposed approach before next review.",
    keyPoints: [
      "Casey reports sibling contact has felt rushed and inconsistent",
      "Casey would like longer, less supervised time with younger sibling",
      "IRO seeking confirmation that wishes are reflected in placement plan",
      "Issue may be escalated to formal dispute resolution if unresolved",
    ],
    actionsRequired: [
      { action: "Schedule key worker session with Casey to explore preferences", owner: "staff_ryan", deadline: d(3), status: "In progress" },
      { action: "Liaise with allocated SW re: revised contact arrangements", owner: "staff_darren", deadline: d(5), status: "Outstanding" },
      { action: "Update placement plan and share with IRO", owner: "staff_darren", deadline: d(10), status: "Outstanding" },
    ],
    responseRequired: true,
    responseDeadline: d(7),
    responseSent: false,
    responseSentDate: "",
    attachments: ["IRO mid-review note.pdf"],
    formalDispute: false,
    authoredBy: "",
    receivedBy: "staff_darren",
    copiedTo: ["Fiona Brennan (SW)"],
    filed: false,
  },
  {
    id: "iro_corr_004",
    date: d(-22),
    youngPerson: "yp_alex",
    iroName: "Margaret Adekunle",
    iroLocalAuthority: "Derby City Council",
    direction: "From IRO",
    correspondenceType: "Information request",
    subject: "Request for incident chronology and behaviour data — Alex W",
    summary:
      "Routine information request ahead of upcoming review. IRO asking for a 6-month chronology of significant incidents, behaviour support plan reviews, and any restrictive practice records.",
    keyPoints: [
      "6-month chronology of significant incidents requested",
      "Copies of last two behaviour support plan reviews",
      "Restrictive practice register entries for Alex",
    ],
    actionsRequired: [
      { action: "Compile and send chronology pack", owner: "staff_darren", deadline: d(-15), status: "Complete" },
    ],
    responseRequired: true,
    responseDeadline: d(-15),
    responseSent: true,
    responseSentDate: d(-17),
    attachments: ["IRO information request.pdf"],
    formalDispute: false,
    authoredBy: "",
    receivedBy: "staff_darren",
    copiedTo: [],
    filed: true,
  },
  {
    id: "iro_corr_005",
    date: d(-30),
    youngPerson: "yp_jordan",
    iroName: "Patrick O'Connell",
    iroLocalAuthority: "Nottinghamshire County Council",
    direction: "To IRO",
    correspondenceType: "Update from home",
    subject: "Interim update — Jordan's response to placement transition",
    summary:
      "Voluntary interim update to the IRO outlining Jordan's adjustment in the weeks following step-down from previous placement. Highlights early wins and emerging risks.",
    keyPoints: [
      "Settling well — keyworking sessions consistent and engaged",
      "Two minor incidents managed without restrictive practice",
      "Positive engagement with new education provider",
      "Emerging concern around contact with maternal grandmother",
    ],
    actionsRequired: [],
    responseRequired: false,
    responseDeadline: "",
    responseSent: false,
    responseSentDate: "",
    attachments: ["Interim update letter.pdf"],
    formalDispute: false,
    authoredBy: "staff_ryan",
    receivedBy: "",
    copiedTo: ["Michael Osei (SW)"],
    filed: true,
  },
  {
    id: "iro_corr_006",
    date: d(-45),
    youngPerson: "yp_casey",
    iroName: "Helena Burch",
    iroLocalAuthority: "Derbyshire County Council",
    direction: "From IRO",
    correspondenceType: "Formal dispute resolution",
    subject: "Stage 1 dispute resolution — placement plan disagreement (Casey M)",
    summary:
      "Formal dispute resolution notice raised under the IRO's statutory powers. IRO disagrees with the local authority's proposal to extend the current placement plan without revising contact arrangements. Home named as a stakeholder in the resolution process.",
    keyPoints: [
      "Disagreement concerns LA's proposed placement plan extension",
      "IRO position: contact provisions must be revised first",
      "Home asked to provide written observations within 10 working days",
      "Process may escalate to CAFCASS referral if unresolved at Stage 2",
    ],
    actionsRequired: [
      { action: "Submit written observations and supporting evidence", owner: "staff_darren", deadline: d(-30), status: "Complete" },
      { action: "Attend Stage 1 resolution meeting", owner: "staff_darren", deadline: d(-20), status: "Complete" },
      { action: "Implement revised contact framework agreed at Stage 1", owner: "staff_ryan", deadline: d(15), status: "In progress" },
    ],
    responseRequired: true,
    responseDeadline: d(-30),
    responseSent: true,
    responseSentDate: d(-32),
    attachments: [
      "Stage 1 dispute notice.pdf",
      "Home observations submission.pdf",
      "Stage 1 meeting record.pdf",
    ],
    formalDispute: true,
    authoredBy: "",
    receivedBy: "staff_darren",
    copiedTo: ["Fiona Brennan (SW)", "Head of Service (DCC)"],
    filed: true,
  },
  {
    id: "iro_corr_007",
    date: d(-1),
    youngPerson: "yp_alex",
    iroName: "Margaret Adekunle",
    iroLocalAuthority: "Derby City Council",
    direction: "From IRO",
    correspondenceType: "Statutory action required",
    subject: "Statutory action — confirmation that consultation evidence is on file",
    summary:
      "Standard statutory check from IRO ahead of Alex's review. Asks the home to confirm that Alex's wishes and feelings have been recorded and that any advocacy referral has been considered.",
    keyPoints: [
      "Confirm wishes and feelings consultation is on the child's file",
      "Confirm advocacy offer has been made and decision recorded",
      "Confirm pre-review report has been shared with Alex in accessible format",
    ],
    actionsRequired: [
      { action: "Send written confirmation with file references", owner: "staff_darren", deadline: d(4), status: "Outstanding" },
    ],
    responseRequired: true,
    responseDeadline: d(4),
    responseSent: false,
    responseSentDate: "",
    attachments: ["IRO statutory check letter.pdf"],
    formalDispute: false,
    authoredBy: "",
    receivedBy: "staff_darren",
    copiedTo: [],
    filed: false,
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function IroCorrespondencePage() {
  const [records] = useState<IroCorrespondence[]>(SEED);
  const [ypFilter, setYpFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [directionFilter, setDirectionFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  /* ── filtering & sorting ──────────────────────────────────────────────── */
  const filtered = useMemo(() => {
    let list = [...records];
    if (ypFilter !== "all") list = list.filter(r => r.youngPerson === ypFilter);
    if (typeFilter !== "all") list = list.filter(r => r.correspondenceType === typeFilter);
    if (directionFilter !== "all") list = list.filter(r => r.direction === directionFilter);
    list.sort((a, b) => {
      switch (sortBy) {
        case "newest": return b.date.localeCompare(a.date);
        case "oldest": return a.date.localeCompare(b.date);
        case "deadline": {
          const ad = a.responseRequired && !a.responseSent ? a.responseDeadline : "9999-12-31";
          const bd = b.responseRequired && !b.responseSent ? b.responseDeadline : "9999-12-31";
          return ad.localeCompare(bd);
        }
        default: return 0;
      }
    });
    return list;
  }, [records, ypFilter, typeFilter, directionFilter, sortBy]);

  /* ── stats ────────────────────────────────────────────────────────────── */
  const stats = useMemo(() => {
    const today = d(0);
    const ninetyAgo = d(-90);
    return {
      active: records.filter(r => !r.filed).length,
      awaiting: records.filter(r => r.responseRequired && !r.responseSent).length,
      disputes: records.filter(r => r.formalDispute).length,
      thisQuarter: records.filter(r => r.date >= ninetyAgo && r.date <= today).length,
    };
  }, [records]);

  /* ── overdue alert ────────────────────────────────────────────────────── */
  const overdue = useMemo(
    () => records.filter(r => r.responseRequired && !r.responseSent && r.responseDeadline < d(0)),
    [records]
  );

  /* ── export ───────────────────────────────────────────────────────────── */
  const exportCols: ExportColumn<IroCorrespondence>[] = [
    { header: "ID",                  accessor: (r: IroCorrespondence) => r.id },
    { header: "Date",                accessor: (r: IroCorrespondence) => r.date },
    { header: "Young Person",        accessor: (r: IroCorrespondence) => getYPName(r.youngPerson) },
    { header: "IRO Name",            accessor: (r: IroCorrespondence) => r.iroName },
    { header: "Local Authority",     accessor: (r: IroCorrespondence) => r.iroLocalAuthority },
    { header: "Direction",           accessor: (r: IroCorrespondence) => r.direction },
    { header: "Type",                accessor: (r: IroCorrespondence) => r.correspondenceType },
    { header: "Subject",             accessor: (r: IroCorrespondence) => r.subject },
    { header: "Summary",             accessor: (r: IroCorrespondence) => r.summary },
    { header: "Key Points",          accessor: (r: IroCorrespondence) => r.keyPoints.join(" | ") },
    { header: "Actions Required",    accessor: (r: IroCorrespondence) => r.actionsRequired.map(a => `${a.action} [${a.owner} — ${a.deadline} — ${a.status}]`).join(" | ") },
    { header: "Response Required",   accessor: (r: IroCorrespondence) => r.responseRequired ? "Yes" : "No" },
    { header: "Response Deadline",   accessor: (r: IroCorrespondence) => r.responseDeadline || "" },
    { header: "Response Sent",       accessor: (r: IroCorrespondence) => r.responseSent ? "Yes" : "No" },
    { header: "Response Sent Date",  accessor: (r: IroCorrespondence) => r.responseSentDate || "" },
    { header: "Attachments",         accessor: (r: IroCorrespondence) => r.attachments.join(" | ") },
    { header: "Formal Dispute",      accessor: (r: IroCorrespondence) => r.formalDispute ? "Yes" : "No" },
    { header: "Authored By",         accessor: (r: IroCorrespondence) => r.authoredBy ? getStaffName(r.authoredBy) : "" },
    { header: "Received By",         accessor: (r: IroCorrespondence) => r.receivedBy ? getStaffName(r.receivedBy) : "" },
    { header: "Copied To",           accessor: (r: IroCorrespondence) => r.copiedTo.join(" | ") },
    { header: "Filed",               accessor: (r: IroCorrespondence) => r.filed ? "Yes" : "No" },
  ];

  return (
    <PageShell
      title="IRO Correspondence"
      subtitle="Letters, emails, and formal escalations with Independent Reviewing Officers"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="IRO Correspondence" />
          <ExportButton data={filtered} columns={exportCols} filename="iro-correspondence" />
        </div>
      }
    >
      {/* ── Summary Stats ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Active correspondence", value: stats.active,      icon: Mail,           c: "text-blue-600"   },
          { label: "Awaiting response",     value: stats.awaiting,    icon: Clock,          c: "text-amber-600"  },
          { label: "Formal disputes",       value: stats.disputes,    icon: Scale,          c: "text-red-600"    },
          { label: "This quarter",          value: stats.thisQuarter, icon: FileText,       c: "text-indigo-600" },
        ].map(s => (
          <div key={s.label} className="rounded-lg border bg-card p-3 flex items-center gap-3">
            <s.icon className={cn("h-5 w-5", s.c)} />
            <div>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-lg font-bold">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Alerts ─────────────────────────────────────────────────────────── */}
      {overdue.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/30 p-3 mb-3 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div className="text-sm text-red-800 dark:text-red-300">
            <p className="font-semibold">
              {overdue.length} response{overdue.length !== 1 ? "s" : ""} overdue
            </p>
            <p className="text-xs mt-0.5">
              Statutory IRO correspondence with passed response deadlines. Prioritise these to avoid escalation.
            </p>
          </div>
        </div>
      )}

      {stats.disputes > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 p-3 mb-6 flex items-start gap-3">
          <Scale className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800 dark:text-amber-300">
            <p className="font-semibold">
              {stats.disputes} formal dispute resolution{stats.disputes !== 1 ? "s" : ""} on file
            </p>
            <p className="text-xs mt-0.5">
              Formal disputes are statutory escalations under the IRO Handbook 2010. All correspondence must be retained for the duration of the placement.
            </p>
          </div>
        </div>
      )}

      {/* ── Filters & Sort ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Select value={ypFilter} onValueChange={setYpFilter}>
          <SelectTrigger className="w-[180px] h-9"><SelectValue placeholder="Young person" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All young people</SelectItem>
            <SelectItem value="yp_alex">{getYPName("yp_alex")}</SelectItem>
            <SelectItem value="yp_jordan">{getYPName("yp_jordan")}</SelectItem>
            <SelectItem value="yp_casey">{getYPName("yp_casey")}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[220px] h-9"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {Object.keys(TYPE_COLOUR).map(t => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={directionFilter} onValueChange={setDirectionFilter}>
          <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="Direction" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All directions</SelectItem>
            <SelectItem value="From IRO">From IRO</SelectItem>
            <SelectItem value="To IRO">To IRO</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1 ml-auto">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[160px] h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="oldest">Oldest first</SelectItem>
              <SelectItem value="deadline">Response deadline</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mb-3">
        {filtered.length} record{filtered.length !== 1 ? "s" : ""}
        {(ypFilter !== "all" || typeFilter !== "all" || directionFilter !== "all") && " (filtered)"}
      </p>

      {/* ── Cards ──────────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Mail className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p className="font-medium">No IRO correspondence matches the current filters</p>
          </div>
        )}

        {filtered.map(r => {
          const isOpen = expandedId === r.id;
          const fromIro = r.direction === "From IRO";
          const Icon = fromIro ? Inbox : Send;
          const overdueResp = r.responseRequired && !r.responseSent && r.responseDeadline < d(0);

          return (
            <div
              key={r.id}
              className={cn(
                "rounded-lg border bg-card overflow-hidden",
                fromIro ? "border-l-4 border-l-purple-400" : "border-l-4 border-l-blue-400",
                r.formalDispute && "ring-1 ring-red-200"
              )}
            >
              <button
                onClick={() => setExpandedId(isOpen ? null : r.id)}
                className="w-full flex items-start gap-3 p-3 text-left hover:bg-muted/50 transition-colors"
              >
                <div className={cn(
                  "rounded-full p-1.5 shrink-0",
                  fromIro ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                )}>
                  <Icon className="h-4 w-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{r.subject}</span>
                    <span className={cn(
                      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs",
                      fromIro ? "bg-purple-50 text-purple-700" : "bg-blue-50 text-blue-700"
                    )}>
                      {fromIro
                        ? <><ArrowDownLeft className="h-3 w-3" /> From IRO</>
                        : <><ArrowUpRight className="h-3 w-3" /> To IRO</>}
                    </span>
                    <span className={cn("px-2 py-0.5 rounded-full text-xs", TYPE_COLOUR[r.correspondenceType])}>
                      {r.correspondenceType}
                    </span>
                    {r.formalDispute && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700">
                        <Scale className="h-3 w-3" /> Formal dispute
                      </span>
                    )}
                    {overdueResp && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700">
                        <AlertTriangle className="h-3 w-3" /> Response overdue
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {getYPName(r.youngPerson)} · {r.iroName} ({r.iroLocalAuthority}) · {r.date}
                    {r.attachments.length > 0 && (
                      <> · <Paperclip className="inline h-3 w-3 mx-0.5" />{r.attachments.length}</>
                    )}
                  </p>
                </div>

                {isOpen ? <ChevronUp className="h-4 w-4 shrink-0 mt-1" /> : <ChevronDown className="h-4 w-4 shrink-0 mt-1" />}
              </button>

              {isOpen && (
                <div className="border-t px-4 py-3 space-y-4 bg-muted/30">
                  {/* Meta grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                    <div>
                      <p className="text-muted-foreground">Young person</p>
                      <p className="font-medium">{getYPName(r.youngPerson)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">IRO</p>
                      <p className="font-medium">{r.iroName}</p>
                      <p className="text-muted-foreground">{r.iroLocalAuthority}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{fromIro ? "Received by" : "Authored by"}</p>
                      <p className="font-medium">
                        {fromIro
                          ? (r.receivedBy ? getStaffName(r.receivedBy) : "—")
                          : (r.authoredBy ? getStaffName(r.authoredBy) : "—")}
                      </p>
                    </div>
                  </div>

                  {/* Summary */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Summary</p>
                    <p className="text-sm">{r.summary}</p>
                  </div>

                  {/* Key points */}
                  {r.keyPoints.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Key points</p>
                      <ul className="text-sm space-y-1 list-disc pl-5">
                        {r.keyPoints.map((kp, i) => <li key={i}>{kp}</li>)}
                      </ul>
                    </div>
                  )}

                  {/* Actions */}
                  {r.actionsRequired.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Actions required</p>
                      <div className="space-y-1.5">
                        {r.actionsRequired.map((a, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm rounded border bg-card p-2">
                            <CheckCircle2 className={cn(
                              "h-4 w-4 shrink-0 mt-0.5",
                              a.status === "Complete" ? "text-green-600" :
                              a.status === "In progress" ? "text-amber-600" : "text-red-600"
                            )} />
                            <div className="flex-1">
                              <p>{a.action}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {getStaffName(a.owner)} · due {a.deadline}
                              </p>
                            </div>
                            <span className={cn("px-2 py-0.5 rounded-full text-xs h-fit", STATUS_COLOUR[a.status])}>
                              {a.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Response tracking */}
                  <div className="grid grid-cols-2 gap-3 text-xs rounded-md border bg-card p-3">
                    <div>
                      <p className="text-muted-foreground">Response required</p>
                      <p className="font-medium">{r.responseRequired ? "Yes" : "No"}</p>
                    </div>
                    {r.responseRequired && (
                      <>
                        <div>
                          <p className="text-muted-foreground">Response deadline</p>
                          <p className={cn("font-medium", overdueResp && "text-red-600")}>
                            {r.responseDeadline || "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Response sent</p>
                          <p className="font-medium">{r.responseSent ? "Yes" : "No"}</p>
                        </div>
                        {r.responseSent && (
                          <div>
                            <p className="text-muted-foreground">Sent on</p>
                            <p className="font-medium">{r.responseSentDate}</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Attachments / copies */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-muted-foreground mb-1">Attachments</p>
                      {r.attachments.length === 0
                        ? <p className="text-muted-foreground italic">None</p>
                        : (
                          <ul className="space-y-1">
                            {r.attachments.map((a, i) => (
                              <li key={i} className="flex items-center gap-1.5">
                                <Paperclip className="h-3 w-3 text-muted-foreground" /> {a}
                              </li>
                            ))}
                          </ul>
                        )}
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Copied to</p>
                      {r.copiedTo.length === 0
                        ? <p className="text-muted-foreground italic">None</p>
                        : (
                          <ul className="space-y-1">
                            {r.copiedTo.map((c, i) => (
                              <li key={i} className="flex items-center gap-1.5">
                                <User className="h-3 w-3 text-muted-foreground" /> {c}
                              </li>
                            ))}
                          </ul>
                        )}
                    </div>
                  </div>

                  {/* Footer meta */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" /> {r.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-3.5 w-3.5" /> {r.filed ? "Filed in case record" : "Open — not yet filed"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Regulatory Note ────────────────────────────────────────────────── */}
      <div className="mt-8 rounded-lg border border-dashed p-4">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
          <div className="text-xs text-muted-foreground space-y-2">
            <p className="font-semibold text-foreground">IRO independence and statutory role</p>
            <p>
              The Independent Reviewing Officer is a statutory safeguard for every looked-after child.
              Under the <strong>IRO Handbook 2010</strong> and <strong>Quality Standard 4 (Care Planning)</strong>,
              the IRO must act independently of the local authority and the placement, monitor the child's
              care plan, ensure the child's wishes and feelings are reflected in decisions, and challenge
              any drift or delay. A clear correspondence trail evidences the home's openness to that
              independent oversight.
            </p>
            <p>
              All written communication with the IRO — pre- and post-review, mid-review check-ins,
              information requests, concerns, and formal dispute resolution — must be retained on the
              child's case file for the duration of the placement and made available to Ofsted on request.
              Concerns raised by the IRO and any formal dispute resolution steps must be acknowledged
              promptly and acted on within agreed timescales.
            </p>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

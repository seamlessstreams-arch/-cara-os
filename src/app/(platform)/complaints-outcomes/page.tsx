"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — COMPLAINTS OUTCOMES
// Reg 39 — Complaints & Representations: investigation outcomes, learning
// points, practice changes, and response timescales.
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useMemo } from "react";
import {
  ClipboardCheck, Plus, Search, ArrowUpDown, Filter,
  CheckCircle2, AlertTriangle, Clock, BookOpen, ChevronDown, ChevronUp,
  Scale, ShieldCheck, Calendar, User, Flag, FileText,
} from "lucide-react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";

/* ── helpers ─────────────────────────────────────────────────────────── */
const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

/* ── types ───────────────────────────────────────────────────────────── */
const OUTCOMES = [
  "upheld", "partially_upheld", "not_upheld", "withdrawn", "ongoing",
] as const;
type ComplaintOutcome = typeof OUTCOMES[number];
const OUTCOME_LABELS: Record<ComplaintOutcome, string> = {
  upheld: "Upheld",
  partially_upheld: "Partially Upheld",
  not_upheld: "Not Upheld",
  withdrawn: "Withdrawn",
  ongoing: "Ongoing",
};
const OUTCOME_COLOUR: Record<ComplaintOutcome, string> = {
  upheld: "bg-red-50 text-red-700 border-red-200",
  partially_upheld: "bg-amber-50 text-amber-700 border-amber-200",
  not_upheld: "bg-emerald-50 text-emerald-700 border-emerald-200",
  withdrawn: "bg-slate-50 text-slate-500 border-slate-200",
  ongoing: "bg-blue-50 text-blue-700 border-blue-200",
};
const OUTCOME_CARD_BORDER: Record<ComplaintOutcome, string> = {
  upheld: "border-l-red-400",
  partially_upheld: "border-l-amber-400",
  not_upheld: "border-l-emerald-400",
  withdrawn: "border-l-slate-300",
  ongoing: "border-l-blue-400",
};

const SOURCES = [
  "child", "parent_carer", "social_worker", "professional", "staff", "anonymous",
] as const;
type Source = typeof SOURCES[number];
const SOURCE_LABELS: Record<Source, string> = {
  child: "Young Person",
  parent_carer: "Parent / Carer",
  social_worker: "Social Worker",
  professional: "Professional",
  staff: "Staff Member",
  anonymous: "Anonymous",
};

const THEMES = [
  "care_quality", "staff_conduct", "environment", "food", "activities",
  "communication", "privacy", "medication", "other",
] as const;
type Theme = typeof THEMES[number];
const THEME_LABELS: Record<Theme, string> = {
  care_quality: "Care Quality",
  staff_conduct: "Staff Conduct",
  environment: "Environment",
  food: "Food",
  activities: "Activities",
  communication: "Communication",
  privacy: "Privacy",
  medication: "Medication",
  other: "Other",
};

interface ComplaintOutcomeRecord {
  id: string;
  complaintDate: string;
  complainant: string;
  source: Source;
  theme: Theme;
  outcome: ComplaintOutcome;
  investigatedBy: string;
  dateResolved: string | null;
  responseTimeDays: number;
  youngPersonId: string | null;
  summary: string;
  findings: string;
  lessonsLearned: string;
  practiceChanges: string[];
  complainantSatisfied: boolean | null;
  escalated: boolean;
  escalatedTo: string | null;
  ofstedNotified: boolean;
}

/* ── seed data ───────────────────────────────────────────────────────── */
const SEED: ComplaintOutcomeRecord[] = [
  {
    id: "co_1",
    complaintDate: d(-42),
    complainant: "Casey T",
    source: "child",
    theme: "privacy",
    outcome: "upheld",
    investigatedBy: "staff_darren",
    dateResolved: d(-28),
    responseTimeDays: 14,
    youngPersonId: "yp_casey",
    summary: "Casey complained that a member of staff entered her bedroom without knocking during the evening. She felt her privacy was not respected and that this should not happen.",
    findings: "CCTV corridor footage confirmed staff entered Casey's room without knocking at 20:47. The staff member acknowledged this in a reflective discussion and accepted the finding. Casey's right to privacy in her own room is clearly set out in the Children's Guide and the home's Statement of Purpose.",
    lessonsLearned: "All staff must knock and wait for a response before entering a young person's bedroom, except in an emergency or where there is an immediate safeguarding concern. The expectation must be reinforced in supervision and team meetings.",
    practiceChanges: [
      "Privacy protocol re-issued to all staff with sign-off sheet",
      "Privacy reminder added to shift handover checklist",
      "Topic covered in next team meeting with reflective exercise",
    ],
    complainantSatisfied: true,
    escalated: false,
    escalatedTo: null,
    ofstedNotified: false,
  },
  {
    id: "co_2",
    complaintDate: d(-35),
    complainant: "Mr W (Alex's birth father)",
    source: "parent_carer",
    theme: "communication",
    outcome: "partially_upheld",
    investigatedBy: "staff_ryan",
    dateResolved: d(-14),
    responseTimeDays: 21,
    youngPersonId: "yp_alex",
    summary: "Alex's birth father complained that he was not informed when Alex attended A&E following a minor sports injury. He said he should have been contacted the same day regardless of the outcome.",
    findings: "Investigation confirmed Alex attended A&E on the date in question for a sprained wrist sustained during football. The injury was minor, Alex was discharged the same evening, and the social worker was notified the following morning. Mr W was informed two days later. The delegated authority matrix did not explicitly require same-day notification to birth parents for non-emergency A&E attendances, but the complaint highlighted a gap in communication expectations.",
    lessonsLearned: "Where a young person attends hospital for any reason, all individuals with parental responsibility or significant contact should be informed within 24 hours unless there is a safeguarding reason not to. The delegated authority matrix should be updated to reflect this.",
    practiceChanges: [
      "Delegated authority matrix updated to include 24-hour notification requirement for hospital attendances",
      "Communication protocol flowchart created and displayed in the office",
    ],
    complainantSatisfied: true,
    escalated: false,
    escalatedTo: null,
    ofstedNotified: false,
  },
  {
    id: "co_3",
    complaintDate: d(-56),
    complainant: "Jordan M",
    source: "child",
    theme: "food",
    outcome: "not_upheld",
    investigatedBy: "staff_anna",
    dateResolved: d(-38),
    responseTimeDays: 18,
    youngPersonId: "yp_jordan",
    summary: "Jordan complained that the food at the home lacks variety and that the same meals are repeated too often. He said he would like more choice and input into what is cooked.",
    findings: "A review of the four-week menu plan showed 22 distinct main meals across the cycle, with options for halal, vegetarian, and allergy-appropriate alternatives. The menu is reviewed monthly and young people are invited to contribute suggestions at house meetings. Jordan had attended two of the last four house meetings but had not raised the issue there. While the complaint was not upheld on the basis that reasonable variety exists, Jordan's feedback was valued and a menu review was conducted as a result.",
    lessonsLearned: "Even where a complaint is not upheld, the young person's voice must be acknowledged and acted upon where reasonable. Menu reviews should actively seek individual preferences outside of house meetings to ensure all young people feel heard.",
    practiceChanges: [
      "Individual food preference questionnaire introduced for all young people quarterly",
      "Monthly 'choice night' added to the menu where each young person picks a meal in rotation",
    ],
    complainantSatisfied: null,
    escalated: false,
    escalatedTo: null,
    ofstedNotified: false,
  },
  {
    id: "co_4",
    complaintDate: d(-21),
    complainant: "Anonymous",
    source: "anonymous",
    theme: "staff_conduct",
    outcome: "partially_upheld",
    investigatedBy: "staff_darren",
    dateResolved: d(-7),
    responseTimeDays: 14,
    youngPersonId: null,
    summary: "An anonymous complaint was received stating that staff were observed using personal mobile phones during shift, including while supervising young people in communal areas.",
    findings: "An investigation including review of CCTV in communal areas over a two-week sample period identified two occasions where staff appeared to be using personal phones in the lounge while young people were present. Both staff members were spoken to individually. One instance was confirmed as checking a work-related message on a personal device; the other was personal use. The home's phone policy permits brief essential use only and requires phones to be kept in the office during direct care duties.",
    lessonsLearned: "The existing phone policy is adequate but compliance needs reinforcing. Staff must model appropriate phone use and understand that young people notice and may feel undervalued if staff are distracted by devices.",
    practiceChanges: [
      "Phone policy re-issued to all staff with updated acknowledgement form",
      "Phone storage box introduced in the office for shift use",
      "Topic addressed in supervision with both identified staff members",
    ],
    complainantSatisfied: null,
    escalated: false,
    escalatedTo: null,
    ofstedNotified: false,
  },
];

/* ── component ───────────────────────────────────────────────────────── */
export default function ComplaintsOutcomesPage() {
  const [entries] = useState<ComplaintOutcomeRecord[]>(SEED);
  const [search, setSearch] = useState("");
  const [filterOutcome, setFilterOutcome] = useState("all");
  const [filterSource, setFilterSource] = useState("all");
  const [filterTheme, setFilterTheme] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  /* ── filtering & sorting ────────────────────────────────────────── */
  const filtered = useMemo(() => {
    let list = [...entries];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) =>
          e.complainant.toLowerCase().includes(q) ||
          e.summary.toLowerCase().includes(q) ||
          e.findings.toLowerCase().includes(q) ||
          e.lessonsLearned.toLowerCase().includes(q)
      );
    }
    if (filterOutcome !== "all") list = list.filter((e) => e.outcome === filterOutcome);
    if (filterSource !== "all") list = list.filter((e) => e.source === filterSource);
    if (filterTheme !== "all") list = list.filter((e) => e.theme === filterTheme);

    list.sort((a, b) => {
      switch (sortBy) {
        case "date": return b.complaintDate.localeCompare(a.complaintDate);
        case "outcome": return a.outcome.localeCompare(b.outcome);
        case "response": return a.responseTimeDays - b.responseTimeDays;
        default: return 0;
      }
    });
    return list;
  }, [entries, search, filterOutcome, filterSource, filterTheme, sortBy]);

  /* ── stats ──────────────────────────────────────────────────────── */
  const total = entries.length;
  const upheldOrPartial = entries.filter(
    (e) => e.outcome === "upheld" || e.outcome === "partially_upheld"
  ).length;
  const avgResponse = entries.length > 0
    ? Math.round(entries.reduce((sum, e) => sum + e.responseTimeDays, 0) / entries.length)
    : 0;
  const lessonsCount = entries.filter((e) => e.lessonsLearned.trim().length > 0).length;

  /* ── export columns ─────────────────────────────────────────────── */
  const exportCols: ExportColumn<ComplaintOutcomeRecord>[] = [
    { header: "ID", accessor: (r: ComplaintOutcomeRecord) => r.id },
    { header: "Complaint Date", accessor: (r: ComplaintOutcomeRecord) => r.complaintDate },
    { header: "Complainant", accessor: (r: ComplaintOutcomeRecord) => r.complainant },
    { header: "Source", accessor: (r: ComplaintOutcomeRecord) => SOURCE_LABELS[r.source] },
    { header: "Theme", accessor: (r: ComplaintOutcomeRecord) => THEME_LABELS[r.theme] },
    { header: "Outcome", accessor: (r: ComplaintOutcomeRecord) => OUTCOME_LABELS[r.outcome] },
    { header: "Investigated By", accessor: (r: ComplaintOutcomeRecord) => getStaffName(r.investigatedBy) },
    { header: "Date Resolved", accessor: (r: ComplaintOutcomeRecord) => r.dateResolved ?? "" },
    { header: "Response Time (Days)", accessor: (r: ComplaintOutcomeRecord) => r.responseTimeDays },
    { header: "Young Person", accessor: (r: ComplaintOutcomeRecord) => r.youngPersonId ? getYPName(r.youngPersonId) : "" },
    { header: "Summary", accessor: (r: ComplaintOutcomeRecord) => r.summary },
    { header: "Findings", accessor: (r: ComplaintOutcomeRecord) => r.findings },
    { header: "Lessons Learned", accessor: (r: ComplaintOutcomeRecord) => r.lessonsLearned },
    { header: "Practice Changes", accessor: (r: ComplaintOutcomeRecord) => r.practiceChanges.join("; ") },
    { header: "Complainant Satisfied", accessor: (r: ComplaintOutcomeRecord) => r.complainantSatisfied === null ? "Pending" : r.complainantSatisfied ? "Yes" : "No" },
    { header: "Escalated", accessor: (r: ComplaintOutcomeRecord) => r.escalated ? "Yes" : "No" },
    { header: "Escalated To", accessor: (r: ComplaintOutcomeRecord) => r.escalatedTo ?? "" },
    { header: "Ofsted Notified", accessor: (r: ComplaintOutcomeRecord) => r.ofstedNotified ? "Yes" : "No" },
  ];

  return (
    <PageShell
      title="Complaints Outcomes"
      subtitle="Investigation outcomes, learning points, practice changes, and response timescales"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Complaints Outcomes" />
          <ExportButton data={filtered} columns={exportCols} filename="complaints-outcomes" />
          <Button onClick={() => setShowNew(true)}>
            <Plus className="h-4 w-4 mr-2" /> Record Outcome
          </Button>
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        {/* ── stat strip ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Complaints", value: total, icon: ClipboardCheck, colour: "text-indigo-600" },
            { label: "Upheld / Partial", value: upheldOrPartial, icon: AlertTriangle, colour: upheldOrPartial > 0 ? "text-amber-600" : "text-emerald-600" },
            { label: "Avg Response (Days)", value: `${avgResponse}`, icon: Clock, colour: avgResponse > 28 ? "text-red-600" : "text-emerald-600" },
            { label: "Lessons Documented", value: lessonsCount, icon: BookOpen, colour: "text-teal-600" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border bg-white p-4 flex items-center gap-3">
              <s.icon className={cn("h-5 w-5", s.colour)} />
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-lg font-bold">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── filters ─────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 items-end">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search complaints, findings, lessons..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filterOutcome} onValueChange={setFilterOutcome}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Outcomes</SelectItem>
                {OUTCOMES.map((o) => (
                  <SelectItem key={o} value={o}>{OUTCOME_LABELS[o]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Select value={filterSource} onValueChange={setFilterSource}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              {SOURCES.map((s) => (
                <SelectItem key={s} value={s}>{SOURCE_LABELS[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterTheme} onValueChange={setFilterTheme}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Themes</SelectItem>
              {THEMES.map((t) => (
                <SelectItem key={t} value={t}>{THEME_LABELS[t]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date (Recent)</SelectItem>
                <SelectItem value="outcome">Outcome</SelectItem>
                <SelectItem value="response">Response Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── outcome cards ───────────────────────────────────────── */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <ClipboardCheck className="h-10 w-10 mx-auto mb-3 text-slate-300" />
              No complaint outcomes match your filters.
            </div>
          )}
          {filtered.map((entry) => {
            const isExpanded = expanded === entry.id;
            const withinTarget = entry.responseTimeDays <= 28;
            return (
              <div
                key={entry.id}
                className={cn(
                  "rounded-xl border border-l-4 bg-white overflow-hidden",
                  OUTCOME_CARD_BORDER[entry.outcome]
                )}
              >
                {/* collapsed header */}
                <button
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : entry.id)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Scale className={cn("h-5 w-5 shrink-0", OUTCOME_COLOUR[entry.outcome].split(" ")[1])} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium">{entry.complainant}</p>
                        <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 border", OUTCOME_COLOUR[entry.outcome])}>
                          {OUTCOME_LABELS[entry.outcome]}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {THEME_LABELS[entry.theme]}
                        </Badge>
                        {!withinTarget && entry.outcome !== "ongoing" && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-red-50 text-red-700 border-red-200">
                            Exceeded 28-day target
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {entry.complaintDate} · {SOURCE_LABELS[entry.source]} · {entry.responseTimeDays} day response
                        {entry.youngPersonId ? ` · Re: ${getYPName(entry.youngPersonId)}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {entry.escalated && (
                      <Badge variant="outline" className="text-[10px] bg-rose-50 text-rose-700 border-rose-200">
                        Escalated
                      </Badge>
                    )}
                    {entry.ofstedNotified && (
                      <Badge variant="outline" className="text-[10px] bg-violet-50 text-violet-700 border-violet-200">
                        Ofsted Notified
                      </Badge>
                    )}
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>

                {/* expanded detail */}
                {isExpanded && (
                  <div className="border-t bg-slate-50 p-4 space-y-4">
                    {/* summary */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <FileText className="h-4 w-4 text-slate-500" />
                          Summary of Complaint
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-slate-700">{entry.summary}</p>
                      </CardContent>
                    </Card>

                    {/* findings */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Scale className="h-4 w-4 text-indigo-500" />
                          Investigation Findings
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-slate-700">{entry.findings}</p>
                      </CardContent>
                    </Card>

                    {/* lessons learned */}
                    <div className="rounded-xl border border-teal-200 bg-teal-50 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <BookOpen className="h-4 w-4 text-teal-600" />
                        <p className="text-xs font-semibold text-teal-700 uppercase tracking-wide">Lessons Learned</p>
                      </div>
                      <p className="text-sm text-slate-700">{entry.lessonsLearned}</p>
                    </div>

                    {/* practice changes */}
                    {entry.practiceChanges.length > 0 && (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Practice Changes Implemented</p>
                        </div>
                        <ul className="space-y-1.5">
                          {entry.practiceChanges.map((change, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                              <span className="text-emerald-500 mt-0.5 shrink-0">-</span>
                              {change}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* metadata grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Investigated By:</span>{" "}
                        <span className="font-medium">{getStaffName(entry.investigatedBy)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Date Resolved:</span>{" "}
                        <span className="font-medium">{entry.dateResolved ?? "Pending"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Response Time:</span>{" "}
                        <span className={cn("font-medium", withinTarget ? "text-emerald-600" : "text-red-600")}>
                          {entry.responseTimeDays} days {withinTarget ? "(within target)" : "(exceeded target)"}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Complainant Satisfied:</span>{" "}
                        <span className={cn(
                          "font-medium",
                          entry.complainantSatisfied === true ? "text-emerald-600" :
                          entry.complainantSatisfied === false ? "text-red-600" : "text-slate-500"
                        )}>
                          {entry.complainantSatisfied === null ? "Pending" : entry.complainantSatisfied ? "Yes" : "No"}
                        </span>
                      </div>
                      {entry.youngPersonId && (
                        <div>
                          <span className="text-muted-foreground">Young Person:</span>{" "}
                          <span className="font-medium">{getYPName(entry.youngPersonId)}</span>
                        </div>
                      )}
                      {entry.escalated && (
                        <div>
                          <span className="text-muted-foreground">Escalated To:</span>{" "}
                          <span className="font-medium">{entry.escalatedTo ?? "N/A"}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── regulatory note ──────────────────────────────────────── */}
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-900">
          <strong>Regulatory Basis:</strong> Regulation 39, The Children&apos;s Homes (England) Regulations 2015
          requires the registered person to operate a complaints procedure consistent with the
          Children Act 1989 representations procedure. Complaints must be investigated thoroughly and
          outcomes communicated to the complainant within <strong>28 days</strong>. All complaints, outcomes,
          and actions taken must be recorded, monitored for themes, and reported in Reg 45 quality of care
          reviews. Lessons learned from complaints must inform practice improvements. Upheld complaints
          are a key quality indicator under the ILACS inspection framework.
        </div>
      </div>

      {/* ── new outcome dialog (placeholder) ────────────────────── */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Record Complaint Outcome</DialogTitle>
          </DialogHeader>
          <div className="py-6 text-center text-muted-foreground text-sm">
            <ClipboardCheck className="h-10 w-10 mx-auto mb-3 text-indigo-300" />
            <p>Full form will capture complaint details, investigation</p>
            <p>findings, outcome, lessons learned, and practice changes.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

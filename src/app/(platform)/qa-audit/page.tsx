"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — QA AUDIT PAGE
// Internal quality assurance audits — self-assessment checks, monthly QA
// reviews, and action plans from QA findings.
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { PrintButton } from "@/components/ui/print-button";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Target,
  ArrowUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";

/* ── types ─────────────────────────────────────────────────────────────────── */

type OverallRating = "excellent" | "good" | "requires_improvement" | "inadequate";
type ActionStatus = "completed" | "in_progress" | "pending" | "overdue";

interface QAAuditAction {
  action: string;
  owner: string;
  deadline: string;
  status: ActionStatus;
}

interface QAAuditRecord {
  id: string;
  title: string;
  date: string;
  auditor: string;
  scope: string;
  overallRating: OverallRating;
  score: number;
  findings: string[];
  strengths: string[];
  areasForImprovement: string[];
  actions: QAAuditAction[];
  notes: string;
}

/* ── helpers ───────────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const RATING_LABEL: Record<OverallRating, string> = {
  excellent: "Excellent",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

const RATING_CLR: Record<OverallRating, string> = {
  excellent: "bg-green-100 text-green-800",
  good: "bg-blue-100 text-blue-800",
  requires_improvement: "bg-amber-100 text-amber-800",
  inadequate: "bg-red-100 text-red-800",
};

const BORDER_RATING: Record<OverallRating, string> = {
  excellent: "border-l-green-500",
  good: "border-l-blue-500",
  requires_improvement: "border-l-amber-500",
  inadequate: "border-l-red-500",
};

const ACTION_STATUS_CLR: Record<ActionStatus, string> = {
  completed: "bg-green-100 text-green-800",
  in_progress: "bg-blue-100 text-blue-800",
  pending: "bg-slate-100 text-slate-700",
  overdue: "bg-red-100 text-red-800",
};

/* ── seed data ─────────────────────────────────────────────────────────────── */

const SEED: QAAuditRecord[] = [
  {
    id: "qa_1",
    title: "Monthly Case File Audit",
    date: d(-7),
    auditor: "staff_darren",
    scope: "All children's case files",
    overallRating: "good",
    score: 87,
    findings: [
      "Care plans current for all children",
      "Risk assessments up to date across all placements",
      "One daily log entry missing detail — shift of 12th lacked context for behaviour incident",
    ],
    strengths: [
      "Consistent recording standards across team",
      "Care plans reviewed within timescale",
      "Risk assessments reflect current circumstances",
    ],
    areasForImprovement: [
      "Daily log entries should include full context for any incident, however minor",
    ],
    actions: [
      {
        action: "Staff reminded about recording standards — detail required in all daily log entries",
        owner: "staff_darren",
        deadline: d(-5),
        status: "completed",
      },
    ],
    notes: "Monthly review of all case files as per Reg 35. Overall a strong audit with only one minor finding. Team recording has improved significantly since last month's feedback.",
  },
  {
    id: "qa_2",
    title: "Medication Audit",
    date: d(-30),
    auditor: "staff_ryan",
    scope: "Medication storage, records, administration",
    overallRating: "excellent",
    score: 100,
    findings: [
      "All stock balanced — no discrepancies",
      "Records accurate across all MAR charts",
      "Storage conditions met — temperature within range, cabinet locked",
      "No administration errors identified",
    ],
    strengths: [
      "Excellent medication management across all areas",
      "Dual-signature protocol consistently followed",
      "Stock reconciliation accurate",
      "Storage conditions exemplary",
    ],
    areasForImprovement: [],
    actions: [],
    notes: "Full medication audit completed with zero findings requiring action. Team commended for maintaining high standards. Result shared with pharmacy for their records.",
  },
  {
    id: "qa_3",
    title: "Health & Safety Walkthrough",
    date: d(-14),
    auditor: "staff_darren",
    scope: "Building safety, fire equipment, first aid, hygiene",
    overallRating: "good",
    score: 92,
    findings: [
      "Fire extinguisher in kitchen due for service — now booked with contractor",
      "All fire exits clear and unobstructed",
      "First aid kit fully replenished",
      "All areas clean and hygienic",
    ],
    strengths: [
      "Building maintained to high standard",
      "Fire exits consistently clear",
      "First aid supplies well-managed",
      "Cleaning schedules adhered to",
    ],
    areasForImprovement: [
      "Fire equipment servicing should be flagged earlier — ideally 4 weeks before due date",
    ],
    actions: [
      {
        action: "Fire extinguisher service booked with approved contractor",
        owner: "staff_darren",
        deadline: d(-7),
        status: "completed",
      },
    ],
    notes: "Quarterly H&S walkthrough. Building in good condition. Only finding relates to fire extinguisher service date — proactive system needed to flag these earlier. Service now booked.",
  },
  {
    id: "qa_4",
    title: "Staff Supervision & Training Audit",
    date: d(-21),
    auditor: "staff_darren",
    scope: "Supervision records, training compliance",
    overallRating: "requires_improvement",
    score: 71,
    findings: [
      "Edward's supervision overdue by 8 days",
      "Mirela missing 1 mandatory training module (fire safety refresher)",
      "All other staff supervision records up to date",
      "Training compliance otherwise above target",
    ],
    strengths: [
      "Majority of staff supervision on schedule",
      "Good-quality supervision notes with clear actions",
      "Training plan in place for all staff",
    ],
    areasForImprovement: [
      "Supervision must not exceed 6-week cycle — system needed to alert before overdue",
      "Mandatory training gaps must be addressed within 5 working days of identification",
    ],
    actions: [
      {
        action: "Edward's supervision scheduled urgently — booked within 48 hours",
        owner: "staff_darren",
        deadline: d(-19),
        status: "completed",
      },
      {
        action: "Mirela enrolled on fire safety refresher module",
        owner: "staff_darren",
        deadline: d(-14),
        status: "completed",
      },
    ],
    notes: "Audit identified two gaps requiring immediate attention. Both addressed within timescale. Supervision tracker updated to send reminders at 5 weeks to prevent future breaches. Ofsted expectation is that supervision is regular and recorded — this finding would be flagged in inspection.",
  },
];

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function QAAuditPage() {
  const [data] = useState(SEED);
  const [search, setSearch] = useState("");
  const [filterRating, setFilterRating] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggle = (id: string) => setExpandedId((prev) => (prev === id ? null : id));

  /* ── derived ─────────────────────────────────────────────────────────────── */

  const filtered = useMemo(() => {
    let rows = data.filter((r) => {
      if (filterRating !== "all" && r.overallRating !== filterRating) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          r.title.toLowerCase().includes(q) ||
          r.scope.toLowerCase().includes(q) ||
          r.findings.some((f) => f.toLowerCase().includes(q)) ||
          getStaffName(r.auditor).toLowerCase().includes(q)
        );
      }
      return true;
    });
    rows = [...rows].sort((a, b) => {
      switch (sortBy) {
        case "date-desc": return b.date.localeCompare(a.date);
        case "date-asc": return a.date.localeCompare(b.date);
        case "score-desc": return b.score - a.score;
        case "score-asc": return a.score - b.score;
        default: return 0;
      }
    });
    return rows;
  }, [data, search, filterRating, sortBy]);

  /* ── stats ───────────────────────────────────────────────────────────────── */

  const totalAudits = data.length;
  const avgScore = Math.round(data.reduce((sum, r) => sum + r.score, 0) / data.length);
  const areasOfConcern = data.filter((r) => r.overallRating === "requires_improvement" || r.overallRating === "inadequate").length;
  const excellentCount = data.filter((r) => r.overallRating === "excellent").length;

  /* ── export ──────────────────────────────────────────────────────────────── */

  const exportCols: ExportColumn<QAAuditRecord>[] = [
    { header: "Title", accessor: (r: QAAuditRecord) => r.title },
    { header: "Date", accessor: (r: QAAuditRecord) => r.date },
    { header: "Auditor", accessor: (r: QAAuditRecord) => getStaffName(r.auditor) },
    { header: "Scope", accessor: (r: QAAuditRecord) => r.scope },
    { header: "Overall Rating", accessor: (r: QAAuditRecord) => RATING_LABEL[r.overallRating] },
    { header: "Score %", accessor: (r: QAAuditRecord) => `${r.score}%` },
    { header: "Findings", accessor: (r: QAAuditRecord) => r.findings.join("; ") },
    { header: "Strengths", accessor: (r: QAAuditRecord) => r.strengths.join("; ") },
    { header: "Areas for Improvement", accessor: (r: QAAuditRecord) => r.areasForImprovement.join("; ") },
    { header: "Actions", accessor: (r: QAAuditRecord) => r.actions.map((a) => `${a.action} (${a.status})`).join("; ") },
    { header: "Notes", accessor: (r: QAAuditRecord) => r.notes },
  ];

  /* ── render ──────────────────────────────────────────────────────────────── */

  return (
    <PageShell
      title="QA Audit"
      subtitle="Reg 45 · Self-Assessment · Continuous Improvement · Quality Monitoring"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="QA Audit Records" />
          <ExportButton data={filtered} columns={exportCols} filename="qa-audit" />
        </div>
      }
    >
      <div id="print-area">
        {/* ── stat strip ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Audits", value: totalAudits, icon: ClipboardCheck, clr: "text-blue-600" },
            { label: "Average Score", value: `${avgScore}%`, icon: TrendingUp, clr: "text-green-600" },
            { label: "Excellent", value: excellentCount, icon: CheckCircle2, clr: "text-emerald-600" },
            { label: "Areas of Concern", value: areasOfConcern, icon: AlertTriangle, clr: "text-amber-600" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="pt-4 pb-3 text-center">
                <s.icon className={cn("h-5 w-5 mx-auto mb-1", s.clr)} />
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── areas of concern alert ──────────────────────────────────────── */}
        {areasOfConcern > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6 flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-amber-800">{areasOfConcern} audit(s) rated Requires Improvement or below</p>
              <p className="text-amber-700">Action plans must be implemented and progress tracked. Ofsted will expect evidence of self-assessment leading to measurable improvement.</p>
            </div>
          </div>
        )}

        {/* ── regulatory note ─────────────────────────────────────────────── */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-6 flex items-start gap-2">
          <Target className="h-5 w-5 text-slate-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-slate-800">Self-Assessment &amp; Quality Monitoring</p>
            <p className="text-slate-600">Ofsted expects children&apos;s homes to demonstrate continuous improvement through rigorous self-assessment. Internal QA audits evidence proactive quality monitoring, identify areas for development, and show that the home does not wait for external inspection to drive improvement. Reg 45 independent reviews should be complemented by ongoing internal quality checks.</p>
          </div>
        </div>

        {/* ── filters ──────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search audits, findings, auditor…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex items-center gap-1">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              className="text-sm border rounded px-2 py-1.5"
              value={filterRating}
              onChange={(e) => setFilterRating(e.target.value)}
            >
              <option value="all">All Ratings</option>
              <option value="excellent">Excellent</option>
              <option value="good">Good</option>
              <option value="requires_improvement">Requires Improvement</option>
              <option value="inadequate">Inadequate</option>
            </select>
          </div>
          <div className="flex items-center gap-1">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <select
              className="text-sm border rounded px-2 py-1.5"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="score-desc">Highest Score</option>
              <option value="score-asc">Lowest Score</option>
            </select>
          </div>
        </div>

        {/* ── audit records ────────────────────────────────────────────────── */}
        <div className="space-y-3">
          {filtered.map((r) => {
            const open = expandedId === r.id;
            return (
              <Card key={r.id} className={cn("border-l-4", BORDER_RATING[r.overallRating])}>
                <CardHeader className="pb-2 cursor-pointer" onClick={() => toggle(r.id)}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        {r.title}
                        <Badge variant="outline" className={RATING_CLR[r.overallRating]}>{RATING_LABEL[r.overallRating]}</Badge>
                        <Badge variant="outline" className="bg-slate-100 text-slate-800">{r.score}%</Badge>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {r.date} · Auditor: {getStaffName(r.auditor)} · Scope: {r.scope}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {r.actions.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {r.actions.filter((a) => a.status === "completed").length}/{r.actions.length} actions done
                        </Badge>
                      )}
                      {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </div>
                </CardHeader>
                {open && (
                  <CardContent className="pt-0 space-y-4 text-sm">
                    {/* findings */}
                    <div>
                      <p className="font-semibold text-slate-700 mb-1">Findings</p>
                      <ul className="list-disc list-inside space-y-0.5 text-slate-600">
                        {r.findings.map((f, i) => <li key={i}>{f}</li>)}
                      </ul>
                    </div>

                    {/* strengths */}
                    {r.strengths.length > 0 && (
                      <div>
                        <p className="font-semibold text-green-700 mb-1">Strengths</p>
                        <ul className="list-disc list-inside space-y-0.5 text-green-600">
                          {r.strengths.map((s, i) => <li key={i}>{s}</li>)}
                        </ul>
                      </div>
                    )}

                    {/* areas for improvement */}
                    {r.areasForImprovement.length > 0 && (
                      <div>
                        <p className="font-semibold text-amber-700 mb-1">Areas for Improvement</p>
                        <ul className="list-disc list-inside space-y-0.5 text-amber-600">
                          {r.areasForImprovement.map((a, i) => <li key={i}>{a}</li>)}
                        </ul>
                      </div>
                    )}

                    {/* actions */}
                    {r.actions.length > 0 && (
                      <div>
                        <p className="font-semibold text-slate-700 mb-2">Action Plan</p>
                        <div className="space-y-2">
                          {r.actions.map((a, i) => (
                            <div key={i} className="bg-muted/40 rounded p-2 flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <p className="text-slate-700">{a.action}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  Owner: {getStaffName(a.owner)} · Deadline: {a.deadline}
                                </p>
                              </div>
                              <Badge variant="outline" className={ACTION_STATUS_CLR[a.status]}>
                                {a.status.replace("_", " ")}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* notes */}
                    {r.notes && (
                      <div>
                        <p className="font-semibold text-slate-700 mb-1">Notes</p>
                        <p className="text-slate-600">{r.notes}</p>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <ClipboardCheck className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p>No QA audits match the current filters.</p>
          </div>
        )}
      </div>
    </PageShell>
  );
}

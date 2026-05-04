"use client";

import { useState, useMemo } from "react";
import {
  UserMinus, Plus, Search, ArrowUpDown, Filter,
  ChevronDown, ChevronUp, Star, TrendingUp,
  MessageSquare, ThumbsUp, AlertTriangle, Shield,
} from "lucide-react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";

/* ── helpers ─────────────────────────────────────────────────────────── */
const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

/* ── types ───────────────────────────────────────────────────────────── */
const REASON_TYPES = [
  "dismissed", "resigned_career", "resigned_personal",
  "resigned_workload", "retired", "end_of_contract",
] as const;
type ReasonType = typeof REASON_TYPES[number];

const REASON_LABELS: Record<ReasonType, string> = {
  dismissed: "Dismissed",
  resigned_career: "Resigned — Career Progression",
  resigned_personal: "Resigned — Personal/Relocation",
  resigned_workload: "Resigned — Workload",
  retired: "Retired",
  end_of_contract: "End of Contract",
};

const REASON_COLORS: Record<ReasonType, string> = {
  dismissed: "bg-red-100 text-red-800",
  resigned_career: "bg-blue-100 text-blue-800",
  resigned_personal: "bg-purple-100 text-purple-800",
  resigned_workload: "bg-orange-100 text-orange-800",
  retired: "bg-green-100 text-green-800",
  end_of_contract: "bg-slate-100 text-slate-800",
};

const STATUS_TYPES = ["completed", "declined", "pending", "not_applicable"] as const;
type StatusType = typeof STATUS_TYPES[number];

const STATUS_LABELS: Record<StatusType, string> = {
  completed: "Completed",
  declined: "Declined",
  pending: "Pending",
  not_applicable: "N/A",
};

const STATUS_COLORS: Record<StatusType, string> = {
  completed: "bg-green-100 text-green-800",
  declined: "bg-red-100 text-red-800",
  pending: "bg-yellow-100 text-yellow-800",
  not_applicable: "bg-slate-100 text-slate-800",
};

interface ExitInterview {
  id: string;
  staffName: string;
  reason: ReasonType;
  interviewDate: string;
  interviewer: string;
  status: StatusType;
  overallRating: number | null;
  positives: string[];
  improvements: string[];
  wouldRecommend: boolean | null;
  themes: string[];
  notes: string;
  confidential: boolean;
}

/* ── seed data ───────────────────────────────────────────────────────── */
const SEED: ExitInterview[] = [
  {
    id: "exit_1",
    staffName: getStaffName("staff_diane"),
    reason: "dismissed",
    interviewDate: d(-45),
    interviewer: "staff_darren",
    status: "declined",
    overallRating: null,
    positives: [],
    improvements: [],
    wouldRecommend: null,
    themes: [],
    notes: "Diane was dismissed following a substantiated LADO investigation. She declined the exit interview through her union representative. HR notified. Reference restrictions in place.",
    confidential: true,
  },
  {
    id: "exit_2",
    staffName: "Tom Birch",
    reason: "resigned_career",
    interviewDate: d(-90),
    interviewer: "staff_darren",
    status: "completed",
    overallRating: 8,
    positives: [
      "Great team — supportive and collaborative working environment",
      "Good supervision and management support",
      "Felt valued and listened to",
    ],
    improvements: [
      "More structured CPD pathway would help retention",
      "Clearer progression routes within the organisation",
    ],
    wouldRecommend: true,
    themes: ["career progression", "CPD"],
    notes: "Tom left to take a senior role at another children’s home. Positive departure — willing to provide a reference for Oak House. Expressed gratitude for the experience gained.",
    confidential: false,
  },
  {
    id: "exit_3",
    staffName: "Sian Morris",
    reason: "resigned_personal",
    interviewDate: d(-180),
    interviewer: "staff_ryan",
    status: "completed",
    overallRating: 7,
    positives: [
      "Positive about the team and relationships with the children",
      "Felt well-supported by management",
      "Good induction and training on arrival",
    ],
    improvements: [
      "Consider flexible working patterns — night shifts were challenging",
      "More notice on rota changes would be appreciated",
    ],
    wouldRecommend: true,
    themes: ["work-life balance", "flexible working"],
    notes: "Sian relocated to be closer to family. Found night shifts challenging but overall a positive experience. Would consider returning if circumstances allowed.",
    confidential: false,
  },
];

/* ── component ───────────────────────────────────────────────────────── */
export default function StaffExitInterviewsPage() {
  const [records] = useState<ExitInterview[]>(SEED);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterReason, setFilterReason] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  /* ── filtering & sorting ───────────────────────────────────────────── */
  const filtered = useMemo(() => {
    let list = [...records];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.staffName.toLowerCase().includes(q) ||
          r.notes.toLowerCase().includes(q) ||
          r.themes.some((t) => t.toLowerCase().includes(q)) ||
          r.positives.some((p) => p.toLowerCase().includes(q)) ||
          r.improvements.some((i) => i.toLowerCase().includes(q))
      );
    }
    if (filterStatus !== "all") list = list.filter((r) => r.status === filterStatus);
    if (filterReason !== "all") list = list.filter((r) => r.reason === filterReason);

    list.sort((a, b) => {
      switch (sortBy) {
        case "date": return b.interviewDate.localeCompare(a.interviewDate);
        case "name": return a.staffName.localeCompare(b.staffName);
        case "rating": return (b.overallRating ?? 0) - (a.overallRating ?? 0);
        case "reason": return a.reason.localeCompare(b.reason);
        default: return 0;
      }
    });
    return list;
  }, [records, search, filterStatus, filterReason, sortBy]);

  /* ── summary stats ─────────────────────────────────────────────────── */
  const totalExits = records.length;
  const completedInterviews = records.filter((r) => r.status === "completed");
  const avgRating = completedInterviews.length > 0
    ? (completedInterviews.reduce((s, r) => s + (r.overallRating ?? 0), 0) / completedInterviews.length).toFixed(1)
    : "—";
  const allThemes = records.flatMap((r) => r.themes);
  const themeCounts = allThemes.reduce<Record<string, number>>((acc, t) => {
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {});
  const topThemes = Object.entries(themeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const recommendCount = records.filter((r) => r.wouldRecommend === true).length;

  /* ── export columns ────────────────────────────────────────────────── */
  const exportCols: ExportColumn<ExitInterview>[] = [
    { header: "ID", accessor: (r: ExitInterview) => r.id },
    { header: "Staff Member", accessor: (r: ExitInterview) => r.staffName },
    { header: "Reason", accessor: (r: ExitInterview) => REASON_LABELS[r.reason] },
    { header: "Interview Date", accessor: (r: ExitInterview) => r.interviewDate },
    { header: "Interviewer", accessor: (r: ExitInterview) => getStaffName(r.interviewer) },
    { header: "Status", accessor: (r: ExitInterview) => STATUS_LABELS[r.status] },
    { header: "Rating", accessor: (r: ExitInterview) => r.overallRating !== null ? String(r.overallRating) : "" },
    { header: "Would Recommend", accessor: (r: ExitInterview) => r.wouldRecommend === null ? "" : r.wouldRecommend ? "Yes" : "No" },
    { header: "Themes", accessor: (r: ExitInterview) => r.themes.join(", ") },
    { header: "Positives", accessor: (r: ExitInterview) => r.positives.join("; ") },
    { header: "Improvements", accessor: (r: ExitInterview) => r.improvements.join("; ") },
    { header: "Notes", accessor: (r: ExitInterview) => r.confidential ? "[CONFIDENTIAL]" : r.notes },
  ];

  return (
    <PageShell
      title="Staff Exit Interviews"
      subtitle="Record and analyse feedback from departing staff to support retention and workforce stability"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Staff Exit Interviews" />
          <ExportButton data={filtered} columns={exportCols} filename="staff-exit-interviews" />
          <Button onClick={() => setShowNew(true)}>
            <Plus className="h-4 w-4 mr-2" /> Record Exit Interview
          </Button>
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        {/* ── summary stats ──────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Exits (12 months)", value: totalExits, icon: UserMinus, colour: "text-blue-600" },
            { label: "Avg. Rating", value: `${avgRating}/10`, icon: Star, colour: "text-amber-600" },
            { label: "Would Recommend", value: `${recommendCount}/${completedInterviews.length}`, icon: ThumbsUp, colour: "text-green-600" },
            { label: "Interviews Completed", value: `${completedInterviews.length}/${totalExits}`, icon: MessageSquare, colour: "text-purple-600" },
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

        {/* ── top themes ─────────────────────────────────────────── */}
        {topThemes.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                Top Themes from Exit Interviews
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {topThemes.map(([theme, count]) => (
                  <Badge key={theme} variant="outline" className="text-sm py-1 px-3">
                    {theme} <span className="ml-1 text-muted-foreground">({count})</span>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── filters ────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 items-end">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search staff, themes, feedback..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {STATUS_TYPES.map((s) => (
                  <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Select value={filterReason} onValueChange={setFilterReason}>
            <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Reasons</SelectItem>
              {REASON_TYPES.map((r) => (
                <SelectItem key={r} value={r}>{REASON_LABELS[r]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date (Recent)</SelectItem>
                <SelectItem value="name">Staff Name</SelectItem>
                <SelectItem value="rating">Rating</SelectItem>
                <SelectItem value="reason">Reason</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── interview cards ────────────────────────────────────── */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">No exit interviews match your filters.</div>
          )}
          {filtered.map((rec) => {
            const isExpanded = expanded === rec.id;
            return (
              <div key={rec.id} className="rounded-xl border bg-white overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : rec.id)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <UserMinus className={cn("h-5 w-5 shrink-0",
                      rec.reason === "dismissed" ? "text-red-600" :
                      rec.status === "completed" ? "text-blue-600" : "text-slate-400"
                    )} />
                    <div className="min-w-0">
                      <p className="font-medium">
                        {rec.staffName}
                        {rec.confidential && (
                          <Shield className="inline h-3.5 w-3.5 ml-1.5 text-red-500" />
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {rec.interviewDate} · Interviewed by {getStaffName(rec.interviewer)}
                        {rec.overallRating !== null && ` · ${rec.overallRating}/10`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={cn("text-xs", REASON_COLORS[rec.reason])}>
                      {REASON_LABELS[rec.reason]}
                    </Badge>
                    <Badge className={cn("text-xs", STATUS_COLORS[rec.status])}>
                      {STATUS_LABELS[rec.status]}
                    </Badge>
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t bg-slate-50 p-4 space-y-4">
                    {/* overview row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Reason:</span>{" "}
                        <span className="font-medium">{REASON_LABELS[rec.reason]}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Status:</span>{" "}
                        <span className="font-medium">{STATUS_LABELS[rec.status]}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Rating:</span>{" "}
                        <span className="font-medium">{rec.overallRating !== null ? `${rec.overallRating}/10` : "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Would Recommend:</span>{" "}
                        <span className="font-medium">
                          {rec.wouldRecommend === null ? "N/A" : rec.wouldRecommend ? "Yes" : "No"}
                        </span>
                      </div>
                    </div>

                    {/* positives */}
                    {rec.positives.length > 0 && (
                      <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                        <p className="text-xs font-medium text-green-700 mb-2">Positives</p>
                        <ul className="space-y-1">
                          {rec.positives.map((p, i) => (
                            <li key={i} className="text-sm flex items-start gap-2">
                              <ThumbsUp className="h-3.5 w-3.5 text-green-600 mt-0.5 shrink-0" />
                              {p}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* improvements */}
                    {rec.improvements.length > 0 && (
                      <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                        <p className="text-xs font-medium text-amber-700 mb-2">Suggested Improvements</p>
                        <ul className="space-y-1">
                          {rec.improvements.map((imp, i) => (
                            <li key={i} className="text-sm flex items-start gap-2">
                              <TrendingUp className="h-3.5 w-3.5 text-amber-600 mt-0.5 shrink-0" />
                              {imp}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* themes */}
                    {rec.themes.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1.5 font-medium">Themes</p>
                        <div className="flex flex-wrap gap-1.5">
                          {rec.themes.map((theme) => (
                            <Badge key={theme} variant="outline" className="text-xs">
                              {theme}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* notes */}
                    <div className="rounded-lg bg-white border p-3">
                      <p className="text-xs text-muted-foreground mb-1 font-medium">
                        Notes
                        {rec.confidential && (
                          <Badge className="ml-2 text-[10px] bg-red-100 text-red-700">Confidential</Badge>
                        )}
                      </p>
                      <p className="text-sm">{rec.notes}</p>
                    </div>

                    <div className="text-sm text-muted-foreground">
                      Interviewed by {getStaffName(rec.interviewer)}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── regulatory note ────────────────────────────────────── */}
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-900">
          <strong>Staff Retention &amp; Workforce Stability:</strong> Ofsted considers staff turnover
          and retention as part of their assessment of leadership and management. High staff turnover
          can affect placement stability and the quality of care provided to children. Exit interviews
          should be conducted with all departing staff where possible, and themes analysed to inform
          retention strategies. The Children&apos;s Home Regulations 2015 (Reg 33/34) require monitoring
          of workforce matters, and the registered person should demonstrate awareness of staffing trends
          and their impact on outcomes for children.
        </div>
      </div>

      {/* ── placeholder dialog ──────────────────────────────────── */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Record Exit Interview</DialogTitle>
          </DialogHeader>
          <div className="py-6 text-center text-muted-foreground text-sm">
            <UserMinus className="h-10 w-10 mx-auto mb-3 text-blue-300" />
            <p>Full form will capture staff details, reason for leaving,</p>
            <p>feedback, rating, themes, and confidentiality settings.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

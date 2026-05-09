"use client";

import { useState, useMemo } from "react";
import {
  HeartPulse, Plus, Search, ArrowUpDown, Filter,
  AlertTriangle, CheckCircle2, TrendingUp,
  ChevronDown, ChevronUp, Smile, Meh, Frown,
  Clock, Loader2,
} from "lucide-react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";
import { useStaffWellbeingRecords } from "@/hooks/use-staff-wellbeing-records";
import type { StaffWellbeingRecord, StaffWellbeingCheckType } from "@/types/extended";
import { STAFF_WELLBEING_CHECK_TYPE_LABEL } from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

/* ── local config ───────────────────────────────────────────────────── */

const SCORE_LABELS = ["Very Low", "Low", "Moderate", "Good", "Excellent"];
const SCORE_COLORS = [
  "bg-red-100 text-red-800", "bg-orange-100 text-orange-800",
  "bg-yellow-100 text-yellow-800", "bg-blue-100 text-blue-800",
  "bg-green-100 text-green-800",
];

const ScoreIcon = ({ score }: { score: number }) => {
  if (score >= 4) return <Smile className="h-4 w-4 text-green-600" />;
  if (score === 3) return <Meh className="h-4 w-4 text-yellow-600" />;
  return <Frown className="h-4 w-4 text-red-600" />;
};

/* ── component ───────────────────────────────────────────────────────── */
export default function StaffWellbeingPage() {
  const { data: records = [], isLoading } = useStaffWellbeingRecords();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  const filtered = useMemo(() => {
    let list = [...records];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          getStaffName(c.staff_id).toLowerCase().includes(q) ||
          c.notes.toLowerCase().includes(q) ||
          c.stressors.some((s) => s.toLowerCase().includes(q))
      );
    }
    if (filterType !== "all") list = list.filter((c) => c.type === filterType);

    list.sort((a, b) => {
      switch (sortBy) {
        case "date": return b.date.localeCompare(a.date);
        case "score": return a.overall_score - b.overall_score;
        case "staff": return getStaffName(a.staff_id).localeCompare(getStaffName(b.staff_id));
        default: return 0;
      }
    });
    return list;
  }, [records, search, filterType, sortBy]);

  const total = records.length;
  const avgScore = records.length > 0 ? (records.reduce((s, c) => s + c.overall_score, 0) / records.length).toFixed(1) : "—";
  const lowScores = records.filter((c) => c.overall_score <= 2).length;
  const pendingFollowUp = records.filter((c) => c.follow_up_date && c.follow_up_date <= today).length;

  const exportCols: ExportColumn<StaffWellbeingRecord>[] = [
    { header: "ID", accessor: (r: StaffWellbeingRecord) => r.id },
    { header: "Staff", accessor: (r: StaffWellbeingRecord) => getStaffName(r.staff_id) },
    { header: "Date", accessor: (r: StaffWellbeingRecord) => r.date },
    { header: "Type", accessor: (r: StaffWellbeingRecord) => STAFF_WELLBEING_CHECK_TYPE_LABEL[r.type] },
    { header: "Overall Score", accessor: (r: StaffWellbeingRecord) => `${r.overall_score}/5` },
    { header: "Workload", accessor: (r: StaffWellbeingRecord) => `${r.workload_score}/5` },
    { header: "Support", accessor: (r: StaffWellbeingRecord) => `${r.support_score}/5` },
    { header: "Morale", accessor: (r: StaffWellbeingRecord) => `${r.moral_score}/5` },
    { header: "Stressors", accessor: (r: StaffWellbeingRecord) => r.stressors.join("; ") },
    { header: "Positives", accessor: (r: StaffWellbeingRecord) => r.positives.join("; ") },
    { header: "Support Needed", accessor: (r: StaffWellbeingRecord) => r.support_needed },
    { header: "Action Agreed", accessor: (r: StaffWellbeingRecord) => r.action_agreed },
    { header: "Follow-Up", accessor: (r: StaffWellbeingRecord) => r.follow_up_date ?? "N/A" },
    { header: "Conducted By", accessor: (r: StaffWellbeingRecord) => getStaffName(r.conducted_by) },
  ];

  if (isLoading) {
    return (
      <PageShell title="Staff Wellbeing" subtitle="Monitor and support the emotional health and resilience of the team">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Staff Wellbeing"
      subtitle="Monitor and support the emotional health and resilience of the team"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Staff Wellbeing" />
          <ExportButton data={filtered} columns={exportCols} filename="staff-wellbeing" />
          <Button onClick={() => setShowNew(true)}>
            <Plus className="h-4 w-4 mr-2" /> New Check-in
          </Button>
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        {/* ── stats ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Check-ins", value: total, icon: HeartPulse, colour: "text-pink-600" },
            { label: "Avg. Score", value: `${avgScore}/5`, icon: TrendingUp, colour: "text-blue-600" },
            { label: "Low Scores (≤2)", value: lowScores, icon: AlertTriangle, colour: lowScores > 0 ? "text-red-600" : "text-green-600" },
            { label: "Follow-ups Due", value: pendingFollowUp, icon: Clock, colour: pendingFollowUp > 0 ? "text-orange-600" : "text-slate-400" },
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

        {/* ── alerts ────────────────────────────────────────────── */}
        {lowScores > 0 && (
          <div className="rounded-lg border-l-4 border-red-400 bg-red-50 p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <p className="text-sm text-red-800">
                <strong>{lowScores}</strong> staff member(s) reported low wellbeing — ensure follow-up support is in place.
              </p>
            </div>
          </div>
        )}

        {/* ── filters ───────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 items-end">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search staff, stressors, notes…"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {(Object.entries(STAFF_WELLBEING_CHECK_TYPE_LABEL) as [StaffWellbeingCheckType, string][]).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-1">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date (Recent)</SelectItem>
                <SelectItem value="score">Score (Low→High)</SelectItem>
                <SelectItem value="staff">Staff Name</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── list ──────────────────────────────────────────────── */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">No check-ins match your filters.</div>
          )}
          {filtered.map((check) => {
            const isExpanded = expanded === check.id;
            return (
              <div key={check.id} className="rounded-xl border bg-white overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : check.id)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <ScoreIcon score={check.overall_score} />
                    <div className="min-w-0">
                      <p className="font-medium">{getStaffName(check.staff_id)}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {check.date} · {STAFF_WELLBEING_CHECK_TYPE_LABEL[check.type]}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {check.follow_up_date && check.follow_up_date <= today && (
                      <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700">Follow-up Due</Badge>
                    )}
                    <Badge className={cn("text-xs", SCORE_COLORS[check.overall_score - 1])}>
                      {check.overall_score}/5 — {SCORE_LABELS[check.overall_score - 1]}
                    </Badge>
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t bg-slate-50 p-4 space-y-4">
                    {/* scores breakdown */}
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { label: "Workload", score: check.workload_score },
                        { label: "Support", score: check.support_score },
                        { label: "Morale", score: check.moral_score },
                      ].map((s) => (
                        <div key={s.label} className="rounded-lg border bg-white p-3 text-center">
                          <p className="text-xs text-muted-foreground">{s.label}</p>
                          <div className="flex items-center justify-center gap-1 mt-1">
                            <span className="text-lg font-bold">{s.score}</span>
                            <span className="text-xs text-muted-foreground">/5</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1">
                            <div
                              className={cn("h-1.5 rounded-full",
                                s.score >= 4 ? "bg-green-500" : s.score === 3 ? "bg-yellow-500" : "bg-red-500"
                              )}
                              style={{ width: `${(s.score / 5) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* stressors & positives */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                        <p className="text-xs font-medium text-red-700 mb-2">Stressors</p>
                        <ul className="space-y-1">
                          {check.stressors.map((s: string, i: number) => (
                            <li key={i} className="flex items-start gap-1 text-sm">
                              <AlertTriangle className="h-3 w-3 text-red-500 mt-0.5 shrink-0" />
                              <span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                        <p className="text-xs font-medium text-green-700 mb-2">Positives</p>
                        <ul className="space-y-1">
                          {check.positives.map((p: string, i: number) => (
                            <li key={i} className="flex items-start gap-1 text-sm">
                              <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5 shrink-0" />
                              <span>{p}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                      <p className="text-xs font-medium text-blue-700 mb-1">Support Needed</p>
                      <p className="text-sm">{check.support_needed}</p>
                    </div>

                    <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                      <p className="text-xs font-medium text-amber-700 mb-1">Action Agreed</p>
                      <p className="text-sm">{check.action_agreed}</p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div><span className="text-muted-foreground">Conducted By:</span> <span className="font-medium">{getStaffName(check.conducted_by)}</span></div>
                      {check.follow_up_date && (
                        <div><span className="text-muted-foreground">Follow-Up:</span> <span className={cn("font-medium", check.follow_up_date <= today && "text-orange-600")}>{check.follow_up_date}</span></div>
                      )}
                      <div><span className="text-muted-foreground">Confidential:</span> <span className="font-medium">{check.confidential ? "Yes" : "No"}</span></div>
                    </div>

                    {check.notes && (
                      <div className="rounded-lg bg-white border p-3">
                        <p className="text-xs text-muted-foreground mb-1 font-medium">Manager Notes</p>
                        <p className="text-sm">{check.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── reg note ──────────────────────────────────────────── */}
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-900">
          <strong>Staff Welfare:</strong> Regulation 33 requires the registered person to ensure staff
          are supported in their roles. Regular wellbeing checks, post-incident support, and access to
          counselling services are essential. Staff wellbeing directly impacts the quality of care provided
          to children. All wellbeing records are confidential and stored securely.
        </div>
      </div>

      {/* ── placeholder dialog ──────────────────────────────────── */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Wellbeing Check-in</DialogTitle>
          </DialogHeader>
          <div className="py-6 text-center text-muted-foreground text-sm">
            <HeartPulse className="h-10 w-10 mx-auto mb-3 text-pink-300" />
            <p>Full form will capture wellbeing scores, stressors,</p>
            <p>positives, support needs, and agreed actions.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}

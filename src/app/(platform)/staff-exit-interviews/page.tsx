"use client";

import { useState, useMemo } from "react";
import {
  UserMinus, Plus, Search, ArrowUpDown, Filter,
  ChevronDown, ChevronUp, Star, TrendingUp,
  MessageSquare, ThumbsUp, Shield, Loader2,
} from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { getStaffName, STAFF } from "@/lib/seed-data";
import { toast } from "sonner";
import { useStaffExitInterviewRecords, useCreateStaffExitInterviewRecord } from "@/hooks/use-staff-exit-interview-records";
import type { StaffExitInterviewRecord, StaffExitInterviewReason, StaffExitInterviewStatus } from "@/types/extended";
import {
  STAFF_EXIT_INTERVIEW_REASON_LABEL,
  STAFF_EXIT_INTERVIEW_STATUS_LABEL,
} from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";

/* ── local colour maps ─────────────────────────────────────────────── */

const REASON_COLORS: Record<StaffExitInterviewReason, string> = {
  dismissed: "bg-red-100 text-red-800",
  resigned_career: "bg-blue-100 text-blue-800",
  resigned_personal: "bg-purple-100 text-purple-800",
  resigned_workload: "bg-orange-100 text-orange-800",
  retired: "bg-green-100 text-green-800",
  end_of_contract: "bg-slate-100 text-[var(--cs-navy)]",
};

const STATUS_COLORS: Record<StaffExitInterviewStatus, string> = {
  completed: "bg-green-100 text-green-800",
  declined: "bg-red-100 text-red-800",
  pending: "bg-yellow-100 text-yellow-800",
  not_applicable: "bg-slate-100 text-[var(--cs-navy)]",
};

const REASON_TYPES: StaffExitInterviewReason[] = [
  "dismissed", "resigned_career", "resigned_personal",
  "resigned_workload", "retired", "end_of_contract",
];

const STATUS_TYPES: StaffExitInterviewStatus[] = ["completed", "declined", "pending", "not_applicable"];

/* ── component ───────────────────────────────────────────────────────── */
export default function StaffExitInterviewsPage() {
  const { data: records = [], isLoading } = useStaffExitInterviewRecords();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterReason, setFilterReason] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  const createInterview = useCreateStaffExitInterviewRecord();
  const [eiForm, setEiForm] = useState({ staff_name: "", reason: "resigned_career" as StaffExitInterviewReason, interview_date: new Date().toISOString().slice(0, 10), interviewer: "staff_darren", status: "completed" as StaffExitInterviewStatus, overall_rating: "", positives: "", improvements: "", notes: "" });
  const setEI = (k: string, v: unknown) => setEiForm((p) => ({ ...p, [k]: v }));

  const handleSaveInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eiForm.staff_name.trim()) { toast.error("Staff name is required."); return; }
    await createInterview.mutateAsync({ staff_name: eiForm.staff_name.trim(), reason: eiForm.reason, interview_date: eiForm.interview_date, interviewer: eiForm.interviewer, status: eiForm.status, overall_rating: eiForm.overall_rating ? parseInt(eiForm.overall_rating) : null, positives: eiForm.positives.split("\n").filter(Boolean), improvements: eiForm.improvements.split("\n").filter(Boolean), would_recommend: null, themes: [], notes: eiForm.notes.trim(), confidential: true });
    toast.success("Exit interview recorded.");
    setEiForm({ staff_name: "", reason: "resigned_career", interview_date: new Date().toISOString().slice(0, 10), interviewer: "staff_darren", status: "completed", overall_rating: "", positives: "", improvements: "", notes: "" });
    setShowNew(false);
  };

  /* ── filtering & sorting ───────────────────────────────────────────── */
  const filtered = useMemo(() => {
    let list = [...records];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.staff_name.toLowerCase().includes(q) ||
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
        case "date": return b.interview_date.localeCompare(a.interview_date);
        case "name": return a.staff_name.localeCompare(b.staff_name);
        case "rating": return (b.overall_rating ?? 0) - (a.overall_rating ?? 0);
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
    ? (completedInterviews.reduce((s, r) => s + (r.overall_rating ?? 0), 0) / completedInterviews.length).toFixed(1)
    : "—";
  const allThemes = records.flatMap((r) => r.themes);
  const themeCounts = allThemes.reduce<Record<string, number>>((acc, t) => {
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {});
  const topThemes = Object.entries(themeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const recommendCount = records.filter((r) => r.would_recommend === true).length;

  /* ── export columns ────────────────────────────────────────────────── */
  const exportCols: ExportColumn<StaffExitInterviewRecord>[] = [
    { header: "ID", accessor: (r: StaffExitInterviewRecord) => r.id },
    { header: "Staff Member", accessor: (r: StaffExitInterviewRecord) => r.staff_name },
    { header: "Reason", accessor: (r: StaffExitInterviewRecord) => STAFF_EXIT_INTERVIEW_REASON_LABEL[r.reason] },
    { header: "Interview Date", accessor: (r: StaffExitInterviewRecord) => r.interview_date },
    { header: "Interviewer", accessor: (r: StaffExitInterviewRecord) => getStaffName(r.interviewer) },
    { header: "Status", accessor: (r: StaffExitInterviewRecord) => STAFF_EXIT_INTERVIEW_STATUS_LABEL[r.status] },
    { header: "Rating", accessor: (r: StaffExitInterviewRecord) => r.overall_rating !== null ? String(r.overall_rating) : "" },
    { header: "Would Recommend", accessor: (r: StaffExitInterviewRecord) => r.would_recommend === null ? "" : r.would_recommend ? "Yes" : "No" },
    { header: "Themes", accessor: (r: StaffExitInterviewRecord) => r.themes.join(", ") },
    { header: "Positives", accessor: (r: StaffExitInterviewRecord) => r.positives.join("; ") },
    { header: "Improvements", accessor: (r: StaffExitInterviewRecord) => r.improvements.join("; ") },
    { header: "Notes", accessor: (r: StaffExitInterviewRecord) => r.confidential ? "[CONFIDENTIAL]" : r.notes },
  ];

  if (isLoading) {
    return (
      <PageShell title="Staff Exit Interviews" subtitle="Record and analyse feedback from departing staff to support retention and workforce stability">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Staff Exit Interviews"
      subtitle="Record and analyse feedback from departing staff to support retention and workforce stability"
      caraContext={{ pageTitle: "Staff Exit Interviews", sourceType: "staff" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Staff Exit Interviews" />
          <ExportButton data={filtered} columns={exportCols} filename="staff-exit-interviews" />
          <Button onClick={() => setShowNew(true)}>
            <Plus className="h-4 w-4 mr-2" /> Record Exit Interview
          </Button>
          <CaraStudioQuickActionButton context={{ record_type: "staff_training", record_id: "home_oak", home_id: "home_oak" }} />
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
                  <SelectItem key={s} value={s}>{STAFF_EXIT_INTERVIEW_STATUS_LABEL[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Select value={filterReason} onValueChange={setFilterReason}>
            <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Reasons</SelectItem>
              {REASON_TYPES.map((r) => (
                <SelectItem key={r} value={r}>{STAFF_EXIT_INTERVIEW_REASON_LABEL[r]}</SelectItem>
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
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--cs-surface)] transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : rec.id)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <UserMinus className={cn("h-5 w-5 shrink-0",
                      rec.reason === "dismissed" ? "text-red-600" :
                      rec.status === "completed" ? "text-blue-600" : "text-[var(--cs-text-muted)]"
                    )} />
                    <div className="min-w-0">
                      <p className="font-medium">
                        {rec.staff_name}
                        {rec.confidential && (
                          <Shield className="inline h-3.5 w-3.5 ml-1.5 text-red-500" />
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {rec.interview_date} · Interviewed by {getStaffName(rec.interviewer)}
                        {rec.overall_rating !== null && ` · ${rec.overall_rating}/10`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={cn("text-xs", REASON_COLORS[rec.reason])}>
                      {STAFF_EXIT_INTERVIEW_REASON_LABEL[rec.reason]}
                    </Badge>
                    <Badge className={cn("text-xs", STATUS_COLORS[rec.status])}>
                      {STAFF_EXIT_INTERVIEW_STATUS_LABEL[rec.status]}
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
                        <span className="font-medium">{STAFF_EXIT_INTERVIEW_REASON_LABEL[rec.reason]}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Status:</span>{" "}
                        <span className="font-medium">{STAFF_EXIT_INTERVIEW_STATUS_LABEL[rec.status]}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Rating:</span>{" "}
                        <span className="font-medium">{rec.overall_rating !== null ? `${rec.overall_rating}/10` : "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Would Recommend:</span>{" "}
                        <span className="font-medium">
                          {rec.would_recommend === null ? "N/A" : rec.would_recommend ? "Yes" : "No"}
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
          <form onSubmit={handleSaveInterview} className="space-y-3 py-2">
            <div><label className="text-sm font-medium">Staff Name *</label><Input className="mt-1" placeholder="Full name of departing staff member" value={eiForm.staff_name} onChange={(e) => setEI("staff_name", e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-sm font-medium">Reason for Leaving</label>
                <Select value={eiForm.reason} onValueChange={(v) => setEI("reason", v)}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(STAFF_EXIT_INTERVIEW_REASON_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><label className="text-sm font-medium">Status</label>
                <Select value={eiForm.status} onValueChange={(v) => setEI("status", v)}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(STAFF_EXIT_INTERVIEW_STATUS_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-sm font-medium">Interview Date</label><Input type="date" className="mt-1" value={eiForm.interview_date} onChange={(e) => setEI("interview_date", e.target.value)} /></div>
              <div><label className="text-sm font-medium">Overall Rating (1–5)</label><Input type="number" min="1" max="5" className="mt-1" placeholder="Optional" value={eiForm.overall_rating} onChange={(e) => setEI("overall_rating", e.target.value)} /></div>
            </div>
            <div><label className="text-sm font-medium">Interviewer</label>
              <Select value={eiForm.interviewer} onValueChange={(v) => setEI("interviewer", v)}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{STAFF.filter((s) => s.employment_status === "active").map((s) => <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><label className="text-sm font-medium">Positives</label><Textarea className="mt-1" rows={2} placeholder="What did they value? (one per line)" value={eiForm.positives} onChange={(e) => setEI("positives", e.target.value)} /></div>
            <div><label className="text-sm font-medium">Improvements</label><Textarea className="mt-1" rows={2} placeholder="What could be improved? (one per line)" value={eiForm.improvements} onChange={(e) => setEI("improvements", e.target.value)} /></div>
            <div><label className="text-sm font-medium">Notes</label><Textarea className="mt-1" rows={2} placeholder="Additional notes (confidential)…" value={eiForm.notes} onChange={(e) => setEI("notes", e.target.value)} /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
              <Button type="submit" disabled={createInterview.isPending}>{createInterview.isPending ? "Saving…" : "Save Interview"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <CareEventsPanel
        title="Care Events — General"
        category="general"
        days={28}
        defaultCollapsed
      />
      <CaraPanel
        mode="assist"
        pageContext="Staff Exit Interviews — exit interview records, staff turnover themes, retention analysis, workforce feedback, organisational learning, management oversight, Reg 40 workforce evidence"
        recordType="staff_training"
        className="mt-6"
      />
    </PageShell>
  );
}

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
import { toast } from "sonner";
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
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import {
  useComplaintOutcomeRecords,
  useCreateComplaintOutcomeRecord,
} from "@/hooks/use-complaint-outcome-records";
import type {
  ComplaintOutcomeRecord,
  ComplaintOutcome,
  ComplaintSource,
  ComplaintTheme,
} from "@/types/extended";
import {
  COMPLAINT_OUTCOME_LABEL,
  COMPLAINT_SOURCE_LABEL,
  COMPLAINT_THEME_LABEL,
} from "@/types/extended";

/* ── local colour maps ──────────────────────────────────────────────── */
const OUTCOME_COLOUR: Record<ComplaintOutcome, string> = {
  upheld: "bg-red-50 text-red-700 border-red-200",
  partially_upheld: "bg-amber-50 text-amber-700 border-amber-200",
  not_upheld: "bg-emerald-50 text-emerald-700 border-emerald-200",
  inconclusive: "bg-slate-50 text-slate-600 border-slate-200",
  withdrawn: "bg-slate-50 text-slate-500 border-slate-200",
  ongoing: "bg-blue-50 text-blue-700 border-blue-200",
};
const OUTCOME_CARD_BORDER: Record<ComplaintOutcome, string> = {
  upheld: "border-l-red-400",
  partially_upheld: "border-l-amber-400",
  not_upheld: "border-l-emerald-400",
  inconclusive: "border-l-slate-300",
  withdrawn: "border-l-slate-300",
  ongoing: "border-l-blue-400",
};

/* ── component ───────────────────────────────────────────────────────── */
export default function ComplaintsOutcomesPage() {
  const { data, isLoading } = useComplaintOutcomeRecords();
  const entries = data?.data ?? [];
  const createMutation = useCreateComplaintOutcomeRecord();

  const [search, setSearch] = useState("");
  const [filterOutcome, setFilterOutcome] = useState("all");
  const [filterSource, setFilterSource] = useState("all");
  const [filterTheme, setFilterTheme] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  /* ── create-form state ─────────────────────────────────────────── */
  const [newComplaintDate, setNewComplaintDate] = useState("");
  const [newComplainant, setNewComplainant] = useState("");
  const [newSource, setNewSource] = useState<ComplaintSource | "">("");
  const [newTheme, setNewTheme] = useState<ComplaintTheme | "">("");
  const [newSummary, setNewSummary] = useState("");

  const resetForm = () => {
    setNewComplaintDate("");
    setNewComplainant("");
    setNewSource("");
    setNewTheme("");
    setNewSummary("");
  };

  const handleCreate = () => {
    if (!newComplaintDate || !newComplainant || !newSource || !newTheme || !newSummary) {
      toast.error("Please fill in all required fields");
      return;
    }
    createMutation.mutate(
      {
        complaint_date: newComplaintDate,
        complainant: newComplainant,
        source: newSource as ComplaintSource,
        theme: newTheme as ComplaintTheme,
        summary: newSummary,
      },
      {
        onSuccess: () => {
          toast.success("Complaint outcome recorded");
          resetForm();
          setShowNew(false);
        },
        onError: () => {
          toast.error("Failed to record complaint outcome");
        },
      }
    );
  };

  /* ── loading state ─────────────────────────────────────────────── */
  if (isLoading) return <PageShell title="Complaints Outcomes" subtitle="Investigation outcomes, learning points, practice changes, and response timescales"><div /></PageShell>;

  /* ── filtering & sorting ────────────────────────────────────────── */
  const filtered = (() => {
    let list = [...entries];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) =>
          e.complainant.toLowerCase().includes(q) ||
          e.summary.toLowerCase().includes(q) ||
          e.findings.toLowerCase().includes(q) ||
          e.lessons_learned.toLowerCase().includes(q)
      );
    }
    if (filterOutcome !== "all") list = list.filter((e) => e.outcome === filterOutcome);
    if (filterSource !== "all") list = list.filter((e) => e.source === filterSource);
    if (filterTheme !== "all") list = list.filter((e) => e.theme === filterTheme);

    list.sort((a, b) => {
      switch (sortBy) {
        case "date": return b.complaint_date.localeCompare(a.complaint_date);
        case "outcome": return a.outcome.localeCompare(b.outcome);
        case "response": return a.response_time_days - b.response_time_days;
        default: return 0;
      }
    });
    return list;
  })();

  /* ── stats ──────────────────────────────────────────────────────── */
  const total = entries.length;
  const upheldOrPartial = entries.filter(
    (e) => e.outcome === "upheld" || e.outcome === "partially_upheld"
  ).length;
  const avgResponse = entries.length > 0
    ? Math.round(entries.reduce((sum, e) => sum + e.response_time_days, 0) / entries.length)
    : 0;
  const lessonsCount = entries.filter((e) => e.lessons_learned.trim().length > 0).length;

  /* ── export columns ─────────────────────────────────────────────── */
  const exportCols: ExportColumn<ComplaintOutcomeRecord>[] = [
    { header: "ID", accessor: (r: ComplaintOutcomeRecord) => r.id },
    { header: "Complaint Date", accessor: (r: ComplaintOutcomeRecord) => r.complaint_date },
    { header: "Complainant", accessor: (r: ComplaintOutcomeRecord) => r.complainant },
    { header: "Source", accessor: (r: ComplaintOutcomeRecord) => COMPLAINT_SOURCE_LABEL[r.source] },
    { header: "Theme", accessor: (r: ComplaintOutcomeRecord) => COMPLAINT_THEME_LABEL[r.theme] },
    { header: "Outcome", accessor: (r: ComplaintOutcomeRecord) => COMPLAINT_OUTCOME_LABEL[r.outcome] },
    { header: "Investigated By", accessor: (r: ComplaintOutcomeRecord) => getStaffName(r.investigated_by) },
    { header: "Date Resolved", accessor: (r: ComplaintOutcomeRecord) => r.date_resolved ?? "" },
    { header: "Response Time (Days)", accessor: (r: ComplaintOutcomeRecord) => r.response_time_days },
    { header: "Young Person", accessor: (r: ComplaintOutcomeRecord) => r.child_id ? getYPName(r.child_id) : "" },
    { header: "Summary", accessor: (r: ComplaintOutcomeRecord) => r.summary },
    { header: "Findings", accessor: (r: ComplaintOutcomeRecord) => r.findings },
    { header: "Lessons Learned", accessor: (r: ComplaintOutcomeRecord) => r.lessons_learned },
    { header: "Practice Changes", accessor: (r: ComplaintOutcomeRecord) => r.practice_changes.join("; ") },
    { header: "Complainant Satisfied", accessor: (r: ComplaintOutcomeRecord) => r.complainant_satisfied === null ? "Pending" : r.complainant_satisfied ? "Yes" : "No" },
    { header: "Escalated", accessor: (r: ComplaintOutcomeRecord) => r.escalated ? "Yes" : "No" },
    { header: "Escalated To", accessor: (r: ComplaintOutcomeRecord) => r.escalated_to ?? "" },
    { header: "Ofsted Notified", accessor: (r: ComplaintOutcomeRecord) => r.ofsted_notified ? "Yes" : "No" },
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
                {Object.entries(COMPLAINT_OUTCOME_LABEL).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Select value={filterSource} onValueChange={setFilterSource}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              {Object.entries(COMPLAINT_SOURCE_LABEL).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterTheme} onValueChange={setFilterTheme}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Themes</SelectItem>
              {Object.entries(COMPLAINT_THEME_LABEL).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
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
            const withinTarget = entry.response_time_days <= 28;
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
                          {COMPLAINT_OUTCOME_LABEL[entry.outcome]}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {COMPLAINT_THEME_LABEL[entry.theme]}
                        </Badge>
                        {!withinTarget && entry.outcome !== "ongoing" && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-red-50 text-red-700 border-red-200">
                            Exceeded 28-day target
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {entry.complaint_date} · {COMPLAINT_SOURCE_LABEL[entry.source]} · {entry.response_time_days} day response
                        {entry.child_id ? ` · Re: ${getYPName(entry.child_id)}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {entry.escalated && (
                      <Badge variant="outline" className="text-[10px] bg-rose-50 text-rose-700 border-rose-200">
                        Escalated
                      </Badge>
                    )}
                    {entry.ofsted_notified && (
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
                      <p className="text-sm text-slate-700">{entry.lessons_learned}</p>
                    </div>

                    {/* practice changes */}
                    {entry.practice_changes.length > 0 && (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Practice Changes Implemented</p>
                        </div>
                        <ul className="space-y-1.5">
                          {entry.practice_changes.map((change, i) => (
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
                        <span className="font-medium">{getStaffName(entry.investigated_by)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Date Resolved:</span>{" "}
                        <span className="font-medium">{entry.date_resolved ?? "Pending"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Response Time:</span>{" "}
                        <span className={cn("font-medium", withinTarget ? "text-emerald-600" : "text-red-600")}>
                          {entry.response_time_days} days {withinTarget ? "(within target)" : "(exceeded target)"}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Complainant Satisfied:</span>{" "}
                        <span className={cn(
                          "font-medium",
                          entry.complainant_satisfied === true ? "text-emerald-600" :
                          entry.complainant_satisfied === false ? "text-red-600" : "text-slate-500"
                        )}>
                          {entry.complainant_satisfied === null ? "Pending" : entry.complainant_satisfied ? "Yes" : "No"}
                        </span>
                      </div>
                      {entry.child_id && (
                        <div>
                          <span className="text-muted-foreground">Young Person:</span>{" "}
                          <span className="font-medium">{getYPName(entry.child_id)}</span>
                        </div>
                      )}
                      {entry.escalated && (
                        <div>
                          <span className="text-muted-foreground">Escalated To:</span>{" "}
                          <span className="font-medium">{entry.escalated_to ?? "N/A"}</span>
                        </div>
                      )}
                    </div>

                    {/* smart link panel */}
                    {entry.child_id && (
                      <SmartLinkPanel
                        sourceType="complaint-outcome"
                        sourceId={entry.id}
                        childId={entry.child_id}
                        compact
                      />
                    )}
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

      {/* ── new outcome dialog ─────────────────────────────────────── */}
      <Dialog open={showNew} onOpenChange={(open) => { setShowNew(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Record Complaint Outcome</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="new-complaint-date">Complaint Date</Label>
              <Input
                id="new-complaint-date"
                type="date"
                value={newComplaintDate}
                onChange={(e) => setNewComplaintDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-complainant">Complainant</Label>
              <Input
                id="new-complainant"
                placeholder="Name of complainant"
                value={newComplainant}
                onChange={(e) => setNewComplainant(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Source</Label>
              <Select value={newSource} onValueChange={(v) => setNewSource(v as ComplaintSource)}>
                <SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(COMPLAINT_SOURCE_LABEL).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Theme</Label>
              <Select value={newTheme} onValueChange={(v) => setNewTheme(v as ComplaintTheme)}>
                <SelectTrigger><SelectValue placeholder="Select theme" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(COMPLAINT_THEME_LABEL).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-summary">Summary</Label>
              <Textarea
                id="new-summary"
                placeholder="Brief summary of the complaint..."
                rows={3}
                value={newSummary}
                onChange={(e) => setNewSummary(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowNew(false); resetForm(); }}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

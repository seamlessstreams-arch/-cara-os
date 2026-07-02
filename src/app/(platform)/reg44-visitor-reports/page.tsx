"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { PrintButton } from "@/components/ui/print-button";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FlatList, FlatListRow, FlatListRowDetail } from "@/components/ui/list-row";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Search, ChevronDown, ChevronUp, Shield, Calendar,
  Clock, CheckCircle2, AlertTriangle, FileText, Users,
  ClipboardList, Eye, Plus, Loader2, ArrowRight,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useReg44Visits, useUpdateRecommendation, useCreateVisit } from "@/hooks/use-reg44";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import type { Reg44VisitReport, Reg44Recommendation } from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";

/* ── helpers ───────────────────────────────────────────────────────────────── */

type RecommendationPriority = "low" | "medium" | "high";
type RecommendationStatus = "completed" | "in_progress" | "outstanding";

const fmt = (iso: string) => {
  if (!iso) return "";
  const [y, m, day] = iso.split("-");
  return `${day}/${m}/${y}`;
};

const PRIORITY_CLR: Record<RecommendationPriority, string> = {
  low: "bg-[--cs-success-bg] text-[--cs-success]",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
};

const STATUS_CLR: Record<RecommendationStatus, string> = {
  completed: "bg-[--cs-success-bg] text-[--cs-success]",
  in_progress: "bg-[--cs-info-bg] text-[--cs-info]",
  outstanding: "bg-[--cs-risk-bg] text-[--cs-risk]",
};

const STATUS_LABEL: Record<RecommendationStatus, string> = {
  completed: "Completed",
  in_progress: "In Progress",
  outstanding: "Outstanding",
};

const JUDGEMENT_TEXT: Record<string, string> = {
  "Good — no immediate concerns.": "text-[--cs-success]",
  "Good.": "text-[--cs-success]",
  "Good with notable practice.": "text-[--cs-success]",
  "Requires improvement in one area.": "text-[--cs-warning]",
};

/* ── New Visit Form ────────────────────────────────────────────────────────── */

function NewVisitDialog({ onCreated }: { onCreated?: () => void }) {
  const [open, setOpen] = useState(false);
  const createVisit = useCreateVisit();

  const [form, setForm] = useState({
    visit_date: "",
    visitor: "",
    duration: "",
    children_spoken: "",
    staff_spoken: "",
    overall_judgement: "",
    notes: "",
  });

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = () => {
    if (!form.visit_date || !form.visitor) return;
    createVisit.mutate(
      {
        visit_date: form.visit_date,
        visitor: form.visitor,
        duration: form.duration || "0 hours",
        children_spoken: form.children_spoken || "0/0",
        staff_spoken: parseInt(form.staff_spoken) || 0,
        overall_judgement: form.overall_judgement || "Pending review.",
        notes: form.notes,
      },
      {
        onSuccess: () => {
          setOpen(false);
          setForm({ visit_date: "", visitor: "", duration: "", children_spoken: "", staff_spoken: "", overall_judgement: "", notes: "" });
          onCreated?.();
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1">
          <Plus className="h-4 w-4" />
          New Visit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record New Reg 44 Visit</DialogTitle>
          <DialogDescription>
            Enter the details of the independent visitor&apos;s monthly visit.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="visit_date">Visit Date *</Label>
              <Input id="visit_date" type="date" value={form.visit_date} onChange={(e) => set("visit_date", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <Input id="duration" placeholder="e.g. 4 hours" value={form.duration} onChange={(e) => set("duration", e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="visitor">Visitor Name *</Label>
            <Input id="visitor" placeholder="e.g. Margaret Thompson (Independent)" value={form.visitor} onChange={(e) => set("visitor", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="children_spoken">Children Spoken To</Label>
              <Input id="children_spoken" placeholder="e.g. 3/3" value={form.children_spoken} onChange={(e) => set("children_spoken", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff_spoken">Staff Spoken To</Label>
              <Input id="staff_spoken" type="number" placeholder="e.g. 4" value={form.staff_spoken} onChange={(e) => set("staff_spoken", e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="overall_judgement">Overall Judgement</Label>
            <Input id="overall_judgement" placeholder="e.g. Good — no immediate concerns." value={form.overall_judgement} onChange={(e) => set("overall_judgement", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" placeholder="Visitor notes..." rows={3} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={createVisit.isPending || !form.visit_date || !form.visitor}>
            {createVisit.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            Save Visit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── Action Plan Progress Panel ─────────────────────────────────────────────── */

function ActionPlanProgress({
  visits,
  onUpdateStatus,
  isPending,
}: {
  visits: Reg44VisitReport[];
  onUpdateStatus: (visitId: string, recId: string, status: RecommendationStatus) => void;
  isPending: boolean;
}) {
  const allRecs = visits.flatMap((v) =>
    (v.recommendations ?? []).map((r) => ({ ...r, visitId: v.id, visitDate: v.visit_date }))
  );

  const completed = allRecs.filter((r) => r.status === "completed").length;
  const inProgress = allRecs.filter((r) => r.status === "in_progress").length;
  const outstanding = allRecs.filter((r) => r.status === "outstanding").length;
  const total = allRecs.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  const openActions = allRecs.filter((r) => r.status !== "completed");

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-indigo-600" />
          Action Plan Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="text-center">
            <p className="text-2xl font-bold">{total}</p>
            <p className="text-xs text-muted-foreground">Total Recommendations</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-[--cs-success]">{completed}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-[--cs-info]">{inProgress}</p>
            <p className="text-xs text-muted-foreground">In Progress</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-[--cs-risk]">{outstanding}</p>
            <p className="text-xs text-muted-foreground">Outstanding</p>
          </div>
        </div>

        {/* Progress bar */}
        <div>
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>Completion</span>
            <span>{pct}%</span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Outstanding actions list */}
        {openActions.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
              Outstanding Actions ({openActions.length})
            </p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {openActions.map((rec) => (
                <div
                  key={rec.id}
                  className="flex items-start justify-between gap-2 border rounded-lg p-2 bg-muted/20"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{rec.recommendation}</p>
                    <p className="text-xs text-muted-foreground">
                      Visit: {fmt(rec.visitDate)} &middot;{" "}
                      <Badge variant="outline" className={cn("text-[10px] py-0", PRIORITY_CLR[rec.priority])}>
                        {rec.priority}
                      </Badge>
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {rec.status !== "in_progress" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 text-[10px] px-2 text-blue-700 border-blue-200 hover:bg-blue-50"
                        disabled={isPending}
                        onClick={() => onUpdateStatus(rec.visitId, rec.id, "in_progress")}
                      >
                        In Progress
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 text-[10px] px-2 text-green-700 border-green-200 hover:bg-green-50"
                      disabled={isPending}
                      onClick={() => onUpdateStatus(rec.visitId, rec.id, "completed")}
                    >
                      <CheckCircle2 className="h-3 w-3 mr-0.5" />
                      Complete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {openActions.length === 0 && total > 0 && (
          <div className="text-center py-3">
            <CheckCircle2 className="h-6 w-6 text-[--cs-success] mx-auto mb-1" />
            <p className="text-xs text-[--cs-success] font-medium">All recommendations completed</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ── Recommendation with status buttons ────────────────────────────────────── */

function RecommendationRow({
  rec,
  visitId,
  onUpdateStatus,
  isPending,
}: {
  rec: Reg44Recommendation;
  visitId: string;
  onUpdateStatus: (visitId: string, recId: string, status: RecommendationStatus) => void;
  isPending: boolean;
}) {
  return (
    <div className="border rounded-lg p-3 bg-muted/30">
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-xs font-medium flex-1">{rec.recommendation}</p>
        <div className="flex items-center gap-1 shrink-0">
          <Badge variant="outline" className={cn("text-xs", PRIORITY_CLR[rec.priority])}>
            {rec.priority}
          </Badge>
          <Badge variant="outline" className={cn("text-xs", STATUS_CLR[rec.status])}>
            {STATUS_LABEL[rec.status]}
          </Badge>
        </div>
      </div>
      <div className="bg-indigo-50 rounded p-2 mt-1">
        <p className="text-xs text-indigo-800">
          <span className="font-medium">RM Response:</span> {rec.rm_response}
        </p>
      </div>

      {/* Evidence notes */}
      {rec.evidence_notes && (
        <div className="bg-emerald-50 rounded p-2 mt-1">
          <p className="text-xs text-emerald-800">
            <span className="font-medium">Evidence:</span> {rec.evidence_notes}
          </p>
        </div>
      )}

      {/* Status mutation buttons */}
      {rec.status !== "completed" && (
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-dashed">
          <span className="text-[10px] text-muted-foreground uppercase font-semibold">Update:</span>
          {rec.status !== "in_progress" && (
            <Button
              variant="outline"
              size="sm"
              className="h-6 text-[10px] px-2 text-blue-700 border-blue-200 hover:bg-blue-50"
              disabled={isPending}
              onClick={() => onUpdateStatus(visitId, rec.id, "in_progress")}
            >
              <ArrowRight className="h-3 w-3 mr-0.5" />
              In Progress
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="h-6 text-[10px] px-2 text-green-700 border-green-200 hover:bg-green-50"
            disabled={isPending}
            onClick={() => onUpdateStatus(visitId, rec.id, "completed")}
          >
            <CheckCircle2 className="h-3 w-3 mr-0.5" />
            Mark Completed
          </Button>
        </div>
      )}

      {rec.status === "completed" && rec.completed_at && (
        <p className="text-[10px] text-muted-foreground mt-1">
          Completed: {fmt(rec.completed_at)}
        </p>
      )}
    </div>
  );
}

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function Reg44VisitorReportsPage() {
  const { data: queryData, isLoading } = useReg44Visits();
  const updateRecommendation = useUpdateRecommendation();

  const data: Reg44VisitReport[] = queryData?.data ?? [];

  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggle = (id: string) => setExpandedId(expandedId === id ? null : id);

  const handleUpdateStatus = (visitId: string, recId: string, status: RecommendationStatus) => {
    updateRecommendation.mutate({ visit_id: visitId, recommendation_id: recId, status });
  };

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter((r) =>
      r.visitor.toLowerCase().includes(q) ||
      r.overall_judgement.toLowerCase().includes(q) ||
      r.strengths.some((s) => s.toLowerCase().includes(q)) ||
      r.areas_for_development.some((a) => a.toLowerCase().includes(q)) ||
      r.recommendations.some((rec) => rec.recommendation.toLowerCase().includes(q))
    );
  }, [data, search]);

  /* summary stats */
  const visitsCompleted = data.length;
  const outstandingRecommendations = data.reduce(
    (sum, v) => sum + (v.recommendations ?? []).filter((r) => r.status === "outstanding" || r.status === "in_progress").length,
    0
  );
  const avgInterval = useMemo(() => {
    if (data.length < 2) return 0;
    const sorted = [...data].sort((a, b) => a.visit_date.localeCompare(b.visit_date));
    let totalDays = 0;
    for (let i = 1; i < sorted.length; i++) {
      const prev = new Date(sorted[i - 1].visit_date).getTime();
      const curr = new Date(sorted[i].visit_date).getTime();
      totalDays += (curr - prev) / (1000 * 60 * 60 * 24);
    }
    return Math.round(totalDays / (sorted.length - 1));
  }, [data]);

  const exportCols: ExportColumn<Reg44VisitReport>[] = [
    { header: "Visit Date", accessor: (r) => r.visit_date },
    { header: "Visitor", accessor: (r) => r.visitor },
    { header: "Duration", accessor: (r) => r.duration },
    { header: "Children Spoken To", accessor: (r) => r.children_spoken },
    { header: "Staff Spoken To", accessor: (r) => String(r.staff_spoken) },
    { header: "Records Reviewed", accessor: (r) => r.records_reviewed.join(", ") },
    { header: "Overall Judgement", accessor: (r) => r.overall_judgement },
    { header: "Strengths", accessor: (r) => r.strengths.join("; ") },
    { header: "Areas for Development", accessor: (r) => r.areas_for_development.join("; ") },
    { header: "Recommendations", accessor: (r) => r.recommendations.map((rec) => rec.recommendation).join("; ") },
    { header: "Previous Actions", accessor: (r) => r.previous_actions_status },
    { header: "Sent to Ofsted", accessor: (r) => r.report_sent_to_ofsted ? "Yes" : "No" },
    { header: "Sent Date", accessor: (r) => r.report_sent_date },
    { header: "Notes", accessor: (r) => r.notes },
  ];

  if (isLoading) {
    return (
      <PageShell title="Reg 44 Visitor Reports" subtitle="Loading...">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Reg 44 Visitor Reports"
      subtitle="Independent Person monthly visit reports — Children's Homes Regulations 2015, Reg 44"
      caraContext={{ pageTitle: "Reg 44 Visitor Reports", sourceType: "reg45" }}
      actions={
        <div className="flex items-center gap-2">
          <NewVisitDialog />
          <PrintButton title="Reg 44 Visitor Reports" />
          <ExportButton data={filtered} columns={exportCols} filename="reg44-visitor-reports" />
          <CaraStudioQuickActionButton context={{ record_type: "reg45", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="print-area" className="space-y-6">

        {/* -- Summary stats -------------------------------------------------- */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Visits Completed (12 months)", value: visitsCompleted, icon: Calendar, clr: "text-blue-600" },
            { label: "Outstanding Recommendations", value: outstandingRecommendations, icon: AlertTriangle, clr: outstandingRecommendations > 0 ? "text-[--cs-warning]" : "text-[--cs-success]" },
            { label: "Avg. Interval (days)", value: `${avgInterval}`, icon: Clock, clr: avgInterval > 35 ? "text-[--cs-risk]" : "text-[--cs-success]" },
            { label: "Reports Sent to Ofsted", value: data.filter((v) => v.report_sent_to_ofsted).length + "/" + data.length, icon: FileText, clr: "text-indigo-600" },
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

        {/* -- Action Plan Progress ------------------------------------------- */}
        <ActionPlanProgress
          visits={data}
          onUpdateStatus={handleUpdateStatus}
          isPending={updateRecommendation.isPending}
        />

        {/* -- Search --------------------------------------------------------- */}
        <div className="relative max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search reports, findings, recommendations..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <p className="text-xs text-muted-foreground">
          {filtered.length} visit report{filtered.length !== 1 ? "s" : ""}
        </p>

        {/* -- Visit cards ---------------------------------------------------- */}
        <FlatList>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p className="font-medium">No reports match your search</p>
            </div>
          )}

          {filtered.map((visit) => {
            const isOpen = expandedId === visit.id;
            const hasOutstanding = visit.recommendations.some((r) => r.status === "outstanding" || r.status === "in_progress");

            return (
              <div key={visit.id}>
                <FlatListRow severity={hasOutstanding ? "warning" : "success"} onClick={() => toggle(visit.id)} aria-expanded={isOpen}>
                  <div className="flex items-start justify-between flex-1 min-w-0">
                    <div className="space-y-1 min-w-0">
                      <p className="text-base font-semibold text-[var(--cs-navy)] flex items-center gap-2 flex-wrap">
                        {fmt(visit.visit_date)}
                        <span className={cn("text-[11px] font-semibold uppercase tracking-wide", JUDGEMENT_TEXT[visit.overall_judgement] ?? "text-gray-600")}>
                          {visit.overall_judgement}
                        </span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {visit.visitor} &middot; {visit.duration} &middot; Children: {visit.children_spoken} &middot; Staff: {visit.staff_spoken}
                      </p>
                    </div>
                    {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                  </div>
                </FlatListRow>

                {isOpen && (
                  <FlatListRowDetail className="text-sm">
                    {/* Records reviewed */}
                    <div>
                      <p className="font-medium mb-1 flex items-center gap-1">
                        <ClipboardList className="h-3.5 w-3.5" /> Records Reviewed
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {visit.records_reviewed.map((rec) => (
                          <Badge key={rec} variant="outline" className="text-xs bg-slate-50">
                            {rec}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Strengths */}
                    <div className="bg-[--cs-success-bg] rounded-lg p-3">
                      <p className="font-medium text-[--cs-success] mb-2 flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Strengths Identified
                      </p>
                      <ul className="space-y-1">
                        {(visit.strengths ?? []).map((s, i) => (
                          <li key={i} className="text-[--cs-success] text-xs flex items-start gap-2">
                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[--cs-success] shrink-0" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Areas for development */}
                    {visit.areas_for_development.length > 0 && (
                      <div className="bg-[--cs-warning-bg] rounded-lg p-3">
                        <p className="font-medium text-[--cs-warning] mb-2 flex items-center gap-1">
                          <AlertTriangle className="h-3.5 w-3.5" /> Areas for Development
                        </p>
                        <ul className="space-y-1">
                          {visit.areas_for_development.map((a, i) => (
                            <li key={i} className="text-[--cs-warning] text-xs flex items-start gap-2">
                              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[--cs-warning] shrink-0" />
                              {a}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Recommendations */}
                    {(visit.recommendations?.length ?? 0) > 0 && (
                      <div>
                        <p className="font-medium mb-2 flex items-center gap-1">
                          <Eye className="h-3.5 w-3.5" /> Recommendations ({(visit.recommendations?.length ?? 0)})
                        </p>
                        <div className="space-y-2">
                          {(visit.recommendations ?? []).map((rec) => (
                            <RecommendationRow
                              key={rec.id}
                              rec={rec}
                              visitId={visit.id}
                              onUpdateStatus={handleUpdateStatus}
                              isPending={updateRecommendation.isPending}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Previous actions & Ofsted */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t">
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Previous Actions</p>
                        <p className="text-xs">{visit.previous_actions_status}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Sent to Ofsted</p>
                        <p className="text-xs flex items-center gap-1">
                          {visit.report_sent_to_ofsted ? (
                            <><CheckCircle2 className="h-3 w-3 text-[--cs-success]" /> Yes — {fmt(visit.report_sent_date)}</>
                          ) : (
                            <><AlertTriangle className="h-3 w-3 text-[--cs-warning]" /> Not yet sent</>
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Children Spoken To</p>
                        <p className="text-xs flex items-center gap-1">
                          <Users className="h-3 w-3" /> {visit.children_spoken}
                        </p>
                      </div>
                    </div>

                    {/* Notes */}
                    {visit.notes && (
                      <div className="pt-2 border-t">
                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Visitor Notes</p>
                        <p className="text-xs text-muted-foreground">{visit.notes}</p>
                      </div>
                    )}

                    {/* Smart Link Panel */}
                    <div className="pt-2 border-t">
                      <SmartLinkPanel
                        sourceType="reg44"
                        sourceId={visit.id}
                        compact
                      />
                    </div>
                  </FlatListRowDetail>
                )}
              </div>
            );
          })}
        </FlatList>

        {/* -- Regulatory note ------------------------------------------------ */}
        <div className="rounded-lg border border-dashed p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-semibold">Regulatory Context — Regulation 44</p>
              <p>
                <strong>Regulation 44</strong> of the Children&apos;s Homes (England) Regulations 2015 requires that an
                independent person visits the home at least once per month, interviews children (with their consent) and
                staff, inspects records and the physical environment, and produces a written report for the registered
                provider. The visitor must be independent of the home&apos;s management and have no financial interest in
                the home&apos;s operation. Reports must be sent to Ofsted, the placing authority, and any other persons
                specified by the Secretary of State. Ofsted relies on these reports as a key source of intelligence between
                inspections. The Responsible Individual must ensure recommendations are actioned and progress is monitored
                as part of their Regulation 45 oversight duties. Persistent failure to conduct visits or respond to
                recommendations may result in enforcement action.
              </p>
            </div>
          </div>
        </div>

      </div>
      <CareEventsPanel
        title="Care Events — Regulation 44 Evidence"
        category="general"
        days={90}
        defaultCollapsed
      />
      <CaraPanel
        mode="assist"
        pageContext="Reg 44 Visitor Reports — independent visitor reports, monthly visits, children's views, staff interviews, premises inspection findings, action recommendations, RI responses, Ofsted evidence"
        recordType="reg45"
        className="mt-6"
      />
    </PageShell>
  );
}

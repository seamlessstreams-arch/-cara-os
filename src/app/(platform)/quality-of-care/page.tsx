"use client";

import { useState, useMemo } from "react";
import {
  Star, Plus, Search, ArrowUpDown, Filter,
  AlertTriangle, CheckCircle2, TrendingUp, TrendingDown,
  ChevronDown, ChevronUp, Eye, Target, MessageSquare,
  Loader2,
} from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";
import { toast } from "sonner";
import { useQualityOfCareReviews, useCreateQualityOfCareReview } from "@/hooks/use-quality-of-care-reviews";
import type {
  QualityOfCareReview,
  QocReviewType,
  QocRating,
  QocDomainAssessment,
  QocActionItem,
} from "@/types/extended";
import {
  QOC_REVIEW_TYPE_LABEL,
  QOC_RATING_LABEL,
  QOC_DOMAIN_LABEL,
  QOC_TREND_LABEL,
  QOC_ACTION_PRIORITY_LABEL,
  QOC_ACTION_STATUS_LABEL,
} from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

/* ── local colour maps ─────────────────────────────────────────────────── */

const RATINGS: QocRating[] = ["outstanding", "good", "requires_improvement", "inadequate"];

const RATING_COLORS: Record<QocRating, string> = {
  outstanding: "bg-green-100 text-green-800", good: "bg-blue-100 text-blue-800",
  requires_improvement: "bg-orange-100 text-orange-800", inadequate: "bg-red-100 text-red-800",
};

/* ── component ─────────────────────────────────────────────────────────── */

export default function QualityOfCarePage() {
  const { data: records = [], isLoading } = useQualityOfCareReviews();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterRating, setFilterRating] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  const createReview = useCreateQualityOfCareReview();
  const [qocForm, setQocForm] = useState({ date: new Date().toISOString().slice(0, 10), type: "monthly" as QocReviewType, lead_reviewer: "", overall_rating: "good" as QocRating, strengths: "", areas_for_improvement: "", children_feedback: "", staff_feedback: "", next_review_date: "", notes: "" });
  const setQOC = (k: string, v: unknown) => setQocForm((p) => ({ ...p, [k]: v }));

  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qocForm.lead_reviewer.trim()) { toast.error("Lead reviewer is required."); return; }
    await createReview.mutateAsync({ date: qocForm.date, type: qocForm.type, lead_reviewer: qocForm.lead_reviewer.trim(), overall_rating: qocForm.overall_rating, domains: [], strengths: qocForm.strengths.split("\n").filter(Boolean), areas_for_improvement: qocForm.areas_for_improvement.split("\n").filter(Boolean), children_feedback: qocForm.children_feedback.trim(), staff_feedback: qocForm.staff_feedback.trim(), actions: [], next_review_date: qocForm.next_review_date, notes: qocForm.notes.trim() });
    toast.success("Quality of care review saved.");
    setQocForm({ date: new Date().toISOString().slice(0, 10), type: "monthly", lead_reviewer: "", overall_rating: "good", strengths: "", areas_for_improvement: "", children_feedback: "", staff_feedback: "", next_review_date: "", notes: "" });
    setShowNew(false);
  };

  const filtered = useMemo(() => {
    let list = [...records];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.notes.toLowerCase().includes(q) ||
          r.strengths.some((s) => s.toLowerCase().includes(q)) ||
          r.areas_for_improvement.some((a) => a.toLowerCase().includes(q))
      );
    }
    if (filterType !== "all") list = list.filter((r) => r.type === filterType);
    if (filterRating !== "all") list = list.filter((r) => r.overall_rating === filterRating);

    list.sort((a, b) => {
      switch (sortBy) {
        case "date": return b.date.localeCompare(a.date);
        case "rating": return RATINGS.indexOf(a.overall_rating) - RATINGS.indexOf(b.overall_rating);
        case "actions": return b.actions.filter((a: QocActionItem) => a.status !== "completed").length - a.actions.filter((a: QocActionItem) => a.status !== "completed").length;
        default: return 0;
      }
    });
    return list;
  }, [records, search, filterType, filterRating, sortBy]);

  /* stats */
  const totalReviews = records.length;
  const openActions = records.reduce((s, r) => s + r.actions.filter((a: QocActionItem) => a.status !== "completed").length, 0);
  const latestRating = records.length > 0 ? [...records].sort((a, b) => b.date.localeCompare(a.date))[0].overall_rating : null;
  const riDomains = records.length > 0 ? [...records].sort((a, b) => b.date.localeCompare(a.date))[0].domains.filter((d: QocDomainAssessment) => d.rating === "requires_improvement" || d.rating === "inadequate").length : 0;

  const exportCols: ExportColumn<QualityOfCareReview>[] = [
    { header: "ID", accessor: (r) => r.id },
    { header: "Date", accessor: (r) => r.date },
    { header: "Type", accessor: (r) => QOC_REVIEW_TYPE_LABEL[r.type] },
    { header: "Lead Reviewer", accessor: (r) => getStaffName(r.lead_reviewer) },
    { header: "Overall Rating", accessor: (r) => QOC_RATING_LABEL[r.overall_rating] },
    { header: "Strengths", accessor: (r) => r.strengths.join("; ") },
    { header: "Areas for Improvement", accessor: (r) => r.areas_for_improvement.join("; ") },
    { header: "Children's Feedback", accessor: (r) => r.children_feedback },
    { header: "Staff Feedback", accessor: (r) => r.staff_feedback },
    { header: "Open Actions", accessor: (r) => String(r.actions.filter((a: QocActionItem) => a.status !== "completed").length) },
    { header: "Action Details", accessor: (r) => r.actions.map((a: QocActionItem) => `${a.action} (${a.owner} — ${a.status})`).join("; ") },
    { header: "Next Review", accessor: (r) => r.next_review_date },
    { header: "Notes", accessor: (r) => r.notes },
  ];

  if (isLoading) {
    return (
      <PageShell title="Quality of Care Reviews" subtitle="Periodic assessments of care quality across all domains">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Quality of Care Reviews"
      subtitle="Periodic assessments of care quality across all domains"
      ariaContext={{ pageTitle: "Quality of Care Reviews", sourceType: "general" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Quality of Care Reviews" />
          <ExportButton data={filtered} columns={exportCols} filename="quality-of-care" />
          <Button onClick={() => setShowNew(true)}>
            <Plus className="h-4 w-4 mr-2" /> New Review
          </Button>
          <AriaStudioQuickActionButton context={{ record_type: "management_oversight", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        {/* ── stats ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Reviews", value: totalReviews, icon: Star, colour: "text-blue-600" },
            { label: "Latest Rating", value: latestRating ? QOC_RATING_LABEL[latestRating] : "—", icon: Target, colour: latestRating === "outstanding" ? "text-green-600" : latestRating === "good" ? "text-blue-600" : "text-orange-600" },
            { label: "Open Actions", value: openActions, icon: CheckCircle2, colour: openActions > 0 ? "text-orange-600" : "text-green-600" },
            { label: "Domains Flagged", value: riDomains, icon: AlertTriangle, colour: riDomains > 0 ? "text-red-600" : "text-[var(--cs-text-muted)]" },
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
        {riDomains > 0 && (
          <div className="rounded-lg border-l-4 border-orange-400 bg-orange-50 p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
              <p className="text-sm text-orange-800">
                <strong>{riDomains}</strong> domain(s) rated Requires Improvement or below in the latest review — prioritise action plans.
              </p>
            </div>
          </div>
        )}

        {/* ── filters ───────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 items-end">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search strengths, improvements, notes…"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {(Object.entries(QOC_REVIEW_TYPE_LABEL) as [QocReviewType, string][]).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Select value={filterRating} onValueChange={setFilterRating}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Ratings</SelectItem>
              {RATINGS.map((r) => (
                <SelectItem key={r} value={r}>{QOC_RATING_LABEL[r]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date (Recent)</SelectItem>
                <SelectItem value="rating">Rating (Best)</SelectItem>
                <SelectItem value="actions">Open Actions</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── list ──────────────────────────────────────────────── */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">No reviews match your filters.</div>
          )}
          {filtered.map((review) => {
            const isExpanded = expanded === review.id;
            const open = review.actions.filter((a: QocActionItem) => a.status !== "completed").length;

            return (
              <div key={review.id} className="rounded-xl border bg-white overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--cs-surface)] transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : review.id)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Star className="h-5 w-5 text-blue-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium">{review.date} — {QOC_REVIEW_TYPE_LABEL[review.type]}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Led by {getStaffName(review.lead_reviewer)} · {open} open action(s)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={cn("text-xs", RATING_COLORS[review.overall_rating])}>
                      {QOC_RATING_LABEL[review.overall_rating]}
                    </Badge>
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t bg-slate-50 p-4 space-y-4">
                    {/* domain ratings */}
                    <div>
                      <p className="text-sm font-medium mb-2">Domain Ratings</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {review.domains.map((da: QocDomainAssessment) => (
                          <div key={da.domain} className="flex items-start gap-2 rounded-lg border bg-white p-2.5">
                            <Badge className={cn("text-xs shrink-0 mt-0.5", RATING_COLORS[da.rating])}>
                              {QOC_RATING_LABEL[da.rating]}
                            </Badge>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1">
                                <p className="text-sm font-medium">{QOC_DOMAIN_LABEL[da.domain]}</p>
                                {da.trend === "improving" && <TrendingUp className="h-3 w-3 text-green-600" />}
                                {da.trend === "declining" && <TrendingDown className="h-3 w-3 text-red-600" />}
                              </div>
                              <p className="text-xs text-muted-foreground">{da.evidence}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* strengths & areas for improvement */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                        <p className="text-xs font-medium text-green-700 mb-2">Strengths</p>
                        <ul className="space-y-1">
                          {review.strengths.map((s: string, i: number) => (
                            <li key={i} className="flex items-start gap-1 text-sm">
                              <CheckCircle2 className="h-3 w-3 text-green-600 mt-0.5 shrink-0" />
                              <span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="rounded-lg bg-orange-50 border border-orange-200 p-3">
                        <p className="text-xs font-medium text-orange-700 mb-2">Areas for Improvement</p>
                        <ul className="space-y-1">
                          {review.areas_for_improvement.map((a: string, i: number) => (
                            <li key={i} className="flex items-start gap-1 text-sm">
                              <AlertTriangle className="h-3 w-3 text-orange-600 mt-0.5 shrink-0" />
                              <span>{a}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* feedback */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="rounded-lg bg-pink-50 border border-pink-200 p-3">
                        <div className="flex items-center gap-1 mb-1">
                          <Eye className="h-4 w-4 text-pink-600" />
                          <p className="text-xs font-medium text-pink-700">Children&apos;s Feedback</p>
                        </div>
                        <p className="text-sm">{review.children_feedback}</p>
                      </div>
                      <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                        <div className="flex items-center gap-1 mb-1">
                          <MessageSquare className="h-4 w-4 text-blue-600" />
                          <p className="text-xs font-medium text-blue-700">Staff Feedback</p>
                        </div>
                        <p className="text-sm">{review.staff_feedback}</p>
                      </div>
                    </div>

                    {/* actions */}
                    {review.actions.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Action Plan</p>
                        <div className="space-y-2">
                          {review.actions.map((action: QocActionItem, idx: number) => (
                            <div key={idx} className="flex items-start gap-2 rounded-lg border bg-white p-2.5">
                              <CheckCircle2 className={cn("h-4 w-4 mt-0.5 shrink-0",
                                action.status === "completed" ? "text-green-600" : action.status === "in_progress" ? "text-blue-600" : "text-[var(--cs-text-muted)]"
                              )} />
                              <div className="flex-1 min-w-0">
                                <p className={cn("text-sm", action.status === "completed" && "line-through text-muted-foreground")}>{action.action}</p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                  <span>{getStaffName(action.owner)}</span>
                                  <span>·</span>
                                  <span>Due: {action.due_date}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <Badge variant="outline" className={cn("text-xs",
                                  action.priority === "high" ? "border-red-300 text-red-700" :
                                  action.priority === "medium" ? "border-orange-300 text-orange-700" :
                                  "border-slate-300 text-[var(--cs-text-secondary)]"
                                )}>{QOC_ACTION_PRIORITY_LABEL[action.priority]}</Badge>
                                <Badge variant="outline" className="text-xs">{QOC_ACTION_STATUS_LABEL[action.status]}</Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* notes & next review */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="rounded-lg bg-white border p-3">
                        <p className="text-xs text-muted-foreground mb-1 font-medium">Summary Notes</p>
                        <p className="text-sm">{review.notes}</p>
                      </div>
                      <div className="rounded-lg bg-white border p-3">
                        <p className="text-xs text-muted-foreground mb-1 font-medium">Next Review Date</p>
                        <p className="text-sm font-medium">{review.next_review_date}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── reg note ──────────────────────────────────────────── */}
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-900">
          <strong>Regulation 45:</strong> The registered person must review the quality of care provided
          and produce a written report at least every 6 months. This should assess the extent to which
          the children&apos;s home&apos;s Statement of Purpose is being fulfilled. Reviews should incorporate the
          views of children, staff, placing authorities, and independent visitors.
        </div>
      </div>

      {/* ── placeholder dialog ──────────────────────────────────── */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Quality of Care Review</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveReview} className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-sm font-medium">Date</label><Input type="date" className="mt-1" value={qocForm.date} onChange={(e) => setQOC("date", e.target.value)} /></div>
              <div><label className="text-sm font-medium">Type</label>
                <Select value={qocForm.type} onValueChange={(v) => setQOC("type", v)}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(QOC_REVIEW_TYPE_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><label className="text-sm font-medium">Lead Reviewer *</label><Input className="mt-1" placeholder="Name" value={qocForm.lead_reviewer} onChange={(e) => setQOC("lead_reviewer", e.target.value)} /></div>
            <div><label className="text-sm font-medium">Overall Rating</label>
              <Select value={qocForm.overall_rating} onValueChange={(v) => setQOC("overall_rating", v)}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(QOC_RATING_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><label className="text-sm font-medium">Strengths</label><Textarea className="mt-1" rows={2} placeholder="One per line…" value={qocForm.strengths} onChange={(e) => setQOC("strengths", e.target.value)} /></div>
            <div><label className="text-sm font-medium">Areas for Improvement</label><Textarea className="mt-1" rows={2} placeholder="One per line…" value={qocForm.areas_for_improvement} onChange={(e) => setQOC("areas_for_improvement", e.target.value)} /></div>
            <div><label className="text-sm font-medium">Children&apos;s Feedback</label><Textarea className="mt-1" rows={2} placeholder="Summary of children&apos;s views…" value={qocForm.children_feedback} onChange={(e) => setQOC("children_feedback", e.target.value)} /></div>
            <div><label className="text-sm font-medium">Staff Feedback</label><Textarea className="mt-1" rows={2} placeholder="Summary of staff views…" value={qocForm.staff_feedback} onChange={(e) => setQOC("staff_feedback", e.target.value)} /></div>
            <div><label className="text-sm font-medium">Next Review Date</label><Input type="date" className="mt-1" value={qocForm.next_review_date} onChange={(e) => setQOC("next_review_date", e.target.value)} /></div>
            <div><label className="text-sm font-medium">Notes</label><Textarea className="mt-1" rows={2} placeholder="Additional context…" value={qocForm.notes} onChange={(e) => setQOC("notes", e.target.value)} /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
              <Button type="submit" disabled={createReview.isPending}>{createReview.isPending ? "Saving…" : "Save Review"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <CareEventsPanel
        title="Care Events — Quality Evidence"
        category="general"
        days={90}
        defaultCollapsed
      />
      <AriaPanel
        mode="assist"
        pageContext="Quality of Care Reviews — service quality assessment, outcomes evidence, practice standards, improvement planning, Reg 45 report evidence, Ofsted readiness, management oversight governance"
        recordType="management_oversight"
        className="mt-6"
      />
    </PageShell>
  );
}

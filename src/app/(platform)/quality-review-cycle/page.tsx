"use client";

import { useState, useMemo } from "react";
import {
  ClipboardCheck, Search, ArrowUpDown, Filter,
  AlertTriangle, CheckCircle2, TrendingUp, Clock,
  ChevronDown, ChevronUp, Users, FileText, Shield,
  BookOpen, Heart, Brain, Home, Award, Calendar,
  Loader2,
} from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";
import { useReg46Reviews } from "@/hooks/use-reg46-reviews";
import type {
  Reg46Review,
  Reg46ReviewStatus,
  Reg46AreaRating,
  Reg46AreaReviewed,
  Reg46ActionArising,
} from "@/types/extended";
import {
  REG46_REVIEW_STATUS_LABEL,
  REG46_AREA_RATING_LABEL,
  REG46_ACTION_STATUS_LABEL,
} from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

/* ── local colour maps ─────────────────────────────────────────────────── */

const STATUSES: Reg46ReviewStatus[] = ["completed", "planned"];

const STATUS_COLORS: Record<Reg46ReviewStatus, string> = {
  completed: "bg-green-100 text-green-800",
  planned: "bg-blue-100 text-blue-800",
};

const AREA_RATING_COLORS: Record<Reg46AreaRating, string> = {
  outstanding: "bg-green-100 text-green-800",
  good: "bg-blue-100 text-blue-800",
  requires_improvement: "bg-orange-100 text-orange-800",
  inadequate: "bg-red-100 text-red-800",
};

/* ── component ─────────────────────────────────────────────────────────── */

export default function QualityReviewCyclePage() {
  const { data: records = [], isLoading } = useReg46Reviews();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = [...records];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.overall_rating.toLowerCase().includes(q) ||
          r.independent_input.toLowerCase().includes(q) ||
          r.areas_reviewed.some((a) => a.summary.toLowerCase().includes(q) || a.area.toLowerCase().includes(q)) ||
          r.actions_arising.some((a) => a.action.toLowerCase().includes(q))
      );
    }
    if (filterStatus !== "all") list = list.filter((r) => r.status === filterStatus);

    list.sort((a, b) => {
      switch (sortBy) {
        case "date": return (b.completed_date ?? b.review_period_end).localeCompare(a.completed_date ?? a.review_period_end);
        case "status": return STATUSES.indexOf(a.status) - STATUSES.indexOf(b.status);
        default: return 0;
      }
    });
    return list;
  }, [records, search, filterStatus, sortBy]);

  /* stats */
  const completedOnTime = records.filter((r) => r.status === "completed").length;
  const totalActions = records.reduce((s, r) => s + r.actions_arising.length, 0);
  const completedActions = records.reduce((s, r) => s + r.actions_arising.filter((a: Reg46ActionArising) => a.status === "completed").length, 0);
  const actionsCompletedPct = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;
  const latestCompleted = records.filter((r) => r.status === "completed").sort((a, b) => (b.completed_date ?? "").localeCompare(a.completed_date ?? ""))[0];

  const exportCols: ExportColumn<Reg46Review>[] = [
    { header: "ID", accessor: (r) => r.id },
    { header: "Period Start", accessor: (r) => r.review_period_start },
    { header: "Period End", accessor: (r) => r.review_period_end },
    { header: "Completed Date", accessor: (r) => r.completed_date ?? "—" },
    { header: "Reviewer", accessor: (r) => getStaffName(r.reviewer) },
    { header: "Independent Input", accessor: (r) => r.independent_input },
    { header: "Overall Rating", accessor: (r) => r.overall_rating },
    { header: "Status", accessor: (r) => REG46_REVIEW_STATUS_LABEL[r.status] },
    { header: "Areas Reviewed", accessor: (r) => r.areas_reviewed.map((a: Reg46AreaReviewed) => `${a.area}: ${REG46_AREA_RATING_LABEL[a.rating]}`).join("; ") },
    { header: "Consultation Sources", accessor: (r) => r.consultation_sources.join("; ") },
    { header: "Actions", accessor: (r) => r.actions_arising.map((a: Reg46ActionArising) => `${a.action} (${getStaffName(a.owner)} — ${a.status})`).join("; ") },
    { header: "Shared With", accessor: (r) => r.shared_with.join("; ") },
  ];

  const getAreaIcon = (area: string) => {
    switch (area.toLowerCase()) {
      case "safeguarding": return Shield;
      case "education": return BookOpen;
      case "health": return Heart;
      case "emotional wellbeing": return Brain;
      case "staffing": return Users;
      case "premises": return Home;
      case "leadership": return Award;
      default: return FileText;
    }
  };

  if (isLoading) {
    return (
      <PageShell title="Regulation 46 — Quality of Care Review" subtitle="Six-monthly independent systematic review of the quality of care provided">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Regulation 46 — Quality of Care Review"
      subtitle="Six-monthly independent systematic review of the quality of care provided"
      ariaContext={{ pageTitle: "Regulation 46 Quality Review Cycle", sourceType: "reg45" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Regulation 46 Quality Review Cycle" />
          <ExportButton data={filtered} columns={exportCols} filename="reg46-quality-review-cycle" />
          <AriaStudioQuickActionButton context={{ record_type: "reg45", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        {/* ── regulatory note ──────────────────────────────────────── */}
        <div className="rounded-lg border-l-4 border-blue-400 bg-blue-50 p-4">
          <div className="flex items-start gap-2">
            <FileText className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Regulation 46 — Review of Quality of Care</p>
              <p>
                The registered person must maintain a system for monitoring, reviewing and evaluating the quality of care provided for children. A review must be carried out at least every 6 months and must be conducted by an individual who has the skills, experience and knowledge necessary to do so. The review must consult children, their parents, placing authorities and staff. Ofsted will scrutinise this document during inspection as evidence of the home&apos;s capacity for continuous improvement and self-evaluation.
              </p>
            </div>
          </div>
        </div>

        {/* ── stats ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Reviews Completed", value: completedOnTime, icon: ClipboardCheck, colour: "text-green-600" },
            { label: "Actions Completed", value: `${actionsCompletedPct}%`, icon: CheckCircle2, colour: actionsCompletedPct === 100 ? "text-green-600" : "text-blue-600" },
            { label: "Overall Trajectory", value: latestCompleted ? "Good" : "—", icon: TrendingUp, colour: "text-green-600" },
            { label: "Next Review Due", value: records.find((r) => r.status === "planned")?.review_period_end ?? "—", icon: Calendar, colour: "text-purple-600" },
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

        {/* ── filters ───────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 items-end">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search areas, actions, ratings..."
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
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{REG46_REVIEW_STATUS_LABEL[s]}</SelectItem>
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
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── review list ──────────────────────────────────────────── */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">No reviews match your filters.</div>
          )}
          {filtered.map((review) => {
            const isExpanded = expandedId === review.id;
            const openActions = review.actions_arising.filter((a: Reg46ActionArising) => a.status !== "completed").length;

            return (
              <div key={review.id} className="rounded-xl border bg-white overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : review.id)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <ClipboardCheck className="h-5 w-5 text-blue-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium">
                        {review.review_period_start} to {review.review_period_end}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Reviewer: {getStaffName(review.reviewer)}
                        {review.completed_date && ` · Completed: ${review.completed_date}`}
                        {openActions > 0 && ` · ${openActions} open action(s)`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={cn("text-xs", STATUS_COLORS[review.status])}>
                      {REG46_REVIEW_STATUS_LABEL[review.status]}
                    </Badge>
                    {review.overall_rating !== "—" && (
                      <Badge variant="outline" className="text-xs">
                        {review.overall_rating}
                      </Badge>
                    )}
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t bg-slate-50 p-4 space-y-4">
                    {/* planned review — minimal info */}
                    {review.status === "planned" && (
                      <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="h-4 w-4 text-blue-600" />
                          <p className="text-sm font-medium text-blue-800">Upcoming Review</p>
                        </div>
                        <p className="text-sm text-blue-700 mb-2">
                          Review period: {review.review_period_start} to {review.review_period_end}
                        </p>
                        <p className="text-sm text-blue-700">
                          {review.independent_input}
                        </p>
                      </div>
                    )}

                    {/* completed review — full detail */}
                    {review.status === "completed" && (
                      <>
                        {/* independent input */}
                        <div className="rounded-lg bg-white border p-3">
                          <p className="text-xs text-muted-foreground font-medium mb-1">Independent Input</p>
                          <p className="text-sm">{review.independent_input}</p>
                        </div>

                        {/* areas reviewed */}
                        {review.areas_reviewed.length > 0 && (
                          <div>
                            <p className="text-sm font-medium mb-2">Areas Reviewed</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {review.areas_reviewed.map((area: Reg46AreaReviewed) => {
                                const AreaIcon = getAreaIcon(area.area);
                                return (
                                  <div key={area.area} className="flex items-start gap-2 rounded-lg border bg-white p-3">
                                    <AreaIcon className="h-4 w-4 text-slate-500 mt-0.5 shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <p className="text-sm font-medium">{area.area}</p>
                                        <Badge className={cn("text-xs", AREA_RATING_COLORS[area.rating])}>
                                          {REG46_AREA_RATING_LABEL[area.rating]}
                                        </Badge>
                                      </div>
                                      <p className="text-sm text-slate-700 mb-1">{area.summary}</p>
                                      <p className="text-xs text-muted-foreground">{area.evidence}</p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* consultation sources */}
                        {review.consultation_sources.length > 0 && (
                          <div className="rounded-lg bg-purple-50 border border-purple-200 p-3">
                            <div className="flex items-center gap-1 mb-2">
                              <Users className="h-4 w-4 text-purple-600" />
                              <p className="text-xs font-medium text-purple-700">Consultation Sources</p>
                            </div>
                            <ul className="space-y-1">
                              {review.consultation_sources.map((src: string, i: number) => (
                                <li key={i} className="flex items-start gap-1 text-sm text-purple-800">
                                  <CheckCircle2 className="h-3 w-3 text-purple-500 mt-0.5 shrink-0" />
                                  <span>{src}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* actions arising */}
                        {review.actions_arising.length > 0 && (
                          <div>
                            <p className="text-sm font-medium mb-2">Actions Arising</p>
                            <div className="space-y-2">
                              {review.actions_arising.map((action: Reg46ActionArising, idx: number) => (
                                <div key={idx} className="flex items-start gap-2 rounded-lg border bg-white p-2.5">
                                  <CheckCircle2 className={cn("h-4 w-4 mt-0.5 shrink-0",
                                    action.status === "completed" ? "text-green-600" : action.status === "in_progress" ? "text-blue-600" : "text-slate-400"
                                  )} />
                                  <div className="flex-1 min-w-0">
                                    <p className={cn("text-sm", action.status === "completed" && "line-through text-muted-foreground")}>{action.action}</p>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                      <span>{getStaffName(action.owner)}</span>
                                      <span>·</span>
                                      <span>Deadline: {action.deadline}</span>
                                    </div>
                                  </div>
                                  <Badge variant="outline" className={cn("text-xs",
                                    action.status === "completed" ? "border-green-300 text-green-700" :
                                    action.status === "in_progress" ? "border-blue-300 text-blue-700" :
                                    "border-slate-300 text-slate-700"
                                  )}>{REG46_ACTION_STATUS_LABEL[action.status]}</Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* shared with */}
                        {review.shared_with.length > 0 && (
                          <div className="rounded-lg bg-white border p-3">
                            <p className="text-xs text-muted-foreground font-medium mb-1">Report Shared With</p>
                            <div className="flex flex-wrap gap-2">
                              {review.shared_with.map((recipient: string, i: number) => (
                                <Badge key={i} variant="outline" className="text-xs">{recipient}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
      <AriaPanel
        mode="assist"
        pageContext="Regulation 46 Quality Review Cycle — statutory quality reviews, Reg 46 requirements, review schedule, outcomes, improvement actions, RI oversight, Ofsted evidence, governance documentation"
        recordType="reg45"
        className="mt-6"
      />
    </PageShell>
  );
}

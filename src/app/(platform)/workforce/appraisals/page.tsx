"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — APPRAISALS & PROBATION COMMAND CENTRE
// Annual appraisals, mid-year reviews, probation assessments, and PIP tracking.
// Team competency analysis, per-staff timeline, rating distribution,
// and regulatory compliance tracking for Ofsted inspection readiness.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PrintButton } from "@/components/common/print-button";
import { ExportButton, type ExportColumn } from "@/components/common/export-button";
import { getStaffName as seedGetStaffName } from "@/lib/seed-data";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";
import { cn, formatDate } from "@/lib/utils";
import { useAppraisals } from "@/hooks/use-workforce";
import { useStaff } from "@/hooks/use-staff";
import {
  COMPETENCY_DOMAIN_LABELS, ALL_COMPETENCY_DOMAINS,
  COMPETENCY_LEVEL_LABELS,
  type AppraisalRating, type AppraisalStatus, type AppraisalType,
  type AppraisalRecord, type CompetencyDomain, type CompetencyLevel,
} from "@/types/extended";
import Link from "next/link";
import {
  UserCheck, AlertTriangle, CheckCircle2, Clock, Calendar,
  ChevronRight, ChevronDown, ChevronUp, Plus, Search, User,
  Star, TrendingUp, BarChart3, Award, FileText, Brain,
  ArrowUpDown, Users, Target, Eye, Sparkles,
} from "lucide-react";

// ── Config maps ──────────────────────────────────────────────────────────────

const APPRAISAL_EXPORT_COLS: ExportColumn<AppraisalRecord>[] = [
  { header: "Staff", accessor: (a) => seedGetStaffName(a.staff_id) },
  { header: "Date", accessor: (a) => a.appraisal_date },
  { header: "Type", accessor: (a) => a.appraisal_type.replace(/_/g, " ") },
  { header: "Status", accessor: (a) => a.status },
  { header: "Rating", accessor: (a) => a.overall_rating ?? "" },
  { header: "Key Achievements", accessor: (a) => a.key_achievements ?? "" },
  { header: "Areas for Improvement", accessor: (a) => a.areas_for_improvement ?? "" },
  { header: "Objectives", accessor: (a) => a.objectives_next_period ?? "" },
  { header: "Appraiser", accessor: (a) => seedGetStaffName(a.appraiser_id) },
];

const STATUS_CONFIG: Record<AppraisalStatus, { label: string; colour: string; icon: React.ElementType }> = {
  scheduled:    { label: "Scheduled",    colour: "text-blue-700 bg-blue-50 border-blue-200",     icon: Calendar },
  in_progress:  { label: "In Progress",  colour: "text-amber-700 bg-amber-50 border-amber-200",  icon: Clock },
  completed:    { label: "Completed",    colour: "text-emerald-700 bg-emerald-50 border-emerald-200", icon: CheckCircle2 },
  overdue:      { label: "Overdue",      colour: "text-red-700 bg-red-50 border-red-200",         icon: AlertTriangle },
};

const TYPE_LABELS: Record<AppraisalType, string> = {
  probation_review: "Probation Review",
  annual_appraisal: "Annual Appraisal",
  mid_year:         "Mid-Year Review",
  pip:              "Performance Improvement",
};
const TYPE_ICONS: Record<AppraisalType, React.ElementType> = {
  probation_review: UserCheck,
  annual_appraisal: Star,
  mid_year:         Target,
  pip:              AlertTriangle,
};

const RATING_CONFIG: Record<AppraisalRating, { label: string; colour: string; short: string }> = {
  outstanding:           { label: "Outstanding",          colour: "text-emerald-700 bg-emerald-50 border-emerald-200", short: "O" },
  good:                  { label: "Good",                 colour: "text-blue-700 bg-blue-50 border-blue-200", short: "G" },
  requires_improvement:  { label: "Requires Improvement", colour: "text-amber-700 bg-amber-50 border-amber-200", short: "RI" },
  inadequate:            { label: "Inadequate",           colour: "text-red-700 bg-red-50 border-red-200", short: "I" },
};

type ViewMode = "list" | "staff" | "competency";

// ── Team Competency Heatmap ──────────────────────────────────────────────────

function TeamCompetencyGrid({
  teamAvgScores,
}: {
  teamAvgScores: Record<string, number>;
}) {
  const domains = ALL_COMPETENCY_DOMAINS;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-[13px] flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-indigo-500" />
          Team Competency Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {domains.map((domain) => {
            const avg = teamAvgScores[domain] ?? 0;
            const pct = (avg / 5) * 100;
            return (
              <div key={domain} className="flex items-center gap-2">
                <p className="text-[10px] text-[var(--cs-text-muted)] w-24 truncate shrink-0" title={COMPETENCY_DOMAIN_LABELS[domain]}>
                  {COMPETENCY_DOMAIN_LABELS[domain].split(" ").slice(0, 2).join(" ")}
                </p>
                <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      avg >= 4 ? "bg-emerald-400" : avg >= 3 ? "bg-blue-400" : avg >= 2 ? "bg-amber-400" : "bg-red-400",
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className={cn(
                  "text-[11px] font-bold tabular-nums w-6 text-right",
                  avg >= 4 ? "text-emerald-600" : avg >= 3 ? "text-blue-600" : avg >= 2 ? "text-amber-600" : "text-red-600",
                )}>
                  {avg > 0 ? avg.toFixed(1) : "–"}
                </span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-3 mt-3 pt-2 border-t border-slate-50">
          {[
            { label: "Expert (5)", colour: "bg-emerald-400" },
            { label: "Proficient (4)", colour: "bg-emerald-400" },
            { label: "Competent (3)", colour: "bg-blue-400" },
            { label: "Developing (1-2)", colour: "bg-amber-400" },
          ].map((l) => (
            <div key={l.label} className="flex items-center gap-1 text-[9px] text-[var(--cs-text-muted)]">
              <div className={cn("w-2 h-2 rounded-full", l.colour)} />
              {l.label}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Rating Distribution ──────────────────────────────────────────────────────

function RatingDistribution({ ratingCounts }: { ratingCounts: Record<string, number> }) {
  const ratings: AppraisalRating[] = ["outstanding", "good", "requires_improvement", "inadequate"];
  const total = Object.values(ratingCounts).reduce((s, v) => s + v, 0);
  if (total === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-[13px] flex items-center gap-2">
          <Award className="h-4 w-4 text-indigo-500" />
          Rating Distribution
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        {ratings.map((rating) => {
          const count = ratingCounts[rating] ?? 0;
          const pct = total > 0 ? (count / total) * 100 : 0;
          const cfg = RATING_CONFIG[rating];
          return (
            <div key={rating} className="flex items-center gap-2">
              <p className="text-[10px] text-[var(--cs-text-muted)] w-20 truncate shrink-0">{cfg.label}</p>
              <div className="flex-1 h-3 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    rating === "outstanding" ? "bg-emerald-400" :
                    rating === "good" ? "bg-blue-400" :
                    rating === "requires_improvement" ? "bg-amber-400" : "bg-red-400",
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-[11px] font-bold tabular-nums text-[var(--cs-text-secondary)] w-4 text-right">{count}</span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

// ── Staff Timeline View ──────────────────────────────────────────────────────

function StaffAppraisalPanel({
  staffId,
  staffName,
  appraisals,
  perStaffMeta,
}: {
  staffId: string;
  staffName: string;
  appraisals: AppraisalRecord[];
  perStaffMeta?: { last_rating: string | null; has_overdue: boolean; next_review_date: string | null };
}) {
  const [expanded, setExpanded] = useState(false);
  const sorted = [...appraisals].sort((a, b) => b.appraisal_date.localeCompare(a.appraisal_date));
  const latestCompleted = sorted.find((a) => a.status === "completed");
  const hasOverdue = perStaffMeta?.has_overdue ?? appraisals.some((a) => a.status === "overdue");

  return (
    <Card className={cn("border", hasOverdue && "border-red-200")}>
      <CardContent className="p-4">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-3 w-full text-left"
        >
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
            hasOverdue ? "bg-red-100" : latestCompleted ? "bg-emerald-100" : "bg-slate-100",
          )}>
            <User className={cn(
              "h-4 w-4",
              hasOverdue ? "text-red-600" : latestCompleted ? "text-emerald-600" : "text-[var(--cs-text-muted)]",
            )} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="text-sm font-bold text-[var(--cs-navy)]">{staffName}</p>
              {hasOverdue && (
                <Badge className="text-[9px] h-4 px-1.5 bg-red-100 text-red-700 border-0">Overdue</Badge>
              )}
              {latestCompleted?.overall_rating && (
                <Badge variant="outline" className={cn("text-[9px] h-4 px-1.5 border", RATING_CONFIG[latestCompleted.overall_rating].colour)}>
                  {RATING_CONFIG[latestCompleted.overall_rating].label}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 text-[10px] text-[var(--cs-text-muted)]">
              <span>{appraisals.length} appraisal{appraisals.length !== 1 ? "s" : ""}</span>
              {latestCompleted && <span>Last: {latestCompleted.appraisal_date}</span>}
              {perStaffMeta?.next_review_date && (
                <span className="flex items-center gap-0.5">
                  <Calendar className="h-2.5 w-2.5" />
                  Next: {perStaffMeta.next_review_date}
                </span>
              )}
            </div>
          </div>
          {expanded ? <ChevronUp className="h-4 w-4 text-[var(--cs-text-muted)]" /> : <ChevronDown className="h-4 w-4 text-[var(--cs-text-muted)]" />}
        </button>

        {expanded && (
          <div className="mt-3 pt-3 border-t border-[var(--cs-border-subtle)] space-y-3">
            {sorted.map((appraisal) => (
              <AppraisalRow key={appraisal.id} appraisal={appraisal} staffName={staffName} showName={false} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Appraisal Row (used in both views) ───────────────────────────────────────

function AppraisalRow({
  appraisal,
  staffName,
  showName = true,
}: {
  appraisal: AppraisalRecord;
  staffName: string;
  showName?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const statusCfg = STATUS_CONFIG[appraisal.status];
  const StatusIcon = statusCfg.icon;
  const TypeIcon = TYPE_ICONS[appraisal.appraisal_type];

  const competencyEntries = Object.entries(appraisal.competency_scores) as [CompetencyDomain, CompetencyLevel][];
  const avgScore = competencyEntries.length > 0
    ? Math.round((competencyEntries.reduce((s, [, v]) => s + v, 0) / competencyEntries.length) * 10) / 10
    : 0;

  return (
    <div className={cn(
      "rounded-xl border bg-white transition-all",
      appraisal.status === "overdue" ? "border-red-200" : "border-[var(--cs-border)]",
    )}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {showName && <p className="text-sm font-bold text-[var(--cs-navy)]">{staffName}</p>}
              <Badge variant="outline" className={cn("text-[10px] border gap-0.5", statusCfg.colour)}>
                <StatusIcon className="h-2.5 w-2.5" />
                {statusCfg.label}
              </Badge>
              {appraisal.overall_rating && (
                <Badge variant="outline" className={cn("text-[10px] border", RATING_CONFIG[appraisal.overall_rating].colour)}>
                  {RATING_CONFIG[appraisal.overall_rating].label}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-[var(--cs-text-muted)]">
              <TypeIcon className="h-3 w-3 text-[var(--cs-text-muted)]" />
              <span>{TYPE_LABELS[appraisal.appraisal_type]}</span>
              <span className="text-[var(--cs-text-gentle)]">·</span>
              <span>{appraisal.appraisal_date}</span>
              {avgScore > 0 && (
                <>
                  <span className="text-[var(--cs-text-gentle)]">·</span>
                  <span className={cn(
                    "font-semibold",
                    avgScore >= 4 ? "text-emerald-600" : avgScore >= 3 ? "text-blue-600" : "text-amber-600",
                  )}>
                    Avg {avgScore}
                  </span>
                </>
              )}
            </div>
          </div>
          {expanded ? <ChevronUp className="h-4 w-4 text-[var(--cs-text-muted)] shrink-0 mt-1" /> : <ChevronDown className="h-4 w-4 text-[var(--cs-text-muted)] shrink-0 mt-1" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {/* Competency scores grid */}
          {competencyEntries.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
              {competencyEntries.map(([domain, score]) => (
                <div key={domain} className="rounded-lg bg-slate-50 border border-[var(--cs-border-subtle)] p-2 text-center">
                  <p className="text-[9px] text-[var(--cs-text-muted)] truncate leading-tight mb-1" title={COMPETENCY_DOMAIN_LABELS[domain]}>
                    {COMPETENCY_DOMAIN_LABELS[domain].split(" ").slice(0, 2).join(" ")}
                  </p>
                  <p className={cn(
                    "text-sm font-bold",
                    score >= 4 ? "text-emerald-600" : score >= 3 ? "text-blue-600" : score >= 2 ? "text-amber-600" : "text-red-600",
                  )}>
                    {score}
                  </p>
                  <p className="text-[8px] text-[var(--cs-text-muted)]">
                    {COMPETENCY_LEVEL_LABELS[score as CompetencyLevel]}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Content sections */}
          {appraisal.key_achievements && (
            <div className="rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-2">
              <p className="text-[10px] font-semibold text-emerald-700 mb-0.5 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Key Achievements
              </p>
              <p className="text-xs text-emerald-800 leading-relaxed">{appraisal.key_achievements}</p>
            </div>
          )}

          {appraisal.areas_for_improvement && (
            <div className="rounded-lg bg-amber-50 border border-amber-100 px-3 py-2">
              <p className="text-[10px] font-semibold text-amber-700 mb-0.5 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Areas for Improvement
              </p>
              <p className="text-xs text-amber-800 leading-relaxed">{appraisal.areas_for_improvement}</p>
            </div>
          )}

          {appraisal.objectives_next_period && (
            <div className="rounded-lg bg-blue-50 border border-blue-100 px-3 py-2">
              <p className="text-[10px] font-semibold text-blue-700 mb-0.5 flex items-center gap-1">
                <Target className="h-3 w-3" />
                Objectives (Next Period)
              </p>
              <p className="text-xs text-blue-800 leading-relaxed">{appraisal.objectives_next_period}</p>
            </div>
          )}

          {appraisal.staff_comments && (
            <div className="rounded-lg bg-slate-50 border border-[var(--cs-border-subtle)] px-3 py-2">
              <p className="text-[10px] font-semibold text-[var(--cs-text-secondary)] mb-0.5 flex items-center gap-1">
                <User className="h-3 w-3" />
                Staff Comments
              </p>
              <p className="text-xs text-[var(--cs-text-secondary)] leading-relaxed">{appraisal.staff_comments}</p>
            </div>
          )}

          {appraisal.aria_insights && (
            <div className="rounded-lg bg-indigo-50 border border-indigo-100 px-3 py-2">
              <p className="text-[10px] font-semibold text-indigo-700 mb-0.5 flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Cara Insights
              </p>
              <p className="text-xs text-indigo-800 leading-relaxed">{appraisal.aria_insights}</p>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-50">
            <div className="flex items-center gap-3">
              {appraisal.signed_by_staff && (
                <span className="flex items-center gap-1 text-[10px] text-emerald-600">
                  <CheckCircle2 className="h-3 w-3" /> Signed by staff
                  {appraisal.signed_at && <span className="text-[var(--cs-text-muted)] ml-1">{formatDate(appraisal.signed_at)}</span>}
                </span>
              )}
              {appraisal.next_review_date && (
                <span className="flex items-center gap-1 text-[10px] text-[var(--cs-text-muted)]">
                  <Calendar className="h-3 w-3" /> Next: {appraisal.next_review_date}
                </span>
              )}
            </div>
            {appraisal.linked_development_plan_id && (
              <Link href="/workforce/cara-planner" className="text-[10px] text-indigo-600 hover:underline flex items-center gap-0.5">
                <FileText className="h-3 w-3" />
                Dev plan linked →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════

export default function AppraisalsPage() {
  // ── State ────────────────────────────────────────────────────────────────
  const [viewMode, setViewMode]   = useState<ViewMode>("list");
  const [filter, setFilter]       = useState<"all" | AppraisalStatus>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | AppraisalType>("all");
  const [search, setSearch]       = useState("");
  const [sortMode, setSortMode]   = useState<"newest" | "oldest" | "rating">("newest");

  // ── Data ─────────────────────────────────────────────────────────────────
  const appraisalsQuery = useAppraisals();
  const staffQuery      = useStaff();

  const allAppraisals = appraisalsQuery.data?.data ?? [];
  const meta = appraisalsQuery.data?.meta as Record<string, unknown> | undefined;
  const staff = staffQuery.data?.data ?? [];

  const getStaffNameFn = (id: string) => staff.find((s) => s.id === id)?.full_name ?? id;

  const ratingCounts   = (meta?.rating_counts ?? {}) as Record<string, number>;
  const teamAvgScores  = (meta?.team_avg_scores ?? {}) as Record<string, number>;
  const perStaffMeta   = (meta?.per_staff ?? []) as Array<{
    staff_id: string; last_rating: string | null; has_overdue: boolean;
    next_review_date: string | null; total: number;
  }>;

  const overdue    = allAppraisals.filter((a) => a.status === "overdue").length;
  const completed  = allAppraisals.filter((a) => a.status === "completed").length;
  const scheduled  = allAppraisals.filter((a) => a.status === "scheduled").length;
  const inProgress = allAppraisals.filter((a) => a.status === "in_progress").length;

  // ── Filtering + sorting ──────────────────────────────────────────────────
  const displayed = useMemo(() => {
    let list = [...allAppraisals];

    if (filter !== "all") list = list.filter((a) => a.status === filter);
    if (typeFilter !== "all") list = list.filter((a) => a.appraisal_type === typeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((a) => {
        const name = getStaffNameFn(a.staff_id).toLowerCase();
        return name.includes(q) ||
          a.key_achievements?.toLowerCase().includes(q) ||
          a.areas_for_improvement?.toLowerCase().includes(q) ||
          a.objectives_next_period?.toLowerCase().includes(q);
      });
    }

    list.sort((a, b) => {
      if (sortMode === "oldest") return a.appraisal_date.localeCompare(b.appraisal_date);
      if (sortMode === "rating") {
        const order: Record<string, number> = { outstanding: 0, good: 1, requires_improvement: 2, inadequate: 3 };
        const ra = a.overall_rating ? (order[a.overall_rating] ?? 9) : 9;
        const rb = b.overall_rating ? (order[b.overall_rating] ?? 9) : 9;
        return ra - rb;
      }
      return b.appraisal_date.localeCompare(a.appraisal_date);
    });

    return list;
  }, [allAppraisals, filter, typeFilter, search, sortMode, staff]);

  // ── Staff groups for staff view ──────────────────────────────────────────
  const staffGroups = useMemo(() => {
    const grouped = new Map<string, AppraisalRecord[]>();
    allAppraisals.forEach((a) => {
      const existing = grouped.get(a.staff_id) ?? [];
      existing.push(a);
      grouped.set(a.staff_id, existing);
    });
    return Array.from(grouped.entries())
      .map(([staffId, appraisals]) => ({ staffId, appraisals }))
      .sort((a, b) => {
        const aOverdue = a.appraisals.some((ap) => ap.status === "overdue");
        const bOverdue = b.appraisals.some((ap) => ap.status === "overdue");
        if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;
        return getStaffNameFn(a.staffId).localeCompare(getStaffNameFn(b.staffId));
      });
  }, [allAppraisals, staff]);

  return (
    <PageShell
      title="Appraisals & Probation"
      subtitle="Annual appraisals, mid-year reviews, probation assessments & competency tracking"
      caraContext={{ pageTitle: "Staff Appraisals", sourceType: "staff" }}
      showQuickCreate={false}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={displayed} columns={APPRAISAL_EXPORT_COLS} filename="appraisals" />
          <PrintButton title="Appraisals Report" subtitle="Chamberlain House Staff Development" targetId="appraisals-content" />
          <SmartUploadButton variant="inline" label="Upload Evidence" uploadContext="Appraisals — appraisal document or evidence upload" />
          <Button size="sm" className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            New Appraisal
          </Button>
          <CaraStudioQuickActionButton context={{ record_type: "supervision", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="appraisals-content" className="space-y-4 animate-fade-in">

        {/* ── KPI Banner ──────────────────────────────────────────────────── */}
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-5">
          {[
            {
              label: "Overdue", value: overdue,
              colour: overdue > 0 ? "text-red-700" : "text-[var(--cs-text-gentle)]",
              bg: overdue > 0 ? "border-red-200 bg-red-50" : "",
              icon: <AlertTriangle className={cn("h-4 w-4", overdue > 0 ? "text-red-500" : "text-[var(--cs-text-gentle)]")} />,
            },
            {
              label: "Scheduled", value: scheduled,
              colour: scheduled > 0 ? "text-blue-700" : "text-[var(--cs-text-gentle)]",
              bg: scheduled > 0 ? "border-blue-200 bg-blue-50" : "",
              icon: <Calendar className={cn("h-4 w-4", scheduled > 0 ? "text-blue-500" : "text-[var(--cs-text-gentle)]")} />,
            },
            {
              label: "In Progress", value: inProgress,
              colour: inProgress > 0 ? "text-amber-700" : "text-[var(--cs-text-gentle)]",
              icon: <Clock className={cn("h-4 w-4", inProgress > 0 ? "text-amber-500" : "text-[var(--cs-text-gentle)]")} />,
            },
            {
              label: "Completed", value: completed,
              colour: "text-emerald-700",
              icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
            },
            {
              label: "Total", value: allAppraisals.length,
              colour: "text-indigo-700",
              icon: <FileText className="h-4 w-4 text-indigo-500" />,
            },
          ].map(({ label, value, colour, bg, icon }) => (
            <div key={label} className={cn("rounded-xl border border-[var(--cs-border-subtle)] bg-white p-3 text-center", bg)}>
              <div className="flex justify-center mb-1">{icon}</div>
              <div className={cn("text-xl font-bold tabular-nums", colour)}>{value}</div>
              <div className="text-[10px] text-[var(--cs-text-muted)] mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* ── Analysis Row: Competency Grid + Rating Distribution ─────────── */}
        <div className="grid gap-4 md:grid-cols-2">
          {Object.keys(teamAvgScores).length > 0 && (
            <TeamCompetencyGrid teamAvgScores={teamAvgScores} />
          )}
          <RatingDistribution ratingCounts={ratingCounts} />
        </div>

        {/* ── View Toggle + Filters ───────────────────────────────────────── */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* View mode */}
          <div className="flex items-center rounded-lg border border-[var(--cs-border)] overflow-hidden">
            {([
              { mode: "list" as ViewMode, icon: FileText, label: "All" },
              { mode: "staff" as ViewMode, icon: Users, label: "By Staff" },
            ]).map(({ mode, icon: Icon, label }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  "flex items-center gap-1 px-3 py-1.5 text-[11px] font-medium transition-all",
                  viewMode === mode
                    ? "bg-[var(--cs-navy)] text-white"
                    : "text-[var(--cs-text-muted)] hover:bg-[var(--cs-surface)]",
                )}
              >
                <Icon className="h-3 w-3" />
                {label}
              </button>
            ))}
          </div>

          {/* Search */}
          {viewMode === "list" && (
            <div className="relative flex-1 min-w-[180px] max-w-sm">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--cs-text-muted)]" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search staff or content…"
                className="pl-8 h-8 text-sm"
              />
            </div>
          )}

          {/* Status filter */}
          {viewMode === "list" && (
            <div className="flex gap-1 flex-wrap">
              {(["all", "overdue", "scheduled", "in_progress", "completed"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-[10px] font-medium border transition-all",
                    filter === f
                      ? "bg-[var(--cs-navy)] text-white border-[var(--cs-navy)]"
                      : "bg-white text-[var(--cs-text-muted)] border-[var(--cs-border)] hover:border-indigo-300",
                  )}
                >
                  {f === "all" ? "All" : f === "in_progress" ? "In Progress" : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          )}

          {/* Type filter */}
          {viewMode === "list" && (
            <div className="flex gap-1 flex-wrap">
              {(["all", "annual_appraisal", "mid_year", "probation_review", "pip"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-[10px] font-medium border transition-all",
                    typeFilter === t
                      ? "bg-[var(--cs-navy)] text-white border-[var(--cs-navy)]"
                      : "bg-white text-[var(--cs-text-muted)] border-[var(--cs-border)] hover:border-[var(--cs-cara-gold-soft)]",
                  )}
                >
                  {t === "all" ? "All Types" : TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          )}

          {/* Sort */}
          {viewMode === "list" && (
            <div className="flex items-center gap-1 ml-auto">
              <ArrowUpDown className="h-3 w-3 text-[var(--cs-text-muted)]" />
              {(["newest", "rating", "oldest"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setSortMode(mode)}
                  className={cn(
                    "text-[10px] px-2 py-1 rounded-md transition-all capitalize",
                    sortMode === mode ? "bg-indigo-100 text-indigo-700 font-semibold" : "text-[var(--cs-text-muted)] hover:text-[var(--cs-text-secondary)]",
                  )}
                >
                  {mode}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Content ─────────────────────────────────────────────────────── */}

        {/* Staff view */}
        {viewMode === "staff" && (
          <div className="space-y-3">
            {staffGroups.map(({ staffId, appraisals }) => (
              <StaffAppraisalPanel
                key={staffId}
                staffId={staffId}
                staffName={getStaffNameFn(staffId)}
                appraisals={appraisals}
                perStaffMeta={perStaffMeta.find((p) => p.staff_id === staffId) as any}
              />
            ))}
          </div>
        )}

        {/* List view */}
        {viewMode === "list" && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[var(--cs-text-muted)]">
                {displayed.length} appraisal{displayed.length !== 1 ? "s" : ""}
              </span>
            </div>

            {displayed.length === 0 ? (
              <div className="text-center py-12 text-[var(--cs-text-muted)]">
                <UserCheck className="h-8 w-8 mx-auto mb-2 text-[var(--cs-text-gentle)]" />
                <p className="text-sm font-medium text-[var(--cs-text-muted)]">No appraisals match your filters</p>
                <p className="text-xs text-[var(--cs-text-muted)] mt-1">Try adjusting your search or filter criteria</p>
              </div>
            ) : (
              <div className="space-y-3">
                {displayed.map((appraisal) => (
                  <AppraisalRow
                    key={appraisal.id}
                    appraisal={appraisal}
                    staffName={getStaffNameFn(appraisal.staff_id)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Regulatory Footer ───────────────────────────────────────────── */}
        <div className="rounded-xl border border-[var(--cs-border-subtle)] bg-slate-50 px-4 py-3 text-xs text-[var(--cs-text-muted)]">
          <span className="font-semibold text-[var(--cs-text-secondary)]">Regulatory Basis — </span>
          Children&apos;s Homes Regulations 2015: Reg 33 (monitoring the children&apos;s home), Reg 34 (regular supervision and appraisal of all staff).
          ILACS — Quality of Care: evidence of staff receiving regular, structured appraisal linked to professional development.
        </div>
      </div>
      <CaraPanel
        mode="assist"
        pageContext="Staff Appraisals — annual appraisals, performance reviews, professional development, Reg 34 compliance, ILACS workforce quality evidence, management oversight, Ofsted inspection evidence"
        recordType="supervision"
        className="mt-6"
      />
    </PageShell>
  );
}

"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Heart,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Star,
  Lightbulb,
  Loader2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PlacementEndSummary, PlacementEndReason } from "@/types/extended";
import { PLACEMENT_END_REASON_LABEL } from "@/types/extended";
import { usePlacementEndSummaries } from "@/hooks/use-placement-end-summaries";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

// ── config ──────────────────────────────────────────────────────────────────
const reasonColour: Record<PlacementEndReason, string> = {
  planned_move_home: "bg-green-100 text-green-800",
  planned_step_down: "bg-blue-100 text-blue-800",
  planned_move_on_16_plus: "bg-blue-100 text-blue-800",
  adoption: "bg-emerald-100 text-emerald-800",
  family_reunification: "bg-green-100 text-green-800",
  placement_disruption: "bg-amber-100 text-amber-800",
  age_out: "bg-purple-100 text-purple-800",
  long_term_foster: "bg-emerald-100 text-emerald-800",
};

function ratingColour(r: number): string {
  if (r >= 4) return "text-green-600";
  if (r === 3) return "text-amber-600";
  return "text-red-600";
}

// ── export columns ──────────────────────────────────────────────────────────
const exportCols: ExportColumn<PlacementEndSummary>[] = [
  { header: "Child", accessor: (r: PlacementEndSummary) => r.child_name },
  { header: "Admission", accessor: (r: PlacementEndSummary) => r.admission_date },
  { header: "End Date", accessor: (r: PlacementEndSummary) => r.end_date },
  { header: "Duration (months)", accessor: (r: PlacementEndSummary) => String(r.duration_months) },
  { header: "End Reason", accessor: (r: PlacementEndSummary) => PLACEMENT_END_REASON_LABEL[r.end_reason] },
  { header: "Moved To", accessor: (r: PlacementEndSummary) => r.moved_to },
  { header: "Avg Outcome Rating", accessor: (r: PlacementEndSummary) => {
    const ratings = [r.outcomes.health.rating, r.outcomes.education.rating, r.outcomes.relationships.rating, r.outcomes.emotional.rating, r.outcomes.independence.rating];
    return (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1);
  }},
  { header: "Authored By", accessor: (r: PlacementEndSummary) => getStaffName(r.authored_by) },
];

// ── component ───────────────────────────────────────────────────────────────
export default function PlacementEndSummaryPage() {
  const { data: res, isLoading } = usePlacementEndSummaries();
  const entries = res?.data ?? [];

  const [filterReason, setFilterReason] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = [...entries];
    if (filterReason !== "all") items = items.filter((s) => s.end_reason === filterReason);

    items.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return b.end_date.localeCompare(a.end_date);
        case "duration":
          return b.duration_months - a.duration_months;
        case "rating":
          const avgA = (a.outcomes.health.rating + a.outcomes.education.rating + a.outcomes.relationships.rating + a.outcomes.emotional.rating + a.outcomes.independence.rating) / 5;
          const avgB = (b.outcomes.health.rating + b.outcomes.education.rating + b.outcomes.relationships.rating + b.outcomes.emotional.rating + b.outcomes.independence.rating) / 5;
          return avgB - avgA;
        default:
          return 0;
      }
    });
    return items;
  }, [entries, filterReason, sortBy]);

  // ── loading state ────────────────────────────────────────────────────────
  if (isLoading) return (
    <PageShell title="Placement End Summary" subtitle="Reflective summaries when placements end — celebrating progress, learning from challenges, honouring the journey">
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    </PageShell>
  );

  // ── stats ─────────────────────────────────────────────────────────────────
  const totalEndings = entries.length;
  const planned = entries.filter((s) => s.end_reason !== "placement_disruption").length;
  const avgDuration = totalEndings > 0 ? Math.round(entries.reduce((sum, s) => sum + s.duration_months, 0) / totalEndings) : 0;
  const avgRating = totalEndings > 0 ? (
    entries.reduce((sum, s) => {
      const ratings = [s.outcomes.health.rating, s.outcomes.education.rating, s.outcomes.relationships.rating, s.outcomes.emotional.rating, s.outcomes.independence.rating];
      return sum + ratings.reduce((a, b) => a + b, 0) / ratings.length;
    }, 0) / totalEndings
  ).toFixed(1) : "0.0";

  return (
    <PageShell
      title="Placement End Summary"
      subtitle="Reflective summaries when placements end — celebrating progress, learning from challenges, honouring the journey"
      ariaContext={{ pageTitle: "Related Care Events", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={entries} columns={exportCols} filename="placement-end-summaries" />
          <PrintButton title="Placement End Summaries" />
        </div>
      }
    >
      {/* ── summary stats ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold">{totalEndings}</p>
          <p className="text-xs text-muted-foreground">Total Endings</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{planned}/{totalEndings}</p>
          <p className="text-xs text-muted-foreground">Planned Endings</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{avgDuration}</p>
          <p className="text-xs text-muted-foreground">Avg Duration (months)</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">{avgRating}/5</p>
          <p className="text-xs text-muted-foreground">Avg Outcome Rating</p>
        </div>
      </div>

      {/* ── philosophy banner ──────────────────────────────────────────── */}
      <div className="rounded-lg bg-pink-50 border border-pink-200 p-3 mb-6 flex items-start gap-2">
        <Heart className="h-4 w-4 text-pink-600 mt-0.5 shrink-0" />
        <p className="text-sm text-pink-800">
          Endings are part of caring. We honour every journey — those that end in flourishing and those that
          remind us of our limits. What we learn here informs every future welcome.
        </p>
      </div>

      {/* ── filters/sort ───────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select value={filterReason} onValueChange={setFilterReason}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="All Reasons" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Reasons</SelectItem>
            {(Object.entries(PLACEMENT_END_REASON_LABEL) as [PlacementEndReason, string][]).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Most Recent</SelectItem>
              <SelectItem value="duration">Longest Placement</SelectItem>
              <SelectItem value="rating">Best Outcomes</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── summary cards ──────────────────────────────────────────────── */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">No summaries match your filters.</div>
        )}
        {filtered.map((s) => {
          const isExpanded = expandedId === s.id;
          const ratings = [s.outcomes.health.rating, s.outcomes.education.rating, s.outcomes.relationships.rating, s.outcomes.emotional.rating, s.outcomes.independence.rating];
          const avgR = (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1);

          return (
            <div key={s.id} className="rounded-xl border bg-white overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : s.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Heart className="h-5 w-5 text-pink-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{s.child_name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {s.admission_date} → {s.end_date} &middot; {s.duration_months} months &middot; {s.moved_to.slice(0, 60)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", reasonColour[s.end_reason])}>
                    {PLACEMENT_END_REASON_LABEL[s.end_reason]}
                  </span>
                  <span className={cn("text-sm font-bold", ratingColour(parseFloat(avgR)))}>{avgR}/5</span>
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  {/* outcome ratings */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Outcome Domains</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {Object.entries(s.outcomes).map(([key, val]) => (
                        <div key={key} className="bg-white rounded-lg p-3 border">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium uppercase tracking-wide capitalize">{key}</span>
                            <span className={cn("text-sm font-bold", ratingColour(val.rating))}>{val.rating}/5</span>
                          </div>
                          <p className="text-xs text-slate-700">{val.summary}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* achievements */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                      <Star className="h-3 w-3 inline mr-1" />Significant Achievements
                    </p>
                    <ul className="space-y-1">
                      {s.significant_achievements.map((a, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <CheckCircle className="h-3 w-3 text-green-500 mt-1 shrink-0" />
                          {a}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* ongoing challenges */}
                  {s.ongoing_challenges.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                        <AlertTriangle className="h-3 w-3 inline mr-1" />Ongoing Challenges
                      </p>
                      <ul className="space-y-1">
                        {s.ongoing_challenges.map((c, i) => (
                          <li key={i} className="text-sm flex items-start gap-2">
                            <ArrowRight className="h-3 w-3 text-amber-500 mt-1 shrink-0" />
                            {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* learning grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-green-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-green-800 uppercase tracking-wide mb-1">What Worked Well</p>
                      <ul className="space-y-1">
                        {s.what_worked_well.map((w, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <span className="text-green-600 mt-0.5">•</span>
                            <span>{w}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">What Could Have Been Better</p>
                      <ul className="space-y-1">
                        {s.what_could_have_been_better.map((w, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <span className="text-amber-600 mt-0.5">•</span>
                            <span>{w}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* reflections */}
                  <div className="space-y-2">
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">Child&apos;s Reflection</p>
                      <p className="text-sm text-blue-900 italic">&ldquo;{s.child_reflection}&rdquo;</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-purple-800 uppercase tracking-wide mb-1">Staff Reflection</p>
                      <p className="text-sm text-purple-900 italic">&ldquo;{s.staff_reflection}&rdquo;</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-slate-800 uppercase tracking-wide mb-1">Social Worker Reflection</p>
                      <p className="text-sm text-slate-700 italic">&ldquo;{s.sw_reflection}&rdquo;</p>
                    </div>
                  </div>

                  {/* legacy */}
                  <div className="bg-emerald-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide mb-1">
                      <Lightbulb className="h-3 w-3 inline mr-1" />Legacy For The Home
                    </p>
                    <p className="text-sm text-emerald-900">{s.legacy_for_home}</p>
                  </div>

                  {/* metadata */}
                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span>Authored: {getStaffName(s.authored_by)}</span>
                    <span>Reviewed: {getStaffName(s.reviewed_by)}</span>
                    <span>Approved: {s.approval_date}</span>
                    <span><TrendingUp className="h-3 w-3 inline mr-1" />Avg outcome: {avgR}/5</span>
                  </div>

                  {s.contact_arrangements && (
                    <div className="bg-pink-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-pink-800 uppercase tracking-wide mb-1">Continuing Contact</p>
                      <p className="text-sm text-pink-900">{s.contact_arrangements}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── regulatory note ────────────────────────────────────────────── */}
      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> Placement end summaries support Quality Standard 2 (quality of care),
          Quality Standard 4 (the child&apos;s plan), and Regulation 5 (engagement with placing authority).
          Summaries inform service development per Regulation 45 (review of quality of care) and demonstrate
          outcome-focused practice for SCCIF judgements. Children always receive a copy in age-appropriate format.
        </p>
      </div>
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}

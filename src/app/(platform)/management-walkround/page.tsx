"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  ChevronDown, ChevronUp, ArrowUpDown,
  Eye, CheckCircle, AlertTriangle, MessageCircle, Star, Clock, Loader2,
} from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useManagementWalkrounds } from "@/hooks/use-management-walkrounds";
import type {
  ManagementWalkround, WalkroundType,
  WalkroundObservation, WalkroundImprovement,
  WalkroundChildInteraction, WalkroundStaffInteraction,
  WalkroundEnvironmentalCheck, WalkroundFollowUpAction,
} from "@/types/extended";
import { WALKROUND_TYPE_LABEL, ENVIRONMENTAL_CHECK_STATUS_LABEL } from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

/* ── UI metadata ──────────────────────────────────────────────────────── */

const typeColour: Record<WalkroundType, string> = {
  daily: "bg-blue-100 text-blue-800",
  weekly_themed: "bg-purple-100 text-purple-800",
  unannounced: "bg-amber-100 text-amber-800",
  pre_inspection_rehearsal: "bg-emerald-100 text-emerald-800",
  post_incident_review: "bg-red-100 text-red-800",
};

export default function ManagementWalkroundPage() {
  const { data: res, isLoading } = useManagementWalkrounds();
  const data: ManagementWalkround[] = res?.data ?? [];

  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = [...data];
    if (filterType !== "all") items = items.filter((w) => w.walkround_type === filterType);
    items.sort((a, b) => {
      switch (sortBy) {
        case "date": return (b.date + b.time).localeCompare(a.date + a.time);
        case "duration": return b.duration_minutes - a.duration_minutes;
        default: return 0;
      }
    });
    return items;
  }, [data, filterType, sortBy]);

  const total = data.length;
  const positiveTotal = data.reduce((sum, w) => sum + w.observations_positive.length, 0);
  const improvementsTotal = data.reduce((sum, w) => sum + w.observations_for_improvement.length, 0);
  const totalActions = data.reduce((sum, w) => sum + w.follow_up_actions_logged.length, 0);

  const exportCols: ExportColumn<ManagementWalkround>[] = [
    { header: "Date", accessor: (r) => r.date },
    { header: "Time", accessor: (r) => r.time },
    { header: "Manager", accessor: (r) => getStaffName(r.manager) },
    { header: "Type", accessor: (r) => WALKROUND_TYPE_LABEL[r.walkround_type] },
    { header: "Duration", accessor: (r) => `${r.duration_minutes}m` },
    { header: "Areas Visited", accessor: (r) => r.areas_visited.length.toString() },
    { header: "Positive Observations", accessor: (r) => r.observations_positive.length.toString() },
    { header: "Improvements", accessor: (r) => r.observations_for_improvement.length.toString() },
    { header: "Follow-Up Actions", accessor: (r) => r.follow_up_actions_logged.length.toString() },
  ];

  if (isLoading) return <PageShell title="Management Walkround" subtitle="Loading…"><div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div></PageShell>;

  return (
    <PageShell
      title="Management Walkround"
      subtitle="Daily, weekly, and unannounced walkrounds — observation, recognition, and visible leadership"
      ariaContext={{ pageTitle: "Related Care Events", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={data} columns={exportCols} filename="management-walkrounds" />
          <PrintButton title="Management Walkround" />
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold">{total}</p>
          <p className="text-xs text-muted-foreground">Recent Walkrounds</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{positiveTotal}</p>
          <p className="text-xs text-muted-foreground">Positives Logged</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{improvementsTotal}</p>
          <p className="text-xs text-muted-foreground">Improvements Identified</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{totalActions}</p>
          <p className="text-xs text-muted-foreground">Actions Logged</p>
        </div>
      </div>

      <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 mb-6 flex items-start gap-2">
        <Eye className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
        <p className="text-sm text-emerald-800">
          Visible leadership matters. Daily walkrounds keep the manager in touch with daily life. Weekly
          themed walkrounds focus on records, environment, or specific themes. Unannounced walkrounds
          confirm steady-state quality. Walkrounds always notice the good as well as the gaps.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="All Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {(Object.keys(WALKROUND_TYPE_LABEL) as WalkroundType[]).map((k) => (
              <SelectItem key={k} value={k}>{WALKROUND_TYPE_LABEL[k]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Most Recent</SelectItem>
              <SelectItem value="duration">Longest First</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((w) => {
          const isExpanded = expandedId === w.id;

          return (
            <div key={w.id} className="rounded-xl border bg-white overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : w.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Eye className="h-5 w-5 text-emerald-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{w.date} {w.time} — {WALKROUND_TYPE_LABEL[w.walkround_type]} ({getStaffName(w.manager)})</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {w.duration_minutes} mins &middot; {w.areas_visited.length} areas &middot; {w.observations_positive.length} positives &middot; {w.observations_for_improvement.length} improvements
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", typeColour[w.walkround_type])}>
                    {WALKROUND_TYPE_LABEL[w.walkround_type]}
                  </span>
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Areas Visited</p>
                    <div className="flex flex-wrap gap-1">
                      {w.areas_visited.map((a: string, i: number) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{a}</span>
                      ))}
                    </div>
                  </div>

                  <div className="bg-emerald-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide mb-2">
                      <Star className="h-3 w-3 inline mr-1" />Positive Observations
                    </p>
                    <div className="space-y-1">
                      {w.observations_positive.map((o: WalkroundObservation, i: number) => (
                        <div key={i} className="bg-white rounded-lg p-2 border text-sm">
                          <p className="font-medium">{o.area}: {o.observation}</p>
                          <p className="text-xs text-muted-foreground italic">{o.staff_or_child_or_thing}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {w.observations_for_improvement.length > 0 && (
                    <div className="bg-amber-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-2">
                        <AlertTriangle className="h-3 w-3 inline mr-1" />For Improvement
                      </p>
                      <div className="space-y-1">
                        {w.observations_for_improvement.map((o: WalkroundImprovement, i: number) => (
                          <div key={i} className="bg-white rounded-lg p-2 border text-sm">
                            <p className="font-medium">{o.area}: {o.observation}</p>
                            <p className="text-xs text-blue-700">Action: {o.action_agreed}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {w.child_interactions.length > 0 && (
                    <div className="bg-pink-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-pink-800 uppercase tracking-wide mb-2">Child Interactions</p>
                      <div className="space-y-1">
                        {w.child_interactions.map((c: WalkroundChildInteraction, i: number) => (
                          <div key={i} className="bg-white rounded-lg p-2 border text-sm">
                            <p className="font-medium">{c.child_initial}</p>
                            <p className="text-xs text-muted-foreground">{c.observation}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="bg-purple-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-purple-800 uppercase tracking-wide mb-2">Staff Interactions</p>
                    <div className="space-y-1">
                      {w.staff_interactions.map((s: WalkroundStaffInteraction, i: number) => (
                        <div key={i} className="bg-white rounded-lg p-2 border text-sm">
                          <p className="font-medium">{s.staff_member.startsWith("staff_") ? getStaffName(s.staff_member) : s.staff_member}</p>
                          <p className="text-xs text-muted-foreground">{s.observation}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Environmental Checks</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                      {w.environmental_checks.map((e: WalkroundEnvironmentalCheck, i: number) => (
                        <div key={i} className="bg-white rounded-lg p-2 border text-sm flex items-center justify-between">
                          <span>{e.area}</span>
                          <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium",
                            e.status === "good" ? "bg-green-100 text-green-800" :
                            e.status === "needs_attention" ? "bg-amber-100 text-amber-800" :
                            "bg-blue-100 text-blue-800"
                          )}>
                            {ENVIRONMENTAL_CHECK_STATUS_LABEL[e.status]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {w.book_or_record_reviews.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Records Reviewed</p>
                      <ul className="space-y-1">
                        {w.book_or_record_reviews.map((r: string, i: number) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <CheckCircle className="h-3 w-3 text-blue-500 mt-1 shrink-0" />
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {w.follow_up_actions_logged.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Follow-Up Actions</p>
                      <div className="space-y-1">
                        {w.follow_up_actions_logged.map((a: WalkroundFollowUpAction, i: number) => (
                          <div key={i} className="bg-white rounded-lg p-2 border text-sm flex items-start justify-between gap-2">
                            <span className="flex-1">{a.action}</span>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {getStaffName(a.owner)} &middot; {a.deadline}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {w.themes_emerging.length > 0 && (
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">
                        <MessageCircle className="h-3 w-3 inline mr-1" />Themes Emerging
                      </p>
                      <ul className="space-y-1">
                        {w.themes_emerging.map((t: string, i: number) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <span className="text-blue-600 mt-0.5">•</span>
                            <span>{t}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span><Clock className="h-3 w-3 inline mr-1" />{w.duration_minutes} mins</span>
                    <span>Manager: {getStaffName(w.manager)}</span>
                    <span>Follow-up: {w.follow_up_date}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> Management walkrounds support Quality Standard 13 (leadership
          and management — visible leadership), Reg 33 (induction/oversight), and Reg 45 (review of quality
          of care). Linked to Unannounced Visits Log, Reg 44 visits, and Service Improvement Board.
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

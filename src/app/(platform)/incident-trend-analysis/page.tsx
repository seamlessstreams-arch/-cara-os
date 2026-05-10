"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ChevronDown, ChevronUp, ArrowUpDown, Search, TrendingDown, TrendingUp,
  AlertTriangle, BookOpen, Lightbulb, Clock, Users, Calendar, Target,
  CheckCircle2, BarChart3, MapPin, Activity, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getYPName, getStaffName } from "@/lib/seed-data";
import type { IncidentTrendRecord, TrendActionStatus } from "@/types/extended";
import { TREND_ACTION_STATUS_LABEL } from "@/types/extended";
import { useIncidentTrends } from "@/hooks/use-incident-trends";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

/* ── helpers ───────────────────────────────────────────────────────────────── */

const STATUS_CLR: Record<TrendActionStatus, string> = {
  completed: "bg-green-100 text-green-800",
  in_progress: "bg-blue-100 text-blue-800",
  not_started: "bg-slate-100 text-slate-700",
  overdue: "bg-red-100 text-red-800",
};

/* ── ui helpers ─────────────────────────────────────────────────────────────── */

function ReductionBadge({ value }: { value: number }) {
  if (value === 0) {
    return (
      <Badge variant="outline" className="bg-slate-100 text-slate-700">
        No change vs previous
      </Badge>
    );
  }
  const positive = value < 0;
  return (
    <Badge
      variant="outline"
      className={cn(
        "flex items-center gap-1",
        positive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800",
      )}
    >
      {positive ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
      {positive ? `${Math.abs(value)}% reduction` : `${value}% increase`}
    </Badge>
  );
}

function MiniBarChart({
  data,
  colorClass,
}: {
  data: Record<string, number>;
  colorClass: string;
}) {
  const entries = Object.entries(data);
  const max = Math.max(...entries.map(([, v]) => v), 1);
  return (
    <div className="space-y-1">
      {entries.map(([k, v]) => (
        <div key={k} className="flex items-center gap-2 text-xs">
          <div className="w-20 text-muted-foreground">{k}</div>
          <div className="flex-1 bg-slate-100 rounded h-3 overflow-hidden">
            <div
              className={cn("h-full rounded", colorClass)}
              style={{ width: `${(v / max) * 100}%` }}
            />
          </div>
          <div className="w-6 text-right font-medium">{v}</div>
        </div>
      ))}
    </div>
  );
}

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function IncidentTrendAnalysisPage() {
  const { data: raw, isLoading } = useIncidentTrends();
  const allData = useMemo(() => raw?.data ?? [], [raw]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  if (isLoading) {
    return (
      <PageShell title="Incident Trend Analysis" subtitle="Loading…">
        <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      </PageShell>
    );
  }

  const effectiveExpandedId = expandedId ?? allData[0]?.id ?? null;

  const filtered = useMemo(() => {
    let rows = [...allData];
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.period.toLowerCase().includes(q) ||
          r.top_triggers.some((t) => t.toLowerCase().includes(q)) ||
          r.key_learning.some((l) => l.toLowerCase().includes(q)),
      );
    }
    rows.sort((a, b) =>
      sortBy === "newest"
        ? b.review_date.localeCompare(a.review_date)
        : a.review_date.localeCompare(b.review_date),
    );
    return rows;
  }, [allData, search, sortBy]);

  const current = allData[0];
  const previous = allData[1];
  const periodChange = current?.reduction_vs_previous ?? 0;
  const openActions = current?.prevention_actions.filter(
    (a) => a.status !== "completed",
  ).length ?? 0;
  const learningItems = current?.key_learning.length ?? 0;

  const exportCols: ExportColumn<IncidentTrendRecord>[] = [
    { header: "Period", accessor: (r) => r.period },
    { header: "Total Incidents", accessor: (r) => String(r.total_incidents) },
    { header: "Change vs Previous (%)", accessor: (r) => `${r.reduction_vs_previous}` },
    { header: "Children Involved", accessor: (r) => r.children_involved.map((id) => getYPName(id)).join("; ") },
    { header: "Top Triggers", accessor: (r) => r.top_triggers.join("; ") },
    { header: "Type Breakdown", accessor: (r) => Object.entries(r.incident_type_breakdown).map(([k, v]) => `${k}: ${v}`).join("; ") },
    { header: "Key Learning", accessor: (r) => r.key_learning.join(" | ") },
    { header: "Prevention Actions", accessor: (r) => r.prevention_actions.map((a) => `${a.action} (owner: ${getStaffName(a.owner)}, due: ${a.deadline}, ${TREND_ACTION_STATUS_LABEL[a.status]})`).join(" | ") },
    { header: "Staff On-Duty Pattern", accessor: (r) => r.staff_on_duty_patterns },
    { header: "Analyst", accessor: (r) => getStaffName(r.analyst) },
    { header: "Review Date", accessor: (r) => r.review_date },
  ];

  return (
    <PageShell
      title="Incident Trend Analysis"
      subtitle="Quarterly Pattern Reports · Triggers · Hotspots · Learning"
      ariaContext={{ pageTitle: "Incident Trend Analysis", sourceType: "incident" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Incident Trend Analysis" />
          <ExportButton data={allData} columns={exportCols} filename="incident-trend-analysis" />
          <AriaStudioQuickActionButton context={{ record_type: "incident", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="print-area">
        {/* ── Summary Stats ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4 pb-3 text-center">
              <BarChart3 className="h-5 w-5 mx-auto mb-1 text-blue-600" />
              <p className="text-2xl font-bold">{current?.total_incidents ?? 0}</p>
              <p className="text-xs text-muted-foreground">{current?.period ?? "—"} Incidents</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 text-center">
              {periodChange < 0 ? (
                <TrendingDown className="h-5 w-5 mx-auto mb-1 text-green-600" />
              ) : periodChange > 0 ? (
                <TrendingUp className="h-5 w-5 mx-auto mb-1 text-red-600" />
              ) : (
                <Activity className="h-5 w-5 mx-auto mb-1 text-slate-500" />
              )}
              <p
                className={cn(
                  "text-2xl font-bold",
                  periodChange < 0 && "text-green-700",
                  periodChange > 0 && "text-red-700",
                )}
              >
                {periodChange === 0
                  ? "0%"
                  : periodChange < 0
                    ? `${Math.abs(periodChange)}%`
                    : `+${periodChange}%`}
              </p>
              <p className="text-xs text-muted-foreground">
                vs {previous?.period ?? "Last Quarter"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 text-center">
              <Target className="h-5 w-5 mx-auto mb-1 text-amber-600" />
              <p className="text-2xl font-bold">{openActions}</p>
              <p className="text-xs text-muted-foreground">Prevention Actions Open</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 text-center">
              <Lightbulb className="h-5 w-5 mx-auto mb-1 text-purple-600" />
              <p className="text-2xl font-bold">{learningItems}</p>
              <p className="text-xs text-muted-foreground">Key Learning Items</p>
            </CardContent>
          </Card>
        </div>

        {/* ── Filters ─────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="Search by period, trigger, or learning..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="oldest">Oldest first</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── Trend Cards ─────────────────────────────────────────────────── */}
        <div className="space-y-3">
          {filtered.map((r) => {
            const isOpen = effectiveExpandedId === r.id;
            const positive = r.reduction_vs_previous < 0;
            const negative = r.reduction_vs_previous > 0;
            return (
              <Card
                key={r.id}
                className={cn(
                  "border-l-4",
                  positive && "border-l-green-500",
                  negative && "border-l-red-500",
                  r.reduction_vs_previous === 0 && "border-l-slate-300",
                )}
              >
                <CardHeader
                  className="pb-2 cursor-pointer"
                  onClick={() => setExpandedId(isOpen ? null : r.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                        {r.period}
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                          {r.total_incidents} incidents
                        </Badge>
                        <ReductionBadge value={r.reduction_vs_previous} />
                      </CardTitle>
                      <p className="text-sm text-muted-foreground flex items-center gap-3 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          Reviewed {r.review_date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {r.children_involved.length} YP involved
                        </span>
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-3.5 w-3.5" />
                          Analyst: {getStaffName(r.analyst)}
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isOpen ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </div>
                </CardHeader>

                {isOpen && (
                  <CardContent className="pt-0 space-y-4 text-sm">
                    <div>
                      <p className="font-medium mb-1 text-xs">Children Involved</p>
                      <div className="flex flex-wrap gap-1">
                        {r.children_involved.map((id) => (
                          <Badge key={id} variant="outline" className="bg-slate-50 text-slate-700 text-xs">
                            {getYPName(id)}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="bg-slate-50 border rounded p-3">
                      <p className="font-medium mb-2 text-xs flex items-center gap-1">
                        <BarChart3 className="h-3.5 w-3.5" />
                        Incident Type Breakdown
                      </p>
                      <MiniBarChart data={r.incident_type_breakdown} colorClass="bg-blue-500" />
                    </div>

                    <div>
                      <p className="font-medium mb-1 text-xs flex items-center gap-1 text-amber-700">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Top Triggers
                      </p>
                      <ul className="space-y-1">
                        {r.top_triggers.map((t, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs">
                            <span className="text-amber-500 mt-0.5">•</span>
                            <span>{t}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="bg-purple-50 border border-purple-200 rounded p-3">
                        <p className="font-medium mb-2 text-xs flex items-center gap-1 text-purple-800">
                          <Clock className="h-3.5 w-3.5" />
                          Time of Day
                        </p>
                        <MiniBarChart data={r.time_of_day_patterns} colorClass="bg-purple-500" />
                      </div>
                      <div className="bg-indigo-50 border border-indigo-200 rounded p-3">
                        <p className="font-medium mb-2 text-xs flex items-center gap-1 text-indigo-800">
                          <Calendar className="h-3.5 w-3.5" />
                          Day of Week
                        </p>
                        <MiniBarChart data={r.day_of_week_patterns} colorClass="bg-indigo-500" />
                      </div>
                    </div>

                    <div className="bg-cyan-50 border border-cyan-200 rounded p-3">
                      <p className="font-medium text-xs text-cyan-800 mb-1 flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        Staffing Patterns / Hotspots
                      </p>
                      <p className="text-xs text-cyan-900">{r.staff_on_duty_patterns}</p>
                    </div>

                    <div>
                      <p className="font-medium mb-1 text-xs flex items-center gap-1 text-purple-700">
                        <Lightbulb className="h-3.5 w-3.5" />
                        Key Learning
                      </p>
                      <ul className="space-y-1">
                        {r.key_learning.map((l, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs bg-purple-50 border border-purple-100 rounded p-2">
                            <Lightbulb className="h-3.5 w-3.5 text-purple-500 shrink-0 mt-0.5" />
                            <span>{l}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <p className="font-medium mb-1 text-xs flex items-center gap-1 text-blue-700">
                        <Target className="h-3.5 w-3.5" />
                        Prevention Actions
                      </p>
                      <div className="space-y-1.5">
                        {r.prevention_actions.map((a, i) => (
                          <div key={i} className="bg-muted/40 rounded p-2 flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <p className="text-xs font-medium">{a.action}</p>
                              <p className="text-[11px] text-muted-foreground">
                                Owner: {getStaffName(a.owner)} · Deadline: {a.deadline}
                              </p>
                            </div>
                            <Badge variant="outline" className={cn(STATUS_CLR[a.status], "text-[10px]")}>
                              {a.status === "completed" && (
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                              )}
                              {TREND_ACTION_STATUS_LABEL[a.status]}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* ── Regulatory Note ─────────────────────────────────────────────── */}
        <div className="mt-8 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Regulatory Context</p>
          <p>
            Quarterly incident trend analysis underpins the Registered Manager&apos;s duty under
            Regulation 45 (review of quality of care) of the Children&apos;s Homes (England)
            Regulations 2015. It demonstrates the home&apos;s use of intelligence to identify
            triggers, hotspots, and learning, and to drive measurable preventative action —
            evidence required for Quality Standard 5 (the protection of children) and
            triangulated with Reg 44 visitor reports, ARIA pattern alerts, and individual
            behaviour-support plans. Period-over-period comparison evidences whether
            interventions are reducing incident frequency and severity, supporting Ofsted&apos;s
            Social Care Common Inspection Framework (SCCIF) judgements on leadership and
            management.
          </p>
        </div>
      </div>
      <CareEventsPanel
        title="Care Events — Incidents & Behaviour"
        category={["behaviour", "safeguarding", "physical_intervention"]}
        days={90}
        defaultCollapsed
      />
      <AriaPanel
        mode="assist"
        pageContext="Incident Trend Analysis — incident patterns, frequency, types, triggers, serious incidents, Reg 40, Reg 45 themes, management oversight, quality improvement, Ofsted evidence"
        recordType="incident"
        className="mt-6"
      />
    </PageShell>
  );
}

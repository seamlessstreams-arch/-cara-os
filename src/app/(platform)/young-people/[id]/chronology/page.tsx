"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — PER-CHILD CHRONOLOGY
// A complete, time-ordered record of all significant events for a child.
// Designed for LAC reviews, Ofsted inspections and safeguarding oversight.
// Sources: care events · incidents · missing from care · behaviour log ·
//          key working sessions · significant daily log entries ·
//          risk assessments · manually recorded chronology entries.
// ══════════════════════════════════════════════════════════════════════════════

import React, { use, useState, useMemo } from "react";
import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { cn } from "@/lib/utils";
import {
  useChildChronology,
  type ChronologyItem,
} from "@/hooks/use-child-chronology";
import { useYoungPerson } from "@/hooks/use-young-people";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Clock,
  FileText,
  Filter,
  ShieldAlert,
  TrendingUp,
  User,
  X,
  BookOpen,
  Activity,
  Heart,
  Star,
  MapPin,
  Zap,
  Users,
  GraduationCap,
  Stethoscope,
  CalendarCheck,
} from "lucide-react";
import { format, parseISO } from "date-fns";

// ── Types ──────────────────────────────────────────────────────────────────────

type SeverityFilter = "all" | "critical" | "significant" | "routine";

type SourceTypeFilter = "all" | ChronologyItem["source_type"];

// ── Helpers ────────────────────────────────────────────────────────────────────

const SOURCE_LABELS: Record<ChronologyItem["source_type"], string> = {
  care_event:       "Care Event",
  incident:         "Incident",
  missing_episode:  "Missing from Care",
  behaviour_log:    "Behaviour Log",
  key_working:      "Key Working",
  daily_log:        "Daily Log",
  risk_assessment:  "Risk Assessment",
  chronology_entry: "Chronology Entry",
  family_time:      "Family Time",
  lac_review:       "LAC Review",
  appointment:      "Appointment",
  education:        "Education",
};

const SOURCE_COLOURS: Record<ChronologyItem["source_type"], string> = {
  care_event:       "bg-blue-50 text-blue-700 border-blue-200",
  incident:         "bg-red-50 text-red-700 border-red-200",
  missing_episode:  "bg-purple-50 text-purple-700 border-purple-200",
  behaviour_log:    "bg-orange-50 text-orange-700 border-orange-200",
  key_working:      "bg-green-50 text-green-700 border-green-200",
  daily_log:        "bg-slate-50 text-slate-700 border-slate-200",
  risk_assessment:  "bg-yellow-50 text-yellow-700 border-yellow-200",
  chronology_entry: "bg-teal-50 text-teal-700 border-teal-200",
  family_time:      "bg-pink-50 text-pink-700 border-pink-200",
  lac_review:       "bg-indigo-50 text-indigo-700 border-indigo-200",
  appointment:      "bg-cyan-50 text-cyan-700 border-cyan-200",
  education:        "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const SOURCE_ICONS: Record<ChronologyItem["source_type"], React.ComponentType<{ className?: string }>> = {
  care_event:       FileText,
  incident:         AlertTriangle,
  missing_episode:  MapPin,
  behaviour_log:    Zap,
  key_working:      Heart,
  daily_log:        BookOpen,
  risk_assessment:  ShieldAlert,
  chronology_entry: Star,
  family_time:      Users,
  lac_review:       CalendarCheck,
  appointment:      Stethoscope,
  education:        GraduationCap,
};

const SEVERITY_COLOURS: Record<ChronologyItem["severity"], string> = {
  critical:    "bg-red-100 text-red-800 border border-red-200",
  significant: "bg-amber-100 text-amber-800 border border-amber-200",
  routine:     "bg-slate-100 text-slate-700 border border-slate-200",
};

const LEFT_BAR_COLOURS: Record<ChronologyItem["severity"], string> = {
  critical:    "bg-red-500",
  significant: "bg-amber-400",
  routine:     "bg-slate-300",
};

function formatDate(date: string) {
  try {
    return format(parseISO(date), "d MMM yyyy");
  } catch {
    return date;
  }
}

function groupByMonth(items: ChronologyItem[]): Record<string, ChronologyItem[]> {
  const groups: Record<string, ChronologyItem[]> = {};
  for (const item of items) {
    try {
      const key = format(parseISO(item.date), "MMMM yyyy");
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    } catch {
      const key = "Unknown date";
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    }
  }
  return groups;
}

// ── CSV export columns ─────────────────────────────────────────────────────────

const EXPORT_COLUMNS: ExportColumn<ChronologyItem>[] = [
  { header: "Date",       accessor: (r) => r.date },
  { header: "Time",       accessor: (r) => r.time ?? "" },
  { header: "Type",       accessor: (r) => SOURCE_LABELS[r.source_type] },
  { header: "Category",   accessor: (r) => r.category },
  { header: "Severity",   accessor: (r) => r.severity },
  { header: "Title",      accessor: (r) => r.title },
  { header: "Summary",    accessor: (r) => r.summary },
];

// ── Stat card ──────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  highlight,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-4 flex items-center gap-3",
        highlight ? "bg-red-50 border-red-200" : "bg-white"
      )}
    >
      <Icon
        className={cn(
          "w-5 h-5 shrink-0",
          highlight ? "text-red-500" : "text-slate-400"
        )}
      />
      <div>
        <div className={cn("text-2xl font-bold", highlight ? "text-red-700" : "text-slate-900")}>
          {value}
        </div>
        <div className="text-xs text-slate-500">{label}</div>
      </div>
    </div>
  );
}

// ── Chronology entry card ──────────────────────────────────────────────────────

function ChronologyCard({ item }: { item: ChronologyItem }) {
  const Icon = SOURCE_ICONS[item.source_type];
  return (
    <div className="relative flex gap-4">
      {/* timeline bar */}
      <div className="flex flex-col items-center">
        <div
          className={cn(
            "w-2 rounded-full mt-1.5",
            LEFT_BAR_COLOURS[item.severity]
          )}
          style={{ minHeight: "100%" }}
        />
      </div>

      {/* card */}
      <Card className="flex-1 mb-3 shadow-none border">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-start gap-2">
            {/* icon + source badge */}
            <div className="flex items-center gap-2 shrink-0">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center border",
                  SOURCE_COLOURS[item.source_type]
                )}
              >
                <Icon className="w-4 h-4" />
              </div>
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] font-medium",
                  SOURCE_COLOURS[item.source_type]
                )}
              >
                {SOURCE_LABELS[item.source_type]}
              </Badge>
            </div>

            {/* content */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="font-medium text-sm text-slate-900 leading-snug">
                  {item.title}
                </span>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] capitalize",
                    SEVERITY_COLOURS[item.severity]
                  )}
                >
                  {item.severity}
                </Badge>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                {item.summary || "No additional details recorded."}
              </p>

              <div className="flex flex-wrap items-center gap-3 mt-2">
                <span className="flex items-center gap-1 text-[11px] text-slate-400">
                  <Calendar className="w-3 h-3" />
                  {formatDate(item.date)}
                </span>
                {item.time && (
                  <span className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Clock className="w-3 h-3" />
                    {item.time}
                  </span>
                )}
                {item.links.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 underline underline-offset-2"
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Month group ────────────────────────────────────────────────────────────────

function MonthGroup({
  month,
  items,
}: {
  month: string;
  items: ChronologyItem[];
}) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider shrink-0">
          {month}
        </div>
        <div className="flex-1 border-t border-slate-100" />
        <span className="text-[10px] text-slate-400">
          {items.length} event{items.length !== 1 ? "s" : ""}
        </span>
      </div>
      {items.map((item) => (
        <ChronologyCard key={item.id} item={item} />
      ))}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function ChildChronologyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  // ── Filter state ──────────────────────────────────────────────────────────
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all");
  const [sourceFilter, setSourceFilter] = useState<SourceTypeFilter>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // ── Data ──────────────────────────────────────────────────────────────────
  const ypQuery = useYoungPerson(id);
  const yp = ypQuery.data?.data;

  const chronoQuery = useChildChronology({
    childId: id,
    from:    fromDate || undefined,
    to:      toDate   || undefined,
  });

  const allItems: ChronologyItem[] = chronoQuery.data?.data ?? [];
  const stats = chronoQuery.data?.stats;
  const isLoading = ypQuery.isLoading || chronoQuery.isLoading;

  // ── Client-side filter ────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let items = allItems;
    if (severityFilter !== "all") {
      items = items.filter((i) => i.severity === severityFilter);
    }
    if (sourceFilter !== "all") {
      items = items.filter((i) => i.source_type === sourceFilter);
    }
    return items;
  }, [allItems, severityFilter, sourceFilter]);

  const grouped = useMemo(() => groupByMonth(filtered), [filtered]);
  const monthKeys = Object.keys(grouped);

  const childName = yp
    ? `${yp.first_name} ${yp.last_name}`
    : "Child Chronology";

  const hasActiveFilters =
    severityFilter !== "all" ||
    sourceFilter !== "all" ||
    !!fromDate ||
    !!toDate;

  function clearFilters() {
    setSeverityFilter("all");
    setSourceFilter("all");
    setFromDate("");
    setToDate("");
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <PageShell
        title="Child Chronology"
        subtitle="Loading…"
      >
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 rounded-lg bg-slate-100 animate-pulse" />
          ))}
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title={`${childName} — Chronology`}
      subtitle={`Complete event timeline · ${stats?.total ?? 0} entries`}
      recordAnything
      recordChildId={id}
      caraContext={{
        childId:    id,
        childName,
        pageTitle:  "Child Chronology",
        suggestedAction:
          "Review this child's chronology for patterns, safeguarding concerns or Regulation 45 evidence.",
        extraContext: stats
          ? `${stats.critical} critical events, ${stats.incidents} incidents, ${stats.missing} missing episodes.`
          : undefined,
      }}
      actions={
        <div className="flex items-center gap-2 flex-wrap">
          <Link href={`/young-people/${id}`}>
            <Button variant="ghost" size="sm" className="gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to profile
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => setShowFilters((p) => !p)}
          >
            <Filter className="w-3.5 h-3.5" />
            Filter
            {hasActiveFilters && (
              <Badge className="ml-1 bg-blue-600 text-white text-[10px] px-1 py-0 h-4">
                on
              </Badge>
            )}
          </Button>
          <PrintButton
            title={`${childName} — Chronology`}
            subtitle="Cara Children's Home · Confidential"
            size="sm"
            variant="outline"
          />
          <ExportButton
            filename={`chronology-${id}`}
            columns={EXPORT_COLUMNS}
            data={filtered}
            size="sm"
            variant="outline"
            label="Export CSV"
          />
        </div>
      }
    >
      {/* ── Stats bar ──────────────────────────────────────────────────────── */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
          <StatCard label="Total events" value={stats.total} icon={Activity} />
          <StatCard
            label="Critical"
            value={stats.critical}
            icon={AlertTriangle}
            highlight={stats.critical > 0}
          />
          <StatCard label="Significant" value={stats.significant} icon={TrendingUp} />
          <StatCard label="Incidents"   value={stats.incidents}   icon={AlertTriangle} />
          <StatCard label="Missing"     value={stats.missing}     icon={MapPin} />
          <StatCard label="Key Working" value={stats.keywork}     icon={Heart} />
          <StatCard label="Behaviour"   value={stats.behaviour}   icon={Zap} />
        </div>
      )}

      {/* ── Filter panel ───────────────────────────────────────────────────── */}
      {showFilters && (
        <Card className="mb-6 border-blue-100 bg-blue-50">
          <CardHeader className="pb-2 pt-3 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-blue-800 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5" />
                Filter chronology
              </CardTitle>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-blue-700 hover:text-blue-900 h-6 px-2 text-xs"
                  onClick={clearFilters}
                >
                  <X className="w-3 h-3 mr-1" />
                  Clear all
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Severity */}
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                  Severity
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {(["all", "critical", "significant", "routine"] as SeverityFilter[]).map(
                    (s) => (
                      <button
                        key={s}
                        onClick={() => setSeverityFilter(s)}
                        className={cn(
                          "px-2.5 py-1 rounded text-xs font-medium capitalize border transition-colors",
                          severityFilter === s
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
                        )}
                      >
                        {s}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Source type */}
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                  Event type
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {(
                    [
                      "all",
                      "care_event",
                      "incident",
                      "missing_episode",
                      "behaviour_log",
                      "key_working",
                      "daily_log",
                      "risk_assessment",
                      "chronology_entry",
                      "family_time",
                      "lac_review",
                      "appointment",
                      "education",
                    ] as SourceTypeFilter[]
                  ).map((t) => (
                    <button
                      key={t}
                      onClick={() => setSourceFilter(t)}
                      className={cn(
                        "px-2.5 py-1 rounded text-xs font-medium border transition-colors",
                        sourceFilter === t
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
                      )}
                    >
                      {t === "all" ? "All types" : SOURCE_LABELS[t as ChronologyItem["source_type"]]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date range */}
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                  Date range
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="flex-1 text-xs border border-slate-200 rounded px-2 py-1.5 bg-white"
                    placeholder="From"
                  />
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="flex-1 text-xs border border-slate-200 rounded px-2 py-1.5 bg-white"
                    placeholder="To"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Results header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-slate-700">
          {hasActiveFilters
            ? `${filtered.length} filtered event${filtered.length !== 1 ? "s" : ""}`
            : `${filtered.length} total event${filtered.length !== 1 ? "s" : ""}`}
        </h2>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            Clear filters
          </button>
        )}
      </div>

      {/* ── Timeline ───────────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <User className="w-10 h-10 text-slate-300 mb-3" />
            <p className="text-sm text-slate-500 font-medium">No events found</p>
            <p className="text-xs text-slate-400 mt-1">
              {hasActiveFilters
                ? "Try adjusting your filters to see more results."
                : "No events have been recorded for this child yet."}
            </p>
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={clearFilters}
              >
                Clear filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {monthKeys.map((month) => (
            <MonthGroup
              key={month}
              month={month}
              items={grouped[month]}
            />
          ))}
        </div>
      )}
    </PageShell>
  );
}

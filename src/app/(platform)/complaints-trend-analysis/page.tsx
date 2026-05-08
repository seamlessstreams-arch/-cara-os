"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  MessageCircle,
  Lightbulb,
  CheckCircle,
  AlertTriangle,
  Clock,
  Loader2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useComplaintTrends } from "@/hooks/use-complaint-trends";
import type { ComplaintTrend } from "@/types/extended";

export default function ComplaintsTrendAnalysisPage() {
  const { data: res, isLoading } = useComplaintTrends();
  const data: ComplaintTrend[] = res?.data ?? [];

  const [sortBy, setSortBy] = useState("period");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const items = [...data];
    items.sort((a, b) => {
      switch (sortBy) {
        case "period":
          return b.period.localeCompare(a.period);
        case "volume":
          return b.total_complaints - a.total_complaints;
        case "resolution":
          return a.avg_resolution_days - b.avg_resolution_days;
        default:
          return 0;
      }
    });
    return items;
  }, [data, sortBy]);

  const latest = data[0];
  const prev = data[1];
  const totalAcrossPeriods = data.reduce((sum, r) => sum + r.total_complaints, 0);
  const totalFromChildren = data.reduce((sum, r) => sum + r.child_complaints_count, 0);
  const avgResolution = data.length > 0 ? Math.round(data.reduce((sum, r) => sum + r.avg_resolution_days, 0) / data.length) : 0;

  const exportCols: ExportColumn<ComplaintTrend>[] = [
    { header: "Period", accessor: (r: ComplaintTrend) => r.period },
    { header: "Total Complaints", accessor: (r: ComplaintTrend) => String(r.total_complaints) },
    { header: "From Children", accessor: (r: ComplaintTrend) => String(r.child_complaints_count) },
    { header: "Avg Resolution Days", accessor: (r: ComplaintTrend) => String(r.avg_resolution_days) },
    { header: "Resolved In Timeframe %", accessor: (r: ComplaintTrend) => `${r.resolved_within_timeframe}%` },
    { header: "Change vs Previous", accessor: (r: ComplaintTrend) => `${r.change_vs_last_period > 0 ? "+" : ""}${r.change_vs_last_period}%` },
    { header: "Themes", accessor: (r: ComplaintTrend) => r.themes.join("; ") },
    { header: "Analyst", accessor: (r: ComplaintTrend) => getStaffName(r.analyst) },
  ];

  if (isLoading) return <PageShell title="Complaints Trend Analysis" subtitle="Loading…"><div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div></PageShell>;

  return (
    <PageShell
      title="Complaints Trend Analysis"
      subtitle="Quarterly aggregated analysis — patterns, root causes, and improvements"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={data} columns={exportCols} filename="complaints-trend-analysis" />
          <PrintButton title="Complaints Trend Analysis" />
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold">{latest?.total_complaints ?? 0}</p>
          <p className="text-xs text-muted-foreground">{latest ? latest.period.split(" ")[0] : "—"} Complaints</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className={cn("text-2xl font-bold flex items-center justify-center gap-1",
            latest && latest.change_vs_last_period < 0 ? "text-green-600" : latest && latest.change_vs_last_period > 0 ? "text-red-600" : "text-slate-600"
          )}>
            {latest && latest.change_vs_last_period < 0 ? <TrendingDown className="h-5 w-5" /> :
             latest && latest.change_vs_last_period > 0 ? <TrendingUp className="h-5 w-5" /> : null}
            {latest ? `${latest.change_vs_last_period > 0 ? "+" : ""}${latest.change_vs_last_period}%` : "—"}
          </p>
          <p className="text-xs text-muted-foreground">vs Previous Quarter</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{totalFromChildren}/{totalAcrossPeriods}</p>
          <p className="text-xs text-muted-foreground">From Children (12mo)</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">{avgResolution} days</p>
          <p className="text-xs text-muted-foreground">Avg Resolution</p>
        </div>
      </div>

      <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 mb-6 flex items-start gap-2">
        <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
        <p className="text-sm text-blue-800">
          A complaint is a gift — it tells us something we need to know. Trend analysis turns individual
          complaints into organisational learning.{" "}
          {latest && prev
            ? latest.change_vs_last_period < 0
              ? `Latest quarter shows a ${Math.abs(latest.change_vs_last_period)}% reduction vs ${prev.period.split(" ")[0]}.`
              : "Latest quarter shows change requiring attention."
            : ""}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="period">Most Recent Period</SelectItem>
              <SelectItem value="volume">Highest Volume</SelectItem>
              <SelectItem value="resolution">Fastest Resolution</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((trend) => {
          const isExpanded = expandedId === trend.id;

          return (
            <div key={trend.id} className={cn("rounded-xl border bg-white overflow-hidden",
              trend.change_vs_last_period < 0 ? "border-l-4 border-l-green-500" :
              trend.change_vs_last_period > 0 ? "border-l-4 border-l-red-500" :
              "border-l-4 border-l-slate-400"
            )}>
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : trend.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <MessageCircle className="h-5 w-5 text-blue-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{trend.period}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {trend.total_complaints} complaints &middot; {trend.child_complaints_count} from children &middot; {trend.avg_resolution_days} days avg resolution &middot; {trend.resolved_within_timeframe}% in timeframe
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className={cn("text-sm font-bold flex items-center gap-1",
                    trend.change_vs_last_period < 0 ? "text-green-600" :
                    trend.change_vs_last_period > 0 ? "text-red-600" : "text-slate-600"
                  )}>
                    {trend.change_vs_last_period < 0 ? <TrendingDown className="h-4 w-4" /> :
                     trend.change_vs_last_period > 0 ? <TrendingUp className="h-4 w-4" /> : null}
                    {trend.change_vs_last_period > 0 ? "+" : ""}{trend.change_vs_last_period}%
                  </span>
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-white rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">By Category</p>
                      <div className="space-y-1">
                        {Object.entries(trend.by_category).filter(([, v]) => v > 0).map(([cat, count]) => (
                          <div key={cat} className="flex items-center justify-between text-sm">
                            <span>{cat}</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">By Source</p>
                      <div className="space-y-1">
                        {Object.entries(trend.by_source).map(([src, count]) => (
                          <div key={src} className="flex items-center justify-between text-sm">
                            <span>{src}</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">By Outcome</p>
                      <div className="space-y-1">
                        {Object.entries(trend.by_outcome).map(([out, count]) => (
                          <div key={out} className="flex items-center justify-between text-sm">
                            <span>{out}</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                      <AlertTriangle className="h-3 w-3 inline mr-1" />Themes Identified
                    </p>
                    <ul className="space-y-1">
                      {trend.themes.map((t, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <span className="text-amber-600 mt-0.5">•</span>
                          {t}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-purple-800 uppercase tracking-wide mb-1">Root Causes</p>
                    <ul className="space-y-1">
                      {trend.root_causes.map((r, i) => (
                        <li key={i} className="text-sm flex items-start gap-1">
                          <span className="text-purple-600 mt-0.5">•</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-green-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-green-800 uppercase tracking-wide mb-1">
                      <CheckCircle className="h-3 w-3 inline mr-1" />Improvements Implemented
                    </p>
                    <ul className="space-y-1">
                      {trend.improvements_implemented.map((imp, i) => (
                        <li key={i} className="text-sm flex items-start gap-1">
                          <CheckCircle className="h-3 w-3 text-green-500 mt-1 shrink-0" />
                          <span>{imp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {(trend.policy_changes_arising.length > 0 || trend.training_arising.length > 0) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {trend.policy_changes_arising.length > 0 && (
                        <div className="bg-blue-50 rounded-lg p-3">
                          <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">Policy Changes Arising</p>
                          <ul className="space-y-1">
                            {trend.policy_changes_arising.map((p, i) => (
                              <li key={i} className="text-sm flex items-start gap-1">
                                <span className="text-blue-600 mt-0.5">•</span>
                                <span>{p}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {trend.training_arising.length > 0 && (
                        <div className="bg-amber-50 rounded-lg p-3">
                          <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">Training Arising</p>
                          <ul className="space-y-1">
                            {trend.training_arising.map((t, i) => (
                              <li key={i} className="text-sm flex items-start gap-1">
                                <span className="text-amber-600 mt-0.5">•</span>
                                <span>{t}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span><Clock className="h-3 w-3 inline mr-1" />Avg resolution: {trend.avg_resolution_days} days</span>
                    <span>In timeframe: {trend.resolved_within_timeframe}%</span>
                    <span>Analyst: {getStaffName(trend.analyst)}</span>
                    <span>Review date: {trend.review_date}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> Complaint trend analysis supports Children&apos;s Homes Regulations
          2015 Regulation 39 (complaints), Quality Standard 13 (leadership and management), and Reg 45
          (review of quality of care). Trends are reported in Reg 45 reports, Reg 44 visits, and to commissioning
          authorities. Children&apos;s complaints are tracked separately to ensure their voice is amplified.
        </p>
      </div>
    </PageShell>
  );
}

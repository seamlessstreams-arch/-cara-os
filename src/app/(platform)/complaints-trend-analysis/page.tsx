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
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ── types ───────────────────────────────────────────────────────────────────
interface ComplaintTrend {
  id: string;
  period: string; // e.g. "Q1 2026"
  totalComplaints: number;
  byCategory: Record<string, number>;
  bySource: Record<string, number>; // who raised: child/parent/professional
  byOutcome: Record<string, number>; // upheld/partially/not upheld/withdrawn
  avgResolutionDays: number;
  resolvedWithinTimeframe: number; // %
  childComplaintsCount: number;
  themes: string[];
  rootCauses: string[];
  improvementsImplemented: string[];
  policyChangesArising: string[];
  trainingArising: string[];
  changeVsLastPeriod: number; // percentage
  analyst: string;
  reviewDate: string;
}

// ── seed data ───────────────────────────────────────────────────────────────
const data: ComplaintTrend[] = [
  {
    id: "ct-q1-2026",
    period: "Q1 2026 (Jan-Mar)",
    totalComplaints: 6,
    byCategory: {
      "Care quality": 1,
      "Communication": 2,
      "Privacy": 1,
      "Behaviour management": 1,
      "Environment": 1,
    },
    bySource: { "Child": 3, "Parent": 1, "Social Worker": 1, "Other Professional": 1 },
    byOutcome: { "Upheld": 2, "Partially Upheld": 2, "Not Upheld": 1, "Withdrawn": 1 },
    avgResolutionDays: 8,
    resolvedWithinTimeframe: 100,
    childComplaintsCount: 3,
    themes: [
      "Communication during shift handovers (2 complaints linked)",
      "Privacy in shared spaces (1 complaint)",
      "Inconsistent application of phone agreements (1 complaint)",
    ],
    rootCauses: [
      "Handover process loss of detail when verbal-only",
      "Privacy needs of older children require updated approach as they mature",
      "Phone policy ambiguity around weekend use",
    ],
    improvementsImplemented: [
      "Written handover summary template introduced",
      "Privacy review with each young person added to monthly key working",
      "Phone agreement co-produced with all children (clearer language)",
      "Weekly team meeting agenda now includes complaint themes",
    ],
    policyChangesArising: [
      "Privacy Policy updated to reflect age-related expectations",
      "Phone Use Policy redrafted in plain language",
    ],
    trainingArising: [
      "Refresher: handover protocols and structured tools (delivered Feb 2026)",
      "Privacy and dignity workshop scheduled April 2026",
    ],
    changeVsLastPeriod: -25,
    analyst: "staff_darren",
    reviewDate: "2026-04-05",
  },
  {
    id: "ct-q4-2025",
    period: "Q4 2025 (Oct-Dec)",
    totalComplaints: 8,
    byCategory: {
      "Care quality": 1,
      "Communication": 4,
      "Privacy": 1,
      "Behaviour management": 1,
      "Environment": 1,
    },
    bySource: { "Child": 4, "Parent": 2, "Social Worker": 2 },
    byOutcome: { "Upheld": 3, "Partially Upheld": 3, "Not Upheld": 1, "Withdrawn": 1 },
    avgResolutionDays: 9,
    resolvedWithinTimeframe: 87,
    childComplaintsCount: 4,
    themes: [
      "Communication breakdowns particularly with parents (4 complaints)",
      "Holiday period staffing concerns from one parent",
      "Privacy in bedroom searches following an incident (1 complaint, partially upheld)",
    ],
    rootCauses: [
      "Christmas/holiday staffing patterns disrupted regular communication",
      "No written record of routine parent updates — only ad-hoc",
      "Bedroom search procedure not adequately explained to child at the time",
    ],
    improvementsImplemented: [
      "Parent communication log introduced (every 2 weeks minimum)",
      "Bedroom search protocol updated — child briefing before, debrief after",
      "Holiday cover plan revised to maintain communication continuity",
    ],
    policyChangesArising: [
      "Parent Partnership Policy updated with communication minimums",
      "Bedroom Search Protocol rewritten with child-friendly version",
    ],
    trainingArising: [
      "Parent partnership communication workshop (delivered Nov 2025)",
      "Search protocol refresher delivered Dec 2025",
    ],
    changeVsLastPeriod: 14,
    analyst: "staff_darren",
    reviewDate: "2026-01-08",
  },
  {
    id: "ct-q3-2025",
    period: "Q3 2025 (Jul-Sep)",
    totalComplaints: 7,
    byCategory: {
      "Care quality": 2,
      "Communication": 2,
      "Privacy": 0,
      "Behaviour management": 2,
      "Environment": 1,
    },
    bySource: { "Child": 4, "Parent": 1, "Social Worker": 2 },
    byOutcome: { "Upheld": 2, "Partially Upheld": 2, "Not Upheld": 2, "Withdrawn": 1 },
    avgResolutionDays: 11,
    resolvedWithinTimeframe: 71,
    childComplaintsCount: 4,
    themes: [
      "Behaviour management consistency between staff (2 complaints)",
      "Summer holiday activity boredom (raised informally, then formal)",
      "Two complaints from same child within same week — escalation pattern",
    ],
    rootCauses: [
      "New staff onboarding gaps in behaviour framework",
      "Insufficient summer holiday planning for activity engagement",
      "One child's complaint escalation linked to underlying transition stress",
    ],
    improvementsImplemented: [
      "All new staff receive behaviour framework training within first week",
      "Summer activity planning brought forward to May (was June)",
      "'Repeat complaint' early warning system added to weekly meeting",
    ],
    policyChangesArising: [],
    trainingArising: [
      "Behaviour framework refresher all staff (delivered Aug 2025)",
      "Trauma-informed escalation training (delivered Sep 2025)",
    ],
    changeVsLastPeriod: 0,
    analyst: "staff_darren",
    reviewDate: "2025-10-05",
  },
  {
    id: "ct-q2-2025",
    period: "Q2 2025 (Apr-Jun)",
    totalComplaints: 7,
    byCategory: {
      "Care quality": 1,
      "Communication": 3,
      "Privacy": 1,
      "Behaviour management": 1,
      "Environment": 1,
    },
    bySource: { "Child": 3, "Parent": 2, "Social Worker": 1, "Other Professional": 1 },
    byOutcome: { "Upheld": 2, "Partially Upheld": 2, "Not Upheld": 2, "Withdrawn": 1 },
    avgResolutionDays: 10,
    resolvedWithinTimeframe: 86,
    childComplaintsCount: 3,
    themes: [
      "Inconsistent communication response times during evenings",
      "One environmental complaint about heating in March/April",
      "Privacy complaint about visitor entry to bedroom corridor",
    ],
    rootCauses: [
      "Out-of-hours communication protocol unclear to families",
      "Heating system issues during transitional weather",
      "Visitor management protocol needed update for upper floor",
    ],
    improvementsImplemented: [
      "Out-of-hours communication protocol clarified and shared",
      "Heating system serviced and repaired",
      "Visitor management updated with sign-in zones",
    ],
    policyChangesArising: [
      "Visitor Management Procedure v2 issued",
    ],
    trainingArising: [
      "Customer service / response standards delivered May 2025",
    ],
    changeVsLastPeriod: -13,
    analyst: "staff_darren",
    reviewDate: "2025-07-05",
  },
];

// ── export columns ──────────────────────────────────────────────────────────
const exportCols: ExportColumn<ComplaintTrend>[] = [
  { header: "Period", accessor: (r: ComplaintTrend) => r.period },
  { header: "Total Complaints", accessor: (r: ComplaintTrend) => String(r.totalComplaints) },
  { header: "From Children", accessor: (r: ComplaintTrend) => String(r.childComplaintsCount) },
  { header: "Avg Resolution Days", accessor: (r: ComplaintTrend) => String(r.avgResolutionDays) },
  { header: "Resolved In Timeframe %", accessor: (r: ComplaintTrend) => `${r.resolvedWithinTimeframe}%` },
  { header: "Change vs Previous", accessor: (r: ComplaintTrend) => `${r.changeVsLastPeriod > 0 ? "+" : ""}${r.changeVsLastPeriod}%` },
  { header: "Themes", accessor: (r: ComplaintTrend) => r.themes.join("; ") },
  { header: "Analyst", accessor: (r: ComplaintTrend) => getStaffName(r.analyst) },
];

// ── component ───────────────────────────────────────────────────────────────
export default function ComplaintsTrendAnalysisPage() {
  const [sortBy, setSortBy] = useState("period");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const items = [...data];
    items.sort((a, b) => {
      switch (sortBy) {
        case "period":
          return b.period.localeCompare(a.period);
        case "volume":
          return b.totalComplaints - a.totalComplaints;
        case "resolution":
          return a.avgResolutionDays - b.avgResolutionDays;
        default:
          return 0;
      }
    });
    return items;
  }, [sortBy]);

  // ── stats ─────────────────────────────────────────────────────────────────
  const latest = data[0];
  const prev = data[1];
  const totalAcrossPeriods = data.reduce((sum, r) => sum + r.totalComplaints, 0);
  const totalFromChildren = data.reduce((sum, r) => sum + r.childComplaintsCount, 0);
  const avgResolution = Math.round(data.reduce((sum, r) => sum + r.avgResolutionDays, 0) / data.length);

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
      {/* ── summary stats ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold">{latest.totalComplaints}</p>
          <p className="text-xs text-muted-foreground">{latest.period.split(" ")[0]} Complaints</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className={cn("text-2xl font-bold flex items-center justify-center gap-1",
            latest.changeVsLastPeriod < 0 ? "text-green-600" : latest.changeVsLastPeriod > 0 ? "text-red-600" : "text-slate-600"
          )}>
            {latest.changeVsLastPeriod < 0 ? <TrendingDown className="h-5 w-5" /> :
             latest.changeVsLastPeriod > 0 ? <TrendingUp className="h-5 w-5" /> : null}
            {latest.changeVsLastPeriod > 0 ? "+" : ""}{latest.changeVsLastPeriod}%
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

      {/* ── insight banner ─────────────────────────────────────────────── */}
      <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 mb-6 flex items-start gap-2">
        <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
        <p className="text-sm text-blue-800">
          A complaint is a gift — it tells us something we need to know. Trend analysis turns individual
          complaints into organisational learning. Latest quarter shows{" "}
          {latest.changeVsLastPeriod < 0 ? `a ${Math.abs(latest.changeVsLastPeriod)}% reduction vs ${prev.period.split(" ")[0]}.` : `change requiring attention.`}
        </p>
      </div>

      {/* ── sort ───────────────────────────────────────────────────────── */}
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

      {/* ── trend cards ────────────────────────────────────────────────── */}
      <div className="space-y-3">
        {filtered.map((trend) => {
          const isExpanded = expandedId === trend.id;

          return (
            <div key={trend.id} className={cn("rounded-xl border bg-white overflow-hidden",
              trend.changeVsLastPeriod < 0 ? "border-l-4 border-l-green-500" :
              trend.changeVsLastPeriod > 0 ? "border-l-4 border-l-red-500" :
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
                      {trend.totalComplaints} complaints &middot; {trend.childComplaintsCount} from children &middot; {trend.avgResolutionDays} days avg resolution &middot; {trend.resolvedWithinTimeframe}% in timeframe
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className={cn("text-sm font-bold flex items-center gap-1",
                    trend.changeVsLastPeriod < 0 ? "text-green-600" :
                    trend.changeVsLastPeriod > 0 ? "text-red-600" : "text-slate-600"
                  )}>
                    {trend.changeVsLastPeriod < 0 ? <TrendingDown className="h-4 w-4" /> :
                     trend.changeVsLastPeriod > 0 ? <TrendingUp className="h-4 w-4" /> : null}
                    {trend.changeVsLastPeriod > 0 ? "+" : ""}{trend.changeVsLastPeriod}%
                  </span>
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  {/* breakdowns */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-white rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">By Category</p>
                      <div className="space-y-1">
                        {Object.entries(trend.byCategory).filter(([, v]) => v > 0).map(([cat, count]) => (
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
                        {Object.entries(trend.bySource).map(([src, count]) => (
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
                        {Object.entries(trend.byOutcome).map(([out, count]) => (
                          <div key={out} className="flex items-center justify-between text-sm">
                            <span>{out}</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* themes */}
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

                  {/* root causes */}
                  <div className="bg-purple-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-purple-800 uppercase tracking-wide mb-1">Root Causes</p>
                    <ul className="space-y-1">
                      {trend.rootCauses.map((r, i) => (
                        <li key={i} className="text-sm flex items-start gap-1">
                          <span className="text-purple-600 mt-0.5">•</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* improvements */}
                  <div className="bg-green-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-green-800 uppercase tracking-wide mb-1">
                      <CheckCircle className="h-3 w-3 inline mr-1" />Improvements Implemented
                    </p>
                    <ul className="space-y-1">
                      {trend.improvementsImplemented.map((imp, i) => (
                        <li key={i} className="text-sm flex items-start gap-1">
                          <CheckCircle className="h-3 w-3 text-green-500 mt-1 shrink-0" />
                          <span>{imp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* policy + training arising */}
                  {(trend.policyChangesArising.length > 0 || trend.trainingArising.length > 0) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {trend.policyChangesArising.length > 0 && (
                        <div className="bg-blue-50 rounded-lg p-3">
                          <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">Policy Changes Arising</p>
                          <ul className="space-y-1">
                            {trend.policyChangesArising.map((p, i) => (
                              <li key={i} className="text-sm flex items-start gap-1">
                                <span className="text-blue-600 mt-0.5">•</span>
                                <span>{p}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {trend.trainingArising.length > 0 && (
                        <div className="bg-amber-50 rounded-lg p-3">
                          <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">Training Arising</p>
                          <ul className="space-y-1">
                            {trend.trainingArising.map((t, i) => (
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
                    <span><Clock className="h-3 w-3 inline mr-1" />Avg resolution: {trend.avgResolutionDays} days</span>
                    <span>In timeframe: {trend.resolvedWithinTimeframe}%</span>
                    <span>Analyst: {getStaffName(trend.analyst)}</span>
                    <span>Review date: {trend.reviewDate}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── regulatory note ────────────────────────────────────────────── */}
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

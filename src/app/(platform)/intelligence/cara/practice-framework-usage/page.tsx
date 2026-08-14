"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — PRACTICE FRAMEWORK USAGE INTELLIGENCE
// Which KB frameworks is the team actually engaging with — and how deeply?
// Five sources: Writing Assistant, Reflective Supervision, Incident Mode,
// PACE Profiles, Practice Observations.
// ══════════════════════════════════════════════════════════════════════════════

import { useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Heart, ListChecks, ShieldCheck, Activity, Users, RefreshCcw,
  TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp, BookOpen,
  Sparkles, AlertCircle, CheckCircle2,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";

import { EmptyState } from "@/components/ui/empty-state";
type FrameworkSignal = "active" | "emerging" | "dormant";
type FrameworkTrend = "increasing" | "stable" | "declining";

interface SourceBreakdown {
  writingAssistant: number;
  reflectiveSupervision: number;
  incidentMode: number;
  paceProfiles: number;
  practiceObservations: number;
}

interface TopEngager {
  staffId: string;
  name: string;
  count: number;
}

interface FrameworkUsage {
  frameworkId: string;
  title: string;
  shortDesc: string;
  icon: string;
  totalEngagements: number;
  sources: SourceBreakdown;
  signal: FrameworkSignal;
  trend: FrameworkTrend;
  topEngagers: TopEngager[];
  supervisionPrompt: string;
}

interface FrameworkUsageSummary {
  totalEngagements: number;
  activeFrameworks: number;
  mostActiveFramework: { id: string; title: string } | null;
  needsAttentionFramework: { id: string; title: string } | null;
  topPractitioner: TopEngager | null;
  sourceBreakdown: SourceBreakdown;
}

interface PracticeFrameworkUsageResponse {
  frameworks: FrameworkUsage[];
  summary: FrameworkUsageSummary;
}

function usePracticeFrameworkUsage() {
  return useQuery({
    queryKey: ["practice-framework-usage"],
    queryFn: () =>
      api.get<{ data: PracticeFrameworkUsageResponse }>("/practice-framework-usage"),
    staleTime: 60_000,
  });
}

// ── Icon map ──────────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ElementType> = {
  Heart, ListChecks, ShieldCheck, Activity, Users, RefreshCcw,
};

// ── Signal styling ────────────────────────────────────────────────────────────

const SIGNAL_CONFIG: Record<FrameworkSignal, { label: string; badge: string; dot: string }> = {
  active:   { label: "Active",    badge: "bg-emerald-50 text-emerald-800 border-emerald-300", dot: "bg-emerald-500" },
  emerging: { label: "Emerging",  badge: "bg-amber-50 text-amber-800 border-amber-300",       dot: "bg-amber-400"  },
  dormant:  { label: "Dormant",   badge: "bg-slate-100 text-slate-600 border-slate-300",       dot: "bg-slate-400"  },
};

function TrendIcon({ trend }: { trend: FrameworkTrend }) {
  if (trend === "increasing") return <TrendingUp className="h-4 w-4 text-emerald-600" />;
  if (trend === "declining")  return <TrendingDown className="h-4 w-4 text-rose-500" />;
  return <Minus className="h-4 w-4 text-slate-400" />;
}

// ── Source label helpers ──────────────────────────────────────────────────────

const SOURCE_LABELS: Array<{ key: keyof FrameworkUsage["sources"]; label: string; colour: string }> = [
  { key: "writingAssistant",    label: "Writing Assistant",    colour: "bg-violet-500" },
  { key: "reflectiveSupervision", label: "Reflective Supervision", colour: "bg-blue-500"   },
  { key: "incidentMode",        label: "Incident Mode",        colour: "bg-orange-500" },
  { key: "paceProfiles",        label: "PACE Profiles",        colour: "bg-emerald-500"},
  { key: "practiceObservations",label: "Practice Observations",colour: "bg-rose-400"   },
];

// ── Framework card ────────────────────────────────────────────────────────────

function FrameworkCard({ fw, maxEngagements }: { fw: FrameworkUsage; maxEngagements: number }) {
  const [expanded, setExpanded] = useState(false);
  const IconComp = ICON_MAP[fw.icon] ?? BookOpen;
  const sc = SIGNAL_CONFIG[fw.signal];
  const barWidth = maxEngagements > 0 ? Math.round((fw.totalEngagements / maxEngagements) * 100) : null;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100">
              <IconComp className="h-4 w-4 text-slate-600" />
            </div>
            <div>
              <CardTitle className="text-base leading-snug">{fw.title}</CardTitle>
              <CardDescription className="mt-0.5 text-xs leading-snug">{fw.shortDesc}</CardDescription>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <TrendIcon trend={fw.trend} />
            <Badge variant="outline" className={`text-[11px] font-medium ${sc.badge}`}>
              <span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${sc.dot}`} />
              {sc.label}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {/* Engagement bar */}
        <div>
          <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
            <span>Engagements across all sources</span>
            <span className="font-semibold text-slate-700">{fw.totalEngagements}</span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-100">
            <div
              className="h-2 rounded-full bg-slate-500 transition-all"
              style={{ width: `${barWidth}%` }}
            />
          </div>
        </div>

        {/* Source micro-bars */}
        <div className="grid grid-cols-5 gap-1">
          {SOURCE_LABELS.map(({ key, label, colour }) => (
            <div key={key} title={label} className="flex flex-col items-center gap-1">
              <div className="h-8 w-full rounded bg-slate-100 flex items-end overflow-hidden">
                {fw.sources[key] > 0 && (
                  <div
                    className={`w-full rounded ${colour} opacity-80`}
                    style={{ height: `${Math.max(20, (fw.sources[key] / (fw.totalEngagements || 1)) * 100)}%` }}
                  />
                )}
              </div>
              <span className="text-[9px] text-slate-400 text-center leading-tight">{label.split(" ")[0]}</span>
            </div>
          ))}
        </div>

        {/* Top engagers */}
        {fw.topEngagers.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {fw.topEngagers.map((e) => (
              <span key={e.staffId} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
                {e.name} <span className="font-semibold text-slate-700">·{e.count}</span>
              </span>
            ))}
          </div>
        )}

        {/* Expand toggle */}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-full justify-between px-0 text-xs text-slate-500 hover:text-slate-700"
          onClick={() => setExpanded(!expanded)}
        >
          <span>Supervision prompt</span>
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </Button>

        {expanded && (
          <div className="rounded-md bg-blue-50 border border-blue-100 p-3 text-xs text-blue-800 leading-relaxed">
            {fw.supervisionPrompt}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Summary tile ──────────────────────────────────────────────────────────────

function SummaryTile({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: string }) {
  return (
    <div className={`rounded-lg border bg-white p-4 ${accent ?? ""}`}>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-0.5 text-2xl font-bold text-slate-800">{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-slate-500">{sub}</p>}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type FilterValue = "all" | FrameworkSignal;

export default function PracticeFrameworkUsagePage() {
  const { data: res, isLoading, isError } = usePracticeFrameworkUsage();
  const [filter, setFilter] = useState<FilterValue>("all");

  const payload = res?.data;
  const frameworks = payload?.frameworks ?? [];
  const summary   = payload?.summary;

  const maxEngagements = frameworks.reduce((m, f) => Math.max(m, f.totalEngagements), 1);

  const visible = filter === "all"
    ? frameworks
    : frameworks.filter((f) => f.signal === filter);

  const FILTERS: Array<{ value: FilterValue; label: string }> = [
    { value: "all",      label: "All" },
    { value: "active",   label: "Active" },
    { value: "emerging", label: "Emerging" },
    { value: "dormant",  label: "Dormant" },
  ];

  return (
    <PageShell
      title="Practice Framework Usage"
      description="Which Cara Knowledge Base frameworks is the team actively engaging with across writing, supervision, incident mode, and practice observations?"
    >
      {isLoading && (
        <div className="flex items-center justify-center py-24 text-slate-400">
          <Sparkles className="mr-2 h-5 w-5 animate-pulse" />
          Analysing practice framework engagement…
        </div>
      )}

      {isError && (
        <div className="flex items-center gap-2 rounded-lg bg-rose-50 p-4 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Could not load practice framework usage data.
        </div>
      )}

      {!isLoading && !isError && payload && (
        <div className="space-y-6">
          {/* Summary tiles */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SummaryTile
              label="Total engagements"
              value={summary?.totalEngagements ?? 0}
              sub="across all sources"
            />
            <SummaryTile
              label="Active frameworks"
              value={summary?.activeFrameworks ?? 0}
              sub={`of ${frameworks.length} tracked`}
            />
            <SummaryTile
              label="Most engaged"
              value={summary?.mostActiveFramework?.title ?? "—"}
              sub="highest overall signal"
            />
            <SummaryTile
              label="Needs attention"
              value={summary?.needsAttentionFramework?.title ?? "—"}
              sub="lowest engagement"
            />
          </div>

          {/* Top practitioner strip */}
          {summary?.topPractitioner && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-100 px-4 py-2.5 text-sm">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span className="text-emerald-800">
                <strong>{summary.topPractitioner.name}</strong> is the most active framework practitioner —{" "}
                {summary.topPractitioner.count} cross-framework engagements.
              </span>
            </div>
          )}

          {/* Source breakdown */}
          <div className="rounded-lg border bg-white p-4">
            <p className="mb-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Engagement by source</p>
            <div className="grid grid-cols-5 gap-3">
              {SOURCE_LABELS.map(({ key, label, colour }) => (
                <div key={key} className="flex flex-col items-center gap-1.5">
                  <div className={`h-2 w-full rounded-full ${colour} opacity-70`} style={{
                    width: `${summary ? Math.round(((summary.sourceBreakdown[key] ?? 0) / Math.max(summary.totalEngagements, 1)) * 100) : 0}%`,
                    minWidth: "1rem",
                  }} />
                  <span className="text-xs text-slate-500 text-center leading-tight">{label}</span>
                  <span className="text-sm font-semibold text-slate-700">
                    {summary?.sourceBreakdown[key] ?? 0}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Filter chips */}
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <Button
                key={f.value}
                variant={filter === f.value ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(f.value)}
                className="h-8 rounded-full text-xs"
              >
                {f.label}
              </Button>
            ))}
          </div>

          {/* Framework grid */}
          {visible.length === 0 ? (
            <EmptyState compact title="No frameworks match this filter." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {visible.map((fw) => (
                <FrameworkCard key={fw.frameworkId} fw={fw} maxEngagements={maxEngagements} />
              ))}
            </div>
          )}

          {/* Accountability footer */}
          <p className="text-center text-[11px] text-slate-400">
            Cara surfaces engagement evidence — the manager assesses practice quality and decides next steps.
          </p>
        </div>
      )}
    </PageShell>
  );
}

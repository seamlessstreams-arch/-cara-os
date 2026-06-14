"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CaraIncidentAnalysis
//
// Dashboard widget showing incident analysis intelligence.
// Surfaces trends, restraint audit, trigger patterns, per-child breakdown,
// and regulatory compliance (Reg 12, Reg 40).
// ══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useState } from "react";
import {
  Loader2, Flame, AlertTriangle, CheckCircle2, TrendingUp,
  TrendingDown, ChevronDown, ChevronUp, RefreshCw, XCircle,
  Shield, Clock, Minus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────────────────

interface RestraintAnalysis {
  totalRestraints: number;
  restraintRate: number;
  averageDuration: number;
  deEscalationBeforeRestraint: number;
  injuryDuringRestraint: number;
  debriefRate: number;
}

interface ChildIncidentSummary {
  childId: string;
  childName: string;
  totalIncidents: number;
  restraints: number;
  mostCommonCategory: string;
  mostCommonTrigger?: string;
  trend: "increasing" | "stable" | "decreasing";
}

interface TriggerInsight {
  trigger: string;
  count: number;
  percent: number;
  associatedChildren: string[];
}

interface IncidentAlert {
  severity: "critical" | "high" | "medium" | "advisory";
  category: string;
  title: string;
  description: string;
  action: string;
  regulation?: string;
}

interface IncidentData {
  homeId: string;
  analysisDate: string;
  windowDays: number;
  totalIncidents: number;
  incidentsPerWeek: number;
  trend: "increasing" | "stable" | "decreasing";
  trendDescription: string;
  severityBreakdown: { severity: string; count: number; percent: number }[];
  categoryBreakdown: { category: string; label: string; count: number; percent: number }[];
  restraintAnalysis: RestraintAnalysis;
  childBreakdown: ChildIncidentSummary[];
  triggerAnalysis: TriggerInsight[];
  deEscalationRate: number;
  alerts: IncidentAlert[];
  regulatoryStatus: {
    compliant: boolean;
    issues: string[];
    strengths: string[];
  };
}

// ── Component ───────────────────────────────────────────────────────────────

interface Props {
  homeId?: string;
  days?: number;
}

export default function CaraIncidentAnalysis({ homeId = "home_oak", days = 28 }: Props) {
  const [data, setData] = useState<IncidentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/cara/incident-analysis?homeId=${homeId}&days=${days}`);
      const json = await res.json();
      if (json.ok) setData(json.data);
      else setError(json.error ?? "Failed to load");
    } catch {
      setError("Failed to fetch incident analysis");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [homeId, days]);

  if (loading) {
    return (
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Analysing incident records…
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <p className="text-sm text-red-600">{error ?? "No data"}</p>
      </div>
    );
  }

  const trendIcon = data.trend === "increasing"
    ? <TrendingUp className="h-3.5 w-3.5 text-red-600" />
    : data.trend === "decreasing"
      ? <TrendingDown className="h-3.5 w-3.5 text-emerald-600" />
      : <Minus className="h-3.5 w-3.5 text-gray-400" />;

  const statusColor = data.regulatoryStatus.compliant
    ? "text-emerald-700 bg-emerald-50 border-emerald-200"
    : data.alerts.some((a) => a.severity === "critical")
      ? "text-red-700 bg-red-50 border-red-200"
      : "text-amber-700 bg-amber-50 border-amber-200";

  return (
    <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <Flame className="h-4 w-4 text-red-500" />
          <h3 className="text-sm font-semibold text-gray-900">Incident Analysis</h3>
          <span className="text-[10px] text-gray-400 ml-1">{data.windowDays}-day window</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={fetchData}>
            <RefreshCw className="h-3.5 w-3.5 text-gray-400" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      {/* Status banner */}
      <div className={cn("mx-4 mb-3 rounded-lg border px-3 py-2 flex items-center gap-2", statusColor)}>
        {data.regulatoryStatus.compliant
          ? <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          : <AlertTriangle className="h-4 w-4 text-amber-600" />}
        <span className="text-xs font-medium">
          {data.totalIncidents} incidents in {data.windowDays} days
        </span>
        <span className="ml-auto flex items-center gap-1 text-xs">
          {trendIcon}
          <span className={cn("font-medium", data.trend === "increasing" ? "text-red-600" : data.trend === "decreasing" ? "text-emerald-600" : "text-gray-500")}>
            {data.trend === "increasing" ? "Rising" : data.trend === "decreasing" ? "Falling" : "Stable"}
          </span>
        </span>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-4 gap-2 px-4 pb-3">
        <MetricBox label="Per Week" value={String(data.incidentsPerWeek)} good={data.incidentsPerWeek <= 2} warn={data.incidentsPerWeek > 4} />
        <MetricBox label="Restraints" value={String(data.restraintAnalysis.totalRestraints)} good={data.restraintAnalysis.totalRestraints === 0} warn={data.restraintAnalysis.totalRestraints > 2} />
        <MetricBox label="De-esc %" value={`${data.deEscalationRate}%`} good={data.deEscalationRate >= 80} warn={data.deEscalationRate < 60} />
        <MetricBox label="Alerts" value={String(data.alerts.length)} good={data.alerts.length === 0} warn={data.alerts.length > 2} />
      </div>

      {/* Restraint summary */}
      {data.restraintAnalysis.totalRestraints > 0 && (
        <div className="mx-4 mb-3 rounded-lg bg-gray-50 px-3 py-2">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="h-3.5 w-3.5 text-indigo-600" />
            <span className="text-xs font-medium text-gray-700">Restraint Audit</span>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-gray-600">
            <span>{data.restraintAnalysis.totalRestraints} used</span>
            <span className="text-gray-300">|</span>
            <span>Avg {data.restraintAnalysis.averageDuration}min</span>
            <span className="text-gray-300">|</span>
            <span className={cn(data.restraintAnalysis.debriefRate === 100 ? "text-emerald-700" : "text-amber-700")}>
              {data.restraintAnalysis.debriefRate}% debriefed
            </span>
            {data.restraintAnalysis.injuryDuringRestraint > 0 && (
              <>
                <span className="text-gray-300">|</span>
                <span className="text-red-600">{data.restraintAnalysis.injuryDuringRestraint} injury</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Alerts */}
      {data.alerts.length > 0 && (
        <div className="mx-4 mb-3 space-y-1.5">
          {data.alerts.slice(0, expanded ? undefined : 2).map((alert, i) => (
            <AlertRow key={i} alert={alert} />
          ))}
          {!expanded && data.alerts.length > 2 && (
            <p className="text-[10px] text-gray-400 pl-1">+{data.alerts.length - 2} more</p>
          )}
        </div>
      )}

      {/* Expanded */}
      {expanded && (
        <div className="border-t px-4 pt-3 pb-4 space-y-4">
          {/* Child breakdown */}
          <div>
            <h4 className="text-xs font-semibold text-gray-700 mb-2">Per-Child Breakdown</h4>
            <div className="space-y-1.5">
              {data.childBreakdown.map((child) => (
                <div key={child.childId} className="rounded-lg bg-gray-50 px-3 py-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-800">{child.childName}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-500">{child.totalIncidents} incidents</span>
                      <TrendBadge trend={child.trend} />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-500">
                    <span>Main: {child.mostCommonCategory}</span>
                    {child.mostCommonTrigger && <span>Trigger: {child.mostCommonTrigger}</span>}
                    {child.restraints > 0 && <span className="text-red-600">{child.restraints} restraints</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Triggers */}
          {data.triggerAnalysis.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-700 mb-2">Common Triggers</h4>
              <div className="space-y-1">
                {data.triggerAnalysis.slice(0, 5).map((trig) => (
                  <div key={trig.trigger} className="flex items-center justify-between text-xs">
                    <span className="text-gray-700 capitalize">{trig.trigger.replace(/_/g, " ")}</span>
                    <span className="text-gray-500">{trig.count}x ({trig.percent}%)</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Category breakdown */}
          <div>
            <h4 className="text-xs font-semibold text-gray-700 mb-2">Categories</h4>
            <div className="space-y-1">
              {data.categoryBreakdown.slice(0, 5).map((cat) => (
                <div key={cat.category} className="flex items-center justify-between text-xs">
                  <span className="text-gray-700">{cat.label}</span>
                  <span className="text-gray-500">{cat.count} ({cat.percent}%)</span>
                </div>
              ))}
            </div>
          </div>

          {/* Strengths */}
          {data.regulatoryStatus.strengths.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-700 mb-1">Strengths</h4>
              {data.regulatoryStatus.strengths.map((s, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs text-emerald-700">
                  <CheckCircle2 className="h-3 w-3" />
                  {s}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Subcomponents ───────────────────────────────────────────────────────────

function MetricBox({ label, value, good, warn }: { label: string; value: string; good: boolean; warn: boolean }) {
  return (
    <div className="rounded-lg bg-gray-50 px-2 py-1.5 text-center">
      <div className={cn("text-sm font-bold", good ? "text-emerald-700" : warn ? "text-red-700" : "text-gray-800")}>
        {value}
      </div>
      <div className="text-[10px] text-gray-500">{label}</div>
    </div>
  );
}

function AlertRow({ alert }: { alert: IncidentAlert }) {
  const colors: Record<string, string> = {
    critical: "border-red-200 bg-red-50 text-red-800",
    high: "border-amber-200 bg-amber-50 text-amber-800",
    medium: "border-yellow-100 bg-yellow-50 text-yellow-800",
    advisory: "border-gray-200 bg-gray-50 text-gray-700",
  };

  return (
    <div className={cn("rounded-lg border px-3 py-2", colors[alert.severity] ?? colors.advisory)}>
      <div className="flex items-start gap-2">
        {alert.severity === "critical" ? (
          <XCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
        ) : (
          <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
        )}
        <div>
          <p className="text-xs font-medium">{alert.title}</p>
          <p className="text-[10px] opacity-80 mt-0.5">{alert.action}</p>
          {alert.regulation && (
            <p className="text-[10px] opacity-60 mt-0.5 italic">{alert.regulation}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function TrendBadge({ trend }: { trend: "increasing" | "stable" | "decreasing" }) {
  if (trend === "increasing") return <span className="rounded bg-red-100 px-1 py-0.5 text-[9px] font-medium text-red-700">Rising</span>;
  if (trend === "decreasing") return <span className="rounded bg-emerald-100 px-1 py-0.5 text-[9px] font-medium text-emerald-700">Falling</span>;
  return <span className="rounded bg-gray-100 px-1 py-0.5 text-[9px] font-medium text-gray-600">Stable</span>;
}

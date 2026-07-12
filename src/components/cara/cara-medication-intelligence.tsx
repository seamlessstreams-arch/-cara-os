"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CaraMedicationIntelligence
//
// Dashboard widget showing medication administration intelligence.
// Surfaces compliance rate, missed doses, refusals, PRN trends,
// controlled drug audit status, and regulatory compliance.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useState } from "react";
import {
  Loader2, Pill, AlertTriangle, CheckCircle2, Clock,
  ChevronDown, ChevronUp, RefreshCw, Shield, TrendingUp,
  XCircle, Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────────────────

interface ChildMedSummary {
  childId: string;
  childName: string;
  totalDoses: number;
  givenOnTime: number;
  missed: number;
  refused: number;
  late: number;
  compliancePercent: number;
  refusalRate: number;
  mostRefusedMedication?: string;
}

interface MedAlert {
  severity: "critical" | "high" | "medium" | "advisory";
  category: string;
  childId?: string;
  childName?: string;
  title: string;
  description: string;
  action: string;
  regulation?: string;
}

interface PRNInsight {
  medicationName: string;
  childName: string;
  childId: string;
  usageCount: number;
  averageTimeBetween: number;
  trend: "increasing" | "stable" | "decreasing";
  concern?: string;
}

interface ControlledDrugStatus {
  totalAdministrations: number;
  withWitness: number;
  withoutWitness: number;
  witnessCompliancePercent: number;
  balanceChecked: boolean;
}

interface MedPattern {
  type: string;
  description: string;
  significance: "high" | "medium" | "low";
}

interface MedicationData {
  homeId: string;
  analysisDate: string;
  windowDays: number;
  totalAdministrations: number;
  complianceRate: number;
  missedDoses: number;
  refusals: number;
  lateAdministrations: number;
  childSummaries: ChildMedSummary[];
  alerts: MedAlert[];
  prnAnalysis: PRNInsight[];
  controlledDrugAudit: ControlledDrugStatus;
  patterns: MedPattern[];
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

export default function CaraMedicationIntelligence({ homeId = "home_oak", days = 7 }: Props) {
  const [data, setData] = useState<MedicationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/cara/medication-intelligence?homeId=${homeId}&days=${days}`);
      const json = await res.json();
      if (json.ok) setData(json.data);
      else setError(json.error ?? "Failed to load");
    } catch {
      setError("Failed to fetch medication intelligence");
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
          Analysing medication records…
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

  const statusColor = data.regulatoryStatus.compliant
    ? "text-emerald-700 bg-emerald-50 border-emerald-200"
    : data.alerts.some((a) => a.severity === "critical")
      ? "text-red-700 bg-red-50 border-red-200"
      : "text-amber-700 bg-amber-50 border-amber-200";

  const statusIcon = data.regulatoryStatus.compliant
    ? <CheckCircle2 className="h-4 w-4 text-emerald-600" />
    : <AlertTriangle className="h-4 w-4 text-amber-600" />;

  return (
    <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <Pill className="h-4 w-4 text-violet-600" />
          <h3 className="text-sm font-semibold text-gray-900">Medication Intelligence</h3>
          <span className="text-[10px] text-gray-400 ml-1">{data.windowDays}-day window</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={fetchData} aria-label="Refresh">
            <RefreshCw className="h-3.5 w-3.5 text-gray-400" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setExpanded(!expanded)} aria-label={expanded ? "Collapse details" : "Expand details"}>
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      {/* Status banner */}
      <div className={cn("mx-4 mb-3 rounded-lg border px-3 py-2 flex items-center gap-2", statusColor)}>
        {statusIcon}
        <span className="text-xs font-medium">
          {data.regulatoryStatus.compliant
            ? "Medication management compliant"
            : `${data.regulatoryStatus.issues.length} compliance issue${data.regulatoryStatus.issues.length > 1 ? "s" : ""} identified`}
        </span>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-4 gap-2 px-4 pb-3">
        <MetricBox label="Compliance" value={`${data.complianceRate}%`} good={data.complianceRate >= 95} warn={data.complianceRate < 90} />
        <MetricBox label="Missed" value={String(data.missedDoses)} good={data.missedDoses === 0} warn={data.missedDoses > 0} />
        <MetricBox label="Refusals" value={String(data.refusals)} good={data.refusals === 0} warn={data.refusals >= 3} />
        <MetricBox label="Late" value={String(data.lateAdministrations)} good={data.lateAdministrations === 0} warn={data.lateAdministrations > 2} />
      </div>

      {/* Controlled Drug Audit (always visible) */}
      <div className="mx-4 mb-3 rounded-lg bg-gray-50 px-3 py-2">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="h-3.5 w-3.5 text-indigo-600" />
          <span className="text-xs font-medium text-gray-700">Controlled Drug Audit</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-600">
          <span>{data.controlledDrugAudit.totalAdministrations} administered</span>
          <span className="text-gray-300">|</span>
          <span className={cn(
            data.controlledDrugAudit.witnessCompliancePercent === 100 ? "text-emerald-700" : "text-red-700"
          )}>
            <Eye className="h-3 w-3 inline mr-0.5" />
            {data.controlledDrugAudit.witnessCompliancePercent}% witnessed
          </span>
          {data.controlledDrugAudit.withoutWitness > 0 && (
            <span className="text-red-600 font-medium">
              ({data.controlledDrugAudit.withoutWitness} unwitnessed)
            </span>
          )}
        </div>
      </div>

      {/* Alerts */}
      {data.alerts.length > 0 && (
        <div className="mx-4 mb-3 space-y-1.5">
          {data.alerts.slice(0, expanded ? undefined : 2).map((alert, i) => (
            <AlertRow key={i} alert={alert} />
          ))}
          {!expanded && data.alerts.length > 2 && (
            <p className="text-[10px] text-gray-400 pl-1">+{data.alerts.length - 2} more alerts</p>
          )}
        </div>
      )}

      {/* Expanded content */}
      {expanded && (
        <div className="border-t px-4 pt-3 pb-4 space-y-4">
          {/* Child summaries */}
          <div>
            <h4 className="text-xs font-semibold text-gray-700 mb-2">Per-Child Summary</h4>
            <div className="space-y-2">
              {data.childSummaries.map((child) => (
                <div key={child.childId} className="rounded-lg bg-gray-50 px-3 py-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-800">{child.childName}</span>
                    <span className={cn("text-xs font-semibold", child.compliancePercent >= 95 ? "text-emerald-700" : child.compliancePercent < 80 ? "text-red-700" : "text-amber-700")}>
                      {child.compliancePercent}%
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-500">
                    <span>{child.totalDoses} doses</span>
                    {child.missed > 0 && <span className="text-red-600">{child.missed} missed</span>}
                    {child.refused > 0 && <span className="text-amber-600">{child.refused} refused</span>}
                    {child.late > 0 && <span className="text-orange-600">{child.late} late</span>}
                    {child.mostRefusedMedication && (
                      <span className="text-gray-400">Most refused: {child.mostRefusedMedication}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* PRN insights */}
          {data.prnAnalysis.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-700 mb-2">PRN Usage</h4>
              <div className="space-y-1.5">
                {data.prnAnalysis.map((prn, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                    <div>
                      <span className="text-xs font-medium text-gray-800">{prn.medicationName}</span>
                      <span className="text-[10px] text-gray-500 ml-1">({prn.childName})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-500">{prn.usageCount}x in {data.windowDays}d</span>
                      <TrendBadge trend={prn.trend} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Patterns */}
          {data.patterns.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-700 mb-2">Patterns Detected</h4>
              <div className="space-y-1">
                {data.patterns.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
                    <span className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      p.significance === "high" ? "bg-red-500" : p.significance === "medium" ? "bg-amber-500" : "bg-gray-400"
                    )} />
                    {p.description}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Regulatory strengths */}
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

function AlertRow({ alert }: { alert: MedAlert }) {
  const colors = {
    critical: "border-red-200 bg-red-50 text-red-800",
    high: "border-amber-200 bg-amber-50 text-amber-800",
    medium: "border-yellow-100 bg-yellow-50 text-yellow-800",
    advisory: "border-gray-200 bg-gray-50 text-gray-700",
  };

  return (
    <div className={cn("rounded-lg border px-3 py-2", colors[alert.severity])}>
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
  if (trend === "increasing") {
    return (
      <span className="flex items-center gap-0.5 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-700">
        <TrendingUp className="h-2.5 w-2.5" /> Rising
      </span>
    );
  }
  if (trend === "decreasing") {
    return (
      <span className="flex items-center gap-0.5 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
        <Clock className="h-2.5 w-2.5" /> Falling
      </span>
    );
  }
  return (
    <span className="flex items-center gap-0.5 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">
      Stable
    </span>
  );
}

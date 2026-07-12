"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CaraStaffingAdequacy
//
// Dashboard widget showing staffing adequacy analysis.
// Surfaces shift coverage, qualification gaps, lone working risks,
// and regulatory compliance for the RM.
// ════════════════════════════════════════════════��═════════════════════════════

import React, { useEffect, useState } from "react";
import {
  Loader2, Users, AlertTriangle, CheckCircle2, Clock,
  ChevronDown, ChevronUp, RefreshCw, Shield, XCircle,
  UserX, Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ── Types ────���───────────────────────────────────────────────────────────────

interface ShiftAssessment {
  date: string;
  shiftType: string;
  required: number;
  assigned: number;
  confirmed: number;
  status: "adequate" | "marginal" | "under_staffed" | "unfilled";
  hasSenior: boolean;
  hasFirstAid: boolean;
  hasMedTrained: boolean;
  issues: string[];
}

interface StaffingGap {
  date: string;
  shiftType: string;
  gapType: string;
  description: string;
  severity: "critical" | "high" | "medium";
}

interface StaffingAlert {
  severity: "critical" | "high" | "medium" | "advisory";
  category: string;
  title: string;
  description: string;
  action: string;
  regulation?: string;
}

interface QualificationCoverage {
  qualification: string;
  label: string;
  totalStaffWithQual: number;
  shiftsWithoutCoverage: number;
  coveragePercent: number;
}

interface DayPattern {
  dayOfWeek: string;
  averageStaff: number;
  shortfallCount: number;
  status: string;
}

interface StaffingData {
  homeId: string;
  analysisDate: string;
  windowDays: number;
  overallStatus: "adequate" | "concerns" | "inadequate";
  overallScore: number;
  shiftAssessments: ShiftAssessment[];
  gaps: StaffingGap[];
  qualificationCoverage: QualificationCoverage[];
  alerts: StaffingAlert[];
  weeklyPattern: DayPattern[];
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

export default function CaraStaffingAdequacy({ homeId = "home_oak", days = 7 }: Props) {
  const [data, setData] = useState<StaffingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/cara/staffing-adequacy?homeId=${homeId}&days=${days}`);
      const json = await res.json();
      if (json.ok) setData(json.data);
      else setError(json.error ?? "Failed to load");
    } catch {
      setError("Failed to fetch staffing analysis");
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
          Analysing staffing levels…
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

  const statusColor = data.overallStatus === "adequate"
    ? "text-emerald-700 bg-emerald-50 border-emerald-200"
    : data.overallStatus === "inadequate"
      ? "text-red-700 bg-red-50 border-red-200"
      : "text-amber-700 bg-amber-50 border-amber-200";

  const statusIcon = data.overallStatus === "adequate"
    ? <CheckCircle2 className="h-4 w-4 text-emerald-600" />
    : data.overallStatus === "inadequate"
      ? <XCircle className="h-4 w-4 text-red-600" />
      : <AlertTriangle className="h-4 w-4 text-amber-600" />;

  const adequateShifts = data.shiftAssessments.filter((a) => a.status === "adequate").length;
  const totalShifts = data.shiftAssessments.length;

  return (
    <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-blue-600" />
          <h3 className="text-sm font-semibold text-gray-900">Staffing Adequacy</h3>
          <span className="text-[10px] text-gray-400 ml-1">Next {data.windowDays} days</span>
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
          {data.overallStatus === "adequate"
            ? "Staffing levels adequate"
            : data.overallStatus === "inadequate"
              ? "Staffing critically inadequate"
              : "Staffing concerns identified"}
        </span>
        <span className="ml-auto text-xs opacity-70">{data.overallScore}%</span>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-4 gap-2 px-4 pb-3">
        <MetricBox label="Shifts OK" value={`${adequateShifts}/${totalShifts}`} good={adequateShifts === totalShifts} warn={adequateShifts < totalShifts * 0.7} />
        <MetricBox label="Gaps" value={String(data.gaps.length)} good={data.gaps.length === 0} warn={data.gaps.length > 2} />
        <MetricBox label="Alerts" value={String(data.alerts.length)} good={data.alerts.length === 0} warn={data.alerts.length > 1} />
        <MetricBox label="Score" value={`${data.overallScore}%`} good={data.overallScore >= 80} warn={data.overallScore < 60} />
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

      {/* Expanded */}
      {expanded && (
        <div className="border-t px-4 pt-3 pb-4 space-y-4">
          {/* Shift breakdown */}
          <div>
            <h4 className="text-xs font-semibold text-gray-700 mb-2">Shift Coverage</h4>
            <div className="space-y-1">
              {data.shiftAssessments.map((shift, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-1.5">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3 text-gray-400" />
                    <span className="text-[10px] text-gray-600">{shift.date}</span>
                    <span className="text-[10px] font-medium text-gray-700 capitalize">{shift.shiftType}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-500">{shift.assigned}/{shift.required} staff</span>
                    <StatusDot status={shift.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Qualification coverage */}
          <div>
            <h4 className="text-xs font-semibold text-gray-700 mb-2">Qualification Coverage</h4>
            <div className="space-y-1">
              {data.qualificationCoverage.filter((q) => q.totalStaffWithQual > 0).map((qual) => (
                <div key={qual.qualification} className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">{qual.label}</span>
                  <span className={cn("font-medium", qual.coveragePercent === 100 ? "text-emerald-700" : "text-amber-700")}>
                    {qual.coveragePercent}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly pattern */}
          {data.weeklyPattern.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-700 mb-2">Weekly Pattern</h4>
              <div className="flex gap-1">
                {data.weeklyPattern.map((day) => (
                  <div key={day.dayOfWeek} className="flex-1 text-center">
                    <div className={cn(
                      "rounded py-1 text-[10px] font-medium",
                      day.status === "adequate" ? "bg-emerald-100 text-emerald-700" :
                      day.status === "inadequate" ? "bg-red-100 text-red-700" :
                      "bg-amber-100 text-amber-700"
                    )}>
                      {day.dayOfWeek.slice(0, 3)}
                    </div>
                    <div className="text-[9px] text-gray-500 mt-0.5">{day.averageStaff}avg</div>
                  </div>
                ))}
              </div>
            </div>
          )}

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

function AlertRow({ alert }: { alert: StaffingAlert }) {
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

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    adequate: "bg-emerald-500",
    marginal: "bg-amber-400",
    under_staffed: "bg-red-500",
    unfilled: "bg-gray-400",
  };
  return <span className={cn("h-2 w-2 rounded-full", colors[status] ?? "bg-gray-400")} />;
}

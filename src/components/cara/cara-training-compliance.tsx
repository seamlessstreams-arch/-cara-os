"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CaraTrainingCompliance
//
// Dashboard widget showing training compliance across the team.
// Surfaces expired certs, mandatory gaps, expiry warnings, qualification
// progress, and team coverage.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useState } from "react";
import {
  Loader2, GraduationCap, AlertTriangle, CheckCircle2, Clock,
  ChevronDown, ChevronUp, RefreshCw, XCircle, Award, BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatRate } from "@/lib/metrics/rate";

// ── Types ────────────────────────────────────────────────────────────────────

interface StaffTrainingProfile {
  staffId: string;
  staffName: string;
  role: string;
  compliancePercent: number;
  mandatoryComplete: number;
  mandatoryTotal: number;
  expiredCount: number;
  overdueCount: number;
  bookedCount: number;
  gaps: string[];
}

interface ExpiryWarning {
  staffId: string;
  staffName: string;
  courseName: string;
  expiryDate: string;
  daysUntilExpiry: number;
  severity: "expired" | "imminent" | "upcoming";
}

interface TrainingAlert {
  severity: "critical" | "high" | "medium" | "advisory";
  category: string;
  title: string;
  description: string;
  action: string;
  regulation?: string;
}

interface TeamCoverageItem {
  category: string;
  label: string;
  staffWithTraining: number;
  totalStaff: number;
  coveragePercent: number;
  mandatory: boolean;
}

interface QualOverview {
  l3Required: number;
  l3Completed: number;
  l3InProgress: number;
  l5Required: number;
  l5Completed: number;
  l5InProgress: number;
}

interface TrainingData {
  homeId: string;
  analysisDate: string;
  overallCompliancePercent: number;
  totalStaff: number;
  fullyCompliant: number;
  withGaps: number;
  withExpiredTraining: number;
  staffProfiles: StaffTrainingProfile[];
  teamCoverage: TeamCoverageItem[];
  expiryWarnings: ExpiryWarning[];
  alerts: TrainingAlert[];
  qualificationOverview: QualOverview;
  regulatoryStatus: {
    compliant: boolean;
    issues: string[];
    strengths: string[];
  };
}

// ── Component ───────────────────────────────────────────────────────────────

interface Props {
  homeId?: string;
}

export default function CaraTrainingCompliance({ homeId = "home_oak" }: Props) {
  const [data, setData] = useState<TrainingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/cara/training-compliance?homeId=${homeId}`);
      const json = await res.json();
      if (json.ok) setData(json.data);
      else setError(json.error ?? "Failed to load");
    } catch {
      setError("Failed to fetch training data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [homeId]);

  if (loading) {
    return (
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Analysing training records…
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

  const statusColor = data.regulatoryStatus.compliant === null
    ? "text-gray-600 bg-gray-50 border-gray-200"
    : data.regulatoryStatus.compliant
      ? "text-emerald-700 bg-emerald-50 border-emerald-200"
      : data.withExpiredTraining > 0
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
          <GraduationCap className="h-4 w-4 text-orange-600" />
          <h3 className="text-sm font-semibold text-gray-900">Training Compliance</h3>
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
          {data.regulatoryStatus.compliant === null
            ? "No mandatory training records — compliance not evidenced"
            : data.regulatoryStatus.compliant
              ? `All staff training compliant (${formatRate(data.overallCompliancePercent)})`
              : `Training compliance at ${formatRate(data.overallCompliancePercent)}`}
        </span>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-4 gap-2 px-4 pb-3">
        <MetricBox label="Compliance" value={`${data.overallCompliancePercent}%`} good={data.overallCompliancePercent >= 95} warn={data.overallCompliancePercent < 80} />
        <MetricBox label="Compliant" value={`${data.fullyCompliant}/${data.totalStaff}`} good={data.fullyCompliant === data.totalStaff} warn={data.fullyCompliant < data.totalStaff * 0.5} />
        <MetricBox label="Expired" value={String(data.withExpiredTraining)} good={data.withExpiredTraining === 0} warn={data.withExpiredTraining > 0} />
        <MetricBox label="With Gaps" value={String(data.withGaps)} good={data.withGaps === 0} warn={data.withGaps > 1} />
      </div>

      {/* Expiry warnings (always show top 2) */}
      {data.expiryWarnings.length > 0 && (
        <div className="mx-4 mb-3">
          <div className="text-[10px] text-gray-500 font-medium mb-1">Expiry Warnings</div>
          {data.expiryWarnings.slice(0, expanded ? 6 : 2).map((w, i) => (
            <div key={i} className="flex items-center justify-between text-xs py-0.5">
              <span className="text-gray-700">{w.staffName} — {w.courseName}</span>
              <span className={cn("font-medium", w.severity === "expired" ? "text-red-600" : w.severity === "imminent" ? "text-amber-600" : "text-gray-500")}>
                {w.severity === "expired" ? "EXPIRED" : `${w.daysUntilExpiry}d`}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Alerts */}
      {data.alerts.length > 0 && (
        <div className="mx-4 mb-3 space-y-1.5">
          {data.alerts.slice(0, expanded ? undefined : 1).map((alert, i) => (
            <AlertRow key={i} alert={alert} />
          ))}
          {!expanded && data.alerts.length > 1 && (
            <p className="text-[10px] text-gray-400 pl-1">+{data.alerts.length - 1} more</p>
          )}
        </div>
      )}

      {/* Expanded */}
      {expanded && (
        <div className="border-t px-4 pt-3 pb-4 space-y-4">
          {/* Staff profiles */}
          <div>
            <h4 className="text-xs font-semibold text-gray-700 mb-2">Staff Training Status</h4>
            <div className="space-y-1.5">
              {data.staffProfiles.map((staff) => (
                <div key={staff.staffId} className="rounded-lg bg-gray-50 px-3 py-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-800">{staff.staffName}</span>
                      <span className="text-[10px] text-gray-400 capitalize">{staff.role.replace("_", " ")}</span>
                    </div>
                    <span className={cn("text-xs font-bold", staff.compliancePercent === 100 ? "text-emerald-700" : staff.compliancePercent < 70 ? "text-red-700" : "text-amber-700")}>
                      {staff.compliancePercent}%
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-500">
                    <span>{staff.mandatoryComplete}/{staff.mandatoryTotal} mandatory</span>
                    {staff.expiredCount > 0 && <span className="text-red-600">{staff.expiredCount} expired</span>}
                    {staff.bookedCount > 0 && <span className="text-blue-600">{staff.bookedCount} booked</span>}
                    {(staff.gaps?.length ?? 0) > 0 && <span className="text-amber-600">Needs: {(staff.gaps ?? []).slice(0, 2).join(", ")}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Qualifications */}
          <div>
            <h4 className="text-xs font-semibold text-gray-700 mb-2">Qualifications</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-gray-50 px-3 py-2">
                <div className="flex items-center gap-1.5 mb-1">
                  <Award className="h-3 w-3 text-blue-600" />
                  <span className="text-[10px] font-medium text-gray-700">Level 3</span>
                </div>
                <div className="text-xs text-gray-600">
                  {data.qualificationOverview.l3Completed}/{data.qualificationOverview.l3Required} complete
                  {data.qualificationOverview.l3InProgress > 0 && <span className="text-blue-600 ml-1">({data.qualificationOverview.l3InProgress} in progress)</span>}
                </div>
              </div>
              <div className="rounded-lg bg-gray-50 px-3 py-2">
                <div className="flex items-center gap-1.5 mb-1">
                  <Award className="h-3 w-3 text-purple-600" />
                  <span className="text-[10px] font-medium text-gray-700">Level 5</span>
                </div>
                <div className="text-xs text-gray-600">
                  {data.qualificationOverview.l5Completed}/{data.qualificationOverview.l5Required} complete
                  {data.qualificationOverview.l5InProgress > 0 && <span className="text-blue-600 ml-1">({data.qualificationOverview.l5InProgress} in progress)</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Team coverage */}
          <div>
            <h4 className="text-xs font-semibold text-gray-700 mb-2">Team Coverage</h4>
            <div className="space-y-1">
              {data.teamCoverage.filter((c) => c.mandatory).map((cov) => (
                <div key={cov.category} className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">{cov.label}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                      <div className={cn("h-full rounded-full", cov.coveragePercent === 100 ? "bg-emerald-500" : cov.coveragePercent >= 80 ? "bg-amber-400" : "bg-red-400")} style={{ width: `${cov.coveragePercent}%` }} />
                    </div>
                    <span className={cn("font-medium w-8 text-right", cov.coveragePercent === 100 ? "text-emerald-700" : "text-amber-700")}>
                      {cov.coveragePercent}%
                    </span>
                  </div>
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

function AlertRow({ alert }: { alert: TrainingAlert }) {
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

"use client";

import React, { useEffect, useState } from "react";
import type {
  WorkforceMetrics,
  TrainingComplianceResult,
  SupervisionComplianceResult,
  TrainingGap,
  TrainingCategory,
} from "@/lib/hr-files/workforce-engine";
import { formatTrainingName } from "@/lib/hr-files/workforce-engine";

// ── Types ───────────────────────────────────────────────────────────────────

interface HrFilesData {
  metrics: WorkforceMetrics;
  trainingCompliance: TrainingComplianceResult[];
  supervisionCompliance: SupervisionComplianceResult[];
  trainingGaps: TrainingGap[];
}

// ── Metric Card ─────────────────────────────────────────────────────────────

function MetricCard({ label, value, suffix, color }: { label: string; value: number | string; suffix?: string; color?: string }) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
      <span className={`text-2xl font-bold ${color ?? "text-gray-900"}`}>
        {value}{suffix}
      </span>
      <span className="mt-1 text-xs text-gray-500 text-center">{label}</span>
    </div>
  );
}

// ── Progress Bar ────────────────────────────────────────────────────────────

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pctVal = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pctVal}%` }} />
      </div>
      <span className="text-xs font-medium text-gray-600 w-10 text-right">{pctVal}%</span>
    </div>
  );
}

// ── Urgency Badge ───────────────────────────────────────────────────────────

function UrgencyBadge({ urgency }: { urgency: string }) {
  const map: Record<string, string> = {
    critical: "bg-red-100 text-red-700 border-red-200",
    high: "bg-orange-100 text-orange-700 border-orange-200",
    medium: "bg-amber-100 text-amber-700 border-amber-200",
    low: "bg-blue-100 text-blue-700 border-blue-200",
  };
  return (
    <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold uppercase ${map[urgency] ?? "bg-gray-100 text-gray-700"}`}>
      {urgency}
    </span>
  );
}

// ── Compliance Badge ────────────────────────────────────────────────────────

function ComplianceBadge({ compliant }: { compliant: boolean }) {
  return compliant ? (
    <span className="rounded-full bg-green-100 text-green-700 border border-green-200 px-2 py-0.5 text-xs font-semibold">
      COMPLIANT
    </span>
  ) : (
    <span className="rounded-full bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 text-xs font-semibold">
      NON-COMPLIANT
    </span>
  );
}

// ── Main Widget ─────────────────────────────────────────────────────────────

export function HrFilesDashboardWidget() {
  const [data, setData] = useState<HrFilesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/hr-files")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse rounded-xl border border-gray-200 bg-white p-6">
        <div className="h-6 w-48 rounded bg-gray-200 mb-4" />
        <div className="grid grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 rounded-lg bg-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <h3 className="font-semibold text-red-800">HR Files & Workforce Compliance</h3>
        <p className="mt-2 text-sm text-red-600">Failed to load: {error}</p>
      </div>
    );
  }

  const { metrics, trainingCompliance, supervisionCompliance, trainingGaps } = data;

  const toggle = (section: string) =>
    setExpandedSection((prev) => (prev === section ? null : section));

  const metricColor = (value: number, goodThreshold: number, warnThreshold: number, invert = false) => {
    if (invert) {
      return value <= goodThreshold ? "text-green-600" : value <= warnThreshold ? "text-amber-600" : "text-red-600";
    }
    return value >= goodThreshold ? "text-green-600" : value >= warnThreshold ? "text-amber-600" : "text-red-600";
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-lg font-bold text-gray-900">
            HR Files & Workforce Compliance
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            CHR 2015 Reg 32/33 -- Fitness of workers & Employment of staff
          </p>
        </div>
        <span
          className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold ${
            metrics.trainingComplianceRate >= 90 && metrics.supervisionComplianceRate >= 80
              ? "bg-green-100 text-green-800 border-green-300"
              : metrics.trainingComplianceRate >= 70
                ? "bg-amber-100 text-amber-800 border-amber-300"
                : "bg-red-100 text-red-800 border-red-300"
          }`}
        >
          {metrics.trainingComplianceRate >= 90 && metrics.supervisionComplianceRate >= 80
            ? "Good"
            : metrics.trainingComplianceRate >= 70
              ? "Requires Improvement"
              : "Inadequate"}
        </span>
      </div>

      {/* Primary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <MetricCard
          label="Total Staff"
          value={metrics.totalStaff}
        />
        <MetricCard
          label="FTE"
          value={metrics.fullTimeEquivalent}
        />
        <MetricCard
          label="Vacancy Rate"
          value={metrics.vacancyRate}
          suffix="%"
          color={metricColor(metrics.vacancyRate, 10, 20, true)}
        />
        <MetricCard
          label="Turnover Rate"
          value={metrics.turnoverRate}
          suffix="%"
          color={metricColor(metrics.turnoverRate, 15, 25, true)}
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <MetricCard
          label="Sickness Rate"
          value={metrics.sicknessRate}
          suffix="%"
          color={metricColor(metrics.sicknessRate, 3, 5, true)}
        />
        <MetricCard
          label="Agency Usage"
          value={metrics.agencyUsage}
          suffix="%"
          color={metricColor(metrics.agencyUsage, 10, 20, true)}
        />
        <MetricCard
          label="Training Compliance"
          value={metrics.trainingComplianceRate}
          suffix="%"
          color={metricColor(metrics.trainingComplianceRate, 90, 75)}
        />
        <MetricCard
          label="Supervision Compliance"
          value={metrics.supervisionComplianceRate}
          suffix="%"
          color={metricColor(metrics.supervisionComplianceRate, 90, 75)}
        />
      </div>

      {/* Status Badges */}
      <div className="flex flex-wrap gap-2 mb-5">
        {metrics.staffWithExpiredTraining > 0 && (
          <span className="rounded-full bg-red-100 text-red-700 px-3 py-1 text-xs font-medium border border-red-200">
            {metrics.staffWithExpiredTraining} STAFF WITH EXPIRED TRAINING
          </span>
        )}
        {metrics.staffOverdueSupervision > 0 && (
          <span className="rounded-full bg-amber-100 text-amber-700 px-3 py-1 text-xs font-medium border border-amber-200">
            {metrics.staffOverdueSupervision} OVERDUE SUPERVISION
          </span>
        )}
        {metrics.agencyUsage > 0 && (
          <span className="rounded-full bg-blue-100 text-blue-700 px-3 py-1 text-xs font-medium border border-blue-200">
            {metrics.agencyUsage}% AGENCY RELIANCE
          </span>
        )}
        {metrics.vacancyRate > 0 && (
          <span className="rounded-full bg-orange-100 text-orange-700 px-3 py-1 text-xs font-medium border border-orange-200">
            {metrics.vacancyRate}% VACANCY RATE
          </span>
        )}
        {metrics.trainingComplianceRate === 100 && metrics.supervisionComplianceRate === 100 && (
          <span className="rounded-full bg-green-100 text-green-700 px-3 py-1 text-xs font-medium border border-green-200">
            FULLY COMPLIANT
          </span>
        )}
      </div>

      {/* Training Compliance per Staff */}
      <div className="mb-5">
        <button
          onClick={() => toggle("training")}
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
        >
          <span className={`transform transition-transform ${expandedSection === "training" ? "rotate-90" : ""}`}>&#9654;</span>
          Training Compliance by Staff ({trainingCompliance.length})
        </button>
        {expandedSection === "training" && (
          <div className="mt-3 space-y-3">
            {trainingCompliance.map((tc) => (
              <div key={tc.staffId} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">{tc.staffName}</h4>
                    <span className="text-xs text-gray-500">
                      {tc.mandatoryComplete}/{tc.mandatoryTotal} mandatory complete
                    </span>
                  </div>
                  <ComplianceBadge compliant={tc.overallCompliant} />
                </div>
                <div className="mb-2">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Completion Rate</span>
                    <span>{tc.completionRate}%</span>
                  </div>
                  <ProgressBar
                    value={tc.completionRate}
                    max={100}
                    color={tc.overallCompliant ? "bg-green-500" : "bg-amber-500"}
                  />
                </div>
                {tc.expired.length > 0 && (
                  <div className="mt-2">
                    <span className="text-xs font-medium text-red-600">Expired: </span>
                    <span className="text-xs text-red-600">
                      {tc.expired.map((c) => formatTrainingName(c)).join(", ")}
                    </span>
                  </div>
                )}
                {tc.missing.length > 0 && (
                  <div className="mt-1">
                    <span className="text-xs font-medium text-amber-600">Missing: </span>
                    <span className="text-xs text-amber-600">
                      {tc.missing.map((c) => formatTrainingName(c)).join(", ")}
                    </span>
                  </div>
                )}
                {tc.expiringSoon.length > 0 && (
                  <div className="mt-1">
                    <span className="text-xs font-medium text-orange-600">Expiring Soon: </span>
                    <span className="text-xs text-orange-600">
                      {tc.expiringSoon.map((c) => formatTrainingName(c)).join(", ")}
                    </span>
                  </div>
                )}
                {tc.nextActions.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <span className="text-xs font-medium text-gray-600">Next Actions:</span>
                    <ul className="mt-1 space-y-0.5">
                      {tc.nextActions.map((action, i) => (
                        <li key={i} className="text-xs text-gray-500">&#8226; {action}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Supervision Compliance per Staff */}
      <div className="mb-5">
        <button
          onClick={() => toggle("supervision")}
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
        >
          <span className={`transform transition-transform ${expandedSection === "supervision" ? "rotate-90" : ""}`}>&#9654;</span>
          Supervision Compliance by Staff ({supervisionCompliance.length})
        </button>
        {expandedSection === "supervision" && (
          <div className="mt-3 space-y-3">
            {supervisionCompliance.map((sc) => (
              <div key={sc.staffId} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">{sc.staffName}</h4>
                  <ComplianceBadge compliant={sc.isCompliant} />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div>
                    <span className="text-lg font-bold text-gray-900">
                      {sc.daysSinceLastSupervision ?? "--"}
                    </span>
                    <p className="text-xs text-gray-500">Days Since Last</p>
                  </div>
                  <div>
                    <span className="text-lg font-bold text-gray-900">{sc.supervisionsInPeriod}</span>
                    <p className="text-xs text-gray-500">In Last 3 Months</p>
                  </div>
                  <div>
                    <span className={`text-lg font-bold ${
                      sc.frequency === "monthly" ? "text-green-600" : sc.frequency === "less_than_monthly" ? "text-amber-600" : "text-red-600"
                    }`}>
                      {sc.frequency === "monthly" ? "Monthly" : sc.frequency === "less_than_monthly" ? "Below Monthly" : "None"}
                    </span>
                    <p className="text-xs text-gray-500">Frequency</p>
                  </div>
                  <div>
                    <span className={`text-lg font-bold ${sc.actionPointsOutstanding > 0 ? "text-amber-600" : "text-green-600"}`}>
                      {sc.actionPointsOutstanding}
                    </span>
                    <p className="text-xs text-gray-500">Actions Outstanding</p>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-500">
                  Next due: {new Date(sc.nextDue).toLocaleDateString("en-GB")}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Training Gaps */}
      {trainingGaps.length > 0 && (
        <div className="mb-5">
          <button
            onClick={() => toggle("gaps")}
            className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
          >
            <span className={`transform transition-transform ${expandedSection === "gaps" ? "rotate-90" : ""}`}>&#9654;</span>
            Training Gaps ({trainingGaps.length})
          </button>
          {expandedSection === "gaps" && (
            <div className="mt-3 space-y-3">
              {trainingGaps.map((gap, i) => (
                <div key={i} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">{formatTrainingName(gap.category)}</h4>
                    <UrgencyBadge urgency={gap.urgency} />
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{gap.recommendation}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      {gap.staffAffected} staff affected:
                    </span>
                    <span className="text-xs text-gray-700 font-medium">
                      {gap.staffNames.join(", ")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Workforce Analytics */}
      <div className="mb-2">
        <button
          onClick={() => toggle("analytics")}
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
        >
          <span className={`transform transition-transform ${expandedSection === "analytics" ? "rotate-90" : ""}`}>&#9654;</span>
          Workforce Analytics
        </button>
        {expandedSection === "analytics" && (
          <div className="mt-3 rounded-lg border border-gray-200 bg-white p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="text-center">
                <span className="text-2xl font-bold text-gray-900">{metrics.averageTenure}</span>
                <p className="text-xs text-gray-500 mt-1">Avg Tenure (months)</p>
              </div>
              <div className="text-center">
                <span className={`text-2xl font-bold ${metricColor(metrics.qualificationRate, 90, 75)}`}>
                  {metrics.qualificationRate}%
                </span>
                <p className="text-xs text-gray-500 mt-1">Qualification Rate</p>
              </div>
              <div className="text-center">
                <span className={`text-2xl font-bold ${metricColor(metrics.probationPassRate, 90, 70)}`}>
                  {metrics.probationPassRate}%
                </span>
                <p className="text-xs text-gray-500 mt-1">Probation Pass Rate</p>
              </div>
              <div className="text-center">
                <span className="text-2xl font-bold text-gray-900">{metrics.totalStaff}</span>
                <p className="text-xs text-gray-500 mt-1">Headcount</p>
              </div>
              <div className="text-center">
                <span className="text-2xl font-bold text-gray-900">{metrics.fullTimeEquivalent}</span>
                <p className="text-xs text-gray-500 mt-1">FTE</p>
              </div>
              <div className="text-center">
                <span className={`text-2xl font-bold ${metricColor(metrics.staffWithExpiredTraining, 0, 2, true)}`}>
                  {metrics.staffWithExpiredTraining}
                </span>
                <p className="text-xs text-gray-500 mt-1">Expired Training</p>
              </div>
            </div>

            {/* Regulatory reference */}
            <div className="mt-4 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-400">
                CHR 2015 Reg 33: Sufficient, suitably qualified staff at all times.
                Reg 32: Fitness of workers -- training, supervision, appraisal.
                Reg 13: Leadership & management competence.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

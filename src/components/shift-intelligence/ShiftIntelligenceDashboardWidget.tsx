"use client";

// ══════════════════════════════════════════════════════════════════════════════
// SHIFT INTELLIGENCE DASHBOARD WIDGET
//
// Displays deployment intelligence including:
// - Overall compliance score and rating
// - Shift coverage breakdown
// - Fatigue risk assessment per staff member
// - Key Worker availability compliance
// - Immediate actions required
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";

interface FatigueAssessment {
  staffId: string;
  staffName: string;
  riskLevel: "low" | "moderate" | "high" | "critical";
  totalHoursThisWeek: number;
  consecutiveDaysWorked: number;
  shortestRestGapHours: number;
  breachesIdentified: string[];
  recommendation: string;
}

interface KeyWorkerAvailability {
  childId: string;
  childName: string;
  keyWorkerId: string;
  keyWorkerName: string;
  daysOnShiftTogether: number;
  requiredDays: number;
  gapDays: number;
  isCompliant: boolean;
  concern?: string;
}

interface Concern {
  concern: string;
  count: number;
  severity: "low" | "medium" | "high";
}

interface DeploymentData {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  complianceRating: string;
  totalShiftsAnalysed: number;
  coveredShifts: number;
  uncoveredShifts: number;
  coveragePercentage: number;
  averageStaffPerShift: number;
  agencyUsagePercentage: number;
  seniorCoveragePercentage: number;
  fatigueAssessments: FatigueAssessment[];
  staffAtHighFatigueRisk: number;
  keyWorkerAvailability: KeyWorkerAvailability[];
  keyWorkerComplianceRate: number;
  concerns: Concern[];
  immediateActions: string[];
  regulatoryLinks: string[];
}

// ── Score Badge ────────────────────────────────────────────────────────────

function ScoreBadge({ score, rating }: { score: number; rating: string }) {
  const colorClass =
    score >= 85
      ? "bg-green-100 text-green-800 border-green-300"
      : score >= 70
        ? "bg-yellow-100 text-yellow-800 border-yellow-300"
        : score >= 50
          ? "bg-orange-100 text-orange-800 border-orange-300"
          : "bg-red-100 text-red-800 border-red-300";

  const ratingLabel =
    rating === "compliant"
      ? "Compliant"
      : rating === "minor_concerns"
        ? "Minor Concerns"
        : rating === "significant_concerns"
          ? "Significant Concerns"
          : "Non-Compliant";

  return (
    <div className={`rounded-lg border px-4 py-3 text-center ${colorClass}`}>
      <div className="text-3xl font-bold">{score}</div>
      <div className="text-sm font-medium mt-1">{ratingLabel}</div>
    </div>
  );
}

// ── Metric Card ────────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  suffix,
  status,
}: {
  label: string;
  value: number | string;
  suffix?: string;
  status: "good" | "warning" | "critical";
}) {
  const statusColor =
    status === "good"
      ? "text-green-700"
      : status === "warning"
        ? "text-yellow-700"
        : "text-red-700";

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3">
      <div className="text-xs text-gray-500 uppercase tracking-wide">{label}</div>
      <div className={`text-xl font-bold mt-1 ${statusColor}`}>
        {value}
        {suffix && <span className="text-sm font-normal ml-0.5">{suffix}</span>}
      </div>
    </div>
  );
}

// ── Fatigue Risk Row ───────────────────────────────────────────────────────

function FatigueRow({ assessment }: { assessment: FatigueAssessment }) {
  const riskColors = {
    low: "bg-green-100 text-green-700",
    moderate: "bg-yellow-100 text-yellow-700",
    high: "bg-orange-100 text-orange-700",
    critical: "bg-red-100 text-red-700",
  };

  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <div className="flex-1">
        <span className="font-medium text-sm">{assessment.staffName}</span>
        <span className="text-xs text-gray-500 ml-2">
          {assessment.totalHoursThisWeek}hrs / {assessment.consecutiveDaysWorked} days
        </span>
      </div>
      <span
        className={`text-xs font-medium px-2 py-0.5 rounded ${riskColors[assessment.riskLevel]}`}
      >
        {assessment.riskLevel === "low"
          ? "Low"
          : assessment.riskLevel === "moderate"
            ? "Moderate"
            : assessment.riskLevel === "high"
              ? "High"
              : "Critical"}
      </span>
    </div>
  );
}

// ── Key Worker Row ─────────────────────────────────────────────────────────

function KeyWorkerRow({ kw }: { kw: KeyWorkerAvailability }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <div className="flex-1">
        <span className="font-medium text-sm">{kw.childName}</span>
        <span className="text-xs text-gray-500 ml-2">
          KW: {kw.keyWorkerName} ({kw.daysOnShiftTogether}/{kw.requiredDays} days)
        </span>
      </div>
      <span
        className={`text-xs font-medium px-2 py-0.5 rounded ${
          kw.isCompliant ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
        }`}
      >
        {kw.isCompliant ? "Met" : `${kw.gapDays} day gap`}
      </span>
    </div>
  );
}

// ── Main Widget ────────────────────────────────────────────────────────────

export function ShiftIntelligenceDashboardWidget() {
  const [data, setData] = useState<DeploymentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/shift-intelligence");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setData(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="h-20 bg-gray-100 rounded" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white border border-red-200 rounded-xl p-6">
        <h3 className="font-semibold text-red-800">Shift Intelligence</h3>
        <p className="text-sm text-red-600 mt-1">{error ?? "No data available"}</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900 text-lg">
            Shift Pattern Intelligence
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {data.periodStart} to {data.periodEnd} | {data.totalShiftsAnalysed} shifts analysed
          </p>
        </div>
        <ScoreBadge score={data.overallScore} rating={data.complianceRating} />
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <MetricCard
          label="Coverage"
          value={data.coveragePercentage}
          suffix="%"
          status={data.coveragePercentage >= 95 ? "good" : data.coveragePercentage >= 80 ? "warning" : "critical"}
        />
        <MetricCard
          label="Avg Staff/Shift"
          value={data.averageStaffPerShift}
          status={data.averageStaffPerShift >= 2 ? "good" : "warning"}
        />
        <MetricCard
          label="Agency Usage"
          value={data.agencyUsagePercentage}
          suffix="%"
          status={data.agencyUsagePercentage <= 20 ? "good" : data.agencyUsagePercentage <= 30 ? "warning" : "critical"}
        />
        <MetricCard
          label="Senior Cover"
          value={data.seniorCoveragePercentage}
          suffix="%"
          status={data.seniorCoveragePercentage >= 90 ? "good" : data.seniorCoveragePercentage >= 70 ? "warning" : "critical"}
        />
      </div>

      {/* Immediate Actions */}
      {data.immediateActions.length > 0 && data.immediateActions[0] !== "No immediate actions required. Staffing deployment is within acceptable parameters." && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
          <h4 className="text-sm font-semibold text-amber-800 mb-2">Actions Required</h4>
          <ul className="space-y-1">
            {data.immediateActions.slice(0, 3).map((action, i) => (
              <li key={i} className="text-xs text-amber-700 flex items-start gap-1.5">
                <span className="mt-0.5 shrink-0">
                  {action.startsWith("IMMEDIATE") || action.startsWith("URGENT")
                    ? "🔴"
                    : action.startsWith("HIGH")
                      ? "🟠"
                      : "🟡"}
                </span>
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Expandable Details */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-sm text-blue-600 hover:text-blue-800 font-medium w-full text-left"
      >
        {expanded ? "Hide details ▲" : "Show details ▼"}
      </button>

      {expanded && (
        <div className="mt-4 space-y-4">
          {/* Fatigue Risk */}
          <div>
            <h4 className="text-sm font-semibold text-gray-800 mb-2">
              Staff Fatigue Risk ({data.staffAtHighFatigueRisk} at elevated risk)
            </h4>
            <div className="bg-gray-50 rounded-lg p-3">
              {data.fatigueAssessments.map((fa) => (
                <FatigueRow key={fa.staffId} assessment={fa} />
              ))}
            </div>
          </div>

          {/* Key Worker Availability */}
          <div>
            <h4 className="text-sm font-semibold text-gray-800 mb-2">
              Key Worker Contact ({data.keyWorkerComplianceRate}% compliance)
            </h4>
            <div className="bg-gray-50 rounded-lg p-3">
              {data.keyWorkerAvailability.map((kw) => (
                <KeyWorkerRow key={kw.childId} kw={kw} />
              ))}
            </div>
          </div>

          {/* Concerns */}
          {data.concerns.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-800 mb-2">Deployment Concerns</h4>
              <div className="flex flex-wrap gap-2">
                {data.concerns.map((c) => (
                  <span
                    key={c.concern}
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      c.severity === "high"
                        ? "bg-red-100 text-red-700"
                        : c.severity === "medium"
                          ? "bg-orange-100 text-orange-700"
                          : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {c.concern.replace(/_/g, " ")} ({c.count})
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Regulatory Links */}
          {data.regulatoryLinks.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-800 mb-2">Regulatory References</h4>
              <ul className="space-y-1">
                {data.regulatoryLinks.map((link, i) => (
                  <li key={i} className="text-xs text-gray-600">
                    {link}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

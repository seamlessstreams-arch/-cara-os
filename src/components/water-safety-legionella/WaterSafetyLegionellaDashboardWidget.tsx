"use client";

// ==============================================================================
// WATER SAFETY & LEGIONELLA DASHBOARD WIDGET
//
// Displays water safety intelligence for a children's home:
// - Overall score with Ofsted-aligned rating
// - Key metrics: temperature compliance, legionella management, policy, training
// - Location profiles with per-location scores
// - Expandable sections for detailed analysis
// - Priority actions and regulatory framework references
// ==============================================================================

import { useState, useEffect } from "react";
import { formatRate } from "@/lib/metrics/rate";

// -- Local Type Definitions ----------------------------------------------------

interface TemperatureComplianceResult {
  totalChecks: number;
  passCount: number;
  passRate: number;
  withinSafeRangeCount: number;
  withinSafeRangeRate: number;
  issueCount: number;
  correctiveActionCount: number;
  correctiveActionRate: number;
  sourceTypeCoverage: number;
  bySourceType: Record<string, number>;
  byOutcome: Record<string, number>;
  score: number;
}

interface LegionellaManagementResult {
  totalAssessments: number;
  lowRiskCount: number;
  lowRiskRate: number;
  flushingScheduleCount: number;
  flushingScheduleRate: number;
  waterTreatmentCount: number;
  waterTreatmentRate: number;
  deadLegsIdentifiedCount: number;
  deadLegsRemovedCount: number;
  deadLegsManagementRate: number;
  byRiskLevel: Record<string, number>;
  score: number;
}

interface WaterSafetyPolicyResult {
  totalPolicies: number;
  policyCurrentCount: number;
  temperatureScheduleCount: number;
  legionellaPlanCount: number;
  scaldingPreventionCount: number;
  bathSupervisionCount: number;
  emergencyProceduresCount: number;
  recordKeepingCount: number;
  score: number;
}

interface StaffWaterReadinessResult {
  totalStaff: number;
  legionellaAwarenessCount: number;
  legionellaAwarenessRate: number;
  temperatureMonitoringCount: number;
  temperatureMonitoringRate: number;
  scaldingPreventionCount: number;
  scaldingPreventionRate: number;
  bathSupervisionCount: number;
  bathSupervisionRate: number;
  emergencyResponseCount: number;
  emergencyResponseRate: number;
  recordKeepingCount: number;
  recordKeepingRate: number;
  score: number;
}

interface WaterSafetyLocationProfile {
  location: string;
  checkCount: number;
  passRate: number;
  withinSafeRangeRate: number;
  averageTemperature: number;
  assessmentCount: number;
  latestRiskLevel: string | null;
  score: number;
}

interface WaterSafetyData {
  homeId: string;
  assessedAt: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: string;
  temperatureCompliance: TemperatureComplianceResult;
  legionellaManagement: LegionellaManagementResult;
  waterSafetyPolicy: WaterSafetyPolicyResult;
  staffWaterReadiness: StaffWaterReadinessResult;
  locationProfiles: WaterSafetyLocationProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// -- Rating Badge --------------------------------------------------------------

function RatingBadge({ score, rating }: { score: number; rating: string }) {
  const colorClass =
    rating === "outstanding"
      ? "bg-green-100 text-green-800 border-green-300"
      : rating === "good"
        ? "bg-blue-100 text-blue-800 border-blue-300"
        : rating === "requires_improvement"
          ? "bg-orange-100 text-orange-800 border-orange-300"
          : "bg-red-100 text-red-800 border-red-300";

  const label =
    rating === "outstanding"
      ? "Outstanding"
      : rating === "good"
        ? "Good"
        : rating === "requires_improvement"
          ? "Requires Improvement"
          : "Inadequate";

  return (
    <div className={`rounded-lg border px-4 py-3 text-center ${colorClass}`}>
      <div className="text-3xl font-bold">{score}</div>
      <div className="text-sm font-medium mt-1">{label}</div>
    </div>
  );
}

// -- Metric Card ---------------------------------------------------------------

function MetricCard({
  label,
  value,
  suffix,
}: {
  label: string;
  value: number | string;
  suffix?: string;
}) {
  const numValue = typeof value === "number" ? value : parseInt(value, 10);
  const color =
    numValue >= 80
      ? "text-green-700 bg-green-50"
      : numValue >= 60
        ? "text-blue-700 bg-blue-50"
        : numValue >= 40
          ? "text-orange-700 bg-orange-50"
          : "text-red-700 bg-red-50";

  return (
    <div className={`rounded-lg p-3 text-center ${color}`}>
      <div className="text-2xl font-bold">
        {value}
        {suffix}
      </div>
      <div className="text-xs font-medium mt-0.5">{label}</div>
    </div>
  );
}

// -- Section Toggle ------------------------------------------------------------

function Section({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-100 rounded-lg">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left px-4 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50 flex items-center justify-between"
      >
        {title}
        <span className="text-gray-400 text-xs">{open ? "▲" : "▼"}</span>
      </button>
      {open && <div className="px-4 pb-3 space-y-2">{children}</div>}
    </div>
  );
}

// -- Stat Row ------------------------------------------------------------------

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between items-center text-sm py-1 border-b border-gray-50 last:border-0">
      <span className="text-gray-600">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}

// -- Main Widget ---------------------------------------------------------------

export function WaterSafetyLegionellaDashboardWidget() {
  const [data, setData] = useState<WaterSafetyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/water-safety-legionella");
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
        <div className="h-20 bg-gray-100 rounded mb-3" />
        <div className="grid grid-cols-4 gap-3">
          <div className="h-16 bg-gray-100 rounded" />
          <div className="h-16 bg-gray-100 rounded" />
          <div className="h-16 bg-gray-100 rounded" />
          <div className="h-16 bg-gray-100 rounded" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white border border-red-200 rounded-xl p-6">
        <h3 className="font-semibold text-red-800">
          Water Safety & Legionella Intelligence
        </h3>
        <p className="text-sm text-red-600 mt-1">
          {error ?? "No data available"}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900 text-lg">
            Water Safety & Legionella Intelligence
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {data.periodStart} to {data.periodEnd} |{" "}
            {data.temperatureCompliance.totalChecks} temp checks |{" "}
            {data.legionellaManagement.totalAssessments} assessments
          </p>
        </div>
        <RatingBadge score={data.overallScore} rating={data.rating} />
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <MetricCard
          label="Temperature Compliance"
          value={data.temperatureCompliance.score}
          suffix="/25"
        />
        <MetricCard
          label="Legionella Management"
          value={data.legionellaManagement.score}
          suffix="/25"
        />
        <MetricCard
          label="Water Safety Policy"
          value={data.waterSafetyPolicy.score}
          suffix="/25"
        />
        <MetricCard
          label="Staff Readiness"
          value={data.staffWaterReadiness.score}
          suffix="/25"
        />
      </div>

      {/* Temperature Issue Alerts */}
      {data.temperatureCompliance.issueCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
          <h4 className="text-sm font-semibold text-amber-800">
            {data.temperatureCompliance.issueCount} temperature issue(s)
            identified
          </h4>
          <p className="text-xs text-amber-700 mt-0.5">
            Corrective actions taken:{" "}
            {data.temperatureCompliance.correctiveActionCount} of{" "}
            {data.temperatureCompliance.issueCount} (
            {formatRate(data.temperatureCompliance.correctiveActionRate)})
          </p>
        </div>
      )}

      {/* Priority Actions */}
      {data.actions.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <h4 className="text-sm font-semibold text-red-800 mb-2">
            Priority Actions
          </h4>
          <ul className="space-y-1">
            {data.actions.slice(0, 3).map((action, i) => (
              <li
                key={i}
                className="text-xs text-red-700 flex items-start gap-1.5"
              >
                <span className="mt-0.5 shrink-0">*</span>
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Location Profiles Summary */}
      {data.locationProfiles.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-800 mb-2">
            Location Profiles
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {data.locationProfiles.map((loc) => (
              <div
                key={loc.location}
                className="bg-gray-50 rounded-lg p-2 text-xs"
              >
                <div className="font-medium text-gray-800">
                  {loc.location}
                </div>
                <div className="text-gray-500 mt-0.5">
                  {loc.checkCount} checks | Pass: {formatRate(loc.passRate)} | Score:{" "}
                  {loc.score}/10
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expandable Details */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-sm text-blue-600 hover:text-blue-800 font-medium w-full text-left"
      >
        {expanded ? "Hide details" : "Show detailed analysis"}
      </button>

      {expanded && (
        <div className="mt-4 space-y-3">
          {/* Temperature Compliance */}
          <Section title="Temperature Compliance" defaultOpen>
            <StatRow
              label="Total checks"
              value={data.temperatureCompliance.totalChecks}
            />
            <StatRow
              label="Pass rate"
              value={`${formatRate(data.temperatureCompliance.passRate)}`}
            />
            <StatRow
              label="Within safe range"
              value={`${formatRate(data.temperatureCompliance.withinSafeRangeRate)}`}
            />
            <StatRow
              label="Issues found"
              value={data.temperatureCompliance.issueCount}
            />
            <StatRow
              label="Corrective actions"
              value={`${formatRate(data.temperatureCompliance.correctiveActionRate)}`}
            />
            <StatRow
              label="Source types covered"
              value={data.temperatureCompliance.sourceTypeCoverage}
            />
            <StatRow
              label="Score"
              value={`${data.temperatureCompliance.score}/25`}
            />
            {Object.keys(data.temperatureCompliance.bySourceType).length >
              0 && (
              <div className="text-xs text-gray-500 mt-1">
                {Object.entries(data.temperatureCompliance.bySourceType)
                  .map(
                    ([type, count]) =>
                      `${type.replace(/_/g, " ")}: ${count}`
                  )
                  .join(" | ")}
              </div>
            )}
          </Section>

          {/* Legionella Management */}
          <Section title="Legionella Management">
            <StatRow
              label="Total assessments"
              value={data.legionellaManagement.totalAssessments}
            />
            <StatRow
              label="Low risk rate"
              value={`${formatRate(data.legionellaManagement.lowRiskRate)}`}
            />
            <StatRow
              label="Flushing schedules"
              value={`${formatRate(data.legionellaManagement.flushingScheduleRate)}`}
            />
            <StatRow
              label="Water treatment active"
              value={`${formatRate(data.legionellaManagement.waterTreatmentRate)}`}
            />
            <StatRow
              label="Dead legs identified"
              value={data.legionellaManagement.deadLegsIdentifiedCount}
            />
            <StatRow
              label="Dead legs removed"
              value={data.legionellaManagement.deadLegsRemovedCount}
            />
            <StatRow
              label="Dead legs management"
              value={`${formatRate(data.legionellaManagement.deadLegsManagementRate)}`}
            />
            <StatRow
              label="Score"
              value={`${data.legionellaManagement.score}/25`}
            />
            {Object.keys(data.legionellaManagement.byRiskLevel).length >
              0 && (
              <div className="text-xs text-gray-500 mt-1">
                {Object.entries(data.legionellaManagement.byRiskLevel)
                  .map(
                    ([level, count]) =>
                      `${level.replace(/_/g, " ")}: ${count}`
                  )
                  .join(" | ")}
              </div>
            )}
          </Section>

          {/* Water Safety Policy */}
          <Section title="Water Safety Policy">
            <StatRow
              label="Total policies"
              value={data.waterSafetyPolicy.totalPolicies}
            />
            <StatRow
              label="Policy current"
              value={data.waterSafetyPolicy.policyCurrentCount}
            />
            <StatRow
              label="Temperature schedule"
              value={data.waterSafetyPolicy.temperatureScheduleCount}
            />
            <StatRow
              label="Legionella plan"
              value={data.waterSafetyPolicy.legionellaPlanCount}
            />
            <StatRow
              label="Scalding prevention"
              value={data.waterSafetyPolicy.scaldingPreventionCount}
            />
            <StatRow
              label="Bath supervision"
              value={data.waterSafetyPolicy.bathSupervisionCount}
            />
            <StatRow
              label="Emergency procedures"
              value={data.waterSafetyPolicy.emergencyProceduresCount}
            />
            <StatRow
              label="Record keeping"
              value={data.waterSafetyPolicy.recordKeepingCount}
            />
            <StatRow
              label="Score"
              value={`${data.waterSafetyPolicy.score}/25`}
            />
          </Section>

          {/* Staff Water Readiness */}
          <Section title="Staff Water Safety Readiness">
            <StatRow
              label="Total staff"
              value={data.staffWaterReadiness.totalStaff}
            />
            <StatRow
              label="Legionella awareness"
              value={`${formatRate(data.staffWaterReadiness.legionellaAwarenessRate)}`}
            />
            <StatRow
              label="Temperature monitoring"
              value={`${formatRate(data.staffWaterReadiness.temperatureMonitoringRate)}`}
            />
            <StatRow
              label="Scalding prevention"
              value={`${formatRate(data.staffWaterReadiness.scaldingPreventionRate)}`}
            />
            <StatRow
              label="Bath supervision"
              value={`${formatRate(data.staffWaterReadiness.bathSupervisionRate)}`}
            />
            <StatRow
              label="Emergency response"
              value={`${formatRate(data.staffWaterReadiness.emergencyResponseRate)}`}
            />
            <StatRow
              label="Record keeping"
              value={`${formatRate(data.staffWaterReadiness.recordKeepingRate)}`}
            />
            <StatRow
              label="Score"
              value={`${data.staffWaterReadiness.score}/25`}
            />
          </Section>

          {/* Location Profiles Detail */}
          {data.locationProfiles.length > 0 && (
            <Section title="Location Profiles">
              {data.locationProfiles.map((loc) => (
                <div key={loc.location} className="py-1">
                  <div className="text-sm font-medium text-gray-800">
                    {loc.location}
                  </div>
                  <div className="text-xs text-gray-500">
                    Checks: {loc.checkCount} | Pass: {formatRate(loc.passRate)} | Safe
                    range: {formatRate(loc.withinSafeRangeRate)} | Avg temp:{" "}
                    {loc.averageTemperature}C | Risk:{" "}
                    {loc.latestRiskLevel ?? "N/A"} | Score: {loc.score}/10
                  </div>
                </div>
              ))}
            </Section>
          )}

          {/* Strengths / Areas / Actions */}
          {data.strengths.length > 0 && (
            <Section title="Strengths">
              {data.strengths.map((s, i) => (
                <div key={i} className="text-xs text-green-700">
                  + {s}
                </div>
              ))}
            </Section>
          )}

          {data.areasForImprovement.length > 0 && (
            <Section title="Areas for Improvement">
              {data.areasForImprovement.map((a, i) => (
                <div key={i} className="text-xs text-orange-700">
                  - {a}
                </div>
              ))}
            </Section>
          )}

          {data.actions.length > 0 && (
            <Section title="Actions Required">
              {data.actions.map((a, i) => (
                <div key={i} className="text-xs text-red-700">
                  * {a}
                </div>
              ))}
            </Section>
          )}

          {/* Regulatory Framework */}
          <Section title="Regulatory Framework">
            {data.regulatoryLinks.map((link, i) => (
              <div key={i} className="text-xs text-gray-600">
                {link}
              </div>
            ))}
          </Section>
        </div>
      )}
    </div>
  );
}

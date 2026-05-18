"use client";

// ══════════════════════════════════════════════════════════════════════════════
// EMERGENCY PREPAREDNESS DASHBOARD WIDGET
//
// Displays emergency preparedness and business continuity intelligence:
// - Overall score with Ofsted-aligned rating
// - Key metrics: plan coverage, drill success, BC readiness, response quality
// - Expandable sections for detailed analysis
// - Regulatory framework references
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";

// ── Local Type Definitions ────────────────────────────────────────────────

interface EmergencyPlanEvaluation {
  totalPlans: number;
  emergencyTypesCovered: string[];
  emergencyTypesUncovered: string[];
  coverageRate: number;
  currentPlans: number;
  expiredPlans: number;
  underReviewPlans: number;
  draftPlans: number;
  currencyRate: number;
  staffTrainingRate: number;
  childrenBriefingRate: number;
  contactListCompleteness: number;
  expiryAlerts: { planId: string; planName: string; nextReviewDate: string; daysUntilExpiry: number }[];
}

interface DrillReadinessEvaluation {
  totalDrills: number;
  drillsByType: Record<string, number>;
  timeOfDayVariety: { day: number; evening: number; night: number; weekend: number };
  timeOfDayVarietyScore: number;
  successRate: number;
  partialSuccessRate: number;
  failureRate: number;
  averageEvacuationTimeMinutes: number | null;
  actionsCompletionRate: number;
  lessonsLearnedCaptured: number;
  totalIssuesIdentified: number;
}

interface BusinessContinuityEvaluation {
  totalPlans: number;
  currentPlans: number;
  coverageRate: number;
  currencyRate: number;
  minimumStaffingDocumented: number;
  alternativeAccommodationArranged: number;
  itBackupRate: number;
  communicationPlanRate: number;
  supplierAlternativesRate: number;
}

interface LoneWorkingEvaluation {
  totalAssessments: number;
  currentAssessments: number;
  currencyRate: number;
  loneWorkingOccurs: boolean;
  riskLevels: { low: number; medium: number; high: number };
  mitigationInPlace: number;
  checkInProtocolRate: number;
  emergencyProcedureRate: number;
}

interface IncidentResponseEvaluation {
  totalIncidents: number;
  averageResponseTimeMinutes: number | null;
  planAdherenceRate: number;
  notificationCompletenessRate: number;
  childrenSafeRate: number;
  debriefRate: number;
  lessonsLearnedCaptured: number;
  incidentsByType: Record<string, number>;
}

interface EmergencyPreparednessData {
  homeId: string;
  assessedAt: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: string;
  emergencyPlans: EmergencyPlanEvaluation;
  drillReadiness: DrillReadinessEvaluation;
  businessContinuity: BusinessContinuityEvaluation;
  loneWorking: LoneWorkingEvaluation;
  incidentResponse: IncidentResponseEvaluation;
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Rating Badge ──────────────────────────────────────────────────────────

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
    rating === "outstanding" ? "Outstanding"
      : rating === "good" ? "Good"
        : rating === "requires_improvement" ? "Requires Improvement"
          : "Inadequate";

  return (
    <div className={`rounded-lg border px-4 py-3 text-center ${colorClass}`}>
      <div className="text-3xl font-bold">{score}</div>
      <div className="text-sm font-medium mt-1">{label}</div>
    </div>
  );
}

// ── Metric Card ───────────────────────────────────────────────────────────

function MetricCard({ label, value, suffix }: { label: string; value: number | string; suffix?: string }) {
  const numValue = typeof value === "number" ? value : parseInt(value, 10);
  const color =
    numValue >= 80 ? "text-green-700 bg-green-50"
      : numValue >= 60 ? "text-blue-700 bg-blue-50"
        : numValue >= 40 ? "text-orange-700 bg-orange-50"
          : "text-red-700 bg-red-50";

  return (
    <div className={`rounded-lg p-3 text-center ${color}`}>
      <div className="text-2xl font-bold">{value}{suffix}</div>
      <div className="text-xs font-medium mt-0.5">{label}</div>
    </div>
  );
}

// ── Section Toggle ────────────────────────────────────────────────────────

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

// ── Stat Row ──────────────────────────────────────────────────────────────

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between items-center text-sm py-1 border-b border-gray-50 last:border-0">
      <span className="text-gray-600">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}

// ── Main Widget ───────────────────────────────────────────────────────────

export function EmergencyPreparednessDashboardWidget() {
  const [data, setData] = useState<EmergencyPreparednessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/emergency-preparedness");
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
        <h3 className="font-semibold text-red-800">Emergency Preparedness</h3>
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
            Emergency Preparedness & Business Continuity
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {data.periodStart} to {data.periodEnd} | {data.emergencyPlans.totalPlans} plans | {data.drillReadiness.totalDrills} drills
          </p>
        </div>
        <RatingBadge score={data.overallScore} rating={data.rating} />
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <MetricCard label="Plan Coverage" value={data.emergencyPlans.coverageRate} suffix="%" />
        <MetricCard label="Drill Success Rate" value={data.drillReadiness.successRate} suffix="%" />
        <MetricCard label="BC Readiness" value={data.businessContinuity.coverageRate} suffix="%" />
        <MetricCard
          label="Response Quality"
          value={data.incidentResponse.totalIncidents > 0 ? data.incidentResponse.planAdherenceRate : "N/A"}
          suffix={data.incidentResponse.totalIncidents > 0 ? "%" : ""}
        />
      </div>

      {/* Expiry Alerts */}
      {data.emergencyPlans.expiryAlerts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
          <h4 className="text-sm font-semibold text-amber-800 mb-1">Plan Review Alerts</h4>
          {data.emergencyPlans.expiryAlerts.slice(0, 3).map((alert) => (
            <div key={alert.planId} className="text-xs text-amber-700">
              {alert.planName} — {alert.daysUntilExpiry < 0 ? `${Math.abs(alert.daysUntilExpiry)} days overdue` : `due in ${alert.daysUntilExpiry} days`}
            </div>
          ))}
        </div>
      )}

      {/* Urgent Actions */}
      {data.actions.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <h4 className="text-sm font-semibold text-red-800 mb-2">Priority Actions</h4>
          <ul className="space-y-1">
            {data.actions.slice(0, 3).map((action, i) => (
              <li key={i} className="text-xs text-red-700 flex items-start gap-1.5">
                <span className="mt-0.5 shrink-0">*</span>
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
        {expanded ? "Hide details" : "Show detailed analysis"}
      </button>

      {expanded && (
        <div className="mt-4 space-y-3">
          {/* Emergency Plans */}
          <Section title="Emergency Plans" defaultOpen>
            <StatRow label="Total plans" value={data.emergencyPlans.totalPlans} />
            <StatRow label="Current" value={data.emergencyPlans.currentPlans} />
            <StatRow label="Expired" value={data.emergencyPlans.expiredPlans} />
            <StatRow label="Under review" value={data.emergencyPlans.underReviewPlans} />
            <StatRow label="Draft" value={data.emergencyPlans.draftPlans} />
            <StatRow label="Coverage rate" value={`${data.emergencyPlans.coverageRate}%`} />
            <StatRow label="Currency rate" value={`${data.emergencyPlans.currencyRate}%`} />
            <StatRow label="Staff trained" value={`${data.emergencyPlans.staffTrainingRate}%`} />
            <StatRow label="Children briefed" value={`${data.emergencyPlans.childrenBriefingRate}%`} />
            <StatRow label="Contact list complete" value={`${data.emergencyPlans.contactListCompleteness}%`} />
            {data.emergencyPlans.emergencyTypesUncovered.length > 0 && (
              <div className="text-xs text-orange-600 mt-1">
                Uncovered: {data.emergencyPlans.emergencyTypesUncovered.join(", ")}
              </div>
            )}
          </Section>

          {/* Drill Analysis */}
          <Section title="Drill Analysis">
            <StatRow label="Total drills" value={data.drillReadiness.totalDrills} />
            <StatRow label="Success rate" value={`${data.drillReadiness.successRate}%`} />
            <StatRow label="Partial success" value={`${data.drillReadiness.partialSuccessRate}%`} />
            <StatRow label="Failure rate" value={`${data.drillReadiness.failureRate}%`} />
            <StatRow
              label="Avg evacuation time"
              value={data.drillReadiness.averageEvacuationTimeMinutes != null
                ? `${data.drillReadiness.averageEvacuationTimeMinutes} min`
                : "N/A"}
            />
            <StatRow label="Time variety score" value={`${data.drillReadiness.timeOfDayVarietyScore}%`} />
            <StatRow label="Actions completion" value={`${data.drillReadiness.actionsCompletionRate}%`} />
            <StatRow label="Issues identified" value={data.drillReadiness.totalIssuesIdentified} />
            <div className="text-xs text-gray-500 mt-1">
              Day: {data.drillReadiness.timeOfDayVariety.day} |
              Evening: {data.drillReadiness.timeOfDayVariety.evening} |
              Night: {data.drillReadiness.timeOfDayVariety.night} |
              Weekend: {data.drillReadiness.timeOfDayVariety.weekend}
            </div>
          </Section>

          {/* Business Continuity */}
          <Section title="Business Continuity">
            <StatRow label="Total BC plans" value={data.businessContinuity.totalPlans} />
            <StatRow label="Current" value={data.businessContinuity.currentPlans} />
            <StatRow label="Coverage rate" value={`${data.businessContinuity.coverageRate}%`} />
            <StatRow label="Staffing documented" value={data.businessContinuity.minimumStaffingDocumented} />
            <StatRow label="Alt accommodation" value={data.businessContinuity.alternativeAccommodationArranged} />
            <StatRow label="IT backup" value={`${data.businessContinuity.itBackupRate}%`} />
            <StatRow label="Communication plans" value={`${data.businessContinuity.communicationPlanRate}%`} />
            <StatRow label="Supplier alternatives" value={`${data.businessContinuity.supplierAlternativesRate}%`} />
          </Section>

          {/* Lone Working */}
          <Section title="Lone Working">
            <StatRow label="Assessments" value={data.loneWorking.totalAssessments} />
            <StatRow label="Current" value={data.loneWorking.currentAssessments} />
            <StatRow label="Currency rate" value={`${data.loneWorking.currencyRate}%`} />
            <StatRow label="Lone working occurs" value={data.loneWorking.loneWorkingOccurs ? "Yes" : "No"} />
            <StatRow label="Check-in protocol" value={`${data.loneWorking.checkInProtocolRate}%`} />
            <StatRow label="Emergency procedure" value={`${data.loneWorking.emergencyProcedureRate}%`} />
            <div className="text-xs text-gray-500 mt-1">
              Risk: Low {data.loneWorking.riskLevels.low} |
              Medium {data.loneWorking.riskLevels.medium} |
              High {data.loneWorking.riskLevels.high}
            </div>
          </Section>

          {/* Incident Response */}
          <Section title="Incident Response">
            <StatRow label="Total incidents" value={data.incidentResponse.totalIncidents} />
            <StatRow
              label="Avg response time"
              value={data.incidentResponse.averageResponseTimeMinutes != null
                ? `${data.incidentResponse.averageResponseTimeMinutes} min`
                : "N/A"}
            />
            <StatRow label="Plan adherence" value={`${data.incidentResponse.planAdherenceRate}%`} />
            <StatRow label="Notifications complete" value={`${data.incidentResponse.notificationCompletenessRate}%`} />
            <StatRow label="Children safe" value={`${data.incidentResponse.childrenSafeRate}%`} />
            <StatRow label="Debriefs completed" value={`${data.incidentResponse.debriefRate}%`} />
          </Section>

          {/* Strengths / Areas / Actions */}
          {data.strengths.length > 0 && (
            <Section title="Strengths">
              {data.strengths.map((s, i) => (
                <div key={i} className="text-xs text-green-700">+ {s}</div>
              ))}
            </Section>
          )}

          {data.areasForImprovement.length > 0 && (
            <Section title="Areas for Improvement">
              {data.areasForImprovement.map((a, i) => (
                <div key={i} className="text-xs text-orange-700">- {a}</div>
              ))}
            </Section>
          )}

          {data.actions.length > 0 && (
            <Section title="Actions Required">
              {data.actions.map((a, i) => (
                <div key={i} className="text-xs text-red-700">* {a}</div>
              ))}
            </Section>
          )}

          {/* Regulatory Framework */}
          <Section title="Regulatory Framework">
            {data.regulatoryLinks.map((link, i) => (
              <div key={i} className="text-xs text-gray-600">{link}</div>
            ))}
          </Section>
        </div>
      )}
    </div>
  );
}

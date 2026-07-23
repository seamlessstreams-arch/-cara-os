"use client";

// ══════════════════════════════════════════════════════════════════════════════
// HOME MATCHING IMPACT INTELLIGENCE DASHBOARD WIDGET
//
// Displays home matching impact intelligence:
// - Overall score with Ofsted-aligned rating
// - Key metrics row (assessments, monitoring, consultations, outcomes)
// - Expandable sections: Matching Quality, Impact Monitoring,
//   Resident Consultations, Admission Outcomes, Strengths/Areas/Actions,
//   Regulatory Framework
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";

/** Rates are null when nothing was recorded — show the gap, never a fabricated number. */
function pct(value: number | null | undefined): string {
  return typeof value === "number" && Number.isFinite(value) ? `${value}%` : "—";
}

function meets(value: number | null | undefined, threshold: number): boolean {
  return typeof value === "number" && Number.isFinite(value) && value >= threshold;
}

// ── Interfaces ─────────────────────────────────────────────────────────────

interface HomeMatchingImpactData {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  referenceDate: string;
  overallScore: number;
  rating: string;
  matchingQuality: {
    totalAssessments: number;
    averageCompatibilityScore: number;
    assessmentCompletionRate: number;
    existingChildrenConsultedRate: number;
    conditionsAppliedRate: number | null;
    decisionBreakdown: Record<string, number>;
    admissionTypeBreakdown: Record<string, number>;
    averageRiskFactors: number;
    averageProtectiveFactors: number;
    reviewDateSetRate: number;
  };
  impactMonitoring: {
    totalMonitoringRecords: number;
    negativeImpactRate: number;
    significantNegativeRate: number;
    positiveImpactRate: number;
    impactAreaBreakdown: Record<string, number>;
    resolutionRate: number | null;
    mitigationProvidedRate: number | null;
    averageMonitoringPerChild: number;
    monitoringFrequencyAdequate: boolean;
  };
  residentConsultation: {
    totalConsultations: number;
    informedRate: number;
    viewsSoughtRate: number;
    viewsActedUponRate: number;
    consultationCompletionRate: number;
    averageConsultationsPerAdmission: number;
  };
  admissionOutcomes: {
    totalOutcomes: number;
    placementStabilityRate: number;
    averageDaysToSettle: number;
    disruptionRate: number;
    disruptionReasons: Record<string, number>;
    matchingAssessmentLinkedRate: number;
  };
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
  componentScores: {
    matchingQuality: number;
    impactMonitoring: number;
    residentConsultation: number;
    admissionOutcomes: number;
  };
}

// ── Rating Badge ───────────────────────────────────────────────────────────

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

// ── Metric Card ────────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  subValue,
  color,
}: {
  label: string;
  value: string | number;
  subValue?: string;
  color?: string;
}) {
  const colorClass = color ?? "text-gray-700 bg-gray-50";
  return (
    <div className={`rounded-lg p-3 text-center ${colorClass}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs font-medium mt-0.5">{label}</div>
      {subValue && <div className="text-[10px] text-gray-400 mt-0.5">{subValue}</div>}
    </div>
  );
}

// ── Score Bar ──────────────────────────────────────────────────────────────

function ScoreBar({ label, score, maxScore }: { label: string; score: number; maxScore: number }) {
  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  const color =
    percentage >= 80
      ? "bg-green-500"
      : percentage >= 60
        ? "bg-blue-500"
        : percentage >= 40
          ? "bg-orange-500"
          : "bg-red-500";

  return (
    <div className="flex items-center gap-3 py-1">
      <div className="w-40 text-xs text-gray-600 shrink-0">{label}</div>
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${percentage}%` }} />
      </div>
      <div className="text-xs font-medium text-gray-700 w-16 text-right">
        {score}/{maxScore}
      </div>
    </div>
  );
}

// ── Expandable Section ─────────────────────────────────────────────────────

function ExpandableSection({
  title,
  defaultOpen,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  return (
    <div className="border-t border-gray-100 pt-3">
      <button
        onClick={() => setOpen(!open)}
        className="text-sm text-blue-600 hover:text-blue-800 font-medium w-full text-left"
      >
        {open ? `Hide ${title} ▲` : `Show ${title} ▼`}
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}

// ── Impact Area Label ──────────────────────────────────────────────────────

function impactAreaLabel(area: string): string {
  const labels: Record<string, string> = {
    behaviour: "Behaviour",
    emotional_wellbeing: "Emotional Wellbeing",
    peer_dynamics: "Peer Dynamics",
    routines: "Routines",
    education: "Education",
    safety: "Safety",
    staffing: "Staffing",
    space: "Space",
  };
  return labels[area] ?? area;
}

// ── Decision Label ─────────────────────────────────────────────────────────

function decisionLabel(decision: string): string {
  const labels: Record<string, string> = {
    proceed: "Proceed",
    proceed_with_conditions: "With Conditions",
    defer: "Defer",
    decline: "Decline",
  };
  return labels[decision] ?? decision;
}

// ── Admission Type Label ───────────────────────────────────────────────────

function admissionTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    planned: "Planned",
    emergency: "Emergency",
    respite: "Respite",
    step_down: "Step Down",
    step_up: "Step Up",
  };
  return labels[type] ?? type;
}

// ── Main Widget ────────────────────────────────────────────────────────────

export function HomeMatchingImpactDashboardWidget() {
  const [data, setData] = useState<HomeMatchingImpactData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/home-matching-impact");
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
        <h3 className="font-semibold text-red-800">Home Matching Impact Intelligence</h3>
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
            Home Matching Impact Intelligence
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {data.periodStart} to {data.periodEnd} | {data.matchingQuality.totalAssessments} assessments |{" "}
            {data.impactMonitoring.totalMonitoringRecords} monitoring records
          </p>
        </div>
        <RatingBadge score={data.overallScore} rating={data.rating} />
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <MetricCard
          label="Compatibility"
          value={`${data.matchingQuality.averageCompatibilityScore}/10`}
          subValue={`${data.matchingQuality.existingChildrenConsultedRate}% consulted`}
          color="text-blue-700 bg-blue-50"
        />
        <MetricCard
          label="Positive Impact"
          value={`${data.impactMonitoring.positiveImpactRate}%`}
          subValue={`${data.impactMonitoring.totalMonitoringRecords} records`}
          color="text-green-700 bg-green-50"
        />
        <MetricCard
          label="Views Sought"
          value={`${data.residentConsultation.viewsSoughtRate}%`}
          subValue={`${data.residentConsultation.totalConsultations} consultations`}
          color="text-teal-700 bg-teal-50"
        />
        <MetricCard
          label="Stability"
          value={`${data.admissionOutcomes.placementStabilityRate}%`}
          subValue={`${data.admissionOutcomes.totalOutcomes} admissions`}
          color="text-purple-700 bg-purple-50"
        />
      </div>

      {/* Component Scores */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-800 mb-2">Component Scores</h4>
        <div className="bg-gray-50 rounded-lg p-3 space-y-1">
          <ScoreBar
            label="Matching Quality"
            score={data.componentScores.matchingQuality}
            maxScore={30}
          />
          <ScoreBar
            label="Impact Monitoring"
            score={data.componentScores.impactMonitoring}
            maxScore={25}
          />
          <ScoreBar
            label="Resident Consultation"
            score={data.componentScores.residentConsultation}
            maxScore={25}
          />
          <ScoreBar
            label="Admission Outcomes"
            score={data.componentScores.admissionOutcomes}
            maxScore={20}
          />
        </div>
      </div>

      {/* Immediate Actions */}
      {data.actions.length > 0 &&
        !data.actions[0].startsWith("No immediate actions") && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
            <h4 className="text-sm font-semibold text-amber-800 mb-2">Actions Required</h4>
            <ul className="space-y-1">
              {data.actions.map((action, i) => (
                <li key={i} className="text-xs text-amber-700 flex items-start gap-1.5">
                  <span className="mt-0.5 shrink-0">*</span>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

      {/* Expandable: Matching Quality */}
      <ExpandableSection title="Matching Quality">
        <div className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <MetricCard
              label="Avg Compatibility"
              value={`${data.matchingQuality.averageCompatibilityScore}/10`}
              color="text-indigo-700 bg-indigo-50"
            />
            <MetricCard
              label="Completion Rate"
              value={`${data.matchingQuality.assessmentCompletionRate}%`}
              color={data.matchingQuality.assessmentCompletionRate >= 80 ? "text-green-700 bg-green-50" : "text-orange-700 bg-orange-50"}
            />
            <MetricCard
              label="Review Date Set"
              value={`${data.matchingQuality.reviewDateSetRate}%`}
              color={data.matchingQuality.reviewDateSetRate >= 80 ? "text-green-700 bg-green-50" : "text-orange-700 bg-orange-50"}
            />
          </div>
          {/* Decision breakdown */}
          <div className="bg-gray-50 rounded-lg p-3">
            <h5 className="text-xs font-semibold text-gray-600 mb-2">Decision Breakdown</h5>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {Object.entries(data.matchingQuality.decisionBreakdown)
                .filter(([, v]) => v > 0)
                .map(([key, value]) => (
                  <div key={key} className="text-center">
                    <div className="text-lg font-bold text-gray-800">{value}</div>
                    <div className="text-[10px] text-gray-500">{decisionLabel(key)}</div>
                  </div>
                ))}
            </div>
          </div>
          {/* Admission type breakdown */}
          <div className="bg-gray-50 rounded-lg p-3">
            <h5 className="text-xs font-semibold text-gray-600 mb-2">Admission Types</h5>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {Object.entries(data.matchingQuality.admissionTypeBreakdown)
                .filter(([, v]) => v > 0)
                .map(([key, value]) => (
                  <div key={key} className="text-center">
                    <div className="text-lg font-bold text-gray-800">{value}</div>
                    <div className="text-[10px] text-gray-500">{admissionTypeLabel(key)}</div>
                  </div>
                ))}
            </div>
          </div>
          {/* Risk and protective factors */}
          <div className="grid grid-cols-2 gap-2">
            <MetricCard
              label="Avg Risk Factors"
              value={data.matchingQuality.averageRiskFactors}
              color="text-red-700 bg-red-50"
            />
            <MetricCard
              label="Avg Protective Factors"
              value={data.matchingQuality.averageProtectiveFactors}
              color="text-green-700 bg-green-50"
            />
          </div>
        </div>
      </ExpandableSection>

      {/* Expandable: Impact Monitoring */}
      <ExpandableSection title="Impact Monitoring">
        <div className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <MetricCard
              label="Positive Impact"
              value={`${data.impactMonitoring.positiveImpactRate}%`}
              color="text-green-700 bg-green-50"
            />
            <MetricCard
              label="Negative Impact"
              value={`${data.impactMonitoring.negativeImpactRate}%`}
              color={data.impactMonitoring.negativeImpactRate <= 20 ? "text-green-700 bg-green-50" : "text-red-700 bg-red-50"}
            />
            <MetricCard
              label="Significant Negative"
              value={`${data.impactMonitoring.significantNegativeRate}%`}
              color={data.impactMonitoring.significantNegativeRate === 0 ? "text-green-700 bg-green-50" : "text-red-700 bg-red-50"}
            />
            <MetricCard
              label="Resolution Rate"
              value={pct(data.impactMonitoring.resolutionRate)}
              color={meets(data.impactMonitoring.resolutionRate, 80) ? "text-green-700 bg-green-50" : data.impactMonitoring.resolutionRate === null ? "text-gray-600 bg-gray-50" : "text-orange-700 bg-orange-50"}
            />
            <MetricCard
              label="Mitigation Rate"
              value={pct(data.impactMonitoring.mitigationProvidedRate)}
              color={meets(data.impactMonitoring.mitigationProvidedRate, 80) ? "text-green-700 bg-green-50" : data.impactMonitoring.mitigationProvidedRate === null ? "text-gray-600 bg-gray-50" : "text-orange-700 bg-orange-50"}
            />
            <MetricCard
              label="Avg per Child"
              value={data.impactMonitoring.averageMonitoringPerChild}
              subValue={data.impactMonitoring.monitoringFrequencyAdequate ? "Adequate" : "Below standard"}
              color="text-gray-700 bg-gray-50"
            />
          </div>
          {/* Impact area breakdown */}
          <div className="bg-gray-50 rounded-lg p-3">
            <h5 className="text-xs font-semibold text-gray-600 mb-2">Impact Areas</h5>
            <div className="space-y-1">
              {Object.entries(data.impactMonitoring.impactAreaBreakdown)
                .filter(([, v]) => v > 0)
                .map(([area, count]) => (
                  <div key={area} className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">{impactAreaLabel(area)}</span>
                    <span className="font-medium text-gray-800">{count} records</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </ExpandableSection>

      {/* Expandable: Resident Consultations */}
      <ExpandableSection title="Resident Consultations">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          <MetricCard
            label="Informed Rate"
            value={`${data.residentConsultation.informedRate}%`}
            color={data.residentConsultation.informedRate >= 80 ? "text-green-700 bg-green-50" : "text-orange-700 bg-orange-50"}
          />
          <MetricCard
            label="Views Sought"
            value={`${data.residentConsultation.viewsSoughtRate}%`}
            color={data.residentConsultation.viewsSoughtRate >= 80 ? "text-green-700 bg-green-50" : "text-orange-700 bg-orange-50"}
          />
          <MetricCard
            label="Views Acted Upon"
            value={`${data.residentConsultation.viewsActedUponRate}%`}
            color={data.residentConsultation.viewsActedUponRate >= 80 ? "text-green-700 bg-green-50" : "text-orange-700 bg-orange-50"}
          />
          <MetricCard
            label="Completion Rate"
            value={`${data.residentConsultation.consultationCompletionRate}%`}
            color={data.residentConsultation.consultationCompletionRate >= 80 ? "text-green-700 bg-green-50" : "text-red-700 bg-red-50"}
          />
          <MetricCard
            label="Avg per Admission"
            value={data.residentConsultation.averageConsultationsPerAdmission}
            color="text-gray-700 bg-gray-50"
          />
        </div>
      </ExpandableSection>

      {/* Expandable: Admission Outcomes */}
      <ExpandableSection title="Admission Outcomes">
        <div className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <MetricCard
              label="Placement Stability"
              value={`${data.admissionOutcomes.placementStabilityRate}%`}
              color={data.admissionOutcomes.placementStabilityRate >= 80 ? "text-green-700 bg-green-50" : "text-red-700 bg-red-50"}
            />
            <MetricCard
              label="Avg Days to Settle"
              value={data.admissionOutcomes.averageDaysToSettle}
              subValue="days"
              color={data.admissionOutcomes.averageDaysToSettle <= 14 ? "text-green-700 bg-green-50" : "text-orange-700 bg-orange-50"}
            />
            <MetricCard
              label="Disruption Rate"
              value={`${data.admissionOutcomes.disruptionRate}%`}
              color={data.admissionOutcomes.disruptionRate <= 20 ? "text-green-700 bg-green-50" : "text-red-700 bg-red-50"}
            />
            <MetricCard
              label="Assessment Linked"
              value={`${data.admissionOutcomes.matchingAssessmentLinkedRate}%`}
              color={data.admissionOutcomes.matchingAssessmentLinkedRate >= 80 ? "text-green-700 bg-green-50" : "text-orange-700 bg-orange-50"}
            />
          </div>
          {/* Disruption reasons */}
          {Object.keys(data.admissionOutcomes.disruptionReasons).length > 0 && (
            <div className="bg-red-50 rounded-lg p-3">
              <h5 className="text-xs font-semibold text-red-700 mb-2">Disruption Reasons</h5>
              {Object.entries(data.admissionOutcomes.disruptionReasons).map(
                ([reason, count]) => (
                  <div key={reason} className="flex items-center justify-between text-xs">
                    <span className="text-red-600">{reason}</span>
                    <span className="font-medium text-red-800">{count}</span>
                  </div>
                ),
              )}
            </div>
          )}
        </div>
      </ExpandableSection>

      {/* Expandable: Strengths & Areas for Improvement */}
      <ExpandableSection title="Strengths & Areas for Improvement">
        <div className="space-y-4">
          {data.strengths.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-green-800 mb-2">Strengths</h4>
              <ul className="space-y-1">
                {data.strengths.map((s, i) => (
                  <li key={i} className="text-xs text-green-700">+ {s}</li>
                ))}
              </ul>
            </div>
          )}
          {data.areasForImprovement.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-orange-800 mb-2">Areas for Improvement</h4>
              <ul className="space-y-1">
                {data.areasForImprovement.map((a, i) => (
                  <li key={i} className="text-xs text-orange-700">- {a}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </ExpandableSection>

      {/* Expandable: Regulatory Framework */}
      <ExpandableSection title="Regulatory Framework">
        <div>
          <ul className="space-y-1">
            {data.regulatoryLinks.map((link, i) => (
              <li key={i} className="text-xs text-gray-600">{link}</li>
            ))}
          </ul>
        </div>
      </ExpandableSection>
    </div>
  );
}

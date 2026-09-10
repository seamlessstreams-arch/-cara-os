"use client";

// ==============================================================================
// PLACEMENT MATCHING QUALITY INTELLIGENCE DASHBOARD WIDGET
//
// Displays placement matching quality intelligence:
// - Overall score with Ofsted-aligned rating
// - Key metrics row (placements, compatibility, stability, disruptions)
// - Component score bars
// - Expandable sections: Child Profiles, Matching Process, Compatibility,
//   Stability, Strengths/Areas/Actions, Regulatory Framework
// ==============================================================================

import { formatRate } from "@/lib/metrics/rate";
import { useState, useEffect } from "react";

// -- Interfaces ---------------------------------------------------------------

interface ChildProfile {
  childId: string;
  childName: string;
  matchingOutcome: string;
  stabilityIndicator: string;
  daysInPlacement: number;
  compatibilityIssues: number;
  overallScore: number;
}

interface PlacementMatchingData {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: string;
  matchingProcess: {
    overallScore: number;
    totalPlacements: number;
    excellentGoodRate: number;
    impactAssessmentRate: number;
    consultationRate: number;
    referralCompleteRate: number;
    riskAssessmentRate: number;
    averageCriteriaMet: number;
  };
  compatibility: {
    overallScore: number;
    totalReviews: number;
    compatibleRate: number;
    managementPlanRate: number;
    positiveRelationshipRate: number;
    risksIdentifiedCount: number;
  };
  stabilityOutcome: {
    overallScore: number;
    totalAssessments: number;
    stableSettlingRate: number;
    atRiskCount: number;
    disruptedCount: number;
    schoolAttendingRate: number;
    therapeuticEngagedRate: number;
    keyRelationshipRate: number;
    averageDaysInPlacement: number;
  };
  disruptionLearning: {
    overallScore: number;
    totalDisruptions: number;
    plannedMoveRate: number;
    lessonDocumentedRate: number;
    impactAssessedRate: number;
  };
  childProfiles: ChildProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// -- Rating Badge -------------------------------------------------------------

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

// -- Metric Card --------------------------------------------------------------

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

// -- Score Bar ----------------------------------------------------------------

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
      <div className="w-36 text-xs text-gray-600 shrink-0">{label}</div>
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${percentage}%` }} />
      </div>
      <div className="text-xs font-medium text-gray-700 w-16 text-right">
        {score}/{maxScore}
      </div>
    </div>
  );
}

// -- Expandable Section -------------------------------------------------------

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

// -- Outcome Label ------------------------------------------------------------

function outcomeLabel(outcome: string): string {
  const labels: Record<string, string> = {
    excellent_match: "Excellent Match",
    good_match: "Good Match",
    adequate_match: "Adequate Match",
    poor_match: "Poor Match",
    placement_disrupted: "Placement Disrupted",
  };
  return labels[outcome] ?? outcome;
}

// -- Stability Label ----------------------------------------------------------

function stabilityLabel(indicator: string): string {
  const labels: Record<string, string> = {
    stable: "Stable",
    settling: "Settling",
    unsettled: "Unsettled",
    at_risk_of_disruption: "At Risk",
    disrupted: "Disrupted",
  };
  return labels[indicator] ?? indicator;
}

// -- Stability Color ----------------------------------------------------------

function stabilityColor(indicator: string): string {
  const colors: Record<string, string> = {
    stable: "bg-green-100 text-green-700",
    settling: "bg-blue-100 text-blue-700",
    unsettled: "bg-orange-100 text-orange-700",
    at_risk_of_disruption: "bg-red-100 text-red-700",
    disrupted: "bg-red-200 text-red-800",
  };
  return colors[indicator] ?? "bg-gray-100 text-gray-600";
}

// -- Child Profile Row --------------------------------------------------------

function ChildProfileRow({ profile }: { profile: ChildProfile }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{profile.childName}</span>
          <span className="text-xs text-gray-400">{outcomeLabel(profile.matchingOutcome)}</span>
        </div>
        <div className="text-[10px] text-gray-400 mt-0.5">
          {profile.daysInPlacement} days | {profile.compatibilityIssues} issues | Score: {profile.overallScore}/10
        </div>
      </div>
      <span
        className={`text-xs font-medium px-2 py-0.5 rounded shrink-0 ${stabilityColor(profile.stabilityIndicator)}`}
      >
        {stabilityLabel(profile.stabilityIndicator)}
      </span>
    </div>
  );
}

// -- Main Widget --------------------------------------------------------------

export function PlacementMatchingQualityDashboardWidget() {
  const [data, setData] = useState<PlacementMatchingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/placement-matching-quality");
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
        <h3 className="font-semibold text-red-800">Placement Matching Quality Intelligence</h3>
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
            Placement Matching Quality Intelligence
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {data.periodStart} to {data.periodEnd} | {data.matchingProcess.totalPlacements} placements |{" "}
            {data.compatibility.totalReviews} reviews
          </p>
        </div>
        <RatingBadge score={data.overallScore} rating={data.rating} />
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <MetricCard
          label="Placements"
          value={data.matchingProcess.totalPlacements}
          subValue={`${formatRate(data.matchingProcess.excellentGoodRate)} excellent/good`}
          color="text-blue-700 bg-blue-50"
        />
        <MetricCard
          label="Compatibility"
          value={`${data.compatibility.compatibleRate}%`}
          subValue={`${data.compatibility.totalReviews} reviews`}
          color="text-purple-700 bg-purple-50"
        />
        <MetricCard
          label="Stability"
          value={`${data.stabilityOutcome.stableSettlingRate}%`}
          subValue={`${data.stabilityOutcome.totalAssessments} assessed`}
          color="text-teal-700 bg-teal-50"
        />
        <MetricCard
          label="Disruptions"
          value={data.disruptionLearning.totalDisruptions}
          subValue={data.disruptionLearning.totalDisruptions === 0 ? "None in period" : `${data.disruptionLearning.lessonDocumentedRate}% documented`}
          color="text-green-700 bg-green-50"
        />
      </div>

      {/* Component Scores */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-800 mb-2">Component Scores</h4>
        <div className="bg-gray-50 rounded-lg p-3 space-y-1">
          <ScoreBar
            label="Matching Process"
            score={data.matchingProcess.overallScore}
            maxScore={25}
          />
          <ScoreBar
            label="Compatibility"
            score={data.compatibility.overallScore}
            maxScore={25}
          />
          <ScoreBar
            label="Stability"
            score={data.stabilityOutcome.overallScore}
            maxScore={25}
          />
          <ScoreBar
            label="Disruption Learning"
            score={data.disruptionLearning.overallScore}
            maxScore={25}
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

      {/* Expandable: Child Profiles */}
      <ExpandableSection title="Child Profiles" defaultOpen>
        <div className="bg-gray-50 rounded-lg p-3">
          {data.childProfiles.length > 0 ? (
            data.childProfiles.map((profile) => (
              <ChildProfileRow key={profile.childId} profile={profile} />
            ))
          ) : (
            <p className="text-xs text-gray-400">No child profiles available</p>
          )}
        </div>
      </ExpandableSection>

      {/* Expandable: Matching Process */}
      <ExpandableSection title="Matching Process">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          <MetricCard
            label="Impact Assessment"
            value={`${formatRate(data.matchingProcess.impactAssessmentRate)}`}
            color={data.matchingProcess.impactAssessmentRate >= 80 ? "text-green-700 bg-green-50" : "text-orange-700 bg-orange-50"}
          />
          <MetricCard
            label="Consultation"
            value={`${formatRate(data.matchingProcess.consultationRate)}`}
            color={data.matchingProcess.consultationRate >= 80 ? "text-green-700 bg-green-50" : "text-orange-700 bg-orange-50"}
          />
          <MetricCard
            label="Referral Complete"
            value={`${data.matchingProcess.referralCompleteRate}%`}
            color={data.matchingProcess.referralCompleteRate >= 80 ? "text-green-700 bg-green-50" : "text-orange-700 bg-orange-50"}
          />
          <MetricCard
            label="Risk Assessment"
            value={`${formatRate(data.matchingProcess.riskAssessmentRate)}`}
            color={data.matchingProcess.riskAssessmentRate >= 80 ? "text-green-700 bg-green-50" : "text-orange-700 bg-orange-50"}
          />
          <MetricCard
            label="Avg Criteria Met"
            value={data.matchingProcess.averageCriteriaMet}
            subValue="of 10 criteria"
            color="text-gray-700 bg-gray-50"
          />
        </div>
      </ExpandableSection>

      {/* Expandable: Compatibility */}
      <ExpandableSection title="Compatibility">
        <div className="grid grid-cols-2 gap-2">
          <MetricCard
            label="Compatible"
            value={`${data.compatibility.compatibleRate}%`}
            color={data.compatibility.compatibleRate >= 80 ? "text-green-700 bg-green-50" : "text-orange-700 bg-orange-50"}
          />
          <MetricCard
            label="Positive Relationships"
            value={`${formatRate(data.compatibility.positiveRelationshipRate)}`}
            color={data.compatibility.positiveRelationshipRate >= 80 ? "text-green-700 bg-green-50" : "text-orange-700 bg-orange-50"}
          />
          <MetricCard
            label="Risks Identified"
            value={data.compatibility.risksIdentifiedCount}
            color="text-gray-700 bg-gray-50"
          />
          <MetricCard
            label="Management Plans"
            value={`${formatRate(data.compatibility.managementPlanRate)}`}
            subValue="where risk identified"
            color={data.compatibility.managementPlanRate >= 80 ? "text-green-700 bg-green-50" : "text-red-700 bg-red-50"}
          />
        </div>
      </ExpandableSection>

      {/* Expandable: Stability */}
      <ExpandableSection title="Stability Outcomes">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          <MetricCard
            label="Stable/Settling"
            value={`${data.stabilityOutcome.stableSettlingRate}%`}
            color={data.stabilityOutcome.stableSettlingRate >= 80 ? "text-green-700 bg-green-50" : "text-orange-700 bg-orange-50"}
          />
          <MetricCard
            label="School Attending"
            value={`${data.stabilityOutcome.schoolAttendingRate}%`}
            color={data.stabilityOutcome.schoolAttendingRate >= 80 ? "text-green-700 bg-green-50" : "text-orange-700 bg-orange-50"}
          />
          <MetricCard
            label="Therapeutic Engaged"
            value={`${data.stabilityOutcome.therapeuticEngagedRate}%`}
            color={data.stabilityOutcome.therapeuticEngagedRate >= 80 ? "text-green-700 bg-green-50" : "text-orange-700 bg-orange-50"}
          />
          <MetricCard
            label="Key Relationships"
            value={`${data.stabilityOutcome.keyRelationshipRate}%`}
            color={data.stabilityOutcome.keyRelationshipRate >= 80 ? "text-green-700 bg-green-50" : "text-orange-700 bg-orange-50"}
          />
          <MetricCard
            label="Avg Days"
            value={data.stabilityOutcome.averageDaysInPlacement}
            subValue="in placement"
            color="text-gray-700 bg-gray-50"
          />
          {data.stabilityOutcome.atRiskCount > 0 && (
            <MetricCard
              label="At Risk"
              value={data.stabilityOutcome.atRiskCount}
              color="text-red-700 bg-red-50"
            />
          )}
        </div>
      </ExpandableSection>

      {/* Expandable: Strengths / Areas / Actions */}
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

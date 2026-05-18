"use client";

// ══════════════════════════════════════════════════════════════════════════════
// PLACEMENT STABILITY INTELLIGENCE DASHBOARD WIDGET
//
// Displays placement stability intelligence:
// - Overall score with Ofsted-aligned rating
// - Key metrics row (placements, disruptions, matching, outcomes)
// - Component score bars
// - Expandable sections: Child Profiles, Disruption Management,
//   Matching Quality, Outcomes, Strengths/Areas/Actions, Regulatory Framework
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";

// ── Interfaces ─────────────────────────────────────────────────────────────

interface ChildProfile {
  childId: string;
  childName: string;
  childAge: number;
  placementId: string;
  startDate: string;
  endDate?: string;
  status: string;
  durationDays: number;
  disruptionCount: number;
  supportSessionCount: number;
  latestOutcome?: string;
  matchingScore?: number;
  keyWorker?: string;
}

interface FactorBreakdown {
  factor: string;
  averageScore: number;
  count: number;
}

interface AreaBreakdown {
  area: string;
  averageRating: number;
  count: number;
}

interface TopFactor {
  factor: string;
  count: number;
}

interface PlacementStabilityData {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  referenceDate: string;
  overallScore: number;
  rating: string;
  placementDuration: {
    totalPlacements: number;
    activePlacements: number;
    endedPlannedCount: number;
    endedUnplannedCount: number;
    endedEmergencyCount: number;
    onNoticeCount: number;
    averageDurationDays: number;
    plannedEndingRate: number;
    unplannedEndingRate: number;
    emergencyPlacementRate: number;
    longestPlacementDays: number;
    shortestPlacementDays: number;
    endingReasons: Record<string, number>;
  };
  disruptionManagement: {
    totalDisruptions: number;
    anticipatedRate: number;
    preventionAttemptedRate: number;
    preventionSuccessRate: number;
    averageSupportActionsPerDisruption: number;
    severityBreakdown: { low: number; medium: number; high: number; critical: number };
    topFactors: TopFactor[];
    supportProvidedRate: number;
  };
  matchingQuality: {
    totalAssessments: number;
    averageOverallScore: number;
    factorBreakdown: FactorBreakdown[];
    impactAssessmentRate: number;
    childrenConsultedRate: number;
    childViewsRate: number;
    riskAssessmentRate: number;
    fullFactorAssessmentRate: number;
  };
  outcomesDuringPlacement: {
    totalOutcomes: number;
    progressBreakdown: Record<string, number>;
    averageEducationAttendance: number;
    healthAppointmentRate: number;
    carePlanUpToDateRate: number;
    areaBreakdown: AreaBreakdown[];
    improvementRate: number;
    declineRate: number;
  };
  childProfiles: ChildProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
  componentScores: {
    placementDurationStability: number;
    disruptionManagement: number;
    matchingQuality: number;
    outcomesDuringPlacement: number;
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

// ── Child Profile Row ─────────────────────────────────────────────────────

function ChildProfileRow({ profile }: { profile: ChildProfile }) {
  const statusColors: Record<string, string> = {
    active: "bg-green-100 text-green-700",
    ended_planned: "bg-blue-100 text-blue-700",
    ended_unplanned: "bg-red-100 text-red-700",
    ended_emergency: "bg-red-200 text-red-800",
    on_notice: "bg-orange-100 text-orange-700",
  };

  const statusLabels: Record<string, string> = {
    active: "Active",
    ended_planned: "Ended (Planned)",
    ended_unplanned: "Ended (Unplanned)",
    ended_emergency: "Emergency",
    on_notice: "On Notice",
  };

  const outcomeLabels: Record<string, string> = {
    significant_improvement: "Significant Improvement",
    some_improvement: "Some Improvement",
    stable: "Stable",
    some_decline: "Some Decline",
    significant_decline: "Significant Decline",
  };

  const outcomeColors: Record<string, string> = {
    significant_improvement: "text-green-700",
    some_improvement: "text-blue-700",
    stable: "text-gray-600",
    some_decline: "text-orange-700",
    significant_decline: "text-red-700",
  };

  return (
    <div className="py-3 border-b border-gray-100 last:border-0">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{profile.childName}</span>
            <span className="text-xs text-gray-400">Age {profile.childAge}</span>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded shrink-0 ${statusColors[profile.status] ?? "bg-gray-100 text-gray-600"}`}
            >
              {statusLabels[profile.status] ?? profile.status}
            </span>
          </div>
          <div className="text-[10px] text-gray-400 mt-0.5">
            {profile.durationDays} days | {profile.keyWorker ?? "No key worker"} |{" "}
            {profile.disruptionCount} disruption{profile.disruptionCount !== 1 ? "s" : ""} |{" "}
            {profile.supportSessionCount} support session{profile.supportSessionCount !== 1 ? "s" : ""}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4 mt-1">
        {profile.matchingScore !== undefined && (
          <span className="text-[10px] text-gray-500">
            Match: {profile.matchingScore}/5
          </span>
        )}
        {profile.latestOutcome && (
          <span className={`text-[10px] font-medium ${outcomeColors[profile.latestOutcome] ?? "text-gray-500"}`}>
            {outcomeLabels[profile.latestOutcome] ?? profile.latestOutcome}
          </span>
        )}
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

// ── Factor Label ──────────────────────────────────────────────────────────

function factorLabel(factor: string): string {
  const labels: Record<string, string> = {
    age_compatibility: "Age Compatibility",
    needs_compatibility: "Needs Compatibility",
    risk_compatibility: "Risk Compatibility",
    peer_dynamics: "Peer Dynamics",
    cultural_needs: "Cultural Needs",
    statement_of_purpose_fit: "Statement of Purpose Fit",
    location_suitability: "Location Suitability",
    therapeutic_alignment: "Therapeutic Alignment",
  };
  return labels[factor] ?? factor;
}

// ── Area Label ────────────────────────────────────────────────────────────

function areaLabel(area: string): string {
  const labels: Record<string, string> = {
    education_engagement: "Education Engagement",
    health_wellbeing: "Health & Wellbeing",
    behaviour_progress: "Behaviour Progress",
    emotional_regulation: "Emotional Regulation",
    social_relationships: "Social Relationships",
    independent_skills: "Independent Skills",
  };
  return labels[area] ?? area;
}

// ── Disruption Factor Label ───────────────────────────────────────────────

function disruptionFactorLabel(factor: string): string {
  const labels: Record<string, string> = {
    peer_conflict: "Peer Conflict",
    staff_relationship: "Staff Relationship",
    education_breakdown: "Education Breakdown",
    family_contact_issues: "Family Contact Issues",
    mental_health_crisis: "Mental Health Crisis",
    substance_misuse: "Substance Misuse",
    criminal_exploitation: "Criminal Exploitation",
    absconding: "Absconding",
    behavioural_escalation: "Behavioural Escalation",
    environmental_change: "Environmental Change",
  };
  return labels[factor] ?? factor;
}

// ── Main Widget ────────────────────────────────────────────────────────────

export function PlacementStabilityDashboardWidget() {
  const [data, setData] = useState<PlacementStabilityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/placement-stability");
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
        <h3 className="font-semibold text-red-800">Placement Stability Intelligence</h3>
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
            Placement Stability Intelligence
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {data.periodStart} to {data.periodEnd} | {data.placementDuration.totalPlacements} placements |{" "}
            {data.placementDuration.activePlacements} active
          </p>
        </div>
        <RatingBadge score={data.overallScore} rating={data.rating} />
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <MetricCard
          label="Active Placements"
          value={data.placementDuration.activePlacements}
          subValue={`${data.placementDuration.averageDurationDays} avg days`}
          color="text-blue-700 bg-blue-50"
        />
        <MetricCard
          label="Disruptions"
          value={data.disruptionManagement.totalDisruptions}
          subValue={`${data.disruptionManagement.preventionSuccessRate}% prevented`}
          color="text-purple-700 bg-purple-50"
        />
        <MetricCard
          label="Avg Match Score"
          value={`${data.matchingQuality.averageOverallScore}/5`}
          subValue={`${data.matchingQuality.totalAssessments} assessments`}
          color="text-teal-700 bg-teal-50"
        />
        <MetricCard
          label="Improvement Rate"
          value={`${data.outcomesDuringPlacement.improvementRate}%`}
          subValue={`${data.outcomesDuringPlacement.totalOutcomes} reviews`}
          color="text-green-700 bg-green-50"
        />
      </div>

      {/* Component Scores */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-800 mb-2">Component Scores</h4>
        <div className="bg-gray-50 rounded-lg p-3 space-y-1">
          <ScoreBar
            label="Duration & Stability"
            score={data.componentScores.placementDurationStability}
            maxScore={25}
          />
          <ScoreBar
            label="Disruption Mgmt"
            score={data.componentScores.disruptionManagement}
            maxScore={25}
          />
          <ScoreBar
            label="Matching Quality"
            score={data.componentScores.matchingQuality}
            maxScore={25}
          />
          <ScoreBar
            label="Outcomes"
            score={data.componentScores.outcomesDuringPlacement}
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
              <ChildProfileRow key={profile.placementId} profile={profile} />
            ))
          ) : (
            <p className="text-xs text-gray-400">No children in placement during this period</p>
          )}
        </div>
      </ExpandableSection>

      {/* Expandable: Disruption Management */}
      <ExpandableSection title="Disruption Management">
        <div className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <MetricCard
              label="Anticipated"
              value={`${data.disruptionManagement.anticipatedRate}%`}
              color={data.disruptionManagement.anticipatedRate >= 70 ? "text-green-700 bg-green-50" : "text-orange-700 bg-orange-50"}
            />
            <MetricCard
              label="Prevention Attempted"
              value={`${data.disruptionManagement.preventionAttemptedRate}%`}
              color={data.disruptionManagement.preventionAttemptedRate >= 80 ? "text-green-700 bg-green-50" : "text-orange-700 bg-orange-50"}
            />
            <MetricCard
              label="Prevention Success"
              value={`${data.disruptionManagement.preventionSuccessRate}%`}
              color={data.disruptionManagement.preventionSuccessRate >= 60 ? "text-green-700 bg-green-50" : "text-red-700 bg-red-50"}
            />
          </div>
          {data.disruptionManagement.topFactors.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-3">
              <h5 className="text-xs font-semibold text-gray-600 mb-2">Top Disruption Factors</h5>
              {data.disruptionManagement.topFactors.map((f) => (
                <div key={f.factor} className="flex items-center justify-between py-1 text-xs">
                  <span className="text-gray-600">{disruptionFactorLabel(f.factor)}</span>
                  <span className="font-medium text-gray-700">{f.count}</span>
                </div>
              ))}
            </div>
          )}
          <div className="bg-gray-50 rounded-lg p-3">
            <h5 className="text-xs font-semibold text-gray-600 mb-2">Severity Breakdown</h5>
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div>
                <div className="font-bold text-green-700">{data.disruptionManagement.severityBreakdown.low}</div>
                <div className="text-gray-400">Low</div>
              </div>
              <div>
                <div className="font-bold text-yellow-700">{data.disruptionManagement.severityBreakdown.medium}</div>
                <div className="text-gray-400">Medium</div>
              </div>
              <div>
                <div className="font-bold text-orange-700">{data.disruptionManagement.severityBreakdown.high}</div>
                <div className="text-gray-400">High</div>
              </div>
              <div>
                <div className="font-bold text-red-700">{data.disruptionManagement.severityBreakdown.critical}</div>
                <div className="text-gray-400">Critical</div>
              </div>
            </div>
          </div>
        </div>
      </ExpandableSection>

      {/* Expandable: Matching Quality */}
      <ExpandableSection title="Matching Quality">
        <div className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <MetricCard
              label="Impact Assessment"
              value={`${data.matchingQuality.impactAssessmentRate}%`}
              color={data.matchingQuality.impactAssessmentRate >= 80 ? "text-green-700 bg-green-50" : "text-orange-700 bg-orange-50"}
            />
            <MetricCard
              label="Children Consulted"
              value={`${data.matchingQuality.childrenConsultedRate}%`}
              color={data.matchingQuality.childrenConsultedRate >= 80 ? "text-green-700 bg-green-50" : "text-orange-700 bg-orange-50"}
            />
            <MetricCard
              label="Child Views"
              value={`${data.matchingQuality.childViewsRate}%`}
              color={data.matchingQuality.childViewsRate >= 80 ? "text-green-700 bg-green-50" : "text-orange-700 bg-orange-50"}
            />
            <MetricCard
              label="Risk Assessment"
              value={`${data.matchingQuality.riskAssessmentRate}%`}
              color={data.matchingQuality.riskAssessmentRate >= 80 ? "text-green-700 bg-green-50" : "text-red-700 bg-red-50"}
            />
          </div>
          {data.matchingQuality.factorBreakdown.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-3">
              <h5 className="text-xs font-semibold text-gray-600 mb-2">Factor Averages</h5>
              {data.matchingQuality.factorBreakdown.map((f) => (
                <ScoreBar
                  key={f.factor}
                  label={factorLabel(f.factor)}
                  score={f.averageScore}
                  maxScore={5}
                />
              ))}
            </div>
          )}
        </div>
      </ExpandableSection>

      {/* Expandable: Outcomes During Placement */}
      <ExpandableSection title="Outcomes During Placement">
        <div className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <MetricCard
              label="Education Attendance"
              value={`${data.outcomesDuringPlacement.averageEducationAttendance}%`}
              color={data.outcomesDuringPlacement.averageEducationAttendance >= 80 ? "text-green-700 bg-green-50" : "text-orange-700 bg-orange-50"}
            />
            <MetricCard
              label="Health Appointments"
              value={`${data.outcomesDuringPlacement.healthAppointmentRate}%`}
              color={data.outcomesDuringPlacement.healthAppointmentRate >= 80 ? "text-green-700 bg-green-50" : "text-orange-700 bg-orange-50"}
            />
            <MetricCard
              label="Care Plan Up To Date"
              value={`${data.outcomesDuringPlacement.carePlanUpToDateRate}%`}
              color={data.outcomesDuringPlacement.carePlanUpToDateRate >= 80 ? "text-green-700 bg-green-50" : "text-red-700 bg-red-50"}
            />
          </div>
          {data.outcomesDuringPlacement.areaBreakdown.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-3">
              <h5 className="text-xs font-semibold text-gray-600 mb-2">Outcome Area Averages</h5>
              {data.outcomesDuringPlacement.areaBreakdown.map((a) => (
                <ScoreBar
                  key={a.area}
                  label={areaLabel(a.area)}
                  score={a.averageRating}
                  maxScore={5}
                />
              ))}
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

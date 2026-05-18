"use client";

// ══════════════════════════════════════════════════════════════════════════════
// ADMISSIONS & MATCHING INTELLIGENCE DASHBOARD WIDGET
//
// Displays admissions and matching quality intelligence:
// - Overall score with Ofsted-aligned rating
// - Key metrics row (referrals, matching, introductions, outcomes)
// - Expandable sections: Referral Timeline, Matching Quality,
//   Introduction Planning, Admission Outcomes, Strengths/Areas/Actions,
//   Regulatory Framework
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";

// ── Interfaces ─────────────────────────────────────────────────────────────

interface CriterionBreakdown {
  criterion: string;
  averageScore: number;
  count: number;
}

interface TimelineMilestone {
  label: string;
  date: string;
  daysFromReferral: number;
}

interface ReferralTimeline {
  referralId: string;
  childName: string;
  referralDate: string;
  currentStatus: string;
  milestones: TimelineMilestone[];
  totalDurationDays: number;
  hasAssessment: boolean;
  hasIntroductionPlan: boolean;
  hasAdmissionOutcome: boolean;
}

interface AdmissionsMatchingData {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  referenceDate: string;
  overallScore: number;
  rating: string;
  referralProcessing: {
    totalReferrals: number;
    acceptedCount: number;
    declinedCount: number;
    withdrawnCount: number;
    onHoldCount: number;
    inProgressCount: number;
    acceptanceRate: number;
    declineReasons: Record<string, number>;
    averageProcessingDays: number;
    screeningTimelinessRate: number;
  };
  matchingQuality: {
    totalAssessments: number;
    averageOverallScore: number;
    criterionBreakdown: CriterionBreakdown[];
    fullCriteriaAssessedRate: number;
    groupDynamicsConsiderationRate: number;
    recommendationBreakdown: { accept: number; decline: number; further_info_needed: number };
  };
  introductionPlanning: {
    totalPlans: number;
    welcomePackRate: number;
    childrenConsultedRate: number;
    childVoiceRate: number;
    phaseCompletionRate: number;
    averagePhasesCompleted: number;
    keyWorkerAssignedRate: number;
  };
  admissionOutcomes: {
    totalOutcomes: number;
    settlingInReviewRate: number;
    initialCareplanRate: number;
    placementPlanSignedRate: number;
    existingChildrenFeedbackRate: number;
  };
  referralTimelines: ReferralTimeline[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
  componentScores: {
    referralProcessing: number;
    matchingQuality: number;
    introductionPlanning: number;
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

// ── Timeline Row ───────────────────────────────────────────────────────────

function TimelineRow({ timeline }: { timeline: ReferralTimeline }) {
  const statusColors: Record<string, string> = {
    accepted: "bg-green-100 text-green-700",
    declined: "bg-red-100 text-red-700",
    withdrawn: "bg-gray-100 text-gray-600",
    assessment: "bg-blue-100 text-blue-700",
    screening: "bg-yellow-100 text-yellow-700",
    received: "bg-gray-100 text-gray-500",
    on_hold: "bg-orange-100 text-orange-700",
  };

  const statusLabels: Record<string, string> = {
    accepted: "Accepted",
    declined: "Declined",
    withdrawn: "Withdrawn",
    assessment: "In Assessment",
    screening: "Screening",
    received: "Received",
    on_hold: "On Hold",
  };

  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{timeline.childName}</span>
          <span className="text-xs text-gray-400">{timeline.referralDate}</span>
        </div>
        <div className="text-[10px] text-gray-400 mt-0.5">
          {timeline.milestones.length} milestones | {timeline.totalDurationDays} days
        </div>
      </div>
      <span
        className={`text-xs font-medium px-2 py-0.5 rounded shrink-0 ${statusColors[timeline.currentStatus] ?? "bg-gray-100 text-gray-600"}`}
      >
        {statusLabels[timeline.currentStatus] ?? timeline.currentStatus}
      </span>
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

// ── Criterion Label ────────────────────────────────────────────────────────

function criterionLabel(criterion: string): string {
  const labels: Record<string, string> = {
    age_compatibility: "Age Compatibility",
    gender_dynamics: "Gender Dynamics",
    needs_compatibility: "Needs Compatibility",
    risk_assessment: "Risk Assessment",
    cultural_needs: "Cultural Needs",
    educational_needs: "Educational Needs",
    therapeutic_needs: "Therapeutic Needs",
    group_dynamics: "Group Dynamics",
    location_proximity: "Location Proximity",
    statement_of_purpose_fit: "Statement of Purpose Fit",
  };
  return labels[criterion] ?? criterion;
}

// ── Main Widget ────────────────────────────────────────────────────────────

export function AdmissionsMatchingDashboardWidget() {
  const [data, setData] = useState<AdmissionsMatchingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/admissions-matching");
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
        <h3 className="font-semibold text-red-800">Admissions & Matching Intelligence</h3>
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
            Admissions & Matching Intelligence
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {data.periodStart} to {data.periodEnd} | {data.referralProcessing.totalReferrals} referrals |{" "}
            {data.matchingQuality.totalAssessments} assessments
          </p>
        </div>
        <RatingBadge score={data.overallScore} rating={data.rating} />
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <MetricCard
          label="Referrals"
          value={data.referralProcessing.totalReferrals}
          subValue={`${data.referralProcessing.acceptanceRate}% accepted`}
          color="text-blue-700 bg-blue-50"
        />
        <MetricCard
          label="Avg Match Score"
          value={`${data.matchingQuality.averageOverallScore}/5`}
          subValue={`${data.matchingQuality.fullCriteriaAssessedRate}% full criteria`}
          color="text-purple-700 bg-purple-50"
        />
        <MetricCard
          label="Child Voice"
          value={`${data.introductionPlanning.childVoiceRate}%`}
          subValue={`${data.introductionPlanning.totalPlans} plans`}
          color="text-teal-700 bg-teal-50"
        />
        <MetricCard
          label="Care Plans"
          value={`${data.admissionOutcomes.initialCareplanRate}%`}
          subValue={`${data.admissionOutcomes.totalOutcomes} admissions`}
          color="text-green-700 bg-green-50"
        />
      </div>

      {/* Component Scores */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-800 mb-2">Component Scores</h4>
        <div className="bg-gray-50 rounded-lg p-3 space-y-1">
          <ScoreBar
            label="Referral Processing"
            score={data.componentScores.referralProcessing}
            maxScore={20}
          />
          <ScoreBar
            label="Matching Quality"
            score={data.componentScores.matchingQuality}
            maxScore={30}
          />
          <ScoreBar
            label="Introductions"
            score={data.componentScores.introductionPlanning}
            maxScore={25}
          />
          <ScoreBar
            label="Outcomes"
            score={data.componentScores.admissionOutcomes}
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

      {/* Expandable: Referral Timeline */}
      <ExpandableSection title="Referral Timeline">
        <div className="bg-gray-50 rounded-lg p-3">
          {data.referralTimelines.length > 0 ? (
            data.referralTimelines.map((timeline) => (
              <TimelineRow key={timeline.referralId} timeline={timeline} />
            ))
          ) : (
            <p className="text-xs text-gray-400">No referrals in this period</p>
          )}
        </div>
      </ExpandableSection>

      {/* Expandable: Matching Quality */}
      <ExpandableSection title="Matching Quality">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <MetricCard
              label="Group Dynamics Rate"
              value={`${data.matchingQuality.groupDynamicsConsiderationRate}%`}
              color="text-indigo-700 bg-indigo-50"
            />
            <MetricCard
              label="Full Criteria Rate"
              value={`${data.matchingQuality.fullCriteriaAssessedRate}%`}
              color="text-violet-700 bg-violet-50"
            />
          </div>
          {data.matchingQuality.criterionBreakdown.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-3">
              <h5 className="text-xs font-semibold text-gray-600 mb-2">Criterion Averages</h5>
              {data.matchingQuality.criterionBreakdown.map((c) => (
                <ScoreBar
                  key={c.criterion}
                  label={criterionLabel(c.criterion)}
                  score={c.averageScore}
                  maxScore={5}
                />
              ))}
            </div>
          )}
        </div>
      </ExpandableSection>

      {/* Expandable: Introduction Planning */}
      <ExpandableSection title="Introduction Planning">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          <MetricCard
            label="Welcome Pack"
            value={`${data.introductionPlanning.welcomePackRate}%`}
            color={data.introductionPlanning.welcomePackRate >= 80 ? "text-green-700 bg-green-50" : "text-orange-700 bg-orange-50"}
          />
          <MetricCard
            label="Children Consulted"
            value={`${data.introductionPlanning.childrenConsultedRate}%`}
            color={data.introductionPlanning.childrenConsultedRate >= 80 ? "text-green-700 bg-green-50" : "text-orange-700 bg-orange-50"}
          />
          <MetricCard
            label="Child Voice"
            value={`${data.introductionPlanning.childVoiceRate}%`}
            color={data.introductionPlanning.childVoiceRate >= 80 ? "text-green-700 bg-green-50" : "text-orange-700 bg-orange-50"}
          />
          <MetricCard
            label="Phase Completion"
            value={`${data.introductionPlanning.phaseCompletionRate}%`}
            color={data.introductionPlanning.phaseCompletionRate >= 80 ? "text-green-700 bg-green-50" : "text-orange-700 bg-orange-50"}
          />
          <MetricCard
            label="Avg Phases"
            value={data.introductionPlanning.averagePhasesCompleted}
            subValue="of 5 phases"
            color="text-gray-700 bg-gray-50"
          />
          <MetricCard
            label="Key Worker Assigned"
            value={`${data.introductionPlanning.keyWorkerAssignedRate}%`}
            color={data.introductionPlanning.keyWorkerAssignedRate >= 80 ? "text-green-700 bg-green-50" : "text-orange-700 bg-orange-50"}
          />
        </div>
      </ExpandableSection>

      {/* Expandable: Admission Outcomes */}
      <ExpandableSection title="Admission Outcomes">
        <div className="grid grid-cols-2 gap-2">
          <MetricCard
            label="Settling-in Review"
            value={`${data.admissionOutcomes.settlingInReviewRate}%`}
            color={data.admissionOutcomes.settlingInReviewRate >= 80 ? "text-green-700 bg-green-50" : "text-red-700 bg-red-50"}
          />
          <MetricCard
            label="Initial Care Plan"
            value={`${data.admissionOutcomes.initialCareplanRate}%`}
            color={data.admissionOutcomes.initialCareplanRate >= 80 ? "text-green-700 bg-green-50" : "text-red-700 bg-red-50"}
          />
          <MetricCard
            label="Placement Plan Signed"
            value={`${data.admissionOutcomes.placementPlanSignedRate}%`}
            color={data.admissionOutcomes.placementPlanSignedRate >= 80 ? "text-green-700 bg-green-50" : "text-red-700 bg-red-50"}
          />
          <MetricCard
            label="Children Feedback"
            value={`${data.admissionOutcomes.existingChildrenFeedbackRate}%`}
            color={data.admissionOutcomes.existingChildrenFeedbackRate >= 80 ? "text-green-700 bg-green-50" : "text-orange-700 bg-orange-50"}
          />
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

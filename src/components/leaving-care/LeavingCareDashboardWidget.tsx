"use client";

// ══════════════════════════════════════════════════════════════════════════════
// LEAVING CARE PREPARATION INTELLIGENCE DASHBOARD WIDGET
//
// Displays leaving care preparation intelligence:
// - Overall score and rating
// - Domain score bars (pathway, skills, accommodation, support)
// - Child profiles showing readiness
// - Expandable sections for strengths, areas, regulatory links
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";

interface SkillCategoryData {
  skill: string;
  label: string;
  childCount: number;
  averageLevel: number;
  competentCount: number;
}

interface ChildProfileData {
  childId: string;
  childName: string;
  age: number;
  hasPathwayPlan: boolean;
  pathwayPlanStatus?: string;
  pathwayPlanStatusLabel?: string;
  goalAchievementRate: number;
  independenceSkillLevel: number;
  skillsAssessed: number;
  skillsCompetent: number;
  accommodationStatus?: string;
  accommodationStatusLabel?: string;
  accommodationType?: string;
  accommodationTypeLabel?: string;
  activeSupportCount: number;
  hasPersonalAdviser: boolean;
  overallReadiness: number;
  readinessLabel: string;
  primaryConcern?: string;
}

interface DomainScore {
  score: number;
  maxScore: number;
}

interface LeavingCareData {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: string;
  pathwayPlanning: DomainScore & {
    totalPlansRequired: number;
    plansInPlace: number;
    plansOverdue: number;
    youngPersonInvolvementRate: number;
    averageGoalAchievementRate: number;
    planCompletenessRate: number;
  };
  independenceSkills: DomainScore & {
    totalAssessments: number;
    averageSkillLevel: number;
    skillsAtCompetentOrAbove: number;
    skillsImproving: number;
    coverageRate: number;
    progressRate: number;
    categoryBreakdown: SkillCategoryData[];
  };
  accommodationPlanning: DomainScore & {
    totalChildrenRequiringPlan: number;
    optionsIdentified: number;
    transitionPlansInPlace: number;
    stayingPutAvailable: number;
    stayingCloseAvailable: number;
    notStartedCount: number;
    confirmationRate: number;
  };
  supportNetwork: DomainScore & {
    totalArrangements: number;
    activeArrangements: number;
    personalAdvisersAssigned: number;
    mentorsActive: number;
    supportTypeCoverage: number;
    averageSupportPerChild: number;
    childrenWithNoSupport: number;
  };
  childProfiles: ChildProfileData[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
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

// ── Domain Score Bar ───────────────────────────────────────────────────────

function DomainScoreBar({
  label,
  score,
  maxScore,
}: {
  label: string;
  score: number;
  maxScore: number;
}) {
  const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  const barColor =
    pct >= 80
      ? "bg-green-500"
      : pct >= 60
        ? "bg-blue-500"
        : pct >= 40
          ? "bg-orange-500"
          : "bg-red-500";

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-600 w-40 truncate">{label}</span>
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-semibold w-16 text-right">
        {score}/{maxScore}
      </span>
    </div>
  );
}

// ── Child Readiness Card ──────────────────────────────────────────────────

function ChildReadinessCard({ child }: { child: ChildProfileData }) {
  const readinessColor =
    child.overallReadiness >= 80
      ? "text-green-700"
      : child.overallReadiness >= 60
        ? "text-blue-700"
        : child.overallReadiness >= 40
          ? "text-orange-700"
          : "text-red-700";
  const barColor =
    child.overallReadiness >= 80
      ? "bg-green-500"
      : child.overallReadiness >= 60
        ? "bg-blue-500"
        : child.overallReadiness >= 40
          ? "bg-orange-500"
          : "bg-red-500";

  return (
    <div
      className={`rounded-lg border p-3 ${child.primaryConcern ? "border-red-200 bg-red-50" : "border-gray-200"}`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{child.childName}</span>
          <span className="text-[10px] text-gray-500">age {child.age}</span>
        </div>
        <span className={`text-xs font-semibold ${readinessColor}`}>
          {child.readinessLabel}
        </span>
      </div>

      {/* Readiness bar */}
      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden mb-2">
        <div
          className={`h-full rounded-full ${barColor}`}
          style={{ width: `${child.overallReadiness}%` }}
        />
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="text-xs text-gray-500">Skills</div>
          <div className="text-sm font-bold text-gray-800">
            {child.skillsAssessed > 0
              ? `${child.skillsCompetent}/${child.skillsAssessed}`
              : "---"}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Goals</div>
          <div className="text-sm font-bold text-gray-800">
            {child.hasPathwayPlan ? `${child.goalAchievementRate}%` : "---"}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Support</div>
          <div className="text-sm font-bold text-gray-800">
            {child.activeSupportCount}
          </div>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1 mt-2">
        {child.hasPathwayPlan && child.pathwayPlanStatusLabel && (
          <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
            Plan: {child.pathwayPlanStatusLabel}
          </span>
        )}
        {child.hasPersonalAdviser && (
          <span className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
            PA assigned
          </span>
        )}
        {child.accommodationTypeLabel && (
          <span className="text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
            {child.accommodationTypeLabel}
          </span>
        )}
      </div>

      {child.primaryConcern && (
        <div className="mt-2 text-[10px] text-red-700 bg-red-100 rounded px-2 py-1">
          {child.primaryConcern}
        </div>
      )}
    </div>
  );
}

// ── Main Widget ────────────────────────────────────────────────────────────

export function LeavingCareDashboardWidget() {
  const [data, setData] = useState<LeavingCareData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/leaving-care");
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
        <div className="h-24 bg-gray-100 rounded" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white border border-red-200 rounded-xl p-6">
        <h3 className="font-semibold text-red-800">
          Leaving Care Preparation Intelligence
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
            Leaving Care Preparation Intelligence
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {data.childProfiles.length} young people | Reg 14 preparation |
            CA 1989 s23C/24
          </p>
        </div>
        <RatingBadge score={data.overallScore} rating={data.rating} />
      </div>

      {/* Domain Score Bars */}
      <div className="space-y-2 mb-4">
        <DomainScoreBar
          label="Pathway Planning"
          score={data.pathwayPlanning.score}
          maxScore={data.pathwayPlanning.maxScore}
        />
        <DomainScoreBar
          label="Independence Skills"
          score={data.independenceSkills.score}
          maxScore={data.independenceSkills.maxScore}
        />
        <DomainScoreBar
          label="Accommodation Planning"
          score={data.accommodationPlanning.score}
          maxScore={data.accommodationPlanning.maxScore}
        />
        <DomainScoreBar
          label="Support Network"
          score={data.supportNetwork.score}
          maxScore={data.supportNetwork.maxScore}
        />
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="text-center p-2 bg-blue-50 rounded-lg">
          <div className="text-xl font-bold text-blue-700">
            {data.pathwayPlanning.plansInPlace}/
            {data.pathwayPlanning.totalPlansRequired}
          </div>
          <div className="text-[10px] text-gray-500 uppercase">
            Plans In Place
          </div>
        </div>
        <div className="text-center p-2 bg-green-50 rounded-lg">
          <div className="text-xl font-bold text-green-700">
            {data.independenceSkills.coverageRate}%
          </div>
          <div className="text-[10px] text-gray-500 uppercase">
            Skills Coverage
          </div>
        </div>
        <div className="text-center p-2 bg-purple-50 rounded-lg">
          <div className="text-xl font-bold text-purple-700">
            {data.accommodationPlanning.confirmationRate}%
          </div>
          <div className="text-[10px] text-gray-500 uppercase">
            Accommodation Confirmed
          </div>
        </div>
        <div className="text-center p-2 bg-orange-50 rounded-lg">
          <div className="text-xl font-bold text-orange-700">
            {data.supportNetwork.personalAdvisersAssigned}
          </div>
          <div className="text-[10px] text-gray-500 uppercase">
            PAs Assigned
          </div>
        </div>
      </div>

      {/* Alert tags */}
      {(data.pathwayPlanning.plansOverdue > 0 ||
        data.accommodationPlanning.notStartedCount > 0 ||
        data.supportNetwork.childrenWithNoSupport > 0) && (
        <div className="flex flex-wrap gap-2 mb-4">
          {data.pathwayPlanning.plansOverdue > 0 && (
            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
              {data.pathwayPlanning.plansOverdue} plan
              {data.pathwayPlanning.plansOverdue !== 1 ? "s" : ""} overdue
            </span>
          )}
          {data.accommodationPlanning.notStartedCount > 0 && (
            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
              {data.accommodationPlanning.notStartedCount} accommodation not
              started
            </span>
          )}
          {data.supportNetwork.childrenWithNoSupport > 0 && (
            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
              {data.supportNetwork.childrenWithNoSupport} without support
            </span>
          )}
        </div>
      )}

      {/* Child Readiness Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        {data.childProfiles.map((child) => (
          <ChildReadinessCard key={child.childId} child={child} />
        ))}
      </div>

      {/* Immediate Actions */}
      {data.actions.length > 0 &&
        !data.actions[0].startsWith("No immediate actions") && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
            <h4 className="text-sm font-semibold text-amber-800 mb-2">
              Required Actions
            </h4>
            <ul className="space-y-1">
              {data.actions.map((action, i) => (
                <li
                  key={i}
                  className="text-xs text-amber-700 flex items-start gap-1.5"
                >
                  <span className="mt-0.5 shrink-0">
                    {action.startsWith("URGENT")
                      ? "●"
                      : action.startsWith("HIGH")
                        ? "○"
                        : "▪"}
                  </span>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

      {/* Expand */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-sm text-blue-600 hover:text-blue-800 font-medium w-full text-left"
      >
        {expanded
          ? "Hide details"
          : "Show strengths, areas for improvement & regulatory links"}
      </button>

      {expanded && (
        <div className="mt-4 space-y-4">
          {/* Skills Breakdown */}
          {data.independenceSkills.categoryBreakdown.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-800 mb-2">
                Independence Skills by Category
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {data.independenceSkills.categoryBreakdown.map((cat) => (
                  <div
                    key={cat.skill}
                    className="flex items-center justify-between text-xs p-1.5 bg-gray-50 rounded"
                  >
                    <span className="text-gray-600 truncate">{cat.label}</span>
                    <span className="font-semibold ml-2">
                      {cat.childCount > 0
                        ? `${cat.averageLevel.toFixed(1)}/4`
                        : "---"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Strengths */}
          {data.strengths.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-green-800 mb-2">
                Strengths
              </h4>
              <ul className="space-y-1">
                {data.strengths.map((s, i) => (
                  <li key={i} className="text-xs text-green-700">
                    + {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Areas for Improvement */}
          {data.areasForImprovement.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-orange-800 mb-2">
                Areas for Improvement
              </h4>
              <ul className="space-y-1">
                {data.areasForImprovement.map((area, i) => (
                  <li key={i} className="text-xs text-orange-700">
                    - {area}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Regulatory Links */}
          {data.regulatoryLinks.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-800 mb-2">
                Regulatory References
              </h4>
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

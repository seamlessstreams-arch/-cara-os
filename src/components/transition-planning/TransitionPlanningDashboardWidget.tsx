"use client";

// ══════════════════════════════════════════════════════════════════════════════
// TRANSITION & PATHWAY PLANNING DASHBOARD WIDGET
//
// Displays transition planning intelligence:
// - Overall transition readiness rating
// - Plan currency, goal achievement, independence readiness, placement stability
// - Child transition profiles with skill gaps and concerns
// - Expandable sections for detailed analysis
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";

// ── Data Interfaces ────────────────────────────────────────────────────────

interface SkillRatingData {
  category: string;
  confidence: string;
  notes?: string;
}

interface SkillProfileData {
  childId: string;
  childName: string;
  averageConfidence: number;
  skillGaps: string[];
  strongSkills: string[];
  assessmentCount: number;
  latestAssessmentDate: string;
  skillBreakdown: SkillRatingData[];
}

interface CategoryBreakdownData {
  category: string;
  total: number;
  achieved: number;
  rate: number;
}

interface CategoryAverageData {
  category: string;
  average: number;
}

interface GoalData {
  id: string;
  description: string;
  category: string;
  targetDate: string;
  status: string;
  evidence?: string;
}

interface ChildProfileData {
  childId: string;
  childName: string;
  planStatus: string;
  transitionType: string;
  targetDate: string | null;
  skillReadinessScore: number;
  skillGaps: string[];
  goalAchievementRate: number;
  placementStability: string;
  previousPlacements: number;
  childVoiceRecorded: boolean;
  primaryConcern?: string;
}

interface TransitionPlanningData {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: string;
  planningQuality: {
    planCurrencyRate: number;
    childVoiceRate: number;
    multiAgencyRate: number;
    overduePlans: number;
    goalAchievementRate: number;
    totalPlans: number;
    activePlans: number;
    reviewedPlans: number;
    completedPlans: number;
    draftPlans: number;
    familyInvolvementRate: number;
    socialWorkerRate: number;
  };
  independenceReadiness: {
    profiles: SkillProfileData[];
    overallAverageConfidence: number;
    skillGaps: string[];
    strongestSkills: string[];
    categoryAverages: CategoryAverageData[];
  };
  goalProgress: {
    totalGoals: number;
    achieved: number;
    inProgress: number;
    notStarted: number;
    deferred: number;
    achievementRate: number;
    categoryBreakdown: CategoryBreakdownData[];
    deferredGoals: GoalData[];
    goalsNearingDeadline: GoalData[];
  };
  placementStability: {
    averagePreviousPlacements: number;
    totalDisruptionRisks: number;
    totalStabilityFactors: number;
    childrenWithHighRisk: number;
    childrenStable: number;
    averageDisruptionRisks: number;
  };
  childProfiles: ChildProfileData[];
  strengths: string[];
  areasForDevelopment: string[];
  immediateActions: string[];
  regulatoryLinks: string[];
  meta?: {
    transitionTypeLabels?: Record<string, string>;
    planStatusLabels?: Record<string, string>;
    skillCategoryLabels?: Record<string, string>;
    confidenceLevelLabels?: Record<string, string>;
  };
}

// ── Rating Badge ───────────────────────────────────────────────────────────

function RatingBadge({ score, rating }: { score: number; rating: string }) {
  const colorClass =
    rating === "outstanding" ? "bg-green-100 text-green-800 border-green-300"
      : rating === "good" ? "bg-blue-100 text-blue-800 border-blue-300"
        : rating === "requires_improvement" ? "bg-orange-100 text-orange-800 border-orange-300"
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

// ── Confidence Bar ─────────────────────────────────────────────────────────

function ConfidenceBar({ level, label }: { level: string; label?: string }) {
  const widths: Record<string, string> = {
    not_started: "0%",
    emerging: "25%",
    developing: "50%",
    competent: "75%",
    independent: "100%",
  };
  const colors: Record<string, string> = {
    not_started: "bg-gray-300",
    emerging: "bg-red-400",
    developing: "bg-orange-400",
    competent: "bg-blue-500",
    independent: "bg-green-500",
  };

  return (
    <div className="flex items-center gap-2">
      {label && <span className="text-xs text-gray-600 w-28 truncate">{label}</span>}
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${colors[level] ?? "bg-gray-300"}`}
          style={{ width: widths[level] ?? "0%" }}
        />
      </div>
      <span className="text-[10px] text-gray-500 w-16 text-right capitalize">{(level ?? "").replace(/_/g, " ")}</span>
    </div>
  );
}

// ── Stability Badge ───────────────────────────────────────────────────────

function StabilityBadge({ stability }: { stability: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    stable: { bg: "bg-green-100", text: "text-green-700", label: "Stable" },
    at_risk: { bg: "bg-orange-100", text: "text-orange-700", label: "At Risk" },
    high_risk: { bg: "bg-red-100", text: "text-red-700", label: "High Risk" },
    unknown: { bg: "bg-gray-100", text: "text-gray-600", label: "Unknown" },
  };
  const c = config[stability] ?? config.unknown;
  return <span className={`text-[10px] px-1.5 py-0.5 rounded ${c.bg} ${c.text}`}>{c.label}</span>;
}

// ── Child Transition Card ────────────────────────────────────────────────

function ChildTransitionCard({ child, meta }: { child: ChildProfileData; meta?: TransitionPlanningData["meta"] }) {
  const rateColor = (r: number) =>
    r >= 80 ? "text-green-700" : r >= 60 ? "text-blue-700" : r >= 40 ? "text-orange-700" : "text-red-700";

  const typeLabel = meta?.transitionTypeLabels?.[child.transitionType] ?? child.transitionType.replace(/_/g, " ");
  const statusLabel = meta?.planStatusLabels?.[child.planStatus] ?? child.planStatus.replace(/_/g, " ");

  return (
    <div className={`rounded-lg border p-3 ${child.primaryConcern ? "border-red-200 bg-red-50" : "border-gray-200"}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-sm">{child.childName}</span>
        <StabilityBadge stability={child.placementStability} />
      </div>
      <div className="text-[10px] text-gray-500 mb-2">
        {child.planStatus !== "no_plan" ? (
          <>{typeLabel} &middot; {statusLabel} &middot; Target: {child.targetDate ?? "N/A"}</>
        ) : (
          <span className="text-red-600 font-medium">No transition plan in place</span>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="text-xs text-gray-500">Skills</div>
          <div className={`text-sm font-bold ${rateColor(child.skillReadinessScore)}`}>{child.skillReadinessScore}%</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Goals</div>
          <div className={`text-sm font-bold ${rateColor(child.goalAchievementRate)}`}>{child.goalAchievementRate}%</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Placements</div>
          <div className="text-sm font-bold text-gray-800">{child.previousPlacements}</div>
        </div>
      </div>
      {child.skillGaps.length > 0 && (
        <div className="mt-2 text-[10px] text-gray-500">
          Gaps: {child.skillGaps.map((g) => meta?.skillCategoryLabels?.[g] ?? g.replace(/_/g, " ")).join(", ")}
        </div>
      )}
      {child.primaryConcern && (
        <div className="mt-2 text-[10px] text-red-700 bg-red-100 rounded px-2 py-1">{child.primaryConcern}</div>
      )}
    </div>
  );
}

// ── Expandable Section ───────────────────────────────────────────────────

function ExpandableSection({ title, children, defaultOpen }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  return (
    <div className="border border-gray-200 rounded-lg">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 flex items-center justify-between"
      >
        {title}
        <span className="text-xs text-gray-400">{open ? "▲" : "▼"}</span>
      </button>
      {open && <div className="px-3 pb-3">{children}</div>}
    </div>
  );
}

// ── Main Widget ──────────────────────────────────────────────────────────

export function TransitionPlanningDashboardWidget() {
  const [data, setData] = useState<TransitionPlanningData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/transition-planning");
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
        <h3 className="font-semibold text-red-800">Transition Planning Intelligence</h3>
        <p className="text-sm text-red-600 mt-1">{error ?? "No data available"}</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900 text-lg">Transition & Pathway Planning</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {data.planningQuality.totalPlans} plans | {data.goalProgress.totalGoals} goals tracked | Reg 14 / s23C pathway compliance
          </p>
        </div>
        <RatingBadge score={data.overallScore} rating={data.rating} />
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="text-center p-2 bg-green-50 rounded-lg">
          <div className="text-xl font-bold text-green-700">{data.planningQuality.planCurrencyRate}%</div>
          <div className="text-[10px] text-gray-500 uppercase">Plan Currency</div>
        </div>
        <div className="text-center p-2 bg-blue-50 rounded-lg">
          <div className="text-xl font-bold text-blue-700">{data.goalProgress.achievementRate}%</div>
          <div className="text-[10px] text-gray-500 uppercase">Goal Achievement</div>
        </div>
        <div className="text-center p-2 bg-purple-50 rounded-lg">
          <div className="text-xl font-bold text-purple-700">
            {Math.round((data.independenceReadiness.overallAverageConfidence / 4) * 100)}%
          </div>
          <div className="text-[10px] text-gray-500 uppercase">Independence Readiness</div>
        </div>
        <div className="text-center p-2 bg-orange-50 rounded-lg">
          <div className="text-xl font-bold text-orange-700">
            {data.placementStability.childrenStable}/{data.childProfiles.length}
          </div>
          <div className="text-[10px] text-gray-500 uppercase">Placements Stable</div>
        </div>
      </div>

      {/* Alert Badges */}
      {(data.planningQuality.overduePlans > 0 || data.goalProgress.goalsNearingDeadline.length > 0 || data.placementStability.childrenWithHighRisk > 0) && (
        <div className="flex flex-wrap gap-2 mb-4">
          {data.planningQuality.overduePlans > 0 && (
            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
              {data.planningQuality.overduePlans} plan{data.planningQuality.overduePlans !== 1 ? "s" : ""} overdue
            </span>
          )}
          {data.goalProgress.goalsNearingDeadline.length > 0 && (
            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
              {data.goalProgress.goalsNearingDeadline.length} goal{data.goalProgress.goalsNearingDeadline.length !== 1 ? "s" : ""} nearing deadline
            </span>
          )}
          {data.placementStability.childrenWithHighRisk > 0 && (
            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
              {data.placementStability.childrenWithHighRisk} high-risk placement{data.placementStability.childrenWithHighRisk !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      )}

      {/* Child Transition Profiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        {data.childProfiles.map((child) => (
          <ChildTransitionCard key={child.childId} child={child} meta={data.meta} />
        ))}
      </div>

      {/* Immediate Actions */}
      {data.immediateActions.length > 0 &&
        !data.immediateActions[0].startsWith("No immediate actions") && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
            <h4 className="text-sm font-semibold text-amber-800 mb-2">Required Actions</h4>
            <ul className="space-y-1">
              {data.immediateActions.map((action, i) => (
                <li key={i} className="text-xs text-amber-700 flex items-start gap-1.5">
                  <span className="mt-0.5 shrink-0">
                    {action.startsWith("URGENT") ? "●" : action.startsWith("HIGH") ? "○" : "▪"}
                  </span>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

      {/* Expandable Sections */}
      <div className="space-y-2">
        {/* Plan Analysis */}
        <ExpandableSection title="Plan Analysis">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            <div className="text-center p-2 bg-gray-50 rounded">
              <div className="text-lg font-bold text-gray-800">{data.planningQuality.activePlans}</div>
              <div className="text-[10px] text-gray-500">Active</div>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded">
              <div className="text-lg font-bold text-gray-800">{data.planningQuality.reviewedPlans}</div>
              <div className="text-[10px] text-gray-500">Reviewed</div>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded">
              <div className="text-lg font-bold text-gray-800">{data.planningQuality.completedPlans}</div>
              <div className="text-[10px] text-gray-500">Completed</div>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded">
              <div className="text-lg font-bold text-gray-800">{data.planningQuality.draftPlans}</div>
              <div className="text-[10px] text-gray-500">Draft</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-2 bg-green-50 rounded">
              <div className="text-sm font-bold text-green-700">{data.planningQuality.childVoiceRate}%</div>
              <div className="text-[10px] text-gray-500">Child Voice</div>
            </div>
            <div className="text-center p-2 bg-blue-50 rounded">
              <div className="text-sm font-bold text-blue-700">{data.planningQuality.multiAgencyRate}%</div>
              <div className="text-[10px] text-gray-500">Multi-Agency</div>
            </div>
            <div className="text-center p-2 bg-purple-50 rounded">
              <div className="text-sm font-bold text-purple-700">{data.planningQuality.familyInvolvementRate}%</div>
              <div className="text-[10px] text-gray-500">Family Involved</div>
            </div>
          </div>
        </ExpandableSection>

        {/* Independence Skills */}
        <ExpandableSection title="Independence Skills">
          {data.independenceReadiness.profiles.length > 0 ? (
            <div className="space-y-4">
              {data.independenceReadiness.profiles.map((profile) => (
                <div key={profile.childId} className="border border-gray-100 rounded p-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{profile.childName}</span>
                    <span className="text-[10px] text-gray-500">Assessed: {profile.latestAssessmentDate}</span>
                  </div>
                  <div className="space-y-1">
                    {profile.skillBreakdown.map((skill) => (
                      <ConfidenceBar
                        key={skill.category}
                        level={skill.confidence}
                        label={data.meta?.skillCategoryLabels?.[skill.category] ?? skill.category.replace(/_/g, " ")}
                      />
                    ))}
                  </div>
                </div>
              ))}
              {data.independenceReadiness.skillGaps.length > 0 && (
                <div className="text-xs text-red-600 bg-red-50 rounded p-2">
                  Global skill gaps: {data.independenceReadiness.skillGaps.map(
                    (g) => data.meta?.skillCategoryLabels?.[g] ?? g.replace(/_/g, " "),
                  ).join(", ")}
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-gray-500">No independence skills assessments recorded.</p>
          )}
        </ExpandableSection>

        {/* Goal Progress */}
        <ExpandableSection title="Goal Progress">
          <div className="grid grid-cols-4 gap-2 mb-3">
            <div className="text-center p-2 bg-green-50 rounded">
              <div className="text-lg font-bold text-green-700">{data.goalProgress.achieved}</div>
              <div className="text-[10px] text-gray-500">Achieved</div>
            </div>
            <div className="text-center p-2 bg-blue-50 rounded">
              <div className="text-lg font-bold text-blue-700">{data.goalProgress.inProgress}</div>
              <div className="text-[10px] text-gray-500">In Progress</div>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded">
              <div className="text-lg font-bold text-gray-700">{data.goalProgress.notStarted}</div>
              <div className="text-[10px] text-gray-500">Not Started</div>
            </div>
            <div className="text-center p-2 bg-orange-50 rounded">
              <div className="text-lg font-bold text-orange-700">{data.goalProgress.deferred}</div>
              <div className="text-[10px] text-gray-500">Deferred</div>
            </div>
          </div>
          {data.goalProgress.categoryBreakdown.length > 0 && (
            <div className="space-y-1">
              <h5 className="text-xs font-semibold text-gray-600 uppercase">By Category</h5>
              {data.goalProgress.categoryBreakdown.map((cat) => {
                const barColor = cat.rate >= 80 ? "bg-green-500" : cat.rate >= 50 ? "bg-blue-500" : cat.rate >= 25 ? "bg-orange-500" : "bg-red-500";
                return (
                  <div key={cat.category} className="flex items-center gap-2">
                    <span className="text-xs text-gray-600 w-28 truncate">
                      {data.meta?.skillCategoryLabels?.[cat.category] ?? cat.category.replace(/_/g, " ")}
                    </span>
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${barColor}`} style={{ width: `${cat.rate}%` }} />
                    </div>
                    <span className="text-xs font-semibold w-16 text-right">{cat.achieved}/{cat.total}</span>
                  </div>
                );
              })}
            </div>
          )}
          {data.goalProgress.goalsNearingDeadline.length > 0 && (
            <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded p-2">
              <h5 className="text-xs font-semibold text-yellow-800 mb-1">Approaching Deadline</h5>
              <ul className="space-y-0.5">
                {data.goalProgress.goalsNearingDeadline.map((goal) => (
                  <li key={goal.id} className="text-[10px] text-yellow-700">
                    {goal.description} — due {goal.targetDate}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </ExpandableSection>

        {/* Placement Stability */}
        <ExpandableSection title="Placement Stability">
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="text-center p-2 bg-green-50 rounded">
              <div className="text-lg font-bold text-green-700">{data.placementStability.childrenStable}</div>
              <div className="text-[10px] text-gray-500">Stable</div>
            </div>
            <div className="text-center p-2 bg-orange-50 rounded">
              <div className="text-lg font-bold text-orange-700">
                {data.childProfiles.filter((p) => p.placementStability === "at_risk").length}
              </div>
              <div className="text-[10px] text-gray-500">At Risk</div>
            </div>
            <div className="text-center p-2 bg-red-50 rounded">
              <div className="text-lg font-bold text-red-700">{data.placementStability.childrenWithHighRisk}</div>
              <div className="text-[10px] text-gray-500">High Risk</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-2 bg-gray-50 rounded">
              <div className="text-sm font-bold text-gray-800">{data.placementStability.averagePreviousPlacements}</div>
              <div className="text-[10px] text-gray-500">Avg. Previous Placements</div>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded">
              <div className="text-sm font-bold text-gray-800">
                {data.placementStability.totalStabilityFactors} / {data.placementStability.totalDisruptionRisks}
              </div>
              <div className="text-[10px] text-gray-500">Stability / Risk Factors</div>
            </div>
          </div>
        </ExpandableSection>

        {/* Strengths & Areas */}
        <ExpandableSection title="Strengths, Areas & Actions">
          <div className="space-y-3">
            {data.strengths.length > 0 && (
              <div>
                <h5 className="text-sm font-semibold text-green-800 mb-1">Strengths</h5>
                <ul className="space-y-0.5">
                  {data.strengths.map((s, i) => (
                    <li key={i} className="text-xs text-green-700">+ {s}</li>
                  ))}
                </ul>
              </div>
            )}
            {data.areasForDevelopment.length > 0 && (
              <div>
                <h5 className="text-sm font-semibold text-orange-800 mb-1">Areas for Development</h5>
                <ul className="space-y-0.5">
                  {data.areasForDevelopment.map((area, i) => (
                    <li key={i} className="text-xs text-orange-700">- {area}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </ExpandableSection>

        {/* Regulatory Framework */}
        <ExpandableSection title="Regulatory Framework">
          <ul className="space-y-1">
            {data.regulatoryLinks.map((link, i) => (
              <li key={i} className="text-xs text-gray-600">{link}</li>
            ))}
          </ul>
        </ExpandableSection>
      </div>
    </div>
  );
}

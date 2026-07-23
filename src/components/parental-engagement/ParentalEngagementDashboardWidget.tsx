"use client";

// ══════════════════════════════════════════════════════════════════════════════
// PARENTAL ENGAGEMENT DASHBOARD WIDGET
//
// Displays parental engagement intelligence:
// - Overall engagement quality rating
// - Contact quality and mood uplift metrics
// - Parental support effectiveness
// - Family planning goal achievement
// - Parental feedback satisfaction scores
// - Per-child family profiles with engagement levels
// - Strengths, areas for improvement, and actions
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";

interface ContactQualityData {
  totalContacts: number;
  positiveOutcomeRate: number;
  averageMoodBefore: number;
  averageMoodAfter: number;
  moodUpliftRate: number;
  averageParentEngagement: number;
  followUpNeededCount: number;
  followUpCompletedCount: number;
  followUpCompletionRate: number | null;
  childRefusalCount: number;
  childRefusalRate: number;
  parentNoShowCount: number;
  parentNoShowRate: number;
  averageDurationMinutes: number;
  score: number;
}

interface ParentalSupportData {
  totalSupports: number;
  activeSupports: number;
  completedSupports: number;
  effectiveRate: number;
  referralsMade: number;
  referralRate: number;
  parentsReceivingSupport: number;
  childrenCovered: number;
  score: number;
}

interface FamilyPlanningData {
  totalPlans: number;
  totalGoalsSet: number;
  totalGoalsAchieved: number;
  goalAchievementRate: number;
  familyInvolvementRate: number;
  childInvolvementRate: number;
  currentPlans: number;
  overduePlans: number;
  score: number;
}

interface ParentalFeedbackData {
  totalFeedbacks: number;
  averageSatisfaction: number;
  averageCommunication: number;
  averageInvolvement: number;
  overallAverageFeedback: number;
  score: number;
}

interface ParentProfile {
  parentId: string;
  parentName: string;
  relationship: string;
  engagementLevel: string;
  contactCount: number;
  positiveContactRate: number;
  averageEngagementScore: number;
  supportsProvided: number;
  feedbackGiven: number;
}

interface FamilyProfileData {
  childId: string;
  childName: string;
  parents: ParentProfile[];
  totalContacts: number;
  positiveContactRate: number;
  averageMoodUplift: number;
  activeFamilyPlan: boolean;
  goalAchievementRate: number;
}

interface ParentalEngagementData {
  homeId: string;
  assessedAt: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: string;
  contactQuality: ContactQualityData;
  parentalSupport: ParentalSupportData;
  familyPlanning: FamilyPlanningData;
  parentalFeedback: ParentalFeedbackData;
  familyProfiles: FamilyProfileData[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
  meta?: {
    engagementLevelLabels?: Record<string, string>;
    relationshipLabels?: Record<string, string>;
  };
}

// ── Rating Badge ──────────────────────────────────────────────────────────

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

// ── Score Bar ─────────────────────────────────────────────────────────────

function ScoreBar({ score, maxScore, label }: { score: number; maxScore: number; label: string }) {
  const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  const barColor =
    pct >= 80 ? "bg-green-500"
      : pct >= 60 ? "bg-blue-500"
        : pct >= 40 ? "bg-orange-500"
          : "bg-red-500";

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-600">{label}</span>
        <span className="font-semibold">{score}/{maxScore}</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ── Metric Gauge ──────────────────────────────────────────────────────────

function MetricGauge({ rate, label }: { rate: number; label: string }) {
  const barColor =
    rate >= 80 ? "bg-green-500"
      : rate >= 60 ? "bg-blue-500"
        : rate >= 40 ? "bg-orange-500"
          : "bg-red-500";

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-600">{label}</span>
        <span className="font-semibold">{rate}%</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${rate}%` }} />
      </div>
    </div>
  );
}

// ── Engagement Badge ──────────────────────────────────────────────────────

function EngagementBadge({ level, labels }: { level: string; labels?: Record<string, string> }) {
  const colorMap: Record<string, string> = {
    highly_engaged: "bg-green-100 text-green-700 border-green-200",
    engaged: "bg-blue-100 text-blue-700 border-blue-200",
    inconsistent: "bg-yellow-100 text-yellow-700 border-yellow-200",
    disengaged: "bg-orange-100 text-orange-700 border-orange-200",
    hostile: "bg-red-100 text-red-700 border-red-200",
    no_contact: "bg-gray-100 text-gray-700 border-gray-200",
  };
  const color = colorMap[level] ?? "bg-gray-100 text-gray-700 border-gray-200";
  const displayLabel = labels?.[level] ?? level.replace(/_/g, " ");

  return (
    <span className={`inline-block rounded border px-2 py-0.5 text-[10px] font-medium capitalize ${color}`}>
      {displayLabel}
    </span>
  );
}

// ── Family Profile Card ───────────────────────────────────────────────────

function FamilyProfileCard({
  profile,
  labels,
}: {
  profile: FamilyProfileData;
  labels?: { engagement?: Record<string, string>; relationship?: Record<string, string> };
}) {
  const rateColor = (r: number) =>
    r >= 80 ? "text-green-700" : r >= 60 ? "text-blue-700" : r >= 40 ? "text-orange-700" : "text-red-700";

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-sm">{profile.childName}</span>
        <span className="text-xs text-gray-500">
          {profile.totalContacts} contact{profile.totalContacts !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center mb-2">
        <div>
          <div className="text-xs text-gray-500">Positive</div>
          <div className={`text-sm font-bold ${rateColor(profile.positiveContactRate)}`}>
            {profile.positiveContactRate}%
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Mood Uplift</div>
          <div className={`text-sm font-bold ${profile.averageMoodUplift >= 0 ? "text-green-700" : "text-red-700"}`}>
            {profile.averageMoodUplift >= 0 ? "+" : ""}{profile.averageMoodUplift}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Goals</div>
          <div className={`text-sm font-bold ${rateColor(profile.goalAchievementRate)}`}>
            {profile.goalAchievementRate}%
          </div>
        </div>
      </div>

      {profile.parents.length > 0 && (
        <div className="space-y-1.5 mt-2 pt-2 border-t border-gray-200">
          {profile.parents.map((parent) => (
            <div key={parent.parentId} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-gray-700 font-medium">{parent.parentName}</span>
                <span className="text-gray-400">
                  ({labels?.relationship?.[parent.relationship] ?? parent.relationship})
                </span>
              </div>
              <EngagementBadge level={parent.engagementLevel} labels={labels?.engagement} />
            </div>
          ))}
        </div>
      )}

      {!profile.activeFamilyPlan && (
        <div className="mt-2 text-[10px] text-orange-700 bg-orange-100 rounded px-2 py-1">
          No active family plan
        </div>
      )}
    </div>
  );
}

// ── Main Widget ───────────────────────────────────────────────────────────

export function ParentalEngagementDashboardWidget() {
  const [data, setData] = useState<ParentalEngagementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/parental-engagement");
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
        <h3 className="font-semibold text-red-800">Parental Engagement Intelligence</h3>
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
            Parental Engagement Intelligence
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {data.contactQuality.totalContacts} contacts | {data.parentalSupport.totalSupports} supports |{" "}
            {data.familyPlanning.totalPlans} plans | {data.parentalFeedback.totalFeedbacks} feedback responses
          </p>
        </div>
        <RatingBadge score={data.overallScore} rating={data.rating} />
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="text-center p-2 bg-green-50 rounded-lg">
          <div className="text-xl font-bold text-green-700">{data.contactQuality.positiveOutcomeRate}%</div>
          <div className="text-[10px] text-gray-500 uppercase">Positive Contacts</div>
        </div>
        <div className="text-center p-2 bg-blue-50 rounded-lg">
          <div className="text-xl font-bold text-blue-700">{data.contactQuality.moodUpliftRate}%</div>
          <div className="text-[10px] text-gray-500 uppercase">Mood Uplift</div>
        </div>
        <div className="text-center p-2 bg-purple-50 rounded-lg">
          <div className="text-xl font-bold text-purple-700">{data.parentalSupport.effectiveRate}%</div>
          <div className="text-[10px] text-gray-500 uppercase">Support Effective</div>
        </div>
        <div className="text-center p-2 bg-teal-50 rounded-lg">
          <div className="text-xl font-bold text-teal-700">{data.familyPlanning.goalAchievementRate}%</div>
          <div className="text-[10px] text-gray-500 uppercase">Goals Achieved</div>
        </div>
      </div>

      {/* Domain Score Bars */}
      <div className="space-y-2 mb-4">
        <ScoreBar score={data.contactQuality.score} maxScore={30} label="Contact Quality" />
        <ScoreBar score={data.parentalSupport.score} maxScore={20} label="Parental Support" />
        <ScoreBar score={data.familyPlanning.score} maxScore={25} label="Family Planning" />
        <ScoreBar score={data.parentalFeedback.score} maxScore={25} label="Parental Feedback" />
      </div>

      {/* Feedback Scores */}
      <div className="space-y-2 mb-4">
        <MetricGauge rate={Math.round(data.parentalFeedback.averageSatisfaction * 10)} label="Parent Satisfaction" />
        <MetricGauge rate={Math.round(data.parentalFeedback.averageCommunication * 10)} label="Communication Quality" />
        <MetricGauge rate={Math.round(data.parentalFeedback.averageInvolvement * 10)} label="Parental Involvement" />
      </div>

      {/* Alert Badges */}
      {(data.contactQuality.parentNoShowCount > 0 || data.contactQuality.childRefusalCount > 0 || data.familyPlanning.overduePlans > 0) && (
        <div className="flex flex-wrap gap-2 mb-4">
          {data.contactQuality.parentNoShowCount > 0 && (
            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
              {data.contactQuality.parentNoShowCount} parent no-show{data.contactQuality.parentNoShowCount !== 1 ? "s" : ""}
            </span>
          )}
          {data.contactQuality.childRefusalCount > 0 && (
            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
              {data.contactQuality.childRefusalCount} child refusal{data.contactQuality.childRefusalCount !== 1 ? "s" : ""}
            </span>
          )}
          {data.familyPlanning.overduePlans > 0 && (
            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
              {data.familyPlanning.overduePlans} overdue plan{data.familyPlanning.overduePlans !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      )}

      {/* Expand/Collapse */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-center text-xs text-blue-600 hover:text-blue-800 py-2 border-t border-gray-100 mt-2"
      >
        {expanded ? "Show less" : "Show family profiles, strengths & actions"}
      </button>

      {expanded && (
        <div className="mt-4 space-y-4">
          {/* Family Profiles */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Family Profiles</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {data.familyProfiles.map((profile) => (
                <FamilyProfileCard
                  key={profile.childId}
                  profile={profile}
                  labels={{
                    engagement: data.meta?.engagementLevelLabels,
                    relationship: data.meta?.relationshipLabels,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Strengths */}
          {data.strengths.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-green-700 mb-1">Strengths</h4>
              <ul className="space-y-1">
                {data.strengths.map((s, i) => (
                  <li key={i} className="text-xs text-gray-700 flex gap-1.5">
                    <span className="text-green-500 mt-0.5 shrink-0">&#x2713;</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Areas for Improvement */}
          {data.areasForImprovement.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-orange-700 mb-1">Areas for Improvement</h4>
              <ul className="space-y-1">
                {data.areasForImprovement.map((a, i) => (
                  <li key={i} className="text-xs text-gray-700 flex gap-1.5">
                    <span className="text-orange-500 mt-0.5 shrink-0">&#x25B2;</span>
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          {data.actions.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-red-700 mb-1">Actions Required</h4>
              <ul className="space-y-1">
                {data.actions.map((a, i) => (
                  <li
                    key={i}
                    className={`text-xs rounded px-2 py-1.5 ${
                      a.startsWith("HIGH:")
                        ? "bg-red-50 text-red-800 border border-red-200"
                        : a.startsWith("MEDIUM:")
                          ? "bg-orange-50 text-orange-800 border border-orange-200"
                          : "bg-gray-50 text-gray-700 border border-gray-200"
                    }`}
                  >
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Regulatory Links */}
          {data.regulatoryLinks.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-600 mb-1">Regulatory Framework</h4>
              <div className="flex flex-wrap gap-1.5">
                {data.regulatoryLinks.map((link, i) => (
                  <span
                    key={i}
                    className="text-[10px] bg-gray-100 text-gray-600 border border-gray-200 px-2 py-1 rounded"
                  >
                    {link}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ActivitiesDashboardWidget — Children's Activities & Enrichment card
// ══════════════════════════════════════════════════════════════════════════════

"use client";

import { useEffect, useState } from "react";

interface ActivityRecord {
  id: string;
  name: string;
  category: string;
  participationLevel: string;
  communityBased: boolean;
  childChosenActivity: boolean;
  achievements?: string[];
  endDate?: string;
}

interface ChildResult {
  childId: string;
  childName: string;
  isCompliant: boolean;
  issues: string[];
  warnings: string[];
  totalActiveActivities: number;
  communityBasedCount: number;
  communityRate: number;
  diversityScore: number;
  childChosenRate: number;
  newExperiencesThisQuarter: number;
  droppedOutCount: number;
  monthlyBudget: number;
  monthlySpend: number;
  budgetUtilisation: number;
  unresolvedBarriers: number;
  achievementsCount: number;
}

interface HomeMetrics {
  homeId: string;
  totalChildren: number;
  averageActivitiesPerChild: number;
  childrenWithNoActivities: number;
  totalCommunityActivities: number;
  averageCommunityRate: number;
  averageDiversityScore: number;
  leastRepresentedCategories: { category: string; count: number }[];
  averageChildChosenRate: number;
  totalNewExperiences: number;
  totalDroppedOut: number;
  totalMonthlyBudget: number;
  totalMonthlySpend: number;
  averageBudgetUtilisation: number;
  totalUnresolvedBarriers: number;
  mostCommonBarriers: { barrier: string; count: number }[];
  totalAchievements: number;
  complianceIssues: string[];
  overallScore: number;
}

interface Profile {
  childId: string;
  childName: string;
  activities: ActivityRecord[];
}

interface DashboardData {
  metrics: HomeMetrics;
  childResults: ChildResult[];
  profiles: Profile[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function getScoreColour(score: number): string {
  if (score >= 75) return "text-green-600";
  if (score >= 50) return "text-amber-600";
  return "text-red-600";
}

function getScoreBg(score: number): string {
  if (score >= 75) return "bg-green-50 border-green-100";
  if (score >= 50) return "bg-amber-50 border-amber-100";
  return "bg-red-50 border-red-100";
}

function getCategoryLabel(cat: string): string {
  const labels: Record<string, string> = {
    sport_team: "Team Sports",
    sport_individual: "Individual Sports",
    creative_arts: "Creative Arts",
    outdoor_adventure: "Outdoor/Adventure",
    academic_enrichment: "Academic",
    cultural: "Cultural",
    religious_spiritual: "Religious",
    life_skills: "Life Skills",
    social_community: "Social/Community",
    health_wellbeing: "Health & Wellbeing",
    hobbies_interests: "Hobbies",
    identity_heritage: "Identity/Heritage",
  };
  return labels[cat] ?? cat;
}

function getBarrierLabel(barrier: string): string {
  const labels: Record<string, string> = {
    financial: "Financial",
    transport: "Transport",
    confidence: "Confidence",
    peer_issues: "Peer Issues",
    timing_clash: "Timing",
    health_condition: "Health",
    consent_required: "Consent",
    placement_restriction: "Restriction",
    staffing: "Staffing",
    not_available_locally: "Availability",
  };
  return labels[barrier] ?? barrier;
}

function getCategoryIcon(cat: string): string {
  const icons: Record<string, string> = {
    sport_team: "⚽",
    sport_individual: "🏊",
    creative_arts: "🎨",
    outdoor_adventure: "🏕️",
    academic_enrichment: "📚",
    cultural: "🎭",
    religious_spiritual: "🕊️",
    life_skills: "🍳",
    social_community: "🤝",
    health_wellbeing: "🧘",
    hobbies_interests: "🎮",
    identity_heritage: "🌍",
  };
  return icons[cat] ?? "📋";
}

// ── Component ────────────────────────────────────────────────────────────────

export function ActivitiesDashboardWidget() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/activities?homeId=home-oak&mode=dashboard")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch activities data");
        return res.json();
      })
      .then((json) => setData(json))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm animate-pulse">
        <div className="h-6 w-52 bg-slate-200 rounded mb-4" />
        <div className="space-y-3">
          <div className="h-4 w-full bg-slate-100 rounded" />
          <div className="h-4 w-3/4 bg-slate-100 rounded" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <p className="text-red-700 text-sm">Error loading activities data: {error}</p>
      </div>
    );
  }

  const { metrics, childResults, profiles } = data;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Activities & Enrichment
          </h3>
          <p className="text-sm text-slate-500 mt-0.5">
            Leisure, recreation, culture, and new experiences
          </p>
        </div>
        <div className="text-right">
          <p className={`text-2xl font-bold ${getScoreColour(metrics.overallScore)}`}>
            {metrics.overallScore}%
          </p>
          <p className="text-xs text-slate-400">overall score</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Avg Activities"
          value={String(metrics.averageActivitiesPerChild)}
          sub="per child"
          score={Math.min(100, Math.round((metrics.averageActivitiesPerChild / 4) * 100))}
        />
        <MetricCard
          label="Community"
          value={`${metrics.averageCommunityRate}%`}
          sub={`${metrics.totalCommunityActivities} activities`}
          score={metrics.averageCommunityRate}
        />
        <MetricCard
          label="Diversity"
          value={`${metrics.averageDiversityScore}%`}
          sub="categories covered"
          score={metrics.averageDiversityScore}
        />
        <MetricCard
          label="Child Choice"
          value={`${metrics.averageChildChosenRate}%`}
          sub="child-chosen"
          score={metrics.averageChildChosenRate}
        />
      </div>

      {/* Per-Child Summary */}
      <div>
        <h4 className="text-sm font-medium text-slate-700 mb-3">Children's Activities</h4>
        <div className="space-y-2">
          {childResults.map((child) => {
            const profile = profiles.find(p => p.childId === child.childId);
            const activeActivities = profile?.activities.filter(
              a => !a.endDate && (a.participationLevel === "regular" || a.participationLevel === "occasional")
            ) ?? [];

            return (
              <div
                key={child.childId}
                className="p-3 rounded-lg border border-slate-100"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-800">{child.childName}</p>
                    <span className="text-xs text-slate-500">
                      {child.totalActiveActivities} active &middot; {child.communityBasedCount} community
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {child.achievementsCount > 0 && (
                      <span className="text-xs bg-green-50 text-green-700 px-1.5 py-0.5 rounded">
                        {child.achievementsCount} achievements
                      </span>
                    )}
                    {child.unresolvedBarriers > 0 && (
                      <span className="text-xs bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded">
                        {child.unresolvedBarriers} barriers
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {activeActivities.map((act) => (
                    <span
                      key={act.id}
                      className={`text-xs px-2 py-0.5 rounded-full border ${
                        act.communityBased
                          ? "bg-blue-50 text-blue-700 border-blue-100"
                          : "bg-slate-50 text-slate-600 border-slate-100"
                      }`}
                    >
                      {getCategoryIcon(act.category)} {act.name.split("(")[0].trim()}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Budget Overview */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-xs text-slate-500">Monthly Budget</p>
            <p className="text-sm font-semibold text-slate-800">
              £{metrics.totalMonthlySpend} / £{metrics.totalMonthlyBudget}
            </p>
          </div>
          <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                metrics.averageBudgetUtilisation >= 70 ? "bg-green-500" :
                metrics.averageBudgetUtilisation >= 40 ? "bg-amber-500" : "bg-red-500"
              }`}
              style={{ width: `${Math.min(100, metrics.averageBudgetUtilisation)}%` }}
            />
          </div>
          <span className="text-xs text-slate-500">{metrics.averageBudgetUtilisation}% used</span>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">New Experiences</p>
          <p className="text-sm font-semibold text-slate-800">{metrics.totalNewExperiences} this quarter</p>
        </div>
      </div>

      {/* Least Represented Categories */}
      {metrics.leastRepresentedCategories.filter(c => c.count === 0).length > 0 && (
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-800 mb-2">Gaps to Explore</h4>
          <div className="flex flex-wrap gap-2">
            {metrics.leastRepresentedCategories
              .filter(c => c.count === 0)
              .map((cat) => (
                <span
                  key={cat.category}
                  className="text-xs bg-white text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full"
                >
                  {getCategoryIcon(cat.category)} {getCategoryLabel(cat.category)}
                </span>
              ))}
          </div>
        </div>
      )}

      {/* Barriers */}
      {metrics.mostCommonBarriers.length > 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
          <h4 className="text-sm font-medium text-amber-800 mb-2">
            Active Barriers ({metrics.totalUnresolvedBarriers})
          </h4>
          <div className="flex flex-wrap gap-2">
            {metrics.mostCommonBarriers.map((b) => (
              <span
                key={b.barrier}
                className="text-xs bg-white text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full"
              >
                {getBarrierLabel(b.barrier)} ({b.count})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Compliance Issues */}
      {metrics.complianceIssues.length > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-lg p-4">
          <h4 className="text-sm font-medium text-red-800 mb-2">
            Issues ({metrics.complianceIssues.length})
          </h4>
          <ul className="space-y-1">
            {metrics.complianceIssues.map((issue, i) => (
              <li key={i} className="text-xs text-red-700 flex items-start gap-1.5">
                <span className="mt-0.5 shrink-0">•</span>
                <span>{issue}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <div className="flex items-center gap-4">
          <MiniStat label="Achievements" value={String(metrics.totalAchievements)} />
          <MiniStat label="Dropped out" value={String(metrics.totalDroppedOut)} />
          {metrics.childrenWithNoActivities > 0 && (
            <MiniStat label="No activities" value={String(metrics.childrenWithNoActivities)} />
          )}
        </div>
        <span className="text-xs text-slate-400">
          Reg 9 &middot; UNCRC Art 31
        </span>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  sub,
  score,
}: {
  label: string;
  value: string;
  sub: string;
  score: number;
}) {
  return (
    <div className="bg-slate-50 rounded-lg p-3">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={`text-lg font-semibold ${getScoreColour(score)}`}>{value}</p>
      <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-slate-500">{label}:</span>
      <span className="text-xs font-semibold text-slate-700">{value}</span>
    </div>
  );
}

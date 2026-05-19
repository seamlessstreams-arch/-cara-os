"use client";

// ══════════════════════════════════════════════════════════════════════════════
// RECREATIONAL & LEISURE ACCESS DASHBOARD WIDGET
//
// Displays the 4-layer recreational leisure access intelligence:
// - Overall score with rating
// - Score bars: activity engagement, activity diversity, leisure policy, staff readiness
// - Child leisure profiles
// - Strengths, areas for improvement, and actions
// - Regulatory references
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";

// ── Local interfaces (mirrors API shape) ──────────────────────────────────

interface ActivityEngagement {
  totalActivities: number;
  enjoymentCount: number;
  enjoymentRate: number;
  participationCount: number;
  participationRate: number;
  socialInteractionCount: number;
  socialInteractionRate: number;
  newSkillCount: number;
  newSkillRate: number;
  recordedInPlanCount: number;
  recordedInPlanRate: number;
  score: number;
}

interface ActivityDiversity {
  totalActivities: number;
  uniqueActivityTypes: number;
  uniqueActivityTypeRatio: number;
  accessBarrierFreeCount: number;
  accessBarrierFreeRate: number;
  staffSupportCount: number;
  staffSupportRate: number;
  activityTypeBreakdown: Record<string, number>;
  score: number;
}

interface LeisurePolicyData {
  policyProvided: boolean;
  activityProgramme: boolean;
  individualInterestPlans: boolean;
  inclusiveAccess: boolean;
  budgetAllocated: boolean;
  communityPartnerships: boolean;
  riskAssessmentProcess: boolean;
  regularReview: boolean;
  score: number;
}

interface StaffLeisureReadiness {
  totalStaff: number;
  activityPlanningRate: number;
  safeguardingInActivitiesRate: number;
  inclusionAwarenessRate: number;
  firstAidOutdoorsRate: number;
  youthEngagementRate: number;
  communityResourcesRate: number;
  score: number;
}

interface ChildProfile {
  childId: string;
  childName: string;
  totalActivities: number;
  enjoymentCount: number;
  participationCount: number;
  uniqueActivityTypes: number;
  score: number;
}

interface RecreationalLeisureData {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: string;
  activityEngagement: ActivityEngagement;
  activityDiversity: ActivityDiversity;
  leisurePolicy: LeisurePolicyData;
  staffLeisureReadiness: StaffLeisureReadiness;
  childProfiles: ChildProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
  meta?: {
    activitySummary: {
      id: string;
      childName: string;
      date: string;
      type: string;
      participation: string;
      enjoyed: boolean;
    }[];
    ratingLabel: string;
  };
}

// ── ScoreBar ──────────────────────────────────────────────────────────────

function ScoreBar({ label, score, max = 25 }: { label: string; score: number; max?: number }) {
  const pctVal = Math.round((score / max) * 100);
  const fillColor =
    pctVal >= 80
      ? "bg-green-500"
      : pctVal >= 60
        ? "bg-blue-500"
        : pctVal >= 40
          ? "bg-orange-500"
          : "bg-red-500";

  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="text-gray-500">
          {score}/{max}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className={`h-2.5 rounded-full ${fillColor}`}
          style={{ width: `${pctVal}%` }}
        />
      </div>
    </div>
  );
}

// ── Section (collapsible) ─────────────────────────────────────────────────

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
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
      >
        <span>{title}</span>
        <span className="text-gray-400">{open ? "▲" : "▼"}</span>
      </button>
      {open && <div className="p-4">{children}</div>}
    </div>
  );
}

// ── Stat ──────────────────────────────────────────────────────────────────

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center p-2 bg-gray-50 rounded-lg">
      <div className="text-lg font-bold text-gray-700">{value}</div>
      <div className="text-[10px] text-gray-500 uppercase mt-0.5">{label}</div>
    </div>
  );
}

// ── Main Widget ────────────────────────────────────────────────────────────

export default function RecreationalLeisureAccessDashboardWidget() {
  const [data, setData] = useState<RecreationalLeisureData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/recreational-leisure-access");
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
        <div className="h-4 bg-gray-100 rounded w-1/2 mb-3" />
        <div className="h-20 bg-gray-100 rounded mb-3" />
        <div className="h-16 bg-gray-100 rounded" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white border border-red-200 rounded-xl p-6">
        <h3 className="font-semibold text-red-800">Recreational & Leisure Access</h3>
        <p className="text-sm text-red-600 mt-1">{error ?? "No data available"}</p>
      </div>
    );
  }

  const ratingColor =
    data.rating === "outstanding"
      ? "bg-green-100 text-green-800 border-green-300"
      : data.rating === "good"
        ? "bg-blue-100 text-blue-800 border-blue-300"
        : data.rating === "requires_improvement"
          ? "bg-orange-100 text-orange-800 border-orange-300"
          : "bg-red-100 text-red-800 border-red-300";

  const ratingLabel =
    data.meta?.ratingLabel ??
    (data.rating === "outstanding"
      ? "Outstanding"
      : data.rating === "good"
        ? "Good"
        : data.rating === "requires_improvement"
          ? "Requires Improvement"
          : "Inadequate");

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900 text-lg">
            Recreational & Leisure Access
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {data.periodStart} to {data.periodEnd} | {data.activityEngagement.totalActivities} activities | {data.staffLeisureReadiness.totalStaff} staff
          </p>
        </div>
        <div className={`rounded-lg border px-4 py-3 text-center ${ratingColor}`}>
          <div className="text-3xl font-bold">{data.overallScore}</div>
          <div className="text-sm font-medium mt-1">{ratingLabel}</div>
        </div>
      </div>

      {/* 4 Score Bars */}
      <div className="mb-4">
        <ScoreBar label="Activity Engagement" score={data.activityEngagement.score} />
        <ScoreBar label="Activity Diversity" score={data.activityDiversity.score} />
        <ScoreBar label="Leisure Policy" score={data.leisurePolicy.score} />
        <ScoreBar label="Staff Readiness" score={data.staffLeisureReadiness.score} />
      </div>

      {/* Sections */}
      <div className="space-y-3">
        {/* Activity Engagement Details */}
        <Section title="Activity Engagement">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <Stat label="Enjoyment" value={`${data.activityEngagement.enjoymentRate}%`} />
            <Stat label="Participation" value={`${data.activityEngagement.participationRate}%`} />
            <Stat label="Social Interaction" value={`${data.activityEngagement.socialInteractionRate}%`} />
            <Stat label="New Skills" value={`${data.activityEngagement.newSkillRate}%`} />
            <Stat label="In Care Plan" value={`${data.activityEngagement.recordedInPlanRate}%`} />
            <Stat label="Total Activities" value={data.activityEngagement.totalActivities} />
          </div>
        </Section>

        {/* Activity Diversity Details */}
        <Section title="Activity Diversity">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
            <Stat label="Unique Types" value={`${data.activityDiversity.uniqueActivityTypes}/8`} />
            <Stat label="Barrier Free" value={`${data.activityDiversity.accessBarrierFreeRate}%`} />
            <Stat label="Staff Support" value={`${data.activityDiversity.staffSupportRate}%`} />
          </div>
          <div className="grid grid-cols-4 gap-1">
            {Object.entries(data.activityDiversity.activityTypeBreakdown).map(([type, count]) => (
              <div
                key={type}
                className={`text-center p-1.5 rounded text-[10px] ${
                  count > 0 ? "bg-blue-50 text-blue-700" : "bg-gray-50 text-gray-400"
                }`}
              >
                <div className="font-bold">{count}</div>
                <div className="truncate">{type.replace(/_/g, " ")}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* Leisure Policy Details */}
        <Section title="Leisure Policy">
          {data.leisurePolicy.policyProvided ? (
            <div className="grid grid-cols-2 gap-2">
              {[
                ["Activity Programme", data.leisurePolicy.activityProgramme],
                ["Interest Plans", data.leisurePolicy.individualInterestPlans],
                ["Inclusive Access", data.leisurePolicy.inclusiveAccess],
                ["Budget Allocated", data.leisurePolicy.budgetAllocated],
                ["Community Partners", data.leisurePolicy.communityPartnerships],
                ["Risk Assessment", data.leisurePolicy.riskAssessmentProcess],
                ["Regular Review", data.leisurePolicy.regularReview],
              ].map(([label, value]) => (
                <div
                  key={label as string}
                  className={`flex items-center gap-2 p-2 rounded text-xs ${
                    value ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                  }`}
                >
                  <span>{value ? "✓" : "✗"}</span>
                  <span>{label as string}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-red-600">No leisure policy provided</p>
          )}
        </Section>

        {/* Staff Readiness Details */}
        <Section title="Staff Readiness">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <Stat label="Activity Planning" value={`${data.staffLeisureReadiness.activityPlanningRate}%`} />
            <Stat label="Safeguarding" value={`${data.staffLeisureReadiness.safeguardingInActivitiesRate}%`} />
            <Stat label="Inclusion" value={`${data.staffLeisureReadiness.inclusionAwarenessRate}%`} />
            <Stat label="First Aid Outdoors" value={`${data.staffLeisureReadiness.firstAidOutdoorsRate}%`} />
            <Stat label="Youth Engagement" value={`${data.staffLeisureReadiness.youthEngagementRate}%`} />
            <Stat label="Community Resources" value={`${data.staffLeisureReadiness.communityResourcesRate}%`} />
          </div>
          <div className="mt-2">
            <Stat label="Total Staff" value={data.staffLeisureReadiness.totalStaff} />
          </div>
        </Section>

        {/* Child Profiles */}
        <Section title="Child Leisure Profiles">
          {data.childProfiles.length > 0 ? (
            <div className="space-y-2">
              {data.childProfiles.map((profile) => {
                const scoreColor =
                  profile.score >= 8
                    ? "bg-green-100 text-green-700"
                    : profile.score >= 5
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-700";

                return (
                  <div
                    key={profile.childId}
                    className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                  >
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-sm">{profile.childName}</span>
                      <div className="flex gap-3 text-[10px] text-gray-400 mt-0.5">
                        <span>Activities: {profile.totalActivities}</span>
                        <span>Enjoyed: {profile.enjoymentCount}</span>
                        <span>Types: {profile.uniqueActivityTypes}</span>
                      </div>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded shrink-0 ${scoreColor}`}>
                      {profile.score}/10
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-gray-500 text-center py-2">No child profiles available</p>
          )}
        </Section>

        {/* Strengths */}
        {data.strengths.length > 0 && (
          <Section title="Strengths" defaultOpen>
            <ul className="space-y-1">
              {data.strengths.map((s, i) => (
                <li key={i} className="text-xs text-green-700">
                  + {s}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Areas for Improvement */}
        {data.areasForImprovement.length > 0 && (
          <Section title="Areas for Improvement" defaultOpen>
            <ul className="space-y-1">
              {data.areasForImprovement.map((a, i) => (
                <li key={i} className="text-xs text-orange-700">
                  - {a}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Actions */}
        {data.actions.length > 0 && (
          <Section title="Actions" defaultOpen>
            <ul className="space-y-1">
              {data.actions.map((action, i) => (
                <li key={i} className="text-xs text-gray-700 flex items-start gap-1.5">
                  <span className="mt-0.5 shrink-0">
                    {action.startsWith("URGENT") ? "●" : "○"}
                  </span>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Regulatory Links */}
        <Section title="Regulatory References">
          <ul className="space-y-1">
            {data.regulatoryLinks.map((link, i) => (
              <li key={i} className="text-xs text-gray-600">
                {link}
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </div>
  );
}

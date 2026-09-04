"use client";

// ══════════════════════════════════════════════════════════════════════════════
// ANNUAL DEVELOPMENT REVIEW DASHBOARD WIDGET
//
// Displays the 4-layer annual development review intelligence:
// - Overall score with rating
// - Layer scores: timeliness, participation, goals, staff readiness
// - Child review profiles
// - Strengths, areas for improvement, and actions
// - Regulatory references
// ══════════════════════════════════════════════════════════════════════════════

import { formatRate } from "@/lib/metrics/rate";
import { useState, useEffect } from "react";

// ── Local interfaces (mirrors API shape) ──────────────────────────────────

interface ReviewTimeliness {
  totalReviews: number;
  heldOnTimeRate: number;
  iroPresenceRate: number;
  minutesDistributedRate: number;
  actionPlanCreatedRate: number;
  reviewTypeBreakdown: Record<string, number>;
  score: number;
  strengths: string[];
  concerns: string[];
}

interface ChildParticipation {
  totalReviews: number;
  fullyParticipatedRate: number;
  viewsSubmittedPlusRate: number;
  multiAgencyAttendanceRate: number;
  previousGoalsReviewedRate: number;
  participationBreakdown: Record<string, number>;
  averageAttendeesPerReview: number;
  score: number;
  strengths: string[];
  concerns: string[];
}

interface GoalAchievement {
  totalGoals: number;
  achievedRate: number;
  onTrackPlusRate: number;
  notMetRate: number;
  goalsPerChild: number;
  uniqueChildren: number;
  statusBreakdown: Record<string, number>;
  score: number;
  strengths: string[];
  concerns: string[];
}

interface StaffReviewReadiness {
  totalStaff: number;
  reviewProcessRate: number;
  childParticipationRate: number;
  goalSettingRate: number;
  multiAgencyWorkingRate: number;
  minutesTakingRate: number;
  advocacyAwarenessRate: number;
  overallReadyRate: number;
  score: number;
  strengths: string[];
  concerns: string[];
}

interface ChildProfile {
  childId: string;
  childName: string;
  totalReviews: number;
  onTimeReviews: number;
  participationLevels: string[];
  totalGoals: number;
  goalsAchieved: number;
  goalsOnTrack: number;
  goalsNotMet: number;
  score: number;
}

interface ReviewData {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: string;
  reviewTimeliness: ReviewTimeliness;
  childParticipation: ChildParticipation;
  goalAchievement: GoalAchievement;
  staffReviewReadiness: StaffReviewReadiness;
  childProfiles: ChildProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
  meta?: {
    reviewSummary: {
      id: string;
      childName: string;
      reviewDate: string;
      reviewType: string;
      participation: string;
      heldOnTime: boolean;
    }[];
    goalSummary: {
      id: string;
      childName: string;
      description: string;
      status: string;
      responsiblePerson: string;
    }[];
    ratingLabel: string;
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

// ── Layer Score Card ───────────────────────────────────────────────────────

function LayerScoreCard({ label, score, max }: { label: string; score: number; max: number }) {
  const pctVal = Math.round((score / max) * 100);
  const color =
    pctVal >= 80 ? "text-green-700 bg-green-50 border-green-200"
      : pctVal >= 60 ? "text-blue-700 bg-blue-50 border-blue-200"
        : pctVal >= 40 ? "text-orange-700 bg-orange-50 border-orange-200"
          : "text-red-700 bg-red-50 border-red-200";

  return (
    <div className={`rounded-lg border p-3 text-center ${color}`}>
      <div className="text-2xl font-bold">{score}<span className="text-sm font-normal">/{max}</span></div>
      <div className="text-xs font-medium mt-0.5">{label}</div>
    </div>
  );
}

// ── Compliance Gauge ───────────────────────────────────────────────────────

function ComplianceGauge({ label, value }: { label: string; value: number }) {
  const color =
    value >= 90 ? "text-green-700 bg-green-100"
      : value >= 70 ? "text-yellow-700 bg-yellow-100"
        : "text-red-700 bg-red-100";

  return (
    <div className={`rounded-lg p-2.5 text-center ${color}`}>
      <div className="text-xl font-bold">{value}%</div>
      <div className="text-[10px] font-medium mt-0.5">{label}</div>
    </div>
  );
}

// ── Child Profile Row ─────────────────────────────────────────────────────

function ChildProfileRow({ profile }: { profile: ChildProfile }) {
  const scoreColor =
    profile.score >= 8 ? "bg-green-100 text-green-700"
      : profile.score >= 5 ? "bg-yellow-100 text-yellow-700"
        : "bg-red-100 text-red-700";

  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">{profile.childName}</span>
          {profile.goalsNotMet > 0 && (
            <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded">
              {profile.goalsNotMet} not met
            </span>
          )}
        </div>
        <div className="flex gap-3 text-[10px] text-gray-400 mt-0.5">
          <span>{profile.totalReviews} review(s)</span>
          <span>{profile.onTimeReviews} on time</span>
          <span>{profile.goalsAchieved} achieved</span>
          <span>{profile.goalsOnTrack} on track</span>
        </div>
      </div>
      <span className={`text-xs font-medium px-2 py-0.5 rounded shrink-0 ${scoreColor}`}>
        {profile.score}/10
      </span>
    </div>
  );
}

// ── Main Widget ────────────────────────────────────────────────────────────

export function AnnualDevelopmentReviewDashboardWidget() {
  const [data, setData] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<"timeliness" | "participation" | "goals" | "staff" | "children">("timeliness");

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/annual-development-review");
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
        <h3 className="font-semibold text-red-800">Annual Development Reviews</h3>
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
            Annual Development Reviews
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {data.periodStart} to {data.periodEnd} | {data.reviewTimeliness.totalReviews} reviews | {data.goalAchievement.totalGoals} goals | {data.staffReviewReadiness.totalStaff} staff
          </p>
        </div>
        <RatingBadge score={data.overallScore} rating={data.rating} />
      </div>

      {/* 4 Layer Scores */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <LayerScoreCard label="Timeliness" score={data.reviewTimeliness.score} max={25} />
        <LayerScoreCard label="Participation" score={data.childParticipation.score} max={25} />
        <LayerScoreCard label="Goal Achievement" score={data.goalAchievement.score} max={25} />
        <LayerScoreCard label="Staff Readiness" score={data.staffReviewReadiness.score} max={25} />
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-4">
        <ComplianceGauge label="On Time" value={data.reviewTimeliness.heldOnTimeRate} />
        <ComplianceGauge label="IRO Present" value={data.reviewTimeliness.iroPresenceRate} />
        <ComplianceGauge label="Participated" value={data.childParticipation.fullyParticipatedRate} />
        <ComplianceGauge label="Goals Achieved" value={data.goalAchievement.achievedRate} />
        <ComplianceGauge label="Multi-Agency" value={data.childParticipation.multiAgencyAttendanceRate} />
        <ComplianceGauge label="Staff Ready" value={data.staffReviewReadiness.overallReadyRate} />
      </div>

      {/* Urgent Actions */}
      {data.actions.length > 0 &&
        !data.actions[0].startsWith("No immediate actions") && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <h4 className="text-sm font-semibold text-red-800 mb-2">Actions Required</h4>
            <ul className="space-y-1">
              {data.actions.slice(0, 5).map((action, i) => (
                <li key={i} className="text-xs text-red-700 flex items-start gap-1.5">
                  <span className="mt-0.5 shrink-0">
                    {action.startsWith("URGENT") ? "●" : action.startsWith("HIGH") ? "○" : "▪"}
                  </span>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

      {/* Expandable Detail Tabs */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-sm text-blue-600 hover:text-blue-800 font-medium w-full text-left"
      >
        {expanded ? "Hide details" : "Show detailed breakdown"}
      </button>

      {expanded && (
        <div className="mt-4 space-y-4">
          {/* Tab Navigation */}
          <div className="flex gap-1 border-b border-gray-200">
            {([
              ["timeliness", "Timeliness"],
              ["participation", "Participation"],
              ["goals", "Goals"],
              ["staff", "Staff"],
              ["children", "Children"],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-t-lg transition-colors ${
                  activeTab === key
                    ? "bg-white border border-b-white border-gray-200 text-gray-900 -mb-px"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Timeliness Tab */}
          {activeTab === "timeliness" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <ComplianceGauge label="On Time" value={data.reviewTimeliness.heldOnTimeRate} />
                <ComplianceGauge label="IRO Present" value={data.reviewTimeliness.iroPresenceRate} />
                <ComplianceGauge label="Minutes Sent" value={data.reviewTimeliness.minutesDistributedRate} />
                <ComplianceGauge label="Action Plans" value={data.reviewTimeliness.actionPlanCreatedRate} />
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 bg-gray-50 rounded">
                  <div className="text-lg font-bold text-gray-700">{data.reviewTimeliness.totalReviews}</div>
                  <div className="text-[10px] text-gray-500 uppercase">Total Reviews</div>
                </div>
                <div className="p-2 bg-blue-50 rounded">
                  <div className="text-lg font-bold text-blue-700">{data.reviewTimeliness.reviewTypeBreakdown.subsequent ?? 0}</div>
                  <div className="text-[10px] text-gray-500 uppercase">Subsequent</div>
                </div>
                <div className="p-2 bg-orange-50 rounded">
                  <div className="text-lg font-bold text-orange-700">{data.reviewTimeliness.reviewTypeBreakdown.emergency ?? 0}</div>
                  <div className="text-[10px] text-gray-500 uppercase">Emergency</div>
                </div>
              </div>
              {data.meta?.reviewSummary && (
                <div className="bg-gray-50 rounded-lg p-3">
                  {data.meta.reviewSummary.map((rev) => (
                    <div key={rev.id} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="font-medium text-sm truncate">{rev.childName}</span>
                        <span className="text-xs text-gray-400">({rev.reviewType})</span>
                        <span className="text-xs text-gray-400">{rev.reviewDate}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${rev.heldOnTime ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          {rev.heldOnTime ? "On time" : "Late"}
                        </span>
                        <span className="text-xs text-gray-600">{rev.participation}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Participation Tab */}
          {activeTab === "participation" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <ComplianceGauge label="Fully Participated" value={data.childParticipation.fullyParticipatedRate} />
                <ComplianceGauge label="Views Captured" value={data.childParticipation.viewsSubmittedPlusRate} />
                <ComplianceGauge label="Multi-Agency" value={data.childParticipation.multiAgencyAttendanceRate} />
                <ComplianceGauge label="Goals Reviewed" value={data.childParticipation.previousGoalsReviewedRate} />
              </div>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-2 bg-gray-50 rounded">
                  <div className="text-lg font-bold text-gray-700">{data.childParticipation.averageAttendeesPerReview}</div>
                  <div className="text-[10px] text-gray-500 uppercase">Avg Attendees</div>
                </div>
                <div className="p-2 bg-gray-50 rounded">
                  <div className="text-lg font-bold text-gray-700">{data.childParticipation.totalReviews}</div>
                  <div className="text-[10px] text-gray-500 uppercase">Total Reviews</div>
                </div>
              </div>
            </div>
          )}

          {/* Goals Tab */}
          {activeTab === "goals" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <ComplianceGauge label="Achieved" value={data.goalAchievement.achievedRate} />
                <ComplianceGauge label="On Track+" value={data.goalAchievement.onTrackPlusRate} />
                <div className="rounded-lg p-2.5 text-center bg-gray-100 text-gray-700">
                  <div className="text-xl font-bold">{data.goalAchievement.goalsPerChild}</div>
                  <div className="text-[10px] font-medium mt-0.5">Goals/Child</div>
                </div>
                <div className={`rounded-lg p-2.5 text-center ${data.goalAchievement.notMetRate > 30 ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"}`}>
                  <div className="text-xl font-bold">{formatRate(data.goalAchievement.notMetRate)}</div>
                  <div className="text-[10px] font-medium mt-0.5">Not Met</div>
                </div>
              </div>
              <div className="grid grid-cols-5 gap-1 text-center">
                {Object.entries(data.goalAchievement.statusBreakdown).map(([status, count]) => (
                  <div key={status} className="p-1.5 bg-gray-50 rounded">
                    <div className="text-sm font-bold text-gray-700">{count as number}</div>
                    <div className="text-[9px] text-gray-500 capitalize">{status.replace("_", " ")}</div>
                  </div>
                ))}
              </div>
              {data.meta?.goalSummary && (
                <div className="bg-gray-50 rounded-lg p-3">
                  {data.meta.goalSummary.map((goal) => (
                    <div key={goal.id} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm truncate">{goal.description}</div>
                        <div className="text-[10px] text-gray-400">{goal.childName} | {goal.responsiblePerson}</div>
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 ml-2 ${
                        goal.status === "Achieved" ? "bg-green-100 text-green-700"
                          : goal.status === "On Track" ? "bg-blue-100 text-blue-700"
                            : goal.status === "Not Met" ? "bg-red-100 text-red-700"
                              : "bg-gray-100 text-gray-700"
                      }`}>
                        {goal.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Staff Tab */}
          {activeTab === "staff" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <ComplianceGauge label="Review Process" value={data.staffReviewReadiness.reviewProcessRate} />
                <ComplianceGauge label="Child Participation" value={data.staffReviewReadiness.childParticipationRate} />
                <ComplianceGauge label="Goal Setting" value={data.staffReviewReadiness.goalSettingRate} />
                <ComplianceGauge label="Multi-Agency" value={data.staffReviewReadiness.multiAgencyWorkingRate} />
                <ComplianceGauge label="Minutes Taking" value={data.staffReviewReadiness.minutesTakingRate} />
                <ComplianceGauge label="Advocacy" value={data.staffReviewReadiness.advocacyAwarenessRate} />
              </div>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-2 bg-gray-50 rounded">
                  <div className="text-lg font-bold text-gray-700">{data.staffReviewReadiness.totalStaff}</div>
                  <div className="text-[10px] text-gray-500 uppercase">Total Staff</div>
                </div>
                <div className={`p-2 rounded ${data.staffReviewReadiness.overallReadyRate >= 80 ? "bg-green-50" : data.staffReviewReadiness.overallReadyRate >= 50 ? "bg-yellow-50" : "bg-red-50"}`}>
                  <div className={`text-lg font-bold ${data.staffReviewReadiness.overallReadyRate >= 80 ? "text-green-700" : data.staffReviewReadiness.overallReadyRate >= 50 ? "text-yellow-700" : "text-red-700"}`}>
                    {formatRate(data.staffReviewReadiness.overallReadyRate)}
                  </div>
                  <div className="text-[10px] text-gray-500 uppercase">Fully Ready</div>
                </div>
              </div>
            </div>
          )}

          {/* Children Tab */}
          {activeTab === "children" && (
            <div className="bg-gray-50 rounded-lg p-3">
              {data.childProfiles.length > 0 ? (
                data.childProfiles.map((profile) => (
                  <ChildProfileRow key={profile.childId} profile={profile} />
                ))
              ) : (
                <p className="text-xs text-gray-500 text-center py-2">No child profiles available</p>
              )}
            </div>
          )}

          {/* Strengths */}
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

          {/* Areas for Improvement */}
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

          {/* Regulatory Links */}
          {data.regulatoryLinks.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-800 mb-2">Regulatory References</h4>
              <ul className="space-y-1">
                {data.regulatoryLinks.map((link, i) => (
                  <li key={i} className="text-xs text-gray-600">{link}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

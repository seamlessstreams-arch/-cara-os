"use client";

import React, { useEffect, useState } from "react";
import type { ReflectivePracticeResult, StaffDevelopmentProfile } from "@/lib/reflective-practice/reflective-practice-engine";
import { getActivityTypeLabel, getPracticeAreaLabel } from "@/lib/reflective-practice/reflective-practice-engine";

// ── Rating Badge ─────────────────────────────────────────────────────────────

function RatingBadge({ rating, score }: { rating: string; score: number }) {
  const colorMap: Record<string, string> = {
    outstanding: "bg-green-100 text-green-800 border-green-300",
    good: "bg-blue-100 text-blue-800 border-blue-300",
    requires_improvement: "bg-amber-100 text-amber-800 border-amber-300",
    inadequate: "bg-red-100 text-red-800 border-red-300",
  };
  const labelMap: Record<string, string> = {
    outstanding: "Outstanding",
    good: "Good",
    requires_improvement: "Requires Improvement",
    inadequate: "Inadequate",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm font-semibold ${colorMap[rating] ?? "bg-gray-100 text-gray-800 border-gray-300"}`}>
      {labelMap[rating] ?? rating} — {score}/100
    </span>
  );
}

// ── Metric Card ──────────────────────────────────────────────────────────────

function MetricCard({ label, value, suffix, color }: { label: string; value: number | string; suffix?: string; color?: string }) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
      <span className={`text-2xl font-bold ${color ?? "text-gray-900"}`}>
        {value}{suffix}
      </span>
      <span className="mt-1 text-xs text-gray-500 text-center">{label}</span>
    </div>
  );
}

// ── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pctVal = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pctVal}%` }} />
      </div>
      <span className="text-xs font-medium text-gray-600 w-10 text-right">{pctVal}%</span>
    </div>
  );
}

// ── Development Rating Badge ────────────────────────────────────────────────

function DevelopmentBadge({ rating }: { rating: string }) {
  const map: Record<string, string> = {
    exemplary: "bg-green-100 text-green-700 border-green-200",
    engaged: "bg-blue-100 text-blue-700 border-blue-200",
    developing: "bg-amber-100 text-amber-700 border-amber-200",
    minimal: "bg-red-100 text-red-700 border-red-200",
  };
  const labels: Record<string, string> = {
    exemplary: "EXEMPLARY",
    engaged: "ENGAGED",
    developing: "DEVELOPING",
    minimal: "MINIMAL",
  };
  return (
    <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${map[rating] ?? "bg-gray-100 text-gray-700"}`}>
      {labels[rating] ?? rating}
    </span>
  );
}

// ── Staff Development Card ──────────────────────────────────────────────────

function StaffDevelopmentCard({ profile }: { profile: StaffDevelopmentProfile }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-gray-900">{profile.staffName}</h4>
        <DevelopmentBadge rating={profile.developmentRating} />
      </div>
      <div className="space-y-2">
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Reflective Score</span>
            <span>{profile.reflectiveScore}/100</span>
          </div>
          <ProgressBar value={profile.reflectiveScore} max={100} color="bg-purple-500" />
        </div>
        <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t">
          <div>
            <span className="text-lg font-bold text-gray-900">{profile.totalActivities}</span>
            <p className="text-xs text-gray-500">Activities</p>
          </div>
          <div>
            <span className="text-lg font-bold text-gray-900">{profile.totalHours}</span>
            <p className="text-xs text-gray-500">Hours</p>
          </div>
          <div>
            <span className="text-lg font-bold text-gray-900">{profile.practiceChangeCount}</span>
            <p className="text-xs text-gray-500">Changes</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1 pt-2">
          {profile.goalsAchieved > 0 && (
            <span className="rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-xs font-medium border border-green-200">
              {profile.goalsAchieved} GOAL{profile.goalsAchieved !== 1 ? "S" : ""} ACHIEVED
            </span>
          )}
          {profile.activeGoals > 0 && (
            <span className="rounded-full bg-blue-100 text-blue-700 px-2 py-0.5 text-xs font-medium border border-blue-200">
              {profile.activeGoals} ACTIVE GOAL{profile.activeGoals !== 1 ? "S" : ""}
            </span>
          )}
          {profile.totalActivities === 0 && (
            <span className="rounded-full bg-red-100 text-red-700 px-2 py-0.5 text-xs font-medium border border-red-200">
              NO ACTIVITIES
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Widget ──────────────────────────────────────────────────────────────

export function ReflectivePracticeDashboardWidget() {
  const [data, setData] = useState<ReflectivePracticeResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/reflective-practice")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse rounded-xl border border-gray-200 bg-white p-6">
        <div className="h-6 w-64 rounded bg-gray-200 mb-4" />
        <div className="grid grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 rounded-lg bg-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <h3 className="font-semibold text-red-800">Reflective Practice Intelligence</h3>
        <p className="mt-2 text-sm text-red-600">Failed to load: {error}</p>
      </div>
    );
  }

  const toggle = (section: string) =>
    setExpandedSection((prev) => (prev === section ? null : section));

  return (
    <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-lg font-bold text-gray-900">
            Professional Development & Reflective Practice
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            {data.periodStart} to {data.periodEnd} · CHR 2015 Reg 13/33
          </p>
        </div>
        <RatingBadge rating={data.rating} score={data.overallScore} />
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <MetricCard
          label="Activities per Staff"
          value={data.engagement.activitiesPerStaff}
          color={data.engagement.activitiesPerStaff >= 6 ? "text-green-600" : data.engagement.activitiesPerStaff >= 3 ? "text-amber-600" : "text-red-600"}
        />
        <MetricCard
          label="Practice Change Rate"
          value={data.learningOutcomes.practiceChangeRate}
          suffix="%"
          color={data.learningOutcomes.practiceChangeRate >= 40 ? "text-green-600" : data.learningOutcomes.practiceChangeRate >= 20 ? "text-amber-600" : "text-red-600"}
        />
        <MetricCard
          label="Team Sessions"
          value={data.teamLearning.totalTeamSessions}
          color={data.teamLearning.totalTeamSessions >= 6 ? "text-green-600" : data.teamLearning.totalTeamSessions >= 3 ? "text-amber-600" : "text-red-600"}
        />
        <MetricCard
          label="Goal Achievement"
          value={data.goalProgress.achievementRate}
          suffix="%"
          color={data.goalProgress.achievementRate >= 60 ? "text-green-600" : data.goalProgress.achievementRate >= 40 ? "text-amber-600" : "text-red-600"}
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <MetricCard label="Total Activities" value={data.engagement.totalActivities} />
        <MetricCard label="Avg Hours/Staff" value={data.engagement.avgHoursPerStaff} suffix="h" />
        <MetricCard
          label="Shared with Team"
          value={data.learningOutcomes.sharedWithTeamRate}
          suffix="%"
          color={data.learningOutcomes.sharedWithTeamRate >= 50 ? "text-green-600" : "text-amber-600"}
        />
        <MetricCard
          label="Linked to Children"
          value={data.learningOutcomes.linkedToChildOutcomeRate}
          suffix="%"
          color={data.learningOutcomes.linkedToChildOutcomeRate >= 30 ? "text-green-600" : "text-amber-600"}
        />
      </div>

      {/* Status Badges */}
      <div className="flex flex-wrap gap-2 mb-5">
        {data.engagement.staffWithZeroActivities.length > 0 && (
          <span className="rounded-full bg-red-100 text-red-700 px-3 py-1 text-xs font-medium border border-red-200">
            {data.engagement.staffWithZeroActivities.length} STAFF NO ACTIVITIES
          </span>
        )}
        {data.goalProgress.overdue > 0 && (
          <span className="rounded-full bg-amber-100 text-amber-700 px-3 py-1 text-xs font-medium border border-amber-200">
            {data.goalProgress.overdue} OVERDUE GOAL{data.goalProgress.overdue !== 1 ? "S" : ""}
          </span>
        )}
        {data.engagement.engagementRate >= 75 && (
          <span className="rounded-full bg-green-100 text-green-700 px-3 py-1 text-xs font-medium border border-green-200">
            STRONG ENGAGEMENT
          </span>
        )}
        {data.learningOutcomes.practiceChangeRate >= 40 && (
          <span className="rounded-full bg-green-100 text-green-700 px-3 py-1 text-xs font-medium border border-green-200">
            STRONG PRACTICE CHANGE CULTURE
          </span>
        )}
        {data.engagement.staffWithZeroActivities.length === 0 && data.engagement.totalActivities > 0 && (
          <span className="rounded-full bg-green-100 text-green-700 px-3 py-1 text-xs font-medium border border-green-200">
            ALL STAFF PARTICIPATING
          </span>
        )}
      </div>

      {/* Staff Development Profiles */}
      <div className="mb-5">
        <button
          onClick={() => toggle("staff")}
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
        >
          <span className={`transform transition-transform ${expandedSection === "staff" ? "rotate-90" : ""}`}>&#9654;</span>
          Staff Development Profiles ({data.staffProfiles.length})
        </button>
        {expandedSection === "staff" && (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.staffProfiles.map((profile) => (
              <StaffDevelopmentCard key={profile.staffId} profile={profile} />
            ))}
          </div>
        )}
      </div>

      {/* Activity Analysis */}
      <div className="mb-5">
        <button
          onClick={() => toggle("activities")}
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
        >
          <span className={`transform transition-transform ${expandedSection === "activities" ? "rotate-90" : ""}`}>&#9654;</span>
          Activity Analysis
        </button>
        {expandedSection === "activities" && (
          <div className="mt-3 rounded-lg border border-gray-200 bg-white p-4 space-y-4">
            <div>
              <h5 className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">Activity Types</h5>
              <div className="space-y-1.5">
                {Object.entries(data.engagement.activityTypeDistribution)
                  .sort(([, a], [, b]) => b - a)
                  .map(([type, count]) => (
                    <div key={type} className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">{getActivityTypeLabel(type as any)}</span>
                      <span className="text-xs font-medium text-gray-500">{count}</span>
                    </div>
                  ))}
              </div>
            </div>
            <div className="border-t pt-4">
              <h5 className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">Practice Areas</h5>
              <div className="space-y-1.5">
                {Object.entries(data.engagement.practiceAreaDistribution)
                  .sort(([, a], [, b]) => b - a)
                  .map(([area, count]) => (
                    <div key={area} className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">{getPracticeAreaLabel(area as any)}</span>
                      <span className="text-xs font-medium text-gray-500">{count}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Learning Outcomes */}
      <div className="mb-5">
        <button
          onClick={() => toggle("outcomes")}
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
        >
          <span className={`transform transition-transform ${expandedSection === "outcomes" ? "rotate-90" : ""}`}>&#9654;</span>
          Learning Outcomes
        </button>
        {expandedSection === "outcomes" && (
          <div className="mt-3 rounded-lg border border-gray-200 bg-white p-4 space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">Practice Change Rate</span>
                <span className="font-medium">{data.learningOutcomes.practiceChangeRate}%</span>
              </div>
              <ProgressBar value={data.learningOutcomes.practiceChangeRate} max={100} color="bg-purple-500" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">Skill Development Rate</span>
                <span className="font-medium">{data.learningOutcomes.skillDevelopmentRate}%</span>
              </div>
              <ProgressBar value={data.learningOutcomes.skillDevelopmentRate} max={100} color="bg-blue-500" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">Shared with Team</span>
                <span className="font-medium">{data.learningOutcomes.sharedWithTeamRate}%</span>
              </div>
              <ProgressBar value={data.learningOutcomes.sharedWithTeamRate} max={100} color="bg-teal-500" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">Linked to Child Outcomes</span>
                <span className="font-medium">{data.learningOutcomes.linkedToChildOutcomeRate}%</span>
              </div>
              <ProgressBar value={data.learningOutcomes.linkedToChildOutcomeRate} max={100} color="bg-green-500" />
            </div>
            {data.learningOutcomes.noOutcomeRate > 0 && (
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">No Clear Outcome</span>
                  <span className="font-medium text-red-600">{data.learningOutcomes.noOutcomeRate}%</span>
                </div>
                <ProgressBar value={data.learningOutcomes.noOutcomeRate} max={100} color="bg-red-400" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Team Learning */}
      <div className="mb-5">
        <button
          onClick={() => toggle("team")}
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
        >
          <span className={`transform transition-transform ${expandedSection === "team" ? "rotate-90" : ""}`}>&#9654;</span>
          Team Learning
        </button>
        {expandedSection === "team" && (
          <div className="mt-3 rounded-lg border border-gray-200 bg-white p-4 space-y-3">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <span className="text-xl font-bold text-gray-900">{data.teamLearning.totalTeamSessions}</span>
                <p className="text-xs text-gray-500">Team Sessions</p>
              </div>
              <div>
                <span className="text-xl font-bold text-gray-900">{data.teamLearning.avgAttendance}</span>
                <p className="text-xs text-gray-500">Avg Attendance</p>
              </div>
              <div>
                <span className="text-xl font-bold text-gray-900">{data.teamLearning.sharedLearningRate}%</span>
                <p className="text-xs text-gray-500">Shared Rate</p>
              </div>
            </div>
            {data.teamLearning.topTeamTopics.length > 0 && (
              <div className="border-t pt-3">
                <h5 className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">Top Team Topics</h5>
                <div className="space-y-1">
                  {data.teamLearning.topTeamTopics.map((topic, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">{getPracticeAreaLabel(topic.practiceArea as any)}</span>
                      <span className="text-xs font-medium text-gray-500">{topic.count} sessions</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Goal Progress */}
      <div className="mb-5">
        <button
          onClick={() => toggle("goals")}
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
        >
          <span className={`transform transition-transform ${expandedSection === "goals" ? "rotate-90" : ""}`}>&#9654;</span>
          Goal Progress
        </button>
        {expandedSection === "goals" && (
          <div className="mt-3 rounded-lg border border-gray-200 bg-white p-4 space-y-3">
            <div className="grid grid-cols-4 gap-3 text-center">
              <div>
                <span className="text-xl font-bold text-gray-900">{data.goalProgress.totalGoals}</span>
                <p className="text-xs text-gray-500">Total</p>
              </div>
              <div>
                <span className="text-xl font-bold text-green-600">{data.goalProgress.achieved}</span>
                <p className="text-xs text-gray-500">Achieved</p>
              </div>
              <div>
                <span className="text-xl font-bold text-blue-600">{data.goalProgress.inProgress}</span>
                <p className="text-xs text-gray-500">In Progress</p>
              </div>
              <div>
                <span className="text-xl font-bold text-red-600">{data.goalProgress.overdue}</span>
                <p className="text-xs text-gray-500">Overdue</p>
              </div>
            </div>
            {data.goalProgress.overdueGoals.length > 0 && (
              <div className="border-t pt-3">
                <h5 className="text-xs font-semibold text-red-600 mb-2 uppercase tracking-wider">Overdue Goals</h5>
                {data.goalProgress.overdueGoals.map((g, i) => (
                  <div key={i} className="flex justify-between items-center py-1 border-b border-gray-100 last:border-0">
                    <div>
                      <span className="text-sm font-medium text-gray-700">{g.staffName}</span>
                      <p className="text-xs text-gray-500">{g.goalDescription}</p>
                    </div>
                    <span className="text-xs text-red-600 font-medium whitespace-nowrap ml-2">
                      {g.daysPastDue}d overdue
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Strengths / Areas / Actions */}
      <div className="space-y-4 mb-5">
        {data.actions.length > 0 && !data.actions[0].includes("No immediate") && (
          <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
            <h4 className="text-sm font-semibold text-orange-800 mb-2">Actions Required</h4>
            <ul className="space-y-1">
              {data.actions.map((action, i) => (
                <li key={i} className="text-sm text-orange-700">&#8226; {action}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <h4 className="text-sm font-semibold text-green-800 mb-2">Strengths</h4>
          <ul className="space-y-1">
            {data.strengths.map((s, i) => (
              <li key={i} className="text-sm text-green-700">&#8226; {s}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <h4 className="text-sm font-semibold text-amber-800 mb-2">Areas for Improvement</h4>
          <ul className="space-y-1">
            {data.areasForImprovement.map((a, i) => (
              <li key={i} className="text-sm text-amber-700">&#8226; {a}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Regulatory Framework */}
      <div>
        <button
          onClick={() => toggle("regulatory")}
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
        >
          <span className={`transform transition-transform ${expandedSection === "regulatory" ? "rotate-90" : ""}`}>&#9654;</span>
          Regulatory Framework
        </button>
        {expandedSection === "regulatory" && (
          <div className="mt-3 rounded-lg border border-gray-200 bg-white p-4">
            <ul className="space-y-1">
              {data.regulatoryLinks.map((link, i) => (
                <li key={i} className="text-xs text-gray-600">&#8226; {link}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

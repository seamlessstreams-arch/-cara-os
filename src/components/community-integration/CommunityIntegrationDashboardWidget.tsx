"use client";

import React, { useEffect, useState } from "react";
import type {
  CommunityIntegrationResult,
  ChildIntegrationProfile,
  ConnectionType,
  BarrierType,
} from "@/lib/community-integration/community-integration-engine";
import {
  getConnectionTypeLabel,
  getBarrierLabel,
  getEngagementLabel,
} from "@/lib/community-integration/community-integration-engine";

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

// ── Integration Rating Badge ────────────────────────────────────────────────

function IntegrationBadge({ rating }: { rating: string }) {
  const map: Record<string, string> = {
    excellent: "bg-green-100 text-green-700 border-green-200",
    good: "bg-blue-100 text-blue-700 border-blue-200",
    attention_needed: "bg-amber-100 text-amber-700 border-amber-200",
    isolated: "bg-red-100 text-red-700 border-red-200",
  };
  const labels: Record<string, string> = {
    excellent: "EXCELLENT",
    good: "GOOD",
    attention_needed: "NEEDS ATTENTION",
    isolated: "ISOLATED",
  };
  return (
    <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${map[rating] ?? "bg-gray-100 text-gray-700"}`}>
      {labels[rating] ?? rating}
    </span>
  );
}

// ── Child Profile Card ──────────────────────────────────────────────────────

function ChildCard({ profile }: { profile: ChildIntegrationProfile }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="font-semibold text-gray-900">{profile.childName}</h4>
          <span className="text-xs text-gray-500">Age {profile.age}</span>
        </div>
        <IntegrationBadge rating={profile.integrationRating} />
      </div>
      <div className="space-y-2">
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Engagement</span>
            <span>{profile.engagementScore}/100</span>
          </div>
          <ProgressBar value={profile.engagementScore} max={100} color="bg-blue-500" />
        </div>
        <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t">
          <div>
            <span className="text-lg font-bold text-gray-900">{profile.activeConnections}</span>
            <p className="text-xs text-gray-500">Connections</p>
          </div>
          <div>
            <span className="text-lg font-bold text-gray-900">{profile.connectionTypes.length}</span>
            <p className="text-xs text-gray-500">Types</p>
          </div>
          <div>
            <span className="text-lg font-bold text-gray-900">{profile.goalsAchieved}/{profile.goalsTotal}</span>
            <p className="text-xs text-gray-500">Goals</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1 pt-2">
          {profile.barriers.length > 0 && profile.barriers.map((b) => (
            <span key={b} className="rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-xs font-medium border border-amber-200">
              {getBarrierLabel(b as BarrierType)}
            </span>
          ))}
          {profile.goalsOverdue > 0 && (
            <span className="rounded-full bg-red-100 text-red-700 px-2 py-0.5 text-xs font-medium border border-red-200">
              {profile.goalsOverdue} OVERDUE
            </span>
          )}
          {profile.integrationRating === "isolated" && (
            <span className="rounded-full bg-red-100 text-red-700 px-2 py-0.5 text-xs font-medium border border-red-200">
              NO CONNECTIONS
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Widget ──────────────────────────────────────────────────────────────

export function CommunityIntegrationDashboardWidget() {
  const [data, setData] = useState<CommunityIntegrationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/community-integration")
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
        <div className="h-6 w-48 rounded bg-gray-200 mb-4" />
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
        <h3 className="font-semibold text-red-800">Community Integration Intelligence</h3>
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
            Community Integration Intelligence
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            {data.periodStart} to {data.periodEnd} · CHR 2015 Reg 9/7 · UNCRC Art. 31
          </p>
        </div>
        <RatingBadge rating={data.rating} score={data.overallScore} />
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <MetricCard
          label="Avg Connections per Child"
          value={data.breadth.avgConnectionsPerChild}
          color={data.breadth.avgConnectionsPerChild >= 3 ? "text-green-600" : data.breadth.avgConnectionsPerChild >= 2 ? "text-amber-600" : "text-red-600"}
        />
        <MetricCard
          label="Active Connections"
          value={data.engagement.totalActive}
          color="text-blue-600"
        />
        <MetricCard
          label="Child-Led Rate"
          value={data.engagement.childLedRate}
          suffix="%"
          color={data.engagement.childLedRate >= 50 ? "text-green-600" : data.engagement.childLedRate >= 30 ? "text-amber-600" : "text-red-600"}
        />
        <MetricCard
          label="Goal Achievement"
          value={data.goalProgress.achievementRate}
          suffix="%"
          color={data.goalProgress.achievementRate >= 70 ? "text-green-600" : data.goalProgress.achievementRate >= 40 ? "text-amber-600" : "text-red-600"}
        />
      </div>

      {/* Status Badges */}
      <div className="flex flex-wrap gap-2 mb-5">
        {data.breadth.childrenWithZeroConnections > 0 && (
          <span className="rounded-full bg-red-100 text-red-700 px-3 py-1 text-xs font-medium border border-red-200">
            {data.breadth.childrenWithZeroConnections} ISOLATED CHILD{data.breadth.childrenWithZeroConnections !== 1 ? "REN" : ""}
          </span>
        )}
        {data.engagement.disengaged > 0 && (
          <span className="rounded-full bg-orange-100 text-orange-700 px-3 py-1 text-xs font-medium border border-orange-200">
            {data.engagement.disengaged} DISENGAGED CONNECTION{data.engagement.disengaged !== 1 ? "S" : ""}
          </span>
        )}
        {data.goalProgress.overdueGoals > 0 && (
          <span className="rounded-full bg-amber-100 text-amber-700 px-3 py-1 text-xs font-medium border border-amber-200">
            {data.goalProgress.overdueGoals} OVERDUE GOAL{data.goalProgress.overdueGoals !== 1 ? "S" : ""}
          </span>
        )}
        {data.breadth.childrenWithZeroConnections === 0 && data.breadth.totalChildren > 0 && (
          <span className="rounded-full bg-green-100 text-green-700 px-3 py-1 text-xs font-medium border border-green-200">
            ALL CHILDREN CONNECTED
          </span>
        )}
        {data.engagement.overallEngagementRate >= 80 && data.engagement.totalActive > 0 && (
          <span className="rounded-full bg-green-100 text-green-700 px-3 py-1 text-xs font-medium border border-green-200">
            HIGH ENGAGEMENT
          </span>
        )}
      </div>

      {/* Child Integration Profiles */}
      <div className="mb-5">
        <button
          onClick={() => toggle("children")}
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
        >
          <span className={`transform transition-transform ${expandedSection === "children" ? "rotate-90" : ""}`}>&#9654;</span>
          Child Integration Profiles ({data.childProfiles.length})
        </button>
        {expandedSection === "children" && (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.childProfiles.map((profile) => (
              <ChildCard key={profile.childId} profile={profile} />
            ))}
          </div>
        )}
      </div>

      {/* Connection Type Distribution */}
      <div className="mb-5">
        <button
          onClick={() => toggle("distribution")}
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
        >
          <span className={`transform transition-transform ${expandedSection === "distribution" ? "rotate-90" : ""}`}>&#9654;</span>
          Connection Type Distribution
        </button>
        {expandedSection === "distribution" && (
          <div className="mt-3 rounded-lg border border-gray-200 bg-white p-4 space-y-2">
            {Object.entries(data.breadth.connectionTypeDistribution)
              .sort(([, a], [, b]) => b - a)
              .map(([type, count]) => (
                <div key={type} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
                  <span className="text-sm text-gray-700">
                    {getConnectionTypeLabel(type as ConnectionType)}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 rounded-full bg-gray-200 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-500"
                        style={{ width: `${Math.round((count / data.engagement.totalActive) * 100)}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-600 w-6 text-right">{count}</span>
                  </div>
                </div>
              ))}
            <div className="pt-2 border-t">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Diversity Score</span>
                <span className={`font-medium ${data.breadth.diversityScore >= 75 ? "text-green-600" : data.breadth.diversityScore >= 50 ? "text-amber-600" : "text-red-600"}`}>
                  {data.breadth.diversityScore}/100
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Barrier Analysis */}
      <div className="mb-5">
        <button
          onClick={() => toggle("barriers")}
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
        >
          <span className={`transform transition-transform ${expandedSection === "barriers" ? "rotate-90" : ""}`}>&#9654;</span>
          Barrier Analysis ({data.barriers.totalBarriers} barrier{data.barriers.totalBarriers !== 1 ? "s" : ""})
        </button>
        {expandedSection === "barriers" && (
          <div className="mt-3 rounded-lg border border-gray-200 bg-white p-4">
            {data.barriers.totalBarriers === 0 ? (
              <p className="text-sm text-green-600">No barriers to community participation identified.</p>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.entries(data.barriers.barrierDistribution)
                    .sort(([, a], [, b]) => b - a)
                    .map(([barrier, count]) => (
                      <div key={barrier} className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 p-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        <span className="text-xs text-gray-700">{getBarrierLabel(barrier as BarrierType)}</span>
                        <span className="text-xs font-bold text-gray-500 ml-auto">{count}</span>
                      </div>
                    ))}
                </div>
                <div className="flex justify-between text-xs text-gray-500 pt-2 border-t">
                  <span>{data.barriers.childrenWithBarriers} child{data.barriers.childrenWithBarriers !== 1 ? "ren" : ""} affected</span>
                  <span>Avg {data.barriers.barriersPerChildAvg} per child</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Goal Progress Tracker */}
      <div className="mb-5">
        <button
          onClick={() => toggle("goals")}
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
        >
          <span className={`transform transition-transform ${expandedSection === "goals" ? "rotate-90" : ""}`}>&#9654;</span>
          Goal Progress Tracker ({data.goalProgress.totalGoals} goal{data.goalProgress.totalGoals !== 1 ? "s" : ""})
        </button>
        {expandedSection === "goals" && (
          <div className="mt-3 rounded-lg border border-gray-200 bg-white p-4">
            {data.goalProgress.totalGoals === 0 ? (
              <p className="text-sm text-gray-500">No integration goals have been set.</p>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
                  <div className="rounded-lg border border-green-200 bg-green-50 p-2">
                    <span className="text-lg font-bold text-green-700">{data.goalProgress.achieved}</span>
                    <p className="text-xs text-green-600">Achieved</p>
                  </div>
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-2">
                    <span className="text-lg font-bold text-blue-700">{data.goalProgress.inProgress}</span>
                    <p className="text-xs text-blue-600">In Progress</p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-2">
                    <span className="text-lg font-bold text-gray-700">{data.goalProgress.notStarted}</span>
                    <p className="text-xs text-gray-600">Not Started</p>
                  </div>
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-2">
                    <span className="text-lg font-bold text-amber-700">{data.goalProgress.overdueGoals}</span>
                    <p className="text-xs text-amber-600">Overdue</p>
                  </div>
                  <div className="rounded-lg border border-purple-200 bg-purple-50 p-2">
                    <span className="text-lg font-bold text-purple-700">{data.goalProgress.revised + data.goalProgress.discontinued}</span>
                    <p className="text-xs text-purple-600">Revised/Ended</p>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Achievement Rate</span>
                    <span>{data.goalProgress.achievementRate}%</span>
                  </div>
                  <ProgressBar
                    value={data.goalProgress.achievementRate}
                    max={100}
                    color={data.goalProgress.achievementRate >= 70 ? "bg-green-500" : data.goalProgress.achievementRate >= 40 ? "bg-amber-500" : "bg-red-500"}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Strengths / Areas / Actions */}
      <div className="space-y-4 mb-5">
        {data.actions.length > 0 && !data.actions[0].includes("No immediate") && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <h4 className="text-sm font-semibold text-red-800 mb-2">Immediate Actions</h4>
            <ul className="space-y-1">
              {data.actions.map((action, i) => (
                <li key={i} className="text-sm text-red-700">&#8226; {action}</li>
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

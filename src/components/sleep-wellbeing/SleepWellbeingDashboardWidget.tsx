"use client";

import React, { useEffect, useState } from "react";
import type {
  SleepWellbeingResult,
  ChildSleepProfile,
  DisturbanceType,
  SupportProvided,
} from "@/lib/sleep-wellbeing/sleep-wellbeing-engine";
import {
  getSleepQualityLabel,
  getDisturbanceTypeLabel,
  getSupportLabel,
  getWellbeingLabel,
} from "@/lib/sleep-wellbeing/sleep-wellbeing-engine";

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

// ── Trend Badge ─────────────────────────────────────────────────────────────

function TrendBadge({ trend }: { trend: string }) {
  const map: Record<string, string> = {
    improving: "bg-green-100 text-green-700 border-green-200",
    stable: "bg-blue-100 text-blue-700 border-blue-200",
    declining: "bg-red-100 text-red-700 border-red-200",
  };
  const labels: Record<string, string> = {
    improving: "IMPROVING",
    stable: "STABLE",
    declining: "DECLINING",
  };
  return (
    <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${map[trend] ?? "bg-gray-100 text-gray-700"}`}>
      {labels[trend] ?? trend}
    </span>
  );
}

// ── Child Sleep Profile Card ────────────────────────────────────────────────

function ChildProfileCard({ profile }: { profile: ChildSleepProfile }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="font-semibold text-gray-900">{profile.childName}</h4>
          <span className="text-xs text-gray-500">
            Avg quality: {getSleepQualityLabel(profile.avgSleepQuality as "good" | "fair" | "poor" | "very_poor")}
          </span>
        </div>
        <TrendBadge trend={profile.wellbeingTrend} />
      </div>
      <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t">
        <div>
          <span className="text-lg font-bold text-gray-900">{profile.avgSleepHours}</span>
          <p className="text-xs text-gray-500">Avg Hours</p>
        </div>
        <div>
          <span className="text-lg font-bold text-gray-900">{profile.disturbanceFrequency}</span>
          <p className="text-xs text-gray-500">Dist./Night</p>
        </div>
        <div>
          <span className="text-lg font-bold text-gray-900">{profile.bedtimeAdherence}%</span>
          <p className="text-xs text-gray-500">Bedtime Adh.</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1 pt-2">
        {profile.hasSleepPlan ? (
          <span className="rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-xs font-medium border border-green-200">
            SLEEP PLAN
          </span>
        ) : (
          <span className="rounded-full bg-red-100 text-red-700 px-2 py-0.5 text-xs font-medium border border-red-200">
            NO SLEEP PLAN
          </span>
        )}
        {profile.commonDisturbanceTypes.length > 0 && (
          <span className="rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-xs font-medium border border-amber-200">
            {profile.commonDisturbanceTypes.map((t) => getDisturbanceTypeLabel(t)).join(", ")}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Main Widget ──────────────────────────────────────────────────────────────

export function SleepWellbeingDashboardWidget() {
  const [data, setData] = useState<SleepWellbeingResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/sleep-wellbeing")
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
        <h3 className="font-semibold text-red-800">Sleep & Wellbeing Intelligence</h3>
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
            Sleep & Wellbeing Monitoring
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            {data.periodStart} to {data.periodEnd} · CHR 2015 Reg 10/6/34
          </p>
        </div>
        <RatingBadge rating={data.rating} score={data.overallScore} />
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <MetricCard
          label="Overall Sleep Score"
          value={data.overallScore}
          suffix="/100"
          color={data.overallScore >= 80 ? "text-green-600" : data.overallScore >= 60 ? "text-blue-600" : data.overallScore >= 40 ? "text-amber-600" : "text-red-600"}
        />
        <MetricCard
          label="Good Night Rate"
          value={data.sleepQuality.overallGoodNightRate}
          suffix="%"
          color={data.sleepQuality.overallGoodNightRate >= 80 ? "text-green-600" : data.sleepQuality.overallGoodNightRate >= 60 ? "text-amber-600" : "text-red-600"}
        />
        <MetricCard
          label="Night Check Rate"
          value={data.nightCare.nightCheckCompletionRate}
          suffix="%"
          color={data.nightCare.nightCheckCompletionRate >= 95 ? "text-green-600" : data.nightCare.nightCheckCompletionRate >= 80 ? "text-amber-600" : "text-red-600"}
        />
        <MetricCard
          label="Avg Sleep Hours"
          value={data.sleepQuality.overallAvgSleepHours}
          suffix="h"
          color={data.sleepQuality.overallAvgSleepHours >= 8 ? "text-green-600" : data.sleepQuality.overallAvgSleepHours >= 7 ? "text-amber-600" : "text-red-600"}
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <MetricCard label="Total Nights" value={data.sleepQuality.totalRecords} />
        <MetricCard
          label="Routine Rate"
          value={data.nightCare.bedtimeRoutineRate}
          suffix="%"
          color={data.nightCare.bedtimeRoutineRate >= 90 ? "text-green-600" : "text-amber-600"}
        />
        <MetricCard
          label="Settled After Rate"
          value={data.disturbances.settledAfterRate}
          suffix="%"
          color={data.disturbances.settledAfterRate >= 90 ? "text-green-600" : data.disturbances.settledAfterRate >= 75 ? "text-amber-600" : "text-red-600"}
        />
        <MetricCard label="Total Disturbances" value={data.disturbances.totalDisturbances} />
      </div>

      {/* Status Badges */}
      <div className="flex flex-wrap gap-2 mb-5">
        {data.sleepQuality.overallGoodNightRate >= 80 && (
          <span className="rounded-full bg-green-100 text-green-700 px-3 py-1 text-xs font-medium border border-green-200">
            EXCELLENT SLEEP QUALITY
          </span>
        )}
        {data.nightCare.nightCheckCompletionRate >= 95 && (
          <span className="rounded-full bg-green-100 text-green-700 px-3 py-1 text-xs font-medium border border-green-200">
            CONSISTENT NIGHT CHECKS
          </span>
        )}
        {data.sleepPlans.childrenWithoutPlans.length > 0 && (
          <span className="rounded-full bg-red-100 text-red-700 px-3 py-1 text-xs font-medium border border-red-200">
            {data.sleepPlans.childrenWithoutPlans.length} MISSING SLEEP PLAN{data.sleepPlans.childrenWithoutPlans.length !== 1 ? "S" : ""}
          </span>
        )}
        {data.sleepPlans.overduePlans > 0 && (
          <span className="rounded-full bg-amber-100 text-amber-700 px-3 py-1 text-xs font-medium border border-amber-200">
            {data.sleepPlans.overduePlans} OVERDUE PLAN{data.sleepPlans.overduePlans !== 1 ? "S" : ""}
          </span>
        )}
        {data.disturbances.mostCommonType && (
          <span className="rounded-full bg-purple-100 text-purple-700 px-3 py-1 text-xs font-medium border border-purple-200">
            COMMON: {getDisturbanceTypeLabel(data.disturbances.mostCommonType).toUpperCase()}
          </span>
        )}
      </div>

      {/* Child Sleep Profiles */}
      <div className="mb-5">
        <button
          onClick={() => toggle("profiles")}
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
        >
          <span className={`transform transition-transform ${expandedSection === "profiles" ? "rotate-90" : ""}`}>&#9654;</span>
          Child Sleep Profiles ({data.childProfiles.length})
        </button>
        {expandedSection === "profiles" && (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.childProfiles.map((profile) => (
              <ChildProfileCard key={profile.childId} profile={profile} />
            ))}
          </div>
        )}
      </div>

      {/* Disturbance Analysis */}
      <div className="mb-5">
        <button
          onClick={() => toggle("disturbances")}
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
        >
          <span className={`transform transition-transform ${expandedSection === "disturbances" ? "rotate-90" : ""}`}>&#9654;</span>
          Disturbance Analysis
        </button>
        {expandedSection === "disturbances" && (
          <div className="mt-3 rounded-lg border border-gray-200 bg-white p-4 space-y-4">
            {/* By Type */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">By Type</h4>
              <div className="space-y-1">
                {Object.entries(data.disturbances.disturbancesByType)
                  .sort(([, a], [, b]) => b - a)
                  .map(([type, count]) => (
                    <div key={type} className="flex justify-between items-center py-1">
                      <span className="text-sm text-gray-600">{getDisturbanceTypeLabel(type as DisturbanceType)}</span>
                      <span className="text-sm font-medium text-gray-900">{count}</span>
                    </div>
                  ))}
              </div>
            </div>
            {/* Time of Night */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Time of Night</h4>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-indigo-50 p-2">
                  <span className="text-lg font-bold text-indigo-700">{data.disturbances.timeOfNightDistribution.early}</span>
                  <p className="text-xs text-indigo-600">Before Midnight</p>
                </div>
                <div className="rounded-lg bg-indigo-50 p-2">
                  <span className="text-lg font-bold text-indigo-700">{data.disturbances.timeOfNightDistribution.middle}</span>
                  <p className="text-xs text-indigo-600">00:00 - 04:00</p>
                </div>
                <div className="rounded-lg bg-indigo-50 p-2">
                  <span className="text-lg font-bold text-indigo-700">{data.disturbances.timeOfNightDistribution.late}</span>
                  <p className="text-xs text-indigo-600">After 04:00</p>
                </div>
              </div>
            </div>
            {/* By Child */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">By Child</h4>
              <div className="space-y-1">
                {data.disturbances.disturbancesByChild.map((c) => (
                  <div key={c.childId} className="flex justify-between items-center py-1 border-b border-gray-100 last:border-0">
                    <span className="text-sm text-gray-700">{c.childName}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">{c.types.map((t) => getDisturbanceTypeLabel(t)).join(", ")}</span>
                      <span className="text-sm font-medium text-gray-900">{c.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Night Care Quality */}
      <div className="mb-5">
        <button
          onClick={() => toggle("nightcare")}
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
        >
          <span className={`transform transition-transform ${expandedSection === "nightcare" ? "rotate-90" : ""}`}>&#9654;</span>
          Night Care Quality
        </button>
        {expandedSection === "nightcare" && (
          <div className="mt-3 rounded-lg border border-gray-200 bg-white p-4 space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">Night Check Completion</span>
                <span className="font-medium">{data.nightCare.nightCheckCompletionRate}%</span>
              </div>
              <ProgressBar value={data.nightCare.nightCheckCompletionRate} max={100} color="bg-blue-500" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">Bedtime Routine Adherence</span>
                <span className="font-medium">{data.nightCare.bedtimeRoutineRate}%</span>
              </div>
              <ProgressBar value={data.nightCare.bedtimeRoutineRate} max={100} color="bg-blue-500" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">Wellbeing Improvement Rate</span>
                <span className="font-medium">{data.nightCare.wellbeingImprovementRate}%</span>
              </div>
              <ProgressBar value={data.nightCare.wellbeingImprovementRate} max={100} color={data.nightCare.wellbeingImprovementRate >= 70 ? "bg-green-500" : "bg-amber-500"} />
            </div>
            {Object.keys(data.nightCare.supportProvidedDistribution).length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2 mt-2">Support Provided</h4>
                <div className="space-y-1">
                  {Object.entries(data.nightCare.supportProvidedDistribution)
                    .sort(([, a], [, b]) => b - a)
                    .map(([support, count]) => (
                      <div key={support} className="flex justify-between items-center py-1">
                        <span className="text-sm text-gray-600">{getSupportLabel(support as SupportProvided)}</span>
                        <span className="text-sm font-medium text-gray-900">{count}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sleep Plan Adherence */}
      <div className="mb-5">
        <button
          onClick={() => toggle("plans")}
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
        >
          <span className={`transform transition-transform ${expandedSection === "plans" ? "rotate-90" : ""}`}>&#9654;</span>
          Sleep Plan Adherence
        </button>
        {expandedSection === "plans" && (
          <div className="mt-3 rounded-lg border border-gray-200 bg-white p-4 space-y-2">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="text-center">
                <span className="text-lg font-bold text-gray-900">{data.sleepPlans.totalPlans}</span>
                <p className="text-xs text-gray-500">Total Plans</p>
              </div>
              <div className="text-center">
                <span className="text-lg font-bold text-green-600">{data.sleepPlans.plansUpToDate}</span>
                <p className="text-xs text-gray-500">Up to Date</p>
              </div>
              <div className="text-center">
                <span className={`text-lg font-bold ${data.sleepPlans.overduePlans > 0 ? "text-red-600" : "text-gray-900"}`}>{data.sleepPlans.overduePlans}</span>
                <p className="text-xs text-gray-500">Overdue</p>
              </div>
              <div className="text-center">
                <span className="text-lg font-bold text-blue-600">{data.sleepPlans.bedtimeAdherenceRate}%</span>
                <p className="text-xs text-gray-500">Bedtime Adherence</p>
              </div>
            </div>
            {data.sleepPlans.childrenWithoutPlans.length > 0 && (
              <div className="mt-3 rounded-lg bg-red-50 border border-red-200 p-3">
                <h4 className="text-sm font-semibold text-red-800 mb-1">Children Without Sleep Plans</h4>
                <ul className="space-y-1">
                  {data.sleepPlans.childrenWithoutPlans.map((c) => (
                    <li key={c.childId} className="text-sm text-red-700">- {c.childName}</li>
                  ))}
                </ul>
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
                <li key={i} className="text-sm text-red-700">- {action}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <h4 className="text-sm font-semibold text-green-800 mb-2">Strengths</h4>
          <ul className="space-y-1">
            {data.strengths.map((s, i) => (
              <li key={i} className="text-sm text-green-700">- {s}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <h4 className="text-sm font-semibold text-amber-800 mb-2">Areas for Improvement</h4>
          <ul className="space-y-1">
            {data.areasForImprovement.map((a, i) => (
              <li key={i} className="text-sm text-amber-700">- {a}</li>
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
                <li key={i} className="text-xs text-gray-600">- {link}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

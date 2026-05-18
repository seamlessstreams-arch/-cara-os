"use client";

import React, { useEffect, useState } from "react";
import type {
  HandoverIntelligenceResult,
  ShiftProfile,
  HandoverItem,
} from "@/lib/handover/handover-engine";
import { getShiftLabel, getItemCategoryLabel } from "@/lib/handover/handover-engine";

// -- Rating Badge -------------------------------------------------------------

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
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm font-semibold ${colorMap[rating] ?? "bg-gray-100 text-gray-800 border-gray-300"}`}
    >
      {labelMap[rating] ?? rating} -- {score}/100
    </span>
  );
}

// -- Metric Card --------------------------------------------------------------

function MetricCard({
  label,
  value,
  suffix,
  color,
}: {
  label: string;
  value: number | string;
  suffix?: string;
  color?: string;
}) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
      <span className={`text-2xl font-bold ${color ?? "text-gray-900"}`}>
        {value}
        {suffix}
      </span>
      <span className="mt-1 text-xs text-gray-500 text-center">{label}</span>
    </div>
  );
}

// -- Progress Bar -------------------------------------------------------------

function ProgressBar({
  value,
  max,
  color,
}: {
  value: number;
  max: number;
  color: string;
}) {
  const pctVal = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${pctVal}%` }}
        />
      </div>
      <span className="text-xs font-medium text-gray-600 w-10 text-right">
        {pctVal}%
      </span>
    </div>
  );
}

// -- Continuity Badge ---------------------------------------------------------

function ContinuityBadge({ rating }: { rating: string }) {
  const map: Record<string, string> = {
    excellent: "bg-green-100 text-green-700 border-green-200",
    good: "bg-blue-100 text-blue-700 border-blue-200",
    adequate: "bg-amber-100 text-amber-700 border-amber-200",
    poor: "bg-red-100 text-red-700 border-red-200",
  };
  const labels: Record<string, string> = {
    excellent: "EXCELLENT",
    good: "GOOD",
    adequate: "ADEQUATE",
    poor: "POOR",
  };
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${map[rating] ?? "bg-gray-100 text-gray-700"}`}
    >
      {labels[rating] ?? rating}
    </span>
  );
}

// -- Shift Profile Card -------------------------------------------------------

function ShiftCard({ profile }: { profile: ShiftProfile }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-gray-900">
          {getShiftLabel(profile.shiftType)}
        </h4>
        <span className="text-xs text-gray-500">
          {profile.totalHandovers} handovers
        </span>
      </div>
      <div className="space-y-2">
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Completion Rate</span>
            <span>{profile.completionRate}%</span>
          </div>
          <ProgressBar
            value={profile.completionRate}
            max={100}
            color={
              profile.completionRate >= 95
                ? "bg-green-500"
                : profile.completionRate >= 80
                  ? "bg-blue-500"
                  : "bg-amber-500"
            }
          />
        </div>
        <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t">
          <div>
            <span className="text-lg font-bold text-gray-900">
              {profile.avgQualityScore}
            </span>
            <p className="text-xs text-gray-500">Quality</p>
          </div>
          <div>
            <span className="text-lg font-bold text-gray-900">
              {profile.avgDuration}m
            </span>
            <p className="text-xs text-gray-500">Avg Duration</p>
          </div>
          <div>
            <span
              className={`text-lg font-bold ${profile.criticalItemsMissed > 0 ? "text-red-600" : "text-green-600"}`}
            >
              {profile.criticalItemsMissed}
            </span>
            <p className="text-xs text-gray-500">Critical Missed</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// -- Critical Item Row --------------------------------------------------------

function CriticalItemRow({ item }: { item: HandoverItem }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-2">
        <span
          className={`w-2 h-2 rounded-full ${item.acknowledged ? "bg-green-500" : "bg-red-500"}`}
        />
        <span className="text-sm text-gray-700">
          {item.childName ? `${item.childName} -- ` : ""}
          {item.summary}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">
          {getItemCategoryLabel(item.category)}
        </span>
        {!item.acknowledged && (
          <span className="text-xs font-medium text-red-600">UNACKNOWLEDGED</span>
        )}
      </div>
    </div>
  );
}

// -- Main Widget --------------------------------------------------------------

export function HandoverDashboardWidget() {
  const [data, setData] = useState<HandoverIntelligenceResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/handover")
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
        <h3 className="font-semibold text-red-800">Handover Intelligence</h3>
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
            Handover Intelligence
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            {data.periodStart} to {data.periodEnd} -- CHR 2015 Reg 13/12
          </p>
        </div>
        <RatingBadge rating={data.rating} score={data.overallScore} />
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <MetricCard
          label="Completion Rate"
          value={data.completeness.completionRate}
          suffix="%"
          color={
            data.completeness.completionRate >= 95
              ? "text-green-600"
              : data.completeness.completionRate >= 80
                ? "text-amber-600"
                : "text-red-600"
          }
        />
        <MetricCard
          label="Quality Score"
          value={data.quality.overallQualityScore}
          suffix="%"
          color={
            data.quality.overallQualityScore >= 90
              ? "text-green-600"
              : data.quality.overallQualityScore >= 70
                ? "text-amber-600"
                : "text-red-600"
          }
        />
        <MetricCard
          label="Critical Info Acknowledged"
          value={data.informationTransfer.criticalAcknowledgedRate}
          suffix="%"
          color={
            data.informationTransfer.criticalAcknowledgedRate >= 100
              ? "text-green-600"
              : data.informationTransfer.criticalAcknowledgedRate >= 80
                ? "text-amber-600"
                : "text-red-600"
          }
        />
        <MetricCard
          label="Continuity Rating"
          value={data.continuity.continuityRating.replace(/_/g, " ")}
          color={
            data.continuity.continuityRating === "excellent"
              ? "text-green-600"
              : data.continuity.continuityRating === "good"
                ? "text-blue-600"
                : data.continuity.continuityRating === "adequate"
                  ? "text-amber-600"
                  : "text-red-600"
          }
        />
      </div>

      {/* Status Badges */}
      <div className="flex flex-wrap gap-2 mb-5">
        {data.completeness.missed > 0 && (
          <span className="rounded-full bg-red-100 text-red-700 px-3 py-1 text-xs font-medium border border-red-200">
            {data.completeness.missed} MISSED HANDOVER
            {data.completeness.missed !== 1 ? "S" : ""}
          </span>
        )}
        {data.informationTransfer.unacknowledgedCriticalItems.length > 0 && (
          <span className="rounded-full bg-red-100 text-red-700 px-3 py-1 text-xs font-medium border border-red-200">
            {data.informationTransfer.unacknowledgedCriticalItems.length}{" "}
            UNACKNOWLEDGED CRITICAL ITEM
            {data.informationTransfer.unacknowledgedCriticalItems.length !== 1
              ? "S"
              : ""}
          </span>
        )}
        {data.shiftProfiles.some(
          (p) => p.avgQualityScore < 60 && p.totalHandovers > 0,
        ) && (
          <span className="rounded-full bg-amber-100 text-amber-700 px-3 py-1 text-xs font-medium border border-amber-200">
            LOW QUALITY SHIFTS DETECTED
          </span>
        )}
        {data.completeness.completionRate >= 95 && (
          <span className="rounded-full bg-green-100 text-green-700 px-3 py-1 text-xs font-medium border border-green-200">
            STRONG COMPLETION RATE
          </span>
        )}
        {data.quality.overallQualityScore >= 90 && (
          <span className="rounded-full bg-green-100 text-green-700 px-3 py-1 text-xs font-medium border border-green-200">
            HIGH QUALITY HANDOVERS
          </span>
        )}
        {data.completeness.late > 0 && (
          <span className="rounded-full bg-amber-100 text-amber-700 px-3 py-1 text-xs font-medium border border-amber-200">
            {data.completeness.late} LATE HANDOVER
            {data.completeness.late !== 1 ? "S" : ""}
          </span>
        )}
      </div>

      {/* Shift Profiles */}
      <div className="mb-5">
        <button
          onClick={() => toggle("shifts")}
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
        >
          <span
            className={`transform transition-transform ${expandedSection === "shifts" ? "rotate-90" : ""}`}
          >
            {">"}
          </span>
          Shift Profiles ({data.shiftProfiles.length})
        </button>
        {expandedSection === "shifts" && (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.shiftProfiles.map((profile) => (
              <ShiftCard key={profile.shiftType} profile={profile} />
            ))}
          </div>
        )}
      </div>

      {/* Critical Item Tracking */}
      {data.informationTransfer.unacknowledgedCriticalItems.length > 0 && (
        <div className="mb-5">
          <button
            onClick={() => toggle("critical")}
            className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
          >
            <span
              className={`transform transition-transform ${expandedSection === "critical" ? "rotate-90" : ""}`}
            >
              {">"}
            </span>
            Critical Item Tracking (
            {data.informationTransfer.unacknowledgedCriticalItems.length}{" "}
            unacknowledged)
          </button>
          {expandedSection === "critical" && (
            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-4 space-y-1">
              {data.informationTransfer.unacknowledgedCriticalItems.map(
                (item) => (
                  <CriticalItemRow key={item.id} item={item} />
                ),
              )}
            </div>
          )}
        </div>
      )}

      {/* Quality Indicators */}
      <div className="mb-5">
        <button
          onClick={() => toggle("quality")}
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
        >
          <span
            className={`transform transition-transform ${expandedSection === "quality" ? "rotate-90" : ""}`}
          >
            {">"}
          </span>
          Quality Indicators
        </button>
        {expandedSection === "quality" && (
          <div className="mt-3 rounded-lg border border-gray-200 bg-white p-4 space-y-3">
            {[
              {
                label: "Child Updates Included",
                value: data.quality.childUpdatesRate,
              },
              {
                label: "Risk Updates Included",
                value: data.quality.riskUpdatesRate,
              },
              {
                label: "Medication Updates Included",
                value: data.quality.medicationUpdatesRate,
              },
              {
                label: "Incidents Briefed",
                value: data.quality.incidentBriefingRate,
              },
              {
                label: "Emotional Presentation Noted",
                value: data.quality.emotionalPresentationRate,
              },
              {
                label: "Plan Changes Highlighted",
                value: data.quality.planChangesRate,
              },
            ].map((indicator) => (
              <div key={indicator.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700 font-medium">
                    {indicator.label}
                  </span>
                  <span
                    className={`text-xs font-medium ${indicator.value >= 90 ? "text-green-600" : indicator.value >= 70 ? "text-amber-600" : "text-red-600"}`}
                  >
                    {indicator.value}%
                  </span>
                </div>
                <ProgressBar
                  value={indicator.value}
                  max={100}
                  color={
                    indicator.value >= 90
                      ? "bg-green-500"
                      : indicator.value >= 70
                        ? "bg-amber-500"
                        : "bg-red-500"
                  }
                />
              </div>
            ))}
            <div className="pt-2 border-t text-sm text-gray-600">
              Average Duration: {data.quality.avgDurationMinutes} minutes
            </div>
          </div>
        )}
      </div>

      {/* Continuity Analysis */}
      <div className="mb-5">
        <button
          onClick={() => toggle("continuity")}
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
        >
          <span
            className={`transform transition-transform ${expandedSection === "continuity" ? "rotate-90" : ""}`}
          >
            {">"}
          </span>
          Continuity Analysis
        </button>
        {expandedSection === "continuity" && (
          <div className="mt-3 rounded-lg border border-gray-200 bg-white p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Continuity Rating</span>
              <ContinuityBadge rating={data.continuity.continuityRating} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">
                Consistent Staffing Rate
              </span>
              <span className="text-sm font-medium text-gray-900">
                {data.continuity.consistentStaffRate}%
              </span>
            </div>
            <div className="pt-2 border-t">
              <span className="text-xs font-semibold text-gray-600 mb-2 block">
                Shift Coverage by Type
              </span>
              {Object.entries(data.continuity.shiftCoverageByType)
                .filter(([, v]) => v > 0)
                .map(([shift, coverage]) => (
                  <div key={shift} className="mb-2">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>{getShiftLabel(shift as any)}</span>
                      <span>{coverage}%</span>
                    </div>
                    <ProgressBar
                      value={coverage}
                      max={100}
                      color={
                        coverage >= 95
                          ? "bg-green-500"
                          : coverage >= 80
                            ? "bg-blue-500"
                            : "bg-amber-500"
                      }
                    />
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Strengths / Areas / Actions */}
      <div className="space-y-4 mb-5">
        {data.actions.length > 0 &&
          !data.actions[0].includes("No immediate") && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <h4 className="text-sm font-semibold text-red-800 mb-2">
                Immediate Actions
              </h4>
              <ul className="space-y-1">
                {data.actions.map((action, i) => (
                  <li key={i} className="text-sm text-red-700">
                    {action}
                  </li>
                ))}
              </ul>
            </div>
          )}

        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <h4 className="text-sm font-semibold text-green-800 mb-2">
            Strengths
          </h4>
          <ul className="space-y-1">
            {data.strengths.map((s, i) => (
              <li key={i} className="text-sm text-green-700">
                {s}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <h4 className="text-sm font-semibold text-amber-800 mb-2">
            Areas for Improvement
          </h4>
          <ul className="space-y-1">
            {data.areasForImprovement.map((a, i) => (
              <li key={i} className="text-sm text-amber-700">
                {a}
              </li>
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
          <span
            className={`transform transition-transform ${expandedSection === "regulatory" ? "rotate-90" : ""}`}
          >
            {">"}
          </span>
          Regulatory Framework
        </button>
        {expandedSection === "regulatory" && (
          <div className="mt-3 rounded-lg border border-gray-200 bg-white p-4">
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
    </div>
  );
}

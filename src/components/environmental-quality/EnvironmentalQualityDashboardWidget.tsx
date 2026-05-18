"use client";

import React, { useEffect, useState } from "react";
import type {
  EnvironmentalQualityIntelligence,
} from "@/lib/environmental-quality/environmental-quality-engine";
import {
  getInspectionAreaLabel,
} from "@/lib/environmental-quality/environmental-quality-engine";

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

// ── Main Widget ──────────────────────────────────────────────────────────────

export function EnvironmentalQualityDashboardWidget() {
  const [data, setData] = useState<EnvironmentalQualityIntelligence | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/environmental-quality")
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
        <h3 className="font-semibold text-red-800">Environmental Quality Intelligence</h3>
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
            Environmental Quality
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            {data.periodStart} to {data.periodEnd} · CHR 2015 Reg 27/6 · SCCIF · NMS
          </p>
        </div>
        <RatingBadge rating={data.rating} score={data.overallScore} />
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <MetricCard
          label="Overall Score"
          value={data.overallScore}
          suffix="/100"
          color={data.overallScore >= 80 ? "text-green-600" : data.overallScore >= 60 ? "text-blue-600" : data.overallScore >= 40 ? "text-amber-600" : "text-red-600"}
        />
        <MetricCard
          label="Avg Inspection Score"
          value={data.inspectionQuality.averageScore}
          suffix="/10"
          color={data.inspectionQuality.averageScore >= 8 ? "text-green-600" : data.inspectionQuality.averageScore >= 6 ? "text-blue-600" : "text-red-600"}
        />
        <MetricCard
          label="Maintenance Completion"
          value={data.maintenanceResponsiveness.completionRate}
          suffix="%"
          color={data.maintenanceResponsiveness.completionRate >= 80 ? "text-green-600" : data.maintenanceResponsiveness.completionRate >= 60 ? "text-amber-600" : "text-red-600"}
        />
        <MetricCard
          label="Child Satisfaction"
          value={data.childSatisfaction.averageSatisfaction}
          suffix="/10"
          color={data.childSatisfaction.averageSatisfaction >= 8 ? "text-green-600" : data.childSatisfaction.averageSatisfaction >= 6 ? "text-blue-600" : "text-red-600"}
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <MetricCard label="Inspections" value={data.inspectionQuality.inspectionCount} />
        <MetricCard
          label="Bedroom Personalised"
          value={data.personalisation.bedroomPersonalisedRate}
          suffix="%"
          color={data.personalisation.bedroomPersonalisedRate === 100 ? "text-green-600" : "text-amber-600"}
        />
        <MetricCard
          label="Overdue Repairs"
          value={data.maintenanceResponsiveness.overdueCount}
          color={data.maintenanceResponsiveness.overdueCount === 0 ? "text-green-600" : "text-red-600"}
        />
        <MetricCard
          label="Feels Safe"
          value={data.childSatisfaction.feelsSafeRate}
          suffix="%"
          color={data.childSatisfaction.feelsSafeRate === 100 ? "text-green-600" : data.childSatisfaction.feelsSafeRate >= 80 ? "text-blue-600" : "text-red-600"}
        />
      </div>

      {/* Status Badges */}
      <div className="flex flex-wrap gap-2 mb-5">
        {data.personalisation.bedroomPersonalisedRate === 100 && (
          <span className="rounded-full bg-green-100 text-green-700 px-3 py-1 text-xs font-medium border border-green-200">
            ALL BEDROOMS PERSONALISED
          </span>
        )}
        {data.childSatisfaction.feelsSafeRate === 100 && (
          <span className="rounded-full bg-green-100 text-green-700 px-3 py-1 text-xs font-medium border border-green-200">
            ALL CHILDREN FEEL SAFE
          </span>
        )}
        {data.maintenanceResponsiveness.overdueCount === 0 && data.maintenanceResponsiveness.totalRequests > 0 && (
          <span className="rounded-full bg-green-100 text-green-700 px-3 py-1 text-xs font-medium border border-green-200">
            NO OVERDUE MAINTENANCE
          </span>
        )}
        {data.maintenanceResponsiveness.overdueCount > 0 && (
          <span className="rounded-full bg-red-100 text-red-700 px-3 py-1 text-xs font-medium border border-red-200">
            {data.maintenanceResponsiveness.overdueCount} OVERDUE REPAIR{data.maintenanceResponsiveness.overdueCount !== 1 ? "S" : ""}
          </span>
        )}
        {data.maintenanceResponsiveness.emergencyCount > 0 && (
          <span className="rounded-full bg-red-100 text-red-700 px-3 py-1 text-xs font-medium border border-red-200">
            {data.maintenanceResponsiveness.emergencyCount} EMERGENCY REQUEST{data.maintenanceResponsiveness.emergencyCount !== 1 ? "S" : ""}
          </span>
        )}
        {data.inspectionQuality.issueCount > 5 && (
          <span className="rounded-full bg-amber-100 text-amber-700 px-3 py-1 text-xs font-medium border border-amber-200">
            {data.inspectionQuality.issueCount} INSPECTION ISSUES
          </span>
        )}
      </div>

      {/* Inspection Quality */}
      <div className="mb-5">
        <button
          onClick={() => toggle("inspections")}
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
        >
          <span className={`transform transition-transform ${expandedSection === "inspections" ? "rotate-90" : ""}`}>&#9654;</span>
          Inspection Quality
        </button>
        {expandedSection === "inspections" && (
          <div className="mt-3 rounded-lg border border-gray-200 bg-white p-4 space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div>
                <span className="text-lg font-bold text-gray-900">{data.inspectionQuality.inspectionCount}</span>
                <p className="text-xs text-gray-500">Inspections</p>
              </div>
              <div>
                <span className="text-lg font-bold text-gray-900">{data.inspectionQuality.roomsCovered}</span>
                <p className="text-xs text-gray-500">Rooms Covered</p>
              </div>
              <div>
                <span className={`text-lg font-bold ${data.inspectionQuality.issueCount > 5 ? "text-red-600" : data.inspectionQuality.issueCount > 0 ? "text-amber-600" : "text-green-600"}`}>
                  {data.inspectionQuality.issueCount}
                </span>
                <p className="text-xs text-gray-500">Issues Found</p>
              </div>
              <div>
                <span className="text-lg font-bold text-purple-600">{data.inspectionQuality.photographicRate}%</span>
                <p className="text-xs text-gray-500">With Photos</p>
              </div>
            </div>
            <div className="pt-2 border-t border-gray-100">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">Area Coverage</span>
                <span className="font-medium">{data.inspectionQuality.areasCovered}/{data.inspectionQuality.totalAreas}</span>
              </div>
              <ProgressBar value={data.inspectionQuality.areaCoverageRate} max={100} color="bg-blue-500" />
            </div>
            {data.inspectionQuality.highestScoringArea !== "N/A" && (
              <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-100">
                <div>
                  <span className="text-gray-500">Highest: </span>
                  <span className="font-medium text-green-700">{getInspectionAreaLabel(data.inspectionQuality.highestScoringArea as never)} ({data.inspectionQuality.highestScoringAreaScore}/10)</span>
                </div>
                <div>
                  <span className="text-gray-500">Lowest: </span>
                  <span className="font-medium text-red-700">{getInspectionAreaLabel(data.inspectionQuality.lowestScoringArea as never)} ({data.inspectionQuality.lowestScoringAreaScore}/10)</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Maintenance Responsiveness */}
      <div className="mb-5">
        <button
          onClick={() => toggle("maintenance")}
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
        >
          <span className={`transform transition-transform ${expandedSection === "maintenance" ? "rotate-90" : ""}`}>&#9654;</span>
          Maintenance Responsiveness ({data.maintenanceResponsiveness.totalRequests} requests)
        </button>
        {expandedSection === "maintenance" && (
          <div className="mt-3 rounded-lg border border-gray-200 bg-white p-4 space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div>
                <span className="text-lg font-bold text-green-600">{data.maintenanceResponsiveness.completedCount}</span>
                <p className="text-xs text-gray-500">Completed</p>
              </div>
              <div>
                <span className="text-lg font-bold text-blue-600">{data.maintenanceResponsiveness.scheduledCount}</span>
                <p className="text-xs text-gray-500">Scheduled</p>
              </div>
              <div>
                <span className={`text-lg font-bold ${data.maintenanceResponsiveness.overdueCount > 0 ? "text-red-600" : "text-green-600"}`}>
                  {data.maintenanceResponsiveness.overdueCount}
                </span>
                <p className="text-xs text-gray-500">Overdue</p>
              </div>
              <div>
                <span className={`text-lg font-bold ${data.maintenanceResponsiveness.emergencyCount > 0 ? "text-red-600" : "text-gray-900"}`}>
                  {data.maintenanceResponsiveness.emergencyCount}
                </span>
                <p className="text-xs text-gray-500">Emergency</p>
              </div>
            </div>
            <div className="pt-2 border-t border-gray-100">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">Completion Rate</span>
                <span className="font-medium">{data.maintenanceResponsiveness.completionRate}%</span>
              </div>
              <ProgressBar value={data.maintenanceResponsiveness.completionRate} max={100} color={data.maintenanceResponsiveness.completionRate >= 80 ? "bg-green-500" : "bg-amber-500"} />
            </div>
            {data.maintenanceResponsiveness.completedCount > 0 && (
              <div className="flex justify-between text-sm pt-2 border-t border-gray-100">
                <span className="text-gray-700">Avg Days to Resolve</span>
                <span className={`font-medium ${data.maintenanceResponsiveness.averageDaysToResolve <= 3 ? "text-green-600" : data.maintenanceResponsiveness.averageDaysToResolve <= 7 ? "text-amber-600" : "text-red-600"}`}>
                  {data.maintenanceResponsiveness.averageDaysToResolve} days
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Personalisation */}
      <div className="mb-5">
        <button
          onClick={() => toggle("personalisation")}
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
        >
          <span className={`transform transition-transform ${expandedSection === "personalisation" ? "rotate-90" : ""}`}>&#9654;</span>
          Personalisation ({data.personalisation.totalChildren} children)
        </button>
        {expandedSection === "personalisation" && (
          <div className="mt-3 rounded-lg border border-gray-200 bg-white p-4 space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">Bedroom Personalised</span>
                <span className="font-medium">{data.personalisation.bedroomPersonalisedRate}%</span>
              </div>
              <ProgressBar value={data.personalisation.bedroomPersonalisedRate} max={100} color="bg-purple-500" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">Choice in Decor</span>
                <span className="font-medium">{data.personalisation.choiceInDecorRate}%</span>
              </div>
              <ProgressBar value={data.personalisation.choiceInDecorRate} max={100} color="bg-blue-500" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">Personal Items</span>
                <span className="font-medium">{data.personalisation.personalItemsRate}%</span>
              </div>
              <ProgressBar value={data.personalisation.personalItemsRate} max={100} color="bg-green-500" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">Cultural Considerations</span>
                <span className="font-medium">{data.personalisation.culturalConsiderationsRate}%</span>
              </div>
              <ProgressBar value={data.personalisation.culturalConsiderationsRate} max={100} color="bg-orange-500" />
            </div>
            <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-100">
              <span className="text-gray-700">Fully Personalised Children</span>
              <span className="font-semibold text-gray-900">
                {data.personalisation.fullyPersonalisedCount}/{data.personalisation.totalChildren}
              </span>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">Review Currency</span>
                <span className="font-medium">{data.personalisation.reviewCurrency}%</span>
              </div>
              <ProgressBar value={data.personalisation.reviewCurrency} max={100} color={data.personalisation.reviewCurrency >= 80 ? "bg-green-500" : "bg-amber-500"} />
            </div>
          </div>
        )}
      </div>

      {/* Child Satisfaction */}
      <div className="mb-5">
        <button
          onClick={() => toggle("satisfaction")}
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
        >
          <span className={`transform transition-transform ${expandedSection === "satisfaction" ? "rotate-90" : ""}`}>&#9654;</span>
          Child Satisfaction ({data.childSatisfaction.childrenWithViews} children)
        </button>
        {expandedSection === "satisfaction" && (
          <div className="mt-3 rounded-lg border border-gray-200 bg-white p-4 space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div>
                <span className={`text-lg font-bold ${data.childSatisfaction.averageSatisfaction >= 8 ? "text-green-600" : data.childSatisfaction.averageSatisfaction >= 6 ? "text-blue-600" : "text-red-600"}`}>
                  {data.childSatisfaction.averageSatisfaction}/10
                </span>
                <p className="text-xs text-gray-500">Avg Satisfaction</p>
              </div>
              <div>
                <span className={`text-lg font-bold ${data.childSatisfaction.feelsHomelyRate >= 80 ? "text-green-600" : "text-amber-600"}`}>
                  {data.childSatisfaction.feelsHomelyRate}%
                </span>
                <p className="text-xs text-gray-500">Feels Homely</p>
              </div>
              <div>
                <span className={`text-lg font-bold ${data.childSatisfaction.feelsPrivateRate >= 80 ? "text-green-600" : "text-amber-600"}`}>
                  {data.childSatisfaction.feelsPrivateRate}%
                </span>
                <p className="text-xs text-gray-500">Feels Private</p>
              </div>
              <div>
                <span className={`text-lg font-bold ${data.childSatisfaction.feelsSafeRate === 100 ? "text-green-600" : "text-red-600"}`}>
                  {data.childSatisfaction.feelsSafeRate}%
                </span>
                <p className="text-xs text-gray-500">Feels Safe</p>
              </div>
            </div>
            {data.childSatisfaction.suggestionCount > 0 && (
              <div className="flex justify-between text-sm pt-2 border-t border-gray-100">
                <span className="text-gray-700">Suggestions from Children</span>
                <span className="font-medium text-amber-600">
                  {data.childSatisfaction.suggestionCount} from {data.childSatisfaction.childrenWithSuggestions} child{data.childSatisfaction.childrenWithSuggestions !== 1 ? "ren" : ""}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Strengths / Areas / Actions */}
      <div className="space-y-4 mb-5">
        {data.actions.length > 0 && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <h4 className="text-sm font-semibold text-red-800 mb-2">Actions Required</h4>
            <ul className="space-y-1">
              {data.actions.map((action, i) => (
                <li key={i} className="text-sm text-red-700">- {action}</li>
              ))}
            </ul>
          </div>
        )}

        {data.strengths.length > 0 && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <h4 className="text-sm font-semibold text-green-800 mb-2">Strengths</h4>
            <ul className="space-y-1">
              {data.strengths.map((s, i) => (
                <li key={i} className="text-sm text-green-700">- {s}</li>
              ))}
            </ul>
          </div>
        )}

        {data.areasForImprovement.length > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <h4 className="text-sm font-semibold text-amber-800 mb-2">Areas for Improvement</h4>
            <ul className="space-y-1">
              {data.areasForImprovement.map((a, i) => (
                <li key={i} className="text-sm text-amber-700">- {a}</li>
              ))}
            </ul>
          </div>
        )}
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

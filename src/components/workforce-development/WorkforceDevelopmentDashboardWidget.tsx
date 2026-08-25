"use client";

import React, { useEffect, useState } from "react";
import { formatRate, meets } from "@/lib/metrics/rate";
import type {
  WorkforceDevelopmentResult,
  CPDCategory,
  CompetencyLevel,
} from "@/lib/workforce-development/workforce-development-engine";
import {
  getCPDCategoryLabel,
  getCompetencyLevelLabel,
} from "@/lib/workforce-development/workforce-development-engine";

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
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm font-semibold ${colorMap[rating] ?? "bg-gray-100 text-gray-800 border-gray-300"}`}
    >
      {labelMap[rating] ?? rating} &mdash; {score}/100
    </span>
  );
}

// ── Metric Card ──────────────────────────────────────────────────────────────

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

// ── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({
  value,
  max,
  color,
}: {
  /** null when the population is empty — nothing measured, not 0%. */
  value: number | null;
  max: number;
  color: string;
}) {
  const pctVal = value !== null && max > 0 ? Math.round((value / max) * 100) : null;
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${pctVal ?? 0}%` }}
        />
      </div>
      <span className="text-xs font-medium text-gray-600 w-10 text-right">
        {pctVal}%
      </span>
    </div>
  );
}

// ── Competency Level Badge ───────────────────────────────────────────────────

function CompetencyBadge({ level }: { level: CompetencyLevel }) {
  const colorMap: Record<CompetencyLevel, string> = {
    developing: "bg-amber-100 text-amber-700 border-amber-200",
    competent: "bg-blue-100 text-blue-700 border-blue-200",
    proficient: "bg-green-100 text-green-700 border-green-200",
    expert: "bg-purple-100 text-purple-700 border-purple-200",
  };
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${colorMap[level]}`}
    >
      {getCompetencyLevelLabel(level)}
    </span>
  );
}

// ── Section Toggle ───────────────────────────────────────────────────────────

function SectionHeader({
  title,
  isOpen,
  onToggle,
}: {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center justify-between w-full py-2 text-left group"
    >
      <h4 className="font-semibold text-gray-800 group-hover:text-gray-600 transition-colors">
        {title}
      </h4>
      <span className="text-gray-400 text-sm">{isOpen ? "Hide" : "Show"}</span>
    </button>
  );
}

// ── Goal Status Badge ────────────────────────────────────────────────────────

function GoalStatusBadge({
  status,
}: {
  status: "not_started" | "in_progress" | "achieved" | "overdue";
}) {
  const map: Record<string, string> = {
    not_started: "bg-gray-100 text-gray-600 border-gray-200",
    in_progress: "bg-blue-100 text-blue-700 border-blue-200",
    achieved: "bg-green-100 text-green-700 border-green-200",
    overdue: "bg-red-100 text-red-700 border-red-200",
  };
  const labels: Record<string, string> = {
    not_started: "NOT STARTED",
    in_progress: "IN PROGRESS",
    achieved: "ACHIEVED",
    overdue: "OVERDUE",
  };
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${map[status]}`}
    >
      {labels[status]}
    </span>
  );
}

// ── Main Widget ──────────────────────────────────────────────────────────────

export function WorkforceDevelopmentDashboardWidget() {
  const [data, setData] = useState<WorkforceDevelopmentResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/workforce-development")
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
        <div className="h-6 w-56 rounded bg-gray-200 mb-4" />
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
        <h3 className="font-semibold text-red-800">
          Workforce Development Intelligence
        </h3>
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
            Workforce Development
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            {data.periodStart} to {data.periodEnd} &middot; CHR 2015 Reg 32/33
            &middot; Reg 13
          </p>
        </div>
        <RatingBadge rating={data.rating} score={data.overallScore} />
      </div>

      {/* Key Metrics Row 1 */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-5">
        <MetricCard
          label="Mandatory Qual Compliance"
          value={formatRate(data.qualifications.mandatoryComplianceRate)}
          color={
            meets(data.qualifications.mandatoryComplianceRate, 90)
              ? "text-green-600"
              : meets(data.qualifications.mandatoryComplianceRate, 70)
                ? "text-amber-600"
                : "text-red-600"
          }
        />
        <MetricCard
          label="Level 3+ Rate"
          value={formatRate(data.qualifications.level3PlusRate)}
          color={
            meets(data.qualifications.level3PlusRate, 90)
              ? "text-green-600"
              : meets(data.qualifications.level3PlusRate, 70)
                ? "text-amber-600"
                : "text-red-600"
          }
        />
        <MetricCard
          label="CPD Hours Target Met"
          value={formatRate(data.cpd.hoursTargetMetRate)}
          color={
            meets(data.cpd.hoursTargetMetRate, 80)
              ? "text-green-600"
              : meets(data.cpd.hoursTargetMetRate, 50)
                ? "text-amber-600"
                : "text-red-600"
          }
        />
        <MetricCard
          label="Dev Plan Coverage"
          value={formatRate(data.developmentPlanning.planCoverageRate)}
          color={
            meets(data.developmentPlanning.planCoverageRate, 100)
              ? "text-green-600"
              : meets(data.developmentPlanning.planCoverageRate, 80)
                ? "text-amber-600"
                : "text-red-600"
          }
        />
        <MetricCard
          label="Good+ Practice"
          value={formatRate(data.practiceQuality.goodOrBetterRate)}
          color={
            meets(data.practiceQuality.goodOrBetterRate, 80)
              ? "text-green-600"
              : meets(data.practiceQuality.goodOrBetterRate, 60)
                ? "text-amber-600"
                : "text-red-600"
          }
        />
      </div>

      {/* Key Metrics Row 2 */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-5">
        <MetricCard
          label="Total Staff"
          value={data.qualifications.totalStaff}
        />
        <MetricCard
          label="Avg CPD Hours"
          value={data.cpd.averageHoursPerStaff}
          suffix="h"
        />
        <MetricCard
          label="CPD Reflection Rate"
          value={formatRate(data.cpd.overallReflectionRate)}
        />
        <MetricCard
          label="Competency Progression"
          value={formatRate(data.competency.progressionRate)}
        />
        <MetricCard
          label="Goals Achieved"
          value={data.developmentPlanning.goalsAchieved}
          suffix={`/${data.developmentPlanning.totalGoals}`}
        />
      </div>

      {/* Status Badges */}
      <div className="flex flex-wrap gap-2 mb-5">
        {data.qualifications.overdueCount > 0 && (
          <span className="rounded-full bg-red-100 text-red-700 px-3 py-1 text-xs font-medium border border-red-200">
            {data.qualifications.overdueCount} OVERDUE QUAL
            {data.qualifications.overdueCount !== 1 ? "S" : ""}
          </span>
        )}
        {data.qualifications.inProgressCount > 0 && (
          <span className="rounded-full bg-blue-100 text-blue-700 px-3 py-1 text-xs font-medium border border-blue-200">
            {data.qualifications.inProgressCount} QUAL IN PROGRESS
          </span>
        )}
        {data.developmentPlanning.goalsOverdue > 0 && (
          <span className="rounded-full bg-amber-100 text-amber-700 px-3 py-1 text-xs font-medium border border-amber-200">
            {data.developmentPlanning.goalsOverdue} OVERDUE GOAL
            {data.developmentPlanning.goalsOverdue !== 1 ? "S" : ""}
          </span>
        )}
        {data.practiceQuality.improvementTrajectory === "improving" && (
          <span className="rounded-full bg-green-100 text-green-700 px-3 py-1 text-xs font-medium border border-green-200">
            IMPROVING TRAJECTORY
          </span>
        )}
        {data.practiceQuality.improvementTrajectory === "declining" && (
          <span className="rounded-full bg-red-100 text-red-700 px-3 py-1 text-xs font-medium border border-red-200">
            DECLINING TRAJECTORY
          </span>
        )}
        {data.competency.areasNeedingDevelopment.length > 0 && (
          <span className="rounded-full bg-amber-100 text-amber-700 px-3 py-1 text-xs font-medium border border-amber-200">
            {data.competency.areasNeedingDevelopment.length} COMPETENCY AREA
            {data.competency.areasNeedingDevelopment.length !== 1 ? "S" : ""}{" "}
            DEVELOPING
          </span>
        )}
      </div>

      {/* ── Expandable Sections ─────────────────────────────────────────── */}
      <div className="space-y-2 border-t border-gray-200 pt-4">
        {/* Qualifications */}
        <div className="border-b border-gray-100">
          <SectionHeader
            title="Qualifications"
            isOpen={expandedSection === "qualifications"}
            onToggle={() => toggle("qualifications")}
          />
          {expandedSection === "qualifications" && (
            <div className="pb-4 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                <div className="bg-white rounded-lg p-2 border text-center">
                  <div className="font-bold text-gray-900">
                    {data.qualifications.mandatoryAchieved}/
                    {data.qualifications.mandatoryTotal}
                  </div>
                  <div className="text-xs text-gray-500">
                    Mandatory Achieved
                  </div>
                </div>
                <div className="bg-white rounded-lg p-2 border text-center">
                  <div className="font-bold text-gray-900">
                    {data.qualifications.level3PlusCount}/
                    {data.qualifications.totalStaff}
                  </div>
                  <div className="text-xs text-gray-500">Level 3+ Staff</div>
                </div>
                <div className="bg-white rounded-lg p-2 border text-center">
                  <div className="font-bold text-gray-900">
                    {data.qualifications.inProgressCount}
                  </div>
                  <div className="text-xs text-gray-500">In Progress</div>
                </div>
                <div className="bg-white rounded-lg p-2 border text-center">
                  <div className="font-bold text-gray-900">
                    {data.qualifications.evidenceRecordedRate}%
                  </div>
                  <div className="text-xs text-gray-500">Evidence Recorded</div>
                </div>
              </div>
              {data.qualifications.staffBreakdown.map((sb) => (
                <div
                  key={sb.staffId}
                  className="bg-white rounded-lg p-3 border text-sm"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-800">
                      {sb.staffName}
                    </span>
                    <div className="flex gap-1">
                      {sb.mandatoryMet && (
                        <span className="text-xs bg-green-100 text-green-700 rounded-full px-2 py-0.5 border border-green-200">
                          MANDATORY MET
                        </span>
                      )}
                      {sb.hasLevel3Plus && (
                        <span className="text-xs bg-blue-100 text-blue-700 rounded-full px-2 py-0.5 border border-blue-200">
                          L3+
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {sb.qualifications.length} qualification
                    {sb.qualifications.length !== 1 ? "s" : ""} recorded
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CPD */}
        <div className="border-b border-gray-100">
          <SectionHeader
            title="Continuing Professional Development"
            isOpen={expandedSection === "cpd"}
            onToggle={() => toggle("cpd")}
          />
          {expandedSection === "cpd" && (
            <div className="pb-4 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                <div className="bg-white rounded-lg p-2 border text-center">
                  <div className="font-bold text-gray-900">
                    {data.cpd.totalHours}h
                  </div>
                  <div className="text-xs text-gray-500">Total CPD Hours</div>
                </div>
                <div className="bg-white rounded-lg p-2 border text-center">
                  <div className="font-bold text-gray-900">
                    {data.cpd.overallReflectionRate}%
                  </div>
                  <div className="text-xs text-gray-500">Reflection Rate</div>
                </div>
                <div className="bg-white rounded-lg p-2 border text-center">
                  <div className="font-bold text-gray-900">
                    {data.cpd.overallSignOffRate}%
                  </div>
                  <div className="text-xs text-gray-500">
                    Supervisor Sign-Off
                  </div>
                </div>
                <div className="bg-white rounded-lg p-2 border text-center">
                  <div className="font-bold text-gray-900">
                    {data.cpd.overallImpactDocumentedRate}%
                  </div>
                  <div className="text-xs text-gray-500">
                    Impact Documented
                  </div>
                </div>
              </div>
              {data.cpd.staffCPD.map((sc) => (
                <div
                  key={sc.staffId}
                  className="bg-white rounded-lg p-3 border text-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-800">
                      {sc.staffName}
                    </span>
                    <span className="text-xs text-gray-500">
                      {sc.hoursCompleted}h / 30h target
                    </span>
                  </div>
                  <ProgressBar
                    value={sc.hoursCompleted}
                    max={30}
                    color={sc.hoursCompleted >= 30 ? "bg-green-500" : "bg-blue-500"}
                  />
                  <div className="flex flex-wrap gap-1 mt-2">
                    {sc.categoriesCovered.map((cat: CPDCategory) => (
                      <span
                        key={cat}
                        className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5"
                      >
                        {getCPDCategoryLabel(cat)}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
              {data.cpd.categoryCoverage.length > 0 && (
                <div className="bg-white rounded-lg p-3 border">
                  <h5 className="text-xs font-semibold text-gray-600 mb-2">
                    Category Coverage
                  </h5>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {data.cpd.categoryCoverage.map((cc) => (
                      <div
                        key={cc.category}
                        className="text-xs text-gray-600 flex justify-between"
                      >
                        <span>{getCPDCategoryLabel(cc.category)}</span>
                        <span className="font-medium">
                          {cc.count} ({cc.totalHours}h)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Competency */}
        <div className="border-b border-gray-100">
          <SectionHeader
            title="Competency Assessments"
            isOpen={expandedSection === "competency"}
            onToggle={() => toggle("competency")}
          />
          {expandedSection === "competency" && (
            <div className="pb-4 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                <div className="bg-white rounded-lg p-2 border text-center">
                  <div className="font-bold text-gray-900">
                    {data.competency.totalAssessments}
                  </div>
                  <div className="text-xs text-gray-500">
                    Total Assessments
                  </div>
                </div>
                <div className="bg-white rounded-lg p-2 border text-center">
                  <div className="font-bold text-green-600">
                    {data.competency.progressionCount}
                  </div>
                  <div className="text-xs text-gray-500">Progressions</div>
                </div>
                <div className="bg-white rounded-lg p-2 border text-center">
                  <div className="font-bold text-gray-600">
                    {data.competency.staticCount}
                  </div>
                  <div className="text-xs text-gray-500">Static</div>
                </div>
                <div className="bg-white rounded-lg p-2 border text-center">
                  <div className="font-bold text-gray-900">
                    {data.competency.assessmentCurrency.currencyRate}%
                  </div>
                  <div className="text-xs text-gray-500">
                    Assessment Currency
                  </div>
                </div>
              </div>
              {/* Distribution bar */}
              <div className="bg-white rounded-lg p-3 border">
                <h5 className="text-xs font-semibold text-gray-600 mb-2">
                  Competency Distribution
                </h5>
                <div className="flex h-4 rounded-full overflow-hidden bg-gray-100">
                  {(
                    [
                      "expert",
                      "proficient",
                      "competent",
                      "developing",
                    ] as CompetencyLevel[]
                  ).map((level) => {
                    const count = data.competency.competencyDistribution[level];
                    const widthPct =
                      data.competency.totalAssessments > 0
                        ? (count / data.competency.totalAssessments) * 100
                        : 0;
                    const colors: Record<CompetencyLevel, string> = {
                      expert: "bg-purple-500",
                      proficient: "bg-green-500",
                      competent: "bg-blue-500",
                      developing: "bg-amber-500",
                    };
                    return widthPct > 0 ? (
                      <div
                        key={level}
                        className={`${colors[level]}`}
                        style={{ width: `${widthPct}%` }}
                        title={`${getCompetencyLevelLabel(level)}: ${count}`}
                      />
                    ) : null;
                  })}
                </div>
                <div className="flex flex-wrap gap-3 mt-2 text-xs">
                  {(
                    [
                      "expert",
                      "proficient",
                      "competent",
                      "developing",
                    ] as CompetencyLevel[]
                  ).map((level) => (
                    <span key={level} className="flex items-center gap-1">
                      <CompetencyBadge level={level} />
                      <span className="text-gray-500">
                        {data.competency.competencyDistribution[level]}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
              {data.competency.staffCompetencies.map((sc) => (
                <div
                  key={sc.staffId}
                  className="bg-white rounded-lg p-3 border text-sm"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-800">
                      {sc.staffName}
                    </span>
                    {sc.hasProgressed && (
                      <span className="text-xs bg-green-100 text-green-700 rounded-full px-2 py-0.5 border border-green-200">
                        PROGRESSED
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {sc.assessments.map((a) => (
                      <span
                        key={a.id}
                        className="text-xs bg-gray-50 border rounded px-2 py-0.5"
                      >
                        {a.competencyArea}:{" "}
                        <CompetencyBadge level={a.level} />
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Development Planning */}
        <div className="border-b border-gray-100">
          <SectionHeader
            title="Development Planning"
            isOpen={expandedSection === "development"}
            onToggle={() => toggle("development")}
          />
          {expandedSection === "development" && (
            <div className="pb-4 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                <div className="bg-white rounded-lg p-2 border text-center">
                  <div className="font-bold text-gray-900">
                    {data.developmentPlanning.planCoverageRate}%
                  </div>
                  <div className="text-xs text-gray-500">Plan Coverage</div>
                </div>
                <div className="bg-white rounded-lg p-2 border text-center">
                  <div className="font-bold text-gray-900">
                    {data.developmentPlanning.goalAchievementRate}%
                  </div>
                  <div className="text-xs text-gray-500">
                    Goal Achievement
                  </div>
                </div>
                <div className="bg-white rounded-lg p-2 border text-center">
                  <div className="font-bold text-gray-900">
                    {data.developmentPlanning.planCurrencyRate}%
                  </div>
                  <div className="text-xs text-gray-500">Plan Currency</div>
                </div>
                <div className="bg-white rounded-lg p-2 border text-center">
                  <div className="font-bold text-gray-900">
                    {data.developmentPlanning.staffInputRate}%
                  </div>
                  <div className="text-xs text-gray-500">
                    Staff Input Recorded
                  </div>
                </div>
              </div>
              {/* Goal summary */}
              <div className="bg-white rounded-lg p-3 border">
                <h5 className="text-xs font-semibold text-gray-600 mb-2">
                  Goal Status Summary
                </h5>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div>
                    <div className="text-lg font-bold text-green-600">
                      {data.developmentPlanning.goalsAchieved}
                    </div>
                    <div className="text-xs text-gray-500">Achieved</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-blue-600">
                      {data.developmentPlanning.goalsInProgress}
                    </div>
                    <div className="text-xs text-gray-500">In Progress</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-red-600">
                      {data.developmentPlanning.goalsOverdue}
                    </div>
                    <div className="text-xs text-gray-500">Overdue</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-gray-400">
                      {data.developmentPlanning.goalsNotStarted}
                    </div>
                    <div className="text-xs text-gray-500">Not Started</div>
                  </div>
                </div>
              </div>
              {data.developmentPlanning.staffBreakdown.map((sb) => (
                <div
                  key={sb.staffId}
                  className="bg-white rounded-lg p-3 border text-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-800">
                      {sb.staffName}
                    </span>
                    <div className="flex gap-1">
                      {sb.hasPlan ? (
                        <span className="text-xs bg-green-100 text-green-700 rounded-full px-2 py-0.5 border border-green-200">
                          HAS PLAN
                        </span>
                      ) : (
                        <span className="text-xs bg-red-100 text-red-700 rounded-full px-2 py-0.5 border border-red-200">
                          NO PLAN
                        </span>
                      )}
                      {sb.planCurrent && (
                        <span className="text-xs bg-green-100 text-green-700 rounded-full px-2 py-0.5 border border-green-200">
                          CURRENT
                        </span>
                      )}
                    </div>
                  </div>
                  {sb.goalCount > 0 && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>
                          {sb.goalsAchieved}/{sb.goalCount} goals achieved
                        </span>
                        <span>Avg progress: {sb.averageProgress}%</span>
                      </div>
                      <ProgressBar
                        value={sb.averageProgress}
                        max={100}
                        color={
                          sb.averageProgress >= 75
                            ? "bg-green-500"
                            : sb.averageProgress >= 50
                              ? "bg-blue-500"
                              : "bg-amber-500"
                        }
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Practice Quality */}
        <div className="border-b border-gray-100">
          <SectionHeader
            title="Practice Quality"
            isOpen={expandedSection === "practice"}
            onToggle={() => toggle("practice")}
          />
          {expandedSection === "practice" && (
            <div className="pb-4 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                <div className="bg-white rounded-lg p-2 border text-center">
                  <div className="font-bold text-gray-900">
                    {data.practiceQuality.totalObservations}
                  </div>
                  <div className="text-xs text-gray-500">
                    Total Observations
                  </div>
                </div>
                <div className="bg-white rounded-lg p-2 border text-center">
                  <div className="font-bold text-green-600">
                    {data.practiceQuality.goodOrBetterRate}%
                  </div>
                  <div className="text-xs text-gray-500">Good or Better</div>
                </div>
                <div className="bg-white rounded-lg p-2 border text-center">
                  <div className="font-bold text-gray-900">
                    {data.practiceQuality.followUpCompletionRate}%
                  </div>
                  <div className="text-xs text-gray-500">
                    Follow-Up Complete
                  </div>
                </div>
                <div className="bg-white rounded-lg p-2 border text-center">
                  <div className="font-bold text-gray-900">
                    {data.practiceQuality.actionPlanRate}%
                  </div>
                  <div className="text-xs text-gray-500">Action Plans</div>
                </div>
              </div>
              {/* Rating distribution */}
              <div className="bg-white rounded-lg p-3 border">
                <h5 className="text-xs font-semibold text-gray-600 mb-2">
                  Rating Distribution
                </h5>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div>
                    <div className="text-lg font-bold text-green-600">
                      {data.practiceQuality.ratingDistribution.outstanding}
                    </div>
                    <div className="text-xs text-gray-500">Outstanding</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-blue-600">
                      {data.practiceQuality.ratingDistribution.good}
                    </div>
                    <div className="text-xs text-gray-500">Good</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-amber-600">
                      {
                        data.practiceQuality.ratingDistribution
                          .requires_improvement
                      }
                    </div>
                    <div className="text-xs text-gray-500">Req Improvement</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-red-600">
                      {data.practiceQuality.ratingDistribution.inadequate}
                    </div>
                    <div className="text-xs text-gray-500">Inadequate</div>
                  </div>
                </div>
              </div>
              {data.practiceQuality.staffObservations.map((so) => (
                <div
                  key={so.staffId}
                  className="bg-white rounded-lg p-3 border text-sm"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-800">
                      {so.staffName}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {so.observationCount} observation
                        {so.observationCount !== 1 ? "s" : ""}
                      </span>
                      <GoalStatusBadge
                        status={
                          so.latestRating === "outstanding" ||
                          so.latestRating === "good"
                            ? "achieved"
                            : so.latestRating === "requires_improvement"
                              ? "in_progress"
                              : "overdue"
                        }
                      />
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    Latest: {so.latestRating.replace(/_/g, " ")}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Strengths & Actions ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
        {/* Strengths */}
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <h4 className="font-semibold text-green-800 text-sm mb-2">
            Strengths
          </h4>
          <ul className="space-y-1">
            {data.strengths.map((s, i) => (
              <li key={i} className="text-xs text-green-700 flex gap-2">
                <span className="shrink-0 mt-0.5">+</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Areas for Development */}
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <h4 className="font-semibold text-amber-800 text-sm mb-2">
            Areas for Development
          </h4>
          <ul className="space-y-1">
            {data.areasForDevelopment.map((a, i) => (
              <li key={i} className="text-xs text-amber-700 flex gap-2">
                <span className="shrink-0 mt-0.5">-</span>
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Immediate Actions */}
      {data.immediateActions.length > 0 &&
        !data.immediateActions[0].startsWith("No immediate") && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 mt-4">
            <h4 className="font-semibold text-red-800 text-sm mb-2">
              Immediate Actions Required
            </h4>
            <ul className="space-y-1">
              {data.immediateActions.map((ia, i) => (
                <li key={i} className="text-xs text-red-700 flex gap-2">
                  <span className="shrink-0 mt-0.5">!</span>
                  <span>{ia}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

      {/* Regulatory Links */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <p className="text-xs text-gray-400">
          {data.regulatoryLinks.join(" | ")}
        </p>
      </div>
    </div>
  );
}

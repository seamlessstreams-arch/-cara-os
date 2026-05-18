"use client";

import React, { useEffect, useState } from "react";
import type {
  PositiveBehaviourResult,
  ChildBehaviourProfile,
} from "@/lib/positive-behaviour/positive-behaviour-engine";

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
      {labelMap[rating] ?? rating} — {score}/100
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

// ── Child Profile Card ──────────────────────────────────────────────────────

function ChildProfileCard({ profile }: { profile: ChildBehaviourProfile }) {
  const statusColor: Record<string, string> = {
    active: "bg-green-100 text-green-800",
    draft: "bg-gray-100 text-gray-800",
    under_review: "bg-amber-100 text-amber-800",
    expired: "bg-red-100 text-red-800",
    archived: "bg-gray-100 text-gray-600",
    no_plan: "bg-red-100 text-red-800",
  };
  const statusLabel: Record<string, string> = {
    active: "Active Plan",
    draft: "Draft",
    under_review: "Under Review",
    expired: "Expired",
    archived: "Archived",
    no_plan: "No Plan",
  };
  const trendIcon: Record<string, string> = {
    improving: "Improving",
    stable: "Stable",
    declining: "Declining",
    insufficient_data: "Insufficient Data",
  };
  const trendColor: Record<string, string> = {
    improving: "text-green-600",
    stable: "text-blue-600",
    declining: "text-red-600",
    insufficient_data: "text-gray-400",
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-gray-900">{profile.childName}</h4>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[profile.planStatus]}`}
        >
          {statusLabel[profile.planStatus]}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center mb-3">
        <div>
          <span className="text-lg font-bold text-gray-900">
            {profile.deEscalationSuccessRate}%
          </span>
          <p className="text-xs text-gray-500">De-escalation</p>
        </div>
        <div>
          <span className="text-lg font-bold text-gray-900">
            {profile.rewardSanctionRatio}:1
          </span>
          <p className="text-xs text-gray-500">R:S Ratio</p>
        </div>
        <div>
          <span className="text-lg font-bold text-gray-900">
            {profile.incidentCount}
          </span>
          <p className="text-xs text-gray-500">Incidents</p>
        </div>
      </div>

      <div className="flex items-center gap-1 mb-3">
        <span className="text-xs text-gray-500">Trend:</span>
        <span
          className={`text-xs font-medium ${trendColor[profile.improvementTrend]}`}
        >
          {trendIcon[profile.improvementTrend]}
        </span>
      </div>

      {profile.strengths.length > 0 && (
        <div className="mb-2">
          <p className="text-xs font-medium text-green-700 mb-1">Strengths</p>
          <ul className="text-xs text-gray-600 space-y-0.5">
            {profile.strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-1">
                <span className="text-green-500 mt-0.5">+</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {profile.concerns.length > 0 && (
        <div>
          <p className="text-xs font-medium text-red-700 mb-1">Concerns</p>
          <ul className="text-xs text-gray-600 space-y-0.5">
            {profile.concerns.map((c, i) => (
              <li key={i} className="flex items-start gap-1">
                <span className="text-red-500 mt-0.5">!</span>
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── Distribution Row ────────────────────────────────────────────────────────

function DistributionRow({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  if (count === 0) return null;
  const pctVal = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 py-1">
      <span className="text-xs text-gray-600 w-40 truncate">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${pctVal}%` }}
        />
      </div>
      <span className="text-xs font-medium text-gray-500 w-16 text-right">
        {count} ({pctVal}%)
      </span>
    </div>
  );
}

// ── Expandable Section ──────────────────────────────────────────────────────

function ExpandableSection({
  title,
  isExpanded,
  onToggle,
  children,
}: {
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <span className="text-sm font-semibold text-gray-800">{title}</span>
        <span className="text-gray-400 text-sm">{isExpanded ? "−" : "+"}</span>
      </button>
      {isExpanded && <div className="p-4">{children}</div>}
    </div>
  );
}

// ── Main Widget ──────────────────────────────────────────────────────────────

export function PositiveBehaviourDashboardWidget() {
  const [data, setData] = useState<PositiveBehaviourResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/positive-behaviour")
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
        <h3 className="font-semibold text-red-800">
          Positive Behaviour Support Intelligence
        </h3>
        <p className="mt-2 text-sm text-red-600">Failed to load: {error}</p>
      </div>
    );
  }

  const toggle = (section: string) =>
    setExpandedSection((prev) => (prev === section ? null : section));

  const trendLabel =
    data.incidentPatterns.frequencyTrend === "decreasing"
      ? "Decreasing"
      : data.incidentPatterns.frequencyTrend === "increasing"
        ? "Increasing"
        : "Stable";

  const trendColor =
    data.incidentPatterns.frequencyTrend === "decreasing"
      ? "text-green-600"
      : data.incidentPatterns.frequencyTrend === "increasing"
        ? "text-red-600"
        : "text-blue-600";

  return (
    <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-lg font-bold text-gray-900">
            Positive Behaviour Support Intelligence
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            {data.periodStart} to {data.periodEnd} · CHR 2015 Reg 35/19 ·
            SCCIF · NICE CG158 · UNCRC Art. 3
          </p>
        </div>
        <RatingBadge rating={data.rating} score={data.overallScore} />
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <MetricCard
          label="Plan Coverage"
          value={data.bspEvaluation.planCoverageRate}
          suffix="%"
          color={
            data.bspEvaluation.planCoverageRate >= 100
              ? "text-green-600"
              : data.bspEvaluation.planCoverageRate >= 75
                ? "text-amber-600"
                : "text-red-600"
          }
        />
        <MetricCard
          label="De-escalation Success"
          value={data.deEscalation.successRate}
          suffix="%"
          color={
            data.deEscalation.successRate >= 70
              ? "text-green-600"
              : data.deEscalation.successRate >= 50
                ? "text-amber-600"
                : "text-red-600"
          }
        />
        <MetricCard
          label="Reward:Sanction Ratio"
          value={`${data.rewardSanctionBalance.rewardSanctionRatio}:1`}
          color={
            data.rewardSanctionBalance.ratioMeetsTarget
              ? "text-green-600"
              : "text-red-600"
          }
        />
        <MetricCard
          label="Incident Trend"
          value={trendLabel}
          color={trendColor}
        />
      </div>

      {/* Expandable Sections */}
      <div className="space-y-2">
        {/* Child Behaviour Profiles */}
        <ExpandableSection
          title="Child Behaviour Profiles"
          isExpanded={expandedSection === "profiles"}
          onToggle={() => toggle("profiles")}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {data.childProfiles.map((profile) => (
              <ChildProfileCard key={profile.childId} profile={profile} />
            ))}
          </div>
        </ExpandableSection>

        {/* Behaviour Support Plans */}
        <ExpandableSection
          title="Behaviour Support Plans"
          isExpanded={expandedSection === "bsp"}
          onToggle={() => toggle("bsp")}
        >
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <MetricCard
                label="Active Plans"
                value={data.bspEvaluation.activePlans}
              />
              <MetricCard
                label="Plan Currency"
                value={data.bspEvaluation.planCurrencyRate}
                suffix="%"
                color={
                  data.bspEvaluation.planCurrencyRate >= 100
                    ? "text-green-600"
                    : "text-amber-600"
                }
              />
              <MetricCard
                label="Child Involved"
                value={data.bspEvaluation.childInvolvementRate}
                suffix="%"
              />
              <MetricCard
                label="Strategy Complete"
                value={data.bspEvaluation.strategyComprehensivenessRate}
                suffix="%"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-xs text-gray-500">
                  Family Involvement
                </span>
                <ProgressBar
                  value={data.bspEvaluation.familyInvolvementRate}
                  max={100}
                  color="bg-blue-500"
                />
              </div>
              <div>
                <span className="text-xs text-gray-500">
                  Risk Assessment Attached
                </span>
                <ProgressBar
                  value={data.bspEvaluation.riskAssessmentAttachmentRate}
                  max={100}
                  color="bg-blue-500"
                />
              </div>
            </div>
            {data.bspEvaluation.childrenWithoutPlans.length > 0 && (
              <div className="rounded-md bg-red-50 border border-red-200 p-3">
                <p className="text-xs text-red-700 font-medium">
                  {data.bspEvaluation.childrenWithoutPlans.length} child(ren)
                  without active plans
                </p>
              </div>
            )}
          </div>
        </ExpandableSection>

        {/* De-Escalation Analysis */}
        <ExpandableSection
          title="De-Escalation Analysis"
          isExpanded={expandedSection === "deescalation"}
          onToggle={() => toggle("deescalation")}
        >
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <MetricCard
                label="Total Episodes"
                value={data.deEscalation.totalRecords}
              />
              <MetricCard
                label="Success Rate"
                value={data.deEscalation.successRate}
                suffix="%"
                color={
                  data.deEscalation.successRate >= 70
                    ? "text-green-600"
                    : "text-amber-600"
                }
              />
              <MetricCard
                label="PI Avoidance"
                value={data.deEscalation.physicalInterventionAvoidanceRate}
                suffix="%"
                color={
                  data.deEscalation.physicalInterventionAvoidanceRate >= 90
                    ? "text-green-600"
                    : "text-amber-600"
                }
              />
              <MetricCard
                label="Avg Duration"
                value={data.deEscalation.averageDurationMinutes}
                suffix=" min"
              />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">
                Strategy Variety: {data.deEscalation.strategyVariety} unique
                strategies documented
              </p>
            </div>
            {data.deEscalation.perChildPatterns.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-700 mb-2">
                  Per-Child Patterns
                </p>
                <div className="space-y-2">
                  {data.deEscalation.perChildPatterns.map((child) => (
                    <div
                      key={child.childId}
                      className="flex items-center justify-between text-xs border-b border-gray-100 pb-1"
                    >
                      <span className="font-medium text-gray-800">
                        {child.childName}
                      </span>
                      <div className="flex gap-4 text-gray-500">
                        <span>{child.totalAttempts} episodes</span>
                        <span>{child.successRate}% success</span>
                        <span>{child.avgDuration} min avg</span>
                        <span>{child.piAvoidanceRate}% PI avoided</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ExpandableSection>

        {/* Reward & Sanction Balance */}
        <ExpandableSection
          title="Reward & Sanction Balance"
          isExpanded={expandedSection === "balance"}
          onToggle={() => toggle("balance")}
        >
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <MetricCard
                label="Recognitions"
                value={data.rewardSanctionBalance.totalRecognitions}
                color="text-green-600"
              />
              <MetricCard
                label="Sanctions"
                value={data.rewardSanctionBalance.totalSanctions}
                color="text-amber-600"
              />
              <MetricCard
                label="Ratio"
                value={`${data.rewardSanctionBalance.rewardSanctionRatio}:1`}
                color={
                  data.rewardSanctionBalance.ratioMeetsTarget
                    ? "text-green-600"
                    : "text-red-600"
                }
              />
              <MetricCard
                label="Recognition Types"
                value={data.rewardSanctionBalance.recognitionTypeVariety}
              />
            </div>
            {data.rewardSanctionBalance.totalSanctions > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-700">
                  Sanction Quality Indicators
                </p>
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Proportionality</span>
                    <span>
                      {data.rewardSanctionBalance.sanctionProportionalityRate}%
                    </span>
                  </div>
                  <ProgressBar
                    value={
                      data.rewardSanctionBalance.sanctionProportionalityRate
                    }
                    max={100}
                    color="bg-blue-500"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Child Voice Recorded</span>
                    <span>
                      {data.rewardSanctionBalance.childVoiceInSanctionsRate}%
                    </span>
                  </div>
                  <ProgressBar
                    value={
                      data.rewardSanctionBalance.childVoiceInSanctionsRate
                    }
                    max={100}
                    color="bg-purple-500"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Restoration Planned</span>
                    <span>
                      {data.rewardSanctionBalance.restorationPlanningRate}%
                    </span>
                  </div>
                  <ProgressBar
                    value={data.rewardSanctionBalance.restorationPlanningRate}
                    max={100}
                    color="bg-teal-500"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Parent Notified</span>
                    <span>
                      {data.rewardSanctionBalance.parentNotificationRate}%
                    </span>
                  </div>
                  <ProgressBar
                    value={data.rewardSanctionBalance.parentNotificationRate}
                    max={100}
                    color="bg-indigo-500"
                  />
                </div>
              </div>
            )}
          </div>
        </ExpandableSection>

        {/* Incident Patterns */}
        <ExpandableSection
          title="Incident Patterns"
          isExpanded={expandedSection === "incidents"}
          onToggle={() => toggle("incidents")}
        >
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <MetricCard
                label="Total Incidents"
                value={data.incidentPatterns.totalIncidents}
              />
              <MetricCard
                label="Debrief Rate"
                value={data.incidentPatterns.debriefCompletionRate}
                suffix="%"
                color={
                  data.incidentPatterns.debriefCompletionRate >= 90
                    ? "text-green-600"
                    : "text-amber-600"
                }
              />
              <MetricCard
                label="De-escalation Attempted"
                value={data.incidentPatterns.deEscalationAttemptedRate}
                suffix="%"
              />
              <MetricCard
                label="PI Rate"
                value={data.incidentPatterns.physicalInterventionRate}
                suffix="%"
                color={
                  data.incidentPatterns.physicalInterventionRate <= 10
                    ? "text-green-600"
                    : "text-red-600"
                }
              />
            </div>

            {/* Severity Breakdown */}
            <div>
              <p className="text-xs font-medium text-gray-700 mb-2">
                Severity Breakdown
              </p>
              <DistributionRow
                label="Low"
                count={data.incidentPatterns.severityBreakdown.low ?? 0}
                total={data.incidentPatterns.totalIncidents}
                color="bg-green-400"
              />
              <DistributionRow
                label="Medium"
                count={data.incidentPatterns.severityBreakdown.medium ?? 0}
                total={data.incidentPatterns.totalIncidents}
                color="bg-amber-400"
              />
              <DistributionRow
                label="High"
                count={data.incidentPatterns.severityBreakdown.high ?? 0}
                total={data.incidentPatterns.totalIncidents}
                color="bg-orange-500"
              />
              <DistributionRow
                label="Critical"
                count={data.incidentPatterns.severityBreakdown.critical ?? 0}
                total={data.incidentPatterns.totalIncidents}
                color="bg-red-500"
              />
            </div>

            {/* Time of Day */}
            <div>
              <p className="text-xs font-medium text-gray-700 mb-2">
                Time of Day
              </p>
              <DistributionRow
                label="Morning (06-12)"
                count={data.incidentPatterns.timeOfDayPatterns.morning ?? 0}
                total={data.incidentPatterns.totalIncidents}
                color="bg-yellow-400"
              />
              <DistributionRow
                label="Afternoon (12-17)"
                count={data.incidentPatterns.timeOfDayPatterns.afternoon ?? 0}
                total={data.incidentPatterns.totalIncidents}
                color="bg-orange-400"
              />
              <DistributionRow
                label="Evening (17-21)"
                count={data.incidentPatterns.timeOfDayPatterns.evening ?? 0}
                total={data.incidentPatterns.totalIncidents}
                color="bg-purple-400"
              />
              <DistributionRow
                label="Night (21-06)"
                count={data.incidentPatterns.timeOfDayPatterns.night ?? 0}
                total={data.incidentPatterns.totalIncidents}
                color="bg-indigo-400"
              />
            </div>

            {/* Antecedent Analysis */}
            {data.incidentPatterns.antecedentAnalysis.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-700 mb-2">
                  Top Antecedents
                </p>
                {data.incidentPatterns.antecedentAnalysis
                  .slice(0, 5)
                  .map((a) => (
                    <DistributionRow
                      key={a.antecedent}
                      label={a.antecedent}
                      count={a.count}
                      total={data.incidentPatterns.totalIncidents}
                      color="bg-gray-400"
                    />
                  ))}
              </div>
            )}

            {/* Monthly Breakdown */}
            {data.incidentPatterns.monthlyBreakdown.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-700 mb-2">
                  Monthly Trend
                </p>
                <div className="flex items-end gap-1 h-16">
                  {data.incidentPatterns.monthlyBreakdown.map((m) => {
                    const maxCount = Math.max(
                      ...data.incidentPatterns.monthlyBreakdown.map(
                        (mb) => mb.count,
                      ),
                    );
                    const height =
                      maxCount > 0
                        ? Math.round((m.count / maxCount) * 100)
                        : 0;
                    return (
                      <div
                        key={m.month}
                        className="flex-1 flex flex-col items-center"
                      >
                        <div
                          className="w-full bg-blue-400 rounded-t"
                          style={{ height: `${height}%` }}
                        />
                        <span className="text-[9px] text-gray-400 mt-1">
                          {m.month.substring(5)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </ExpandableSection>

        {/* Strengths / Areas / Actions */}
        <ExpandableSection
          title="Strengths, Areas for Improvement & Actions"
          isExpanded={expandedSection === "analysis"}
          onToggle={() => toggle("analysis")}
        >
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-green-700 mb-2">
                Strengths
              </p>
              <ul className="space-y-1">
                {data.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-700">
                    <span className="text-green-500 font-bold mt-0.5">+</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-amber-700 mb-2">
                Areas for Improvement
              </p>
              <ul className="space-y-1">
                {data.areasForImprovement.map((a, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-700">
                    <span className="text-amber-500 font-bold mt-0.5">!</span>
                    {a}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-blue-700 mb-2">
                Actions
              </p>
              <ul className="space-y-1">
                {data.actions.map((a, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-700">
                    <span className="text-blue-500 font-bold mt-0.5">&gt;</span>
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </ExpandableSection>

        {/* Regulatory Framework */}
        <ExpandableSection
          title="Regulatory Framework"
          isExpanded={expandedSection === "regulatory"}
          onToggle={() => toggle("regulatory")}
        >
          <ul className="space-y-2">
            {data.regulatoryLinks.map((r, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-xs text-gray-700"
              >
                <span className="text-gray-400 font-medium mt-0.5">
                  {String.fromCharCode(167)}
                </span>
                {r}
              </li>
            ))}
          </ul>
        </ExpandableSection>
      </div>
    </div>
  );
}

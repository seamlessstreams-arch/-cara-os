"use client";

import React, { useEffect, useState } from "react";
import type {
  RestorativePracticeResult,
  StaffFacilitatorProfile,
  ConversationType,
  TriggerType,
  OutcomeType,
} from "@/lib/restorative-practice/restorative-practice-engine";
import {
  getConversationTypeLabel,
  getTriggerTypeLabel,
  getOutcomeTypeLabel,
} from "@/lib/restorative-practice/restorative-practice-engine";

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

// ── Staff Facilitator Card ──────────────────────────────────────────────────

function FacilitatorCard({ profile }: { profile: StaffFacilitatorProfile }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-gray-900">{profile.staffName}</h4>
        <span className="text-xs text-gray-500">{profile.totalFacilitated} sessions</span>
      </div>
      <div className="space-y-2">
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Quality Score</span>
            <span>{profile.avgQualityScore}%</span>
          </div>
          <ProgressBar value={profile.avgQualityScore} max={100} color="bg-blue-500" />
        </div>
        <div className="grid grid-cols-2 gap-2 text-center pt-2 border-t">
          <div>
            <span className="text-lg font-bold text-gray-900">{profile.repairRate}%</span>
            <p className="text-xs text-gray-500">Repair Rate</p>
          </div>
          <div>
            <span className="text-lg font-bold text-gray-900">{profile.childVoiceRate}%</span>
            <p className="text-xs text-gray-500">Child Voice</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Distribution Bar ────────────────────────────────────────────────────────

function DistributionRow({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  if (count === 0) return null;
  const pctVal = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 py-1">
      <span className="text-xs text-gray-600 w-40 truncate">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pctVal}%` }} />
      </div>
      <span className="text-xs font-medium text-gray-500 w-16 text-right">{count} ({pctVal}%)</span>
    </div>
  );
}

// ── Main Widget ──────────────────────────────────────────────────────────────

export function RestorativePracticeDashboardWidget() {
  const [data, setData] = useState<RestorativePracticeResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/restorative-practice")
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
        <h3 className="font-semibold text-red-800">Restorative Practice Intelligence</h3>
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
            Restorative Practice Intelligence
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            {data.periodStart} to {data.periodEnd} · CHR 2015 Reg 11/12/19
          </p>
        </div>
        <RatingBadge rating={data.rating} score={data.overallScore} />
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <MetricCard
          label="Total Conversations"
          value={data.usage.totalConversations}
          color="text-gray-900"
        />
        <MetricCard
          label="Quality Score"
          value={data.quality.avgQualityScore}
          suffix="%"
          color={data.quality.avgQualityScore >= 80 ? "text-green-600" : data.quality.avgQualityScore >= 60 ? "text-amber-600" : "text-red-600"}
        />
        <MetricCard
          label="Repair Rate"
          value={data.outcomes.repairRate}
          suffix="%"
          color={data.outcomes.repairRate >= 75 ? "text-green-600" : data.outcomes.repairRate >= 50 ? "text-amber-600" : "text-red-600"}
        />
        <MetricCard
          label="Incident Conversion"
          value={data.incidentConversion.conversionRate}
          suffix="%"
          color={data.incidentConversion.conversionRate >= 60 ? "text-green-600" : data.incidentConversion.conversionRate >= 40 ? "text-amber-600" : "text-red-600"}
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <MetricCard label="Per Week" value={data.usage.conversationsPerWeek} />
        <MetricCard label="Child Voice" value={data.quality.childVoiceRate} suffix="%" />
        <MetricCard label="Follow-Up Rate" value={data.outcomes.followUpRate} suffix="%" />
        <MetricCard label="Avg Duration" value={data.usage.avgDuration} suffix="m" />
      </div>

      {/* Status Badges */}
      <div className="flex flex-wrap gap-2 mb-5">
        {data.outcomes.escalatedCount > 0 && (
          <span className="rounded-full bg-red-100 text-red-700 px-3 py-1 text-xs font-medium border border-red-200">
            {data.outcomes.escalatedCount} ESCALATED
          </span>
        )}
        {data.usage.declinedCount > 0 && (
          <span className="rounded-full bg-amber-100 text-amber-700 px-3 py-1 text-xs font-medium border border-amber-200">
            {data.usage.declinedCount} DECLINED
          </span>
        )}
        {data.usage.scheduledCount > 0 && (
          <span className="rounded-full bg-blue-100 text-blue-700 px-3 py-1 text-xs font-medium border border-blue-200">
            {data.usage.scheduledCount} SCHEDULED
          </span>
        )}
        {data.quality.childLedRate >= 30 && (
          <span className="rounded-full bg-green-100 text-green-700 px-3 py-1 text-xs font-medium border border-green-200">
            {data.quality.childLedRate}% CHILD-LED
          </span>
        )}
        {data.outcomes.repairRate >= 75 && (
          <span className="rounded-full bg-green-100 text-green-700 px-3 py-1 text-xs font-medium border border-green-200">
            STRONG REPAIR RATE
          </span>
        )}
      </div>

      {/* Usage Analysis */}
      <div className="mb-5">
        <button
          onClick={() => toggle("usage")}
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
        >
          <span className={`transform transition-transform ${expandedSection === "usage" ? "rotate-90" : ""}`}>&#9654;</span>
          Usage Analysis
        </button>
        {expandedSection === "usage" && (
          <div className="mt-3 rounded-lg border border-gray-200 bg-white p-4 space-y-4">
            <div>
              <h5 className="text-xs font-semibold text-gray-600 mb-2">By Conversation Type</h5>
              {(Object.entries(data.usage.byType) as [ConversationType, number][]).map(([type, count]) => (
                <DistributionRow
                  key={type}
                  label={getConversationTypeLabel(type)}
                  count={count}
                  total={data.usage.totalConversations}
                  color="bg-blue-500"
                />
              ))}
            </div>
            <div>
              <h5 className="text-xs font-semibold text-gray-600 mb-2">By Trigger</h5>
              {(Object.entries(data.usage.byTrigger) as [TriggerType, number][]).map(([trigger, count]) => (
                <DistributionRow
                  key={trigger}
                  label={getTriggerTypeLabel(trigger)}
                  count={count}
                  total={data.usage.totalConversations}
                  color="bg-amber-500"
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quality Indicators */}
      <div className="mb-5">
        <button
          onClick={() => toggle("quality")}
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
        >
          <span className={`transform transition-transform ${expandedSection === "quality" ? "rotate-90" : ""}`}>&#9654;</span>
          Quality Indicators
        </button>
        {expandedSection === "quality" && (
          <div className="mt-3 rounded-lg border border-gray-200 bg-white p-4 space-y-3">
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>All Parties Heard</span>
                <span>{data.quality.allPartiesHeardRate}%</span>
              </div>
              <ProgressBar value={data.quality.allPartiesHeardRate} max={100} color="bg-green-500" />
            </div>
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Harm Acknowledged</span>
                <span>{data.quality.harmAcknowledgedRate}%</span>
              </div>
              <ProgressBar value={data.quality.harmAcknowledgedRate} max={100} color="bg-green-500" />
            </div>
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Needs Identified</span>
                <span>{data.quality.needsIdentifiedRate}%</span>
              </div>
              <ProgressBar value={data.quality.needsIdentifiedRate} max={100} color="bg-green-500" />
            </div>
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Repair Plan Agreed</span>
                <span>{data.quality.repairPlanRate}%</span>
              </div>
              <ProgressBar value={data.quality.repairPlanRate} max={100} color="bg-green-500" />
            </div>
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Emotions Explored</span>
                <span>{data.quality.emotionsExploredRate}%</span>
              </div>
              <ProgressBar value={data.quality.emotionsExploredRate} max={100} color="bg-green-500" />
            </div>
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Child Voice Heard</span>
                <span>{data.quality.childVoiceRate}%</span>
              </div>
              <ProgressBar value={data.quality.childVoiceRate} max={100} color="bg-blue-500" />
            </div>
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Child-Led Resolution</span>
                <span>{data.quality.childLedRate}%</span>
              </div>
              <ProgressBar value={data.quality.childLedRate} max={100} color="bg-blue-500" />
            </div>
          </div>
        )}
      </div>

      {/* Outcome Tracking */}
      <div className="mb-5">
        <button
          onClick={() => toggle("outcomes")}
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
        >
          <span className={`transform transition-transform ${expandedSection === "outcomes" ? "rotate-90" : ""}`}>&#9654;</span>
          Outcome Tracking
        </button>
        {expandedSection === "outcomes" && (
          <div className="mt-3 rounded-lg border border-gray-200 bg-white p-4 space-y-3">
            <div>
              <h5 className="text-xs font-semibold text-gray-600 mb-2">Outcome Distribution</h5>
              {(Object.entries(data.outcomes.outcomeDistribution) as [OutcomeType, number][]).map(([outcome, count]) => (
                <DistributionRow
                  key={outcome}
                  label={getOutcomeTypeLabel(outcome)}
                  count={count}
                  total={data.quality.conversationsAssessed}
                  color={
                    outcome === "relationship_repaired" || outcome === "agreement_reached" || outcome === "understanding_improved"
                      ? "bg-green-500"
                      : outcome === "escalated" || outcome === "no_resolution"
                        ? "bg-red-500"
                        : "bg-amber-500"
                  }
                />
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3 pt-3 border-t">
              <div className="text-center">
                <span className="text-lg font-bold text-green-600">{data.outcomes.totalResolved}</span>
                <p className="text-xs text-gray-500">Positive Outcomes</p>
              </div>
              <div className="text-center">
                <span className="text-lg font-bold text-gray-900">{data.outcomes.averageAgreementsPerConversation}</span>
                <p className="text-xs text-gray-500">Avg Agreements</p>
              </div>
              <div className="text-center">
                <span className="text-lg font-bold text-blue-600">{data.outcomes.followUpCompletedRate}%</span>
                <p className="text-xs text-gray-500">Follow-Ups Done</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Staff Facilitator Profiles */}
      <div className="mb-5">
        <button
          onClick={() => toggle("staff")}
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
        >
          <span className={`transform transition-transform ${expandedSection === "staff" ? "rotate-90" : ""}`}>&#9654;</span>
          Staff Facilitator Profiles ({data.staffProfiles.length})
        </button>
        {expandedSection === "staff" && (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.staffProfiles.map((profile) => (
              <FacilitatorCard key={profile.staffName} profile={profile} />
            ))}
          </div>
        )}
      </div>

      {/* Incident-to-Restorative Pipeline */}
      <div className="mb-5">
        <button
          onClick={() => toggle("pipeline")}
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
        >
          <span className={`transform transition-transform ${expandedSection === "pipeline" ? "rotate-90" : ""}`}>&#9654;</span>
          Incident-to-Restorative Pipeline
        </button>
        {expandedSection === "pipeline" && (
          <div className="mt-3 rounded-lg border border-gray-200 bg-white p-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="text-center">
                <span className="text-lg font-bold text-gray-900">{data.incidentConversion.totalLinkedIncidents}</span>
                <p className="text-xs text-gray-500">Linked Incidents</p>
              </div>
              <div className="text-center">
                <span className="text-lg font-bold text-green-600">{data.incidentConversion.incidentsWithRestorative}</span>
                <p className="text-xs text-gray-500">With Restorative</p>
              </div>
              <div className="text-center">
                <span className="text-lg font-bold text-blue-600">{data.incidentConversion.conversionRate}%</span>
                <p className="text-xs text-gray-500">Conversion Rate</p>
              </div>
              <div className="text-center">
                <span className="text-lg font-bold text-gray-900">{data.incidentConversion.avgDaysToRestorative}d</span>
                <p className="text-xs text-gray-500">Avg Days to Response</p>
              </div>
            </div>
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

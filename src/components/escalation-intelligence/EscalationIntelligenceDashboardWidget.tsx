"use client";

// ══════════════════════════════════════════════════════════════════════════════
// ESCALATION INTELLIGENCE DASHBOARD WIDGET
//
// Displays threshold decision quality and escalation compliance:
// - Overall score with Ofsted-aligned rating
// - Threshold accuracy and notification compliance
// - Concern-level breakdown with outcomes
// - Overdue notifications with urgency indicators
// - Regulatory references
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";

interface ThresholdAssessment {
  concernId: string;
  category: string;
  severity: number;
  determinedLevel: string;
  outcome: string;
  timeliness: string;
  missingEscalations: { target: string; timeframe: string; isOverdue: boolean; hoursOverdue?: number }[];
  concerns: string[];
}

interface EscalationData {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: string;
  totalConcernsRaised: number;
  totalEscalations: number;
  escalationsTimely: number;
  escalationsDelayed: number;
  escalationsMissing: number;
  thresholdAccuracyRate: number;
  ofstedComplianceRate: number;
  laComplianceRate: number;
  multiAgencyEngagementRate: number;
  averageResponseTimeHours: number;
  assessments: ThresholdAssessment[];
  strengths: string[];
  concerns: string[];
  immediateActions: string[];
  regulatoryLinks: string[];
  meta?: {
    concernSummary: { id: string; date: string; category: string; severity: number; childName?: string }[];
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

// ── Compliance Gauge ───────────────────────────────────────────────────────

function ComplianceGauge({ label, value }: { label: string; value: number }) {
  const color =
    value >= 90 ? "text-green-700 bg-green-100"
      : value >= 70 ? "text-yellow-700 bg-yellow-100"
        : "text-red-700 bg-red-100";

  return (
    <div className={`rounded-lg p-3 text-center ${color}`}>
      <div className="text-2xl font-bold">{value}%</div>
      <div className="text-xs font-medium mt-0.5">{label}</div>
    </div>
  );
}

// ── Assessment Row ─────────────────────────────────────────────────────────

function AssessmentRow({ assessment, concern }: {
  assessment: ThresholdAssessment;
  concern?: { date: string; category: string; severity: number; childName?: string };
}) {
  const outcomeColors: Record<string, string> = {
    appropriate_and_timely: "bg-green-100 text-green-700",
    appropriate_but_delayed: "bg-yellow-100 text-yellow-700",
    under_escalated: "bg-orange-100 text-orange-700",
    not_escalated: "bg-red-100 text-red-700",
    pending: "bg-gray-100 text-gray-600",
  };

  const outcomeLabels: Record<string, string> = {
    appropriate_and_timely: "Timely",
    appropriate_but_delayed: "Delayed",
    under_escalated: "Under-escalated",
    not_escalated: "Not escalated",
    pending: "Pending",
  };

  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">
            {concern?.category ?? assessment.category}
          </span>
          {concern?.childName && (
            <span className="text-xs text-gray-400">({concern.childName})</span>
          )}
          <span className="text-xs text-gray-400">{concern?.date}</span>
        </div>
        {assessment.missingEscalations.length > 0 && (
          <div className="text-[10px] text-red-500 mt-0.5">
            Missing: {assessment.missingEscalations.filter((m) => m.isOverdue).length} overdue notification(s)
          </div>
        )}
      </div>
      <span className={`text-xs font-medium px-2 py-0.5 rounded shrink-0 ${outcomeColors[assessment.outcome] ?? "bg-gray-100 text-gray-600"}`}>
        {outcomeLabels[assessment.outcome] ?? assessment.outcome}
      </span>
    </div>
  );
}

// ── Main Widget ────────────────────────────────────────────────────────────

export function EscalationIntelligenceDashboardWidget() {
  const [data, setData] = useState<EscalationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/escalation-intelligence");
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
        <h3 className="font-semibold text-red-800">Escalation Intelligence</h3>
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
            Threshold & Escalation Intelligence
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {data.periodStart} to {data.periodEnd} | {data.totalConcernsRaised} concerns | {data.totalEscalations} escalations
          </p>
        </div>
        <RatingBadge score={data.overallScore} rating={data.rating} />
      </div>

      {/* Compliance Gauges */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <ComplianceGauge label="Threshold Accuracy" value={data.thresholdAccuracyRate} />
        <ComplianceGauge label="Ofsted Compliance" value={data.ofstedComplianceRate} />
        <ComplianceGauge label="LA Compliance" value={data.laComplianceRate} />
        <ComplianceGauge label="Multi-Agency" value={data.multiAgencyEngagementRate} />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="text-center p-2 bg-green-50 rounded">
          <div className="text-lg font-bold text-green-700">{data.escalationsTimely}</div>
          <div className="text-[10px] text-gray-500 uppercase">Timely</div>
        </div>
        <div className="text-center p-2 bg-yellow-50 rounded">
          <div className="text-lg font-bold text-yellow-700">{data.escalationsDelayed}</div>
          <div className="text-[10px] text-gray-500 uppercase">Delayed</div>
        </div>
        <div className="text-center p-2 bg-red-50 rounded">
          <div className="text-lg font-bold text-red-700">{data.escalationsMissing}</div>
          <div className="text-[10px] text-gray-500 uppercase">Missing</div>
        </div>
      </div>

      {/* Immediate Actions */}
      {data.immediateActions.length > 0 &&
        !data.immediateActions[0].startsWith("No immediate actions") && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <h4 className="text-sm font-semibold text-red-800 mb-2">Urgent Actions</h4>
            <ul className="space-y-1">
              {data.immediateActions.slice(0, 3).map((action, i) => (
                <li key={i} className="text-xs text-red-700 flex items-start gap-1.5">
                  <span className="mt-0.5 shrink-0">
                    {action.startsWith("IMMEDIATE") ? "🔴" : action.startsWith("URGENT") ? "🟠" : "🟡"}
                  </span>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

      {/* Expandable */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-sm text-blue-600 hover:text-blue-800 font-medium w-full text-left"
      >
        {expanded ? "Hide details ▲" : "Show concern assessments ▼"}
      </button>

      {expanded && (
        <div className="mt-4 space-y-4">
          {/* Per-concern assessments */}
          <div>
            <h4 className="text-sm font-semibold text-gray-800 mb-2">Concern Assessments</h4>
            <div className="bg-gray-50 rounded-lg p-3">
              {data.assessments.map((a) => {
                const concern = data.meta?.concernSummary?.find((c) => c.id === a.concernId);
                return <AssessmentRow key={a.concernId} assessment={a} concern={concern} />;
              })}
            </div>
          </div>

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

          {/* Concerns */}
          {data.concerns.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-orange-800 mb-2">Areas of Concern</h4>
              <ul className="space-y-1">
                {data.concerns.map((c, i) => (
                  <li key={i} className="text-xs text-orange-700">- {c}</li>
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

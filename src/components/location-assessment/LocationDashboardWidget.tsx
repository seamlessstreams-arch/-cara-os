// ══════════════════════════════════════════════════════════════════════════════
// LocationDashboardWidget — Location Assessment dashboard card
// ══════════════════════════════════════════════════════════════════════════════

"use client";

import { formatRate } from "@/lib/metrics/rate";
import { useEffect, useState } from "react";

interface AssessmentSummary {
  id: string;
  homeName: string;
  address: string;
  assessmentDate: string;
  reviewDueDate: string;
  status: string;
  overallRiskLevel: string;
  overallSuitability: string;
}

interface Compliance {
  isCompliant: boolean;
  overdue: boolean;
  daysUntilReviewDue: number;
  annexACoverage: number;
  servicesAccessScore: number;
  areaRiskScore: number;
  gpAccessible: boolean;
  educationAccessible: boolean;
  camhsAccessible: boolean;
  publicTransportAdequate: boolean;
  childrenConsulted: boolean;
  highRiskAreas: string[];
  issues: string[];
  warnings: string[];
}

interface Metrics {
  overallLocationScore: number;
  totalServicesAssessed: number;
  servicesWithinReach: number;
  totalAreaRisks: number;
  highRisks: number;
  mediumRisks: number;
  mitigationsInPlace: number;
  neighbourRelationshipsPositive: number;
  neighbourRelationshipsNegative: number;
  totalActions: number;
  completedActions: number;
  outstandingActions: number;
  overdueActions: number;
  actionCompletionRate: number;
}

interface DashboardData {
  assessment: AssessmentSummary;
  compliance: Compliance;
  metrics: Metrics;
  keyStrengths: string[];
  keyRisks: string[];
  childrenViews: string[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getRiskColour(level: string): string {
  switch (level) {
    case "low": return "bg-green-100 text-green-800";
    case "medium": return "bg-amber-100 text-amber-800";
    case "high": return "bg-red-100 text-red-800";
    case "very_high": return "bg-red-200 text-red-900";
    default: return "bg-slate-100 text-slate-700";
  }
}

function getSuitabilityColour(suitability: string): string {
  switch (suitability) {
    case "suitable": return "text-green-700";
    case "suitable_with_mitigations": return "text-amber-700";
    case "unsuitable": return "text-red-700";
    default: return "text-slate-700";
  }
}

function getScoreColour(score: number): string {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-amber-600";
  return "text-red-600";
}

// ── Component ────────────────────────────────────────────────────────────────

export function LocationDashboardWidget() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/location-assessment?homeId=home-oak&mode=dashboard")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch location data");
        return res.json();
      })
      .then((json) => setData(json))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm animate-pulse">
        <div className="h-6 w-48 bg-slate-200 rounded mb-4" />
        <div className="space-y-3">
          <div className="h-4 w-full bg-slate-100 rounded" />
          <div className="h-4 w-3/4 bg-slate-100 rounded" />
          <div className="h-4 w-1/2 bg-slate-100 rounded" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <p className="text-red-700 text-sm">Error loading location data: {error}</p>
      </div>
    );
  }

  const { assessment, compliance, metrics, keyStrengths, keyRisks, childrenViews } = data;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Location Assessment
          </h3>
          <p className="text-sm text-slate-500 mt-0.5">
            {assessment.address}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium px-2 py-0.5 rounded ${getRiskColour(assessment.overallRiskLevel)}`}>
            {assessment.overallRiskLevel.replace("_", " ")} risk
          </span>
          <span className={`text-sm font-semibold ${getSuitabilityColour(assessment.overallSuitability)}`}>
            {assessment.overallSuitability.replace(/_/g, " ")}
          </span>
        </div>
      </div>

      {/* Scores */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Overall Score"
          value={`${metrics.overallLocationScore}%`}
          sub="weighted location score"
          score={metrics.overallLocationScore}
        />
        <MetricCard
          label="Services Access"
          value={`${compliance.servicesAccessScore}%`}
          sub={`${metrics.servicesWithinReach}/${metrics.totalServicesAssessed} within reach`}
          score={compliance.servicesAccessScore}
        />
        <MetricCard
          label="Area Safety"
          value={`${compliance.areaRiskScore}%`}
          sub={`${metrics.highRisks} high, ${metrics.mediumRisks} medium risks`}
          score={compliance.areaRiskScore}
        />
        <MetricCard
          label="Annex A Coverage"
          value={`${compliance.annexACoverage}%`}
          sub="required areas assessed"
          score={compliance.annexACoverage}
        />
      </div>

      {/* Service Access Checks */}
      <div>
        <h4 className="text-sm font-medium text-slate-700 mb-3">Key Service Access</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <AccessCheck label="GP Surgery" accessible={compliance.gpAccessible} />
          <AccessCheck label="Education" accessible={compliance.educationAccessible} />
          <AccessCheck label="CAMHS" accessible={compliance.camhsAccessible} />
          <AccessCheck label="Public Transport" accessible={compliance.publicTransportAdequate} />
        </div>
      </div>

      {/* High Risk Areas */}
      {compliance.highRiskAreas.length > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-lg p-4">
          <h4 className="text-sm font-medium text-red-800 mb-2">High Risk Areas</h4>
          <div className="flex flex-wrap gap-2">
            {compliance.highRiskAreas.map((area) => (
              <span key={area} className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                {area}
              </span>
            ))}
          </div>
          <p className="text-xs text-red-600 mt-2">
            {metrics.mitigationsInPlace} mitigation(s) in place
          </p>
        </div>
      )}

      {/* Strengths & Risks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-green-50/50 rounded-lg p-3">
          <h4 className="text-xs font-medium text-green-700 mb-2">Key Strengths</h4>
          <ul className="space-y-1">
            {keyStrengths.slice(0, 3).map((s, i) => (
              <li key={i} className="text-xs text-green-600 flex items-start gap-1.5">
                <span className="mt-0.5 shrink-0">+</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-amber-50/50 rounded-lg p-3">
          <h4 className="text-xs font-medium text-amber-700 mb-2">Key Risks</h4>
          <ul className="space-y-1">
            {keyRisks.map((r, i) => (
              <li key={i} className="text-xs text-amber-600 flex items-start gap-1.5">
                <span className="mt-0.5 shrink-0">!</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
        {childrenViews.length > 0 && (
          <div className="bg-sky-50/50 rounded-lg p-3 md:col-span-2">
            <h4 className="text-xs font-medium text-sky-700 mb-2">Children&apos;s Views</h4>
            <ul className="space-y-1">
              {childrenViews.slice(0, 3).map((v, i) => (
                <li key={i} className="text-xs text-sky-600 flex items-start gap-1.5">
                  <span className="mt-0.5 shrink-0">&ldquo;</span>
                  <span>{v}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Action Plan Summary */}
      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
        <div>
          <p className="text-xs text-slate-500">Action Plan</p>
          <p className="text-sm font-medium text-slate-800">
            {metrics.completedActions}/{metrics.totalActions} completed
            {metrics.overdueActions > 0 && (
              <span className="text-red-600 ml-2">({metrics.overdueActions} overdue)</span>
            )}
          </p>
        </div>
        <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full"
            style={{ width: `${formatRate(metrics.actionCompletionRate)}` }}
          />
        </div>
      </div>

      {/* Compliance Issues */}
      {compliance.issues.length > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-lg p-4">
          <h4 className="text-sm font-medium text-red-800 mb-2">
            Compliance Issues ({compliance.issues.length})
          </h4>
          <ul className="space-y-1">
            {compliance.issues.map((issue, i) => (
              <li key={i} className="text-xs text-red-700 flex items-start gap-1.5">
                <span className="mt-0.5 shrink-0">•</span>
                <span>{issue}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <div className="flex items-center gap-4">
          <MiniStat
            label="Last assessed"
            value={formatDate(assessment.assessmentDate)}
          />
          <MiniStat
            label="Review due"
            value={formatDate(assessment.reviewDueDate)}
            alert={compliance.overdue}
          />
        </div>
        <span className="text-xs text-slate-400">
          Reg 46 &middot; Schedule 4 (Annex A)
        </span>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  sub,
  score,
}: {
  label: string;
  value: string;
  sub: string;
  score: number;
}) {
  return (
    <div className="bg-slate-50 rounded-lg p-3">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={`text-lg font-semibold ${getScoreColour(score)}`}>{value}</p>
      <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
    </div>
  );
}

function AccessCheck({ label, accessible }: { label: string; accessible: boolean }) {
  return (
    <div className={`flex items-center gap-2 p-2 rounded ${accessible ? "bg-green-50" : "bg-amber-50"}`}>
      <span className={`text-sm ${accessible ? "text-green-600" : "text-amber-600"}`}>
        {accessible ? "✓" : "!"}
      </span>
      <span className={`text-xs font-medium ${accessible ? "text-green-700" : "text-amber-700"}`}>
        {label}
      </span>
    </div>
  );
}

function MiniStat({
  label,
  value,
  alert,
}: {
  label: string;
  value: string;
  alert?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-slate-500">{label}:</span>
      <span
        className={`text-xs font-semibold ${
          alert ? "text-red-600" : "text-slate-700"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

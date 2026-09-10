"use client";

// ══════════════════════════════════════════════════════════════════════════════
// INTERNET SAFETY MONITORING DASHBOARD WIDGET
//
// Displays internet safety monitoring intelligence:
// - Overall rating and sub-scores
// - Incident management metrics
// - Filtering safeguards status
// - Staff training readiness
// - Per-child internet profiles
// - Incident category/severity breakdown
// - Strengths, areas for improvement, and actions
// ══════════════════════════════════════════════════════════════════════════════

import { formatRate } from "@/lib/metrics/rate";
import { useState, useEffect } from "react";

// ── Local interfaces for the API response shape ──────────────────────────

interface ChildInternetProfileData {
  childId: string;
  childName: string;
  totalIncidents: number;
  highRiskIncidents: number;
  supportedRate: number;
  overallScore: number;
}

interface CategoryEntry {
  category: string;
  count: number;
  label: string;
}

interface SeverityEntry {
  severity: string;
  count: number;
  label: string;
}

interface InternetSafetyData {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: string;
  incidentManagementScore: number;
  filteringSafeguardsScore: number;
  internetPolicyScore: number;
  staffInternetReadinessScore: number;
  totalIncidents: number;
  highCriticalIncidents: number;
  actionTakenRate: number;
  childSupportedRate: number;
  recordedTimelyRate: number;
  lessonsAppliedRate: number;
  referralAppropriatenessRate: number;
  staffTrainingCoverageRate: number;
  incidentsByCategory: CategoryEntry[];
  incidentsBySeverity: SeverityEntry[];
  childInternetProfiles: ChildInternetProfileData[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── ScoreBar ─────────────────────────────────────────────────────────────

function ScoreBar({ label, score, max }: { label: string; score: number; max: number }) {
  const pctVal = Math.round((score / max) * 100);
  const barColor =
    pctVal >= 80
      ? "bg-green-500"
      : pctVal >= 60
        ? "bg-blue-500"
        : pctVal >= 40
          ? "bg-orange-500"
          : "bg-red-500";

  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs text-gray-600 mb-0.5">
        <span>{label}</span>
        <span>
          {score}/{max}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`${barColor} h-2 rounded-full transition-all`}
          style={{ width: `${pctVal}%` }}
        />
      </div>
    </div>
  );
}

// ── Section ──────────────────────────────────────────────────────────────

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <h4 className="text-xs font-semibold text-gray-600 uppercase mb-2">
        {title}
      </h4>
      {children}
    </div>
  );
}

// ── Stat ─────────────────────────────────────────────────────────────────

function Stat({
  value,
  label,
  colorClass,
}: {
  value: string | number;
  label: string;
  colorClass: string;
}) {
  return (
    <div className="text-center p-2 rounded-lg" style={{}}>
      <div className={`text-xl font-bold ${colorClass}`}>{value}</div>
      <div className="text-[10px] text-gray-500 uppercase">{label}</div>
    </div>
  );
}

// ── Main Widget ──────────────────────────────────────────────────────────

export default function InternetSafetyMonitoringDashboardWidget() {
  const [data, setData] = useState<InternetSafetyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/internet-safety-monitoring");
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

  // Loading skeleton
  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="h-24 bg-gray-100 rounded" />
      </div>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <div className="bg-white border border-red-200 rounded-xl p-6">
        <h3 className="font-semibold text-red-800">
          Internet Safety Monitoring
        </h3>
        <p className="text-sm text-red-600 mt-1">
          {error ?? "No data available"}
        </p>
      </div>
    );
  }

  // Rating badge
  const ratingColorClass =
    data.rating === "outstanding"
      ? "bg-green-100 text-green-800 border-green-300"
      : data.rating === "good"
        ? "bg-blue-100 text-blue-800 border-blue-300"
        : data.rating === "requires_improvement"
          ? "bg-orange-100 text-orange-800 border-orange-300"
          : "bg-red-100 text-red-800 border-red-300";

  const ratingLabel =
    data.rating === "outstanding"
      ? "Outstanding"
      : data.rating === "good"
        ? "Good"
        : data.rating === "requires_improvement"
          ? "Requires Improvement"
          : "Inadequate";

  const severityColor: Record<string, string> = {
    low: "bg-green-100 text-green-700",
    medium: "bg-yellow-100 text-yellow-700",
    high: "bg-orange-100 text-orange-700",
    critical: "bg-red-100 text-red-700",
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900 text-lg">
            Internet Safety Monitoring Intelligence
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Content filtering, online risk management & digital wellbeing |{" "}
            {data.totalIncidents} incident{data.totalIncidents !== 1 ? "s" : ""}
          </p>
        </div>
        <div
          className={`rounded-lg border px-4 py-3 text-center ${ratingColorClass}`}
        >
          <div className="text-3xl font-bold">{data.overallScore}</div>
          <div className="text-sm font-medium mt-1">{ratingLabel}</div>
        </div>
      </div>

      {/* Sub-scores */}
      <div className="mb-4">
        <ScoreBar
          label="Incident Management"
          score={data.incidentManagementScore}
          max={25}
        />
        <ScoreBar
          label="Filtering Safeguards"
          score={data.filteringSafeguardsScore}
          max={25}
        />
        <ScoreBar
          label="Internet Policy"
          score={data.internetPolicyScore}
          max={25}
        />
        <ScoreBar
          label="Staff Internet Readiness"
          score={data.staffInternetReadinessScore}
          max={25}
        />
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="text-center p-2 bg-blue-50 rounded-lg">
          <Stat
            value={`${formatRate(data.actionTakenRate)}`}
            label="Action Taken"
            colorClass="text-blue-700"
          />
        </div>
        <div className="text-center p-2 bg-green-50 rounded-lg">
          <Stat
            value={`${formatRate(data.childSupportedRate)}`}
            label="Child Supported"
            colorClass="text-green-700"
          />
        </div>
        <div className="text-center p-2 bg-purple-50 rounded-lg">
          <Stat
            value={`${formatRate(data.recordedTimelyRate)}`}
            label="Recorded Timely"
            colorClass="text-purple-700"
          />
        </div>
        <div className="text-center p-2 bg-orange-50 rounded-lg">
          <Stat
            value={data.highCriticalIncidents}
            label="High/Critical"
            colorClass="text-orange-700"
          />
        </div>
      </div>

      {/* Incident Category Breakdown */}
      {data.incidentsByCategory.length > 0 && (
        <Section title="Incidents by Category">
          <div className="flex flex-wrap gap-1.5">
            {data.incidentsByCategory.map((entry) => (
              <span
                key={entry.category}
                className="text-xs px-2 py-1 rounded bg-red-100 text-red-700"
              >
                {entry.label} ({entry.count})
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* Severity Breakdown */}
      {data.incidentsBySeverity.length > 0 && (
        <Section title="Incidents by Severity">
          <div className="flex flex-wrap gap-1.5">
            {data.incidentsBySeverity.map((entry) => (
              <span
                key={entry.severity}
                className={`text-xs px-2 py-1 rounded ${severityColor[entry.severity] ?? "bg-gray-100 text-gray-700"}`}
              >
                {entry.label} ({entry.count})
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* Child Internet Profiles */}
      {data.childInternetProfiles.length > 0 && (
        <Section title="Child Internet Profiles">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {data.childInternetProfiles.map((profile) => {
              const profileColor =
                profile.overallScore >= 8
                  ? "border-green-200 bg-green-50"
                  : profile.overallScore >= 5
                    ? "border-yellow-200 bg-yellow-50"
                    : "border-red-200 bg-red-50";

              return (
                <div
                  key={profile.childId}
                  className={`rounded-lg border p-3 ${profileColor}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">
                      {profile.childName}
                    </span>
                    <span className="text-xs font-bold text-gray-700">
                      {profile.overallScore}/10
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-xs text-gray-500">Incidents</div>
                      <div className="text-sm font-bold text-gray-700">
                        {profile.totalIncidents}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">High Risk</div>
                      <div className="text-sm font-bold text-red-600">
                        {profile.highRiskIncidents}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Supported</div>
                      <div className="text-sm font-bold text-green-600">
                        {formatRate(profile.supportedRate)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* Actions */}
      {data.actions.length > 0 &&
        !data.actions[0].startsWith("No immediate actions") && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <h4 className="text-sm font-semibold text-red-800 mb-2">
              Required Actions
            </h4>
            <ul className="space-y-1">
              {data.actions.slice(0, 5).map((action, i) => (
                <li
                  key={i}
                  className="text-xs text-red-700 flex items-start gap-1.5"
                >
                  <span className="mt-0.5 shrink-0">
                    {action.startsWith("URGENT")
                      ? "\u{1F534}"
                      : action.startsWith("HIGH")
                        ? "\u{1F7E0}"
                        : action.startsWith("MEDIUM")
                          ? "\u{1F7E1}"
                          : "\u{1F7E2}"}
                  </span>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

      {/* Expand toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-sm text-blue-600 hover:text-blue-800 font-medium w-full text-left"
      >
        {expanded
          ? "Hide details ▲"
          : "Show strengths, improvements & regulatory links ▼"}
      </button>

      {expanded && (
        <div className="mt-4 space-y-4">
          {/* Additional Metrics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-2 bg-blue-50 rounded">
              <div className="text-lg font-bold text-blue-700">
                {formatRate(data.lessonsAppliedRate)}
              </div>
              <div className="text-[10px] text-gray-500">Lessons Applied</div>
            </div>
            <div className="text-center p-2 bg-purple-50 rounded">
              <div className="text-lg font-bold text-purple-700">
                {formatRate(data.referralAppropriatenessRate)}
              </div>
              <div className="text-[10px] text-gray-500">
                Referral Appropriateness
              </div>
            </div>
            <div className="text-center p-2 bg-green-50 rounded">
              <div className="text-lg font-bold text-green-700">
                {formatRate(data.staffTrainingCoverageRate)}
              </div>
              <div className="text-[10px] text-gray-500">
                Training Coverage
              </div>
            </div>
          </div>

          {/* Strengths */}
          {data.strengths.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-green-800 mb-2">
                Strengths
              </h4>
              <ul className="space-y-1">
                {data.strengths.map((s, i) => (
                  <li key={i} className="text-xs text-green-700">
                    + {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Areas for Improvement */}
          {data.areasForImprovement.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-orange-800 mb-2">
                Areas for Improvement
              </h4>
              <ul className="space-y-1">
                {data.areasForImprovement.map((area, i) => (
                  <li key={i} className="text-xs text-orange-700">
                    - {area}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Regulatory References */}
          {data.regulatoryLinks.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-800 mb-2">
                Regulatory References
              </h4>
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
      )}
    </div>
  );
}

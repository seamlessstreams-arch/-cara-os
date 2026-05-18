"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CONTEXTUAL SAFEGUARDING DASHBOARD WIDGET
//
// Displays extra-familial harm intelligence:
// - Overall contextual risk rating
// - Per-child risk profiles
// - Harm domain mapping
// - Peer network risk indicators
// - Protective factor analysis
// - Intervention effectiveness
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";

interface HarmDomainEntry {
  domain: string;
  count: number;
  riskLevel: string;
  label?: string;
  riskLabel?: string;
}

interface ChildProfile {
  childId: string;
  childName: string;
  overallRiskLevel: string;
  riskScore: number;
  netRiskScore: number;
  protectiveScore: number;
  activeHarmDomains: string[];
  environmentalRisks: { name: string; riskLevel: string }[];
  peerAssociations: { peerName: string; peerType: string }[];
}

interface ContextualData {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: string;
  totalChildren: number;
  childrenAtSignificantRisk: number;
  childrenAtSeriousRisk: number;
  activeEnvironmentalRisks: number;
  harmDomainBreakdown: HarmDomainEntry[];
  highRiskPeers: number;
  monitoredPeerRate: number;
  totalOnlineRisks: number;
  activeOnlineRisks: number;
  averageProtectiveScore: number;
  protectiveFactorGaps: string[];
  effectiveInterventions: number;
  interventionEffectivenessRate: number;
  multiAgencyRate: number;
  childProfiles: ChildProfile[];
  strengths: string[];
  concerns: string[];
  immediateActions: string[];
  regulatoryLinks: string[];
  meta?: { harmDomainLabels: HarmDomainEntry[] };
}

// ── Rating Badge ───────────────────────────────────────────────────────────

function RatingBadge({ score, rating }: { score: number; rating: string }) {
  const colorClass =
    rating === "outstanding" ? "bg-green-100 text-green-800 border-green-300"
      : rating === "good" ? "bg-blue-100 text-blue-800 border-blue-300"
        : rating === "requires_improvement" ? "bg-orange-100 text-orange-800 border-orange-300"
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

// ── Child Risk Card ────────────────────────────────────────────────────────

function ChildRiskCard({ profile }: { profile: ChildProfile }) {
  const riskColors: Record<string, string> = {
    low: "border-green-200 bg-green-50",
    moderate: "border-yellow-200 bg-yellow-50",
    significant: "border-orange-200 bg-orange-50",
    serious: "border-red-200 bg-red-50",
  };

  const riskBadge: Record<string, string> = {
    low: "bg-green-100 text-green-700",
    moderate: "bg-yellow-100 text-yellow-700",
    significant: "bg-orange-100 text-orange-700",
    serious: "bg-red-100 text-red-700",
  };

  return (
    <div className={`rounded-lg border p-3 ${riskColors[profile.overallRiskLevel] ?? "border-gray-200"}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-sm">{profile.childName}</span>
        <span className={`text-xs font-medium px-2 py-0.5 rounded ${riskBadge[profile.overallRiskLevel] ?? ""}`}>
          {profile.overallRiskLevel}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="text-xs text-gray-500">Risk</div>
          <div className="text-sm font-bold text-red-600">{profile.riskScore}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Protective</div>
          <div className="text-sm font-bold text-green-600">{profile.protectiveScore}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Net</div>
          <div className="text-sm font-bold text-gray-800">{profile.netRiskScore}</div>
        </div>
      </div>
      {profile.activeHarmDomains.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {profile.activeHarmDomains.slice(0, 3).map((d) => (
            <span key={d} className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">
              {d.replace(/_/g, " ")}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Widget ────────────────────────────────────────────────────────────

export function ContextualSafeguardingDashboardWidget() {
  const [data, setData] = useState<ContextualData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/contextual-safeguarding");
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
        <div className="h-24 bg-gray-100 rounded" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white border border-red-200 rounded-xl p-6">
        <h3 className="font-semibold text-red-800">Contextual Safeguarding</h3>
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
            Contextual Safeguarding Intelligence
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Extra-familial harm assessment | {data.activeEnvironmentalRisks} active environmental risks
          </p>
        </div>
        <RatingBadge score={data.overallScore} rating={data.rating} />
      </div>

      {/* Risk Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="text-center p-2 bg-red-50 rounded-lg">
          <div className="text-xl font-bold text-red-700">{data.childrenAtSeriousRisk}</div>
          <div className="text-[10px] text-gray-500 uppercase">Serious Risk</div>
        </div>
        <div className="text-center p-2 bg-orange-50 rounded-lg">
          <div className="text-xl font-bold text-orange-700">{data.childrenAtSignificantRisk}</div>
          <div className="text-[10px] text-gray-500 uppercase">Significant</div>
        </div>
        <div className="text-center p-2 bg-purple-50 rounded-lg">
          <div className="text-xl font-bold text-purple-700">{data.highRiskPeers}</div>
          <div className="text-[10px] text-gray-500 uppercase">High-Risk Peers</div>
        </div>
        <div className="text-center p-2 bg-blue-50 rounded-lg">
          <div className="text-xl font-bold text-blue-700">{data.activeOnlineRisks}</div>
          <div className="text-[10px] text-gray-500 uppercase">Online Risks</div>
        </div>
      </div>

      {/* Harm Domains */}
      {data.harmDomainBreakdown.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-semibold text-gray-600 uppercase mb-2">Active Harm Domains</h4>
          <div className="flex flex-wrap gap-1.5">
            {(data.meta?.harmDomainLabels ?? data.harmDomainBreakdown).map((h) => {
              const color = h.riskLevel === "serious" ? "bg-red-100 text-red-700"
                : h.riskLevel === "significant" ? "bg-orange-100 text-orange-700"
                  : "bg-yellow-100 text-yellow-700";
              return (
                <span key={h.domain} className={`text-xs px-2 py-1 rounded ${color}`}>
                  {h.label ?? h.domain.replace(/_/g, " ")} ({h.count})
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Child Profiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        {data.childProfiles.map((profile) => (
          <ChildRiskCard key={profile.childId} profile={profile} />
        ))}
      </div>

      {/* Immediate Actions */}
      {data.immediateActions.length > 0 &&
        !data.immediateActions[0].startsWith("No immediate actions") && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <h4 className="text-sm font-semibold text-red-800 mb-2">Safeguarding Actions</h4>
            <ul className="space-y-1">
              {data.immediateActions.slice(0, 3).map((action, i) => (
                <li key={i} className="text-xs text-red-700 flex items-start gap-1.5">
                  <span className="mt-0.5 shrink-0">
                    {action.startsWith("URGENT") ? "🔴" : action.startsWith("HIGH") ? "🟠" : "🟡"}
                  </span>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

      {/* Expand */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-sm text-blue-600 hover:text-blue-800 font-medium w-full text-left"
      >
        {expanded ? "Hide details ▲" : "Show protective factors & insights ▼"}
      </button>

      {expanded && (
        <div className="mt-4 space-y-4">
          {/* Metrics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-2 bg-green-50 rounded">
              <div className="text-lg font-bold text-green-700">{data.averageProtectiveScore}</div>
              <div className="text-[10px] text-gray-500">Avg Protective</div>
            </div>
            <div className="text-center p-2 bg-blue-50 rounded">
              <div className="text-lg font-bold text-blue-700">{data.interventionEffectivenessRate}%</div>
              <div className="text-[10px] text-gray-500">Intervention Effect</div>
            </div>
            <div className="text-center p-2 bg-purple-50 rounded">
              <div className="text-lg font-bold text-purple-700">{data.multiAgencyRate}%</div>
              <div className="text-[10px] text-gray-500">Multi-Agency</div>
            </div>
          </div>

          {/* Protective Gaps */}
          {data.protectiveFactorGaps.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-orange-800 mb-2">Protective Factor Gaps</h4>
              <ul className="space-y-1">
                {data.protectiveFactorGaps.slice(0, 5).map((gap, i) => (
                  <li key={i} className="text-xs text-orange-700">- {gap}</li>
                ))}
              </ul>
            </div>
          )}

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

          {/* Regulatory */}
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

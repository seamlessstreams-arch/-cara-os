"use client";

// ══════════════════════════════════════════════════════════════════════════════
// ANTI-BULLYING EFFECTIVENESS DASHBOARD WIDGET
//
// Displays the 4-layer anti-bullying effectiveness intelligence:
// - Overall score with rating
// - Layer scores: incident management, prevention culture, intervention, staff
// - Child bullying profiles
// - Strengths, areas for improvement, and actions
// - Regulatory references
// ══════════════════════════════════════════════════════════════════════════════

import { formatRate } from "@/lib/metrics/rate";
import { useState, useEffect } from "react";

// ── Local interfaces (mirrors API shape) ──────────────────────────────────

interface IncidentManagement {
  totalIncidents: number;
  timelyResponseRate: number;
  fullyResolvedRate: number;
  followUpCompletedRate: number;
  childViewSoughtRate: number;
  impactAssessedRate: number;
  averageResponseHours: number;
  severityBreakdown: Record<string, number>;
  typeBreakdown: Record<string, number>;
  score: number;
  strengths: string[];
  concerns: string[];
}

interface PreventionCulture {
  totalSurveys: number;
  feelsSafeRate: number;
  bulliedRecentlyRate: number;
  highConfidenceRate: number;
  policyCurrentScore: number;
  childrenConsulted: boolean;
  confidenceBreakdown: Record<string, number>;
  score: number;
  strengths: string[];
  concerns: string[];
}

interface InterventionQuality {
  totalIncidents: number;
  safetyPlanRateHighCritical: number;
  restorativePracticeRate: number;
  diverseInterventions: number;
  resolutionRate: number;
  criticalIncidents: number;
  interventionBreakdown: Record<string, number>;
  score: number;
  strengths: string[];
  concerns: string[];
}

interface StaffReadiness {
  totalStaff: number;
  recognitionSkillsRate: number;
  interventionSkillsRate: number;
  restorativePracticeRate: number;
  overallTrainedRate: number;
  score: number;
  strengths: string[];
  concerns: string[];
}

interface ChildProfile {
  childId: string;
  childName: string;
  incidentsAsTarget: number;
  incidentsAsPerpetrator: number;
  incidentsAsBystander: number;
  incidentsAsReporter: number;
  totalInvolvement: number;
  feelsSafe: boolean | null;
  bulliedRecently: boolean | null;
  confidenceInStaff: string | null;
  wellbeingScore: number;
}

interface AntiBullyingData {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: string;
  incidentManagement: IncidentManagement;
  preventionCulture: PreventionCulture;
  interventionQuality: InterventionQuality;
  staffReadiness: StaffReadiness;
  childProfiles: ChildProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
  meta?: {
    incidentSummary: { id: string; date: string; type: string; severity: string; outcome: string }[];
    ratingLabel: string;
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

// ── Layer Score Card ───────────────────────────────────────────────────────

function LayerScoreCard({ label, score, max }: { label: string; score: number; max: number }) {
  const pctVal = Math.round((score / max) * 100);
  const color =
    pctVal >= 80 ? "text-green-700 bg-green-50 border-green-200"
      : pctVal >= 60 ? "text-blue-700 bg-blue-50 border-blue-200"
        : pctVal >= 40 ? "text-orange-700 bg-orange-50 border-orange-200"
          : "text-red-700 bg-red-50 border-red-200";

  return (
    <div className={`rounded-lg border p-3 text-center ${color}`}>
      <div className="text-2xl font-bold">{score}<span className="text-sm font-normal">/{max}</span></div>
      <div className="text-xs font-medium mt-0.5">{label}</div>
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
    <div className={`rounded-lg p-2.5 text-center ${color}`}>
      <div className="text-xl font-bold">{value}%</div>
      <div className="text-[10px] font-medium mt-0.5">{label}</div>
    </div>
  );
}

// ── Child Profile Row ─────────────────────────────────────────────────────

function ChildProfileRow({ profile }: { profile: ChildProfile }) {
  const wellbeingColor =
    profile.wellbeingScore >= 8 ? "bg-green-100 text-green-700"
      : profile.wellbeingScore >= 5 ? "bg-yellow-100 text-yellow-700"
        : "bg-red-100 text-red-700";

  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">{profile.childName}</span>
          {profile.feelsSafe === false && (
            <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded">Feels unsafe</span>
          )}
          {profile.bulliedRecently && (
            <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded">Bullied recently</span>
          )}
        </div>
        <div className="flex gap-3 text-[10px] text-gray-400 mt-0.5">
          {profile.incidentsAsTarget > 0 && <span>Target: {profile.incidentsAsTarget}</span>}
          {profile.incidentsAsPerpetrator > 0 && <span>Perpetrator: {profile.incidentsAsPerpetrator}</span>}
          {profile.incidentsAsBystander > 0 && <span>Bystander: {profile.incidentsAsBystander}</span>}
          {profile.incidentsAsReporter > 0 && <span>Reporter: {profile.incidentsAsReporter}</span>}
          {profile.totalInvolvement === 0 && <span>No incidents</span>}
        </div>
      </div>
      <span className={`text-xs font-medium px-2 py-0.5 rounded shrink-0 ${wellbeingColor}`}>
        {profile.wellbeingScore}/10
      </span>
    </div>
  );
}

// ── Main Widget ────────────────────────────────────────────────────────────

export function AntiBullyingEffectivenessDashboardWidget() {
  const [data, setData] = useState<AntiBullyingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<"incidents" | "prevention" | "interventions" | "staff" | "children">("incidents");

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/anti-bullying-effectiveness");
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
        <h3 className="font-semibold text-red-800">Anti-Bullying Effectiveness</h3>
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
            Anti-Bullying Effectiveness
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {data.periodStart} to {data.periodEnd} | {data.incidentManagement.totalIncidents} incidents | {data.staffReadiness.totalStaff} staff
          </p>
        </div>
        <RatingBadge score={data.overallScore} rating={data.rating} />
      </div>

      {/* 4 Layer Scores */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <LayerScoreCard label="Incident Mgmt" score={data.incidentManagement.score} max={25} />
        <LayerScoreCard label="Prevention" score={data.preventionCulture.score} max={25} />
        <LayerScoreCard label="Interventions" score={data.interventionQuality.score} max={25} />
        <LayerScoreCard label="Staff Readiness" score={data.staffReadiness.score} max={25} />
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-4">
        <ComplianceGauge label="Response Time" value={data.incidentManagement.timelyResponseRate} />
        <ComplianceGauge label="Feels Safe" value={data.preventionCulture.feelsSafeRate} />
        <ComplianceGauge label="Resolved" value={data.incidentManagement.fullyResolvedRate} />
        <ComplianceGauge label="Follow-up" value={data.incidentManagement.followUpCompletedRate} />
        <ComplianceGauge label="Recognition" value={data.staffReadiness.recognitionSkillsRate} />
        <ComplianceGauge label="Staff Trained" value={data.staffReadiness.overallTrainedRate} />
      </div>

      {/* Urgent Actions */}
      {data.actions.length > 0 &&
        !data.actions[0].startsWith("No immediate actions") && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <h4 className="text-sm font-semibold text-red-800 mb-2">Urgent Actions</h4>
            <ul className="space-y-1">
              {data.actions.slice(0, 4).map((action, i) => (
                <li key={i} className="text-xs text-red-700 flex items-start gap-1.5">
                  <span className="mt-0.5 shrink-0">
                    {action.startsWith("URGENT") ? "●" : action.startsWith("HIGH") ? "○" : "▪"}
                  </span>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

      {/* Expandable Detail Tabs */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-sm text-blue-600 hover:text-blue-800 font-medium w-full text-left"
      >
        {expanded ? "Hide details" : "Show detailed breakdown"}
      </button>

      {expanded && (
        <div className="mt-4 space-y-4">
          {/* Tab Navigation */}
          <div className="flex gap-1 border-b border-gray-200">
            {([
              ["incidents", "Incidents"],
              ["prevention", "Prevention"],
              ["interventions", "Interventions"],
              ["staff", "Staff"],
              ["children", "Children"],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-t-lg transition-colors ${
                  activeTab === key
                    ? "bg-white border border-b-white border-gray-200 text-gray-900 -mb-px"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Incidents Tab */}
          {activeTab === "incidents" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <ComplianceGauge label="Timely Response" value={data.incidentManagement.timelyResponseRate} />
                <ComplianceGauge label="Resolved" value={data.incidentManagement.fullyResolvedRate} />
                <ComplianceGauge label="Follow-up" value={data.incidentManagement.followUpCompletedRate} />
                <ComplianceGauge label="Child View" value={data.incidentManagement.childViewSoughtRate} />
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 bg-gray-50 rounded">
                  <div className="text-lg font-bold text-gray-700">{data.incidentManagement.totalIncidents}</div>
                  <div className="text-[10px] text-gray-500 uppercase">Total</div>
                </div>
                <div className="p-2 bg-blue-50 rounded">
                  <div className="text-lg font-bold text-blue-700">{data.incidentManagement.averageResponseHours}h</div>
                  <div className="text-[10px] text-gray-500 uppercase">Avg Response</div>
                </div>
                <div className="p-2 bg-green-50 rounded">
                  <div className="text-lg font-bold text-green-700">{formatRate(data.incidentManagement.impactAssessedRate)}</div>
                  <div className="text-[10px] text-gray-500 uppercase">Impact Assessed</div>
                </div>
              </div>
              {data.meta?.incidentSummary && (
                <div className="bg-gray-50 rounded-lg p-3">
                  {data.meta.incidentSummary.map((inc) => (
                    <div key={inc.id} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="font-medium text-sm truncate">{inc.type}</span>
                        <span className="text-xs text-gray-400">({inc.severity})</span>
                        <span className="text-xs text-gray-400">{inc.date}</span>
                      </div>
                      <span className="text-xs text-gray-600 shrink-0">{inc.outcome}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Prevention Tab */}
          {activeTab === "prevention" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <ComplianceGauge label="Feels Safe" value={data.preventionCulture.feelsSafeRate} />
                <ComplianceGauge label="Not Bullied" value={100 - data.preventionCulture.bulliedRecentlyRate} />
                <ComplianceGauge label="Staff Confidence" value={data.preventionCulture.highConfidenceRate} />
                <div className="rounded-lg p-2.5 text-center bg-gray-100 text-gray-700">
                  <div className="text-xl font-bold">{data.preventionCulture.policyCurrentScore}/3</div>
                  <div className="text-[10px] font-medium mt-0.5">Policy Score</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-2 bg-gray-50 rounded">
                  <div className="text-lg font-bold text-gray-700">{data.preventionCulture.totalSurveys}</div>
                  <div className="text-[10px] text-gray-500 uppercase">Surveys</div>
                </div>
                <div className={`p-2 rounded ${data.preventionCulture.childrenConsulted ? "bg-green-50" : "bg-red-50"}`}>
                  <div className={`text-lg font-bold ${data.preventionCulture.childrenConsulted ? "text-green-700" : "text-red-700"}`}>
                    {data.preventionCulture.childrenConsulted ? "Yes" : "No"}
                  </div>
                  <div className="text-[10px] text-gray-500 uppercase">Children Consulted</div>
                </div>
              </div>
            </div>
          )}

          {/* Interventions Tab */}
          {activeTab === "interventions" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <ComplianceGauge label="Safety Plans (H/C)" value={data.interventionQuality.safetyPlanRateHighCritical} />
                <ComplianceGauge label="Restorative" value={data.interventionQuality.restorativePracticeRate} />
                <ComplianceGauge label="Resolution" value={data.interventionQuality.resolutionRate} />
                <div className="rounded-lg p-2.5 text-center bg-gray-100 text-gray-700">
                  <div className="text-xl font-bold">{data.interventionQuality.diverseInterventions}</div>
                  <div className="text-[10px] font-medium mt-0.5">Intervention Types</div>
                </div>
              </div>
              {data.interventionQuality.criticalIncidents > 0 && (
                <div className="bg-red-50 border border-red-200 rounded p-2">
                  <span className="text-xs text-red-700 font-medium">
                    {data.interventionQuality.criticalIncidents} critical incident(s) requiring enhanced intervention
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Staff Tab */}
          {activeTab === "staff" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <ComplianceGauge label="Recognition" value={data.staffReadiness.recognitionSkillsRate} />
                <ComplianceGauge label="Intervention" value={data.staffReadiness.interventionSkillsRate} />
                <ComplianceGauge label="Restorative" value={data.staffReadiness.restorativePracticeRate} />
                <ComplianceGauge label="Fully Trained" value={data.staffReadiness.overallTrainedRate} />
              </div>
              <div className="p-2 bg-gray-50 rounded text-center">
                <div className="text-lg font-bold text-gray-700">{data.staffReadiness.totalStaff}</div>
                <div className="text-[10px] text-gray-500 uppercase">Total Staff</div>
              </div>
            </div>
          )}

          {/* Children Tab */}
          {activeTab === "children" && (
            <div className="bg-gray-50 rounded-lg p-3">
              {data.childProfiles.length > 0 ? (
                data.childProfiles.map((profile) => (
                  <ChildProfileRow key={profile.childId} profile={profile} />
                ))
              ) : (
                <p className="text-xs text-gray-500 text-center py-2">No child profiles available</p>
              )}
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

          {/* Areas for Improvement */}
          {data.areasForImprovement.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-orange-800 mb-2">Areas for Improvement</h4>
              <ul className="space-y-1">
                {data.areasForImprovement.map((a, i) => (
                  <li key={i} className="text-xs text-orange-700">- {a}</li>
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

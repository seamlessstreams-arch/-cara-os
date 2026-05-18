"use client";

// ══════════════════════════════════════════════════════════════════════════════
// PEER DYNAMICS & GROUP COMPATIBILITY DASHBOARD WIDGET
//
// Displays group dynamics intelligence:
// - Overall group compatibility rating
// - Positive/conflict interaction rates
// - Dyad relationship health map
// - Bullying pattern alerts
// - Per-child group profiles
// - Matching compliance (Reg 12)
// - Group stability trend
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";

interface DyadData {
  childAId: string;
  childAName: string;
  childBId: string;
  childBName: string;
  totalInteractions: number;
  positiveCount: number;
  negativeCount: number;
  relationshipHealth: string;
  relationshipHealthLabel?: string;
  patterns: string[];
  requiresIntervention: boolean;
}

interface BullyingData {
  victimName: string;
  aggressorName: string;
  incidentCount: number;
  interactionTypes: string[];
  interactionTypeLabels?: string[];
  escalating: boolean;
  safeguardingAction: string;
}

interface ChildProfileData {
  childId: string;
  childName: string;
  totalInteractions: number;
  positiveInteractionRate: number;
  conflictRate: number;
  isIsolated: boolean;
  isFrequentAggressor: boolean;
  isFrequentVictim: boolean;
  concerns: string[];
}

interface MatchingData {
  totalChildren: number;
  assessmentsCompleted: number;
  assessmentsOverdue: number;
  complianceRate: number;
  unsuitablePlacements: number;
  conditionalPlacements: number;
}

interface PeerDynamicsData {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: string;
  totalChildren: number;
  totalInteractions: number;
  positiveInteractionRate: number;
  conflictRate: number;
  groupStabilityTrend: string;
  matching: MatchingData;
  dyadAnalyses: DyadData[];
  bullyingPatterns: BullyingData[];
  childGroupProfiles: ChildProfileData[];
  latestGroupStability: number;
  groupAssessmentsDone: number;
  strengths: string[];
  concerns: string[];
  immediateActions: string[];
  regulatoryLinks: string[];
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

// ── Relationship Health Dot ───────────────────────────────────────────────

function HealthDot({ health }: { health: string }) {
  const color =
    health === "healthy" ? "bg-green-500"
      : health === "mixed" ? "bg-yellow-500"
        : health === "concerning" ? "bg-orange-500"
          : "bg-red-500";
  return <span className={`inline-block w-2.5 h-2.5 rounded-full ${color}`} />;
}

// ── Dyad Card ─────────────────────────────────────────────────────────────

function DyadCard({ dyad }: { dyad: DyadData }) {
  const borderColor =
    dyad.relationshipHealth === "healthy" ? "border-green-200"
      : dyad.relationshipHealth === "mixed" ? "border-yellow-200"
        : dyad.relationshipHealth === "concerning" ? "border-orange-200"
          : "border-red-200";

  return (
    <div className={`rounded-lg border p-3 ${borderColor}`}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium">{dyad.childAName} & {dyad.childBName}</span>
        <div className="flex items-center gap-1.5">
          <HealthDot health={dyad.relationshipHealth} />
          <span className="text-xs text-gray-500 capitalize">
            {dyad.relationshipHealthLabel ?? dyad.relationshipHealth}
          </span>
        </div>
      </div>
      <div className="flex gap-3 text-xs mb-1.5">
        <span className="text-green-600">+{dyad.positiveCount}</span>
        <span className="text-red-600">-{dyad.negativeCount}</span>
        <span className="text-gray-400">({dyad.totalInteractions} total)</span>
      </div>
      {dyad.patterns.length > 0 && (
        <div className="space-y-0.5">
          {dyad.patterns.map((p, i) => (
            <div key={i} className="text-[10px] text-orange-600">{p}</div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Child Profile Card ────────────────────────────────────────────────────

function ChildProfileCard({ profile }: { profile: ChildProfileData }) {
  const hasConcerns = profile.isIsolated || profile.isFrequentAggressor || profile.isFrequentVictim;

  return (
    <div className={`rounded-lg border p-3 ${hasConcerns ? "border-red-200 bg-red-50" : "border-gray-200"}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-sm">{profile.childName}</span>
        <span className="text-xs text-gray-500">{profile.totalInteractions} interactions</span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-center mb-2">
        <div>
          <div className="text-xs text-gray-500">Positive</div>
          <div className={`text-sm font-bold ${profile.positiveInteractionRate >= 70 ? "text-green-700" : profile.positiveInteractionRate >= 50 ? "text-yellow-700" : "text-red-700"}`}>
            {profile.positiveInteractionRate}%
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Conflict</div>
          <div className={`text-sm font-bold ${profile.conflictRate <= 20 ? "text-green-700" : profile.conflictRate <= 40 ? "text-yellow-700" : "text-red-700"}`}>
            {profile.conflictRate}%
          </div>
        </div>
      </div>
      {/* Alert badges */}
      <div className="flex flex-wrap gap-1">
        {profile.isIsolated && (
          <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">Isolated</span>
        )}
        {profile.isFrequentAggressor && (
          <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded">Frequent Aggressor</span>
        )}
        {profile.isFrequentVictim && (
          <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">Frequent Victim</span>
        )}
        {!hasConcerns && profile.totalInteractions > 0 && (
          <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">Engaged</span>
        )}
      </div>
    </div>
  );
}

// ── Stability Trend ───────────────────────────────────────────────────────

function StabilityTrend({ trend, rating }: { trend: string; rating: number }) {
  const trendIcon =
    trend === "improving" ? "📈"
      : trend === "declining" ? "📉"
        : trend === "volatile" ? "⚡"
          : "➡️";

  const trendColor =
    trend === "improving" ? "text-green-700"
      : trend === "declining" ? "text-red-700"
        : trend === "volatile" ? "text-orange-700"
          : "text-blue-700";

  return (
    <div className="flex items-center gap-2">
      <span className="text-lg">{trendIcon}</span>
      <div>
        <div className={`text-sm font-semibold ${trendColor} capitalize`}>{trend}</div>
        <div className="text-[10px] text-gray-500">Stability: {rating}/5</div>
      </div>
    </div>
  );
}

// ── Main Widget ────────────────────────────────────────────────────────────

export function PeerDynamicsDashboardWidget() {
  const [data, setData] = useState<PeerDynamicsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/peer-dynamics");
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
        <h3 className="font-semibold text-red-800">Peer Dynamics Intelligence</h3>
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
            Peer Dynamics Intelligence
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {data.totalChildren} children | {data.totalInteractions} interactions this period | Reg 12 matching
          </p>
        </div>
        <RatingBadge score={data.overallScore} rating={data.rating} />
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="text-center p-2 bg-green-50 rounded-lg">
          <div className="text-xl font-bold text-green-700">{data.positiveInteractionRate}%</div>
          <div className="text-[10px] text-gray-500 uppercase">Positive Rate</div>
        </div>
        <div className="text-center p-2 bg-red-50 rounded-lg">
          <div className="text-xl font-bold text-red-700">{data.conflictRate}%</div>
          <div className="text-[10px] text-gray-500 uppercase">Conflict Rate</div>
        </div>
        <div className="text-center p-2 bg-blue-50 rounded-lg">
          <div className="text-xl font-bold text-blue-700">{data.matching.complianceRate}%</div>
          <div className="text-[10px] text-gray-500 uppercase">Reg 12 Compliance</div>
        </div>
        <div className="p-2 bg-gray-50 rounded-lg flex items-center justify-center">
          <StabilityTrend trend={data.groupStabilityTrend} rating={data.latestGroupStability} />
        </div>
      </div>

      {/* Bullying Alerts */}
      {data.bullyingPatterns.length > 0 && (
        <div className="bg-red-50 border border-red-300 rounded-lg p-3 mb-4">
          <h4 className="text-sm font-semibold text-red-800 mb-2">Bullying Patterns Detected</h4>
          {data.bullyingPatterns.map((b, i) => (
            <div key={i} className="mb-2 last:mb-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-red-700">
                  {b.aggressorName} → {b.victimName}
                </span>
                <span className="text-[10px] bg-red-200 text-red-800 px-1.5 py-0.5 rounded">
                  {b.incidentCount} incidents
                </span>
                {b.escalating && (
                  <span className="text-[10px] bg-red-600 text-white px-1.5 py-0.5 rounded font-medium">
                    ESCALATING
                  </span>
                )}
              </div>
              <p className="text-[10px] text-red-600">{b.safeguardingAction}</p>
            </div>
          ))}
        </div>
      )}

      {/* Dyad Relationship Map */}
      <div className="mb-4">
        <h4 className="text-xs font-semibold text-gray-600 uppercase mb-2">Peer Relationships</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {data.dyadAnalyses.map((dyad, i) => (
            <DyadCard key={i} dyad={dyad} />
          ))}
        </div>
      </div>

      {/* Child Group Profiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        {data.childGroupProfiles.map((profile) => (
          <ChildProfileCard key={profile.childId} profile={profile} />
        ))}
      </div>

      {/* Immediate Actions */}
      {data.immediateActions.length > 0 &&
        !data.immediateActions[0].startsWith("No immediate actions") && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
            <h4 className="text-sm font-semibold text-amber-800 mb-2">Required Actions</h4>
            <ul className="space-y-1">
              {data.immediateActions.map((action, i) => (
                <li key={i} className="text-xs text-amber-700 flex items-start gap-1.5">
                  <span className="mt-0.5 shrink-0">
                    {action.startsWith("URGENT") ? "🔴" : action.startsWith("HIGH") ? "🟠" : "🟡"}
                  </span>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

      {/* Matching Compliance Warning */}
      {data.matching.assessmentsOverdue > 0 && (
        <div className="flex items-center gap-2 mb-4 p-2 bg-orange-50 border border-orange-200 rounded-lg">
          <span className="text-orange-600 text-lg">📋</span>
          <span className="text-xs text-orange-700 font-medium">
            {data.matching.assessmentsOverdue} Reg 12 matching assessment{data.matching.assessmentsOverdue !== 1 ? "s" : ""} overdue
          </span>
        </div>
      )}

      {/* Expand */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-sm text-blue-600 hover:text-blue-800 font-medium w-full text-left"
      >
        {expanded ? "Hide details ▲" : "Show strengths, concerns & regulatory links ▼"}
      </button>

      {expanded && (
        <div className="mt-4 space-y-4">
          {/* Extra Metrics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-2 bg-blue-50 rounded">
              <div className="text-lg font-bold text-blue-700">{data.matching.conditionalPlacements}</div>
              <div className="text-[10px] text-gray-500">Conditional Matches</div>
            </div>
            <div className="text-center p-2 bg-purple-50 rounded">
              <div className="text-lg font-bold text-purple-700">{data.groupAssessmentsDone}</div>
              <div className="text-[10px] text-gray-500">Group Assessments</div>
            </div>
            <div className="text-center p-2 bg-green-50 rounded">
              <div className="text-lg font-bold text-green-700">{data.dyadAnalyses.filter((d) => d.relationshipHealth === "healthy").length}</div>
              <div className="text-[10px] text-gray-500">Healthy Dyads</div>
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
              <h4 className="text-sm font-semibold text-orange-800 mb-2">Concerns</h4>
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

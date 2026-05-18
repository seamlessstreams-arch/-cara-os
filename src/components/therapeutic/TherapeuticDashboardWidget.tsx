// ══════════════════════════════════════════════════════════════════════════════
// Therapeutic Support & Emotional Wellbeing — Dashboard Widget
// CHR 2015 Reg 6 (Quality & Purpose), Reg 10 (Health & Wellbeing)
// ══════════════════════════════════════════════════════════════════════════════

"use client";

import { useEffect, useState } from "react";

interface WellbeingScore {
  domain: string;
  score: number;
  trend: "improving" | "stable" | "declining";
  targetScore: number;
}

interface TherapeuticIntervention {
  id: string;
  type: string;
  provider: string;
  frequency: string;
  sessionsAttended: number;
  sessionsMissed: number;
  effectiveness: number;
  childFeedback?: number;
  active: boolean;
}

interface CrisisEvent {
  id: string;
  date: string;
  trigger: string;
  severity: string;
  deEscalationTime: number;
  followUpCompleted: boolean;
}

interface ChildProfile {
  childId: string;
  childName: string;
  primaryModel: string;
  emotionalRegulationLevel: string;
  mentalHealthStatus: string;
  wellbeingScores: WellbeingScore[];
  interventions: TherapeuticIntervention[];
  crisisEvents: CrisisEvent[];
  sdqScore?: number;
  camhsReferral: { status: string; tier: number; nextAppointment?: string };
  therapeuticGoals: string[];
  protectiveFactors: string[];
}

interface ChildWellbeingSummary {
  childId: string;
  childName: string;
  overallWellbeing: number;
  trend: "improving" | "stable" | "declining";
  mentalHealthStatus: string;
  activeInterventions: number;
  emotionalRegulationLevel: string;
  camhsStatus: string;
  daysStable: number;
}

interface Compliance {
  isCompliant: boolean;
  overallScore: number;
  issues: string[];
  warnings: string[];
  modelAdherenceScore: number;
  staffTrainingScore: number;
  interventionCoverageScore: number;
  wellbeingProgressScore: number;
  crisisManagementScore: number;
  childrenInCrisis: string[];
  childrenDeclining: string[];
  sdqOverdue: string[];
  camhsWaitingList: string[];
}

interface Metrics {
  overallWellbeingScore: number;
  totalActiveInterventions: number;
  interventionAttendanceRate: number;
  averageEffectiveness: number;
  childrenImproving: number;
  childrenStable: number;
  childrenDeclining: number;
  childrenInCrisis: number;
  crisisEventsThisMonth: number;
  averageDeEscalationTime: number;
  camhsActiveCount: number;
  camhsWaitingCount: number;
  sdqAverageScore: number;
  staffTrainingPercentage: number;
  therapeuticHoursThisWeek: number;
  modelAdherenceRate: number;
  childMetrics: ChildWellbeingSummary[];
  issues: string[];
  warnings: string[];
}

interface DashboardData {
  compliance: Compliance;
  metrics: Metrics;
  profiles: ChildProfile[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function getScoreColour(score: number): string {
  if (score >= 75) return "text-green-600";
  if (score >= 50) return "text-amber-600";
  return "text-red-600";
}

function getScoreBg(score: number): string {
  if (score >= 75) return "bg-green-500";
  if (score >= 50) return "bg-amber-500";
  return "bg-red-500";
}

function getTrendIcon(trend: string): string {
  if (trend === "improving") return "↑";
  if (trend === "declining") return "↓";
  return "→";
}

function getTrendColour(trend: string): string {
  if (trend === "improving") return "text-green-600";
  if (trend === "declining") return "text-red-600";
  return "text-slate-500";
}

function getRegulationColour(level: string): string {
  switch (level) {
    case "secure": return "bg-green-100 text-green-700";
    case "established": return "bg-blue-100 text-blue-700";
    case "developing": return "bg-amber-100 text-amber-700";
    case "emerging": return "bg-red-100 text-red-700";
    default: return "bg-slate-100 text-slate-600";
  }
}

function getStatusColour(status: string): string {
  switch (status) {
    case "stable": return "bg-green-100 text-green-700";
    case "improving": return "bg-blue-100 text-blue-700";
    case "monitoring": return "bg-amber-100 text-amber-700";
    case "declining": return "bg-orange-100 text-orange-700";
    case "crisis": return "bg-red-100 text-red-700";
    default: return "bg-slate-100 text-slate-600";
  }
}

function getDomainShort(domain: string): string {
  const map: Record<string, string> = {
    emotional_regulation: "Regulation",
    attachment_security: "Attachment",
    self_esteem: "Self-Esteem",
    peer_relationships: "Peers",
    trauma_recovery: "Trauma",
    anxiety_management: "Anxiety",
    resilience: "Resilience",
    identity: "Identity",
  };
  return map[domain] ?? domain;
}

// ── Component ────────────────────────────────────────────────────────────────

export function TherapeuticDashboardWidget() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedChild, setExpandedChild] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/therapeutic?mode=dashboard")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch therapeutic data");
        return res.json();
      })
      .then((json) => setData(json))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm animate-pulse">
        <div className="h-6 w-64 bg-slate-200 rounded mb-4" />
        <div className="space-y-3">
          <div className="h-4 w-full bg-slate-100 rounded" />
          <div className="h-4 w-3/4 bg-slate-100 rounded" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <p className="text-red-700 text-sm">Error loading therapeutic data: {error}</p>
      </div>
    );
  }

  const { compliance, metrics, profiles } = data;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Therapeutic Support & Wellbeing
          </h3>
          <p className="text-sm text-slate-500 mt-0.5">
            Reg 6 &middot; Reg 10 &middot; PACE Model &middot; Emotional Health
          </p>
        </div>
        <div className="text-right">
          <p className={`text-2xl font-bold ${getScoreColour(compliance.overallScore)}`}>
            {compliance.overallScore}%
          </p>
          <p className="text-xs text-slate-400">therapeutic score</p>
        </div>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricTile
          label="Wellbeing"
          value={`${metrics.overallWellbeingScore}%`}
          score={metrics.overallWellbeingScore}
        />
        <MetricTile
          label="Interventions"
          value={String(metrics.totalActiveInterventions)}
          sub={`${metrics.interventionAttendanceRate}% attended`}
          score={metrics.interventionAttendanceRate}
        />
        <MetricTile
          label="Effectiveness"
          value={`${metrics.averageEffectiveness}%`}
          score={metrics.averageEffectiveness}
        />
        <MetricTile
          label="Staff Trained"
          value={`${metrics.staffTrainingPercentage}%`}
          sub="in PACE model"
          score={metrics.staffTrainingPercentage}
        />
      </div>

      {/* Status Breakdown */}
      <div className="flex items-center gap-3 flex-wrap">
        <StatusPill label="Improving" count={metrics.childrenImproving} colour="bg-blue-100 text-blue-700" />
        <StatusPill label="Stable" count={metrics.childrenStable} colour="bg-green-100 text-green-700" />
        <StatusPill label="Declining" count={metrics.childrenDeclining} colour="bg-orange-100 text-orange-700" />
        <StatusPill label="Crisis" count={metrics.childrenInCrisis} colour="bg-red-100 text-red-700" />
        <div className="ml-auto flex items-center gap-2 text-xs text-slate-500">
          <span>CAMHS: {metrics.camhsActiveCount} active</span>
          {metrics.camhsWaitingCount > 0 && (
            <span className="text-amber-600">{metrics.camhsWaitingCount} waiting</span>
          )}
        </div>
      </div>

      {/* Per-Child Wellbeing */}
      <div>
        <h4 className="text-sm font-medium text-slate-700 mb-3">Child Wellbeing</h4>
        <div className="space-y-2">
          {metrics.childMetrics.map((child) => (
            <div key={child.childId}>
              <button
                onClick={() => setExpandedChild(expandedChild === child.childId ? null : child.childId)}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-50 border border-purple-100 flex items-center justify-center">
                    <span className={`text-lg font-bold ${getScoreColour(child.overallWellbeing)}`}>
                      {child.overallWellbeing}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-800">{child.childName}</p>
                      <span className={`text-xs ${getTrendColour(child.trend)}`}>
                        {getTrendIcon(child.trend)}
                      </span>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${getRegulationColour(child.emotionalRegulationLevel)}`}>
                        {child.emotionalRegulationLevel}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${getStatusColour(child.mentalHealthStatus)}`}>
                        {child.mentalHealthStatus}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {child.activeInterventions} intervention{child.activeInterventions !== 1 ? "s" : ""}
                      </span>
                      {child.daysStable < 999 && (
                        <span className="text-[10px] text-slate-400">
                          {child.daysStable}d stable
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <svg
                  className={`w-4 h-4 text-slate-400 transition-transform ${expandedChild === child.childId ? "rotate-180" : ""}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Expanded Detail */}
              {expandedChild === child.childId && (
                <ChildDetail profile={profiles.find((p) => p.childId === child.childId)!} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Crisis Summary */}
      {metrics.crisisEventsThisMonth > 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
          <h4 className="text-sm font-medium text-amber-800 mb-1">Crisis Events This Month</h4>
          <div className="flex items-center gap-4">
            <p className="text-xs text-amber-700">
              {metrics.crisisEventsThisMonth} event{metrics.crisisEventsThisMonth !== 1 ? "s" : ""} &middot;
              avg de-escalation: {metrics.averageDeEscalationTime} mins
            </p>
          </div>
        </div>
      )}

      {/* Compliance Issues */}
      {compliance.issues.length > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-lg p-4">
          <h4 className="text-sm font-medium text-red-800 mb-2">Issues ({compliance.issues.length})</h4>
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

      {/* Warnings */}
      {compliance.warnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
          <h4 className="text-sm font-medium text-amber-800 mb-2">Warnings ({compliance.warnings.length})</h4>
          <ul className="space-y-1">
            {compliance.warnings.map((w, i) => (
              <li key={i} className="text-xs text-amber-700 flex items-start gap-1.5">
                <span className="mt-0.5 shrink-0">•</span>
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <div className="flex items-center gap-4">
          <MiniStat label="SDQ Avg" value={String(metrics.sdqAverageScore)} />
          <MiniStat label="Model" value={`${metrics.modelAdherenceRate}%`} />
          <MiniStat label="Hrs/wk" value={String(metrics.therapeuticHoursThisWeek)} />
        </div>
        <span className="text-xs text-slate-400">
          Reg 6/10 &middot; PACE &middot; SCCIF Wellbeing
        </span>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function MetricTile({
  label,
  value,
  sub,
  score,
}: {
  label: string;
  value: string;
  sub?: string;
  score: number;
}) {
  return (
    <div className="bg-slate-50 rounded-lg p-3">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={`text-lg font-semibold ${getScoreColour(score)}`}>{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function StatusPill({ label, count, colour }: { label: string; count: number; colour: string }) {
  if (count === 0) return null;
  return (
    <span className={`text-xs font-medium px-2 py-1 rounded-full ${colour}`}>
      {count} {label}
    </span>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-slate-500">{label}:</span>
      <span className="text-xs font-semibold text-slate-700">{value}</span>
    </div>
  );
}

function ChildDetail({ profile }: { profile: ChildProfile }) {
  return (
    <div className="ml-4 mt-2 p-4 rounded-lg border border-slate-100 bg-slate-50 space-y-4">
      {/* Wellbeing Domain Bars */}
      <div>
        <p className="text-xs font-medium text-slate-600 mb-2">Wellbeing Domains</p>
        <div className="grid grid-cols-2 gap-2">
          {profile.wellbeingScores.map((ws) => (
            <div key={ws.domain} className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500 w-16 shrink-0">{getDomainShort(ws.domain)}</span>
              <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${getScoreBg(ws.score)}`}
                  style={{ width: `${ws.score}%` }}
                />
              </div>
              <span className={`text-[10px] font-medium w-8 text-right ${getTrendColour(ws.trend)}`}>
                {ws.score}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Active Interventions */}
      {profile.interventions.filter((i) => i.active).length > 0 && (
        <div>
          <p className="text-xs font-medium text-slate-600 mb-2">Active Interventions</p>
          <div className="space-y-1">
            {profile.interventions.filter((i) => i.active).map((inv) => (
              <div key={inv.id} className="flex items-center justify-between text-[10px]">
                <span className="text-slate-700">{inv.type.replace(/_/g, " ")} — {inv.provider}</span>
                <span className={getScoreColour(inv.effectiveness)}>{inv.effectiveness}% effective</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Therapeutic Goals */}
      {profile.therapeuticGoals.length > 0 && (
        <div>
          <p className="text-xs font-medium text-slate-600 mb-1">Goals</p>
          <ul className="space-y-0.5">
            {profile.therapeuticGoals.slice(0, 3).map((goal, i) => (
              <li key={i} className="text-[10px] text-slate-600 flex items-start gap-1">
                <span className="mt-0.5 shrink-0">○</span>
                <span>{goal}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Protective Factors */}
      <div className="flex flex-wrap gap-1">
        {profile.protectiveFactors.map((f, i) => (
          <span key={i} className="text-[10px] px-1.5 py-0.5 bg-green-50 text-green-700 rounded">
            {f}
          </span>
        ))}
      </div>
    </div>
  );
}

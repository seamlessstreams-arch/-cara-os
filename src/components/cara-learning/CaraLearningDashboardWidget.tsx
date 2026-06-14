// ══════════════════════════════════════════════════════════════════════════════
// CaraLearningDashboardWidget — Agent Learning & Cost Reduction card
// ══════════════════════════════════════════════════════════════════════════════

"use client";

import { useEffect, useState } from "react";

interface AgentResult {
  agentId: string;
  agentName: string;
  currentStatus: string;
  recommendedNextStatus: string | null;
  readinessScore: number;
  requirementsMet: number;
  requirementsTotal: number;
  allCriticalMet: boolean;
  currentMonthlyCost: number;
  projectedMonthlyCost: number;
  monthlySaving: number;
  annualSaving: number;
  riskLevel: string;
  riskFactors: string[];
  recommendations: string[];
  blockers: string[];
  recommendedTier: string;
}

interface OrganisationMetrics {
  organisationId: string;
  totalAgents: number;
  agentsByStatus: Record<string, number>;
  totalCurrentMonthlyCost: number;
  totalProjectedMonthlyCost: number;
  totalMonthlySaving: number;
  totalAnnualSaving: number;
  costReductionRate: number;
  agentsReadyForShadow: number;
  agentsInShadowMode: number;
  agentsPartiallyInternal: number;
  agentsFullyInternal: number;
  averageShadowAccuracy: number;
  averageShadowSafety: number;
  averageSuccessRate: number;
  totalTrainingExamples: number;
  totalManagerCorrections: number;
  totalRejectedOutputs: number;
  highRiskAgents: number;
  criticalRiskAgents: number;
  topReplacementCandidates: { agentName: string; readinessScore: number; monthlySaving: number }[];
  issues: string[];
  warnings: string[];
}

interface AgentProfile {
  id: string;
  agentName: string;
  agentType: string;
  currentProvider: string;
  internalReplacementStatus: string;
  shadowModeEnabled: boolean;
  shadowAccuracyScore: number;
  shadowSafetyScore: number;
  riskLevel: string;
  approvedTrainingExamples: number;
  averageCostPerRun: number;
}

interface DashboardData {
  metrics: OrganisationMetrics;
  agentResults: AgentResult[];
  profiles: AgentProfile[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function getScoreColour(score: number): string {
  if (score >= 75) return "text-green-600";
  if (score >= 50) return "text-amber-600";
  return "text-red-600";
}

function getStatusColour(status: string): string {
  switch (status) {
    case "external_only": return "bg-slate-100 text-slate-700";
    case "observing": return "bg-blue-100 text-blue-700";
    case "shadow_mode": return "bg-purple-100 text-purple-700";
    case "partial_internal": return "bg-amber-100 text-amber-700";
    case "internal_preferred": return "bg-green-100 text-green-700";
    case "external_fallback_only": return "bg-green-100 text-green-800";
    case "retired": return "bg-slate-200 text-slate-500";
    default: return "bg-slate-100 text-slate-700";
  }
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    external_only: "External Only",
    observing: "Observing",
    shadow_mode: "Shadow Mode",
    partial_internal: "Partial Internal",
    internal_preferred: "Internal Preferred",
    external_fallback_only: "Fallback Only",
    retired: "Retired",
  };
  return labels[status] ?? status;
}

function getRiskColour(level: string): string {
  switch (level) {
    case "low": return "text-green-600";
    case "medium": return "text-amber-600";
    case "high": return "text-orange-600";
    case "critical": return "text-red-600";
    default: return "text-slate-600";
  }
}

function getTierLabel(tier: string): string {
  const labels: Record<string, string> = {
    cornerstone_native_rules: "Native Rules",
    cornerstone_local_model: "Local Model",
    cornerstone_rag: "RAG",
    cornerstone_finetuned: "Fine-tuned",
    external_paid_model: "External Paid",
    human_review_only: "Human Only",
  };
  return labels[tier] ?? tier;
}

// ── Component ────────────────────────────────────────────────────────────────

export function CaraLearningDashboardWidget() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/cara-learning?mode=dashboard")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch Cara learning data");
        return res.json();
      })
      .then((json) => setData(json))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm animate-pulse">
        <div className="h-6 w-60 bg-slate-200 rounded mb-4" />
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
        <p className="text-red-700 text-sm">Error loading Cara learning data: {error}</p>
      </div>
    );
  }

  const { metrics, agentResults } = data;
  const activeAgent = selectedAgent ? agentResults.find(a => a.agentId === selectedAgent) : null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Cara Agent Learning & Cost Reduction
          </h3>
          <p className="text-sm text-slate-500 mt-0.5">
            Progressively reduce dependency on paid agents
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-green-600">
            {metrics.costReductionRate}%
          </p>
          <p className="text-xs text-slate-400">projected saving</p>
        </div>
      </div>

      {/* Cost & Pipeline Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Monthly Cost"
          value={`£${metrics.totalCurrentMonthlyCost.toFixed(0)}`}
          sub={`→ £${metrics.totalProjectedMonthlyCost.toFixed(0)} projected`}
          score={metrics.costReductionRate}
        />
        <MetricCard
          label="Annual Saving"
          value={`£${metrics.totalAnnualSaving.toFixed(0)}`}
          sub="at full replacement"
          score={metrics.costReductionRate}
        />
        <MetricCard
          label="Shadow Accuracy"
          value={metrics.averageShadowAccuracy > 0 ? `${metrics.averageShadowAccuracy}%` : "N/A"}
          sub={`${metrics.agentsInShadowMode} in shadow`}
          score={metrics.averageShadowAccuracy}
        />
        <MetricCard
          label="Training Data"
          value={String(metrics.totalTrainingExamples)}
          sub={`${metrics.totalManagerCorrections} corrections`}
          score={Math.min(100, Math.round((metrics.totalTrainingExamples / 500) * 100))}
        />
      </div>

      {/* Pipeline Status */}
      <div>
        <h4 className="text-sm font-medium text-slate-700 mb-3">Replacement Pipeline</h4>
        <div className="flex items-center gap-1 mb-3">
          <PipelineStage label="External" count={metrics.agentsByStatus.external_only ?? 0} colour="bg-slate-200" />
          <PipelineArrow />
          <PipelineStage label="Observing" count={metrics.agentsByStatus.observing ?? 0} colour="bg-blue-200" />
          <PipelineArrow />
          <PipelineStage label="Shadow" count={metrics.agentsByStatus.shadow_mode ?? 0} colour="bg-purple-200" />
          <PipelineArrow />
          <PipelineStage label="Partial" count={metrics.agentsByStatus.partial_internal ?? 0} colour="bg-amber-200" />
          <PipelineArrow />
          <PipelineStage label="Internal" count={metrics.agentsFullyInternal} colour="bg-green-200" />
        </div>
      </div>

      {/* Agent List */}
      <div>
        <h4 className="text-sm font-medium text-slate-700 mb-3">Agent Capability Registry</h4>
        <div className="space-y-2">
          {agentResults.map((agent) => (
            <button
              key={agent.agentId}
              onClick={() => setSelectedAgent(selectedAgent === agent.agentId ? null : agent.agentId)}
              className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                selectedAgent === agent.agentId
                  ? "border-indigo-200 bg-indigo-50"
                  : "border-slate-100 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="text-left">
                  <p className="text-sm font-medium text-slate-800">{agent.agentName}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${getStatusColour(agent.currentStatus)}`}>
                      {getStatusLabel(agent.currentStatus)}
                    </span>
                    <span className={`text-[10px] ${getRiskColour(agent.riskLevel)}`}>
                      {agent.riskLevel} risk
                    </span>
                    <span className="text-[10px] text-slate-400">
                      £{agent.currentMonthlyCost.toFixed(0)}/mo
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${agent.readinessScore >= 75 ? "bg-green-500" : agent.readinessScore >= 50 ? "bg-amber-500" : "bg-slate-400"}`}
                    style={{ width: `${agent.readinessScore}%` }}
                  />
                </div>
                <span className={`text-xs font-semibold w-8 text-right ${getScoreColour(agent.readinessScore)}`}>
                  {agent.readinessScore}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Agent Detail Panel */}
      {activeAgent && (
        <div className="bg-slate-50 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-800">{activeAgent.agentName}</h4>
            <span className="text-xs text-slate-500">
              Recommended: {getTierLabel(activeAgent.recommendedTier)}
            </span>
          </div>

          {/* Requirements */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Requirements:</span>
            <span className={`text-xs font-semibold ${activeAgent.allCriticalMet ? "text-green-600" : "text-amber-600"}`}>
              {activeAgent.requirementsMet}/{activeAgent.requirementsTotal} met
              {activeAgent.allCriticalMet ? " (all critical passed)" : " (critical gaps)"}
            </span>
          </div>

          {/* Cost */}
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-500">Saving:</span>
            <span className="text-xs font-semibold text-green-600">
              £{activeAgent.monthlySaving.toFixed(0)}/mo (£{activeAgent.annualSaving.toFixed(0)}/yr)
            </span>
          </div>

          {/* Next Step */}
          {activeAgent.recommendedNextStatus && (
            <div className="bg-blue-50 border border-blue-100 rounded p-2">
              <p className="text-xs text-blue-700">
                <span className="font-medium">Next step:</span> Move to {getStatusLabel(activeAgent.recommendedNextStatus)}
              </p>
            </div>
          )}

          {/* Blockers */}
          {activeAgent.blockers.length > 0 && (
            <div className="bg-red-50 border border-red-100 rounded p-2">
              <p className="text-[10px] font-medium text-red-700 mb-1">Blockers:</p>
              {activeAgent.blockers.map((b, i) => (
                <p key={i} className="text-[10px] text-red-600">• {b}</p>
              ))}
            </div>
          )}

          {/* Recommendations */}
          {activeAgent.recommendations.length > 0 && (
            <div>
              <p className="text-[10px] font-medium text-slate-600 mb-1">Recommendations:</p>
              {activeAgent.recommendations.map((r, i) => (
                <p key={i} className="text-[10px] text-slate-500">• {r}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Top Candidates */}
      {metrics.topReplacementCandidates.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-slate-700 mb-2">Top Replacement Candidates</h4>
          <div className="flex flex-wrap gap-2">
            {metrics.topReplacementCandidates.map((c) => (
              <span
                key={c.agentName}
                className="text-xs bg-green-50 text-green-800 border border-green-100 px-2.5 py-1 rounded-full"
              >
                {c.agentName} ({c.readinessScore}% ready, £{c.monthlySaving.toFixed(0)}/mo)
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Warnings */}
      {metrics.warnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
          <h4 className="text-sm font-medium text-amber-800 mb-2">Alerts</h4>
          <ul className="space-y-1">
            {metrics.warnings.map((w, i) => (
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
          <MiniStat label="Total agents" value={String(metrics.totalAgents)} />
          <MiniStat label="High risk" value={String(metrics.highRiskAgents)} />
          <MiniStat label="Critical" value={String(metrics.criticalRiskAgents)} />
        </div>
        <span className="text-xs text-slate-400">
          Cara Learning Layer v1.0
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

function PipelineStage({ label, count, colour }: { label: string; count: number; colour: string }) {
  return (
    <div className={`flex-1 rounded-lg p-2 text-center ${colour}`}>
      <p className="text-xs font-semibold text-slate-800">{count}</p>
      <p className="text-[9px] text-slate-600">{label}</p>
    </div>
  );
}

function PipelineArrow() {
  return <span className="text-slate-300 text-xs px-0.5">&rarr;</span>;
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-slate-500">{label}:</span>
      <span className="text-xs font-semibold text-slate-700">{value}</span>
    </div>
  );
}

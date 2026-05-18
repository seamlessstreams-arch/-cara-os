"use client";

import { useState, useEffect } from "react";
import type { QualityAssuranceIntelligenceResult } from "@/lib/quality-assurance";

const ratingColors: Record<string, string> = {
  outstanding: "bg-green-100 text-green-800 border-green-300",
  good: "bg-blue-100 text-blue-800 border-blue-300",
  requires_improvement: "bg-amber-100 text-amber-800 border-amber-300",
  inadequate: "bg-red-100 text-red-800 border-red-300",
};

const ratingLabels: Record<string, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

function ScoreBar({ score, label, maxScore = 100 }: { score: number; label: string; maxScore?: number }) {
  const pct = (score / maxScore) * 100;
  const color =
    pct >= 80 ? "bg-green-500" : pct >= 60 ? "bg-blue-500" : pct >= 40 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 w-44 shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2.5">
        <div className={`h-2.5 rounded-full ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <span className="text-sm font-medium w-12 text-right">{score}</span>
    </div>
  );
}

function Section({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors">
        <span className="font-medium text-gray-900">{title}</span>
        <span className="text-gray-400">{open ? "▲" : "▼"}</span>
      </button>
      {open && <div className="p-4 space-y-3">{children}</div>}
    </div>
  );
}

export function QualityAssuranceDashboardWidget() {
  const [data, setData] = useState<QualityAssuranceIntelligenceResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/quality-assurance")
      .then((res) => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json(); })
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-2/3" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="grid grid-cols-4 gap-4">{[1, 2, 3, 4].map((i) => <div key={i} className="h-20 bg-gray-200 rounded" />)}</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
        <h3 className="text-lg font-semibold text-red-800">Quality Assurance Intelligence</h3>
        <p className="text-red-600 mt-2">Failed to load: {error}</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Quality Assurance &amp; Continuous Improvement</h3>
          <p className="text-sm text-gray-500 mt-1">{data.periodStart} to {data.periodEnd}</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-gray-900">{data.overallScore}</div>
          <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${ratingColors[data.rating] || ""}`}>
            {ratingLabels[data.rating] || data.rating}
          </span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.auditCycle.coverageRate}%</div>
          <div className="text-xs text-gray-500 mt-1">Audit Coverage</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.actionTracking.completionRate}%</div>
          <div className="text-xs text-gray-500 mt-1">Action Completion</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.improvement.activeInitiatives}</div>
          <div className="text-xs text-gray-500 mt-1">Active Initiatives</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.selfEvaluation.domainsCovered}/{data.selfEvaluation.totalDomains}</div>
          <div className="text-xs text-gray-500 mt-1">SCCIF Domains Evaluated</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.monitoring.averageComplianceRate}%</div>
          <div className="text-xs text-gray-500 mt-1">Avg Compliance</div>
        </div>
      </div>

      {/* Component Scores */}
      <div className="space-y-2">
        <ScoreBar score={data.auditCycle.overallAuditScore} label="Audit Cycle" />
        <ScoreBar score={data.actionTracking.overallActionScore} label="Action Tracking" />
        <ScoreBar score={data.improvement.overallImprovementScore} label="Improvement Initiatives" />
        <ScoreBar score={data.selfEvaluation.overallSelfEvalScore} label="Self-Evaluation" />
        <ScoreBar score={data.monitoring.overallMonitoringScore} label="Quality Monitoring" />
      </div>

      {/* Sections */}
      <div className="space-y-3">
        <Section title="Internal Audit Cycle" defaultOpen>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Total Audits:</span> <span className="font-medium">{data.auditCycle.totalAudits}</span></div>
            <div><span className="text-gray-500">Areas Covered:</span> <span className="font-medium">{data.auditCycle.areasAudited}/{data.auditCycle.totalAuditAreas}</span></div>
            <div><span className="text-gray-500">Avg Findings:</span> <span className="font-medium">{data.auditCycle.averageFindings}</span></div>
            <div><span className="text-gray-500">Critical:</span> <span className={`font-medium ${data.auditCycle.criticalFindingsTotal > 0 ? "text-red-600" : "text-green-600"}`}>{data.auditCycle.criticalFindingsTotal}</span></div>
          </div>
          <div className="grid grid-cols-4 gap-2 mt-2">
            {(["outstanding", "good", "requires_improvement", "inadequate"] as const).map((r) => (
              <div key={r} className={`text-center p-2 rounded ${ratingColors[r]} border text-xs`}>
                <div className="font-bold">{data.auditCycle.ratingBreakdown[r]}</div>
                <div>{ratingLabels[r]}</div>
              </div>
            ))}
          </div>
          {data.auditCycle.improvingAreas.length > 0 && (
            <div className="text-sm text-green-600 mt-2">Improving: {data.auditCycle.improvingAreas.join(", ")}</div>
          )}
          {data.auditCycle.decliningAreas.length > 0 && (
            <div className="text-sm text-red-600 mt-1">Declining: {data.auditCycle.decliningAreas.join(", ")}</div>
          )}
        </Section>

        <Section title="Action Plan Tracking">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Total:</span> <span className="font-medium">{data.actionTracking.totalActions}</span></div>
            <div><span className="text-gray-500">Completed:</span> <span className="font-medium text-green-600">{data.actionTracking.completedActions}</span></div>
            <div><span className="text-gray-500">Overdue:</span> <span className={`font-medium ${data.actionTracking.overdueActions > 0 ? "text-red-600" : "text-green-600"}`}>{data.actionTracking.overdueActions}</span></div>
            <div><span className="text-gray-500">In Progress:</span> <span className="font-medium">{data.actionTracking.inProgressActions}</span></div>
            <div><span className="text-gray-500">Avg Days:</span> <span className="font-medium">{data.actionTracking.averageCompletionDays}</span></div>
            <div><span className="text-gray-500">Impact Assessed:</span> <span className="font-medium">{data.actionTracking.impactAssessedRate}%</span></div>
          </div>
          {data.actionTracking.criticalActionsOverdue > 0 && (
            <div className="mt-2 text-sm text-red-600 font-medium">{data.actionTracking.criticalActionsOverdue} critical action(s) overdue</div>
          )}
        </Section>

        <Section title="Quality Improvement Initiatives">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <div><span className="text-gray-500">Total:</span> <span className="font-medium">{data.improvement.totalInitiatives}</span></div>
            <div><span className="text-gray-500">Active:</span> <span className="font-medium">{data.improvement.activeInitiatives}</span></div>
            <div><span className="text-gray-500">Completed:</span> <span className="font-medium">{data.improvement.completedInitiatives}</span></div>
            <div><span className="text-gray-500">Children Involved:</span> <span className="font-medium">{data.improvement.childInvolvementRate}%</span></div>
            <div><span className="text-gray-500">Staff Involved:</span> <span className="font-medium">{data.improvement.staffInvolvementRate}%</span></div>
            <div><span className="text-gray-500">Measurable:</span> <span className="font-medium">{data.improvement.measurableOutcomeRate}%</span></div>
          </div>
        </Section>

        <Section title="Self-Evaluation">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <div><span className="text-gray-500">Domains Covered:</span> <span className="font-medium">{data.selfEvaluation.domainsCovered}/{data.selfEvaluation.totalDomains}</span></div>
            <div><span className="text-gray-500">Avg Rating:</span> <span className="font-medium">{data.selfEvaluation.averageRating}/4</span></div>
            <div><span className="text-gray-500">Child Voice:</span> <span className="font-medium">{data.selfEvaluation.childVoiceRate}%</span></div>
            <div><span className="text-gray-500">Staff Voice:</span> <span className="font-medium">{data.selfEvaluation.staffVoiceRate}%</span></div>
            <div><span className="text-gray-500">External Feedback:</span> <span className="font-medium">{data.selfEvaluation.externalFeedbackRate}%</span></div>
          </div>
        </Section>

        <Section title="Quality Monitoring">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <div><span className="text-gray-500">Activities:</span> <span className="font-medium">{data.monitoring.totalMonitoring}</span></div>
            <div><span className="text-gray-500">Avg Compliance:</span> <span className="font-medium">{data.monitoring.averageComplianceRate}%</span></div>
            <div><span className="text-gray-500">Follow-up Completed:</span> <span className="font-medium">{data.monitoring.followUpCompletedRate}%</span></div>
          </div>
        </Section>

        <Section title="Strengths, Areas & Actions">
          {data.strengths.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-green-700 mb-1">Strengths</h4>
              <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                {data.strengths.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}
          {data.areasForImprovement.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-amber-700 mb-1">Areas for Improvement</h4>
              <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                {data.areasForImprovement.map((a, i) => <li key={i}>{a}</li>)}
              </ul>
            </div>
          )}
          {data.actions.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-blue-700 mb-1">Recommended Actions</h4>
              <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                {data.actions.map((a, i) => <li key={i}>{a}</li>)}
              </ul>
            </div>
          )}
        </Section>

        <Section title="Regulatory Framework">
          <ul className="text-sm text-gray-600 space-y-1">
            {data.regulatoryLinks.map((link, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">§</span>
                <span>{link}</span>
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </div>
  );
}

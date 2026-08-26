"use client";

import { useState, useEffect } from "react";
import { above, formatRate } from "@/lib/metrics/rate";
import type { EnvironmentalRiskComplianceIntelligence } from "@/lib/environmental-risk-compliance";

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
  const color = pct >= 80 ? "bg-green-500" : pct >= 60 ? "bg-blue-500" : pct >= 40 ? "bg-amber-500" : "bg-red-500";
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

export function EnvironmentalRiskComplianceDashboardWidget() {
  const [data, setData] = useState<EnvironmentalRiskComplianceIntelligence | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/environmental-risk-compliance")
      .then((res) => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json(); })
      .then((json) => setData(json.data))
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
        <h3 className="text-lg font-semibold text-red-800">Environmental Risk Compliance</h3>
        <p className="text-red-600 mt-2">Failed to load: {error}</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Environmental Risk Compliance</h3>
          <p className="text-sm text-gray-500 mt-1">{data.periodStart} to {data.periodEnd}</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-gray-900">{data.overallScore}</div>
          <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${ratingColors[data.rating] || ""}`}>
            {ratingLabels[data.rating] || data.rating}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.riskAssessmentCoverage.totalAssessments}</div>
          <div className="text-xs text-gray-500 mt-1">Assessments</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.safetyCheckCompliance.totalChecks}</div>
          <div className="text-xs text-gray-500 mt-1">Safety Checks</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{formatRate(data.safetyCheckCompliance.compliantRate)}</div>
          <div className="text-xs text-gray-500 mt-1">Compliant</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.remediationEffectiveness.totalActions}</div>
          <div className="text-xs text-gray-500 mt-1">Remediations</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{formatRate(data.riskAssessmentCoverage.areaCoverageRate)}</div>
          <div className="text-xs text-gray-500 mt-1">Area Coverage</div>
        </div>
      </div>

      <div className="space-y-2">
        <ScoreBar score={data.riskAssessmentCoverage.overallScore} label="Risk Assessment" maxScore={25} />
        <ScoreBar score={data.safetyCheckCompliance.overallScore} label="Safety Checks" maxScore={25} />
        <ScoreBar score={data.remediationEffectiveness.overallScore} label="Remediation" maxScore={25} />
        <ScoreBar score={data.staffSafetyReadiness.overallScore} label="Staff Readiness" maxScore={25} />
      </div>

      <div className="space-y-3">
        {data.areaProfiles.length > 0 && (
          <Section title="Area Risk Profiles" defaultOpen>
            <div className="space-y-3">
              {data.areaProfiles.map((area) => (
                <div key={area.areaName} className="border border-gray-100 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{area.areaName}</span>
                    <span className="text-sm font-medium text-gray-600">{area.overallScore}/10</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div>Assessments: <span className="font-medium">{area.assessmentCount}</span></div>
                    <div>Checks: <span className="font-medium">{area.checkCount}</span></div>
                    <div>Remediations: <span className="font-medium">{area.remediationCount}</span></div>
                    <div>Coverage: <span className={`font-medium ${area.assessmentCoverage ? "text-green-600" : "text-red-600"}`}>{area.assessmentCoverage ? "Yes" : "No"}</span></div>
                    <div>Compliant: <span className={`font-medium ${area.checkCompliance ? "text-green-600" : "text-amber-600"}`}>{area.checkCompliance ? "Yes" : "No"}</span></div>
                    <div>Clear: <span className={`font-medium ${area.remediationClear ? "text-green-600" : "text-amber-600"}`}>{area.remediationClear ? "Yes" : "No"}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        <Section title="Risk Assessment Coverage">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Assessments:</span> <span className="font-medium">{data.riskAssessmentCoverage.totalAssessments}</span></div>
            <div><span className="text-gray-500">Areas Covered:</span> <span className="font-medium">{data.riskAssessmentCoverage.areasCovered}/{data.riskAssessmentCoverage.totalAreas}</span></div>
            <div><span className="text-gray-500">Coverage:</span> <span className="font-medium">{formatRate(data.riskAssessmentCoverage.areaCoverageRate)}</span></div>
            <div><span className="text-gray-500">Reviews Current:</span> <span className="font-medium">{formatRate(data.riskAssessmentCoverage.reviewCurrentRate)}</span></div>
            <div><span className="text-gray-500">Mitigated:</span> <span className="font-medium">{formatRate(data.riskAssessmentCoverage.mitigationInPlaceRate)}</span></div>
            <div><span className="text-gray-500">High/Critical:</span> <span className="font-medium">{formatRate(data.riskAssessmentCoverage.highCriticalMitigatedRate)}</span></div>
          </div>
        </Section>

        <Section title="Safety Check Compliance">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Total Checks:</span> <span className="font-medium">{data.safetyCheckCompliance.totalChecks}</span></div>
            <div><span className="text-gray-500">Compliant:</span> <span className="font-medium">{formatRate(data.safetyCheckCompliance.compliantRate)}</span></div>
            <div><span className="text-gray-500">Non-Compliant:</span> <span className={`font-medium ${data.safetyCheckCompliance.nonCompliantCount > 0 ? "text-red-600" : "text-green-600"}`}>{data.safetyCheckCompliance.nonCompliantCount}</span></div>
            <div><span className="text-gray-500">Actions Done:</span> <span className="font-medium">{formatRate(data.safetyCheckCompliance.actionRequiredCompletedRate)}</span></div>
            <div><span className="text-gray-500">Frequency OK:</span> <span className={`font-medium ${data.safetyCheckCompliance.checkFrequencyAdequate ? "text-green-600" : "text-amber-600"}`}>{data.safetyCheckCompliance.checkFrequencyAdequate ? "Yes" : "No"}</span></div>
          </div>
        </Section>

        <Section title="Remediation Effectiveness">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Actions:</span> <span className="font-medium">{data.remediationEffectiveness.totalActions}</span></div>
            <div><span className="text-gray-500">On Time:</span> <span className="font-medium">{formatRate(data.remediationEffectiveness.completedOnTimeRate)}</span></div>
            <div><span className="text-gray-500">Overdue:</span> <span className={`font-medium ${above(data.remediationEffectiveness.overdueRate, 0) ? "text-red-600" : "text-green-600"}`}>{formatRate(data.remediationEffectiveness.overdueRate)}</span></div>
            <div><span className="text-gray-500">Verified:</span> <span className="font-medium">{formatRate(data.remediationEffectiveness.verifiedRate)}</span></div>
            <div><span className="text-gray-500">In Progress:</span> <span className="font-medium">{data.remediationEffectiveness.inProgressCount}</span></div>
          </div>
        </Section>

        <Section title="Staff Safety Readiness">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Staff:</span> <span className="font-medium">{data.staffSafetyReadiness.totalStaff}</span></div>
            <div><span className="text-gray-500">Ligature:</span> <span className="font-medium">{formatRate(data.staffSafetyReadiness.ligatureAwarenessRate)}</span></div>
            <div><span className="text-gray-500">COSHH:</span> <span className="font-medium">{formatRate(data.staffSafetyReadiness.coshhTrainedRate)}</span></div>
            <div><span className="text-gray-500">Fire Safety:</span> <span className="font-medium">{formatRate(data.staffSafetyReadiness.fireSafetyRate)}</span></div>
            <div><span className="text-gray-500">Water Safety:</span> <span className="font-medium">{formatRate(data.staffSafetyReadiness.waterSafetyRate)}</span></div>
            <div><span className="text-gray-500">Risk Competent:</span> <span className="font-medium">{formatRate(data.staffSafetyReadiness.riskAssessmentCompetentRate)}</span></div>
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
                {data.actions.map((a, i) => (
                  <li key={i} className={a.startsWith("URGENT") ? "text-red-700 font-medium" : ""}>
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Section>

        <Section title="Regulatory Framework">
          <ul className="text-sm text-gray-600 space-y-1">
            {data.regulatoryLinks.map((link, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">&sect;</span>
                <span>{link}</span>
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </div>
  );
}

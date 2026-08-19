"use client";

import { useState, useEffect } from "react";
import type { SelfHarmPreventionProtocolIntelligence } from "@/lib/self-harm-prevention-protocol";

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

const riskColors: Record<string, string> = {
  low: "text-green-600",
  medium: "text-amber-600",
  high: "text-orange-600",
  very_high: "text-red-600",
};

const riskLabels: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  very_high: "Very High",
};

const safetyPlanColors: Record<string, string> = {
  current: "text-green-600",
  overdue: "text-amber-600",
  not_in_place: "text-red-600",
};

const safetyPlanLabels: Record<string, string> = {
  current: "Current",
  overdue: "Overdue",
  not_in_place: "Not In Place",
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

export function SelfHarmPreventionProtocolDashboardWidget() {
  const [data, setData] = useState<SelfHarmPreventionProtocolIntelligence | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/self-harm-prevention-protocol")
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
        <h3 className="text-lg font-semibold text-red-800">Self-Harm Prevention Protocol</h3>
        <p className="text-red-600 mt-2">Failed to load: {error}</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Self-Harm Prevention Protocol</h3>
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
          <div className="text-2xl font-bold text-gray-900">{data.riskAssessmentQuality.totalProfiles}</div>
          <div className="text-xs text-gray-500 mt-1">Risk Profiles</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.incidentResponse.totalIncidents}</div>
          <div className="text-xs text-gray-500 mt-1">Incidents</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.safetyPlanning.safetyPlanInPlaceRate}%</div>
          <div className="text-xs text-gray-500 mt-1">Plans Current</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.safetyPlanning.totalChecks}</div>
          <div className="text-xs text-gray-500 mt-1">Env. Checks</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.staffCompetence.totalStaff}</div>
          <div className="text-xs text-gray-500 mt-1">Staff Trained</div>
        </div>
      </div>

      <div className="space-y-2">
        <ScoreBar score={data.riskAssessmentQuality.overallScore} label="Risk Assessment" maxScore={25} />
        <ScoreBar score={data.safetyPlanning.overallScore} label="Safety Planning" maxScore={25} />
        <ScoreBar score={data.incidentResponse.overallScore} label="Incident Response" maxScore={25} />
        <ScoreBar score={data.staffCompetence.overallScore} label="Staff Competence" maxScore={25} />
      </div>

      <div className="space-y-3">
        {data.childProfiles.length > 0 && (
          <Section title="Child Self-Harm Profiles" defaultOpen>
            <div className="space-y-3">
              {data.childProfiles.map((child) => (
                <div key={child.childId} className="border border-gray-100 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{child.childName}</span>
                    <span className="text-sm font-medium text-gray-600">{child.overallScore}/10</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div>Risk: <span className={`font-medium ${riskColors[child.riskLevel] || ""}`}>{riskLabels[child.riskLevel] || child.riskLevel}</span></div>
                    <div>Safety Plan: <span className={`font-medium ${safetyPlanColors[child.safetyPlanStatus] || ""}`}>{safetyPlanLabels[child.safetyPlanStatus] || child.safetyPlanStatus}</span></div>
                    <div>Incidents: <span className="font-medium">{child.incidentsInPeriod}</span></div>
                    <div>Triggers: <span className="font-medium">{child.triggersIdentified}</span></div>
                    <div>Coping Strategies: <span className="font-medium">{child.copingStrategies}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        <Section title="Risk Assessment Quality">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Profiles:</span> <span className="font-medium">{data.riskAssessmentQuality.totalProfiles}</span></div>
            <div><span className="text-gray-500">Assessed:</span> <span className="font-medium">{data.riskAssessmentQuality.riskAssessedRate}%</span></div>
            <div><span className="text-gray-500">Review Current:</span> <span className="font-medium">{data.riskAssessmentQuality.reviewCurrentRate}%</span></div>
            <div><span className="text-gray-500">Triggers ID&apos;d:</span> <span className="font-medium">{data.riskAssessmentQuality.triggersIdentifiedRate}%</span></div>
            <div><span className="text-gray-500">Prof. Support:</span> <span className="font-medium">{data.riskAssessmentQuality.professionalSupportRate}%</span></div>
          </div>
        </Section>

        <Section title="Safety Planning">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Plans Current:</span> <span className="font-medium">{data.safetyPlanning.safetyPlanInPlaceRate}%</span></div>
            <div><span className="text-gray-500">Coping Strategies:</span> <span className="font-medium">{data.safetyPlanning.copingStrategiesRate}%</span></div>
            <div><span className="text-gray-500">Emergency Contacts:</span> <span className="font-medium">{data.safetyPlanning.emergencyContactsRate}%</span></div>
            <div><span className="text-gray-500">Env. Compliant:</span> <span className={`font-medium ${data.safetyPlanning.environmentalComplianceRate === 100 ? "text-green-600" : "text-amber-600"}`}>{data.safetyPlanning.environmentalComplianceRate}%</span></div>
            <div><span className="text-gray-500">Total Checks:</span> <span className="font-medium">{data.safetyPlanning.totalChecks}</span></div>
          </div>
        </Section>

        <Section title="Incident Response">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Incidents:</span> <span className="font-medium">{data.incidentResponse.totalIncidents}</span></div>
            <div><span className="text-gray-500">Immediate Action:</span> <span className="font-medium">{data.incidentResponse.immediateActionRate}%</span></div>
            <div><span className="text-gray-500">Medical Assessed:</span> <span className="font-medium">{data.incidentResponse.medicalAssessmentRate}%</span></div>
            <div><span className="text-gray-500">Debriefed:</span> <span className="font-medium">{data.incidentResponse.debriefCompletedRate}%</span></div>
            <div><span className="text-gray-500">Plan Updated:</span> <span className="font-medium">{data.incidentResponse.safetyPlanUpdatedRate}%</span></div>
          </div>
        </Section>

        <Section title="Staff Competence">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Staff:</span> <span className="font-medium">{data.staffCompetence.totalStaff}</span></div>
            <div><span className="text-gray-500">Awareness:</span> <span className="font-medium">{data.staffCompetence.selfHarmAwarenessRate}%</span></div>
            <div><span className="text-gray-500">Risk Assessment:</span> <span className="font-medium">{data.staffCompetence.riskAssessmentRate}%</span></div>
            <div><span className="text-gray-500">Crisis Intervention:</span> <span className="font-medium">{data.staffCompetence.crisisInterventionRate}%</span></div>
            <div><span className="text-gray-500">Safety Planning:</span> <span className="font-medium">{data.staffCompetence.safetyPlanningRate}%</span></div>
            <div><span className="text-gray-500">MH First Aid:</span> <span className="font-medium">{data.staffCompetence.mentalHealthFirstAidRate}%</span></div>
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

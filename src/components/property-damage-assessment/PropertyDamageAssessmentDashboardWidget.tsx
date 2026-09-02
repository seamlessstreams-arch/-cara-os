"use client";

import { formatRate } from "@/lib/metrics/rate";
import { useState, useEffect } from "react";
import type { PropertyDamageAssessmentIntelligence } from "@/lib/property-damage-assessment";

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

function ScoreBar({ score, label, maxScore = 25 }: { score: number; label: string; maxScore?: number }) {
  const pctVal = (score / maxScore) * 100;
  const color = pctVal >= 80 ? "bg-green-500" : pctVal >= 60 ? "bg-blue-500" : pctVal >= 40 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 w-44 shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2.5">
        <div className={`h-2.5 rounded-full ${color}`} style={{ width: `${Math.min(pctVal, 100)}%` }} />
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

export function PropertyDamageAssessmentDashboardWidget() {
  const [data, setData] = useState<PropertyDamageAssessmentIntelligence | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/property-damage-assessment")
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
        <h3 className="text-lg font-semibold text-red-800">Property Damage Assessment</h3>
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
          <h3 className="text-lg font-semibold text-gray-900">Property Damage Assessment</h3>
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.incidentManagement.totalIncidents}</div>
          <div className="text-xs text-gray-500 mt-1">Damage Incidents</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.propertyCondition.totalInspections}</div>
          <div className="text-xs text-gray-500 mt-1">Inspections</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.repairEffectiveness.totalRepairs}</div>
          <div className="text-xs text-gray-500 mt-1">Repairs Completed</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.preventionStrategy.activeMeasures}</div>
          <div className="text-xs text-gray-500 mt-1">Active Prevention</div>
        </div>
      </div>

      {/* Component Scores */}
      <div className="space-y-2">
        <ScoreBar score={data.incidentManagement.overallScore} label="Incident Management" />
        <ScoreBar score={data.propertyCondition.overallScore} label="Property Condition" />
        <ScoreBar score={data.repairEffectiveness.overallScore} label="Repair Effectiveness" />
        <ScoreBar score={data.preventionStrategy.overallScore} label="Prevention Strategy" />
      </div>

      {/* Sections */}
      <div className="space-y-3">
        <Section title="Incident Management" defaultOpen>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <div><span className="text-gray-500">Total Incidents:</span> <span className="font-medium">{data.incidentManagement.totalIncidents}</span></div>
            <div><span className="text-gray-500">Therapeutic Response:</span> <span className="font-medium">{formatRate(data.incidentManagement.therapeuticResponseRate)}</span></div>
            <div><span className="text-gray-500">Timely Repair:</span> <span className="font-medium">{formatRate(data.incidentManagement.timelyRepairRate)}</span></div>
            <div><span className="text-gray-500">Insurance Claimed:</span> <span className="font-medium">{data.incidentManagement.insuranceClaimedForSignificant}</span></div>
            <div><span className="text-gray-500">Severe Incidents:</span> <span className={`font-medium ${data.incidentManagement.severeCount > 0 ? "text-red-600" : "text-gray-900"}`}>{data.incidentManagement.severeCount}</span></div>
            <div><span className="text-gray-500">Context Documented:</span> <span className="font-medium">{formatRate(data.incidentManagement.contextDocumentedRate)}</span></div>
          </div>
        </Section>

        <Section title="Property Condition">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <div><span className="text-gray-500">Inspections:</span> <span className="font-medium">{data.propertyCondition.totalInspections}</span></div>
            <div><span className="text-gray-500">Good/Excellent:</span> <span className="font-medium">{formatRate(data.propertyCondition.excellentOrGoodRate)}</span></div>
            <div><span className="text-gray-500">Issues Resolved:</span> <span className="font-medium">{formatRate(data.propertyCondition.issuesResolvedRate)}</span></div>
            <div><span className="text-gray-500">Maintenance Followed:</span> <span className="font-medium">{formatRate(data.propertyCondition.maintenanceFollowedRate)}</span></div>
            <div><span className="text-gray-500">Regular Inspections:</span> <span className={`font-medium ${data.propertyCondition.regularInspections ? "text-green-600" : "text-amber-600"}`}>{data.propertyCondition.regularInspections ? "Yes" : "No"}</span></div>
          </div>
        </Section>

        <Section title="Repair Effectiveness">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <div><span className="text-gray-500">Total Repairs:</span> <span className="font-medium">{data.repairEffectiveness.totalRepairs}</span></div>
            <div><span className="text-gray-500">Timeliness Score:</span> <span className="font-medium">{data.repairEffectiveness.timelinessScore}/8</span></div>
            <div><span className="text-gray-500">Quality Score:</span> <span className="font-medium">{data.repairEffectiveness.qualityScore}/7</span></div>
            <div><span className="text-gray-500">Safety Restored:</span> <span className="font-medium">{formatRate(data.repairEffectiveness.safetyRestoredRate)}</span></div>
            <div><span className="text-gray-500">Completion Rate:</span> <span className="font-medium">{formatRate(data.repairEffectiveness.completionRate)}</span></div>
          </div>
        </Section>

        <Section title="Prevention Strategy">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <div><span className="text-gray-500">Total Measures:</span> <span className="font-medium">{data.preventionStrategy.totalMeasures}</span></div>
            <div><span className="text-gray-500">Active Measures:</span> <span className="font-medium">{data.preventionStrategy.activeMeasures}</span></div>
            <div><span className="text-gray-500">Effectiveness:</span> <span className="font-medium">{formatRate(data.preventionStrategy.effectivenessRate)}</span></div>
            <div><span className="text-gray-500">Repeat Children Covered:</span> <span className="font-medium">{data.preventionStrategy.repeatChildrenCovered}</span></div>
            <div><span className="text-gray-500">Environmental Adaptations:</span> <span className="font-medium">{data.preventionStrategy.environmentalAdaptations}</span></div>
            <div><span className="text-gray-500">Reviews Current:</span> <span className="font-medium">{data.preventionStrategy.reviewCurrent}</span></div>
          </div>
        </Section>

        {data.childDamageProfiles.length > 0 && (
          <Section title="Child Damage Profiles">
            <div className="space-y-3">
              {data.childDamageProfiles.map((child) => (
                <div key={child.childId} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{child.childName}</span>
                    <span className={`text-sm font-medium ${child.score >= 7 ? "text-green-600" : child.score >= 4 ? "text-amber-600" : "text-red-600"}`}>
                      {child.score}/10
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-600">
                    <div>Incidents: <span className="font-medium text-gray-900">{child.incidentCount}</span></div>
                    <div>Cost: <span className="font-medium text-gray-900">£{child.totalEstimatedCost}</span></div>
                    <div>Therapeutic: <span className="font-medium text-gray-900">{formatRate(child.therapeuticResponseRate)}</span></div>
                    <div>Prevention: <span className="font-medium text-gray-900">{child.preventionMeasuresActive}</span></div>
                  </div>
                  {child.primaryContext && (
                    <div className="mt-1 text-xs text-gray-500">
                      Primary context: <span className="capitalize">{child.primaryContext.replace(/_/g, " ")}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

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

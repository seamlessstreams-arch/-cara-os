"use client";

import { useState, useEffect } from "react";
import type { AllergenDietaryManagementIntelligence } from "@/lib/allergen-dietary-management";
import { formatRate } from "@/lib/metrics/rate";

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

export function AllergenDietaryManagementDashboardWidget() {
  const [data, setData] = useState<AllergenDietaryManagementIntelligence | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/allergen-dietary-management")
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
        <h3 className="text-lg font-semibold text-red-800">Allergen & Dietary Management</h3>
        <p className="text-red-600 mt-2">Failed to load: {error}</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Allergen & Dietary Management</h3>
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
          <div className="text-2xl font-bold text-gray-900">{data.allergenDocumentation.totalChildren}</div>
          <div className="text-xs text-gray-500 mt-1">Children Profiled</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.allergenDocumentation.childrenWithAllergens}</div>
          <div className="text-xs text-gray-500 mt-1">With Allergens</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.mealSafety.totalMeals}</div>
          <div className="text-xs text-gray-500 mt-1">Meals Recorded</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className={`text-2xl font-bold ${data.incidentResponse.totalIncidents === 0 ? "text-green-600" : "text-amber-600"}`}>{data.incidentResponse.totalIncidents}</div>
          <div className="text-xs text-gray-500 mt-1">Incidents</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{formatRate(data.staffCompetence.fullyCompetentRate)}</div>
          <div className="text-xs text-gray-500 mt-1">Staff Competent</div>
        </div>
      </div>

      <div className="space-y-2">
        <ScoreBar score={data.allergenDocumentation.overallScore} label="Allergen Documentation" maxScore={25} />
        <ScoreBar score={data.mealSafety.overallScore} label="Meal Safety" maxScore={25} />
        <ScoreBar score={data.incidentResponse.overallScore} label="Incident Response" maxScore={25} />
        <ScoreBar score={data.staffCompetence.overallScore} label="Staff Competence" maxScore={25} />
      </div>

      <div className="space-y-3">
        {data.childSummaries.length > 0 && (
          <Section title="Child Allergen Profiles" defaultOpen>
            <div className="space-y-3">
              {data.childSummaries.map((child) => (
                <div key={child.childId} className="border border-gray-100 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{child.childName}</span>
                    <span className="text-sm font-medium text-gray-600">{child.overallScore}/10</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div>Allergens: <span className="font-medium">{child.allergenCount}</span></div>
                    <div>Life-Threatening: <span className={`font-medium ${child.hasLifeThreatening ? "text-red-600" : "text-green-600"}`}>{child.hasLifeThreatening ? "Yes" : "No"}</span></div>
                    <div>Emergency Plan: <span className={`font-medium ${child.emergencyPlanCurrent ? "text-green-600" : "text-red-600"}`}>{child.emergencyPlanCurrent ? "Current" : "Not Current"}</span></div>
                    <div>EpiPen: <span className={`font-medium ${child.epiPenAvailable ? "text-green-600" : "text-gray-400"}`}>{child.epiPenAvailable ? "Available" : "N/A"}</span></div>
                    <div>Incidents: <span className={`font-medium ${child.incidentCount > 0 ? "text-amber-600" : "text-green-600"}`}>{child.incidentCount}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        <Section title="Allergen Documentation">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Children:</span> <span className="font-medium">{data.allergenDocumentation.totalChildren}</span></div>
            <div><span className="text-gray-500">With Allergens:</span> <span className="font-medium">{data.allergenDocumentation.childrenWithAllergens}</span></div>
            <div><span className="text-gray-500">Emergency Plans:</span> <span className="font-medium">{formatRate(data.allergenDocumentation.emergencyPlanCurrentRate)}</span></div>
            <div><span className="text-gray-500">EpiPen Available:</span> <span className="font-medium">{formatRate(data.allergenDocumentation.epiPenAvailableRate)}</span></div>
            <div><span className="text-gray-500">GP Notified:</span> <span className="font-medium">{formatRate(data.allergenDocumentation.gpNotifiedRate)}</span></div>
            <div><span className="text-gray-500">SW Notified:</span> <span className="font-medium">{formatRate(data.allergenDocumentation.socialWorkerNotifiedRate)}</span></div>
            <div><span className="text-gray-500">Reviews Current:</span> <span className="font-medium">{formatRate(data.allergenDocumentation.reviewUpToDateRate)}</span></div>
            <div><span className="text-gray-500">Life-Threatening:</span> <span className={`font-medium ${data.allergenDocumentation.lifeThreatening > 0 ? "text-red-600" : "text-green-600"}`}>{data.allergenDocumentation.lifeThreatening}</span></div>
          </div>
        </Section>

        <Section title="Meal Safety">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Meals:</span> <span className="font-medium">{data.mealSafety.totalMeals}</span></div>
            <div><span className="text-gray-500">Labelled:</span> <span className="font-medium">{formatRate(data.mealSafety.allergenLabelledRate)}</span></div>
            <div><span className="text-gray-500">Dietary Met:</span> <span className="font-medium">{formatRate(data.mealSafety.dietaryMetRate)}</span></div>
            <div><span className="text-gray-500">Cross-Contam:</span> <span className="font-medium">{formatRate(data.mealSafety.crossContaminationPreventedRate)}</span></div>
            <div><span className="text-gray-500">Child Consulted:</span> <span className="font-medium">{formatRate(data.mealSafety.childConsultedRate)}</span></div>
            <div><span className="text-gray-500">Fully Compliant:</span> <span className="font-medium">{formatRate(data.mealSafety.fullyCompliantRate)}</span></div>
          </div>
        </Section>

        <Section title="Incident Response">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Incidents:</span> <span className="font-medium">{data.incidentResponse.totalIncidents}</span></div>
            <div><span className="text-gray-500">Timely:</span> <span className="font-medium">{formatRate(data.incidentResponse.timelyResponseRate)}</span></div>
            <div><span className="text-gray-500">Plan Followed:</span> <span className="font-medium">{formatRate(data.incidentResponse.emergencyPlanFollowedRate)}</span></div>
            <div><span className="text-gray-500">Root Cause:</span> <span className="font-medium">{formatRate(data.incidentResponse.rootCauseIdentifiedRate)}</span></div>
            <div><span className="text-gray-500">Preventive:</span> <span className="font-medium">{formatRate(data.incidentResponse.preventiveMeasuresRate)}</span></div>
            <div><span className="text-gray-500">Hospital Visits:</span> <span className={`font-medium ${data.incidentResponse.hospitalVisitCount > 0 ? "text-red-600" : "text-green-600"}`}>{data.incidentResponse.hospitalVisitCount}</span></div>
          </div>
        </Section>

        <Section title="Staff Competence">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Staff:</span> <span className="font-medium">{data.staffCompetence.totalStaff}</span></div>
            <div><span className="text-gray-500">Awareness:</span> <span className="font-medium">{formatRate(data.staffCompetence.allergenAwarenessRate)}</span></div>
            <div><span className="text-gray-500">EpiPen:</span> <span className="font-medium">{formatRate(data.staffCompetence.epiPenTrainedRate)}</span></div>
            <div><span className="text-gray-500">Food Hygiene:</span> <span className="font-medium">{formatRate(data.staffCompetence.foodHygieneRate)}</span></div>
            <div><span className="text-gray-500">Cross-Contam:</span> <span className="font-medium">{formatRate(data.staffCompetence.crossContaminationTrainedRate)}</span></div>
            <div><span className="text-gray-500">Anaphylaxis:</span> <span className="font-medium">{formatRate(data.staffCompetence.anaphylaxisTrainedRate)}</span></div>
            <div><span className="text-gray-500">Competent:</span> <span className="font-medium">{formatRate(data.staffCompetence.fullyCompetentRate)}</span></div>
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

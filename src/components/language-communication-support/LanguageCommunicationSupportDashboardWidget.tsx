"use client";

import { useState, useEffect } from "react";
import { above, below, formatRate } from "@/lib/metrics/rate";
import type { LanguageCommunicationSupportIntelligence } from "@/lib/language-communication-support";

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

const communicationNeedLabels: Record<string, string> = {
  speech_delay: "Speech Delay",
  english_additional_language: "EAL",
  hearing_impairment: "Hearing Impairment",
  autism_spectrum: "Autism Spectrum",
  selective_mutism: "Selective Mutism",
  learning_disability: "Learning Disability",
  visual_impairment: "Visual Impairment",
  none: "None",
};

function ScoreBar({ score, label, maxScore = 100 }: { score: number; label: string; maxScore?: number }) {
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

export function LanguageCommunicationSupportDashboardWidget() {
  const [data, setData] = useState<LanguageCommunicationSupportIntelligence | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/language-communication-support")
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
        <h3 className="text-lg font-semibold text-red-800">Language & Communication Support</h3>
        <p className="text-red-600 mt-2">Failed to load: {error}</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Language & Communication Support</h3>
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
          <div className="text-2xl font-bold text-gray-900">{data.needsAssessment.totalProfiles}</div>
          <div className="text-xs text-gray-500 mt-1">Children</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{formatRate(data.needsAssessment.communicationPlanRate)}</div>
          <div className="text-xs text-gray-500 mt-1">Plans in Place</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.supportProvision.totalSessions}</div>
          <div className="text-xs text-gray-500 mt-1">Sessions</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{formatRate(data.supportProvision.qualityGoodPlusRate)}</div>
          <div className="text-xs text-gray-500 mt-1">Good+ Quality</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.staffCompetence.totalStaff}</div>
          <div className="text-xs text-gray-500 mt-1">Staff Trained</div>
        </div>
      </div>

      <div className="space-y-2">
        <ScoreBar score={data.needsAssessment.overallScore} label="Needs Assessment" maxScore={25} />
        <ScoreBar score={data.supportProvision.overallScore} label="Support Provision" maxScore={25} />
        <ScoreBar score={data.environmentAccessibility.overallScore} label="Environment Access" maxScore={25} />
        <ScoreBar score={data.staffCompetence.overallScore} label="Staff Competence" maxScore={25} />
      </div>

      <div className="space-y-3">
        {data.childProfiles.length > 0 && (
          <Section title="Child Communication Profiles" defaultOpen>
            <div className="space-y-3">
              {data.childProfiles.map((child) => (
                <div key={child.childId} className="border border-gray-100 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{child.childName}</span>
                    <span className="text-sm font-medium text-gray-600">{child.overallScore}/10</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div>Need: <span className="font-medium">{communicationNeedLabels[child.communicationNeed] || child.communicationNeed}</span></div>
                    <div>Plan: <span className={`font-medium ${child.hasPlan ? "text-green-600" : child.communicationNeed === "none" ? "text-gray-400" : "text-red-600"}`}>{child.hasPlan ? "Yes" : child.communicationNeed === "none" ? "N/A" : "No"}</span></div>
                    <div>Plan Current: <span className={`font-medium ${child.planCurrent ? "text-green-600" : child.communicationNeed === "none" ? "text-gray-400" : "text-amber-600"}`}>{child.planCurrent ? "Yes" : child.communicationNeed === "none" ? "N/A" : "No"}</span></div>
                    <div>Sessions: <span className="font-medium">{child.sessionsInPeriod}</span></div>
                    <div>Interpreter: <span className={`font-medium ${child.interpreterMet ? "text-green-600" : "text-red-600"}`}>{child.interpreterMet ? "Met" : "Unmet"}</span></div>
                    <div>Device: <span className={`font-medium ${child.deviceMet ? "text-green-600" : "text-red-600"}`}>{child.deviceMet ? "Met" : "Unmet"}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        <Section title="Needs Assessment">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Profiles:</span> <span className="font-medium">{data.needsAssessment.totalProfiles}</span></div>
            <div><span className="text-gray-500">Plan Rate:</span> <span className="font-medium">{formatRate(data.needsAssessment.communicationPlanRate)}</span></div>
            <div><span className="text-gray-500">Plans Current:</span> <span className="font-medium">{formatRate(data.needsAssessment.planCurrentRate)}</span></div>
            <div><span className="text-gray-500">Interpreter:</span> <span className={`font-medium ${below(data.needsAssessment.interpreterAvailableRate, 100) && above(data.needsAssessment.interpreterAvailableRate, 0) ? "text-amber-600" : data.needsAssessment.interpreterAvailableRate === 100 ? "text-green-600" : ""}`}>{formatRate(data.needsAssessment.interpreterAvailableRate)}</span></div>
            <div><span className="text-gray-500">Devices:</span> <span className={`font-medium ${below(data.needsAssessment.deviceProvidedRate, 100) && above(data.needsAssessment.deviceProvidedRate, 0) ? "text-amber-600" : data.needsAssessment.deviceProvidedRate === 100 ? "text-green-600" : ""}`}>{formatRate(data.needsAssessment.deviceProvidedRate)}</span></div>
          </div>
        </Section>

        <Section title="Support Provision">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Sessions:</span> <span className="font-medium">{data.supportProvision.totalSessions}</span></div>
            <div><span className="text-gray-500">Good+:</span> <span className="font-medium">{formatRate(data.supportProvision.qualityGoodPlusRate)}</span></div>
            <div><span className="text-gray-500">Engaged:</span> <span className="font-medium">{formatRate(data.supportProvision.childEngagedRate)}</span></div>
            <div><span className="text-gray-500">Progress:</span> <span className="font-medium">{formatRate(data.supportProvision.progressNotedRate)}</span></div>
            <div><span className="text-gray-500">Avg/Child:</span> <span className="font-medium">{data.supportProvision.averageSessionsPerChild}</span></div>
          </div>
        </Section>

        <Section title="Environment Accessibility">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Audits:</span> <span className="font-medium">{data.environmentAccessibility.totalAudits}</span></div>
            <div><span className="text-gray-500">Easy Read:</span> <span className="font-medium">{formatRate(data.environmentAccessibility.easyReadRate)}</span></div>
            <div><span className="text-gray-500">Visual Aids:</span> <span className="font-medium">{formatRate(data.environmentAccessibility.visualAidsRate)}</span></div>
            <div><span className="text-gray-500">Signage:</span> <span className="font-medium">{formatRate(data.environmentAccessibility.signageAccessibleRate)}</span></div>
            <div><span className="text-gray-500">Child Views:</span> <span className="font-medium">{formatRate(data.environmentAccessibility.childViewsAccessibleRate)}</span></div>
          </div>
        </Section>

        <Section title="Staff Competence">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Staff:</span> <span className="font-medium">{data.staffCompetence.totalStaff}</span></div>
            <div><span className="text-gray-500">Awareness:</span> <span className="font-medium">{formatRate(data.staffCompetence.awarenessRate)}</span></div>
            <div><span className="text-gray-500">Sign Language:</span> <span className="font-medium">{formatRate(data.staffCompetence.signLanguageRate)}</span></div>
            <div><span className="text-gray-500">Aug. Device:</span> <span className="font-medium">{formatRate(data.staffCompetence.augmentativeDeviceRate)}</span></div>
            <div><span className="text-gray-500">Easy Read:</span> <span className="font-medium">{formatRate(data.staffCompetence.easyReadRate)}</span></div>
            <div><span className="text-gray-500">Autism:</span> <span className="font-medium">{formatRate(data.staffCompetence.autismCommunicationRate)}</span></div>
            <div><span className="text-gray-500">Interpreter:</span> <span className="font-medium">{formatRate(data.staffCompetence.interpreterWorkingRate)}</span></div>
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

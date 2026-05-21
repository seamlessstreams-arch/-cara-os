"use client";

import { useState, useEffect } from "react";
import type { SafeguardingOversightIntelligenceResult } from "@/lib/safeguarding-oversight/safeguarding-oversight-intelligence-engine";

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

function Stat({ label, value, warn }: { label: string; value: string | number; warn?: boolean }) {
  return (
    <div>
      <span className="text-gray-500">{label}:</span>{" "}
      <span className={`font-medium ${warn ? "text-red-600" : ""}`}>{value}</span>
    </div>
  );
}

function ratingBadge(rating: string) {
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium border ${ratingColors[rating] || ""}`}>
      {ratingLabels[rating] || rating}
    </span>
  );
}

export function SafeguardingOversightIntelligenceWidget() {
  const [data, setData] = useState<SafeguardingOversightIntelligenceResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/safeguarding-oversight-intelligence")
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
        <h3 className="text-lg font-semibold text-red-800">Safeguarding Oversight Intelligence</h3>
        <p className="text-red-600 mt-2">Failed to load: {error}</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Safeguarding Oversight Intelligence</h3>
          <p className="text-sm text-gray-500 mt-1">{data.periodStart} to {data.periodEnd}</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-gray-900">{data.overallScore}</div>
          <div className="mt-1">{ratingBadge(data.rating)}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.safeguardingOversightQuality.totalRecords}</div>
          <div className="text-xs text-gray-500 mt-1">Records</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.safeguardingOversightQuality.riskAssessmentCompletedRate}%</div>
          <div className="text-xs text-gray-500 mt-1">Risk Assessed</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.safeguardingOversightCompliance.documentationCompleteRate}%</div>
          <div className="text-xs text-gray-500 mt-1">Documented</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.staffReadiness.totalStaff}</div>
          <div className="text-xs text-gray-500 mt-1">Staff Trained</div>
        </div>
      </div>

      <div className="space-y-2">
        <ScoreBar score={data.safeguardingOversightQuality.overallScore} label="Quality" />
        <ScoreBar score={data.safeguardingOversightCompliance.overallScore} label="Compliance" />
        <ScoreBar score={data.safeguardingOversightPolicy.overallScore} label="Policy" />
        <ScoreBar score={data.staffReadiness.overallScore} label="Staff Readiness" />
      </div>

      <div className="space-y-3">
        <Section title="Safeguarding Quality" defaultOpen>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <Stat label="Records" value={data.safeguardingOversightQuality.totalRecords} />
            <Stat label="Risk Assessed" value={`${data.safeguardingOversightQuality.riskAssessmentCompletedRate}%`} />
            <Stat label="DSL Informed" value={`${data.safeguardingOversightQuality.safeguardingLeadInformedRate}%`} />
            <Stat label="Multi-Agency" value={`${data.safeguardingOversightQuality.multiAgencyEngagedRate}%`} />
            <Stat label="Child Voice" value={`${data.safeguardingOversightQuality.childViewCapturedRate}%`} />
          </div>
        </Section>

        <Section title="Compliance">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <Stat label="Documentation" value={`${data.safeguardingOversightCompliance.documentationCompleteRate}%`} />
            <Stat label="Timely Recording" value={`${data.safeguardingOversightCompliance.timelyRecordingRate}%`} />
            <Stat label="Risk Assessment" value={`${data.safeguardingOversightCompliance.riskAssessmentCompletedRate}%`} />
            <Stat label="Categories" value={`${data.safeguardingOversightCompliance.uniqueCategories}/8`} />
            <Stat label="Diversity Ratio" value={data.safeguardingOversightCompliance.categoryDiversityRatio} />
          </div>
        </Section>

        <Section title="Policy Framework">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <Stat label="Safeguarding" value={data.safeguardingOversightPolicy.safeguardingPolicy ? "Yes" : "No"} warn={!data.safeguardingOversightPolicy.safeguardingPolicy} />
            <Stat label="Safer Recruitment" value={data.safeguardingOversightPolicy.saferRecruitmentPolicy ? "Yes" : "No"} warn={!data.safeguardingOversightPolicy.saferRecruitmentPolicy} />
            <Stat label="Whistleblowing" value={data.safeguardingOversightPolicy.whistleblowingPolicy ? "Yes" : "No"} warn={!data.safeguardingOversightPolicy.whistleblowingPolicy} />
            <Stat label="Allegations" value={data.safeguardingOversightPolicy.allegationsManagementPolicy ? "Yes" : "No"} warn={!data.safeguardingOversightPolicy.allegationsManagementPolicy} />
            <Stat label="Online Safety" value={data.safeguardingOversightPolicy.onlineSafetyPolicy ? "Yes" : "No"} warn={!data.safeguardingOversightPolicy.onlineSafetyPolicy} />
            <Stat label="Body Map" value={data.safeguardingOversightPolicy.bodyMapProtocol ? "Yes" : "No"} warn={!data.safeguardingOversightPolicy.bodyMapProtocol} />
            <Stat label="Supervision" value={data.safeguardingOversightPolicy.safeguardingSupervisionPolicy ? "Yes" : "No"} warn={!data.safeguardingOversightPolicy.safeguardingSupervisionPolicy} />
          </div>
        </Section>

        <Section title="Staff Readiness">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <Stat label="Staff Count" value={data.staffReadiness.totalStaff} />
            <Stat label="Awareness" value={`${data.staffReadiness.safeguardingAwarenessRate}%`} />
            <Stat label="Recognising Signs" value={`${data.staffReadiness.recognisingSignsRate}%`} />
            <Stat label="Referral Procedures" value={`${data.staffReadiness.referralProceduresRate}%`} />
            <Stat label="Record Keeping" value={`${data.staffReadiness.recordKeepingSkillsRate}%`} />
            <Stat label="Multi-Agency" value={`${data.staffReadiness.multiAgencyWorkingRate}%`} />
            <Stat label="Online Safety" value={`${data.staffReadiness.onlineSafetyKnowledgeRate}%`} />
          </div>
        </Section>

        {data.childProfiles.length > 0 && (
          <Section title="Child Profiles">
            <div className="space-y-3">
              {data.childProfiles.map((child) => (
                <div key={child.childId} className="border border-gray-100 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{child.childName}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${child.overallScore >= 7 ? "bg-green-100 text-green-700" : child.overallScore >= 4 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                      {child.overallScore}/10
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div>Records: <span className="font-medium">{child.totalRecords}</span></div>
                    <div>Risk Assessed: <span className="font-medium">{child.riskAssessmentCompletedRate}%</span></div>
                    <div>DSL Informed: <span className="font-medium">{child.safeguardingLeadInformedRate}%</span></div>
                    <div>Categories: <span className="font-medium">{child.categoriesCovered.length}</span></div>
                  </div>
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
                  <li key={i} className={a.startsWith("URGENT") ? "text-red-700 font-medium" : a.startsWith("HIGH") ? "text-amber-700 font-medium" : ""}>
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

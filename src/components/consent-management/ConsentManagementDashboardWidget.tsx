"use client";

import { useState, useEffect } from "react";

// ── Inline types (mirrors engine output) ────────────────────────────────────

interface ConsentQualityResult {
  obtainedRate: number;
  childViewsRate: number;
  documentedRate: number;
  expiryTrackedRate: number;
  overallScore: number;
}

interface ConsentComplianceResult {
  parentConsultedRate: number;
  staffRecordedRate: number;
  reviewScheduledRate: number;
  categoryDiversityRatio: number;
  overallScore: number;
}

interface ConsentPolicyResult {
  consentFramework: boolean;
  informedConsentGuidance: boolean;
  capacityAssessmentProtocol: boolean;
  gillikCompetenceProcess: boolean;
  consentRefusalProcess: boolean;
  dataConsentProtocol: boolean;
  regularReview: boolean;
  overallScore: number;
}

interface StaffConsentReadinessResult {
  consentLawRate: number;
  capacityAssessmentRate: number;
  gillikCompetenceRate: number;
  documentationSkillsRate: number;
  childParticipationRate: number;
  escalationProcessRate: number;
  overallScore: number;
}

interface ChildConsentProfile {
  childId: string;
  childName: string;
  totalRecords: number;
  obtainedRate: number;
  childViewsRate: number;
  uniqueCategories: number;
  overallScore: number;
}

interface ConsentManagementData {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: string;
  consentQuality: ConsentQualityResult;
  consentCompliance: ConsentComplianceResult;
  consentPolicy: ConsentPolicyResult;
  staffReadiness: StaffConsentReadinessResult;
  childProfiles: ChildConsentProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
  meta: { generatedAt: string; engine: string; version: string };
}

// ── Inline components ───────────────────────────────────────────────────────

function ScoreBar({ score, maxScore, label }: { score: number; maxScore: number; label: string }) {
  const pctVal = maxScore > 0 ? (score / maxScore) * 100 : 0;
  const color =
    pctVal >= 80 ? "bg-green-500" : pctVal >= 60 ? "bg-blue-500" : pctVal >= 40 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 w-48 shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2.5">
        <div className={`h-2.5 rounded-full ${color}`} style={{ width: `${Math.min(pctVal, 100)}%` }} />
      </div>
      <span className="text-sm font-medium w-16 text-right">
        {score}/{maxScore}
      </span>
    </div>
  );
}

function Section({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <span className="font-medium text-gray-900">{title}</span>
        <span className="text-gray-400">{open ? "▲" : "▼"}</span>
      </button>
      {open && <div className="p-4 space-y-3">{children}</div>}
    </div>
  );
}

function Stat({ label, value, warn }: { label: string; value: string | number; warn?: boolean }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 text-center">
      <div className={`text-2xl font-bold ${warn ? "text-red-600" : "text-gray-900"}`}>{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );
}

// ── Rating helpers ──────────────────────────────────────────────────────────

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

// ── Main widget ─────────────────────────────────────────────────────────────

export default function ConsentManagementDashboardWidget() {
  const [data, setData] = useState<ConsentManagementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/consent-management")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json) => setData(json.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // ── Loading skeleton ──
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-2/3" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded" />
            ))}
          </div>
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-4 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Error state ──
  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
        <h3 className="text-lg font-semibold text-red-800">Consent Management</h3>
        <p className="text-red-600 mt-2">Failed to load: {error}</p>
      </div>
    );
  }

  // ── Null guard ──
  if (!data) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Consent Management</h3>
          <p className="text-sm text-gray-500 mt-1">
            {data.periodStart} to {data.periodEnd}
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-gray-900">{data.overallScore}</div>
          <span
            className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${ratingColors[data.rating] || ""}`}
          >
            {ratingLabels[data.rating] || data.rating}
          </span>
        </div>
      </div>

      {/* Evaluator Score Bars */}
      <div className="space-y-2">
        <ScoreBar score={data.consentQuality.overallScore} maxScore={25} label="Consent Quality" />
        <ScoreBar score={data.consentCompliance.overallScore} maxScore={25} label="Consent Compliance" />
        <ScoreBar score={data.consentPolicy.overallScore} maxScore={25} label="Consent Policy" />
        <ScoreBar score={data.staffReadiness.overallScore} maxScore={25} label="Staff Readiness" />
      </div>

      {/* Sections */}
      <div className="space-y-3">
        {/* Consent Quality */}
        <Section title="Consent Quality">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label="Obtained Rate" value={`${data.consentQuality.obtainedRate}%`} />
            <Stat label="Child Views Sought" value={`${data.consentQuality.childViewsRate}%`} />
            <Stat label="Documented" value={`${data.consentQuality.documentedRate}%`} />
            <Stat label="Expiry Tracked" value={`${data.consentQuality.expiryTrackedRate}%`} />
          </div>
        </Section>

        {/* Consent Compliance */}
        <Section title="Consent Compliance">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label="Parent Consulted" value={`${data.consentCompliance.parentConsultedRate}%`} />
            <Stat label="Staff Recorded" value={`${data.consentCompliance.staffRecordedRate}%`} />
            <Stat label="Review Scheduled" value={`${data.consentCompliance.reviewScheduledRate}%`} />
            <Stat label="Category Diversity" value={data.consentCompliance.categoryDiversityRatio} />
          </div>
        </Section>

        {/* Consent Policy */}
        <Section title="Consent Policy">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            {[
              { label: "Consent Framework", ok: data.consentPolicy.consentFramework },
              { label: "Informed Consent Guidance", ok: data.consentPolicy.informedConsentGuidance },
              { label: "Capacity Assessment Protocol", ok: data.consentPolicy.capacityAssessmentProtocol },
              { label: "Gillick Competence Process", ok: data.consentPolicy.gillikCompetenceProcess },
              { label: "Consent Refusal Process", ok: data.consentPolicy.consentRefusalProcess },
              { label: "Data Consent Protocol", ok: data.consentPolicy.dataConsentProtocol },
              { label: "Regular Review", ok: data.consentPolicy.regularReview },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <span className={item.ok ? "text-green-600" : "text-red-500"}>
                  {item.ok ? "Y" : "N"}
                </span>
                <span className="text-gray-700">{item.label}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* Staff Readiness */}
        <Section title="Staff Readiness">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Stat label="Consent Law" value={`${data.staffReadiness.consentLawRate}%`} />
            <Stat label="Capacity Assessment" value={`${data.staffReadiness.capacityAssessmentRate}%`} />
            <Stat label="Gillick Competence" value={`${data.staffReadiness.gillikCompetenceRate}%`} />
            <Stat label="Documentation Skills" value={`${data.staffReadiness.documentationSkillsRate}%`} />
            <Stat label="Child Participation" value={`${data.staffReadiness.childParticipationRate}%`} />
            <Stat label="Escalation Process" value={`${data.staffReadiness.escalationProcessRate}%`} />
          </div>
        </Section>

        {/* Child Profiles */}
        <Section title="Child Consent Profiles" defaultOpen>
          <div className="space-y-3">
            {data.childProfiles.map((child) => (
              <div key={child.childId} className="border border-gray-100 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{child.childName}</span>
                  <span className="text-sm text-gray-500">{child.overallScore}/10</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-600">
                  <div>
                    Records: <span className="font-medium">{child.totalRecords}</span>
                  </div>
                  <div>
                    Obtained: <span className="font-medium">{child.obtainedRate}%</span>
                  </div>
                  <div>
                    Child Views: <span className="font-medium">{child.childViewsRate}%</span>
                  </div>
                  <div>
                    Categories: <span className="font-medium">{child.uniqueCategories}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Strengths */}
        {data.strengths.length > 0 && (
          <Section title="Strengths">
            <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
              {data.strengths.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </Section>
        )}

        {/* Areas for Improvement */}
        {data.areasForImprovement.length > 0 && (
          <Section title="Areas for Improvement">
            <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
              {data.areasForImprovement.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          </Section>
        )}

        {/* Actions */}
        {data.actions.length > 0 && (
          <Section title="Recommended Actions">
            <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
              {data.actions.map((a, i) => (
                <li key={i} className={a.startsWith("URGENT") ? "text-red-700 font-medium" : ""}>
                  {a}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Regulatory Links */}
        <Section title="Regulatory Framework">
          <ul className="text-sm text-gray-600 space-y-1">
            {data.regulatoryLinks.map((link, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5 shrink-0">S</span>
                <span>{link}</span>
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </div>
  );
}

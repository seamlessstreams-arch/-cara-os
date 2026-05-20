"use client";

import { useState, useEffect } from "react";

// ── Local Interfaces (mirrors API shape) ──────────────────────────────────

interface AfterCareSupportQualityResult {
  overallScore: number;
  totalSessions: number;
  engagementRate: number;
  needsAssessedRate: number;
  goalsSetRate: number;
  progressRate: number;
}

interface AfterCareSupportComplianceResult {
  overallScore: number;
  documentedRate: number;
  staffSupportedRate: number;
  feedbackRate: number;
  supportTypeDiversityRatio: number;
}

interface AfterCareSupportPolicyResult {
  overallScore: number;
  leavingCareStrategy: boolean;
  pathwayPlanFramework: boolean;
  housingProtocol: boolean;
  educationEmploymentPlan: boolean;
  healthAndWellbeingContinuity: boolean;
  financialSupportGuidance: boolean;
  regularReview: boolean;
}

interface StaffAfterCareReadinessResult {
  overallScore: number;
  totalStaff: number;
  leavingCareKnowledgeRate: number;
  pathwayPlanningRate: number;
  housingAdviceRate: number;
  employmentSupportRate: number;
  benefitsAndFinanceRate: number;
  emotionalResilienceRate: number;
}

interface ChildAfterCareProfile {
  childId: string;
  childName: string;
  totalSessions: number;
  engagementRate: number;
  goalsRate: number;
  overallScore: number;
}

interface AfterCareSupportQualityData {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: string;
  afterCareSupportQuality: AfterCareSupportQualityResult;
  afterCareSupportCompliance: AfterCareSupportComplianceResult;
  afterCareSupportPolicy: AfterCareSupportPolicyResult;
  staffAfterCareReadiness: StaffAfterCareReadinessResult;
  childProfiles: ChildAfterCareProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
  meta?: {
    supportTypeLabels: Record<string, string>;
    engagementLevelLabels: Record<string, string>;
    ratingLabels: Record<string, string>;
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────

function ratingColour(r: string): string {
  if (r === "outstanding") return "bg-green-100 text-green-800 border-green-300";
  if (r === "good") return "bg-blue-100 text-blue-800 border-blue-300";
  if (r === "requires_improvement") return "bg-amber-100 text-amber-800 border-amber-300";
  return "bg-red-100 text-red-800 border-red-300";
}

function ratingLabel(r: string): string {
  if (r === "outstanding") return "Outstanding";
  if (r === "good") return "Good";
  if (r === "requires_improvement") return "Requires Improvement";
  return "Inadequate";
}

function boolBadge(v: boolean): React.ReactNode {
  return v ? (
    <span className="inline-block px-2 py-0.5 text-xs font-medium rounded bg-green-100 text-green-700">Yes</span>
  ) : (
    <span className="inline-block px-2 py-0.5 text-xs font-medium rounded bg-red-100 text-red-600">No</span>
  );
}

// ── ScoreBar ──────────────────────────────────────────────────────────────

function ScoreBar({ score, label, maxScore = 25 }: { score: number; label: string; maxScore?: number }) {
  const pctVal = maxScore > 0 ? (score / maxScore) * 100 : 0;
  const barColour =
    pctVal >= 80 ? "bg-green-500"
      : pctVal >= 60 ? "bg-blue-500"
        : pctVal >= 40 ? "bg-amber-500"
          : "bg-red-500";

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 w-52 shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2.5">
        <div
          className={`h-2.5 rounded-full transition-all ${barColour}`}
          style={{ width: `${Math.min(pctVal, 100)}%` }}
        />
      </div>
      <span className="text-sm font-semibold w-14 text-right">{score}/{maxScore}</span>
    </div>
  );
}

// ── Section (collapsible) ────────────────────────────────────────────────

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
        <span className="text-gray-400 text-sm">{open ? "▲" : "▼"}</span>
      </button>
      {open && <div className="p-4 space-y-3">{children}</div>}
    </div>
  );
}

// ── Stat ──────────────────────────────────────────────────────────────────

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 text-center">
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );
}

// ── Main Widget ──────────────────────────────────────────────────────────

export default function AfterCareSupportQualityDashboardWidget() {
  const [data, setData] = useState<AfterCareSupportQualityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/after-care-support-quality")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json) => setData(json.data))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  // Loading skeleton
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
            <div className="h-3 bg-gray-200 rounded" />
            <div className="h-3 bg-gray-200 rounded" />
            <div className="h-3 bg-gray-200 rounded" />
            <div className="h-3 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
        <h3 className="text-lg font-semibold text-red-800">After Care Support Quality</h3>
        <p className="text-sm text-red-600 mt-2">Failed to load: {error}</p>
      </div>
    );
  }

  // Null guard
  if (!data) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">After Care Support Quality</h3>
          <p className="text-sm text-gray-500 mt-1">
            {data.periodStart} to {data.periodEnd}
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-gray-900">{data.overallScore}</div>
          <span
            className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${ratingColour(data.rating)}`}
          >
            {ratingLabel(data.rating)}
          </span>
        </div>
      </div>

      {/* 4 Score Bars */}
      <div className="space-y-2">
        <ScoreBar score={data.afterCareSupportQuality.overallScore} label="Support Quality" />
        <ScoreBar score={data.afterCareSupportCompliance.overallScore} label="Support Compliance" />
        <ScoreBar score={data.afterCareSupportPolicy.overallScore} label="Support Policy" />
        <ScoreBar score={data.staffAfterCareReadiness.overallScore} label="Staff Readiness" />
      </div>

      {/* Collapsible Sections */}
      <div className="space-y-3">
        {/* Support Quality */}
        <Section title="Support Quality" defaultOpen>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label="Engagement" value={`${data.afterCareSupportQuality.engagementRate}%`} />
            <Stat label="Needs Assessed" value={`${data.afterCareSupportQuality.needsAssessedRate}%`} />
            <Stat label="Goals Set" value={`${data.afterCareSupportQuality.goalsSetRate}%`} />
            <Stat label="Progress Tracked" value={`${data.afterCareSupportQuality.progressRate}%`} />
          </div>
          <p className="text-xs text-gray-400">
            Total sessions: {data.afterCareSupportQuality.totalSessions}
          </p>
        </Section>

        {/* Support Compliance */}
        <Section title="Support Compliance">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label="Documented" value={`${data.afterCareSupportCompliance.documentedRate}%`} />
            <Stat label="Staff Supported" value={`${data.afterCareSupportCompliance.staffSupportedRate}%`} />
            <Stat label="Feedback Given" value={`${data.afterCareSupportCompliance.feedbackRate}%`} />
            <Stat label="Type Diversity" value={`${data.afterCareSupportCompliance.supportTypeDiversityRatio}%`} />
          </div>
        </Section>

        {/* Support Policy */}
        <Section title="Support Policy">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Leaving Care Strategy</span>
              {boolBadge(data.afterCareSupportPolicy.leavingCareStrategy)}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Pathway Plan Framework</span>
              {boolBadge(data.afterCareSupportPolicy.pathwayPlanFramework)}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Housing Protocol</span>
              {boolBadge(data.afterCareSupportPolicy.housingProtocol)}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Education & Employment Plan</span>
              {boolBadge(data.afterCareSupportPolicy.educationEmploymentPlan)}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Health & Wellbeing Continuity</span>
              {boolBadge(data.afterCareSupportPolicy.healthAndWellbeingContinuity)}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Financial Support Guidance</span>
              {boolBadge(data.afterCareSupportPolicy.financialSupportGuidance)}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Regular Review</span>
              {boolBadge(data.afterCareSupportPolicy.regularReview)}
            </div>
          </div>
        </Section>

        {/* Staff Readiness */}
        <Section title="Staff After Care Readiness">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <div>
              <span className="text-gray-500">Staff:</span>{" "}
              <span className="font-medium">{data.staffAfterCareReadiness.totalStaff}</span>
            </div>
            <div>
              <span className="text-gray-500">Leaving Care Knowledge:</span>{" "}
              <span className="font-medium">{data.staffAfterCareReadiness.leavingCareKnowledgeRate}%</span>
            </div>
            <div>
              <span className="text-gray-500">Pathway Planning:</span>{" "}
              <span className="font-medium">{data.staffAfterCareReadiness.pathwayPlanningRate}%</span>
            </div>
            <div>
              <span className="text-gray-500">Housing Advice:</span>{" "}
              <span className="font-medium">{data.staffAfterCareReadiness.housingAdviceRate}%</span>
            </div>
            <div>
              <span className="text-gray-500">Employment Support:</span>{" "}
              <span className="font-medium">{data.staffAfterCareReadiness.employmentSupportRate}%</span>
            </div>
            <div>
              <span className="text-gray-500">Benefits & Finance:</span>{" "}
              <span className="font-medium">{data.staffAfterCareReadiness.benefitsAndFinanceRate}%</span>
            </div>
            <div>
              <span className="text-gray-500">Emotional Resilience:</span>{" "}
              <span className="font-medium">{data.staffAfterCareReadiness.emotionalResilienceRate}%</span>
            </div>
          </div>
        </Section>

        {/* Child Profiles */}
        {data.childProfiles.length > 0 && (
          <Section title="Child After Care Profiles">
            <div className="space-y-3">
              {data.childProfiles.map((child) => (
                <div key={child.childId} className="border border-gray-100 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{child.childName}</span>
                    <span className="text-sm text-gray-500">{child.overallScore}/10</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
                    <div>
                      Sessions: <span className="font-medium">{child.totalSessions}</span>
                    </div>
                    <div>
                      Engagement: <span className="font-medium">{child.engagementRate}%</span>
                    </div>
                    <div>
                      Goals: <span className="font-medium">{child.goalsRate}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Strengths */}
        {data.strengths.length > 0 && (
          <Section title="Strengths">
            <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
              {data.strengths.map((s, i) => (
                <li key={i} className="text-green-700">{s}</li>
              ))}
            </ul>
          </Section>
        )}

        {/* Areas for Improvement */}
        {data.areasForImprovement.length > 0 && (
          <Section title="Areas for Improvement">
            <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
              {data.areasForImprovement.map((a, i) => (
                <li key={i} className="text-amber-700">{a}</li>
              ))}
            </ul>
          </Section>
        )}

        {/* Actions */}
        {data.actions.length > 0 && (
          <Section title="Recommended Actions">
            <ul className="text-sm list-disc list-inside space-y-1">
              {data.actions.map((a, i) => (
                <li
                  key={i}
                  className={
                    a.startsWith("URGENT")
                      ? "text-red-700 font-medium"
                      : a.startsWith("HIGH")
                        ? "text-amber-700 font-medium"
                        : "text-gray-600"
                  }
                >
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
                <span className="text-blue-400 mt-0.5 shrink-0">&sect;</span>
                <span>{link}</span>
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </div>
  );
}

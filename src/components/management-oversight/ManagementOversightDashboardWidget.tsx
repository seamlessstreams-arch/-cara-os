"use client";

import { useEffect, useState } from "react";

// ── Types ───────────────────────────────────────────────────────────────────

interface OversightQualityResult {
  overallScore: number;
  totalRecords: number;
  thoroughRate: number;
  actionPlanRate: number;
  followUpRate: number;
  childImpactRate: number;
  staffFeedbackRate: number;
  documentationRate: number;
}

interface OversightComplianceResult {
  overallScore: number;
  totalRecords: number;
  frequencyRate: number;
  coverageRate: number;
  timelinessRate: number;
  categoryDiversityRate: number;
}

interface OversightPolicyResult {
  overallScore: number;
  oversightFramework: boolean;
  auditSchedule: boolean;
  qualityAssurancePlan: boolean;
  incidentReviewProtocol: boolean;
  performanceMonitoring: boolean;
  regulatoryCompliancePlan: boolean;
  continuousImprovementPolicy: boolean;
}

interface StaffReadinessResult {
  overallScore: number;
  totalStaff: number;
  auditSkillsRate: number;
  qualityAssuranceRate: number;
  regulatoryAwarenessRate: number;
  leadershipRate: number;
  dataAnalysisRate: number;
  reflectivePracticeRate: number;
}

interface ChildOversightProfile {
  childId: string;
  childName: string;
  totalRecords: number;
  overallScore: number;
  frequencyScore: number;
  thoroughnessScore: number;
  followUpScore: number;
  diversityScore: number;
}

interface ManagementOversightData {
  overallScore: number;
  rating: string;
  oversightQuality: OversightQualityResult;
  compliance: OversightComplianceResult;
  policyFramework: OversightPolicyResult;
  staffReadiness: StaffReadinessResult;
  childProfiles: ChildOversightProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
  meta: {
    generatedAt: string;
    engine: string;
    version: string;
  };
}

// ── Inline Helper Components ────────────────────────────────────────────────

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

function ScoreBar({ score, label, max = 25 }: { score: number; label: string; max?: number }) {
  const pctValue = Math.round((score / max) * 100);
  const color =
    pctValue >= 80
      ? "bg-green-500"
      : pctValue >= 60
        ? "bg-blue-500"
        : pctValue >= 40
          ? "bg-amber-500"
          : "bg-red-500";
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 w-52 shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2.5">
        <div
          className={`h-2.5 rounded-full ${color}`}
          style={{ width: `${Math.min(pctValue, 100)}%` }}
        />
      </div>
      <span className="text-sm font-medium w-14 text-right">
        {score}/{max}
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

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}

// ── Main Widget ─────────────────────────────────────────────────────────────

export default function ManagementOversightDashboardWidget() {
  const [data, setData] = useState<ManagementOversightData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/management-oversight")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json) => setData(json.data))
      .catch((err) => setError(err.message))
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
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
        <h3 className="text-lg font-semibold text-red-800">
          Management Oversight Intelligence
        </h3>
        <p className="text-sm text-red-600 mt-2">
          Failed to load management oversight data: {error}
        </p>
      </div>
    );
  }

  // Null guard
  if (!data) return null;

  const {
    overallScore,
    rating,
    oversightQuality,
    compliance,
    policyFramework,
    staffReadiness,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  } = data;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
      {/* Header + Rating Badge */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Management Oversight Intelligence
          </h3>
          <p className="text-sm text-gray-500 mt-0.5">
            Leadership, monitoring, auditing and governance quality
          </p>
        </div>
        <div className="text-right flex flex-col items-end gap-1">
          <span className="text-3xl font-bold text-gray-900">{overallScore}</span>
          <span
            className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${ratingColors[rating] || "bg-gray-100 text-gray-700 border-gray-300"}`}
          >
            {ratingLabels[rating] || rating}
          </span>
        </div>
      </div>

      {/* 4 Score Bars */}
      <div className="space-y-2">
        <ScoreBar score={oversightQuality.overallScore} label="Oversight Quality" />
        <ScoreBar score={compliance.overallScore} label="Compliance" />
        <ScoreBar score={policyFramework.overallScore} label="Policy Framework" />
        <ScoreBar score={staffReadiness.overallScore} label="Staff Readiness" />
      </div>

      {/* Oversight Quality Section */}
      <Section title="Oversight Quality" defaultOpen>
        <Stat label="Total Records" value={oversightQuality.totalRecords} />
        <Stat label="Thorough Rate" value={`${oversightQuality.thoroughRate}%`} />
        <Stat label="Action Plan Rate" value={`${oversightQuality.actionPlanRate}%`} />
        <Stat label="Follow-Up Rate" value={`${oversightQuality.followUpRate}%`} />
        <Stat label="Child Impact Assessed" value={`${oversightQuality.childImpactRate}%`} />
        <Stat label="Staff Feedback Given" value={`${oversightQuality.staffFeedbackRate}%`} />
        <Stat label="Documentation Rate" value={`${oversightQuality.documentationRate}%`} />
      </Section>

      {/* Compliance Section */}
      <Section title="Compliance">
        <Stat label="Frequency Rate" value={`${compliance.frequencyRate}%`} />
        <Stat label="Coverage Rate" value={`${compliance.coverageRate}%`} />
        <Stat label="Timeliness Rate" value={`${compliance.timelinessRate}%`} />
        <Stat label="Category Diversity" value={`${compliance.categoryDiversityRate}%`} />
      </Section>

      {/* Policy Framework Section */}
      <Section title="Policy Framework">
        <Stat label="Oversight Framework" value={policyFramework.oversightFramework ? "Yes" : "No"} />
        <Stat label="Audit Schedule" value={policyFramework.auditSchedule ? "Yes" : "No"} />
        <Stat label="Quality Assurance Plan" value={policyFramework.qualityAssurancePlan ? "Yes" : "No"} />
        <Stat label="Incident Review Protocol" value={policyFramework.incidentReviewProtocol ? "Yes" : "No"} />
        <Stat label="Performance Monitoring" value={policyFramework.performanceMonitoring ? "Yes" : "No"} />
        <Stat label="Regulatory Compliance Plan" value={policyFramework.regulatoryCompliancePlan ? "Yes" : "No"} />
        <Stat label="Continuous Improvement" value={policyFramework.continuousImprovementPolicy ? "Yes" : "No"} />
      </Section>

      {/* Staff Readiness Section */}
      <Section title="Staff Readiness">
        <Stat label="Total Staff" value={staffReadiness.totalStaff} />
        <Stat label="Audit Skills" value={`${staffReadiness.auditSkillsRate}%`} />
        <Stat label="QA Knowledge" value={`${staffReadiness.qualityAssuranceRate}%`} />
        <Stat label="Regulatory Awareness" value={`${staffReadiness.regulatoryAwarenessRate}%`} />
        <Stat label="Leadership Capability" value={`${staffReadiness.leadershipRate}%`} />
        <Stat label="Data Analysis" value={`${staffReadiness.dataAnalysisRate}%`} />
        <Stat label="Reflective Practice" value={`${staffReadiness.reflectivePracticeRate}%`} />
      </Section>

      {/* Child Profiles Section */}
      {childProfiles.length > 0 && (
        <Section title="Child Oversight Profiles">
          <div className="space-y-3">
            {childProfiles.map((cp) => (
              <div
                key={cp.childId}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{cp.childName}</p>
                  <p className="text-xs text-gray-500">
                    {cp.totalRecords} record{cp.totalRecords !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">{cp.overallScore}/10</p>
                  <p className="text-xs text-gray-400">
                    F:{cp.frequencyScore} T:{cp.thoroughnessScore} U:{cp.followUpScore} D:{cp.diversityScore}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Strengths */}
      <Section title="Strengths">
        <ul className="space-y-1">
          {strengths.map((s, i) => (
            <li key={i} className="text-sm text-green-700 flex items-start gap-2">
              <span className="mt-0.5 shrink-0">+</span>
              <span>{s}</span>
            </li>
          ))}
        </ul>
      </Section>

      {/* Areas for Improvement */}
      <Section title="Areas for Improvement">
        <ul className="space-y-1">
          {areasForImprovement.map((a, i) => (
            <li key={i} className="text-sm text-amber-700 flex items-start gap-2">
              <span className="mt-0.5 shrink-0">-</span>
              <span>{a}</span>
            </li>
          ))}
        </ul>
      </Section>

      {/* Actions */}
      <Section title="Actions">
        <ul className="space-y-1">
          {actions.map((a, i) => (
            <li key={i} className="text-sm text-red-700 flex items-start gap-2">
              <span className="mt-0.5 shrink-0">!</span>
              <span>{a}</span>
            </li>
          ))}
        </ul>
      </Section>

      {/* Regulatory Links */}
      <Section title="Regulatory Links">
        <ul className="space-y-1">
          {regulatoryLinks.map((link, i) => (
            <li key={i} className="text-sm text-gray-600">
              {link}
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}

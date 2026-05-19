"use client";

// ══════════════════════════════════════════════════════════════════════════════
// PROFESSIONAL BOUNDARY COMPLIANCE DASHBOARD WIDGET
//
// Displays the 4-layer professional boundary compliance intelligence:
// - Overall score with rating
// - Layer scores: boundary compliance, child safeguarding, policy, staff readiness
// - Staff boundary profiles
// - Strengths, areas for improvement, and actions
// - Regulatory references
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";

// ── Local interfaces (mirrors API shape) ──────────────────────────────────

interface BoundaryComplianceData {
  totalAudits: number;
  complianceRate: number;
  supervisorVerifiedRate: number;
  documentedRate: number;
  correctiveActionRate: number;
  reflectivePracticeRate: number;
  areaBreakdown: Record<string, number>;
  complianceLevelBreakdown: Record<string, number>;
  score: number;
}

interface ChildSafeguardingData {
  totalAudits: number;
  childFeedbackSoughtRate: number;
  riskAssessedRate: number;
  nonComplianceRate: number;
  score: number;
}

interface BoundaryPolicyData {
  boundaryFramework: boolean;
  socialMediaPolicy: boolean;
  giftGivingGuidance: boolean;
  physicalContactPolicy: boolean;
  whistleblowingProcedure: boolean;
  confidentialityProtocol: boolean;
  regularReview: boolean;
  score: number;
}

interface StaffBoundaryReadinessData {
  totalStaff: number;
  professionalBoundariesRate: number;
  safeguardingAwarenessRate: number;
  ethicalConductRate: number;
  socialMediaSafetyRate: number;
  reportingProceduresRate: number;
  reflectivePracticeRate: number;
  score: number;
}

interface StaffProfileData {
  staffId: string;
  staffName: string;
  totalAudits: number;
  complianceRate: number;
  documentedRate: number;
  supervisorVerifiedRate: number;
  boundaryScore: number;
}

interface ProfessionalBoundaryData {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: string;
  boundaryCompliance: BoundaryComplianceData;
  childSafeguarding: ChildSafeguardingData;
  boundaryPolicy: BoundaryPolicyData;
  staffBoundaryReadiness: StaffBoundaryReadinessData;
  staffProfiles: StaffProfileData[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
  meta?: {
    auditSummary: { id: string; staffName: string; date: string; area: string; compliance: string }[];
    ratingLabel: string;
  };
}

// ── ScoreBar Component ────────────────────────────────────────────────────

function ScoreBar({ label, score, max = 25 }: { label: string; score: number; max?: number }) {
  const pctVal = Math.round((score / max) * 100);
  const fillColor =
    pctVal >= 80
      ? "bg-green-500"
      : pctVal >= 60
        ? "bg-blue-500"
        : pctVal >= 40
          ? "bg-orange-500"
          : "bg-red-500";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-700">{label}</span>
        <span className="text-xs font-bold text-gray-900">
          {score}/{max}
        </span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${fillColor}`}
          style={{ width: `${pctVal}%` }}
        />
      </div>
    </div>
  );
}

// ── Section Component (collapsible) ───────────────────────────────────────

function Section({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <span className="text-sm font-semibold text-gray-800">{title}</span>
        <span className="text-xs text-gray-500">{open ? "Hide" : "Show"}</span>
      </button>
      {open && <div className="p-4 space-y-3">{children}</div>}
    </div>
  );
}

// ── Stat Component ────────────────────────────────────────────────────────

function Stat({ label, value, suffix = "" }: { label: string; value: string | number; suffix?: string }) {
  return (
    <div className="text-center p-2 bg-gray-50 rounded-lg">
      <div className="text-lg font-bold text-gray-800">
        {value}
        {suffix && <span className="text-sm font-normal text-gray-500">{suffix}</span>}
      </div>
      <div className="text-[10px] font-medium text-gray-500 uppercase mt-0.5">{label}</div>
    </div>
  );
}

// ── Rating Badge ──────────────────────────────────────────────────────────

function RatingBadge({ score, rating }: { score: number; rating: string }) {
  const colorClass =
    rating === "outstanding"
      ? "bg-green-100 text-green-800 border-green-300"
      : rating === "good"
        ? "bg-blue-100 text-blue-800 border-blue-300"
        : rating === "requires_improvement"
          ? "bg-orange-100 text-orange-800 border-orange-300"
          : "bg-red-100 text-red-800 border-red-300";

  const label =
    rating === "outstanding"
      ? "Outstanding"
      : rating === "good"
        ? "Good"
        : rating === "requires_improvement"
          ? "Requires Improvement"
          : "Inadequate";

  return (
    <div className={`rounded-lg border px-4 py-3 text-center ${colorClass}`}>
      <div className="text-3xl font-bold">{score}</div>
      <div className="text-sm font-medium mt-1">{label}</div>
    </div>
  );
}

// ── Staff Profile Row ─────────────────────────────────────────────────────

function StaffProfileRow({ profile }: { profile: StaffProfileData }) {
  const scoreColor =
    profile.boundaryScore >= 8
      ? "bg-green-100 text-green-700"
      : profile.boundaryScore >= 5
        ? "bg-yellow-100 text-yellow-700"
        : "bg-red-100 text-red-700";

  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <div className="flex-1 min-w-0">
        <span className="font-medium text-sm truncate">{profile.staffName}</span>
        <div className="flex gap-3 text-[10px] text-gray-400 mt-0.5">
          <span>Audits: {profile.totalAudits}</span>
          <span>Compliance: {profile.complianceRate}%</span>
          <span>Documented: {profile.documentedRate}%</span>
          <span>Verified: {profile.supervisorVerifiedRate}%</span>
        </div>
      </div>
      <span className={`text-xs font-medium px-2 py-0.5 rounded shrink-0 ${scoreColor}`}>
        {profile.boundaryScore}/10
      </span>
    </div>
  );
}

// ── Policy Item ───────────────────────────────────────────────────────────

function PolicyItem({ label, value }: { label: string; value: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
      <span className="text-xs text-gray-700">{label}</span>
      <span
        className={`text-xs font-medium px-2 py-0.5 rounded ${
          value ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
        }`}
      >
        {value ? "Yes" : "No"}
      </span>
    </div>
  );
}

// ── Compliance Gauge ──────────────────────────────────────────────────────

function ComplianceGauge({ label, value }: { label: string; value: number }) {
  const color =
    value >= 90
      ? "text-green-700 bg-green-100"
      : value >= 70
        ? "text-yellow-700 bg-yellow-100"
        : "text-red-700 bg-red-100";

  return (
    <div className={`rounded-lg p-2.5 text-center ${color}`}>
      <div className="text-xl font-bold">{value}%</div>
      <div className="text-[10px] font-medium mt-0.5">{label}</div>
    </div>
  );
}

// ── Main Widget ───────────────────────────────────────────────────────────

export default function ProfessionalBoundaryComplianceDashboardWidget() {
  const [data, setData] = useState<ProfessionalBoundaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/professional-boundary-compliance");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setData(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="h-20 bg-gray-100 rounded mb-3" />
        <div className="h-8 bg-gray-100 rounded mb-2" />
        <div className="h-8 bg-gray-100 rounded mb-2" />
        <div className="h-8 bg-gray-100 rounded mb-2" />
        <div className="h-8 bg-gray-100 rounded" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white border border-red-200 rounded-xl p-6">
        <h3 className="font-semibold text-red-800">Professional Boundary Compliance</h3>
        <p className="text-sm text-red-600 mt-1">{error ?? "No data available"}</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900 text-lg">
            Professional Boundary Compliance
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {data.periodStart} to {data.periodEnd} | {data.boundaryCompliance.totalAudits} audits | {data.staffBoundaryReadiness.totalStaff} staff
          </p>
        </div>
        <RatingBadge score={data.overallScore} rating={data.rating} />
      </div>

      {/* 4 Score Bars */}
      <div className="space-y-2">
        <ScoreBar label="Boundary Compliance" score={data.boundaryCompliance.score} />
        <ScoreBar label="Child Safeguarding" score={data.childSafeguarding.score} />
        <ScoreBar label="Boundary Policy" score={data.boundaryPolicy.score} />
        <ScoreBar label="Staff Readiness" score={data.staffBoundaryReadiness.score} />
      </div>

      {/* Urgent Actions */}
      {data.actions.length > 0 &&
        data.actions.some((a) => a.startsWith("URGENT")) && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <h4 className="text-sm font-semibold text-red-800 mb-2">Urgent Actions</h4>
            <ul className="space-y-1">
              {data.actions
                .filter((a) => a.startsWith("URGENT"))
                .map((action, i) => (
                  <li key={i} className="text-xs text-red-700 flex items-start gap-1.5">
                    <span className="mt-0.5 shrink-0">●</span>
                    <span>{action}</span>
                  </li>
                ))}
            </ul>
          </div>
        )}

      {/* Boundary Compliance Details */}
      <Section title="Boundary Compliance Details">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          <ComplianceGauge label="Compliance Rate" value={data.boundaryCompliance.complianceRate} />
          <ComplianceGauge label="Supervisor Verified" value={data.boundaryCompliance.supervisorVerifiedRate} />
          <ComplianceGauge label="Documented" value={data.boundaryCompliance.documentedRate} />
          <ComplianceGauge label="Corrective Action" value={data.boundaryCompliance.correctiveActionRate} />
          <ComplianceGauge label="Reflective Practice" value={data.boundaryCompliance.reflectivePracticeRate} />
          <Stat label="Total Audits" value={data.boundaryCompliance.totalAudits} />
        </div>
      </Section>

      {/* Child Safeguarding Details */}
      <Section title="Child Safeguarding Details">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          <ComplianceGauge label="Child Feedback" value={data.childSafeguarding.childFeedbackSoughtRate} />
          <ComplianceGauge label="Risk Assessed" value={data.childSafeguarding.riskAssessedRate} />
          <ComplianceGauge label="Non-Compliance" value={data.childSafeguarding.nonComplianceRate} />
        </div>
      </Section>

      {/* Boundary Policy Details */}
      <Section title="Boundary Policy Details">
        <PolicyItem label="Boundary Framework" value={data.boundaryPolicy.boundaryFramework} />
        <PolicyItem label="Social Media Policy" value={data.boundaryPolicy.socialMediaPolicy} />
        <PolicyItem label="Gift Giving Guidance" value={data.boundaryPolicy.giftGivingGuidance} />
        <PolicyItem label="Physical Contact Policy" value={data.boundaryPolicy.physicalContactPolicy} />
        <PolicyItem label="Whistleblowing Procedure" value={data.boundaryPolicy.whistleblowingProcedure} />
        <PolicyItem label="Confidentiality Protocol" value={data.boundaryPolicy.confidentialityProtocol} />
        <PolicyItem label="Regular Review" value={data.boundaryPolicy.regularReview} />
      </Section>

      {/* Staff Readiness Details */}
      <Section title="Staff Boundary Readiness">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          <ComplianceGauge label="Prof. Boundaries" value={data.staffBoundaryReadiness.professionalBoundariesRate} />
          <ComplianceGauge label="Safeguarding" value={data.staffBoundaryReadiness.safeguardingAwarenessRate} />
          <ComplianceGauge label="Ethical Conduct" value={data.staffBoundaryReadiness.ethicalConductRate} />
          <ComplianceGauge label="Social Media" value={data.staffBoundaryReadiness.socialMediaSafetyRate} />
          <ComplianceGauge label="Reporting" value={data.staffBoundaryReadiness.reportingProceduresRate} />
          <ComplianceGauge label="Reflective Practice" value={data.staffBoundaryReadiness.reflectivePracticeRate} />
        </div>
        <Stat label="Total Staff" value={data.staffBoundaryReadiness.totalStaff} />
      </Section>

      {/* Staff Boundary Profiles */}
      {data.staffProfiles.length > 0 && (
        <Section title="Staff Boundary Profiles">
          <div className="bg-gray-50 rounded-lg p-3">
            {data.staffProfiles.map((profile) => (
              <StaffProfileRow key={profile.staffId} profile={profile} />
            ))}
          </div>
        </Section>
      )}

      {/* Strengths */}
      {data.strengths.length > 0 && (
        <Section title="Strengths" defaultOpen>
          <ul className="space-y-1">
            {data.strengths.map((s, i) => (
              <li key={i} className="text-xs text-green-700">+ {s}</li>
            ))}
          </ul>
        </Section>
      )}

      {/* Areas for Improvement */}
      {data.areasForImprovement.length > 0 && (
        <Section title="Areas for Improvement" defaultOpen>
          <ul className="space-y-1">
            {data.areasForImprovement.map((a, i) => (
              <li key={i} className="text-xs text-orange-700">- {a}</li>
            ))}
          </ul>
        </Section>
      )}

      {/* All Actions */}
      {data.actions.length > 0 && (
        <Section title="Actions">
          <ul className="space-y-1">
            {data.actions.map((action, i) => (
              <li key={i} className="text-xs text-gray-700 flex items-start gap-1.5">
                <span className="mt-0.5 shrink-0">
                  {action.startsWith("URGENT") ? "●" : action.startsWith("HIGH") ? "○" : "▪"}
                </span>
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Regulatory Links */}
      {data.regulatoryLinks.length > 0 && (
        <Section title="Regulatory References">
          <ul className="space-y-1">
            {data.regulatoryLinks.map((link, i) => (
              <li key={i} className="text-xs text-gray-600">{link}</li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}

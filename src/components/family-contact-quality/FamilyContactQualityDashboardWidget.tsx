"use client";

import { useState, useEffect } from "react";

// ── Local Interfaces (mirrors API shape) ──────────────────────────────────

interface FamilyContactQualityResult {
  overallScore: number;
  totalContacts: number;
  positiveOutcomeRate: number;
  childPreparedRate: number;
  childConsultedRate: number;
  supportRate: number;
}

interface FamilyContactComplianceResult {
  overallScore: number;
  documentedRate: number;
  staffSupervisedRate: number;
  feedbackRate: number;
  contactTypeDiversityRatio: number;
}

interface FamilyContactPolicyResult {
  overallScore: number;
  contactPromotionStrategy: boolean;
  safeguardingProtocol: boolean;
  supervisedContactProcedure: boolean;
  letteringAndPhonePolicy: boolean;
  siblingContactFramework: boolean;
  familyEngagementPlan: boolean;
  regularReview: boolean;
}

interface StaffFamilyContactReadinessResult {
  overallScore: number;
  totalStaff: number;
  familyDynamicsAwarenessRate: number;
  contactSupervisionRate: number;
  safeguardingInContactRate: number;
  childPreparationSkillsRate: number;
  conflictManagementRate: number;
  recordKeepingRate: number;
}

interface ChildFamilyContactProfile {
  childId: string;
  childName: string;
  totalContacts: number;
  positiveOutcomeRate: number;
  preparedRate: number;
  overallScore: number;
}

interface FamilyContactQualityData {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: string;
  familyContactQuality: FamilyContactQualityResult;
  familyContactCompliance: FamilyContactComplianceResult;
  familyContactPolicy: FamilyContactPolicyResult;
  staffFamilyContactReadiness: StaffFamilyContactReadinessResult;
  childProfiles: ChildFamilyContactProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
  meta?: {
    contactTypeLabels: Record<string, string>;
    contactOutcomeLabels: Record<string, string>;
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

export default function FamilyContactQualityDashboardWidget() {
  const [data, setData] = useState<FamilyContactQualityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/family-contact-quality")
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
        <h3 className="text-lg font-semibold text-red-800">Family Contact Quality</h3>
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
          <h3 className="text-lg font-semibold text-gray-900">Family Contact Quality</h3>
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
        <ScoreBar score={data.familyContactQuality.overallScore} label="Contact Quality" />
        <ScoreBar score={data.familyContactCompliance.overallScore} label="Contact Compliance" />
        <ScoreBar score={data.familyContactPolicy.overallScore} label="Contact Policy" />
        <ScoreBar score={data.staffFamilyContactReadiness.overallScore} label="Staff Readiness" />
      </div>

      {/* Collapsible Sections */}
      <div className="space-y-3">
        {/* Contact Quality */}
        <Section title="Contact Quality" defaultOpen>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label="Positive Outcomes" value={`${data.familyContactQuality.positiveOutcomeRate}%`} />
            <Stat label="Children Prepared" value={`${data.familyContactQuality.childPreparedRate}%`} />
            <Stat label="Children Consulted" value={`${data.familyContactQuality.childConsultedRate}%`} />
            <Stat label="Support Provided" value={`${data.familyContactQuality.supportRate}%`} />
          </div>
          <p className="text-xs text-gray-400">
            Total contacts: {data.familyContactQuality.totalContacts}
          </p>
        </Section>

        {/* Contact Compliance */}
        <Section title="Contact Compliance">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label="Documented" value={`${data.familyContactCompliance.documentedRate}%`} />
            <Stat label="Staff Supervised" value={`${data.familyContactCompliance.staffSupervisedRate}%`} />
            <Stat label="Feedback Recorded" value={`${data.familyContactCompliance.feedbackRate}%`} />
            <Stat label="Type Diversity" value={`${data.familyContactCompliance.contactTypeDiversityRatio}%`} />
          </div>
        </Section>

        {/* Contact Policy */}
        <Section title="Contact Policy">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Contact Promotion Strategy</span>
              {boolBadge(data.familyContactPolicy.contactPromotionStrategy)}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Safeguarding Protocol</span>
              {boolBadge(data.familyContactPolicy.safeguardingProtocol)}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Supervised Contact Procedure</span>
              {boolBadge(data.familyContactPolicy.supervisedContactProcedure)}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Lettering & Phone Policy</span>
              {boolBadge(data.familyContactPolicy.letteringAndPhonePolicy)}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Sibling Contact Framework</span>
              {boolBadge(data.familyContactPolicy.siblingContactFramework)}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Family Engagement Plan</span>
              {boolBadge(data.familyContactPolicy.familyEngagementPlan)}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Regular Review</span>
              {boolBadge(data.familyContactPolicy.regularReview)}
            </div>
          </div>
        </Section>

        {/* Staff Readiness */}
        <Section title="Staff Family Contact Readiness">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <div>
              <span className="text-gray-500">Staff:</span>{" "}
              <span className="font-medium">{data.staffFamilyContactReadiness.totalStaff}</span>
            </div>
            <div>
              <span className="text-gray-500">Family Dynamics:</span>{" "}
              <span className="font-medium">{data.staffFamilyContactReadiness.familyDynamicsAwarenessRate}%</span>
            </div>
            <div>
              <span className="text-gray-500">Contact Supervision:</span>{" "}
              <span className="font-medium">{data.staffFamilyContactReadiness.contactSupervisionRate}%</span>
            </div>
            <div>
              <span className="text-gray-500">Safeguarding:</span>{" "}
              <span className="font-medium">{data.staffFamilyContactReadiness.safeguardingInContactRate}%</span>
            </div>
            <div>
              <span className="text-gray-500">Child Preparation:</span>{" "}
              <span className="font-medium">{data.staffFamilyContactReadiness.childPreparationSkillsRate}%</span>
            </div>
            <div>
              <span className="text-gray-500">Conflict Management:</span>{" "}
              <span className="font-medium">{data.staffFamilyContactReadiness.conflictManagementRate}%</span>
            </div>
            <div>
              <span className="text-gray-500">Record Keeping:</span>{" "}
              <span className="font-medium">{data.staffFamilyContactReadiness.recordKeepingRate}%</span>
            </div>
          </div>
        </Section>

        {/* Child Profiles */}
        {data.childProfiles.length > 0 && (
          <Section title="Child Contact Profiles">
            <div className="space-y-3">
              {data.childProfiles.map((child) => (
                <div key={child.childId} className="border border-gray-100 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{child.childName}</span>
                    <span className="text-sm text-gray-500">{child.overallScore}/10</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
                    <div>
                      Contacts: <span className="font-medium">{child.totalContacts}</span>
                    </div>
                    <div>
                      Positive: <span className="font-medium">{child.positiveOutcomeRate}%</span>
                    </div>
                    <div>
                      Prepared: <span className="font-medium">{child.preparedRate}%</span>
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

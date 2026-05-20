"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CONTACT DASHBOARD WIDGET
//
// Displays the 4-layer contact intelligence:
// - Overall score with rating
// - Layer scores: contact quality, compliance, policy, staff readiness
// - Child contact profiles
// - Strengths, areas for improvement, and actions
// - Regulatory references
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";

// ── Local interfaces (mirrors API shape) ──────────────────────────────────

interface ContactQualityData {
  totalRecords: number;
  childPreparedRate: number;
  contactPlanFollowedRate: number;
  childViewCapturedRate: number;
  safetyMeasuresRate: number;
  score: number;
  strengths: string[];
  concerns: string[];
}

interface ContactComplianceData {
  totalRecords: number;
  documentationCompleteRate: number;
  timelyRecordingRate: number;
  completedOutcomeRate: number;
  categoryDiversityRate: number;
  uniqueCategories: number;
  score: number;
  strengths: string[];
  concerns: string[];
}

interface ContactPolicyData {
  contactPolicy: boolean;
  supervisedContactGuidelines: boolean;
  riskAssessmentProtocol: boolean;
  childParticipationFramework: boolean;
  familyEngagementStrategy: boolean;
  emergencyContactProcedure: boolean;
  reviewSchedule: boolean;
  score: number;
  strengths: string[];
  concerns: string[];
}

interface StaffReadinessData {
  totalStaff: number;
  contactSupervisionRate: number;
  safeguardingAwarenessRate: number;
  childCommunicationRate: number;
  familyMediationRate: number;
  riskManagementRate: number;
  recordKeepingRate: number;
  score: number;
  strengths: string[];
  concerns: string[];
}

interface ChildContactProfileData {
  childId: string;
  childName: string;
  totalContacts: number;
  childPreparedRate: number;
  childViewCapturedRate: number;
  uniqueCategories: number;
  contactScore: number;
}

interface ContactData {
  homeId: string;
  assessedAt: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: string;
  contactQuality: ContactQualityData;
  contactCompliance: ContactComplianceData;
  contactPolicy: ContactPolicyData;
  staffReadiness: StaffReadinessData;
  childProfiles: ChildContactProfileData[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Inline Components ─────────────────────────────────────────────────────

function ScoreBar({ label, score, max }: { label: string; score: number; max: number }) {
  const pctVal = max > 0 ? Math.round((score / max) * 100) : 0;
  const colour =
    pctVal >= 80 ? "bg-green-500" : pctVal >= 60 ? "bg-amber-500" : pctVal >= 40 ? "bg-orange-500" : "bg-red-500";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-slate-600 font-medium">{label}</span>
        <span className="text-slate-500">{score}/{max}</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${colour}`} style={{ width: `${pctVal}%` }} />
      </div>
    </div>
  );
}

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
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
      >
        <span className="text-sm font-medium text-slate-700">{title}</span>
        <span className="text-slate-400 text-xs">{open ? "Hide" : "Show"}</span>
      </button>
      {open && <div className="p-4 space-y-3">{children}</div>}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-xs font-semibold text-slate-700">{String(value)}</span>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

function ratingColour(rating: string): string {
  switch (rating) {
    case "outstanding": return "text-green-600";
    case "good": return "text-amber-600";
    case "requires_improvement": return "text-orange-600";
    case "inadequate": return "text-red-600";
    default: return "text-slate-600";
  }
}

function ratingBg(rating: string): string {
  switch (rating) {
    case "outstanding": return "bg-green-50 border-green-200";
    case "good": return "bg-amber-50 border-amber-200";
    case "requires_improvement": return "bg-orange-50 border-orange-200";
    case "inadequate": return "bg-red-50 border-red-200";
    default: return "bg-slate-50 border-slate-200";
  }
}

function ratingLabel(rating: string): string {
  return rating.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function boolBadge(val: boolean): string {
  return val ? "Yes" : "No";
}

function getScoreColour(score: number, max: number): string {
  const pctVal = max > 0 ? (score / max) * 100 : 0;
  if (pctVal >= 80) return "text-green-600";
  if (pctVal >= 60) return "text-amber-600";
  return "text-red-600";
}

// ── Main Component ────────────────────────────────────────────────────────

export default function ContactDashboardWidget() {
  const [data, setData] = useState<ContactData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/contact")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch contact data");
        return res.json();
      })
      .then((json) => setData(json.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Loading skeleton
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm animate-pulse">
        <div className="h-6 w-64 bg-slate-200 rounded mb-4" />
        <div className="grid grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-slate-100 rounded-lg" />
          ))}
        </div>
        <div className="space-y-3">
          <div className="h-4 w-full bg-slate-100 rounded" />
          <div className="h-4 w-3/4 bg-slate-100 rounded" />
          <div className="h-4 w-1/2 bg-slate-100 rounded" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <p className="text-red-700 text-sm font-medium">Error loading contact data</p>
        <p className="text-red-600 text-xs mt-1">{error}</p>
      </div>
    );
  }

  // Null guard
  if (!data) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
        <p className="text-slate-500 text-sm">No contact data available.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Contact</h3>
          <p className="text-sm text-slate-500 mt-0.5">
            Quality, compliance, policy, and staff readiness
          </p>
        </div>
        <div className={`text-right px-4 py-2 rounded-lg border ${ratingBg(data.rating)}`}>
          <p className={`text-2xl font-bold ${ratingColour(data.rating)}`}>
            {data.overallScore}
          </p>
          <p className={`text-xs font-medium ${ratingColour(data.rating)}`}>
            {ratingLabel(data.rating)}
          </p>
        </div>
      </div>

      {/* 4 Evaluator Score Bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ScoreBar label="Contact Quality" score={data.contactQuality.score} max={25} />
        <ScoreBar label="Contact Compliance" score={data.contactCompliance.score} max={25} />
        <ScoreBar label="Contact Policy" score={data.contactPolicy.score} max={25} />
        <ScoreBar label="Staff Readiness" score={data.staffReadiness.score} max={25} />
      </div>

      {/* Contact Quality Section */}
      <Section title="Contact Quality" defaultOpen>
        <Stat label="Total Records" value={data.contactQuality.totalRecords} />
        <Stat label="Child Prepared Rate" value={data.contactQuality.childPreparedRate + "%"} />
        <Stat label="Contact Plan Followed Rate" value={data.contactQuality.contactPlanFollowedRate + "%"} />
        <Stat label="Child View Captured Rate" value={data.contactQuality.childViewCapturedRate + "%"} />
        <Stat label="Safety Measures Rate" value={data.contactQuality.safetyMeasuresRate + "%"} />
      </Section>

      {/* Contact Compliance Section */}
      <Section title="Contact Compliance">
        <Stat label="Documentation Complete Rate" value={data.contactCompliance.documentationCompleteRate + "%"} />
        <Stat label="Timely Recording Rate" value={data.contactCompliance.timelyRecordingRate + "%"} />
        <Stat label="Completed Outcome Rate" value={data.contactCompliance.completedOutcomeRate + "%"} />
        <Stat label="Category Diversity" value={data.contactCompliance.uniqueCategories + "/8"} />
      </Section>

      {/* Contact Policy Section */}
      <Section title="Contact Policy">
        <Stat label="Contact Policy" value={boolBadge(data.contactPolicy.contactPolicy)} />
        <Stat label="Supervised Contact Guidelines" value={boolBadge(data.contactPolicy.supervisedContactGuidelines)} />
        <Stat label="Risk Assessment Protocol" value={boolBadge(data.contactPolicy.riskAssessmentProtocol)} />
        <Stat label="Child Participation Framework" value={boolBadge(data.contactPolicy.childParticipationFramework)} />
        <Stat label="Family Engagement Strategy" value={boolBadge(data.contactPolicy.familyEngagementStrategy)} />
        <Stat label="Emergency Contact Procedure" value={boolBadge(data.contactPolicy.emergencyContactProcedure)} />
        <Stat label="Review Schedule" value={boolBadge(data.contactPolicy.reviewSchedule)} />
      </Section>

      {/* Staff Readiness Section */}
      <Section title="Staff Readiness">
        <Stat label="Total Staff Trained" value={data.staffReadiness.totalStaff} />
        <Stat label="Contact Supervision" value={data.staffReadiness.contactSupervisionRate + "%"} />
        <Stat label="Safeguarding Awareness" value={data.staffReadiness.safeguardingAwarenessRate + "%"} />
        <Stat label="Child Communication" value={data.staffReadiness.childCommunicationRate + "%"} />
        <Stat label="Family Mediation" value={data.staffReadiness.familyMediationRate + "%"} />
        <Stat label="Risk Management" value={data.staffReadiness.riskManagementRate + "%"} />
        <Stat label="Record Keeping" value={data.staffReadiness.recordKeepingRate + "%"} />
      </Section>

      {/* Child Contact Profiles */}
      {data.childProfiles.length > 0 && (
        <Section title="Child Contact Profiles">
          <div className="space-y-3">
            {data.childProfiles.map((child) => (
              <div
                key={child.childId}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50"
              >
                <div>
                  <p className="text-sm font-medium text-slate-800">{child.childName}</p>
                  <p className="text-xs text-slate-500">
                    {child.totalContacts} contacts, {child.uniqueCategories} categories, {child.childPreparedRate}% prepared, {child.childViewCapturedRate}% views captured
                  </p>
                </div>
                <div className={`text-lg font-bold ${getScoreColour(child.contactScore, 10)}`}>
                  {child.contactScore}/10
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Strengths */}
      {data.strengths.length > 0 && (
        <Section title="Strengths">
          <ul className="space-y-1.5">
            {data.strengths.map((s, i) => (
              <li key={i} className="text-xs text-green-700 flex items-start gap-1.5">
                <span className="mt-0.5 shrink-0 text-green-500">+</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Areas for Improvement */}
      {data.areasForImprovement.length > 0 && (
        <Section title="Areas for Improvement">
          <ul className="space-y-1.5">
            {data.areasForImprovement.map((a, i) => (
              <li key={i} className="text-xs text-amber-700 flex items-start gap-1.5">
                <span className="mt-0.5 shrink-0 text-amber-500">-</span>
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Actions */}
      {data.actions.length > 0 && (
        <Section title="Actions">
          <ul className="space-y-1.5">
            {data.actions.map((a, i) => (
              <li key={i} className={`text-xs flex items-start gap-1.5 ${
                a.startsWith("URGENT") ? "text-red-700" :
                a.startsWith("HIGH") ? "text-orange-700" :
                a.startsWith("MEDIUM") ? "text-amber-700" :
                "text-slate-600"
              }`}>
                <span className="mt-0.5 shrink-0">*</span>
                <span>{a}</span>
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
              <li key={i} className="text-xs text-slate-500">{link}</li>
            ))}
          </ul>
        </Section>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <span className="text-xs text-slate-400">
          Period: {data.periodStart} to {data.periodEnd}
        </span>
        <span className="text-xs text-slate-400">
          Reg 7 &middot; Reg 14 &middot; s.34 CA 1989
        </span>
      </div>
    </div>
  );
}

"use client";

// ══════════════════════════════════════════════════════════════════════════════
// DELEGATED AUTHORITY DASHBOARD WIDGET
//
// Displays the 4-layer delegated authority intelligence:
// - Overall score with rating
// - Layer scores: authority quality, compliance, policy, staff readiness
// - Child authority profiles
// - Strengths, areas for improvement, and actions
// - Regulatory references
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";

// ── Local interfaces (mirrors API shape) ──────────────────────────────────

interface AuthorityQualityData {
  totalDecisions: number;
  timelyApprovalRate: number;
  childConsultedRate: number;
  documentedRate: number;
  outcomeRecordedRate: number;
  score: number;
  strengths: string[];
  concerns: string[];
}

interface AuthorityComplianceData {
  totalDecisions: number;
  parentNotifiedRate: number;
  withinScopeRate: number;
  staffDecisionRate: number;
  categoryDiversityRatio: number;
  uniqueCategories: number;
  score: number;
  strengths: string[];
  concerns: string[];
}

interface AuthorityPolicyData {
  delegatedAuthorityMatrix: boolean;
  clearDecisionFramework: boolean;
  staffEmpowermentGuidance: boolean;
  escalationProtocol: boolean;
  parentalNotificationProcess: boolean;
  childParticipationFramework: boolean;
  regularReview: boolean;
  score: number;
  strengths: string[];
  concerns: string[];
}

interface StaffReadinessData {
  totalStaff: number;
  delegatedAuthorityUnderstandingRate: number;
  decisionMakingConfidenceRate: number;
  scopeRecognitionRate: number;
  documentationCompetencyRate: number;
  escalationAwarenessRate: number;
  childConsultationSkillsRate: number;
  score: number;
  strengths: string[];
  concerns: string[];
}

interface ChildAuthorityProfileData {
  childId: string;
  childName: string;
  totalDecisions: number;
  timelyApprovalRate: number;
  childConsultedRate: number;
  uniqueCategories: number;
  authorityScore: number;
}

interface DelegatedAuthorityData {
  homeId: string;
  assessedAt: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: string;
  authorityQuality: AuthorityQualityData;
  authorityCompliance: AuthorityComplianceData;
  authorityPolicy: AuthorityPolicyData;
  staffReadiness: StaffReadinessData;
  childProfiles: ChildAuthorityProfileData[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Inline Components ─────────────────────────────────────────────────────

function ScoreBar({ label, score, max }: { label: string; score: number; max: number }) {
  const pct = max > 0 ? Math.round((score / max) * 100) : 0;
  const colour =
    pct >= 80 ? "bg-green-500" : pct >= 60 ? "bg-amber-500" : pct >= 40 ? "bg-orange-500" : "bg-red-500";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-slate-600 font-medium">{label}</span>
        <span className="text-slate-500">{score}/{max}</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${colour}`} style={{ width: `${pct}%` }} />
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

function getRatingColour(rating: string): string {
  switch (rating) {
    case "outstanding": return "text-green-600";
    case "good": return "text-amber-600";
    case "requires_improvement": return "text-orange-600";
    case "inadequate": return "text-red-600";
    default: return "text-slate-600";
  }
}

function getRatingBg(rating: string): string {
  switch (rating) {
    case "outstanding": return "bg-green-50 border-green-200";
    case "good": return "bg-amber-50 border-amber-200";
    case "requires_improvement": return "bg-orange-50 border-orange-200";
    case "inadequate": return "bg-red-50 border-red-200";
    default: return "bg-slate-50 border-slate-200";
  }
}

function formatRating(rating: string): string {
  return rating.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function getScoreColour(score: number, max: number): string {
  const pct = max > 0 ? (score / max) * 100 : 0;
  if (pct >= 80) return "text-green-600";
  if (pct >= 60) return "text-amber-600";
  return "text-red-600";
}

// ── Main Component ────────────────────────────────────────────────────────

export default function DelegatedAuthorityDashboardWidget() {
  const [data, setData] = useState<DelegatedAuthorityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/delegated-authority")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch delegated authority data");
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
        <p className="text-red-700 text-sm font-medium">Error loading delegated authority data</p>
        <p className="text-red-600 text-xs mt-1">{error}</p>
      </div>
    );
  }

  // Null guard
  if (!data) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
        <p className="text-slate-500 text-sm">No delegated authority data available.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Delegated Authority</h3>
          <p className="text-sm text-slate-500 mt-0.5">
            Decision-making, compliance, policy, and staff readiness
          </p>
        </div>
        <div className={`text-right px-4 py-2 rounded-lg border ${getRatingBg(data.rating)}`}>
          <p className={`text-2xl font-bold ${getRatingColour(data.rating)}`}>
            {data.overallScore}
          </p>
          <p className={`text-xs font-medium ${getRatingColour(data.rating)}`}>
            {formatRating(data.rating)}
          </p>
        </div>
      </div>

      {/* 4 Evaluator Score Bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ScoreBar label="Authority Quality" score={data.authorityQuality.score} max={25} />
        <ScoreBar label="Authority Compliance" score={data.authorityCompliance.score} max={25} />
        <ScoreBar label="Authority Policy" score={data.authorityPolicy.score} max={25} />
        <ScoreBar label="Staff Readiness" score={data.staffReadiness.score} max={25} />
      </div>

      {/* Authority Quality Section */}
      <Section title="Authority Quality" defaultOpen>
        <Stat label="Total Decisions" value={data.authorityQuality.totalDecisions} />
        <Stat label="Timely Approval Rate" value={data.authorityQuality.timelyApprovalRate + "%"} />
        <Stat label="Child Consulted Rate" value={data.authorityQuality.childConsultedRate + "%"} />
        <Stat label="Documented Rate" value={data.authorityQuality.documentedRate + "%"} />
        <Stat label="Outcome Recorded Rate" value={data.authorityQuality.outcomeRecordedRate + "%"} />
      </Section>

      {/* Authority Compliance Section */}
      <Section title="Authority Compliance">
        <Stat label="Parent Notified Rate" value={data.authorityCompliance.parentNotifiedRate + "%"} />
        <Stat label="Within Scope Rate" value={data.authorityCompliance.withinScopeRate + "%"} />
        <Stat label="Staff Decision Rate" value={data.authorityCompliance.staffDecisionRate + "%"} />
        <Stat label="Category Diversity" value={data.authorityCompliance.uniqueCategories + "/8"} />
      </Section>

      {/* Authority Policy Section */}
      <Section title="Authority Policy">
        <Stat label="Delegated Authority Matrix" value={data.authorityPolicy.delegatedAuthorityMatrix ? "Yes" : "No"} />
        <Stat label="Clear Decision Framework" value={data.authorityPolicy.clearDecisionFramework ? "Yes" : "No"} />
        <Stat label="Staff Empowerment Guidance" value={data.authorityPolicy.staffEmpowermentGuidance ? "Yes" : "No"} />
        <Stat label="Escalation Protocol" value={data.authorityPolicy.escalationProtocol ? "Yes" : "No"} />
        <Stat label="Parental Notification Process" value={data.authorityPolicy.parentalNotificationProcess ? "Yes" : "No"} />
        <Stat label="Child Participation Framework" value={data.authorityPolicy.childParticipationFramework ? "Yes" : "No"} />
        <Stat label="Regular Review" value={data.authorityPolicy.regularReview ? "Yes" : "No"} />
      </Section>

      {/* Staff Readiness Section */}
      <Section title="Staff Readiness">
        <Stat label="Total Staff Trained" value={data.staffReadiness.totalStaff} />
        <Stat label="DA Understanding" value={data.staffReadiness.delegatedAuthorityUnderstandingRate + "%"} />
        <Stat label="Decision Confidence" value={data.staffReadiness.decisionMakingConfidenceRate + "%"} />
        <Stat label="Scope Recognition" value={data.staffReadiness.scopeRecognitionRate + "%"} />
        <Stat label="Documentation Competency" value={data.staffReadiness.documentationCompetencyRate + "%"} />
        <Stat label="Escalation Awareness" value={data.staffReadiness.escalationAwarenessRate + "%"} />
        <Stat label="Child Consultation Skills" value={data.staffReadiness.childConsultationSkillsRate + "%"} />
      </Section>

      {/* Child Authority Profiles */}
      {data.childProfiles.length > 0 && (
        <Section title="Child Authority Profiles">
          <div className="space-y-3">
            {data.childProfiles.map((child) => (
              <div
                key={child.childId}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50"
              >
                <div>
                  <p className="text-sm font-medium text-slate-800">{child.childName}</p>
                  <p className="text-xs text-slate-500">
                    {child.totalDecisions} decisions, {child.uniqueCategories} categories, {child.timelyApprovalRate}% timely, {child.childConsultedRate}% consulted
                  </p>
                </div>
                <div className={`text-lg font-bold ${getScoreColour(child.authorityScore, 10)}`}>
                  {child.authorityScore}/10
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
          Reg 5 &middot; Reg 14 &middot; s.33(3)(b) CA 1989
        </span>
      </div>
    </div>
  );
}

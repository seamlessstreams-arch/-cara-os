"use client";

// ══════════════════════════════════════════════════════════════════════════════
// VISITOR ENGAGEMENT MONITORING DASHBOARD WIDGET
//
// Displays visitor engagement monitoring intelligence for a children's home:
// - Overall score with Ofsted-aligned rating
// - Key metrics: visitor safeguarding, visit quality, visitor policy,
//   staff readiness
// - Expandable sections for detailed analysis
// - Visitor type breakdown
// - Strengths, areas for improvement, actions
// - Regulatory framework references
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";
import { formatRate } from "@/lib/metrics/rate";

// ── Local Type Definitions ────────────────────────────────────────────────

interface VisitorSafeguardingEvaluation {
  totalRecords: number;
  identityVerifiedRate: number;
  dbsCheckedRate: number;
  safeguardingFollowedRate: number;
  signedInRate: number;
  documentedInLogRate: number;
  score: number;
}

interface VisitQualityEvaluation {
  totalRecords: number;
  positiveOutcomeRate: number;
  childConsentedRate: number;
  feedbackRecordedRate: number;
  score: number;
}

interface VisitorPolicyEvaluation {
  hasPolicy: boolean;
  visitorManagementPolicy: boolean;
  identityVerification: boolean;
  dbsCheckingProcess: boolean;
  childConsentProtocol: boolean;
  supervisionGuidance: boolean;
  safeguardingProcedure: boolean;
  regularReview: boolean;
  score: number;
}

interface StaffVisitorReadinessEvaluation {
  totalStaff: number;
  visitorManagementRate: number;
  safeguardingVisitorsRate: number;
  identityCheckingRate: number;
  childProtectionRate: number;
  conflictManagementRate: number;
  recordKeepingRate: number;
  score: number;
}

interface VisitorTypeBreakdownEntry {
  visitorType: string;
  count: number;
  positiveRate: number;
  safeguardingRate: number;
}

interface VisitorEngagementMonitoringData {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: string;
  visitorSafeguarding: VisitorSafeguardingEvaluation;
  visitQuality: VisitQualityEvaluation;
  visitorPolicy: VisitorPolicyEvaluation;
  staffVisitorReadiness: StaffVisitorReadinessEvaluation;
  visitorTypeBreakdown: VisitorTypeBreakdownEntry[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Score Bar ─────────────────────────────────────────────────────────────

function ScoreBar({ label, score, max }: { label: string; score: number; max: number }) {
  const pctVal = max > 0 ? Math.round((score / max) * 100) : 0;
  const barColor =
    pctVal >= 80 ? "bg-green-500" : pctVal >= 60 ? "bg-blue-500" : pctVal >= 40 ? "bg-orange-500" : "bg-red-500";

  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs text-gray-600 mb-0.5">
        <span>{label}</span>
        <span>
          {score}/{max}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div className={`${barColor} h-2 rounded-full transition-all`} style={{ width: `${pctVal}%` }} />
      </div>
    </div>
  );
}

// ── Section Toggle ────────────────────────────────────────────────────────

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
    <div className="border border-gray-100 rounded-lg">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left px-4 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50 flex items-center justify-between"
      >
        {title}
        <span className="text-gray-400 text-xs">{open ? "▲" : "▼"}</span>
      </button>
      {open && <div className="px-4 pb-3 space-y-2">{children}</div>}
    </div>
  );
}

// ── Stat Row ──────────────────────────────────────────────────────────────

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between items-center text-sm py-1 border-b border-gray-50 last:border-0">
      <span className="text-gray-600">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}

// ── Main Widget ───────────────────────────────────────────────────────────

export default function VisitorEngagementMonitoringDashboardWidget() {
  const [data, setData] = useState<VisitorEngagementMonitoringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/visitor-engagement-monitoring");
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
        <div className="grid grid-cols-4 gap-3">
          <div className="h-16 bg-gray-100 rounded" />
          <div className="h-16 bg-gray-100 rounded" />
          <div className="h-16 bg-gray-100 rounded" />
          <div className="h-16 bg-gray-100 rounded" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white border border-red-200 rounded-xl p-6">
        <h3 className="font-semibold text-red-800">Visitor Engagement Monitoring</h3>
        <p className="text-sm text-red-600 mt-1">{error ?? "No data available"}</p>
      </div>
    );
  }

  const ratingColorClass =
    data.rating === "outstanding"
      ? "bg-green-100 text-green-800 border-green-300"
      : data.rating === "good"
        ? "bg-blue-100 text-blue-800 border-blue-300"
        : data.rating === "requires_improvement"
          ? "bg-orange-100 text-orange-800 border-orange-300"
          : "bg-red-100 text-red-800 border-red-300";

  const ratingLabel =
    data.rating === "outstanding"
      ? "Outstanding"
      : data.rating === "good"
        ? "Good"
        : data.rating === "requires_improvement"
          ? "Requires Improvement"
          : "Inadequate";

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900 text-lg">
            Visitor Engagement Monitoring
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {data.periodStart} to {data.periodEnd} | {data.visitorSafeguarding.totalRecords} visits | {data.staffVisitorReadiness.totalStaff} staff
          </p>
        </div>
        <div className={`rounded-lg border px-4 py-3 text-center ${ratingColorClass}`}>
          <div className="text-3xl font-bold">{data.overallScore}</div>
          <div className="text-sm font-medium mt-1">{ratingLabel}</div>
        </div>
      </div>

      {/* Score Bars */}
      <div className="mb-4">
        <ScoreBar label="Visitor Safeguarding" score={data.visitorSafeguarding.score} max={25} />
        <ScoreBar label="Visit Quality" score={data.visitQuality.score} max={25} />
        <ScoreBar label="Visitor Policy" score={data.visitorPolicy.score} max={25} />
        <ScoreBar label="Staff Visitor Readiness" score={data.staffVisitorReadiness.score} max={25} />
      </div>

      {/* Priority Actions */}
      {data.actions.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <h4 className="text-sm font-semibold text-red-800 mb-2">Priority Actions</h4>
          <ul className="space-y-1">
            {data.actions.slice(0, 3).map((action, i) => (
              <li key={i} className="text-xs text-red-700 flex items-start gap-1.5">
                <span className="mt-0.5 shrink-0">*</span>
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Expandable Details */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-sm text-blue-600 hover:text-blue-800 font-medium w-full text-left"
      >
        {expanded ? "Hide details" : "Show detailed analysis"}
      </button>

      {expanded && (
        <div className="mt-4 space-y-3">
          {/* Visitor Safeguarding */}
          <Section title="Visitor Safeguarding" defaultOpen>
            <Stat label="Total visitor records" value={data.visitorSafeguarding.totalRecords} />
            <Stat label="Identity verified rate" value={`${formatRate(data.visitorSafeguarding.identityVerifiedRate)}`} />
            <Stat label="DBS checked rate" value={`${formatRate(data.visitorSafeguarding.dbsCheckedRate)}`} />
            <Stat label="Safeguarding followed rate" value={`${formatRate(data.visitorSafeguarding.safeguardingFollowedRate)}`} />
            <Stat label="Signed-in rate" value={`${formatRate(data.visitorSafeguarding.signedInRate)}`} />
            <Stat label="Documented in log rate" value={`${formatRate(data.visitorSafeguarding.documentedInLogRate)}`} />
            <Stat label="Score" value={`${data.visitorSafeguarding.score}/25`} />
          </Section>

          {/* Visit Quality */}
          <Section title="Visit Quality">
            <Stat label="Total records" value={data.visitQuality.totalRecords} />
            <Stat label="Positive outcome rate" value={`${formatRate(data.visitQuality.positiveOutcomeRate)}`} />
            <Stat label="Child consented rate" value={`${formatRate(data.visitQuality.childConsentedRate)}`} />
            <Stat label="Feedback recorded rate" value={`${formatRate(data.visitQuality.feedbackRecordedRate)}`} />
            <Stat label="Score" value={`${data.visitQuality.score}/25`} />
          </Section>

          {/* Visitor Policy */}
          <Section title="Visitor Policy">
            <Stat label="Policy in place" value={data.visitorPolicy.hasPolicy ? "Yes" : "No"} />
            {data.visitorPolicy.hasPolicy && (
              <>
                <Stat label="Visitor management policy" value={data.visitorPolicy.visitorManagementPolicy ? "Yes" : "No"} />
                <Stat label="Identity verification" value={data.visitorPolicy.identityVerification ? "Yes" : "No"} />
                <Stat label="DBS checking process" value={data.visitorPolicy.dbsCheckingProcess ? "Yes" : "No"} />
                <Stat label="Child consent protocol" value={data.visitorPolicy.childConsentProtocol ? "Yes" : "No"} />
                <Stat label="Supervision guidance" value={data.visitorPolicy.supervisionGuidance ? "Yes" : "No"} />
                <Stat label="Safeguarding procedure" value={data.visitorPolicy.safeguardingProcedure ? "Yes" : "No"} />
                <Stat label="Regular review" value={data.visitorPolicy.regularReview ? "Yes" : "No"} />
              </>
            )}
            <Stat label="Score" value={`${data.visitorPolicy.score}/25`} />
          </Section>

          {/* Staff Visitor Readiness */}
          <Section title="Staff Visitor Readiness">
            <Stat label="Total staff" value={data.staffVisitorReadiness.totalStaff} />
            <Stat label="Visitor management" value={`${formatRate(data.staffVisitorReadiness.visitorManagementRate)}`} />
            <Stat label="Safeguarding visitors" value={`${formatRate(data.staffVisitorReadiness.safeguardingVisitorsRate)}`} />
            <Stat label="Identity checking" value={`${formatRate(data.staffVisitorReadiness.identityCheckingRate)}`} />
            <Stat label="Child protection" value={`${formatRate(data.staffVisitorReadiness.childProtectionRate)}`} />
            <Stat label="Conflict management" value={`${formatRate(data.staffVisitorReadiness.conflictManagementRate)}`} />
            <Stat label="Record keeping" value={`${formatRate(data.staffVisitorReadiness.recordKeepingRate)}`} />
            <Stat label="Score" value={`${data.staffVisitorReadiness.score}/25`} />
          </Section>

          {/* Visitor Type Breakdown */}
          {data.visitorTypeBreakdown.length > 0 && (
            <Section title="Visitor Type Breakdown">
              {data.visitorTypeBreakdown.map((entry) => (
                <div key={entry.visitorType} className="border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                  <div className="flex justify-between items-center text-sm py-1">
                    <span className="text-gray-700 font-medium">{entry.visitorType.replace(/_/g, " ")}</span>
                    <span className="font-medium text-gray-900">{entry.count} visits</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Positive: {entry.positiveRate}% | Safeguarding: {entry.safeguardingRate}%
                  </div>
                </div>
              ))}
            </Section>
          )}

          {/* Strengths */}
          {data.strengths.length > 0 && (
            <Section title="Strengths">
              {data.strengths.map((s, i) => (
                <div key={i} className="text-xs text-green-700">+ {s}</div>
              ))}
            </Section>
          )}

          {/* Areas for Improvement */}
          {data.areasForImprovement.length > 0 && (
            <Section title="Areas for Improvement">
              {data.areasForImprovement.map((a, i) => (
                <div key={i} className="text-xs text-orange-700">- {a}</div>
              ))}
            </Section>
          )}

          {/* Actions Required */}
          {data.actions.length > 0 && (
            <Section title="Actions Required">
              {data.actions.map((a, i) => (
                <div key={i} className="text-xs text-red-700">* {a}</div>
              ))}
            </Section>
          )}

          {/* Regulatory Framework */}
          <Section title="Regulatory Framework">
            {data.regulatoryLinks.map((link, i) => (
              <div key={i} className="text-xs text-gray-600">{link}</div>
            ))}
          </Section>
        </div>
      )}
    </div>
  );
}

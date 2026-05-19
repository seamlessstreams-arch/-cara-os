"use client";

// ══════════════════════════════════════════════════════════════════════════════
// VISITOR MANAGEMENT SAFETY DASHBOARD WIDGET
//
// Displays visitor management safety intelligence for a children's home:
// - Overall score with Ofsted-aligned rating
// - Key metrics: visitor compliance, policy adherence, incident management,
//   staff readiness
// - Expandable sections for detailed analysis
// - Child visitor profiles with individual safety scores
// - Strengths, areas for improvement, actions
// - Regulatory framework references
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";

// ── Local Type Definitions ────────────────────────────────────────────────

interface VisitorComplianceEvaluation {
  totalRecords: number;
  signInRate: number;
  signOutRate: number;
  idCheckRate: number;
  dbsVerifiedRate: number;
  safeguardingBriefRate: number;
  supervisedRate: number;
  visitsByType: Record<string, number>;
  visitsByPurpose: Record<string, number>;
  visitsByOutcome: Record<string, number>;
  visitorComplianceScore: number;
}

interface PolicyAdherenceEvaluation {
  totalPolicies: number;
  signInSystemRate: number;
  idCheckMandatoryRate: number;
  dbsCheckRequiredRate: number;
  safeguardingBriefRequiredRate: number;
  visitorGuideRate: number;
  restrictedListRate: number;
  policyAdherenceScore: number;
}

interface IncidentManagementEvaluation {
  totalIncidents: number;
  resolvedRate: number;
  reportedRate: number;
  byType: Record<string, number>;
  unauthorisedAccessCount: number;
  safeguardingConcernCount: number;
  incidentManagementScore: number;
}

interface StaffVisitorReadinessEvaluation {
  totalStaff: number;
  visitorPolicyTrainedRate: number;
  safeguardingVisitorsRate: number;
  signInProceduresRate: number;
  dbsCheckProcessRate: number;
  incidentReportingRate: number;
  restrictedVisitorAwarenessRate: number;
  staffVisitorReadinessScore: number;
}

interface ChildVisitorProfile {
  childId: string;
  childName: string;
  totalVisits: number;
  visitorTypes: string[];
  visitPurposes: string[];
  signedInRate: number;
  idCheckedRate: number;
  dbsVerifiedRate: number;
  safeguardingBriefRate: number;
  supervisedRate: number;
  safetyScore: number;
}

interface VisitorManagementSafetyData {
  homeId: string;
  assessedAt: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: string;
  visitorCompliance: VisitorComplianceEvaluation;
  policyAdherence: PolicyAdherenceEvaluation;
  incidentManagement: IncidentManagementEvaluation;
  staffVisitorReadiness: StaffVisitorReadinessEvaluation;
  childVisitorProfiles: ChildVisitorProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
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
    rating === "outstanding" ? "Outstanding"
      : rating === "good" ? "Good"
        : rating === "requires_improvement" ? "Requires Improvement"
          : "Inadequate";

  return (
    <div className={`rounded-lg border px-4 py-3 text-center ${colorClass}`}>
      <div className="text-3xl font-bold">{score}</div>
      <div className="text-sm font-medium mt-1">{label}</div>
    </div>
  );
}

// ── Score Bar ─────────────────────────────────────────────────────────────

function ScoreBar({ label, score, max }: { label: string; score: number; max: number }) {
  const pctVal = Math.round((score / max) * 100);
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

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between items-center text-sm py-1 border-b border-gray-50 last:border-0">
      <span className="text-gray-600">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}

// ── Main Widget ───────────────────────────────────────────────────────────

export function VisitorManagementSafetyDashboardWidget() {
  const [data, setData] = useState<VisitorManagementSafetyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/visitor-management-safety");
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
        <h3 className="font-semibold text-red-800">Visitor Management Safety</h3>
        <p className="text-sm text-red-600 mt-1">{error ?? "No data available"}</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900 text-lg">
            Visitor Management Safety
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {data.periodStart} to {data.periodEnd} | {data.visitorCompliance.totalRecords} visits | {data.policyAdherence.totalPolicies} policies | {data.staffVisitorReadiness.totalStaff} staff
          </p>
        </div>
        <RatingBadge score={data.overallScore} rating={data.rating} />
      </div>

      {/* Score Bars */}
      <div className="mb-4">
        <ScoreBar label="Visitor Compliance" score={data.visitorCompliance.visitorComplianceScore} max={25} />
        <ScoreBar label="Policy Adherence" score={data.policyAdherence.policyAdherenceScore} max={25} />
        <ScoreBar label="Incident Management" score={data.incidentManagement.incidentManagementScore} max={25} />
        <ScoreBar label="Staff Visitor Readiness" score={data.staffVisitorReadiness.staffVisitorReadinessScore} max={25} />
      </div>

      {/* Alerts */}
      {(data.incidentManagement.unauthorisedAccessCount > 0 ||
        data.incidentManagement.safeguardingConcernCount > 0) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <h4 className="text-sm font-semibold text-red-800 mb-1">Safety Alerts</h4>
          {data.incidentManagement.unauthorisedAccessCount > 0 && (
            <div className="text-xs text-red-700">
              {data.incidentManagement.unauthorisedAccessCount} unauthorised access incident(s) recorded
            </div>
          )}
          {data.incidentManagement.safeguardingConcernCount > 0 && (
            <div className="text-xs text-red-700">
              {data.incidentManagement.safeguardingConcernCount} safeguarding concern(s) from visitor incidents
            </div>
          )}
        </div>
      )}

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
          {/* Visitor Compliance */}
          <Section title="Visitor Compliance" defaultOpen>
            <StatRow label="Total visitor records" value={data.visitorCompliance.totalRecords} />
            <StatRow label="Sign-in rate" value={`${data.visitorCompliance.signInRate}%`} />
            <StatRow label="Sign-out rate" value={`${data.visitorCompliance.signOutRate}%`} />
            <StatRow label="ID check rate" value={`${data.visitorCompliance.idCheckRate}%`} />
            <StatRow label="DBS verified rate" value={`${data.visitorCompliance.dbsVerifiedRate}%`} />
            <StatRow label="Safeguarding brief rate" value={`${data.visitorCompliance.safeguardingBriefRate}%`} />
            <StatRow label="Supervised visit rate" value={`${data.visitorCompliance.supervisedRate}%`} />
            <StatRow label="Score" value={`${data.visitorCompliance.visitorComplianceScore}/25`} />
            {Object.keys(data.visitorCompliance.visitsByType).length > 0 && (
              <div className="text-xs text-gray-500 mt-1">
                By type: {Object.entries(data.visitorCompliance.visitsByType).map(([type, count]) =>
                  `${type.replace(/_/g, " ")}: ${count}`,
                ).join(" | ")}
              </div>
            )}
            {Object.keys(data.visitorCompliance.visitsByPurpose).length > 0 && (
              <div className="text-xs text-gray-500 mt-1">
                By purpose: {Object.entries(data.visitorCompliance.visitsByPurpose).map(([purpose, count]) =>
                  `${purpose.replace(/_/g, " ")}: ${count}`,
                ).join(" | ")}
              </div>
            )}
          </Section>

          {/* Policy Adherence */}
          <Section title="Policy Adherence">
            <StatRow label="Total policies" value={data.policyAdherence.totalPolicies} />
            <StatRow label="Sign-in system in place" value={`${data.policyAdherence.signInSystemRate}%`} />
            <StatRow label="ID check mandatory" value={`${data.policyAdherence.idCheckMandatoryRate}%`} />
            <StatRow label="DBS check required" value={`${data.policyAdherence.dbsCheckRequiredRate}%`} />
            <StatRow label="Safeguarding brief required" value={`${data.policyAdherence.safeguardingBriefRequiredRate}%`} />
            <StatRow label="Visitor guide available" value={`${data.policyAdherence.visitorGuideRate}%`} />
            <StatRow label="Restricted list maintained" value={`${data.policyAdherence.restrictedListRate}%`} />
            <StatRow label="Score" value={`${data.policyAdherence.policyAdherenceScore}/25`} />
          </Section>

          {/* Incident Management */}
          <Section title="Incident Management">
            <StatRow label="Total incidents" value={data.incidentManagement.totalIncidents} />
            {data.incidentManagement.totalIncidents > 0 ? (
              <>
                <StatRow label="Resolved rate" value={`${data.incidentManagement.resolvedRate}%`} />
                <StatRow label="Reported rate" value={`${data.incidentManagement.reportedRate}%`} />
                <StatRow label="Unauthorised access" value={data.incidentManagement.unauthorisedAccessCount} />
                <StatRow label="Safeguarding concerns" value={data.incidentManagement.safeguardingConcernCount} />
                {Object.keys(data.incidentManagement.byType).length > 0 && (
                  <div className="text-xs text-gray-500 mt-1">
                    {Object.entries(data.incidentManagement.byType).map(([type, count]) =>
                      `${type.replace(/_/g, " ")}: ${count}`,
                    ).join(" | ")}
                  </div>
                )}
              </>
            ) : (
              <div className="text-xs text-green-700 mt-1">No visitor-related incidents recorded</div>
            )}
            <StatRow label="Score" value={`${data.incidentManagement.incidentManagementScore}/25`} />
          </Section>

          {/* Staff Visitor Readiness */}
          <Section title="Staff Visitor Readiness">
            <StatRow label="Total staff" value={data.staffVisitorReadiness.totalStaff} />
            <StatRow label="Visitor policy trained" value={`${data.staffVisitorReadiness.visitorPolicyTrainedRate}%`} />
            <StatRow label="Safeguarding visitors" value={`${data.staffVisitorReadiness.safeguardingVisitorsRate}%`} />
            <StatRow label="Sign-in procedures" value={`${data.staffVisitorReadiness.signInProceduresRate}%`} />
            <StatRow label="DBS check process" value={`${data.staffVisitorReadiness.dbsCheckProcessRate}%`} />
            <StatRow label="Incident reporting" value={`${data.staffVisitorReadiness.incidentReportingRate}%`} />
            <StatRow label="Restricted visitor awareness" value={`${data.staffVisitorReadiness.restrictedVisitorAwarenessRate}%`} />
            <StatRow label="Score" value={`${data.staffVisitorReadiness.staffVisitorReadinessScore}/25`} />
          </Section>

          {/* Child Visitor Profiles */}
          {data.childVisitorProfiles.length > 0 && (
            <Section title="Child Visitor Profiles">
              {data.childVisitorProfiles.map((child) => (
                <div key={child.childId} className="border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                  <div className="flex justify-between items-center text-sm py-1">
                    <span className="text-gray-700 font-medium">{child.childName}</span>
                    <span className="font-medium text-gray-900">Safety: {child.safetyScore}/10</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {child.totalVisits} visits | Sign-in: {child.signedInRate}% | ID checked: {child.idCheckedRate}% | DBS: {child.dbsVerifiedRate}% | Brief: {child.safeguardingBriefRate}%
                  </div>
                  {child.visitorTypes.length > 0 && (
                    <div className="text-xs text-gray-400 mt-0.5">
                      Visitor types: {child.visitorTypes.map((t) => t.replace(/_/g, " ")).join(", ")}
                    </div>
                  )}
                  {child.visitPurposes.length > 0 && (
                    <div className="text-xs text-gray-400 mt-0.5">
                      Purposes: {child.visitPurposes.map((p) => p.replace(/_/g, " ")).join(", ")}
                    </div>
                  )}
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

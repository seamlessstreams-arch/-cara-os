"use client";

// ══════════════════════════════════════════════════════════════════════════════
// SANCTIONS DASHBOARD WIDGET
//
// Displays sanctions intelligence for a children's home:
// - Overall score with Ofsted-aligned rating
// - Key metrics: sanction quality, compliance, policy, staff readiness
// - Expandable sections for detailed analysis
// - Child sanction profiles with individual scores
// - Priority alerts and regulatory framework references
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";

// ── Local Type Definitions ────────────────────────────────────────────────

interface SanctionQualityEvaluation {
  totalRecords: number;
  proportionateRate: number;
  childViewsRate: number;
  acceptanceRate: number;
  documentedRate: number;
  overallScore: number;
}

interface SanctionComplianceEvaluation {
  totalRecords: number;
  parentNotifiedRate: number;
  staffAppliedRate: number;
  reviewScheduledRate: number;
  typeDiversityRatio: number;
  overallScore: number;
}

interface SanctionPolicyEvaluation {
  behaviourManagementPolicy: boolean;
  sanctionsGuidance: boolean;
  prohibitedSanctionsList: boolean;
  childParticipationProcess: boolean;
  complaintsMechanism: boolean;
  restorativeApproach: boolean;
  regularReview: boolean;
  overallScore: number;
}

interface StaffSanctionReadinessEvaluation {
  totalStaff: number;
  behaviourManagementRate: number;
  proportionalityAssessmentRate: number;
  restorativeApproachRate: number;
  childRightsAwarenessRate: number;
  documentationSkillsRate: number;
  deEscalationFirstRate: number;
  overallScore: number;
}

interface ChildSanctionProfile {
  childId: string;
  childName: string;
  totalSanctions: number;
  sanctionTypes: string[];
  proportionateRate: number;
  childViewsRate: number;
  escalatedCount: number;
  sanctionScore: number;
}

interface SanctionsData {
  homeId: string;
  assessedAt: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: string;
  sanctionQuality: SanctionQualityEvaluation;
  sanctionCompliance: SanctionComplianceEvaluation;
  sanctionPolicy: SanctionPolicyEvaluation;
  staffSanctionReadiness: StaffSanctionReadinessEvaluation;
  childSanctionProfiles: ChildSanctionProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── ScoreBar ─────────────────────────────────────────────────────────────

function ScoreBar({ score, max, label }: { score: number; max: number; label: string }) {
  const pctVal = max > 0 ? Math.round((score / max) * 100) : 0;
  const barColor =
    pctVal >= 80
      ? "bg-green-500"
      : pctVal >= 60
        ? "bg-blue-500"
        : pctVal >= 40
          ? "bg-orange-500"
          : "bg-red-500";

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-gray-700 font-medium">{label}</span>
        <span className="text-gray-900 font-bold">
          {score}/{max}
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${pctVal}%` }}
        />
      </div>
    </div>
  );
}

// ── Section Toggle ───────────────────────────────────────────────────────

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

// ── Stat Row ─────────────────────────────────────────────────────────────

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between items-center text-sm py-1 border-b border-gray-50 last:border-0">
      <span className="text-gray-600">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}

// ── Bool Row ─────────────────────────────────────────────────────────────

function BoolStat({ label, value }: { label: string; value: boolean }) {
  return (
    <div className="flex justify-between items-center text-sm py-1 border-b border-gray-50 last:border-0">
      <span className="text-gray-600">{label}</span>
      <span className={`font-medium ${value ? "text-green-700" : "text-red-600"}`}>
        {value ? "Yes" : "No"}
      </span>
    </div>
  );
}

// ── Rating Badge ─────────────────────────────────────────────────────────

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

// ── Main Widget ──────────────────────────────────────────────────────────

export default function SanctionsDashboardWidget() {
  const [data, setData] = useState<SanctionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/sanctions");
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

  // ── Loading Skeleton ───────────────────────────────────────────────────
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

  // ── Error State ────────────────────────────────────────────────────────
  if (error || !data) {
    return (
      <div className="bg-white border border-red-200 rounded-xl p-6">
        <h3 className="font-semibold text-red-800">Sanctions</h3>
        <p className="text-sm text-red-600 mt-1">
          {error ?? "No data available"}
        </p>
      </div>
    );
  }

  // ── Null Guard ─────────────────────────────────────────────────────────
  if (!data.sanctionQuality || !data.sanctionCompliance || !data.sanctionPolicy || !data.staffSanctionReadiness) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="font-semibold text-gray-900">Sanctions</h3>
        <p className="text-sm text-gray-500 mt-1">Incomplete data received</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900 text-lg">Sanctions</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {data.periodStart} to {data.periodEnd} |{" "}
            {data.sanctionQuality.totalRecords} sanctions |{" "}
            {data.staffSanctionReadiness.totalStaff} staff
          </p>
        </div>
        <RatingBadge score={data.overallScore} rating={data.rating} />
      </div>

      {/* Score Bars */}
      <div className="space-y-3 mb-4">
        <ScoreBar
          label="Sanction Quality"
          score={data.sanctionQuality.overallScore}
          max={25}
        />
        <ScoreBar
          label="Sanction Compliance"
          score={data.sanctionCompliance.overallScore}
          max={25}
        />
        <ScoreBar
          label="Sanctions Policy"
          score={data.sanctionPolicy.overallScore}
          max={25}
        />
        <ScoreBar
          label="Staff Readiness"
          score={data.staffSanctionReadiness.overallScore}
          max={25}
        />
      </div>

      {/* Priority Actions */}
      {data.actions.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <h4 className="text-sm font-semibold text-red-800 mb-2">
            Priority Actions
          </h4>
          <ul className="space-y-1">
            {data.actions.slice(0, 3).map((action, i) => (
              <li
                key={i}
                className="text-xs text-red-700 flex items-start gap-1.5"
              >
                <span className="mt-0.5 shrink-0">*</span>
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Expand Toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-sm text-blue-600 hover:text-blue-800 font-medium w-full text-left"
      >
        {expanded ? "Hide details" : "Show detailed analysis"}
      </button>

      {expanded && (
        <div className="mt-4 space-y-3">
          {/* Sanction Quality */}
          <Section title="Sanction Quality" defaultOpen>
            <Stat label="Total sanctions" value={data.sanctionQuality.totalRecords} />
            <Stat label="Proportionate rate" value={`${data.sanctionQuality.proportionateRate}%`} />
            <Stat label="Child views recorded" value={`${data.sanctionQuality.childViewsRate}%`} />
            <Stat label="Acceptance rate" value={`${data.sanctionQuality.acceptanceRate}%`} />
            <Stat label="Documented properly" value={`${data.sanctionQuality.documentedRate}%`} />
          </Section>

          {/* Sanction Compliance */}
          <Section title="Sanction Compliance">
            <Stat label="Parent notified" value={`${data.sanctionCompliance.parentNotifiedRate}%`} />
            <Stat label="Staff applied" value={`${data.sanctionCompliance.staffAppliedRate}%`} />
            <Stat label="Review scheduled" value={`${data.sanctionCompliance.reviewScheduledRate}%`} />
            <Stat label="Type diversity" value={`${data.sanctionCompliance.typeDiversityRatio}%`} />
          </Section>

          {/* Sanctions Policy */}
          <Section title="Sanctions Policy">
            <BoolStat label="Behaviour management policy" value={data.sanctionPolicy.behaviourManagementPolicy} />
            <BoolStat label="Sanctions guidance" value={data.sanctionPolicy.sanctionsGuidance} />
            <BoolStat label="Prohibited sanctions list" value={data.sanctionPolicy.prohibitedSanctionsList} />
            <BoolStat label="Child participation process" value={data.sanctionPolicy.childParticipationProcess} />
            <BoolStat label="Complaints mechanism" value={data.sanctionPolicy.complaintsMechanism} />
            <BoolStat label="Restorative approach" value={data.sanctionPolicy.restorativeApproach} />
            <BoolStat label="Regular review" value={data.sanctionPolicy.regularReview} />
          </Section>

          {/* Staff Readiness */}
          <Section title="Staff Sanction Readiness">
            <Stat label="Total staff" value={data.staffSanctionReadiness.totalStaff} />
            <Stat label="Behaviour management" value={`${data.staffSanctionReadiness.behaviourManagementRate}%`} />
            <Stat label="Proportionality assessment" value={`${data.staffSanctionReadiness.proportionalityAssessmentRate}%`} />
            <Stat label="Restorative approach" value={`${data.staffSanctionReadiness.restorativeApproachRate}%`} />
            <Stat label="Child rights awareness" value={`${data.staffSanctionReadiness.childRightsAwarenessRate}%`} />
            <Stat label="Documentation skills" value={`${data.staffSanctionReadiness.documentationSkillsRate}%`} />
            <Stat label="De-escalation first" value={`${data.staffSanctionReadiness.deEscalationFirstRate}%`} />
          </Section>

          {/* Child Sanction Profiles */}
          {data.childSanctionProfiles.length > 0 && (
            <Section title="Child Sanction Profiles">
              {data.childSanctionProfiles.map((child) => (
                <div
                  key={child.childId}
                  className="bg-gray-50 rounded-lg p-3 mb-2 last:mb-0"
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-semibold text-gray-800">
                      {child.childName}
                    </span>
                    <span className="text-sm font-bold text-gray-900">
                      {child.sanctionScore}/10
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-gray-600">
                    <span>Sanctions: {child.totalSanctions}</span>
                    <span>Types: {child.sanctionTypes.length}</span>
                    <span>Proportionate: {child.proportionateRate}%</span>
                    <span>Child views: {child.childViewsRate}%</span>
                    <span>Escalated: {child.escalatedCount}</span>
                  </div>
                </div>
              ))}
            </Section>
          )}

          {/* Strengths */}
          {data.strengths.length > 0 && (
            <Section title="Strengths">
              <ul className="space-y-1">
                {data.strengths.map((s, i) => (
                  <li
                    key={i}
                    className="text-xs text-green-700 flex items-start gap-1.5"
                  >
                    <span className="mt-0.5 shrink-0">+</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* Areas for Improvement */}
          {data.areasForImprovement.length > 0 && (
            <Section title="Areas for Improvement">
              <ul className="space-y-1">
                {data.areasForImprovement.map((a, i) => (
                  <li
                    key={i}
                    className="text-xs text-orange-700 flex items-start gap-1.5"
                  >
                    <span className="mt-0.5 shrink-0">-</span>
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* Regulatory Links */}
          <Section title="Regulatory Framework">
            <ul className="space-y-1">
              {data.regulatoryLinks.map((link, i) => (
                <li key={i} className="text-xs text-gray-600">
                  {link}
                </li>
              ))}
            </ul>
          </Section>
        </div>
      )}
    </div>
  );
}

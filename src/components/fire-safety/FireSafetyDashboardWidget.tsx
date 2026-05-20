"use client";

// ══════════════════════════════════════════════════════════════════════════════
// FIRE SAFETY DASHBOARD WIDGET
//
// Displays the 4-layer fire safety intelligence:
// - Overall score with rating
// - Layer scores: quality, compliance, policy, staff readiness
// - Child fire safety profiles
// - Strengths, areas for improvement, and actions
// - Regulatory references
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";

// ── Local interfaces (mirrors API shape) ──────────────────────────────────

interface QualityData {
  totalRecords: number;
  drillCompletedSuccessfullyRate: number;
  allChildrenAccountedRate: number;
  evacuationTimeRecordedRate: number;
  equipmentFunctionalRate: number;
  score: number;
  strengths: string[];
  concerns: string[];
}

interface ComplianceData {
  totalRecords: number;
  documentationRate: number;
  timelyRecordingRate: number;
  allChildrenAccountedRate: number;
  categoryDiversityRatio: number;
  uniqueCategories: number;
  score: number;
  strengths: string[];
  concerns: string[];
}

interface PolicyData {
  fireSafetyPolicy: boolean;
  evacuationProcedure: boolean;
  fireRiskAssessmentPolicy: boolean;
  equipmentMaintenancePolicy: boolean;
  drillFrequencyGuidance: boolean;
  emergencyLightingPolicy: boolean;
  fireAlarmTestingPolicy: boolean;
  score: number;
  strengths: string[];
  concerns: string[];
}

interface StaffReadinessData {
  totalStaff: number;
  fireWardenTrainingRate: number;
  evacuationProcedureKnowledgeRate: number;
  fireExtinguisherUseRate: number;
  fireRiskAssessmentRate: number;
  alarmSystemKnowledgeRate: number;
  firstAidFireInjuryRate: number;
  score: number;
  strengths: string[];
  concerns: string[];
}

interface ChildProfileData {
  childId: string;
  childName: string;
  totalRecords: number;
  drillCompletedSuccessfullyRate: number;
  allChildrenAccountedRate: number;
  uniqueCategories: number;
  fireSafetyScore: number;
}

interface FireSafetyData {
  homeId: string;
  assessedAt: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: string;
  quality: QualityData;
  compliance: ComplianceData;
  policy: PolicyData;
  staffReadiness: StaffReadinessData;
  childProfiles: ChildProfileData[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
  meta: { generatedAt: string; engine: string; version: string };
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
  const pct = max > 0 ? Math.round((score / max) * 100) : 0;
  const color =
    pct >= 80 ? "bg-green-500"
      : pct >= 60 ? "bg-blue-500"
        : pct >= 40 ? "bg-orange-500"
          : "bg-red-500";

  return (
    <div>
      <div className="flex justify-between text-xs mb-0.5">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium text-gray-900">{score}/{max}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
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

// ── Policy Check ──────────────────────────────────────────────────────────

function PolicyCheck({ label, value }: { label: string; value: boolean }) {
  return (
    <div className="flex justify-between items-center text-sm py-1 border-b border-gray-50 last:border-0">
      <span className="text-gray-600">{label}</span>
      <span className={value ? "text-green-700 font-medium" : "text-red-600 font-medium"}>
        {value ? "Yes" : "No"}
      </span>
    </div>
  );
}

// ── Main Widget ───────────────────────────────────────────────────────────

export default function FireSafetyDashboardWidget() {
  const [data, setData] = useState<FireSafetyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/fire-safety");
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
        <h3 className="font-semibold text-red-800">Fire Safety Intelligence</h3>
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
            Fire Safety Intelligence
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {data.periodStart} to {data.periodEnd} | {data.quality.totalRecords} records | v{data.meta?.version ?? "2.0.0"}
          </p>
        </div>
        <RatingBadge score={data.overallScore} rating={data.rating} />
      </div>

      {/* 4-Layer Score Bars */}
      <div className="space-y-2 mb-4">
        <ScoreBar label="Quality" score={data.quality.score} max={25} />
        <ScoreBar label="Compliance" score={data.compliance.score} max={25} />
        <ScoreBar label="Policy" score={data.policy.score} max={25} />
        <ScoreBar label="Staff Readiness" score={data.staffReadiness.score} max={25} />
      </div>

      {/* Priority Actions */}
      {data.actions.length > 0 && data.actions[0] !== "No immediate actions required. Fire safety systems operating within expected standards." && (
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

      {/* Child Profiles Summary */}
      {data.childProfiles.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-800 mb-2">Child Fire Safety Profiles</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {data.childProfiles.map((child) => {
              const color =
                child.fireSafetyScore >= 8 ? "border-green-200 bg-green-50"
                  : child.fireSafetyScore >= 5 ? "border-blue-200 bg-blue-50"
                    : "border-orange-200 bg-orange-50";
              return (
                <div key={child.childId} className={`rounded-lg border p-2 text-center ${color}`}>
                  <div className="text-sm font-medium text-gray-900">{child.childName}</div>
                  <div className="text-lg font-bold text-gray-800">{child.fireSafetyScore}/10</div>
                  <div className="text-xs text-gray-500">{child.totalRecords} records</div>
                </div>
              );
            })}
          </div>
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
          {/* Quality */}
          <Section title="Quality Evaluation" defaultOpen>
            <StatRow label="Total records" value={data.quality.totalRecords} />
            <StatRow label="Drill completion rate" value={`${data.quality.drillCompletedSuccessfullyRate}%`} />
            <StatRow label="Children accounted rate" value={`${data.quality.allChildrenAccountedRate}%`} />
            <StatRow label="Evacuation time recorded" value={`${data.quality.evacuationTimeRecordedRate}%`} />
            <StatRow label="Equipment functional" value={`${data.quality.equipmentFunctionalRate}%`} />
            <StatRow label="Score" value={`${data.quality.score}/25`} />
          </Section>

          {/* Compliance */}
          <Section title="Compliance Evaluation">
            <StatRow label="Documentation rate" value={`${data.compliance.documentationRate}%`} />
            <StatRow label="Timely recording rate" value={`${data.compliance.timelyRecordingRate}%`} />
            <StatRow label="Children accounted rate" value={`${data.compliance.allChildrenAccountedRate}%`} />
            <StatRow label="Category diversity" value={`${data.compliance.uniqueCategories}/8`} />
            <StatRow label="Score" value={`${data.compliance.score}/25`} />
          </Section>

          {/* Policy */}
          <Section title="Policy Framework">
            <PolicyCheck label="Fire safety policy" value={data.policy.fireSafetyPolicy} />
            <PolicyCheck label="Evacuation procedure" value={data.policy.evacuationProcedure} />
            <PolicyCheck label="Fire risk assessment policy" value={data.policy.fireRiskAssessmentPolicy} />
            <PolicyCheck label="Equipment maintenance policy" value={data.policy.equipmentMaintenancePolicy} />
            <PolicyCheck label="Drill frequency guidance" value={data.policy.drillFrequencyGuidance} />
            <PolicyCheck label="Emergency lighting policy" value={data.policy.emergencyLightingPolicy} />
            <PolicyCheck label="Fire alarm testing policy" value={data.policy.fireAlarmTestingPolicy} />
            <StatRow label="Score" value={`${data.policy.score}/25`} />
          </Section>

          {/* Staff Readiness */}
          <Section title="Staff Fire Safety Readiness">
            <StatRow label="Total staff" value={data.staffReadiness.totalStaff} />
            <StatRow label="Fire warden training" value={`${data.staffReadiness.fireWardenTrainingRate}%`} />
            <StatRow label="Evacuation procedure knowledge" value={`${data.staffReadiness.evacuationProcedureKnowledgeRate}%`} />
            <StatRow label="Fire extinguisher use" value={`${data.staffReadiness.fireExtinguisherUseRate}%`} />
            <StatRow label="Fire risk assessment" value={`${data.staffReadiness.fireRiskAssessmentRate}%`} />
            <StatRow label="Alarm system knowledge" value={`${data.staffReadiness.alarmSystemKnowledgeRate}%`} />
            <StatRow label="First aid fire injury" value={`${data.staffReadiness.firstAidFireInjuryRate}%`} />
            <StatRow label="Score" value={`${data.staffReadiness.score}/25`} />
          </Section>

          {/* Strengths / Areas / Actions */}
          {data.strengths.length > 0 && (
            <Section title="Strengths">
              {data.strengths.map((s, i) => (
                <div key={i} className="text-xs text-green-700">+ {s}</div>
              ))}
            </Section>
          )}

          {data.areasForImprovement.length > 0 && (
            <Section title="Areas for Improvement">
              {data.areasForImprovement.map((a, i) => (
                <div key={i} className="text-xs text-orange-700">- {a}</div>
              ))}
            </Section>
          )}

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

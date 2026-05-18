"use client";

// ══════════════════════════════════════════════════════════════════════════════
// FIRE SAFETY DASHBOARD WIDGET
//
// Displays fire safety intelligence for a children's home:
// - Overall score with Ofsted-aligned rating
// - Key metrics: drill compliance, equipment status, risk level, training
// - Expandable sections for detailed analysis
// - Critical alerts for out-of-service equipment, overdue inspections
// - Regulatory framework references
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";

// ── Local Type Definitions ────────────────────────────────────────────────

interface DrillComplianceEvaluation {
  totalDrills: number;
  drillsByType: Record<string, number>;
  monthlyFrequency: number;
  nightDrillsPerQuarter: number;
  meetsMonthlyTarget: boolean;
  meetsNightDrillTarget: boolean;
  averageEvacuationTimeSeconds: number | null;
  averageTargetTimeSeconds: number | null;
  evacuationOnTarget: number;
  evacuationOverTarget: number;
  evacuationTargetRate: number;
  allAccountedForRate: number;
  debriefRate: number;
  totalIssues: number;
  drillScore: number;
}

interface CriticalIssue {
  equipmentId: string;
  equipmentType: string;
  location: string;
  status: string;
  note: string;
}

interface EquipmentMaintenanceEvaluation {
  totalEquipment: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  operationalCount: number;
  operationalRate: number;
  needsRepairCount: number;
  outOfServiceCount: number;
  dueInspectionCount: number;
  overdueInspections: number;
  inspectionComplianceRate: number;
  criticalIssues: CriticalIssue[];
  equipmentScore: number;
}

interface RiskAssessmentEvaluation {
  totalAssessments: number;
  currentAssessments: number;
  overdueAssessments: number;
  currentRate: number;
  averageRiskLevel: string;
  riskLevelCounts: Record<string, number>;
  totalFindings: number;
  totalActionsRequired: number;
  totalActionsCompleted: number;
  actionCompletionRate: number;
  sharedWithStaffRate: number;
  assessmentScore: number;
}

interface TrainingAndPlanningEvaluation {
  totalStaffTrained: number;
  currentTraining: number;
  expiredTraining: number;
  trainingCurrencyRate: number;
  byTrainingType: Record<string, number>;
  passRate: number;
  hasFireMarshal: boolean;
  evacuationPlanReviewed: boolean;
  evacuationPlanAge: number | null;
  peepCoverage: number;
  peepCoverageRate: number;
  specialConsiderationsDocumented: number;
  trainingScore: number;
}

interface FireSafetyData {
  homeId: string;
  assessedAt: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: string;
  drillCompliance: DrillComplianceEvaluation;
  equipmentMaintenance: EquipmentMaintenanceEvaluation;
  riskAssessment: RiskAssessmentEvaluation;
  trainingAndPlanning: TrainingAndPlanningEvaluation;
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

// ── Metric Card ───────────────────────────────────────────────────────────

function MetricCard({ label, value, suffix }: { label: string; value: number | string; suffix?: string }) {
  const numValue = typeof value === "number" ? value : parseInt(value, 10);
  const color =
    numValue >= 80 ? "text-green-700 bg-green-50"
      : numValue >= 60 ? "text-blue-700 bg-blue-50"
        : numValue >= 40 ? "text-orange-700 bg-orange-50"
          : "text-red-700 bg-red-50";

  return (
    <div className={`rounded-lg p-3 text-center ${color}`}>
      <div className="text-2xl font-bold">{value}{suffix}</div>
      <div className="text-xs font-medium mt-0.5">{label}</div>
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

export function FireSafetyDashboardWidget() {
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
            {data.periodStart} to {data.periodEnd} | {data.drillCompliance.totalDrills} drills | {data.equipmentMaintenance.totalEquipment} equipment items
          </p>
        </div>
        <RatingBadge score={data.overallScore} rating={data.rating} />
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <MetricCard label="Drill Compliance" value={data.drillCompliance.drillScore} suffix="/25" />
        <MetricCard label="Equipment Status" value={data.equipmentMaintenance.operationalRate} suffix="%" />
        <MetricCard
          label="Risk Assessment"
          value={data.riskAssessment.totalAssessments > 0 ? data.riskAssessment.currentRate : 0}
          suffix="%"
        />
        <MetricCard label="Training Currency" value={data.trainingAndPlanning.trainingCurrencyRate} suffix="%" />
      </div>

      {/* Critical Equipment Alerts */}
      {data.equipmentMaintenance.criticalIssues.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <h4 className="text-sm font-semibold text-red-800 mb-1">Equipment Alerts</h4>
          {data.equipmentMaintenance.criticalIssues.slice(0, 3).map((issue) => (
            <div key={issue.equipmentId} className="text-xs text-red-700">
              {issue.equipmentType.replace(/_/g, " ")} ({issue.location}) — {issue.status.replace(/_/g, " ")}{issue.note ? `: ${issue.note}` : ""}
            </div>
          ))}
        </div>
      )}

      {/* Overdue Inspections Alert */}
      {data.equipmentMaintenance.overdueInspections > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
          <h4 className="text-sm font-semibold text-amber-800">
            {data.equipmentMaintenance.overdueInspections} equipment inspection(s) overdue
          </h4>
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
          {/* Drill Compliance */}
          <Section title="Drill Compliance" defaultOpen>
            <StatRow label="Total drills" value={data.drillCompliance.totalDrills} />
            <StatRow label="Monthly frequency" value={data.drillCompliance.monthlyFrequency} />
            <StatRow label="Meets monthly target" value={data.drillCompliance.meetsMonthlyTarget ? "Yes" : "No"} />
            <StatRow label="Night drills/quarter" value={data.drillCompliance.nightDrillsPerQuarter} />
            <StatRow label="Meets night drill target" value={data.drillCompliance.meetsNightDrillTarget ? "Yes" : "No"} />
            <StatRow
              label="Avg evacuation time"
              value={data.drillCompliance.averageEvacuationTimeSeconds != null
                ? `${data.drillCompliance.averageEvacuationTimeSeconds}s`
                : "N/A"}
            />
            <StatRow label="On-target evacuations" value={`${data.drillCompliance.evacuationTargetRate}%`} />
            <StatRow label="All accounted for" value={`${data.drillCompliance.allAccountedForRate}%`} />
            <StatRow label="Debrief rate" value={`${data.drillCompliance.debriefRate}%`} />
            <StatRow label="Issues identified" value={data.drillCompliance.totalIssues} />
            <StatRow label="Score" value={`${data.drillCompliance.drillScore}/25`} />
            {Object.keys(data.drillCompliance.drillsByType).length > 0 && (
              <div className="text-xs text-gray-500 mt-1">
                {Object.entries(data.drillCompliance.drillsByType).map(([type, count]) =>
                  `${type.replace(/_/g, " ")}: ${count}`,
                ).join(" | ")}
              </div>
            )}
          </Section>

          {/* Equipment Maintenance */}
          <Section title="Equipment Maintenance">
            <StatRow label="Total equipment" value={data.equipmentMaintenance.totalEquipment} />
            <StatRow label="Operational" value={data.equipmentMaintenance.operationalCount} />
            <StatRow label="Operational rate" value={`${data.equipmentMaintenance.operationalRate}%`} />
            <StatRow label="Needs repair" value={data.equipmentMaintenance.needsRepairCount} />
            <StatRow label="Out of service" value={data.equipmentMaintenance.outOfServiceCount} />
            <StatRow label="Due inspection" value={data.equipmentMaintenance.dueInspectionCount} />
            <StatRow label="Overdue inspections" value={data.equipmentMaintenance.overdueInspections} />
            <StatRow label="Inspection compliance" value={`${data.equipmentMaintenance.inspectionComplianceRate}%`} />
            <StatRow label="Score" value={`${data.equipmentMaintenance.equipmentScore}/25`} />
            {Object.keys(data.equipmentMaintenance.byType).length > 0 && (
              <div className="text-xs text-gray-500 mt-1">
                {Object.entries(data.equipmentMaintenance.byType).map(([type, count]) =>
                  `${type.replace(/_/g, " ")}: ${count}`,
                ).join(" | ")}
              </div>
            )}
          </Section>

          {/* Risk Assessment */}
          <Section title="Risk Assessment">
            <StatRow label="Total assessments" value={data.riskAssessment.totalAssessments} />
            <StatRow label="Current" value={data.riskAssessment.currentAssessments} />
            <StatRow label="Overdue" value={data.riskAssessment.overdueAssessments} />
            <StatRow label="Current rate" value={`${data.riskAssessment.currentRate}%`} />
            <StatRow label="Average risk level" value={data.riskAssessment.averageRiskLevel} />
            <StatRow label="Total findings" value={data.riskAssessment.totalFindings} />
            <StatRow label="Actions required" value={data.riskAssessment.totalActionsRequired} />
            <StatRow label="Actions completed" value={data.riskAssessment.totalActionsCompleted} />
            <StatRow label="Action completion rate" value={`${data.riskAssessment.actionCompletionRate}%`} />
            <StatRow label="Shared with staff" value={`${data.riskAssessment.sharedWithStaffRate}%`} />
            <StatRow label="Score" value={`${data.riskAssessment.assessmentScore}/25`} />
          </Section>

          {/* Training & Planning */}
          <Section title="Training & Evacuation Planning">
            <StatRow label="Staff trained" value={data.trainingAndPlanning.totalStaffTrained} />
            <StatRow label="Current training" value={data.trainingAndPlanning.currentTraining} />
            <StatRow label="Expired training" value={data.trainingAndPlanning.expiredTraining} />
            <StatRow label="Training currency" value={`${data.trainingAndPlanning.trainingCurrencyRate}%`} />
            <StatRow label="Pass rate" value={`${data.trainingAndPlanning.passRate}%`} />
            <StatRow label="Fire marshal in place" value={data.trainingAndPlanning.hasFireMarshal ? "Yes" : "No"} />
            <StatRow label="Evacuation plan reviewed" value={data.trainingAndPlanning.evacuationPlanReviewed ? "Yes" : "No"} />
            <StatRow
              label="Evacuation plan age"
              value={data.trainingAndPlanning.evacuationPlanAge != null
                ? `${data.trainingAndPlanning.evacuationPlanAge} days`
                : "N/A"}
            />
            <StatRow label="PEEP coverage" value={`${data.trainingAndPlanning.peepCoverageRate}%`} />
            <StatRow label="Special considerations" value={data.trainingAndPlanning.specialConsiderationsDocumented} />
            <StatRow label="Score" value={`${data.trainingAndPlanning.trainingScore}/25`} />
            {Object.keys(data.trainingAndPlanning.byTrainingType).length > 0 && (
              <div className="text-xs text-gray-500 mt-1">
                {Object.entries(data.trainingAndPlanning.byTrainingType).map(([type, count]) =>
                  `${type.replace(/_/g, " ")}: ${count}`,
                ).join(" | ")}
              </div>
            )}
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

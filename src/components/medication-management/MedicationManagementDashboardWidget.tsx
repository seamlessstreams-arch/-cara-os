"use client";

// ══════════════════════════════════════════════════════════════════════════════
// MEDICATION MANAGEMENT INTELLIGENCE DASHBOARD WIDGET
//
// Displays medication management intelligence:
// - Overall score and rating
// - Key metrics: Administration Accuracy, Error Rate, Stock Compliance, Self-Admin Progress
// - Expandable sections: Administration Analysis, Error Tracking, Stock Management,
//   Self-Administration Programme, Controlled Drugs Compliance,
//   Strengths/Areas/Actions, Regulatory Framework
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";

// ── Local Types ───────────────────────────────────────────────────────────

interface ChildBreakdown {
  childId: string;
  childName: string;
  total: number;
  given: number;
  refused: number;
  omitted: number;
  late: number;
  selfAdministered: number;
  errors: number;
  accuracyRate: number;
}

interface TimePattern {
  hour: string;
  count: number;
  lateCount: number;
}

interface AdminAccuracy {
  totalRecords: number;
  accuracyRate: number;
  refusalRate: number;
  lateRate: number;
  omissionRate: number;
  errorRate: number;
  selfAdminRate: number;
  perChildBreakdown: ChildBreakdown[];
  timePatterns: TimePattern[];
}

interface ErrorTrend {
  direction: string;
  firstHalfCount: number;
  secondHalfCount: number;
}

interface RepeatErrorData {
  errorType: string;
  count: number;
  childIds: string[];
}

interface ErrorAnalysis {
  totalErrors: number;
  severityBreakdown: Record<string, number>;
  errorTypeBreakdown: Record<string, number>;
  trend: ErrorTrend;
  repeatErrors: RepeatErrorData[];
  errorsWithRootCause: number;
  errorsWithoutRootCause: number;
}

interface StockMgmt {
  totalChecks: number;
  checkFrequencyPerWeek: number;
  discrepancyRate: number;
  discrepancyCount: number;
  checksWithDiscrepancy: number;
  reconciliationActions: string[];
}

interface LevelDist {
  level: string;
  count: number;
}

interface CompetencyEntry {
  competency: string;
  count: number;
}

interface SelfAdmin {
  totalAssessments: number;
  childrenProgressing: number;
  childrenAtTarget: number;
  currentLevelDistribution: LevelDist[];
  competencyAnalysis: CompetencyEntry[];
  areasForDevelopmentSummary: CompetencyEntry[];
}

interface ControlledDrugsData {
  totalRecords: number;
  witnessRate: number;
  balanceAccuracyRate: number;
  discrepancyCount: number;
}

interface ScoringBreakdown {
  administrationAccuracy: number;
  errorManagement: number;
  stockManagement: number;
  selfAdministration: number;
  controlledDrugsCompliance: number;
}

interface MedicationIntelligenceData {
  homeId: string;
  assessedAt: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: string;
  scoringBreakdown: ScoringBreakdown;
  administrationAccuracy: AdminAccuracy;
  errorAnalysis: ErrorAnalysis;
  stockManagement: StockMgmt;
  selfAdministration: SelfAdmin;
  controlledDrugs: ControlledDrugsData;
  strengths: string[];
  areasForImprovement: string[];
  recommendedActions: string[];
  regulatoryLinks: string[];
}

// ── Rating Badge ──────────────────────────────────────────────────────────

function RatingBadge({ score, rating }: { score: number; rating: string }) {
  const colorClass =
    rating === "outstanding" ? "bg-green-100 text-green-800 border-green-300"
      : rating === "good" ? "bg-blue-100 text-blue-800 border-blue-300"
        : rating === "requires_improvement" ? "bg-orange-100 text-orange-800 border-orange-300"
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

function MetricCard({ label, value, suffix, bgClass, textClass }: {
  label: string; value: number | string; suffix?: string;
  bgClass: string; textClass: string;
}) {
  return (
    <div className={`text-center p-2 rounded-lg ${bgClass}`}>
      <div className={`text-xl font-bold ${textClass}`}>
        {value}{suffix}
      </div>
      <div className="text-[10px] text-gray-500 uppercase">{label}</div>
    </div>
  );
}

// ── Expandable Section ────────────────────────────────────────────────────

function ExpandableSection({ title, children, defaultOpen = false }: {
  title: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 rounded-lg">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
      >
        <span>{title}</span>
        <span className="text-gray-400">{open ? "▲" : "▼"}</span>
      </button>
      {open && <div className="px-3 pb-3">{children}</div>}
    </div>
  );
}

// ── Self-Admin Level Label ────────────────────────────────────────────────

function selfAdminLevelLabel(level: string): string {
  const labels: Record<string, string> = {
    level_1_full_staff: "Level 1 — Full Staff",
    level_2_supervised: "Level 2 — Supervised",
    level_3_independent_checked: "Level 3 — Independent (Checked)",
    level_4_fully_independent: "Level 4 — Fully Independent",
  };
  return labels[level] ?? level;
}

// ── Error Type Label ──────────────────────────────────────────────────────

function errorTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    wrong_dose: "Wrong Dose",
    wrong_time: "Wrong Time",
    wrong_medication: "Wrong Medication",
    wrong_child: "Wrong Child",
    missed: "Missed",
    documentation_error: "Documentation Error",
    storage_error: "Storage Error",
  };
  return labels[type] ?? type;
}

// ── Main Widget ───────────────────────────────────────────────────────────

export function MedicationManagementDashboardWidget() {
  const [data, setData] = useState<MedicationIntelligenceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/medication-management");
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
        <div className="h-24 bg-gray-100 rounded" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white border border-red-200 rounded-xl p-6">
        <h3 className="font-semibold text-red-800">Medication Management Intelligence</h3>
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
            Medication Management Intelligence
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {data.administrationAccuracy.totalRecords} administrations | {data.periodStart} to {data.periodEnd} | Reg 23 &amp; SCCIF
          </p>
        </div>
        <RatingBadge score={data.overallScore} rating={data.rating} />
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <MetricCard
          label="Administration Accuracy"
          value={data.administrationAccuracy.accuracyRate}
          suffix="%"
          bgClass={data.administrationAccuracy.accuracyRate >= 95 ? "bg-green-50" : data.administrationAccuracy.accuracyRate >= 85 ? "bg-yellow-50" : "bg-red-50"}
          textClass={data.administrationAccuracy.accuracyRate >= 95 ? "text-green-700" : data.administrationAccuracy.accuracyRate >= 85 ? "text-yellow-700" : "text-red-700"}
        />
        <MetricCard
          label="Error Rate"
          value={data.administrationAccuracy.errorRate}
          suffix="%"
          bgClass={data.administrationAccuracy.errorRate === 0 ? "bg-green-50" : data.administrationAccuracy.errorRate <= 5 ? "bg-yellow-50" : "bg-red-50"}
          textClass={data.administrationAccuracy.errorRate === 0 ? "text-green-700" : data.administrationAccuracy.errorRate <= 5 ? "text-yellow-700" : "text-red-700"}
        />
        <MetricCard
          label="Stock Compliance"
          value={data.stockManagement.totalChecks > 0 ? (100 - data.stockManagement.discrepancyRate) : 0}
          suffix="%"
          bgClass={data.stockManagement.discrepancyRate === 0 ? "bg-green-50" : "bg-yellow-50"}
          textClass={data.stockManagement.discrepancyRate === 0 ? "text-green-700" : "text-yellow-700"}
        />
        <MetricCard
          label="Self-Admin Progress"
          value={data.selfAdministration.totalAssessments > 0
            ? `${data.selfAdministration.childrenAtTarget + data.selfAdministration.childrenProgressing}/${data.selfAdministration.childrenAtTarget + data.selfAdministration.childrenProgressing}`
            : "N/A"}
          bgClass="bg-blue-50"
          textClass="text-blue-700"
        />
      </div>

      {/* Expandable Sections */}
      <div className="space-y-2">
        {/* Administration Analysis */}
        <ExpandableSection title="Administration Analysis" defaultOpen>
          <div className="space-y-3">
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-center">
              <div className="p-1.5 bg-gray-50 rounded">
                <div className="text-sm font-bold">{data.administrationAccuracy.totalRecords}</div>
                <div className="text-[9px] text-gray-500 uppercase">Total</div>
              </div>
              <div className="p-1.5 bg-green-50 rounded">
                <div className="text-sm font-bold text-green-700">{data.administrationAccuracy.accuracyRate}%</div>
                <div className="text-[9px] text-gray-500 uppercase">Accuracy</div>
              </div>
              <div className="p-1.5 bg-orange-50 rounded">
                <div className="text-sm font-bold text-orange-700">{data.administrationAccuracy.refusalRate}%</div>
                <div className="text-[9px] text-gray-500 uppercase">Refusals</div>
              </div>
              <div className="p-1.5 bg-yellow-50 rounded">
                <div className="text-sm font-bold text-yellow-700">{data.administrationAccuracy.lateRate}%</div>
                <div className="text-[9px] text-gray-500 uppercase">Late</div>
              </div>
              <div className="p-1.5 bg-red-50 rounded">
                <div className="text-sm font-bold text-red-700">{data.administrationAccuracy.omissionRate}%</div>
                <div className="text-[9px] text-gray-500 uppercase">Omitted</div>
              </div>
              <div className="p-1.5 bg-blue-50 rounded">
                <div className="text-sm font-bold text-blue-700">{data.administrationAccuracy.selfAdminRate}%</div>
                <div className="text-[9px] text-gray-500 uppercase">Self-Admin</div>
              </div>
            </div>

            {/* Per-Child Breakdown */}
            <h5 className="text-xs font-semibold text-gray-600 uppercase">Per-Child Breakdown</h5>
            <div className="space-y-1">
              {data.administrationAccuracy.perChildBreakdown.map((child) => (
                <div key={child.childId} className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded">
                  <span className="font-medium">{child.childName}</span>
                  <div className="flex gap-3">
                    <span className="text-green-600">{child.accuracyRate}% accurate</span>
                    <span className="text-gray-400">{child.total} doses</span>
                    {child.refused > 0 && <span className="text-orange-600">{child.refused} refused</span>}
                    {child.late > 0 && <span className="text-yellow-600">{child.late} late</span>}
                    {child.omitted > 0 && <span className="text-red-600">{child.omitted} omitted</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ExpandableSection>

        {/* Error Tracking */}
        <ExpandableSection title="Error Tracking">
          <div className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
              <div className="p-2 bg-red-50 rounded">
                <div className="text-lg font-bold text-red-700">{data.errorAnalysis.totalErrors}</div>
                <div className="text-[9px] text-gray-500 uppercase">Total Errors</div>
              </div>
              <div className={`p-2 rounded ${data.errorAnalysis.trend.direction === "improving" ? "bg-green-50" : data.errorAnalysis.trend.direction === "worsening" ? "bg-red-50" : "bg-gray-50"}`}>
                <div className={`text-lg font-bold capitalize ${data.errorAnalysis.trend.direction === "improving" ? "text-green-700" : data.errorAnalysis.trend.direction === "worsening" ? "text-red-700" : "text-gray-700"}`}>
                  {data.errorAnalysis.trend.direction}
                </div>
                <div className="text-[9px] text-gray-500 uppercase">Trend</div>
              </div>
              <div className="p-2 bg-green-50 rounded">
                <div className="text-lg font-bold text-green-700">{data.errorAnalysis.errorsWithRootCause}</div>
                <div className="text-[9px] text-gray-500 uppercase">Root Cause Done</div>
              </div>
              <div className={`p-2 rounded ${data.errorAnalysis.errorsWithoutRootCause > 0 ? "bg-orange-50" : "bg-green-50"}`}>
                <div className={`text-lg font-bold ${data.errorAnalysis.errorsWithoutRootCause > 0 ? "text-orange-700" : "text-green-700"}`}>
                  {data.errorAnalysis.errorsWithoutRootCause}
                </div>
                <div className="text-[9px] text-gray-500 uppercase">Awaiting RCA</div>
              </div>
            </div>

            {/* Severity Breakdown */}
            {data.errorAnalysis.totalErrors > 0 && (
              <div>
                <h5 className="text-xs font-semibold text-gray-600 uppercase mb-1">By Severity</h5>
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(data.errorAnalysis.severityBreakdown)
                    .filter(([, count]) => count > 0)
                    .map(([severity, count]) => {
                      const color = severity === "critical" ? "bg-red-100 text-red-800"
                        : severity === "significant" ? "bg-orange-100 text-orange-800"
                          : severity === "moderate" ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800";
                      return (
                        <span key={severity} className={`text-xs px-2 py-1 rounded capitalize ${color}`}>
                          {severity}: {count}
                        </span>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Error Type Breakdown */}
            {data.errorAnalysis.totalErrors > 0 && (
              <div>
                <h5 className="text-xs font-semibold text-gray-600 uppercase mb-1">By Type</h5>
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(data.errorAnalysis.errorTypeBreakdown)
                    .filter(([, count]) => count > 0)
                    .map(([type, count]) => (
                      <span key={type} className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">
                        {errorTypeLabel(type)}: {count}
                      </span>
                    ))}
                </div>
              </div>
            )}
          </div>
        </ExpandableSection>

        {/* Stock Management */}
        <ExpandableSection title="Stock Management">
          <div className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
              <div className="p-2 bg-blue-50 rounded">
                <div className="text-lg font-bold text-blue-700">{data.stockManagement.totalChecks}</div>
                <div className="text-[9px] text-gray-500 uppercase">Stock Checks</div>
              </div>
              <div className="p-2 bg-blue-50 rounded">
                <div className="text-lg font-bold text-blue-700">{data.stockManagement.checkFrequencyPerWeek}/wk</div>
                <div className="text-[9px] text-gray-500 uppercase">Frequency</div>
              </div>
              <div className={`p-2 rounded ${data.stockManagement.discrepancyCount === 0 ? "bg-green-50" : "bg-orange-50"}`}>
                <div className={`text-lg font-bold ${data.stockManagement.discrepancyCount === 0 ? "text-green-700" : "text-orange-700"}`}>
                  {data.stockManagement.discrepancyCount}
                </div>
                <div className="text-[9px] text-gray-500 uppercase">Discrepancies</div>
              </div>
              <div className={`p-2 rounded ${data.stockManagement.discrepancyRate === 0 ? "bg-green-50" : "bg-orange-50"}`}>
                <div className={`text-lg font-bold ${data.stockManagement.discrepancyRate === 0 ? "text-green-700" : "text-orange-700"}`}>
                  {data.stockManagement.discrepancyRate}%
                </div>
                <div className="text-[9px] text-gray-500 uppercase">Discrepancy Rate</div>
              </div>
            </div>

            {data.stockManagement.reconciliationActions.length > 0 && (
              <div>
                <h5 className="text-xs font-semibold text-gray-600 uppercase mb-1">Reconciliation Actions</h5>
                <ul className="space-y-1">
                  {data.stockManagement.reconciliationActions.map((action, i) => (
                    <li key={i} className="text-xs text-gray-700 bg-gray-50 p-2 rounded">{action}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </ExpandableSection>

        {/* Self-Administration Programme */}
        <ExpandableSection title="Self-Administration Programme">
          {data.selfAdministration.totalAssessments === 0 ? (
            <p className="text-xs text-gray-500">No self-administration assessments recorded.</p>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 bg-blue-50 rounded">
                  <div className="text-lg font-bold text-blue-700">{data.selfAdministration.totalAssessments}</div>
                  <div className="text-[9px] text-gray-500 uppercase">Assessments</div>
                </div>
                <div className="p-2 bg-green-50 rounded">
                  <div className="text-lg font-bold text-green-700">{data.selfAdministration.childrenProgressing}</div>
                  <div className="text-[9px] text-gray-500 uppercase">Progressing</div>
                </div>
                <div className="p-2 bg-green-50 rounded">
                  <div className="text-lg font-bold text-green-700">{data.selfAdministration.childrenAtTarget}</div>
                  <div className="text-[9px] text-gray-500 uppercase">At Target</div>
                </div>
              </div>

              {/* Level Distribution */}
              {data.selfAdministration.currentLevelDistribution.length > 0 && (
                <div>
                  <h5 className="text-xs font-semibold text-gray-600 uppercase mb-1">Current Levels</h5>
                  <div className="flex gap-2 flex-wrap">
                    {data.selfAdministration.currentLevelDistribution.map((ld) => (
                      <span key={ld.level} className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">
                        {selfAdminLevelLabel(ld.level)}: {ld.count}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Competencies */}
              {data.selfAdministration.competencyAnalysis.length > 0 && (
                <div>
                  <h5 className="text-xs font-semibold text-gray-600 uppercase mb-1">Competencies Demonstrated</h5>
                  <div className="flex gap-1 flex-wrap">
                    {data.selfAdministration.competencyAnalysis.map((c) => (
                      <span key={c.competency} className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-700">
                        {c.competency}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </ExpandableSection>

        {/* Controlled Drugs Compliance */}
        <ExpandableSection title="Controlled Drugs Compliance">
          {data.controlledDrugs.totalRecords === 0 ? (
            <p className="text-xs text-gray-500">No controlled drug records for this period.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 bg-blue-50 rounded">
                <div className="text-lg font-bold text-blue-700">{data.controlledDrugs.totalRecords}</div>
                <div className="text-[9px] text-gray-500 uppercase">CD Records</div>
              </div>
              <div className={`p-2 rounded ${data.controlledDrugs.witnessRate === 100 ? "bg-green-50" : "bg-red-50"}`}>
                <div className={`text-lg font-bold ${data.controlledDrugs.witnessRate === 100 ? "text-green-700" : "text-red-700"}`}>
                  {data.controlledDrugs.witnessRate}%
                </div>
                <div className="text-[9px] text-gray-500 uppercase">Witnessed</div>
              </div>
              <div className={`p-2 rounded ${data.controlledDrugs.balanceAccuracyRate === 100 ? "bg-green-50" : "bg-red-50"}`}>
                <div className={`text-lg font-bold ${data.controlledDrugs.balanceAccuracyRate === 100 ? "text-green-700" : "text-red-700"}`}>
                  {data.controlledDrugs.balanceAccuracyRate}%
                </div>
                <div className="text-[9px] text-gray-500 uppercase">Balance Accurate</div>
              </div>
            </div>
          )}
        </ExpandableSection>

        {/* Strengths / Areas / Actions */}
        <ExpandableSection title="Strengths, Areas for Improvement & Actions">
          <div className="space-y-3">
            {data.strengths.length > 0 && (
              <div>
                <h5 className="text-sm font-semibold text-green-800 mb-1">Strengths</h5>
                <ul className="space-y-1">
                  {data.strengths.map((s, i) => (
                    <li key={i} className="text-xs text-green-700">+ {s}</li>
                  ))}
                </ul>
              </div>
            )}

            {data.areasForImprovement.length > 0 && (
              <div>
                <h5 className="text-sm font-semibold text-orange-800 mb-1">Areas for Improvement</h5>
                <ul className="space-y-1">
                  {data.areasForImprovement.map((a, i) => (
                    <li key={i} className="text-xs text-orange-700">- {a}</li>
                  ))}
                </ul>
              </div>
            )}

            {data.recommendedActions.length > 0 && (
              <div>
                <h5 className="text-sm font-semibold text-blue-800 mb-1">Recommended Actions</h5>
                <ul className="space-y-1">
                  {data.recommendedActions.map((a, i) => (
                    <li key={i} className="text-xs text-blue-700 flex items-start gap-1.5">
                      <span className="mt-0.5 shrink-0">
                        {a.startsWith("URGENT") ? "🔴" : "🔵"}
                      </span>
                      <span>{a}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </ExpandableSection>

        {/* Regulatory Framework */}
        <ExpandableSection title="Regulatory Framework">
          {data.regulatoryLinks.length > 0 && (
            <ul className="space-y-1">
              {data.regulatoryLinks.map((link, i) => (
                <li key={i} className="text-xs text-gray-600">{link}</li>
              ))}
            </ul>
          )}
        </ExpandableSection>
      </div>

      {/* Scoring Breakdown Footer */}
      <div className="mt-4 pt-3 border-t border-gray-100">
        <div className="flex items-center justify-between text-[10px] text-gray-400 uppercase">
          <span>Admin: {data.scoringBreakdown.administrationAccuracy.toFixed(1)}/35</span>
          <span>Errors: {data.scoringBreakdown.errorManagement.toFixed(1)}/20</span>
          <span>Stock: {data.scoringBreakdown.stockManagement.toFixed(1)}/15</span>
          <span>Self-Admin: {data.scoringBreakdown.selfAdministration.toFixed(1)}/15</span>
          <span>CD: {data.scoringBreakdown.controlledDrugsCompliance.toFixed(1)}/15</span>
        </div>
      </div>
    </div>
  );
}

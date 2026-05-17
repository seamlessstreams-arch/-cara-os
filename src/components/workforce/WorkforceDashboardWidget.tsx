// ══════════════════════════════════════════════════════════════════════════════
// WorkforceDashboardWidget — Live workforce compliance & shift safety overview
//
// Fetches from /api/workforce and displays:
//   - Overall compliance status with staff count
//   - Key compliance metrics (DBS, qualifications, training, supervision)
//   - Per-staff compliance status with drill-down issues
//   - Agency reliance warning
//   - Link to full workforce management page
// ══════════════════════════════════════════════════════════════════════════════

"use client";

import { useEffect, useState } from "react";

interface StaffComplianceSummary {
  staffId: string;
  name: string;
  role: string;
  status: "compliant" | "action_needed" | "non_compliant" | "critical";
  issues: string[];
  dbsCurrent: boolean;
  qualificationMet: boolean;
  trainingCurrent: boolean;
  supervisionCurrent: boolean;
}

interface WorkforceData {
  metrics: {
    homeId: string;
    totalStaff: number;
    permanentStaff: number;
    agencyStaff: number;
    agencyPercentage: number;
    averageQualificationLevel: number;
    qualificationTargetMet: number;
    dbsCompliance: number;
    mandatoryTrainingCompliance: number;
    supervisionCompliance: number;
    averageTenureMonths: number;
    turnoverRate: number;
    vacancies: number;
    overallCompliance: string;
    shiftCoverage: {
      totalShiftsThisMonth: number;
      coveredShifts: number;
      uncoveredShifts: number;
      coverageRate: number;
      agencyShifts: number;
      bankShifts: number;
    };
  };
  compliance: {
    homeId: string;
    overallStatus: "compliant" | "action_needed" | "non_compliant" | "critical";
    issues: string[];
    staffCount: number;
    fullyCompliant: number;
    actionNeeded: number;
    nonCompliant: number;
    dbsOverdue: number;
    qualificationsBelowTarget: number;
    trainingOverdue: number;
    supervisionOverdue: number;
    agencyPercentage: number;
    byStaff: StaffComplianceSummary[];
  };
  staffCount: number;
}

interface Props {
  homeId?: string;
}

const STATUS_STYLES: Record<string, string> = {
  compliant: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  action_needed: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  non_compliant: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  critical: "bg-red-200 text-red-900 dark:bg-red-900/50 dark:text-red-200",
};

const STATUS_LABELS: Record<string, string> = {
  compliant: "Compliant",
  action_needed: "Action Needed",
  non_compliant: "Non-Compliant",
  critical: "Critical",
};

const ROLE_LABELS: Record<string, string> = {
  registered_manager: "RM",
  deputy_manager: "Deputy",
  senior_support_worker: "Senior SW",
  support_worker: "SW",
  waking_night_worker: "WN",
  bank_staff: "Bank",
  agency_staff: "Agency",
};

export function WorkforceDashboardWidget({ homeId = "home-001" }: Props) {
  const [data, setData] = useState<WorkforceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [homeId]);

  async function fetchData() {
    try {
      const res = await fetch(`/api/workforce?homeId=${homeId}`);
      const json = await res.json();
      setData(json);
    } catch {
      // noop
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 animate-pulse">
        <div className="h-4 w-32 bg-muted rounded mb-4" />
        <div className="space-y-2">
          <div className="h-3 w-full bg-muted rounded" />
          <div className="h-3 w-3/4 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { metrics, compliance } = data;

  return (
    <div className="rounded-lg border border-border bg-card">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zM12.75 12a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold">Workforce Compliance</h3>
              <p className="text-xs text-muted-foreground">
                {metrics.totalStaff} staff ({metrics.permanentStaff} perm, {metrics.agencyStaff} agency)
              </p>
            </div>
          </div>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[compliance.overallStatus] ?? ""}`}>
            {STATUS_LABELS[compliance.overallStatus] ?? compliance.overallStatus}
          </span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-px bg-border">
        <MetricCell
          label="DBS"
          value={`${metrics.dbsCompliance}%`}
          alert={metrics.dbsCompliance < 100}
        />
        <MetricCell
          label="Quals"
          value={`${metrics.qualificationTargetMet}%`}
          alert={metrics.qualificationTargetMet < 80}
        />
        <MetricCell
          label="Training"
          value={`${metrics.mandatoryTrainingCompliance}%`}
          alert={metrics.mandatoryTrainingCompliance < 90}
        />
        <MetricCell
          label="Supervision"
          value={`${metrics.supervisionCompliance}%`}
          alert={metrics.supervisionCompliance < 100}
        />
      </div>

      {/* Compliance Summary Bar */}
      <div className="px-4 py-3 border-t border-border">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-xs text-muted-foreground">Staff compliance:</span>
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
            {compliance.fullyCompliant} ok
          </span>
          {compliance.actionNeeded > 0 && (
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
              {compliance.actionNeeded} action
            </span>
          )}
          {compliance.nonCompliant > 0 && (
            <span className="text-xs font-medium text-red-600 dark:text-red-400">
              {compliance.nonCompliant} non-compliant
            </span>
          )}
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden flex">
          {compliance.fullyCompliant > 0 && (
            <div
              className="bg-emerald-500 h-full"
              style={{ width: `${(compliance.fullyCompliant / compliance.staffCount) * 100}%` }}
            />
          )}
          {compliance.actionNeeded > 0 && (
            <div
              className="bg-amber-500 h-full"
              style={{ width: `${(compliance.actionNeeded / compliance.staffCount) * 100}%` }}
            />
          )}
          {compliance.nonCompliant > 0 && (
            <div
              className="bg-red-500 h-full"
              style={{ width: `${(compliance.nonCompliant / compliance.staffCount) * 100}%` }}
            />
          )}
        </div>
      </div>

      {/* Per-staff Issues */}
      <div className="divide-y divide-border">
        {compliance.byStaff
          .filter(s => s.status !== "compliant")
          .slice(0, 5)
          .map(staff => (
            <div key={staff.staffId} className="px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StatusDot status={staff.status} />
                <div>
                  <p className="text-xs font-medium">{staff.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {ROLE_LABELS[staff.role] ?? staff.role}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {!staff.dbsCurrent && <ComplianceBadge label="DBS" />}
                {!staff.qualificationMet && <ComplianceBadge label="Qual" />}
                {!staff.trainingCurrent && <ComplianceBadge label="Train" />}
                {!staff.supervisionCurrent && <ComplianceBadge label="Supv" />}
              </div>
            </div>
          ))}
      </div>

      {/* Overdue counts */}
      {(compliance.dbsOverdue > 0 || compliance.trainingOverdue > 0 || compliance.supervisionOverdue > 0) && (
        <div className="border-t border-border bg-amber-50/50 dark:bg-amber-900/10 p-3">
          <div className="flex flex-wrap gap-3">
            {compliance.dbsOverdue > 0 && (
              <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
                {compliance.dbsOverdue} DBS overdue
              </p>
            )}
            {compliance.trainingOverdue > 0 && (
              <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
                {compliance.trainingOverdue} training overdue
              </p>
            )}
            {compliance.supervisionOverdue > 0 && (
              <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
                {compliance.supervisionOverdue} supervision overdue
              </p>
            )}
          </div>
        </div>
      )}

      {/* Agency Warning */}
      {metrics.agencyPercentage > 25 && (
        <div className="border-t border-border bg-orange-50/50 dark:bg-orange-900/10 p-3">
          <p className="text-xs font-medium text-orange-700 dark:text-orange-400">
            Agency reliance at {metrics.agencyPercentage}% — Ofsted expect &lt;25%
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="p-3 border-t border-border text-center">
        <a href="/workforce" className="text-xs text-primary font-medium hover:underline">
          View workforce management →
        </a>
      </div>
    </div>
  );
}

function MetricCell({ label, value, alert }: { label: string; value: string; alert: boolean }) {
  return (
    <div className="bg-card p-3 text-center">
      <p className={`text-lg font-bold ${alert ? "text-amber-600 dark:text-amber-400" : ""}`}>
        {value}
      </p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    action_needed: "bg-amber-500",
    non_compliant: "bg-red-500",
    critical: "bg-red-700",
  };
  return <span className={`w-2 h-2 rounded-full ${colors[status] ?? "bg-gray-400"}`} />;
}

function ComplianceBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
      {label}
    </span>
  );
}

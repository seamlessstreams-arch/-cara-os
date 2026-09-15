"use client";

import { formatRate } from "@/lib/metrics/rate";
import { useEffect, useState } from "react";

// ── Local Interfaces (mirror engine types for client) ──────────────────────

interface StaffDeploymentProfile {
  staffId: string;
  staffName: string;
  role: string;
  contractType: string;
  keyChildrenCount: number;
  shiftsWorked: number;
  isAgency: boolean;
  isBank: boolean;
  riskFlags: string[];
}

interface RegulatoryLink {
  regulation: string;
  requirement: string;
  status: "met" | "partially_met" | "not_met";
  evidence: string;
}

interface ChildConsistencyDetail {
  childId: string;
  primaryKeyWorker: string;
  secondaryKeyWorker: string;
  staffContactCount: number;
  uniqueStaffCount: number;
  consistencyScore: number;
}

interface DeploymentData {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  generatedAt: string;
  overallScore: number;
  overallRating: string;
  componentScores: {
    staffingAdequacy: number;
    agencyMinimisation: number;
    consistencyOfCare: number;
    rotaCompliance: number;
    incidentManagement: number;
  };
  staffingAdequacy: {
    fillRate: number;
    averageStaffChildRatio: number;
    shiftsUnderstaffed: number;
    shiftsFilled: number;
    shiftsTotal: number;
    seniorOnShiftRate: number;
    statusBreakdown: Record<string, number>;
  };
  agencyMinimisation: {
    agencyUsageRate: number;
    agencyShiftsCount: number;
    briefingCompletionRate: number;
    childrenKnownRate: number;
    totalShiftStaff: number;
    agencyReasons: Record<string, number>;
  };
  consistencyOfCare: {
    averageUniqueStaffPerChild: number;
    keyWorkerCoverage: number;
    secondaryKeyWorkerCoverage: number;
    averageContactsPerChild: number;
    childConsistencyDetails: ChildConsistencyDetail[];
  };
  rotaCompliance: {
    rotaPublishedOnTimeRate: number;
    shiftTypeDistribution: Record<string, number>;
    longDayComplianceRate: number;
    nightCoverRate: number;
  };
  incidentManagement: {
    totalIncidents: number;
    incidentsByType: Record<string, number>;
    loneWorkingIncidents: number;
    understaffedIncidents: number;
    noSeniorIncidents: number;
    unplannedAbsenceIncidents: number;
    resolutionRate: number;
  };
  strengths: string[];
  areasForImprovement: string[];
  recommendedActions: string[];
  regulatoryLinks: RegulatoryLink[];
  staffProfiles: StaffDeploymentProfile[];
}

// ── Styles ─────────────────────────────────────────────────────────────────

const RATING_STYLES: Record<string, string> = {
  outstanding: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  good: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  requires_improvement: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  inadequate: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

const STATUS_STYLES: Record<string, string> = {
  met: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  partially_met: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  not_met: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

const STATUS_LABELS: Record<string, string> = {
  met: "Met",
  partially_met: "Partial",
  not_met: "Not Met",
};

// ── Component ──────────────────────────────────────────────────────────────

interface Props {
  homeId?: string;
}

export function StaffDeploymentDashboardWidget({ homeId = "home-oak" }: Props) {
  const [data, setData] = useState<DeploymentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchData();
  }, [homeId]);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/staff-deployment`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  function toggleSection(key: string) {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  }

  // Loading state
  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 animate-pulse">
        <div className="h-4 w-48 bg-muted rounded mb-4" />
        <div className="space-y-2">
          <div className="h-3 w-full bg-muted rounded" />
          <div className="h-3 w-3/4 bg-muted rounded" />
          <div className="h-3 w-1/2 bg-muted rounded" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/10 p-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-red-600 dark:text-red-400 font-medium text-sm">Failed to load deployment data</span>
        </div>
        <p className="text-xs text-red-500 dark:text-red-400">{error}</p>
        <button onClick={fetchData} className="mt-3 text-xs text-primary font-medium hover:underline">
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="rounded-lg border border-border bg-card">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold">Staff Deployment</h3>
              <p className="text-xs text-muted-foreground">Staffing adequacy, agency use & consistency</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-medium ${RATING_STYLES[data.overallRating] ?? ""}`}>
              {data.overallRating.replace("_", " ")}
            </span>
            <span className="text-lg font-bold">{data.overallScore}</span>
            <span className="text-[10px] text-muted-foreground">/100</span>
          </div>
        </div>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-4 divide-x divide-border border-b border-border">
        <div className="p-3 text-center">
          <p className={`text-lg font-bold ${data.staffingAdequacy.fillRate >= 90 ? "text-emerald-600 dark:text-emerald-400" : data.staffingAdequacy.fillRate >= 70 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"}`}>
            {formatRate(data.staffingAdequacy.fillRate)}
          </p>
          <p className="text-[10px] text-muted-foreground">Fill Rate</p>
        </div>
        <div className="p-3 text-center">
          <p className={`text-lg font-bold ${data.agencyMinimisation.agencyUsageRate <= 10 ? "text-emerald-600 dark:text-emerald-400" : data.agencyMinimisation.agencyUsageRate <= 20 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"}`}>
            {formatRate(data.agencyMinimisation.agencyUsageRate)}
          </p>
          <p className="text-[10px] text-muted-foreground">Agency Usage</p>
        </div>
        <div className="p-3 text-center">
          <p className={`text-lg font-bold ${data.consistencyOfCare.averageUniqueStaffPerChild <= 5 ? "text-emerald-600 dark:text-emerald-400" : data.consistencyOfCare.averageUniqueStaffPerChild <= 8 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"}`}>
            {data.consistencyOfCare.averageUniqueStaffPerChild}
          </p>
          <p className="text-[10px] text-muted-foreground">Avg Unique Staff/Child</p>
        </div>
        <div className="p-3 text-center">
          <p className={`text-lg font-bold ${data.incidentManagement.totalIncidents === 0 ? "text-emerald-600 dark:text-emerald-400" : data.incidentManagement.totalIncidents <= 3 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"}`}>
            {data.incidentManagement.totalIncidents}
          </p>
          <p className="text-[10px] text-muted-foreground">Incidents</p>
        </div>
      </div>

      {/* Component Scores */}
      <div className="px-4 py-3 border-b border-border">
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-2">Component Scores</p>
        <div className="space-y-1.5">
          {[
            { label: "Staffing Adequacy", score: data.componentScores.staffingAdequacy, max: 25 },
            { label: "Agency Minimisation", score: data.componentScores.agencyMinimisation, max: 20 },
            { label: "Consistency of Care", score: data.componentScores.consistencyOfCare, max: 25 },
            { label: "Rota Compliance", score: data.componentScores.rotaCompliance, max: 15 },
            { label: "Incident Management", score: data.componentScores.incidentManagement, max: 15 },
          ].map(({ label, score, max }) => (
            <div key={label} className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground w-32 shrink-0">{label}</span>
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${score / max >= 0.75 ? "bg-emerald-500" : score / max >= 0.5 ? "bg-amber-500" : "bg-red-500"}`}
                  style={{ width: `${(score / max) * 100}%` }}
                />
              </div>
              <span className="text-[10px] font-medium w-8 text-right">{score}/{max}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Expandable: Staff Profiles */}
      <div className="border-b border-border">
        <button
          onClick={() => toggleSection("profiles")}
          className="w-full px-4 py-2.5 flex items-center justify-between bg-muted/30 hover:bg-muted/50 transition-colors"
        >
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Staff Profiles</span>
          <span className="text-[10px] text-muted-foreground">{expanded.profiles ? "v" : ">"}</span>
        </button>
        {expanded.profiles && (
          <div className="divide-y divide-border">
            {data.staffProfiles.map(p => (
              <div key={p.staffId} className="px-4 py-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium">{p.staffName}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] px-1 py-0.5 rounded bg-muted">{p.role.replace(/_/g, " ")}</span>
                    {p.isAgency && (
                      <span className="text-[9px] px-1 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">agency</span>
                    )}
                    {p.isBank && (
                      <span className="text-[9px] px-1 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">bank</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-3 text-[10px] text-muted-foreground">
                  <span>{p.shiftsWorked} shifts</span>
                  <span>{p.keyChildrenCount} key children</span>
                  <span>{p.contractType}</span>
                </div>
                {p.riskFlags.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {p.riskFlags.map((flag, i) => (
                      <span key={i} className="text-[9px] px-1 py-0.5 rounded bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400">{flag}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Expandable: Staffing Adequacy */}
      <div className="border-b border-border">
        <button
          onClick={() => toggleSection("adequacy")}
          className="w-full px-4 py-2.5 flex items-center justify-between bg-muted/30 hover:bg-muted/50 transition-colors"
        >
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Staffing Adequacy</span>
          <span className="text-[10px] text-muted-foreground">{expanded.adequacy ? "v" : ">"}</span>
        </button>
        {expanded.adequacy && (
          <div className="px-4 py-3 space-y-2">
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="flex justify-between"><span className="text-muted-foreground">Fill rate</span><span className="font-medium">{formatRate(data.staffingAdequacy.fillRate)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Staff:child ratio</span><span className="font-medium">{data.staffingAdequacy.averageStaffChildRatio}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Total shifts</span><span className="font-medium">{data.staffingAdequacy.shiftsTotal}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Unfilled shifts</span><span className={`font-medium ${data.staffingAdequacy.shiftsUnderstaffed > 0 ? "text-red-600 dark:text-red-400" : ""}`}>{data.staffingAdequacy.shiftsUnderstaffed}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Senior on shift</span><span className="font-medium">{formatRate(data.staffingAdequacy.seniorOnShiftRate)}</span></div>
            </div>
            <div className="mt-2">
              <p className="text-[10px] font-medium text-muted-foreground mb-1">Status breakdown</p>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(data.staffingAdequacy.statusBreakdown).map(([status, count]) => (
                  <span key={status} className="px-1.5 py-0.5 rounded bg-muted text-[9px]">
                    {status.replace(/_/g, " ")} ({count})
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Expandable: Agency Minimisation */}
      <div className="border-b border-border">
        <button
          onClick={() => toggleSection("agency")}
          className="w-full px-4 py-2.5 flex items-center justify-between bg-muted/30 hover:bg-muted/50 transition-colors"
        >
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Agency Minimisation</span>
          <span className="text-[10px] text-muted-foreground">{expanded.agency ? "v" : ">"}</span>
        </button>
        {expanded.agency && (
          <div className="px-4 py-3 space-y-2 text-[10px]">
            <div className="grid grid-cols-2 gap-2">
              <div className="flex justify-between"><span className="text-muted-foreground">Agency usage rate</span><span className="font-medium">{formatRate(data.agencyMinimisation.agencyUsageRate)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Agency shifts</span><span className="font-medium">{data.agencyMinimisation.agencyShiftsCount}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Briefing completion</span><span className="font-medium">{formatRate(data.agencyMinimisation.briefingCompletionRate)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Children known</span><span className="font-medium">{formatRate(data.agencyMinimisation.childrenKnownRate)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Total shift staff</span><span className="font-medium">{data.agencyMinimisation.totalShiftStaff}</span></div>
            </div>
            {Object.keys(data.agencyMinimisation.agencyReasons).length > 0 && (
              <div className="mt-2">
                <p className="text-[10px] font-medium text-muted-foreground mb-1">Agency reasons</p>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(data.agencyMinimisation.agencyReasons).map(([reason, count]) => (
                    <span key={reason} className="px-1.5 py-0.5 rounded bg-muted text-[9px]">
                      {reason.replace(/_/g, " ")} ({count})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Expandable: Consistency of Care */}
      <div className="border-b border-border">
        <button
          onClick={() => toggleSection("consistency")}
          className="w-full px-4 py-2.5 flex items-center justify-between bg-muted/30 hover:bg-muted/50 transition-colors"
        >
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Consistency of Care</span>
          <span className="text-[10px] text-muted-foreground">{expanded.consistency ? "v" : ">"}</span>
        </button>
        {expanded.consistency && (
          <div className="px-4 py-3 space-y-2 text-[10px]">
            <div className="grid grid-cols-2 gap-2">
              <div className="flex justify-between"><span className="text-muted-foreground">Key worker coverage</span><span className="font-medium">{data.consistencyOfCare.keyWorkerCoverage}%</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Secondary KW coverage</span><span className="font-medium">{data.consistencyOfCare.secondaryKeyWorkerCoverage}%</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Avg unique staff/child</span><span className="font-medium">{data.consistencyOfCare.averageUniqueStaffPerChild}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Avg contacts/child</span><span className="font-medium">{data.consistencyOfCare.averageContactsPerChild}</span></div>
            </div>
            <div className="mt-2 divide-y divide-border">
              {data.consistencyOfCare.childConsistencyDetails.map(cd => (
                <div key={cd.childId} className="py-1.5">
                  <div className="flex justify-between">
                    <span className="font-medium">{cd.childId.replace("child-", "").replace(/^\w/, c => c.toUpperCase())}</span>
                    <span className={`font-medium ${cd.consistencyScore >= 80 ? "text-emerald-600 dark:text-emerald-400" : cd.consistencyScore >= 60 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"}`}>
                      {cd.consistencyScore}/100
                    </span>
                  </div>
                  <div className="flex gap-3 text-muted-foreground">
                    <span>KW: {cd.primaryKeyWorker || "None"}</span>
                    <span>{cd.uniqueStaffCount} unique staff</span>
                    <span>{cd.staffContactCount} contacts</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Expandable: Rota Compliance */}
      <div className="border-b border-border">
        <button
          onClick={() => toggleSection("rota")}
          className="w-full px-4 py-2.5 flex items-center justify-between bg-muted/30 hover:bg-muted/50 transition-colors"
        >
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Rota Compliance</span>
          <span className="text-[10px] text-muted-foreground">{expanded.rota ? "v" : ">"}</span>
        </button>
        {expanded.rota && (
          <div className="px-4 py-3 space-y-2 text-[10px]">
            <div className="grid grid-cols-2 gap-2">
              <div className="flex justify-between"><span className="text-muted-foreground">Published on time</span><span className="font-medium">{formatRate(data.rotaCompliance.rotaPublishedOnTimeRate)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Night cover rate</span><span className="font-medium">{formatRate(data.rotaCompliance.nightCoverRate)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Long day compliance</span><span className="font-medium">{formatRate(data.rotaCompliance.longDayComplianceRate)}</span></div>
            </div>
            <div className="mt-2">
              <p className="text-[10px] font-medium text-muted-foreground mb-1">Shift type distribution</p>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(data.rotaCompliance.shiftTypeDistribution).map(([type, count]) => (
                  <span key={type} className="px-1.5 py-0.5 rounded bg-muted text-[9px]">
                    {type.replace(/_/g, " ")} ({count})
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Expandable: Incident Management */}
      <div className="border-b border-border">
        <button
          onClick={() => toggleSection("incidents")}
          className="w-full px-4 py-2.5 flex items-center justify-between bg-muted/30 hover:bg-muted/50 transition-colors"
        >
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Incident Management</span>
          <span className="text-[10px] text-muted-foreground">{expanded.incidents ? "v" : ">"}</span>
        </button>
        {expanded.incidents && (
          <div className="px-4 py-3 space-y-2 text-[10px]">
            <div className="grid grid-cols-2 gap-2">
              <div className="flex justify-between"><span className="text-muted-foreground">Total incidents</span><span className={`font-medium ${data.incidentManagement.totalIncidents > 0 ? "text-amber-600 dark:text-amber-400" : ""}`}>{data.incidentManagement.totalIncidents}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Resolution rate</span><span className="font-medium">{formatRate(data.incidentManagement.resolutionRate)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Lone working</span><span className={`font-medium ${data.incidentManagement.loneWorkingIncidents > 0 ? "text-red-600 dark:text-red-400" : ""}`}>{data.incidentManagement.loneWorkingIncidents}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Understaffed</span><span className={`font-medium ${data.incidentManagement.understaffedIncidents > 0 ? "text-amber-600 dark:text-amber-400" : ""}`}>{data.incidentManagement.understaffedIncidents}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">No senior on shift</span><span className={`font-medium ${data.incidentManagement.noSeniorIncidents > 0 ? "text-red-600 dark:text-red-400" : ""}`}>{data.incidentManagement.noSeniorIncidents}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Unplanned absence</span><span className="font-medium">{data.incidentManagement.unplannedAbsenceIncidents}</span></div>
            </div>
            {Object.keys(data.incidentManagement.incidentsByType).length > 0 && (
              <div className="mt-2">
                <p className="text-[10px] font-medium text-muted-foreground mb-1">Incidents by type</p>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(data.incidentManagement.incidentsByType).map(([type, count]) => (
                    <span key={type} className="px-1.5 py-0.5 rounded bg-muted text-[9px]">
                      {type.replace(/_/g, " ")} ({count})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Expandable: Strengths / Areas / Actions */}
      <div className="border-b border-border">
        <button
          onClick={() => toggleSection("insights")}
          className="w-full px-4 py-2.5 flex items-center justify-between bg-muted/30 hover:bg-muted/50 transition-colors"
        >
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Strengths / Areas / Actions</span>
          <span className="text-[10px] text-muted-foreground">{expanded.insights ? "v" : ">"}</span>
        </button>
        {expanded.insights && (
          <div className="px-4 py-3 space-y-3">
            {data.strengths.length > 0 && (
              <div>
                <p className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 mb-1">Strengths</p>
                <ul className="space-y-0.5">
                  {data.strengths.map((s, i) => (
                    <li key={i} className="text-[10px] text-muted-foreground flex gap-1"><span className="text-emerald-500">+</span> {s}</li>
                  ))}
                </ul>
              </div>
            )}
            {data.areasForImprovement.length > 0 && (
              <div>
                <p className="text-[10px] font-medium text-amber-600 dark:text-amber-400 mb-1">Areas for Improvement</p>
                <ul className="space-y-0.5">
                  {data.areasForImprovement.map((a, i) => (
                    <li key={i} className="text-[10px] text-muted-foreground flex gap-1"><span className="text-amber-500">!</span> {a}</li>
                  ))}
                </ul>
              </div>
            )}
            {data.recommendedActions.length > 0 && (
              <div>
                <p className="text-[10px] font-medium text-blue-600 dark:text-blue-400 mb-1">Recommended Actions</p>
                <ul className="space-y-0.5">
                  {data.recommendedActions.map((a, i) => (
                    <li key={i} className="text-[10px] text-muted-foreground flex gap-1"><span className="text-blue-500">&gt;</span> {a}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Expandable: Regulatory Framework */}
      <div className="border-b border-border">
        <button
          onClick={() => toggleSection("regulatory")}
          className="w-full px-4 py-2.5 flex items-center justify-between bg-muted/30 hover:bg-muted/50 transition-colors"
        >
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Regulatory Framework</span>
          <span className="text-[10px] text-muted-foreground">{expanded.regulatory ? "v" : ">"}</span>
        </button>
        {expanded.regulatory && (
          <div className="divide-y divide-border">
            {data.regulatoryLinks.map((reg, i) => (
              <div key={i} className="px-4 py-2">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[10px] font-medium">{reg.regulation}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${STATUS_STYLES[reg.status] ?? ""}`}>
                    {STATUS_LABELS[reg.status] ?? reg.status}
                  </span>
                </div>
                <p className="text-[9px] text-muted-foreground">{reg.requirement}</p>
                <p className="text-[9px] text-muted-foreground mt-0.5">{reg.evidence}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 text-center">
        <span className="text-[10px] text-muted-foreground">
          Generated {new Date(data.generatedAt).toLocaleDateString("en-GB")}
        </span>
      </div>
    </div>
  );
}

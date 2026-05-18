"use client";

// ══════════════════════════════════════════════════════════════════════════════
// TRANSPORT SAFETY COMPLIANCE DASHBOARD WIDGET
//
// Displays transport safety compliance intelligence for a children's home:
// - Overall score with Ofsted-aligned rating
// - Key metrics: vehicle safety, journey compliance, driver competence, incidents
// - Expandable sections for detailed analysis
// - Child transport profiles with individual safety scores
// - Priority alerts for failed vehicles, expired documents, serious incidents
// - Regulatory framework references
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";

// ── Local Type Definitions ────────────────────────────────────────────────

interface VehicleSafetyEvaluation {
  totalVehicles: number;
  checkPassedRate: number;
  serviceCurrentRate: number;
  motValidRate: number;
  insuranceValidRate: number;
  failedCount: number;
  overdueCount: number;
  vehicleSafetyScore: number;
}

interface JourneyComplianceEvaluation {
  totalJourneys: number;
  riskAssessmentRate: number;
  seatbeltCheckRate: number;
  journeyLogRate: number;
  incidentRate: number;
  completionRate: number;
  journeysByPurpose: Record<string, number>;
  journeyComplianceScore: number;
}

interface DriverCompetenceEvaluation {
  totalDrivers: number;
  licenceValidRate: number;
  dbsCheckedRate: number;
  trainingCompletedRate: number;
  firstAidRate: number;
  assessmentCurrentRate: number;
  driverCompetenceScore: number;
}

interface IncidentResponseEvaluation {
  totalIncidents: number;
  reportedTimelyRate: number;
  investigationCompletedRate: number;
  preventiveMeasuresRate: number;
  seriousIncidentCount: number;
  bySeverity: Record<string, number>;
  incidentResponseScore: number;
}

interface ChildTransportProfile {
  childId: string;
  totalJourneys: number;
  journeyPurposes: string[];
  incidentsInvolved: number;
  riskAssessmentsCompleted: number;
  seatbeltChecks: number;
  safetyScore: number;
}

interface TransportSafetyData {
  homeId: string;
  assessedAt: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: string;
  vehicleSafety: VehicleSafetyEvaluation;
  journeyCompliance: JourneyComplianceEvaluation;
  driverCompetence: DriverCompetenceEvaluation;
  incidentResponse: IncidentResponseEvaluation;
  childTransportProfiles: ChildTransportProfile[];
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

export function TransportSafetyComplianceDashboardWidget() {
  const [data, setData] = useState<TransportSafetyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/transport-safety-compliance");
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
        <h3 className="font-semibold text-red-800">Transport Safety Compliance</h3>
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
            Transport Safety Compliance
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {data.periodStart} to {data.periodEnd} | {data.vehicleSafety.totalVehicles} vehicles | {data.journeyCompliance.totalJourneys} journeys | {data.driverCompetence.totalDrivers} drivers
          </p>
        </div>
        <RatingBadge score={data.overallScore} rating={data.rating} />
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <MetricCard label="Vehicle Safety" value={data.vehicleSafety.vehicleSafetyScore} suffix="/25" />
        <MetricCard label="Journey Compliance" value={data.journeyCompliance.journeyComplianceScore} suffix="/25" />
        <MetricCard label="Driver Competence" value={data.driverCompetence.driverCompetenceScore} suffix="/25" />
        <MetricCard label="Incident Response" value={data.incidentResponse.incidentResponseScore} suffix="/25" />
      </div>

      {/* Vehicle Alerts */}
      {(data.vehicleSafety.failedCount > 0 || data.vehicleSafety.overdueCount > 0) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <h4 className="text-sm font-semibold text-red-800 mb-1">Vehicle Alerts</h4>
          {data.vehicleSafety.failedCount > 0 && (
            <div className="text-xs text-red-700">
              {data.vehicleSafety.failedCount} vehicle(s) failed safety checks
            </div>
          )}
          {data.vehicleSafety.overdueCount > 0 && (
            <div className="text-xs text-red-700">
              {data.vehicleSafety.overdueCount} vehicle check(s) overdue
            </div>
          )}
        </div>
      )}

      {/* Serious Incident Alert */}
      {data.incidentResponse.seriousIncidentCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <h4 className="text-sm font-semibold text-red-800">
            {data.incidentResponse.seriousIncidentCount} serious transport incident(s) recorded
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
          {/* Vehicle Safety */}
          <Section title="Vehicle Safety" defaultOpen>
            <StatRow label="Total vehicles" value={data.vehicleSafety.totalVehicles} />
            <StatRow label="Check passed rate" value={`${data.vehicleSafety.checkPassedRate}%`} />
            <StatRow label="Service current" value={`${data.vehicleSafety.serviceCurrentRate}%`} />
            <StatRow label="MOT valid" value={`${data.vehicleSafety.motValidRate}%`} />
            <StatRow label="Insurance valid" value={`${data.vehicleSafety.insuranceValidRate}%`} />
            <StatRow label="Failed checks" value={data.vehicleSafety.failedCount} />
            <StatRow label="Overdue checks" value={data.vehicleSafety.overdueCount} />
            <StatRow label="Score" value={`${data.vehicleSafety.vehicleSafetyScore}/25`} />
          </Section>

          {/* Journey Compliance */}
          <Section title="Journey Compliance">
            <StatRow label="Total journeys" value={data.journeyCompliance.totalJourneys} />
            <StatRow label="Risk assessment rate" value={`${data.journeyCompliance.riskAssessmentRate}%`} />
            <StatRow label="Seatbelt check rate" value={`${data.journeyCompliance.seatbeltCheckRate}%`} />
            <StatRow label="Journey log rate" value={`${data.journeyCompliance.journeyLogRate}%`} />
            <StatRow label="Incident rate" value={`${data.journeyCompliance.incidentRate}%`} />
            <StatRow label="Full compliance rate" value={`${data.journeyCompliance.completionRate}%`} />
            <StatRow label="Score" value={`${data.journeyCompliance.journeyComplianceScore}/25`} />
            {Object.keys(data.journeyCompliance.journeysByPurpose).length > 0 && (
              <div className="text-xs text-gray-500 mt-1">
                {Object.entries(data.journeyCompliance.journeysByPurpose).map(([type, count]) =>
                  `${type.replace(/_/g, " ")}: ${count}`,
                ).join(" | ")}
              </div>
            )}
          </Section>

          {/* Driver Competence */}
          <Section title="Driver Competence">
            <StatRow label="Total drivers" value={data.driverCompetence.totalDrivers} />
            <StatRow label="Licence valid" value={`${data.driverCompetence.licenceValidRate}%`} />
            <StatRow label="DBS checked" value={`${data.driverCompetence.dbsCheckedRate}%`} />
            <StatRow label="Training completed" value={`${data.driverCompetence.trainingCompletedRate}%`} />
            <StatRow label="First aid trained" value={`${data.driverCompetence.firstAidRate}%`} />
            <StatRow label="Assessment current" value={`${data.driverCompetence.assessmentCurrentRate}%`} />
            <StatRow label="Score" value={`${data.driverCompetence.driverCompetenceScore}/25`} />
          </Section>

          {/* Incident Response */}
          <Section title="Incident Response">
            <StatRow label="Total incidents" value={data.incidentResponse.totalIncidents} />
            {data.incidentResponse.totalIncidents > 0 ? (
              <>
                <StatRow label="Reported timely" value={`${data.incidentResponse.reportedTimelyRate}%`} />
                <StatRow label="Investigation completed" value={`${data.incidentResponse.investigationCompletedRate}%`} />
                <StatRow label="Preventive measures" value={`${data.incidentResponse.preventiveMeasuresRate}%`} />
                <StatRow label="Serious incidents" value={data.incidentResponse.seriousIncidentCount} />
                {Object.keys(data.incidentResponse.bySeverity).length > 0 && (
                  <div className="text-xs text-gray-500 mt-1">
                    {Object.entries(data.incidentResponse.bySeverity).map(([sev, count]) =>
                      `${sev}: ${count}`,
                    ).join(" | ")}
                  </div>
                )}
              </>
            ) : (
              <div className="text-xs text-green-700 mt-1">No transport incidents recorded</div>
            )}
            <StatRow label="Score" value={`${data.incidentResponse.incidentResponseScore}/25`} />
          </Section>

          {/* Child Transport Profiles */}
          {data.childTransportProfiles.length > 0 && (
            <Section title="Child Transport Profiles">
              {data.childTransportProfiles.map((child) => (
                <div key={child.childId} className="border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                  <div className="flex justify-between items-center text-sm py-1">
                    <span className="text-gray-700 font-medium">{child.childId}</span>
                    <span className="font-medium text-gray-900">Safety: {child.safetyScore}/10</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {child.totalJourneys} journeys | {child.riskAssessmentsCompleted} risk assessments | {child.seatbeltChecks} seatbelt checks | {child.incidentsInvolved} incidents
                  </div>
                  {child.journeyPurposes.length > 0 && (
                    <div className="text-xs text-gray-400 mt-0.5">
                      Purposes: {child.journeyPurposes.map((p) => p.replace(/_/g, " ")).join(", ")}
                    </div>
                  )}
                </div>
              ))}
            </Section>
          )}

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

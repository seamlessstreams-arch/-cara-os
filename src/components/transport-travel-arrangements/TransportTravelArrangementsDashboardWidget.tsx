"use client";

// ══════════════════════════════════════════════════════════════════════════════
// TRANSPORT & TRAVEL ARRANGEMENTS DASHBOARD WIDGET
//
// Displays transport and travel arrangements intelligence for a children's home:
// - Overall score with Ofsted-aligned rating
// - Key metrics: journey quality, vehicle safety, travel policy, staff readiness
// - Expandable sections for detailed analysis
// - Child travel profiles with individual scores
// - Priority alerts and regulatory framework references
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";

// ── Local Type Definitions ────────────────────────────────────────────────

interface JourneyQualityEvaluation {
  totalJourneys: number;
  onTimeRate: number;
  riskAssessmentRate: number;
  seatbeltRate: number;
  childComfortableRate: number;
  journeysByType: Record<string, number>;
  journeysByMode: Record<string, number>;
  journeyQualityScore: number;
}

interface VehicleSafetyEvaluation {
  totalChecks: number;
  motCurrentRate: number;
  insuranceCurrentRate: number;
  roadworthyRate: number;
  firstAidKitRate: number;
  childLockRate: number;
  cleanAndTidyRate: number;
  vehicleSafetyScore: number;
}

interface TravelPolicyEvaluation {
  totalPolicies: number;
  driverChecksRate: number;
  insuranceVerifiedRate: number;
  riskAssessmentProtocolRate: number;
  loneDrivingPolicyRate: number;
  breakdownProcedureRate: number;
  childConsentRate: number;
  routePlanningRate: number;
  travelPolicyScore: number;
}

interface StaffTravelReadinessEvaluation {
  totalStaff: number;
  drivingAssessmentRate: number;
  childTransportSafetyRate: number;
  firstAidTrainingRate: number;
  riskAssessmentRate: number;
  breakdownProcedureRate: number;
  childComfortAwarenessRate: number;
  staffTravelReadinessScore: number;
}

interface ChildTravelProfile {
  childId: string;
  childName: string;
  totalJourneys: number;
  travelTypes: string[];
  onTimeRate: number;
  riskAssessmentRate: number;
  seatbeltRate: number;
  comfortRate: number;
  travelScore: number;
}

interface TransportTravelData {
  homeId: string;
  assessedAt: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: string;
  journeyQuality: JourneyQualityEvaluation;
  vehicleSafety: VehicleSafetyEvaluation;
  travelPolicy: TravelPolicyEvaluation;
  staffTravelReadiness: StaffTravelReadinessEvaluation;
  childTravelProfiles: ChildTravelProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── ScoreBar ─────────────────────────────────────────────────────────────

function ScoreBar({ score, max, label }: { score: number; max: number; label: string }) {
  const pct = max > 0 ? Math.round((score / max) * 100) : 0;
  const barColor =
    pct >= 80
      ? "bg-green-500"
      : pct >= 60
        ? "bg-blue-500"
        : pct >= 40
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
          style={{ width: `${pct}%` }}
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

export function TransportTravelArrangementsDashboardWidget() {
  const [data, setData] = useState<TransportTravelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/transport-travel-arrangements");
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
        <h3 className="font-semibold text-red-800">
          Transport & Travel Arrangements
        </h3>
        <p className="text-sm text-red-600 mt-1">
          {error ?? "No data available"}
        </p>
      </div>
    );
  }

  // ── Null Guard ─────────────────────────────────────────────────────────
  if (!data.journeyQuality || !data.vehicleSafety || !data.travelPolicy || !data.staffTravelReadiness) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="font-semibold text-gray-900">
          Transport & Travel Arrangements
        </h3>
        <p className="text-sm text-gray-500 mt-1">Incomplete data received</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900 text-lg">
            Transport & Travel Arrangements
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {data.periodStart} to {data.periodEnd} |{" "}
            {data.journeyQuality.totalJourneys} journeys |{" "}
            {data.vehicleSafety.totalChecks} vehicle checks |{" "}
            {data.staffTravelReadiness.totalStaff} staff
          </p>
        </div>
        <RatingBadge score={data.overallScore} rating={data.rating} />
      </div>

      {/* Score Bars */}
      <div className="space-y-3 mb-4">
        <ScoreBar
          label="Journey Quality"
          score={data.journeyQuality.journeyQualityScore}
          max={25}
        />
        <ScoreBar
          label="Vehicle Safety"
          score={data.vehicleSafety.vehicleSafetyScore}
          max={25}
        />
        <ScoreBar
          label="Travel Policy"
          score={data.travelPolicy.travelPolicyScore}
          max={25}
        />
        <ScoreBar
          label="Staff Readiness"
          score={data.staffTravelReadiness.staffTravelReadinessScore}
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
          {/* Journey Quality */}
          <Section title="Journey Quality" defaultOpen>
            <Stat label="Total journeys" value={data.journeyQuality.totalJourneys} />
            <Stat label="On-time rate" value={`${data.journeyQuality.onTimeRate}%`} />
            <Stat label="Risk assessment rate" value={`${data.journeyQuality.riskAssessmentRate}%`} />
            <Stat label="Seatbelt rate" value={`${data.journeyQuality.seatbeltRate}%`} />
            <Stat label="Child comfortable rate" value={`${data.journeyQuality.childComfortableRate}%`} />
          </Section>

          {/* Vehicle Safety */}
          <Section title="Vehicle Safety">
            <Stat label="Total checks" value={data.vehicleSafety.totalChecks} />
            <Stat label="MOT current" value={`${data.vehicleSafety.motCurrentRate}%`} />
            <Stat label="Insurance current" value={`${data.vehicleSafety.insuranceCurrentRate}%`} />
            <Stat label="Roadworthy" value={`${data.vehicleSafety.roadworthyRate}%`} />
            <Stat label="First aid kit" value={`${data.vehicleSafety.firstAidKitRate}%`} />
            <Stat label="Child lock enabled" value={`${data.vehicleSafety.childLockRate}%`} />
            <Stat label="Clean and tidy" value={`${data.vehicleSafety.cleanAndTidyRate}%`} />
          </Section>

          {/* Travel Policy */}
          <Section title="Travel Policy">
            <Stat label="Driver checks" value={`${data.travelPolicy.driverChecksRate}%`} />
            <Stat label="Insurance verified" value={`${data.travelPolicy.insuranceVerifiedRate}%`} />
            <Stat label="Risk assessment protocol" value={`${data.travelPolicy.riskAssessmentProtocolRate}%`} />
            <Stat label="Lone driving policy" value={`${data.travelPolicy.loneDrivingPolicyRate}%`} />
            <Stat label="Breakdown procedure" value={`${data.travelPolicy.breakdownProcedureRate}%`} />
            <Stat label="Child consent" value={`${data.travelPolicy.childConsentRate}%`} />
            <Stat label="Route planning" value={`${data.travelPolicy.routePlanningRate}%`} />
          </Section>

          {/* Staff Readiness */}
          <Section title="Staff Travel Readiness">
            <Stat label="Total staff" value={data.staffTravelReadiness.totalStaff} />
            <Stat label="Driving assessment" value={`${data.staffTravelReadiness.drivingAssessmentRate}%`} />
            <Stat label="Child transport safety" value={`${data.staffTravelReadiness.childTransportSafetyRate}%`} />
            <Stat label="First aid training" value={`${data.staffTravelReadiness.firstAidTrainingRate}%`} />
            <Stat label="Risk assessment" value={`${data.staffTravelReadiness.riskAssessmentRate}%`} />
            <Stat label="Breakdown procedure" value={`${data.staffTravelReadiness.breakdownProcedureRate}%`} />
            <Stat label="Child comfort awareness" value={`${data.staffTravelReadiness.childComfortAwarenessRate}%`} />
          </Section>

          {/* Child Travel Profiles */}
          {data.childTravelProfiles.length > 0 && (
            <Section title="Child Travel Profiles">
              {data.childTravelProfiles.map((child) => (
                <div
                  key={child.childId}
                  className="bg-gray-50 rounded-lg p-3 mb-2 last:mb-0"
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-semibold text-gray-800">
                      {child.childName}
                    </span>
                    <span className="text-sm font-bold text-gray-900">
                      {child.travelScore}/10
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-gray-600">
                    <span>Journeys: {child.totalJourneys}</span>
                    <span>On-time: {child.onTimeRate}%</span>
                    <span>Risk assessed: {child.riskAssessmentRate}%</span>
                    <span>Seatbelt: {child.seatbeltRate}%</span>
                    <span>Comfort: {child.comfortRate}%</span>
                    <span>Types: {child.travelTypes.length}</span>
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

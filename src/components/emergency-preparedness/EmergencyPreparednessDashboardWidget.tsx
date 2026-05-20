"use client";

import { useState, useEffect } from "react";

// ── Local interfaces (mirrors API shape) ──────────────────────────────────

interface EmergencyQuality {
  totalDrills: number;
  readinessRate: number;
  completionRate: number;
  childBriefingRate: number;
  debriefRate: number;
  score: number;
}

interface EmergencyCompliance {
  totalDrills: number;
  documentedRate: number;
  staffParticipationRate: number;
  improvementsRate: number;
  uniqueDrillTypes: number;
  typeDiversityRatio: number;
  score: number;
}

interface EmergencyPolicyData {
  fireEvacuationPlan: boolean;
  lockdownProcedure: boolean;
  missingChildProtocol: boolean;
  medicalEmergencyPlan: boolean;
  businessContinuityPlan: boolean;
  emergencyContactSystem: boolean;
  regularReview: boolean;
  score: number;
}

interface StaffReadiness {
  totalStaff: number;
  firstAidCertifiedRate: number;
  fireMarshallTrainedRate: number;
  evacuationProceduresRate: number;
  emergencyProtocolsRate: number;
  safeguardingInEmergenciesRate: number;
  communicationInCrisisRate: number;
  score: number;
}

interface DrillSummaryItem {
  drillType: string;
  count: number;
  avgReadiness: number;
  lastDate: string;
}

interface EmergencyPreparednessData {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: string;
  emergencyQuality: EmergencyQuality;
  emergencyCompliance: EmergencyCompliance;
  emergencyPolicy: EmergencyPolicyData;
  staffEmergencyReadiness: StaffReadiness;
  drillSummary: DrillSummaryItem[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── ScoreBar ──────────────────────────────────────────────────────────────

function ScoreBar({ label, score, max = 25 }: { label: string; score: number; max?: number }) {
  const pctVal = Math.round((score / max) * 100);
  const fillColor =
    pctVal >= 80
      ? "bg-green-500"
      : pctVal >= 60
        ? "bg-blue-500"
        : pctVal >= 40
          ? "bg-orange-500"
          : "bg-red-500";

  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-medium text-gray-700">{label}</span>
        <span className="text-xs font-bold text-gray-900">
          {score}/{max}
        </span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${fillColor}`}
          style={{ width: `${pctVal}%` }}
        />
      </div>
    </div>
  );
}

// ── Section (collapsible) ────────────────────────────────────────────────

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
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <span className="text-sm font-semibold text-gray-800">{title}</span>
        <span className="text-gray-400 text-xs">{open ? "Hide" : "Show"}</span>
      </button>
      {open && <div className="px-4 py-3">{children}</div>}
    </div>
  );
}

// ── Stat ──────────────────────────────────────────────────────────────────

function Stat({ label, value, suffix = "" }: { label: string; value: string | number; suffix?: string }) {
  return (
    <div className="text-center p-2 bg-gray-50 rounded-lg">
      <div className="text-lg font-bold text-gray-800">
        {value}
        {suffix && <span className="text-sm font-normal text-gray-500">{suffix}</span>}
      </div>
      <div className="text-[10px] text-gray-500 uppercase mt-0.5">{label}</div>
    </div>
  );
}

// ── Drill Type Label ─────────────────────────────────────────────────────

const drillTypeDisplayNames: Record<string, string> = {
  fire_drill: "Fire Drill",
  evacuation_exercise: "Evacuation Exercise",
  first_aid_scenario: "First Aid Scenario",
  lockdown_procedure: "Lockdown Procedure",
  missing_child_protocol: "Missing Child Protocol",
  medical_emergency: "Medical Emergency",
  utility_failure: "Utility Failure",
  severe_weather: "Severe Weather",
};

// ── Main Widget ───────────────────────────────────────────────────────────

export default function EmergencyPreparednessDashboardWidget() {
  const [data, setData] = useState<EmergencyPreparednessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/emergency-preparedness");
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

  // Loading skeleton
  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="h-4 bg-gray-100 rounded w-2/3 mb-3" />
        <div className="grid grid-cols-4 gap-3 mb-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded" />
          ))}
        </div>
        <div className="h-20 bg-gray-100 rounded" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white border border-red-200 rounded-xl p-6">
        <h3 className="font-semibold text-red-800">Emergency Preparedness</h3>
        <p className="text-sm text-red-600 mt-1">{error}</p>
      </div>
    );
  }

  // Null guard
  if (!data) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="font-semibold text-gray-800">Emergency Preparedness</h3>
        <p className="text-sm text-gray-500 mt-1">No data available</p>
      </div>
    );
  }

  const ratingColor =
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
            Emergency Preparedness
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {data.periodStart} to {data.periodEnd} | {data.emergencyQuality.totalDrills} drills | {data.staffEmergencyReadiness.totalStaff} staff
          </p>
        </div>
        <div className={`rounded-lg border px-4 py-3 text-center ${ratingColor}`}>
          <div className="text-3xl font-bold">{data.overallScore}</div>
          <div className="text-sm font-medium mt-1">{ratingLabel}</div>
        </div>
      </div>

      {/* 4 Score Bars */}
      <div className="mb-5">
        <ScoreBar label="Emergency Quality" score={data.emergencyQuality.score} />
        <ScoreBar label="Emergency Compliance" score={data.emergencyCompliance.score} />
        <ScoreBar label="Emergency Policy" score={data.emergencyPolicy.score} />
        <ScoreBar label="Staff Emergency Readiness" score={data.staffEmergencyReadiness.score} />
      </div>

      {/* Sections */}
      <div className="space-y-3">
        {/* Emergency Quality */}
        <Section title="Emergency Quality" defaultOpen>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
            <Stat label="Readiness Rate" value={data.emergencyQuality.readinessRate} suffix="%" />
            <Stat label="Completion Rate" value={data.emergencyQuality.completionRate} suffix="%" />
            <Stat label="Child Briefing" value={data.emergencyQuality.childBriefingRate} suffix="%" />
            <Stat label="Debrief Rate" value={data.emergencyQuality.debriefRate} suffix="%" />
            <Stat label="Total Drills" value={data.emergencyQuality.totalDrills} />
          </div>
        </Section>

        {/* Emergency Compliance */}
        <Section title="Emergency Compliance">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
            <Stat label="Documented" value={data.emergencyCompliance.documentedRate} suffix="%" />
            <Stat label="Staff Participation" value={data.emergencyCompliance.staffParticipationRate} suffix="%" />
            <Stat label="Improvements ID'd" value={data.emergencyCompliance.improvementsRate} suffix="%" />
            <Stat label="Drill Types" value={data.emergencyCompliance.uniqueDrillTypes} suffix="/8" />
            <Stat label="Diversity Ratio" value={data.emergencyCompliance.typeDiversityRatio} />
          </div>
        </Section>

        {/* Emergency Policy */}
        <Section title="Emergency Policy">
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Fire Evacuation Plan", value: data.emergencyPolicy.fireEvacuationPlan },
              { label: "Lockdown Procedure", value: data.emergencyPolicy.lockdownProcedure },
              { label: "Missing Child Protocol", value: data.emergencyPolicy.missingChildProtocol },
              { label: "Medical Emergency Plan", value: data.emergencyPolicy.medicalEmergencyPlan },
              { label: "Business Continuity", value: data.emergencyPolicy.businessContinuityPlan },
              { label: "Emergency Contacts", value: data.emergencyPolicy.emergencyContactSystem },
              { label: "Regular Review", value: data.emergencyPolicy.regularReview },
            ].map((item) => (
              <div
                key={item.label}
                className={`text-xs px-3 py-2 rounded-lg ${
                  item.value
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {item.value ? "Yes" : "No"} — {item.label}
              </div>
            ))}
          </div>
        </Section>

        {/* Staff Emergency Readiness */}
        <Section title="Staff Emergency Readiness">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
            <Stat label="First Aid" value={data.staffEmergencyReadiness.firstAidCertifiedRate} suffix="%" />
            <Stat label="Fire Marshall" value={data.staffEmergencyReadiness.fireMarshallTrainedRate} suffix="%" />
            <Stat label="Evacuation" value={data.staffEmergencyReadiness.evacuationProceduresRate} suffix="%" />
            <Stat label="Protocols" value={data.staffEmergencyReadiness.emergencyProtocolsRate} suffix="%" />
            <Stat label="Safeguarding" value={data.staffEmergencyReadiness.safeguardingInEmergenciesRate} suffix="%" />
            <Stat label="Crisis Comms" value={data.staffEmergencyReadiness.communicationInCrisisRate} suffix="%" />
          </div>
          <p className="text-xs text-gray-500">
            {data.staffEmergencyReadiness.totalStaff} staff assessed
          </p>
        </Section>

        {/* Drill Type Summary */}
        {data.drillSummary.length > 0 && (
          <Section title="Drill Type Summary">
            <div className="space-y-2">
              {data.drillSummary.map((ds) => (
                <div
                  key={ds.drillType}
                  className="flex items-center justify-between text-xs border-b border-gray-100 pb-1 last:border-0"
                >
                  <span className="text-gray-700 font-medium">
                    {drillTypeDisplayNames[ds.drillType] ?? ds.drillType}
                  </span>
                  <span className="text-gray-500">
                    {ds.count} drill{ds.count !== 1 ? "s" : ""} | {ds.avgReadiness}% ready | last: {ds.lastDate}
                  </span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Strengths */}
        {data.strengths.length > 0 && (
          <Section title="Strengths">
            {data.strengths.map((s, i) => (
              <div key={i} className="text-xs text-green-700 py-0.5">+ {s}</div>
            ))}
          </Section>
        )}

        {/* Areas for Improvement */}
        {data.areasForImprovement.length > 0 && (
          <Section title="Areas for Improvement">
            {data.areasForImprovement.map((a, i) => (
              <div key={i} className="text-xs text-orange-700 py-0.5">- {a}</div>
            ))}
          </Section>
        )}

        {/* Actions */}
        {data.actions.length > 0 && (
          <Section title="Actions Required">
            {data.actions.map((a, i) => (
              <div key={i} className="text-xs text-red-700 py-0.5">* {a}</div>
            ))}
          </Section>
        )}

        {/* Regulatory Links */}
        <Section title="Regulatory Framework">
          {data.regulatoryLinks.map((link, i) => (
            <div key={i} className="text-xs text-gray-600 py-0.5">{link}</div>
          ))}
        </Section>
      </div>
    </div>
  );
}

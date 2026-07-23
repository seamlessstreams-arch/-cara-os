"use client";

import { useEffect, useState } from "react";
import { formatRate } from "@/lib/metrics/rate";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ChildFireSafetySummary {
  childId: string;
  childName: string;
  peepStatus: string;
  assemblyPointKnown: boolean;
  escapeRouteAccessible: boolean;
  nightPlanInPlace: boolean;
  overallScore: number;
}

interface FireSafetyData {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: string;
  fireDrillCompliance: {
    overallScore: number;
    totalDrills: number;
    successRate: number | null;
    fullParticipationRate: number | null;
    drillTypeVariety: number;
    averageEvacuationTime: number | null;
    correctiveActionsRate: number | null;
  };
  equipmentChecks: {
    overallScore: number;
    totalChecks: number;
    passRate: number | null;
    majorFaultRate: number | null;
    equipmentTypesCovered: number;
    rectificationRate: number | null;
  };
  evacuationPlanning: {
    overallScore: number;
    totalPlans: number;
    peepCurrentRate: number | null;
    assemblyPointRate: number | null;
    escapeRouteRate: number | null;
    nightPlanRate: number | null;
  };
  staffFireReadiness: {
    overallScore: number;
    totalStaff: number;
    fireAwarenessRate: number | null;
    fireMarshalRate: number | null;
    evacuationRate: number | null;
    extinguisherRate: number | null;
    peepAwarenessRate: number | null;
    nightResponseRate: number | null;
  };
  childSummaries: ChildFireSafetySummary[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function ratingColour(r: string) {
  if (r === "outstanding") return "text-green-700 bg-green-50 border-green-200";
  if (r === "good") return "text-blue-700 bg-blue-50 border-blue-200";
  if (r === "requires_improvement") return "text-amber-700 bg-amber-50 border-amber-200";
  return "text-red-700 bg-red-50 border-red-200";
}

function ratingLabel(r: string) {
  return r.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function peepColour(s: string) {
  if (s === "current" || s === "not_required") return "text-green-700 bg-green-50";
  if (s === "in_progress") return "text-amber-700 bg-amber-50";
  return "text-red-700 bg-red-50";
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function ScoreBar({ label, score, max = 25 }: { label: string; score: number; max?: number }) {
  const pct = max > 0 ? Math.round((score / max) * 100) : 0;
  const fill =
    pct >= 80 ? "bg-green-500" : pct >= 60 ? "bg-blue-500" : pct >= 40 ? "bg-amber-500" : "bg-red-500";

  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="text-gray-500">
          {score}/{max}
        </span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
        <div className={`h-full rounded-full ${fill}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Section({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 flex justify-between items-center"
      >
        <span className="font-semibold text-gray-800">{title}</span>
        <span className="text-gray-400 text-lg">{open ? "−" : "+"}</span>
      </button>
      {open && <div className="px-4 py-3">{children}</div>}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-gray-50 rounded-lg px-3 py-2 text-center">
      <div className="text-lg font-bold text-gray-800">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main widget                                                        */
/* ------------------------------------------------------------------ */

export default function FireSafetyPreparednessDashboardWidget() {
  const [data, setData] = useState<FireSafetyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/fire-safety-preparedness")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((json) => setData(json.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  /* Loading skeleton */
  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-4" />
        <div className="h-4 bg-gray-100 rounded w-1/2 mb-3" />
        <div className="h-4 bg-gray-100 rounded w-2/3 mb-3" />
        <div className="h-4 bg-gray-100 rounded w-1/3" />
      </div>
    );
  }

  /* Error state */
  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <h2 className="text-lg font-bold text-red-800 mb-2">Fire Safety Preparedness</h2>
        <p className="text-red-600 text-sm">Failed to load data: {error}</p>
      </div>
    );
  }

  /* Null guard */
  if (!data) return null;

  const rc = ratingColour(data.rating);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6">
      {/* ---- Header ---- */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Fire Safety Preparedness</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {data.periodStart} — {data.periodEnd}
          </p>
        </div>
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-semibold ${rc}`}>
          <span className="text-xl font-bold">{data.overallScore}</span>
          <span>/100</span>
          <span className="ml-1">{ratingLabel(data.rating)}</span>
        </div>
      </div>

      {/* ---- Score bars ---- */}
      <div className="mb-6">
        <ScoreBar label="Fire Drill Compliance" score={data.fireDrillCompliance.overallScore} />
        <ScoreBar label="Equipment Checks" score={data.equipmentChecks.overallScore} />
        <ScoreBar label="Evacuation Planning" score={data.evacuationPlanning.overallScore} />
        <ScoreBar label="Staff Readiness" score={data.staffFireReadiness.overallScore} />
      </div>

      {/* ---- Fire Drill detail ---- */}
      <Section title="Fire Drill Compliance" defaultOpen>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stat label="Total Drills" value={data.fireDrillCompliance.totalDrills} />
          <Stat label="Success Rate" value={formatRate(data.fireDrillCompliance.successRate)} />
          <Stat label="Full Participation" value={formatRate(data.fireDrillCompliance.fullParticipationRate)} />
          <Stat label="Drill Types" value={data.fireDrillCompliance.drillTypeVariety} />
          <Stat label="Avg Evacuation" value={data.fireDrillCompliance.averageEvacuationTime === null ? "—" : `${data.fireDrillCompliance.averageEvacuationTime}s`} />
          <Stat label="Corrective Actions" value={formatRate(data.fireDrillCompliance.correctiveActionsRate)} />
        </div>
      </Section>

      {/* ---- Equipment Checks detail ---- */}
      <Section title="Equipment Checks">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stat label="Total Checks" value={data.equipmentChecks.totalChecks} />
          <Stat label="Pass Rate" value={formatRate(data.equipmentChecks.passRate)} />
          <Stat label="Major Fault Rate" value={formatRate(data.equipmentChecks.majorFaultRate)} />
          <Stat label="Types Covered" value={data.equipmentChecks.equipmentTypesCovered} />
          <Stat label="Rectification" value={formatRate(data.equipmentChecks.rectificationRate)} />
        </div>
      </Section>

      {/* ---- Evacuation Planning detail ---- */}
      <Section title="Evacuation Planning">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stat label="Total Plans" value={data.evacuationPlanning.totalPlans} />
          <Stat label="PEEPs Current" value={formatRate(data.evacuationPlanning.peepCurrentRate)} />
          <Stat label="Assembly Point" value={formatRate(data.evacuationPlanning.assemblyPointRate)} />
          <Stat label="Escape Route" value={formatRate(data.evacuationPlanning.escapeRouteRate)} />
          <Stat label="Night Plans" value={formatRate(data.evacuationPlanning.nightPlanRate)} />
        </div>
      </Section>

      {/* ---- Staff Readiness detail ---- */}
      <Section title="Staff Readiness">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Stat label="Total Staff" value={data.staffFireReadiness.totalStaff} />
          <Stat label="Fire Awareness" value={formatRate(data.staffFireReadiness.fireAwarenessRate)} />
          <Stat label="Fire Marshal" value={formatRate(data.staffFireReadiness.fireMarshalRate)} />
          <Stat label="Evacuation" value={formatRate(data.staffFireReadiness.evacuationRate)} />
          <Stat label="Extinguisher" value={formatRate(data.staffFireReadiness.extinguisherRate)} />
          <Stat label="PEEP Awareness" value={formatRate(data.staffFireReadiness.peepAwarenessRate)} />
          <Stat label="Night Response" value={formatRate(data.staffFireReadiness.nightResponseRate)} />
        </div>
      </Section>

      {/* ---- Child Profiles ---- */}
      {data.childSummaries.length > 0 && (
        <Section title="Child Evacuation Profiles">
          <div className="space-y-3">
            {data.childSummaries.map((cs) => (
              <div key={cs.childId} className="border border-gray-100 rounded-lg p-3">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-semibold text-gray-800">{cs.childName}</span>
                    <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-medium ${peepColour(cs.peepStatus)}`}>
                      {ratingLabel(cs.peepStatus)}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-gray-600">{cs.overallScore}/10</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-gray-600">
                  <span>Assembly Point: {cs.assemblyPointKnown ? "Yes" : "No"}</span>
                  <span>Escape Route: {cs.escapeRouteAccessible ? "Yes" : "No"}</span>
                  <span>Night Plan: {cs.nightPlanInPlace ? "Yes" : "No"}</span>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ---- Strengths ---- */}
      {data.strengths.length > 0 && (
        <Section title="Strengths">
          <ul className="space-y-1">
            {data.strengths.map((s, i) => (
              <li key={i} className="text-sm text-green-800 flex gap-2">
                <span className="shrink-0 mt-1 h-1.5 w-1.5 rounded-full bg-green-500" />
                {s}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* ---- Areas for improvement ---- */}
      {data.areasForImprovement.length > 0 && (
        <Section title="Areas for Improvement">
          <ul className="space-y-1">
            {data.areasForImprovement.map((a, i) => (
              <li key={i} className="text-sm text-amber-800 flex gap-2">
                <span className="shrink-0 mt-1 h-1.5 w-1.5 rounded-full bg-amber-500" />
                {a}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* ---- Actions ---- */}
      {data.actions.length > 0 && (
        <Section title="Actions" defaultOpen>
          <ul className="space-y-1">
            {data.actions.map((a, i) => (
              <li
                key={i}
                className={`text-sm flex gap-2 ${
                  a.startsWith("URGENT") ? "text-red-800 font-semibold" : "text-gray-700"
                }`}
              >
                <span
                  className={`shrink-0 mt-1 h-1.5 w-1.5 rounded-full ${
                    a.startsWith("URGENT") ? "bg-red-500" : "bg-gray-400"
                  }`}
                />
                {a}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* ---- Regulatory Links ---- */}
      <Section title="Regulatory Links">
        <ul className="space-y-1">
          {data.regulatoryLinks.map((l, i) => (
            <li key={i} className="text-sm text-gray-600 flex gap-2">
              <span className="shrink-0 mt-1 h-1.5 w-1.5 rounded-full bg-gray-400" />
              {l}
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}

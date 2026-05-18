"use client";

// ══════════════════════════════════════════════════════════════════════════════
// ROUTINE & CONSISTENCY DASHBOARD WIDGET
//
// Displays routine intelligence:
// - Overall consistency rating
// - Morning & evening routine quality
// - Staff consistency indicators
// - Per-child routine profiles
// - Phase-by-phase breakdown
// - Disruption tracking
// - Child voice / adaptation implementation
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";

interface ChildRoutineProfileData {
  childId: string;
  childName: string;
  morningQualityRate: number;
  eveningQualityRate: number;
  overallCooperationRate: number;
  disruptionCount: number;
  adaptationsUsed: string[];
  adaptationLabels?: string[];
  preferencesImplemented: number;
  preferencesTotal: number;
  primaryConcern?: string;
}

interface PhaseData {
  phase: string;
  phaseLabel: string;
  totalRecords: number;
  excellentOrGoodRate: number;
  onTimeRate: number;
  cooperationRate: number;
  disruptionRate: number;
  averageMood: number;
}

interface DisruptionData {
  type: string;
  typeLabel?: string;
  count: number;
}

interface RoutineData {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: string;
  morningRoutine: {
    totalRecords: number;
    onTimeRate: number;
    qualityRate: number;
    cooperationRate: number;
    schoolReadinessRate: number;
    commonDisruptions: DisruptionData[];
  };
  eveningRoutine: {
    totalRecords: number;
    onTimeRate: number;
    qualityRate: number;
    cooperationRate: number;
    bedtimeComplianceRate: number;
    windDownQuality: number;
    commonDisruptions: DisruptionData[];
  };
  phaseBreakdown: PhaseData[];
  staffConsistency: {
    regularStaffRate: number;
    handoverCompletionRate: number;
    handoverQualityRate: number;
    averageStaffPerShift: number;
    staffTurnoverImpact: number;
  };
  childProfiles: ChildRoutineProfileData[];
  strengths: string[];
  areasForDevelopment: string[];
  immediateActions: string[];
  regulatoryLinks: string[];
}

// ── Rating Badge ───────────────────────────────────────────────────────────

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

// ── Mood Indicator ─────────────────────────────────────────────────────────

function MoodBar({ value }: { value: number }) {
  const color =
    value >= 4.0 ? "bg-green-400"
      : value >= 3.0 ? "bg-blue-400"
        : value >= 2.0 ? "bg-orange-400"
          : "bg-red-400";
  const pct = Math.min(100, Math.round((value / 5) * 100));
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] text-gray-500">{value}/5</span>
    </div>
  );
}

// ── Child Routine Card ────────────────────────────────────────────────────

function ChildRoutineCard({ child }: { child: ChildRoutineProfileData }) {
  const prefRate = child.preferencesTotal > 0
    ? Math.round((child.preferencesImplemented / child.preferencesTotal) * 100)
    : 100;

  return (
    <div className={`rounded-lg border p-3 ${child.primaryConcern ? "border-red-200 bg-red-50" : "border-gray-200"}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-sm">{child.childName}</span>
        <div className="flex gap-1">
          {child.disruptionCount > 5 && (
            <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">DISRUPTED</span>
          )}
          {prefRate >= 80 && child.preferencesTotal > 0 && (
            <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">VOICE HEARD</span>
          )}
        </div>
      </div>
      <div className="grid grid-cols-4 gap-1 text-center mb-2">
        <div>
          <div className="text-xs text-gray-500">Morning</div>
          <div className={`text-sm font-bold ${child.morningQualityRate >= 70 ? "text-green-700" : child.morningQualityRate >= 50 ? "text-orange-700" : "text-red-700"}`}>
            {child.morningQualityRate}%
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Evening</div>
          <div className={`text-sm font-bold ${child.eveningQualityRate >= 70 ? "text-green-700" : child.eveningQualityRate >= 50 ? "text-orange-700" : "text-red-700"}`}>
            {child.eveningQualityRate}%
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Coop</div>
          <div className="text-sm font-bold text-blue-700">{child.overallCooperationRate}%</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Prefs</div>
          <div className="text-sm font-bold text-purple-700">{child.preferencesImplemented}/{child.preferencesTotal}</div>
        </div>
      </div>
      {(child.adaptationLabels ?? child.adaptationsUsed).length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {(child.adaptationLabels ?? child.adaptationsUsed).map((a) => (
            <span key={a} className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">
              {a.replace(/_/g, " ")}
            </span>
          ))}
        </div>
      )}
      {child.primaryConcern && (
        <div className="mt-2 text-[10px] text-red-700 bg-red-100 rounded px-2 py-1">{child.primaryConcern}</div>
      )}
    </div>
  );
}

// ── Main Widget ────────────────────────────────────────────────────────────

export function RoutineConsistencyDashboardWidget() {
  const [data, setData] = useState<RoutineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/routine-consistency");
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
        <h3 className="font-semibold text-red-800">Routine & Consistency Intelligence</h3>
        <p className="text-sm text-red-600 mt-1">{error ?? "No data available"}</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900 text-lg">Routine & Consistency</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            CHR 2015 Reg 9 | {data.morningRoutine.totalRecords + data.eveningRoutine.totalRecords} routine records | {data.staffConsistency.regularStaffRate}% regular staff
          </p>
        </div>
        <RatingBadge score={data.overallScore} rating={data.rating} />
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="text-center p-2 bg-amber-50 rounded-lg">
          <div className="text-xl font-bold text-amber-700">{data.morningRoutine.qualityRate}%</div>
          <div className="text-[10px] text-gray-500 uppercase">Morning Quality</div>
        </div>
        <div className="text-center p-2 bg-indigo-50 rounded-lg">
          <div className="text-xl font-bold text-indigo-700">{data.eveningRoutine.qualityRate}%</div>
          <div className="text-[10px] text-gray-500 uppercase">Evening Quality</div>
        </div>
        <div className="text-center p-2 bg-green-50 rounded-lg">
          <div className="text-xl font-bold text-green-700">{data.morningRoutine.schoolReadinessRate}%</div>
          <div className="text-[10px] text-gray-500 uppercase">School Ready</div>
        </div>
        <div className="text-center p-2 bg-purple-50 rounded-lg">
          <div className="text-xl font-bold text-purple-700">{data.eveningRoutine.bedtimeComplianceRate}%</div>
          <div className="text-[10px] text-gray-500 uppercase">Bedtime On Time</div>
        </div>
      </div>

      {/* Status Badges */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className={`text-xs px-2 py-1 rounded ${data.staffConsistency.regularStaffRate >= 80 ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>
          {data.staffConsistency.regularStaffRate}% regular staff
        </span>
        <span className={`text-xs px-2 py-1 rounded ${data.staffConsistency.handoverCompletionRate >= 90 ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>
          {data.staffConsistency.handoverCompletionRate}% handovers completed
        </span>
        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
          {data.eveningRoutine.windDownQuality}% wind-down quality
        </span>
        {data.staffConsistency.staffTurnoverImpact > 0 && (
          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
            {data.staffConsistency.staffTurnoverImpact} staff-change disruptions
          </span>
        )}
      </div>

      {/* Child Routine Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        {data.childProfiles.map((child) => (
          <ChildRoutineCard key={child.childId} child={child} />
        ))}
      </div>

      {/* Immediate Actions */}
      {data.immediateActions.length > 0 &&
        !data.immediateActions[0].startsWith("No immediate actions") && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
            <h4 className="text-sm font-semibold text-amber-800 mb-2">Required Actions</h4>
            <ul className="space-y-1">
              {data.immediateActions.map((action, i) => (
                <li key={i} className="text-xs text-amber-700 flex items-start gap-1.5">
                  <span className="mt-0.5 shrink-0">
                    {action.startsWith("URGENT") ? "\u{1F534}" : action.startsWith("HIGH") ? "\u{1F7E0}" : "\u{1F7E1}"}
                  </span>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

      {/* Expand */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-sm text-blue-600 hover:text-blue-800 font-medium w-full text-left"
      >
        {expanded ? "Hide details ▲" : "Show phase breakdown, disruptions & regulatory links ▼"}
      </button>

      {expanded && (
        <div className="mt-4 space-y-4">
          {/* Phase Breakdown */}
          <div>
            <h4 className="text-sm font-semibold text-gray-800 mb-2">Phase-by-Phase Quality</h4>
            <div className="space-y-2">
              {data.phaseBreakdown.map((p) => (
                <div key={p.phase} className="flex items-center gap-2">
                  <span className="text-xs text-gray-600 w-28 shrink-0">{p.phaseLabel}</span>
                  <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${p.excellentOrGoodRate >= 80 ? "bg-green-400" : p.excellentOrGoodRate >= 60 ? "bg-blue-400" : p.excellentOrGoodRate >= 40 ? "bg-orange-400" : "bg-red-400"}`}
                      style={{ width: `${p.excellentOrGoodRate}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-10 text-right">{p.excellentOrGoodRate}%</span>
                  <MoodBar value={p.averageMood} />
                </div>
              ))}
            </div>
          </div>

          {/* Disruptions */}
          {(data.morningRoutine.commonDisruptions.length > 0 || data.eveningRoutine.commonDisruptions.length > 0) && (
            <div>
              <h4 className="text-sm font-semibold text-gray-800 mb-2">Common Disruptions</h4>
              <div className="flex flex-wrap gap-1.5">
                {[...data.morningRoutine.commonDisruptions, ...data.eveningRoutine.commonDisruptions]
                  .reduce((acc, d) => {
                    const existing = acc.find((e) => e.type === d.type);
                    if (existing) existing.count += d.count;
                    else acc.push({ ...d });
                    return acc;
                  }, [] as DisruptionData[])
                  .sort((a, b) => b.count - a.count)
                  .map((d) => (
                    <span key={d.type} className="text-[10px] bg-orange-50 text-orange-700 px-2 py-0.5 rounded">
                      {d.typeLabel ?? d.type.replace(/_/g, " ")}: {d.count}
                    </span>
                  ))}
              </div>
            </div>
          )}

          {/* Strengths */}
          {data.strengths.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-green-800 mb-2">Strengths</h4>
              <ul className="space-y-1">
                {data.strengths.map((s, i) => (
                  <li key={i} className="text-xs text-green-700">+ {s}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Areas for Development */}
          {data.areasForDevelopment.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-orange-800 mb-2">Areas for Development</h4>
              <ul className="space-y-1">
                {data.areasForDevelopment.map((area, i) => (
                  <li key={i} className="text-xs text-orange-700">- {area}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Regulatory Links */}
          {data.regulatoryLinks.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-800 mb-2">Regulatory References</h4>
              <ul className="space-y-1">
                {data.regulatoryLinks.map((link, i) => (
                  <li key={i} className="text-xs text-gray-600">{link}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

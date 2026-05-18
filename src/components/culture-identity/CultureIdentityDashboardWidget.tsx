"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CULTURE, IDENTITY & DIVERSITY DASHBOARD WIDGET
//
// Displays culture/identity intelligence:
// - Overall identity support rating
// - Assessment coverage and needs-met rates
// - Activity provision and engagement
// - Diversity incident analysis
// - Staff competence tracking
// - Per-child identity profiles
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";

interface ActivityTypeBreakdown {
  activityType: string;
  activityTypeLabel?: string;
  count: number;
}

interface DimensionBreakdown {
  dimension: string;
  dimensionLabel?: string;
  count: number;
}

interface IncidentTypeBreakdown {
  incidentType: string;
  incidentTypeLabel?: string;
  count: number;
}

interface TrainingTypeBreakdown {
  trainingType: string;
  trainingTypeLabel?: string;
  count: number;
}

interface ChildIdentityProfileData {
  childId: string;
  childName: string;
  hasAssessment: boolean;
  assessmentOverdue: boolean;
  needsIdentified: number;
  needsMet: number;
  needsUnmet: number;
  needsMetRate: number;
  activitiesCount: number;
  activityEngagementRate: number;
  childInitiatedCount: number;
  dimensionsCovered: string[];
  dimensionGaps: string[];
  incidentsAsVictim: number;
  primaryConcern?: string;
}

interface CultureIdentityData {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: string;
  identitySupport: {
    totalChildren: number;
    childrenWithAssessment: number;
    assessmentRate: number;
    totalNeedsIdentified: number;
    needsMet: number;
    needsPartiallyMet: number;
    needsUnmet: number;
    needsMetRate: number;
    dimensionCoverage: Record<string, number>;
  };
  activityProvision: {
    totalActivities: number;
    activitiesPerChild: number;
    childEngagementRate: number;
    childInitiatedRate: number;
    activityTypeBreakdown: ActivityTypeBreakdown[];
    dimensionBreakdown: DimensionBreakdown[];
    childrenWithNoActivities: string[];
  };
  incidentAnalysis: {
    totalIncidents: number;
    reportedRate: number;
    investigatedRate: number;
    resolvedRate: number;
    averageResolutionDays: number;
    typeBreakdown: IncidentTypeBreakdown[];
    staffIncidents: number;
    lessonsRecorded: number;
  };
  staffCompetence: {
    totalStaff: number;
    staffWithTraining: number;
    trainingRate: number;
    expiredTraining: number;
    trainingTypeBreakdown: TrainingTypeBreakdown[];
    staffMissingTraining: string[];
  };
  childProfiles: ChildIdentityProfileData[];
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

// ── Dimension Bar ──────────────────────────────────────────────────────────

function DimensionBar({ label, count, max }: { label: string; count: number; max: number }) {
  const width = max === 0 ? 0 : Math.round((count / max) * 100);
  const color = width >= 80 ? "bg-green-500" : width >= 50 ? "bg-blue-500" : width >= 25 ? "bg-orange-500" : "bg-red-500";

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-600 w-28 truncate">{label}</span>
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${width}%` }} />
      </div>
      <span className="text-xs font-semibold w-8 text-right">{count}</span>
    </div>
  );
}

// ── Child Identity Card ────────────────────────────────────────────────────

function ChildIdentityCard({ child }: { child: ChildIdentityProfileData }) {
  const rateColor = (r: number) =>
    r >= 80 ? "text-green-700" : r >= 60 ? "text-blue-700" : r >= 40 ? "text-orange-700" : "text-red-700";

  return (
    <div className={`rounded-lg border p-3 ${child.primaryConcern ? "border-red-200 bg-red-50" : "border-gray-200"}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-sm">{child.childName}</span>
        <div className="flex gap-1">
          {!child.hasAssessment && (
            <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded">NO ASSESSMENT</span>
          )}
          {child.assessmentOverdue && (
            <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">REVIEW DUE</span>
          )}
          {child.incidentsAsVictim > 0 && (
            <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded">{child.incidentsAsVictim} incident{child.incidentsAsVictim !== 1 ? "s" : ""}</span>
          )}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="text-xs text-gray-500">Needs Met</div>
          <div className={`text-sm font-bold ${rateColor(child.needsMetRate)}`}>
            {child.needsIdentified > 0 ? `${child.needsMet}/${child.needsIdentified}` : "—"}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Activities</div>
          <div className="text-sm font-bold text-gray-800">{child.activitiesCount}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Initiated</div>
          <div className="text-sm font-bold text-purple-700">{child.childInitiatedCount}</div>
        </div>
      </div>
      {child.dimensionGaps.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {child.dimensionGaps.slice(0, 3).map((gap) => (
            <span key={gap} className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
              {gap.replace(/_/g, " ")}
            </span>
          ))}
          {child.dimensionGaps.length > 3 && (
            <span className="text-[9px] text-gray-400">+{child.dimensionGaps.length - 3} more</span>
          )}
        </div>
      )}
      {child.primaryConcern && (
        <div className="mt-2 text-[10px] text-red-700 bg-red-100 rounded px-2 py-1">{child.primaryConcern}</div>
      )}
    </div>
  );
}

// ── Main Widget ────────────────────────────────────────────────────────────

export function CultureIdentityDashboardWidget() {
  const [data, setData] = useState<CultureIdentityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/culture-identity");
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
        <h3 className="font-semibold text-red-800">Culture & Identity Intelligence</h3>
        <p className="text-sm text-red-600 mt-1">{error ?? "No data available"}</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900 text-lg">Culture, Identity & Diversity</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {data.identitySupport.totalChildren} children | {data.activityProvision.totalActivities} identity activities | Reg 11 & Equality Act
          </p>
        </div>
        <RatingBadge score={data.overallScore} rating={data.rating} />
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="text-center p-2 bg-green-50 rounded-lg">
          <div className="text-xl font-bold text-green-700">{data.identitySupport.assessmentRate}%</div>
          <div className="text-[10px] text-gray-500 uppercase">Assessed</div>
        </div>
        <div className="text-center p-2 bg-blue-50 rounded-lg">
          <div className="text-xl font-bold text-blue-700">{data.identitySupport.needsMetRate}%</div>
          <div className="text-[10px] text-gray-500 uppercase">Needs Met</div>
        </div>
        <div className="text-center p-2 bg-purple-50 rounded-lg">
          <div className="text-xl font-bold text-purple-700">{data.activityProvision.childEngagementRate}%</div>
          <div className="text-[10px] text-gray-500 uppercase">Engagement</div>
        </div>
        <div className="text-center p-2 bg-orange-50 rounded-lg">
          <div className="text-xl font-bold text-orange-700">{data.staffCompetence.trainingRate}%</div>
          <div className="text-[10px] text-gray-500 uppercase">Staff Trained</div>
        </div>
      </div>

      {/* Activity Dimension Breakdown */}
      <div className="mb-4">
        <h4 className="text-xs font-semibold text-gray-600 uppercase mb-2">Identity Activities by Dimension</h4>
        <div className="space-y-2">
          {data.activityProvision.dimensionBreakdown.map((dim) => (
            <DimensionBar
              key={dim.dimension}
              label={dim.dimensionLabel ?? dim.dimension.replace(/_/g, " ")}
              count={dim.count}
              max={data.activityProvision.totalActivities}
            />
          ))}
        </div>
      </div>

      {/* Alert Badges */}
      {(data.identitySupport.needsUnmet > 0 || data.incidentAnalysis.totalIncidents > 0 || data.staffCompetence.expiredTraining > 0) && (
        <div className="flex flex-wrap gap-2 mb-4">
          {data.identitySupport.needsUnmet > 0 && (
            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
              {data.identitySupport.needsUnmet} need{data.identitySupport.needsUnmet !== 1 ? "s" : ""} unmet
            </span>
          )}
          {data.identitySupport.needsPartiallyMet > 0 && (
            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
              {data.identitySupport.needsPartiallyMet} partially met
            </span>
          )}
          {data.incidentAnalysis.totalIncidents > 0 && (
            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
              {data.incidentAnalysis.totalIncidents} incident{data.incidentAnalysis.totalIncidents !== 1 ? "s" : ""} recorded
            </span>
          )}
          {data.incidentAnalysis.staffIncidents > 0 && (
            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded font-semibold">
              {data.incidentAnalysis.staffIncidents} staff incident{data.incidentAnalysis.staffIncidents !== 1 ? "s" : ""}
            </span>
          )}
          {data.staffCompetence.expiredTraining > 0 && (
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
              {data.staffCompetence.expiredTraining} expired training
            </span>
          )}
        </div>
      )}

      {/* Child Identity Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        {data.childProfiles.map((child) => (
          <ChildIdentityCard key={child.childId} child={child} />
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
        {expanded ? "Hide details ▲" : "Show incidents, training & regulatory links ▼"}
      </button>

      {expanded && (
        <div className="mt-4 space-y-4">
          {/* Incident Summary */}
          {data.incidentAnalysis.totalIncidents > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-800 mb-2">Diversity Incidents</h4>
              <div className="grid grid-cols-4 gap-2 text-center mb-2">
                <div className="p-1.5 bg-green-50 rounded">
                  <div className="text-sm font-bold text-green-700">{data.incidentAnalysis.reportedRate}%</div>
                  <div className="text-[9px] text-gray-500">Reported</div>
                </div>
                <div className="p-1.5 bg-blue-50 rounded">
                  <div className="text-sm font-bold text-blue-700">{data.incidentAnalysis.investigatedRate}%</div>
                  <div className="text-[9px] text-gray-500">Investigated</div>
                </div>
                <div className="p-1.5 bg-purple-50 rounded">
                  <div className="text-sm font-bold text-purple-700">{data.incidentAnalysis.resolvedRate}%</div>
                  <div className="text-[9px] text-gray-500">Resolved</div>
                </div>
                <div className="p-1.5 bg-orange-50 rounded">
                  <div className="text-sm font-bold text-orange-700">{data.incidentAnalysis.averageResolutionDays}d</div>
                  <div className="text-[9px] text-gray-500">Avg Resolution</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {data.incidentAnalysis.typeBreakdown.map((t) => (
                  <span key={t.incidentType} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                    {t.incidentTypeLabel ?? t.incidentType.replace(/_/g, " ")}: {t.count}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Staff Training */}
          <div>
            <h4 className="text-sm font-semibold text-gray-800 mb-2">Staff Training Coverage</h4>
            <div className="flex flex-wrap gap-1.5">
              {data.staffCompetence.trainingTypeBreakdown.map((t) => (
                <span key={t.trainingType} className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                  {t.trainingTypeLabel ?? t.trainingType.replace(/_/g, " ")}: {t.count}
                </span>
              ))}
            </div>
            {data.staffCompetence.staffMissingTraining.length > 0 && (
              <p className="text-xs text-red-600 mt-1">
                Missing training: {data.staffCompetence.staffMissingTraining.join(", ")}
              </p>
            )}
          </div>

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

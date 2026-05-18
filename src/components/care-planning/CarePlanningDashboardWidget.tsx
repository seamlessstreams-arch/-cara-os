"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARE PLANNING COMPLIANCE DASHBOARD WIDGET
//
// Displays care planning intelligence:
// - Overall planning compliance rating
// - Review timeliness and completion
// - Action completion tracking
// - Document currency
// - Per-child planning profiles
// - Participation rates
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";

interface ReviewTypeData {
  reviewType: string;
  reviewTypeLabel?: string;
  total: number;
  onTime: number;
  late: number;
  overdue: number;
  onTimeRate: number;
}

interface ChildProfileData {
  childId: string;
  childName: string;
  reviewsDue: number;
  reviewsCompleted: number;
  reviewsOverdue: number;
  actionCompletionRate: number;
  actionsOverdue: number;
  documentsUpToDate: number;
  documentsOutdated: number;
  childParticipationRate: number;
  primaryConcern?: string;
}

interface CarePlanningData {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: string;
  reviewCompliance: {
    totalReviewsDue: number;
    completedOnTime: number;
    completedLate: number;
    overdue: number;
    scheduled: number;
    cancelled: number;
    onTimeRate: number;
    completionRate: number;
  };
  reviewTypeBreakdown: ReviewTypeData[];
  actionCompliance: {
    totalActions: number;
    completed: number;
    inProgress: number;
    overdue: number;
    notStarted: number;
    completionRate: number;
    overdueRate: number;
  };
  documentsUpToDate: number;
  documentsOutdated: number;
  documentCurrencyRate: number;
  childParticipationRate: number;
  parentParticipationRate: number;
  socialWorkerAttendanceRate: number;
  childProfiles: ChildProfileData[];
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

// ── Review Type Row ───────────────────────────────────────────────────────

function ReviewTypeRow({ type }: { type: ReviewTypeData }) {
  const barColor = type.onTimeRate >= 80 ? "bg-green-500" : type.onTimeRate >= 60 ? "bg-blue-500" : type.onTimeRate >= 40 ? "bg-orange-500" : "bg-red-500";

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-600 w-32 truncate">{type.reviewTypeLabel ?? type.reviewType.replace(/_/g, " ")}</span>
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${type.onTimeRate}%` }} />
      </div>
      <span className="text-xs font-semibold w-12 text-right">{type.onTimeRate}%</span>
      {type.overdue > 0 && <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded">{type.overdue} overdue</span>}
    </div>
  );
}

// ── Child Planning Card ───────────────────────────────────────────────────

function ChildPlanningCard({ child }: { child: ChildProfileData }) {
  const rateColor = (r: number) =>
    r >= 80 ? "text-green-700" : r >= 60 ? "text-blue-700" : r >= 40 ? "text-orange-700" : "text-red-700";

  return (
    <div className={`rounded-lg border p-3 ${child.primaryConcern ? "border-red-200 bg-red-50" : "border-gray-200"}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-sm">{child.childName}</span>
        {child.reviewsOverdue > 0 && (
          <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded">{child.reviewsOverdue} overdue</span>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="text-xs text-gray-500">Reviews</div>
          <div className="text-sm font-bold text-gray-800">{child.reviewsCompleted}/{child.reviewsDue}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Actions</div>
          <div className={`text-sm font-bold ${rateColor(child.actionCompletionRate)}`}>{child.actionCompletionRate}%</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Docs</div>
          <div className={`text-sm font-bold ${child.documentsOutdated > 0 ? "text-red-700" : "text-green-700"}`}>
            {child.documentsUpToDate}/{child.documentsUpToDate + child.documentsOutdated}
          </div>
        </div>
      </div>
      {child.primaryConcern && (
        <div className="mt-2 text-[10px] text-red-700 bg-red-100 rounded px-2 py-1">{child.primaryConcern}</div>
      )}
    </div>
  );
}

// ── Main Widget ────────────────────────────────────────────────────────────

export function CarePlanningDashboardWidget() {
  const [data, setData] = useState<CarePlanningData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/care-planning");
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
        <h3 className="font-semibold text-red-800">Care Planning Intelligence</h3>
        <p className="text-sm text-red-600 mt-1">{error ?? "No data available"}</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900 text-lg">Care Planning Intelligence</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {data.reviewCompliance.totalReviewsDue} reviews due | {data.actionCompliance.totalActions} actions tracked | Reg 14 compliance
          </p>
        </div>
        <RatingBadge score={data.overallScore} rating={data.rating} />
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="text-center p-2 bg-green-50 rounded-lg">
          <div className="text-xl font-bold text-green-700">{data.reviewCompliance.onTimeRate}%</div>
          <div className="text-[10px] text-gray-500 uppercase">Reviews On Time</div>
        </div>
        <div className="text-center p-2 bg-blue-50 rounded-lg">
          <div className="text-xl font-bold text-blue-700">{data.actionCompliance.completionRate}%</div>
          <div className="text-[10px] text-gray-500 uppercase">Actions Complete</div>
        </div>
        <div className="text-center p-2 bg-purple-50 rounded-lg">
          <div className="text-xl font-bold text-purple-700">{data.documentCurrencyRate}%</div>
          <div className="text-[10px] text-gray-500 uppercase">Docs Up-to-Date</div>
        </div>
        <div className="text-center p-2 bg-orange-50 rounded-lg">
          <div className="text-xl font-bold text-orange-700">{data.childParticipationRate}%</div>
          <div className="text-[10px] text-gray-500 uppercase">Child Participation</div>
        </div>
      </div>

      {/* Review Type Breakdown */}
      <div className="mb-4">
        <h4 className="text-xs font-semibold text-gray-600 uppercase mb-2">Review Timeliness by Type</h4>
        <div className="space-y-2">
          {data.reviewTypeBreakdown.map((type) => (
            <ReviewTypeRow key={type.reviewType} type={type} />
          ))}
        </div>
      </div>

      {/* Overdue/Late Summary */}
      {(data.reviewCompliance.overdue > 0 || data.reviewCompliance.completedLate > 0 || data.actionCompliance.overdue > 0) && (
        <div className="flex flex-wrap gap-2 mb-4">
          {data.reviewCompliance.overdue > 0 && (
            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">{data.reviewCompliance.overdue} review{data.reviewCompliance.overdue !== 1 ? "s" : ""} overdue</span>
          )}
          {data.reviewCompliance.completedLate > 0 && (
            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">{data.reviewCompliance.completedLate} completed late</span>
          )}
          {data.actionCompliance.overdue > 0 && (
            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">{data.actionCompliance.overdue} action{data.actionCompliance.overdue !== 1 ? "s" : ""} overdue</span>
          )}
          {data.documentsOutdated > 0 && (
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">{data.documentsOutdated} document{data.documentsOutdated !== 1 ? "s" : ""} outdated</span>
          )}
        </div>
      )}

      {/* Child Planning Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        {data.childProfiles.map((child) => (
          <ChildPlanningCard key={child.childId} child={child} />
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
                    {action.startsWith("URGENT") ? "🔴" : action.startsWith("HIGH") ? "🟠" : "🟡"}
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
        {expanded ? "Hide details ▲" : "Show participation, strengths & regulatory links ▼"}
      </button>

      {expanded && (
        <div className="mt-4 space-y-4">
          {/* Participation */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-2 bg-green-50 rounded">
              <div className="text-lg font-bold text-green-700">{data.childParticipationRate}%</div>
              <div className="text-[10px] text-gray-500">Child Participation</div>
            </div>
            <div className="text-center p-2 bg-blue-50 rounded">
              <div className="text-lg font-bold text-blue-700">{data.parentParticipationRate}%</div>
              <div className="text-[10px] text-gray-500">Parent Participation</div>
            </div>
            <div className="text-center p-2 bg-purple-50 rounded">
              <div className="text-lg font-bold text-purple-700">{data.socialWorkerAttendanceRate}%</div>
              <div className="text-[10px] text-gray-500">SW Attendance</div>
            </div>
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

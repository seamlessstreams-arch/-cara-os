"use client";

// ══════════════════════════════════════════════════════════════════════════════
// REG 44 COMPLIANCE INTELLIGENCE DASHBOARD WIDGET
//
// Displays Reg 44 compliance intelligence:
// - Overall compliance rating
// - Visit compliance (monthly frequency, independence, quality)
// - Recommendation tracking (completion, overdue, impact)
// - Child participation (voice of the child, coverage)
// - Management response (timeliness, action plans, RI sharing)
// - Visit timeline
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";

interface Reg44Data {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  referenceDate: string;
  overallScore: number;
  rating: string;
  visitCompliance: {
    totalVisitsExpected: number;
    totalVisitsCompleted: number;
    visitCompletionRate: number;
    independentVisitorRate: number;
    nonIndependentVisits: string[];
    averageChildrenSpoken: number;
    averageStaffSpoken: number;
    recordsReviewedRate: number;
    environmentInspectedRate: number;
    reportOnTimeRate: number;
    ofstedSharedRate: number;
    ratingBreakdown: { rating: string; count: number }[];
    focusAreaCoverage: { area: string; areaLabel?: string; count: number }[];
    missedMonths: string[];
    longestGapDays: number;
    averageConcernsPerVisit: number;
    averagePositiveFindingsPerVisit: number;
  };
  recommendations: {
    totalRecommendations: number;
    completedCount: number;
    completionRate: number;
    openCount: number;
    inProgressCount: number;
    overdueCount: number;
    rejectedCount: number;
    overdueRate: number;
    priorityBreakdown: { priority: string; priorityLabel?: string; count: number; completedCount: number }[];
    averageCompletionDays: number;
    impactAssessedRate: number;
    withEvidenceRate: number;
    overdueRecommendations: { id: string; description: string; priority: string; priorityLabel?: string; targetDate: string }[];
  };
  childParticipation: {
    totalRecords: number;
    childrenSpokenToRate: number;
    viewsCapturedRate: number;
    positiveFeedbackRate: number;
    totalIssuesRaised: number;
    issuesActionedRate: number;
    childCoverage: number;
    childCoverageBreakdown: { childId: string; childName: string; timesSpokenTo: number; totalVisits: number }[];
    unheardChildren: { childId: string; childName: string }[];
  };
  managementResponse: {
    totalResponses: number;
    respondedOnTimeRate: number;
    averageAcceptanceRate: number;
    averageRejectionRate: number;
    actionPlanCreatedRate: number;
    sharedWithRIRate: number;
    totalRejectionReasons: string[];
    visitsMissingResponse: string[];
  };
  visitTimeline: {
    visitId: string;
    visitDate: string;
    visitor: string;
    overallRating: string;
    recommendationCount: number;
    completedRecommendations: number;
    childrenParticipated: number;
    totalChildren: number;
    hasManagementResponse: boolean;
    respondedOnTime: boolean;
    concerns: string[];
    positiveFindings: string[];
  }[];
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

// ── Compliance Gauge ───────────────────────────────────────────────────────

function ComplianceGauge({ label, value, suffix }: { label: string; value: number; suffix?: string }) {
  const color = value >= 90 ? "bg-green-500" : value >= 75 ? "bg-blue-500" : value >= 50 ? "bg-orange-500" : "bg-red-500";
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="font-semibold">{value}{suffix ?? "%"}</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
    </div>
  );
}

// ── Recommendation Status Card ─────────────────────────────────────────────

function RecommendationStatusCard({ recs }: { recs: Reg44Data["recommendations"] }) {
  return (
    <div className="rounded-lg border border-gray-200 p-3">
      <h4 className="text-xs font-semibold text-gray-700 uppercase mb-2">Recommendations</h4>
      <div className="grid grid-cols-4 gap-1 text-center mb-2">
        <div>
          <div className="text-sm font-bold text-green-700">{recs.completedCount}</div>
          <div className="text-[9px] text-gray-500">Done</div>
        </div>
        <div>
          <div className="text-sm font-bold text-blue-700">{recs.inProgressCount}</div>
          <div className="text-[9px] text-gray-500">Active</div>
        </div>
        <div>
          <div className="text-sm font-bold text-red-700">{recs.overdueCount}</div>
          <div className="text-[9px] text-gray-500">Overdue</div>
        </div>
        <div>
          <div className="text-sm font-bold text-gray-500">{recs.openCount}</div>
          <div className="text-[9px] text-gray-500">Open</div>
        </div>
      </div>
      <ComplianceGauge label="Completion Rate" value={recs.completionRate} />
    </div>
  );
}

// ── Child Voice Card ───────────────────────────────────────────────────────

function ChildVoiceCard({ cp }: { cp: Reg44Data["childParticipation"] }) {
  return (
    <div className="rounded-lg border border-gray-200 p-3">
      <h4 className="text-xs font-semibold text-gray-700 uppercase mb-2">Voice of the Child</h4>
      <div className="grid grid-cols-3 gap-1 text-center mb-2">
        <div>
          <div className="text-sm font-bold text-green-700">{cp.childCoverage}%</div>
          <div className="text-[9px] text-gray-500">Coverage</div>
        </div>
        <div>
          <div className="text-sm font-bold text-blue-700">{cp.viewsCapturedRate}%</div>
          <div className="text-[9px] text-gray-500">Views Captured</div>
        </div>
        <div>
          <div className="text-sm font-bold text-purple-700">{cp.positiveFeedbackRate}%</div>
          <div className="text-[9px] text-gray-500">Positive</div>
        </div>
      </div>
      {cp.unheardChildren.length > 0 && (
        <div className="text-[10px] text-red-600 mt-1">
          Not spoken to: {cp.unheardChildren.map((c) => c.childName).join(", ")}
        </div>
      )}
      {cp.totalIssuesRaised > 0 && (
        <div className="flex gap-1.5 mt-1">
          <span className="text-[9px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">
            {cp.totalIssuesRaised} issue{cp.totalIssuesRaised !== 1 ? "s" : ""} raised
          </span>
          <span className={`text-[9px] px-1.5 py-0.5 rounded ${cp.issuesActionedRate === 100 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
            {cp.issuesActionedRate}% actioned
          </span>
        </div>
      )}
    </div>
  );
}

// ── Main Widget ────────────────────────────────────────────────────────────

export function Reg44ComplianceDashboardWidget() {
  const [data, setData] = useState<Reg44Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/reg44-compliance");
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
        <h3 className="font-semibold text-red-800">Reg 44 Compliance Intelligence</h3>
        <p className="text-sm text-red-600 mt-1">{error ?? "No data available"}</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900 text-lg">Reg 44 Compliance Intelligence</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            CHR 2015 Reg 44/45 | NMS 25 | {data.visitCompliance.totalVisitsCompleted}/{data.visitCompliance.totalVisitsExpected} visits
          </p>
        </div>
        <RatingBadge score={data.overallScore} rating={data.rating} />
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="text-center p-2 bg-green-50 rounded-lg">
          <div className="text-xl font-bold text-green-700">{data.visitCompliance.visitCompletionRate}%</div>
          <div className="text-[10px] text-gray-500 uppercase">Visit Completion</div>
        </div>
        <div className="text-center p-2 bg-blue-50 rounded-lg">
          <div className="text-xl font-bold text-blue-700">{data.recommendations.completionRate}%</div>
          <div className="text-[10px] text-gray-500 uppercase">Recs Completed</div>
        </div>
        <div className="text-center p-2 bg-purple-50 rounded-lg">
          <div className="text-xl font-bold text-purple-700">{data.childParticipation.childCoverage}%</div>
          <div className="text-[10px] text-gray-500 uppercase">Child Coverage</div>
        </div>
        <div className="text-center p-2 bg-orange-50 rounded-lg">
          <div className="text-xl font-bold text-orange-700">{data.managementResponse.respondedOnTimeRate}%</div>
          <div className="text-[10px] text-gray-500 uppercase">Response On Time</div>
        </div>
      </div>

      {/* Recommendations + Child Voice Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <RecommendationStatusCard recs={data.recommendations} />
        <ChildVoiceCard cp={data.childParticipation} />
      </div>

      {/* Compliance Gauges */}
      <div className="space-y-2 mb-4">
        <ComplianceGauge label="Visitor Independence" value={data.visitCompliance.independentVisitorRate} />
        <ComplianceGauge label="Report On-Time" value={data.visitCompliance.reportOnTimeRate} />
        <ComplianceGauge label="Ofsted Shared" value={data.visitCompliance.ofstedSharedRate} />
        <ComplianceGauge label="Impact Assessed" value={data.recommendations.impactAssessedRate} />
        <ComplianceGauge label="Action Plans Created" value={data.managementResponse.actionPlanCreatedRate} />
        <ComplianceGauge label="Shared with RI" value={data.managementResponse.sharedWithRIRate} />
      </div>

      {/* Alert Badges */}
      {(data.visitCompliance.missedMonths.length > 0 || data.recommendations.overdueCount > 0 || data.visitCompliance.nonIndependentVisits.length > 0 || data.managementResponse.visitsMissingResponse.length > 0 || data.childParticipation.unheardChildren.length > 0) && (
        <div className="flex flex-wrap gap-2 mb-4">
          {data.visitCompliance.missedMonths.length > 0 && (
            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded font-semibold">
              {data.visitCompliance.missedMonths.length} missed month{data.visitCompliance.missedMonths.length !== 1 ? "s" : ""}
            </span>
          )}
          {data.recommendations.overdueCount > 0 && (
            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
              {data.recommendations.overdueCount} rec{data.recommendations.overdueCount !== 1 ? "s" : ""} overdue
            </span>
          )}
          {data.visitCompliance.nonIndependentVisits.length > 0 && (
            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
              {data.visitCompliance.nonIndependentVisits.length} non-independent visit{data.visitCompliance.nonIndependentVisits.length !== 1 ? "s" : ""}
            </span>
          )}
          {data.managementResponse.visitsMissingResponse.length > 0 && (
            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
              {data.managementResponse.visitsMissingResponse.length} response{data.managementResponse.visitsMissingResponse.length !== 1 ? "s" : ""} missing
            </span>
          )}
          {data.childParticipation.unheardChildren.length > 0 && (
            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
              {data.childParticipation.unheardChildren.length} child{data.childParticipation.unheardChildren.length !== 1 ? "ren" : ""} not spoken to
            </span>
          )}
        </div>
      )}

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
        {expanded ? "Hide details ▲" : "Show timeline, child coverage & regulatory links ▼"}
      </button>

      {expanded && (
        <div className="mt-4 space-y-4">
          {/* Visit Timeline */}
          {data.visitTimeline.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-800 mb-2">Visit Timeline</h4>
              <div className="space-y-2">
                {data.visitTimeline.map((entry) => {
                  const ratingColor =
                    entry.overallRating === "outstanding" ? "text-green-700"
                      : entry.overallRating === "good" ? "text-blue-700"
                        : entry.overallRating === "requires_improvement" ? "text-orange-700"
                          : "text-red-700";
                  return (
                    <div key={entry.visitId} className="flex items-center gap-3 text-xs border-l-2 border-gray-200 pl-3 py-1">
                      <span className="text-gray-500 w-20 shrink-0">{entry.visitDate}</span>
                      <span className={`font-semibold capitalize ${ratingColor}`}>
                        {entry.overallRating.replace(/_/g, " ")}
                      </span>
                      <span className="text-gray-400">|</span>
                      <span className="text-gray-600">
                        {entry.childrenParticipated}/{entry.totalChildren} children
                      </span>
                      <span className="text-gray-400">|</span>
                      <span className="text-gray-600">
                        {entry.completedRecommendations}/{entry.recommendationCount} recs done
                      </span>
                      {entry.hasManagementResponse && (
                        <span className="text-[9px] bg-green-100 text-green-700 px-1 py-0.5 rounded">Response</span>
                      )}
                      {!entry.hasManagementResponse && (
                        <span className="text-[9px] bg-red-100 text-red-700 px-1 py-0.5 rounded">No response</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Child Coverage Breakdown */}
          {data.childParticipation.childCoverageBreakdown.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-800 mb-2">Child Participation</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {data.childParticipation.childCoverageBreakdown.map((child) => (
                  <div key={child.childId} className="text-center p-2 bg-gray-50 rounded-lg">
                    <div className="text-sm font-bold text-gray-800">{child.childName}</div>
                    <div className="text-xs text-gray-500">
                      Spoken to {child.timesSpokenTo}/{child.totalVisits} visits
                    </div>
                    <ComplianceGauge
                      label=""
                      value={child.totalVisits === 0 ? 0 : Math.round((child.timesSpokenTo / child.totalVisits) * 100)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Focus Area Coverage */}
          {data.visitCompliance.focusAreaCoverage.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-800 mb-2">Focus Area Coverage</h4>
              <div className="flex flex-wrap gap-1.5">
                {data.visitCompliance.focusAreaCoverage.map((f) => (
                  <span key={f.area} className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                    {f.areaLabel ?? f.area.replace(/_/g, " ")}: {f.count}x
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Management Response Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-2 bg-green-50 rounded">
              <div className="text-lg font-bold text-green-700">{data.managementResponse.averageAcceptanceRate}%</div>
              <div className="text-[10px] text-gray-500">Acceptance Rate</div>
            </div>
            <div className="text-center p-2 bg-blue-50 rounded">
              <div className="text-lg font-bold text-blue-700">{data.recommendations.impactAssessedRate}%</div>
              <div className="text-[10px] text-gray-500">Impact Assessed</div>
            </div>
            <div className="text-center p-2 bg-purple-50 rounded">
              <div className="text-lg font-bold text-purple-700">{data.recommendations.withEvidenceRate}%</div>
              <div className="text-[10px] text-gray-500">Evidence Provided</div>
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

"use client";

// ══════════════════════════════════════════════════════════════════════════════
// GOVERNANCE & LEADERSHIP DASHBOARD WIDGET
//
// Displays governance intelligence:
// - Overall governance/leadership rating
// - Statement of Purpose compliance
// - Reg 45 monitoring completion
// - Policy review status
// - Development plan progress
// - Notification timeliness
// - Staff meeting compliance
// - Management presence
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";

interface GovernanceData {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: string;
  sopCompliance: {
    isReviewed: boolean;
    isOverdue: boolean;
    daysSinceReview: number;
    sharedWithOfsted: boolean;
    accuracyRate: number;
    childrenGuide: {
      available: boolean;
      accessibleFormats: number;
    };
  };
  reg45Compliance: {
    totalExpected: number;
    completed: number;
    completionRate: number;
    ofstedSubmissionRate: number;
    actionCompletionRate: number;
    childrenConsultedRate: number;
    overdueReports: string[];
  };
  policyCompliance: {
    totalPolicies: number;
    upToDate: number;
    overdue: number;
    complianceRate: number;
    averageStaffAcknowledgementRate: number;
    policiesNearingReview: { policyName: string; nextReviewDue: string }[];
  };
  notificationCompliance: {
    totalNotifications: number;
    withinTimescale: number;
    outsideTimescale: number;
    timelinesRate: number;
    averageResponseHours: number;
    typeBreakdown: { notificationType: string; notificationTypeLabel?: string; count: number }[];
  };
  developmentPlan: {
    totalObjectives: number;
    completed: number;
    inProgress: number;
    overdue: number;
    notStarted: number;
    completionRate: number;
    averageProgress: number;
  };
  meetingCompliance: {
    totalMeetings: number;
    staffMeetings: number;
    averageAttendanceRate: number;
    minutesRecordedRate: number;
    actionCompletionRate: number;
    meetingsPerMonth: number;
  };
  managementPresence: {
    averageRmHoursInHome: number;
    averageRmPresenceRate: number;
    averageChildInteractions: number;
    weeksWithLowPresence: number;
    totalWeeksTracked: number;
  };
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

// ── SoP Status Card ────────────────────────────────────────────────────────

function SoPStatusCard({ sop }: { sop: GovernanceData["sopCompliance"] }) {
  return (
    <div className={`rounded-lg border p-3 ${sop.isOverdue ? "border-red-200 bg-red-50" : "border-gray-200"}`}>
      <h4 className="text-xs font-semibold text-gray-700 uppercase mb-2">Statement of Purpose</h4>
      <div className="grid grid-cols-2 gap-2 text-center">
        <div>
          <div className={`text-sm font-bold ${sop.isOverdue ? "text-red-700" : "text-green-700"}`}>
            {sop.isOverdue ? "OVERDUE" : "Current"}
          </div>
          <div className="text-[10px] text-gray-500">Review Status</div>
        </div>
        <div>
          <div className={`text-sm font-bold ${sop.accuracyRate === 100 ? "text-green-700" : "text-orange-700"}`}>
            {sop.accuracyRate}%
          </div>
          <div className="text-[10px] text-gray-500">Accuracy</div>
        </div>
      </div>
      <div className="flex gap-1.5 mt-2">
        {sop.sharedWithOfsted && (
          <span className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">Ofsted shared</span>
        )}
        {sop.childrenGuide.available && (
          <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
            Guide: {sop.childrenGuide.accessibleFormats} format{sop.childrenGuide.accessibleFormats !== 1 ? "s" : ""}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Development Plan Summary ───────────────────────────────────────────────

function DevPlanSummary({ plan }: { plan: GovernanceData["developmentPlan"] }) {
  return (
    <div className="rounded-lg border border-gray-200 p-3">
      <h4 className="text-xs font-semibold text-gray-700 uppercase mb-2">Development Plan</h4>
      <div className="grid grid-cols-4 gap-1 text-center mb-2">
        <div>
          <div className="text-sm font-bold text-green-700">{plan.completed}</div>
          <div className="text-[9px] text-gray-500">Done</div>
        </div>
        <div>
          <div className="text-sm font-bold text-blue-700">{plan.inProgress}</div>
          <div className="text-[9px] text-gray-500">Active</div>
        </div>
        <div>
          <div className="text-sm font-bold text-red-700">{plan.overdue}</div>
          <div className="text-[9px] text-gray-500">Overdue</div>
        </div>
        <div>
          <div className="text-sm font-bold text-gray-500">{plan.notStarted}</div>
          <div className="text-[9px] text-gray-500">Pending</div>
        </div>
      </div>
      <ComplianceGauge label="Average Progress" value={plan.averageProgress} />
    </div>
  );
}

// ── Main Widget ────────────────────────────────────────────────────────────

export function GovernanceDashboardWidget() {
  const [data, setData] = useState<GovernanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/governance");
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
        <h3 className="font-semibold text-red-800">Governance & Leadership</h3>
        <p className="text-sm text-red-600 mt-1">{error ?? "No data available"}</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900 text-lg">Governance & Leadership</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            SCCIF Judgement 3 | Reg 16, 45, 39/40 | {data.policyCompliance.totalPolicies} policies tracked
          </p>
        </div>
        <RatingBadge score={data.overallScore} rating={data.rating} />
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="text-center p-2 bg-green-50 rounded-lg">
          <div className="text-xl font-bold text-green-700">{data.reg45Compliance.completionRate}%</div>
          <div className="text-[10px] text-gray-500 uppercase">Reg 45 Complete</div>
        </div>
        <div className="text-center p-2 bg-blue-50 rounded-lg">
          <div className="text-xl font-bold text-blue-700">{data.policyCompliance.complianceRate}%</div>
          <div className="text-[10px] text-gray-500 uppercase">Policies Current</div>
        </div>
        <div className="text-center p-2 bg-purple-50 rounded-lg">
          <div className="text-xl font-bold text-purple-700">{data.notificationCompliance.timelinesRate}%</div>
          <div className="text-[10px] text-gray-500 uppercase">Notifications Timely</div>
        </div>
        <div className="text-center p-2 bg-orange-50 rounded-lg">
          <div className="text-xl font-bold text-orange-700">{data.managementPresence.averageRmPresenceRate}%</div>
          <div className="text-[10px] text-gray-500 uppercase">RM Presence</div>
        </div>
      </div>

      {/* SoP + Dev Plan Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <SoPStatusCard sop={data.sopCompliance} />
        <DevPlanSummary plan={data.developmentPlan} />
      </div>

      {/* Compliance Gauges */}
      <div className="space-y-2 mb-4">
        <ComplianceGauge label="Reg 45 Action Completion" value={data.reg45Compliance.actionCompletionRate} />
        <ComplianceGauge label="Staff Meeting Attendance" value={data.meetingCompliance.averageAttendanceRate} />
        <ComplianceGauge label="Staff Policy Acknowledgement" value={data.policyCompliance.averageStaffAcknowledgementRate} />
        <ComplianceGauge label="Meeting Actions Completed" value={data.meetingCompliance.actionCompletionRate} />
      </div>

      {/* Alert Badges */}
      {(data.reg45Compliance.overdueReports.length > 0 || data.policyCompliance.overdue > 0 || data.notificationCompliance.outsideTimescale > 0 || data.developmentPlan.overdue > 0) && (
        <div className="flex flex-wrap gap-2 mb-4">
          {data.reg45Compliance.overdueReports.length > 0 && (
            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
              {data.reg45Compliance.overdueReports.length} Reg 45 report{data.reg45Compliance.overdueReports.length !== 1 ? "s" : ""} outstanding
            </span>
          )}
          {data.policyCompliance.overdue > 0 && (
            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
              {data.policyCompliance.overdue} polic{data.policyCompliance.overdue !== 1 ? "ies" : "y"} overdue
            </span>
          )}
          {data.notificationCompliance.outsideTimescale > 0 && (
            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded font-semibold">
              {data.notificationCompliance.outsideTimescale} late notification{data.notificationCompliance.outsideTimescale !== 1 ? "s" : ""}
            </span>
          )}
          {data.developmentPlan.overdue > 0 && (
            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
              {data.developmentPlan.overdue} objective{data.developmentPlan.overdue !== 1 ? "s" : ""} overdue
            </span>
          )}
          {data.policyCompliance.policiesNearingReview.length > 0 && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
              {data.policyCompliance.policiesNearingReview.length} polic{data.policyCompliance.policiesNearingReview.length !== 1 ? "ies" : "y"} review due soon
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
        {expanded ? "Hide details ▲" : "Show strengths, notifications & regulatory links ▼"}
      </button>

      {expanded && (
        <div className="mt-4 space-y-4">
          {/* Management Presence */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-2 bg-green-50 rounded">
              <div className="text-lg font-bold text-green-700">{data.managementPresence.averageRmHoursInHome}h</div>
              <div className="text-[10px] text-gray-500">RM Hours/Week</div>
            </div>
            <div className="text-center p-2 bg-blue-50 rounded">
              <div className="text-lg font-bold text-blue-700">{data.managementPresence.averageChildInteractions}</div>
              <div className="text-[10px] text-gray-500">Child Interactions/Wk</div>
            </div>
            <div className="text-center p-2 bg-purple-50 rounded">
              <div className="text-lg font-bold text-purple-700">{data.meetingCompliance.meetingsPerMonth}</div>
              <div className="text-[10px] text-gray-500">Meetings/Month</div>
            </div>
          </div>

          {/* Notification Types */}
          {data.notificationCompliance.totalNotifications > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-800 mb-2">Notifications ({data.notificationCompliance.totalNotifications})</h4>
              <div className="flex flex-wrap gap-1.5">
                {data.notificationCompliance.typeBreakdown.map((t) => (
                  <span key={t.notificationType} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                    {t.notificationTypeLabel ?? t.notificationType.replace(/_/g, " ")}: {t.count}
                  </span>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Avg response: {data.notificationCompliance.averageResponseHours}h
              </p>
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

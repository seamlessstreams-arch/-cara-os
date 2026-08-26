"use client";

// ══════════════════════════════════════════════════════════════════════════════
// COURT ORDER COMPLIANCE DASHBOARD WIDGET
//
// Displays the 4-layer court order compliance intelligence:
// - Overall score with Ofsted-aligned rating
// - Layer scores: order compliance, review timeliness, legal engagement, staff knowledge
// - Child order profiles
// - Strengths, areas for improvement, and urgent actions
// - Regulatory references
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";
import { formatRate } from "@/lib/metrics/rate";

// ── Local interfaces (mirrors API shape) ──────────────────────────────────

interface OrderCompliance {
  totalOrders: number;
  activeOrders: number;
  totalConditions: number;
  fullyCompliantRate: number;
  nonCompliantConditions: number;
  activeOrdersReviewedRate: number;
  conditionsEvidencedRate: number;
  noNonCompliant: boolean;
  score: number;
  strengths: string[];
  concerns: string[];
}

interface ReviewTimeliness {
  totalReviews: number;
  onTimeRate: number;
  allMetRate: number;
  concernsRate: number;
  coverageRate: number;
  childrenCovered: number;
  totalChildren: number;
  score: number;
  strengths: string[];
  concerns: string[];
}

interface LegalEngagement {
  totalMeetings: number;
  homeAttendanceRate: number;
  childParticipationRate: number;
  minutesRecordedRate: number;
  actionsAgreed: number;
  meetingTypeCount: number;
  meetingTypeBreakdown: Record<string, number>;
  score: number;
  strengths: string[];
  concerns: string[];
}

interface StaffLegalKnowledge {
  totalStaff: number;
  courtOrderAwarenessRate: number;
  childrenActKnowledgeRate: number;
  humanRightsTrainingRate: number;
  allThreeRate: number;
  score: number;
  strengths: string[];
  concerns: string[];
}

interface ChildProfile {
  childId: string;
  childName: string;
  activeOrderCount: number;
  totalConditions: number;
  fullyCompliantConditions: number;
  complianceRate: number;
  reviewsConducted: number;
  meetingsAttended: number;
  overallScore: number;
}

interface ComplianceData {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: string;
  orderCompliance: OrderCompliance;
  reviewTimeliness: ReviewTimeliness;
  legalEngagement: LegalEngagement;
  staffLegalKnowledge: StaffLegalKnowledge;
  childOrderProfiles: ChildProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
  meta?: {
    orderSummary: {
      id: string;
      childName: string;
      orderType: string;
      isActive: boolean;
      conditionCount: number;
      complianceBreakdown: { type: string; status: string }[];
    }[];
    ratingLabel: string;
  };
}

// ── Rating Badge ───────────────────────────────────────────────────────────

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

// ── Layer Score Card ───────────────────────────────────────────────────────

function LayerScoreCard({ label, score, max }: { label: string; score: number; max: number }) {
  const pctVal = Math.round((score / max) * 100);
  const color =
    pctVal >= 80 ? "text-green-700 bg-green-50 border-green-200"
      : pctVal >= 60 ? "text-blue-700 bg-blue-50 border-blue-200"
        : pctVal >= 40 ? "text-orange-700 bg-orange-50 border-orange-200"
          : "text-red-700 bg-red-50 border-red-200";

  return (
    <div className={`rounded-lg border p-3 text-center ${color}`}>
      <div className="text-2xl font-bold">{score}<span className="text-sm font-normal">/{max}</span></div>
      <div className="text-xs font-medium mt-0.5">{label}</div>
    </div>
  );
}

// ── Compliance Gauge ───────────────────────────────────────────────────────

function ComplianceGauge({ label, value }: { label: string; value: number }) {
  const color =
    value >= 90 ? "text-green-700 bg-green-100"
      : value >= 70 ? "text-yellow-700 bg-yellow-100"
        : "text-red-700 bg-red-100";

  return (
    <div className={`rounded-lg p-2.5 text-center ${color}`}>
      <div className="text-xl font-bold">{value}%</div>
      <div className="text-[10px] font-medium mt-0.5">{label}</div>
    </div>
  );
}

// ── Child Profile Row ──────────────────────────────────────────────────────

function ChildProfileRow({ profile }: { profile: ChildProfile }) {
  const complianceColor =
    profile.complianceRate >= 90 ? "bg-green-100 text-green-700"
      : profile.complianceRate >= 70 ? "bg-yellow-100 text-yellow-700"
        : "bg-red-100 text-red-700";

  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">{profile.childName}</span>
          <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
            {profile.activeOrderCount} order{profile.activeOrderCount !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex gap-3 text-[10px] text-gray-400 mt-0.5">
          <span>Conditions: {profile.totalConditions}</span>
          <span>Reviews: {profile.reviewsConducted}</span>
          <span>Meetings: {profile.meetingsAttended}</span>
        </div>
      </div>
      <span className={`text-xs font-medium px-2 py-0.5 rounded shrink-0 ${complianceColor}`}>
        {profile.complianceRate}%
      </span>
    </div>
  );
}

// ── Meeting Type Label ─────────────────────────────────────────────────────

function getMeetingTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    lac_review: "LAC Review",
    court_hearing: "Court Hearing",
    legal_planning: "Legal Planning",
    advocacy_meeting: "Advocacy Meeting",
    placement_review: "Placement Review",
  };
  return labels[type] || type;
}

// ── Main Widget ────────────────────────────────────────────────────────────

export function CourtOrderComplianceDashboardWidget() {
  const [data, setData] = useState<ComplianceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<"orders" | "reviews" | "engagement" | "knowledge" | "children">("orders");

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/court-order-compliance");
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
        <div className="h-20 bg-gray-100 rounded" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white border border-red-200 rounded-xl p-6">
        <h3 className="font-semibold text-red-800">Court Order Compliance</h3>
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
            Court Order Compliance
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {data.periodStart} to {data.periodEnd} | {data.orderCompliance.activeOrders} active orders | {data.orderCompliance.totalConditions} conditions
          </p>
        </div>
        <RatingBadge score={data.overallScore} rating={data.rating} />
      </div>

      {/* 4 Layer Scores */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <LayerScoreCard label="Order Compliance" score={data.orderCompliance.score} max={25} />
        <LayerScoreCard label="Review Timeliness" score={data.reviewTimeliness.score} max={25} />
        <LayerScoreCard label="Legal Engagement" score={data.legalEngagement.score} max={25} />
        <LayerScoreCard label="Staff Knowledge" score={data.staffLegalKnowledge.score} max={25} />
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-4">
        <ComplianceGauge label="Fully Compliant" value={data.orderCompliance.fullyCompliantRate} />
        <ComplianceGauge label="Evidence Rate" value={data.orderCompliance.conditionsEvidencedRate} />
        <ComplianceGauge label="Review Coverage" value={data.reviewTimeliness.coverageRate} />
        <ComplianceGauge label="Home Attendance" value={data.legalEngagement.homeAttendanceRate} />
        <ComplianceGauge label="Child Voice" value={data.legalEngagement.childParticipationRate} />
        <ComplianceGauge label="All 3 Training" value={data.staffLegalKnowledge.allThreeRate} />
      </div>

      {/* Urgent Actions */}
      {data.actions.length > 0 &&
        !data.actions[0].startsWith("No urgent actions") && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <h4 className="text-sm font-semibold text-red-800 mb-2">Urgent Actions</h4>
            <ul className="space-y-1">
              {data.actions.slice(0, 4).map((action, i) => (
                <li key={i} className="text-xs text-red-700 flex items-start gap-1.5">
                  <span className="mt-0.5 shrink-0">
                    {action.startsWith("URGENT") ? "●" : "▪"}
                  </span>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

      {/* Non-compliant alert */}
      {data.orderCompliance.nonCompliantConditions > 0 && (
        <div className="bg-red-50 border border-red-300 rounded-lg p-3 mb-4">
          <span className="text-xs text-red-800 font-semibold">
            {data.orderCompliance.nonCompliantConditions} non-compliant condition(s) — potential court order breach requiring immediate action and Ofsted notification per Reg 36
          </span>
        </div>
      )}

      {/* Expandable Detail Tabs */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-sm text-blue-600 hover:text-blue-800 font-medium w-full text-left"
      >
        {expanded ? "Hide details" : "Show detailed breakdown"}
      </button>

      {expanded && (
        <div className="mt-4 space-y-4">
          {/* Tab Navigation */}
          <div className="flex gap-1 border-b border-gray-200">
            {([
              ["orders", "Orders"],
              ["reviews", "Reviews"],
              ["engagement", "Engagement"],
              ["knowledge", "Staff Knowledge"],
              ["children", "Children"],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-t-lg transition-colors ${
                  activeTab === key
                    ? "bg-white border border-b-white border-gray-200 text-gray-900 -mb-px"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Orders Tab */}
          {activeTab === "orders" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <ComplianceGauge label="Fully Compliant" value={data.orderCompliance.fullyCompliantRate} />
                <ComplianceGauge label="Evidenced" value={data.orderCompliance.conditionsEvidencedRate} />
                <ComplianceGauge label="Orders Reviewed" value={data.orderCompliance.activeOrdersReviewedRate} />
                <div className={`rounded-lg p-2.5 text-center ${data.orderCompliance.noNonCompliant ? "text-green-700 bg-green-100" : "text-red-700 bg-red-100"}`}>
                  <div className="text-xl font-bold">{data.orderCompliance.nonCompliantConditions}</div>
                  <div className="text-[10px] font-medium mt-0.5">Non-Compliant</div>
                </div>
              </div>
              {data.meta?.orderSummary && (
                <div className="bg-gray-50 rounded-lg p-3">
                  {data.meta.orderSummary.map((o) => (
                    <div key={o.id} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="font-medium text-sm truncate">{o.orderType}</span>
                        <span className="text-xs text-gray-400">({o.childName})</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-gray-500">{o.conditionCount} conditions</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${o.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                          {o.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Reviews Tab */}
          {activeTab === "reviews" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <ComplianceGauge label="On Time" value={data.reviewTimeliness.onTimeRate} />
                <ComplianceGauge label="All Met" value={data.reviewTimeliness.allMetRate} />
                <ComplianceGauge label="Coverage" value={data.reviewTimeliness.coverageRate} />
                <div className={`rounded-lg p-2.5 text-center ${data.reviewTimeliness.concernsRate <= 20 ? "text-green-700 bg-green-100" : "text-red-700 bg-red-100"}`}>
                  <div className="text-xl font-bold">{formatRate(data.reviewTimeliness.concernsRate)}</div>
                  <div className="text-[10px] font-medium mt-0.5">Concerns Rate</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-2 bg-gray-50 rounded">
                  <div className="text-lg font-bold text-gray-700">{data.reviewTimeliness.totalReviews}</div>
                  <div className="text-[10px] text-gray-500 uppercase">Total Reviews</div>
                </div>
                <div className="p-2 bg-gray-50 rounded">
                  <div className="text-lg font-bold text-gray-700">
                    {data.reviewTimeliness.childrenCovered}/{data.reviewTimeliness.totalChildren}
                  </div>
                  <div className="text-[10px] text-gray-500 uppercase">Children Covered</div>
                </div>
              </div>
            </div>
          )}

          {/* Engagement Tab */}
          {activeTab === "engagement" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <ComplianceGauge label="Home Attendance" value={data.legalEngagement.homeAttendanceRate} />
                <ComplianceGauge label="Child Voice" value={data.legalEngagement.childParticipationRate} />
                <ComplianceGauge label="Minutes Recorded" value={data.legalEngagement.minutesRecordedRate} />
                <div className="rounded-lg p-2.5 text-center text-blue-700 bg-blue-100">
                  <div className="text-xl font-bold">{data.legalEngagement.actionsAgreed}</div>
                  <div className="text-[10px] font-medium mt-0.5">Actions Agreed</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-2 bg-gray-50 rounded">
                  <div className="text-lg font-bold text-gray-700">{data.legalEngagement.totalMeetings}</div>
                  <div className="text-[10px] text-gray-500 uppercase">Total Meetings</div>
                </div>
                <div className="p-2 bg-gray-50 rounded">
                  <div className="text-lg font-bold text-gray-700">{data.legalEngagement.meetingTypeCount}</div>
                  <div className="text-[10px] text-gray-500 uppercase">Meeting Types</div>
                </div>
              </div>
              {Object.keys(data.legalEngagement.meetingTypeBreakdown).length > 0 && (
                <div className="bg-gray-50 rounded-lg p-3">
                  {Object.entries(data.legalEngagement.meetingTypeBreakdown).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between py-1 border-b border-gray-100 last:border-0">
                      <span className="text-sm text-gray-700">{getMeetingTypeLabel(type)}</span>
                      <span className="text-sm font-medium text-gray-900">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Staff Knowledge Tab */}
          {activeTab === "knowledge" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <ComplianceGauge label="Court Orders" value={data.staffLegalKnowledge.courtOrderAwarenessRate} />
                <ComplianceGauge label="Children Act" value={data.staffLegalKnowledge.childrenActKnowledgeRate} />
                <ComplianceGauge label="Human Rights" value={data.staffLegalKnowledge.humanRightsTrainingRate} />
                <ComplianceGauge label="All Three" value={data.staffLegalKnowledge.allThreeRate} />
              </div>
              <div className="p-2 bg-gray-50 rounded text-center">
                <div className="text-lg font-bold text-gray-700">{data.staffLegalKnowledge.totalStaff}</div>
                <div className="text-[10px] text-gray-500 uppercase">Staff with Training Records</div>
              </div>
            </div>
          )}

          {/* Children Tab */}
          {activeTab === "children" && (
            <div className="bg-gray-50 rounded-lg p-3">
              {data.childOrderProfiles.map((profile) => (
                <ChildProfileRow key={profile.childId} profile={profile} />
              ))}
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

          {/* Areas for Improvement */}
          {data.areasForImprovement.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-orange-800 mb-2">Areas for Improvement</h4>
              <ul className="space-y-1">
                {data.areasForImprovement.map((c, i) => (
                  <li key={i} className="text-xs text-orange-700">- {c}</li>
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

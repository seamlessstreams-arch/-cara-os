"use client";

// ══════════════════════════════════════════════════════════════════════════════
// MULTI-AGENCY PARTNERSHIP DASHBOARD WIDGET
//
// Displays partnership intelligence:
// - Overall partnership rating
// - Sub-score breakdown (engagement, meetings, referrals, info sharing)
// - Key metrics
// - Strengths, concerns, and immediate actions
// - Regulatory links
// ══════════════════════════════════════════════════════════════════════════════

import { formatRate } from "@/lib/metrics/rate";
import { useState, useEffect } from "react";

interface PartnershipEngagement {
  score: number;
  engagementCoverage: number;
  qualityRate: number;
  isaRate: number;
  positiveFeedbackRate: number;
  recentContactRate: number;
}

interface MeetingEffectiveness {
  score: number;
  attendanceRate: number;
  homeAttendanceRate: number;
  minutesCirculatedRate: number;
  actionsCompletionRate: number;
  childParticipationRate: number;
  meetingTypeVariety: number;
}

interface ReferralQuality {
  score: number;
  appropriateRate: number;
  followUpRate: number;
  acceptanceRate: number;
  averageResponseDays: number;
  completionRate: number;
  totalReferrals: number;
}

interface InformationSharing {
  score: number;
  timelinessRate: number;
  comprehensiveRate: number;
  consentRate: number;
  relevanceRate: number;
  agencyTypeCoverage: number;
}

interface PartnershipData {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: string;
  partnershipEngagement: PartnershipEngagement;
  meetingEffectiveness: MeetingEffectiveness;
  referralQuality: ReferralQuality;
  informationSharing: InformationSharing;
  totalRelationships: number;
  totalMeetings: number;
  totalReferrals: number;
  totalInformationShares: number;
  strengths: string[];
  concerns: string[];
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

// ── Sub-Score Bar ──────────────────────────────────────────────────────────

function SubScoreBar({ label, score, max }: { label: string; score: number; max: number }) {
  const pct = max > 0 ? Math.round((score / max) * 100) : 0;
  const colorClass =
    pct >= 80 ? "bg-green-500"
      : pct >= 60 ? "bg-blue-500"
        : pct >= 40 ? "bg-orange-500"
          : "bg-red-500";

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="text-gray-500">{score}/{max}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ── Metric Tile ────────────────────────────────────────────────────────────

function MetricTile({ value, label, colorClass }: { value: string | number; label: string; colorClass: string }) {
  return (
    <div className={`text-center p-2 rounded-lg ${colorClass}`}>
      <div className="text-xl font-bold">{value}</div>
      <div className="text-[10px] text-gray-500 uppercase">{label}</div>
    </div>
  );
}

// ── Main Widget ────────────────────────────────────────────────────────────

export function MultiAgencyPartnershipDashboardWidget() {
  const [data, setData] = useState<PartnershipData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/multi-agency-partnership");
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
        <h3 className="font-semibold text-red-800">Multi-Agency Partnership</h3>
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
            Multi-Agency Partnership Intelligence
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Partnership quality assessment | {data.totalRelationships} agency relationships
          </p>
        </div>
        <RatingBadge score={data.overallScore} rating={data.rating} />
      </div>

      {/* Sub-Score Bars */}
      <div className="space-y-2 mb-4">
        <SubScoreBar label="Partnership Engagement" score={data.partnershipEngagement.score} max={25} />
        <SubScoreBar label="Meeting Effectiveness" score={data.meetingEffectiveness.score} max={25} />
        <SubScoreBar label="Referral Quality" score={data.referralQuality.score} max={25} />
        <SubScoreBar label="Information Sharing" score={data.informationSharing.score} max={25} />
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <MetricTile
          value={data.totalRelationships}
          label="Agency Partners"
          colorClass="bg-blue-50"
        />
        <MetricTile
          value={data.totalMeetings}
          label="Meetings"
          colorClass="bg-purple-50"
        />
        <MetricTile
          value={data.totalReferrals}
          label="Referrals"
          colorClass="bg-indigo-50"
        />
        <MetricTile
          value={`${formatRate(data.meetingEffectiveness.homeAttendanceRate)}`}
          label="Home Attendance"
          colorClass="bg-green-50"
        />
      </div>

      {/* Immediate Actions */}
      {data.immediateActions.length > 0 &&
        !data.immediateActions[0].startsWith("No immediate actions") && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <h4 className="text-sm font-semibold text-red-800 mb-2">Partnership Actions Required</h4>
            <ul className="space-y-1">
              {data.immediateActions.slice(0, 3).map((action, i) => (
                <li key={i} className="text-xs text-red-700 flex items-start gap-1.5">
                  <span className="mt-0.5 shrink-0">
                    {action.startsWith("URGENT") ? "●" : action.startsWith("HIGH") ? "○" : "▪"}
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
        {expanded ? "Hide details ▲" : "Show partnership details ▼"}
      </button>

      {expanded && (
        <div className="mt-4 space-y-4">
          {/* Detailed Metrics */}
          <div className="grid grid-cols-3 gap-3">
            <MetricTile
              value={`${formatRate(data.partnershipEngagement.qualityRate)}`}
              label="Quality Rate"
              colorClass="bg-green-50"
            />
            <MetricTile
              value={`${formatRate(data.meetingEffectiveness.actionsCompletionRate)}`}
              label="Actions Completed"
              colorClass="bg-blue-50"
            />
            <MetricTile
              value={`${formatRate(data.informationSharing.consentRate)}`}
              label="Consent Rate"
              colorClass="bg-purple-50"
            />
          </div>

          {/* Engagement Details */}
          <div>
            <h4 className="text-xs font-semibold text-gray-600 uppercase mb-2">Partnership Engagement</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-gray-50 rounded p-2">
                <span className="text-gray-500">Agency Coverage:</span>{" "}
                <span className="font-medium">{data.partnershipEngagement.engagementCoverage}%</span>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <span className="text-gray-500">ISA Rate:</span>{" "}
                <span className="font-medium">{data.partnershipEngagement.isaRate}%</span>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <span className="text-gray-500">Positive Feedback:</span>{" "}
                <span className="font-medium">{formatRate(data.partnershipEngagement.positiveFeedbackRate)}</span>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <span className="text-gray-500">Recent Contact:</span>{" "}
                <span className="font-medium">{data.partnershipEngagement.recentContactRate}%</span>
              </div>
            </div>
          </div>

          {/* Meeting Details */}
          <div>
            <h4 className="text-xs font-semibold text-gray-600 uppercase mb-2">Meeting Effectiveness</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-gray-50 rounded p-2">
                <span className="text-gray-500">Agency Attendance:</span>{" "}
                <span className="font-medium">{formatRate(data.meetingEffectiveness.attendanceRate)}</span>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <span className="text-gray-500">Minutes Circulated:</span>{" "}
                <span className="font-medium">{data.meetingEffectiveness.minutesCirculatedRate}%</span>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <span className="text-gray-500">Child Participation:</span>{" "}
                <span className="font-medium">{formatRate(data.meetingEffectiveness.childParticipationRate)}</span>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <span className="text-gray-500">Meeting Types:</span>{" "}
                <span className="font-medium">{data.meetingEffectiveness.meetingTypeVariety}</span>
              </div>
            </div>
          </div>

          {/* Referral Details */}
          {data.referralQuality.totalReferrals > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-600 uppercase mb-2">Referral Quality</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-gray-50 rounded p-2">
                  <span className="text-gray-500">Appropriate:</span>{" "}
                  <span className="font-medium">{formatRate(data.referralQuality.appropriateRate)}</span>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <span className="text-gray-500">Avg Response:</span>{" "}
                  <span className="font-medium">{data.referralQuality.averageResponseDays} days</span>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <span className="text-gray-500">Follow-Up:</span>{" "}
                  <span className="font-medium">{formatRate(data.referralQuality.followUpRate)}</span>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <span className="text-gray-500">Acceptance:</span>{" "}
                  <span className="font-medium">{formatRate(data.referralQuality.acceptanceRate)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Strengths */}
          {data.strengths.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-green-700 uppercase mb-2">Strengths</h4>
              <ul className="space-y-1">
                {data.strengths.map((s, i) => (
                  <li key={i} className="text-xs text-green-700 flex items-start gap-1.5">
                    <span className="mt-0.5 shrink-0">✓</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Concerns */}
          {data.concerns.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-orange-700 uppercase mb-2">Concerns</h4>
              <ul className="space-y-1">
                {data.concerns.map((c, i) => (
                  <li key={i} className="text-xs text-orange-700 flex items-start gap-1.5">
                    <span className="mt-0.5 shrink-0">⚠</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Regulatory Links */}
          {data.regulatoryLinks.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-3">
              <h4 className="text-xs font-semibold text-gray-600 uppercase mb-2">Regulatory Framework</h4>
              <ul className="space-y-0.5">
                {data.regulatoryLinks.map((link, i) => (
                  <li key={i} className="text-[10px] text-gray-500">{link}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

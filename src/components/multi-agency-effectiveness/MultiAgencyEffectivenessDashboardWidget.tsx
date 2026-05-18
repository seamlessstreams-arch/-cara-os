"use client";

// ══════════════════════════════════════════════════════════════════════════════
// MULTI-AGENCY EFFECTIVENESS DASHBOARD WIDGET
//
// Displays the quality and impact of multi-agency working:
// - Overall score with Ofsted-aligned rating
// - Key metrics row (meeting effectiveness, info sharing, relationships, escalations)
// - Expandable sections for each domain
// - Child multi-agency profiles
// - Strengths / areas / actions
// - Regulatory framework
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";

// ── Types (local mirror for the widget) ───────────────────────────────────

interface MeetingEffectiveness {
  totalMeetings: number;
  overallAttendanceRate: number;
  agencyAttendanceRate: number;
  childParticipationRate: number;
  parentParticipationRate: number;
  homeStaffAttendanceRate: number;
  actionCompletionRate: number;
  minutesCirculationRate: number;
  minutesTimelinessRate: number;
  outcomeBreakdown: Record<string, number>;
  meetingTypeBreakdown: Record<string, number>;
}

interface InformationSharing {
  totalRecords: number;
  timelinessRate: number;
  completenessRate: number;
  qualityDistribution: Record<string, number>;
  perAgencyAnalysis: {
    agency: string;
    totalRecords: number;
    timelinessRate: number;
    completenessRate: number;
  }[];
}

interface ProfessionalRelationships {
  totalRelationships: number;
  strongCount: number;
  adequateCount: number;
  developingCount: number;
  poorCount: number;
  responsivenessBreakdown: Record<string, number>;
  coverageOfKeyAgencies: {
    agency: string;
    covered: boolean;
    quality?: string;
  }[];
}

interface EscalationManagement {
  totalEscalations: number;
  responseRate: number;
  timelinessRate: number;
  outcomeAchievementRate: number;
  averageResponseDays: number;
  perAgencyBreakdown: {
    agency: string;
    count: number;
    responseRate: number;
    outcomeRate: number;
  }[];
}

interface ChildProfile {
  childId: string;
  childName: string;
  meetingCount: number;
  meetingTypes: string[];
  agenciesInvolved: string[];
  informationSharingQuality: number;
  escalationCount: number;
  escalationsResolved: number;
  overallEngagement: string;
}

interface EffectivenessData {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: string;
  meetingEffectiveness: MeetingEffectiveness;
  informationSharing: InformationSharing;
  professionalRelationships: ProfessionalRelationships;
  escalationManagement: EscalationManagement;
  childProfiles: ChildProfile[];
  scoring: {
    meetingScore: number;
    informationSharingScore: number;
    relationshipScore: number;
    escalationScore: number;
  };
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Sub-components ────────────────────────────────────────────────────────

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

function MetricCard({
  label,
  value,
  suffix = "%",
  subLabel,
}: {
  label: string;
  value: number;
  suffix?: string;
  subLabel?: string;
}) {
  const color =
    value >= 80
      ? "text-green-700 bg-green-50"
      : value >= 60
        ? "text-blue-700 bg-blue-50"
        : value >= 40
          ? "text-orange-700 bg-orange-50"
          : "text-red-700 bg-red-50";

  return (
    <div className={`rounded-lg p-3 text-center ${color}`}>
      <div className="text-2xl font-bold">
        {value}
        {suffix}
      </div>
      <div className="text-xs font-medium mt-0.5">{label}</div>
      {subLabel && (
        <div className="text-[10px] opacity-70 mt-0.5">{subLabel}</div>
      )}
    </div>
  );
}

function ScoringBar({
  label,
  score,
  maxScore,
}: {
  label: string;
  score: number;
  maxScore: number;
}) {
  const pct = maxScore > 0 ? (score / maxScore) * 100 : 0;
  const barColor =
    pct >= 80
      ? "bg-green-500"
      : pct >= 60
        ? "bg-blue-500"
        : pct >= 40
          ? "bg-orange-500"
          : "bg-red-500";

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-40 text-gray-600 shrink-0">{label}</span>
      <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${barColor}`}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
      <span className="w-16 text-right font-medium text-gray-700">
        {score.toFixed(1)}/{maxScore}
      </span>
    </div>
  );
}

function ExpandableSection({
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
    <div className="border border-gray-200 rounded-lg">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <span>{title}</span>
        <span className="text-gray-400">{open ? "▲" : "▼"}</span>
      </button>
      {open && <div className="px-3 pb-3 border-t border-gray-100">{children}</div>}
    </div>
  );
}

function EngagementBadge({ engagement }: { engagement: string }) {
  const colors: Record<string, string> = {
    strong: "bg-green-100 text-green-700",
    adequate: "bg-blue-100 text-blue-700",
    limited: "bg-orange-100 text-orange-700",
    poor: "bg-red-100 text-red-700",
  };
  return (
    <span
      className={`text-xs font-medium px-2 py-0.5 rounded ${colors[engagement] ?? "bg-gray-100 text-gray-600"}`}
    >
      {engagement.charAt(0).toUpperCase() + engagement.slice(1)}
    </span>
  );
}

function agencyLabel(agency: string): string {
  const labels: Record<string, string> = {
    social_worker: "Social Worker",
    CAMHS: "CAMHS",
    education: "Education",
    health_visitor: "Health Visitor",
    police: "Police",
    YOT: "YOT",
    LADO: "LADO",
    IRO: "IRO",
    therapist: "Therapist",
    substance_misuse: "Substance Misuse",
    housing: "Housing",
    other: "Other",
  };
  return labels[agency] ?? agency;
}

function meetingTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    strategy: "Strategy",
    CIN: "CIN",
    LAC_review: "LAC Review",
    PEP: "PEP",
    health_review: "Health Review",
    professionals: "Professionals",
    discharge_planning: "Discharge Planning",
    risk_management: "Risk Management",
    other: "Other",
  };
  return labels[type] ?? type;
}

function outcomeLabel(outcome: string): string {
  const labels: Record<string, string> = {
    all_actions_agreed: "All Actions Agreed",
    partial_agreement: "Partial Agreement",
    deferred: "Deferred",
    escalated: "Escalated",
  };
  return labels[outcome] ?? outcome;
}

function qualityLabel(quality: string): string {
  const labels: Record<string, string> = {
    timely_complete: "Timely & Complete",
    timely_incomplete: "Timely but Incomplete",
    delayed_complete: "Delayed but Complete",
    delayed_incomplete: "Delayed & Incomplete",
    not_shared: "Not Shared",
  };
  return labels[quality] ?? quality;
}

function qualityColor(quality: string): string {
  const colors: Record<string, string> = {
    timely_complete: "bg-green-100 text-green-700",
    timely_incomplete: "bg-yellow-100 text-yellow-700",
    delayed_complete: "bg-orange-100 text-orange-700",
    delayed_incomplete: "bg-red-100 text-red-700",
    not_shared: "bg-gray-200 text-gray-600",
  };
  return colors[quality] ?? "bg-gray-100 text-gray-600";
}

// ── Main Widget ───────────────────────────────────────────────────────────

export function MultiAgencyEffectivenessDashboardWidget() {
  const [data, setData] = useState<EffectivenessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/multi-agency-effectiveness");
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
        <h3 className="font-semibold text-red-800">
          Multi-Agency Effectiveness Intelligence
        </h3>
        <p className="text-sm text-red-600 mt-1">
          {error ?? "No data available"}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900 text-lg">
            Multi-Agency Effectiveness Intelligence
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {data.periodStart} to {data.periodEnd} |{" "}
            {data.meetingEffectiveness.totalMeetings} meetings |{" "}
            {data.informationSharing.totalRecords} info shares |{" "}
            {data.escalationManagement.totalEscalations} escalations
          </p>
        </div>
        <RatingBadge score={data.overallScore} rating={data.rating} />
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <MetricCard
          label="Meeting Effectiveness"
          value={data.meetingEffectiveness.actionCompletionRate}
          subLabel={`${data.scoring.meetingScore.toFixed(1)}/30 pts`}
        />
        <MetricCard
          label="Info Sharing Quality"
          value={data.informationSharing.timelinessRate}
          subLabel={`${data.scoring.informationSharingScore.toFixed(1)}/25 pts`}
        />
        <MetricCard
          label="Relationship Quality"
          value={
            data.professionalRelationships.totalRelationships > 0
              ? Math.round(
                  ((data.professionalRelationships.strongCount +
                    data.professionalRelationships.adequateCount) /
                    data.professionalRelationships.totalRelationships) *
                    100,
                )
              : 0
          }
          subLabel={`${data.scoring.relationshipScore.toFixed(1)}/20 pts`}
        />
        <MetricCard
          label="Escalation Response"
          value={data.escalationManagement.responseRate}
          subLabel={`${data.scoring.escalationScore.toFixed(1)}/25 pts`}
        />
      </div>

      {/* Scoring Breakdown */}
      <div className="space-y-2 mb-4 bg-gray-50 rounded-lg p-3">
        <div className="text-xs font-medium text-gray-500 mb-1">
          Score Breakdown (out of 100)
        </div>
        <ScoringBar
          label="Meetings"
          score={data.scoring.meetingScore}
          maxScore={30}
        />
        <ScoringBar
          label="Info Sharing"
          score={data.scoring.informationSharingScore}
          maxScore={25}
        />
        <ScoringBar
          label="Relationships"
          score={data.scoring.relationshipScore}
          maxScore={20}
        />
        <ScoringBar
          label="Escalations"
          score={data.scoring.escalationScore}
          maxScore={25}
        />
      </div>

      {/* Expandable Sections */}
      <div className="space-y-2">
        {/* Child Profiles */}
        <ExpandableSection title="Child Multi-Agency Profiles" defaultOpen>
          <div className="space-y-3 mt-2">
            {data.childProfiles.map((child) => (
              <div
                key={child.childId}
                className="bg-gray-50 rounded-lg p-3"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm text-gray-800">
                    {child.childName}
                  </span>
                  <EngagementBadge engagement={child.overallEngagement} />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-gray-600">
                  <div>
                    <span className="block text-gray-400">Meetings</span>
                    {child.meetingCount}
                  </div>
                  <div>
                    <span className="block text-gray-400">Agencies</span>
                    {child.agenciesInvolved.length}
                  </div>
                  <div>
                    <span className="block text-gray-400">
                      Info Quality
                    </span>
                    {child.informationSharingQuality}%
                  </div>
                  <div>
                    <span className="block text-gray-400">Escalations</span>
                    {child.escalationsResolved}/{child.escalationCount}{" "}
                    resolved
                  </div>
                </div>
                {child.meetingTypes.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {child.meetingTypes.map((t) => (
                      <span
                        key={t}
                        className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded"
                      >
                        {meetingTypeLabel(t)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ExpandableSection>

        {/* Meeting Effectiveness */}
        <ExpandableSection title="Meeting Effectiveness">
          <div className="mt-2 space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <div className="bg-gray-50 rounded p-2">
                <span className="text-gray-400 block">Agency Attendance</span>
                <span className="font-medium">
                  {data.meetingEffectiveness.agencyAttendanceRate}%
                </span>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <span className="text-gray-400 block">
                  Child Participation
                </span>
                <span className="font-medium">
                  {data.meetingEffectiveness.childParticipationRate}%
                </span>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <span className="text-gray-400 block">
                  Parent Participation
                </span>
                <span className="font-medium">
                  {data.meetingEffectiveness.parentParticipationRate}%
                </span>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <span className="text-gray-400 block">
                  Home Staff Attendance
                </span>
                <span className="font-medium">
                  {data.meetingEffectiveness.homeStaffAttendanceRate}%
                </span>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <span className="text-gray-400 block">
                  Action Completion
                </span>
                <span className="font-medium">
                  {data.meetingEffectiveness.actionCompletionRate}%
                </span>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <span className="text-gray-400 block">
                  Minutes Circulated
                </span>
                <span className="font-medium">
                  {data.meetingEffectiveness.minutesCirculationRate}%
                </span>
              </div>
            </div>

            {/* Outcome breakdown */}
            <div>
              <div className="text-xs font-medium text-gray-500 mb-1">
                Meeting Outcomes
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(
                  data.meetingEffectiveness.outcomeBreakdown,
                ).map(([outcome, count]) => (
                  <span
                    key={outcome}
                    className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                  >
                    {outcomeLabel(outcome)}: {count}
                  </span>
                ))}
              </div>
            </div>

            {/* Meeting type breakdown */}
            <div>
              <div className="text-xs font-medium text-gray-500 mb-1">
                By Meeting Type
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(
                  data.meetingEffectiveness.meetingTypeBreakdown,
                )
                  .filter(([, count]) => count > 0)
                  .map(([type, count]) => (
                    <span
                      key={type}
                      className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded"
                    >
                      {meetingTypeLabel(type)}: {count}
                    </span>
                  ))}
              </div>
            </div>
          </div>
        </ExpandableSection>

        {/* Information Sharing */}
        <ExpandableSection title="Information Sharing">
          <div className="mt-2 space-y-3">
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="bg-gray-50 rounded p-2">
                <span className="text-gray-400 block">Timeliness</span>
                <span className="font-medium">
                  {data.informationSharing.timelinessRate}%
                </span>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <span className="text-gray-400 block">Completeness</span>
                <span className="font-medium">
                  {data.informationSharing.completenessRate}%
                </span>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <span className="text-gray-400 block">Total Records</span>
                <span className="font-medium">
                  {data.informationSharing.totalRecords}
                </span>
              </div>
            </div>

            {/* Quality distribution */}
            <div>
              <div className="text-xs font-medium text-gray-500 mb-1">
                Quality Distribution
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(
                  data.informationSharing.qualityDistribution,
                ).map(([quality, count]) => (
                  <span
                    key={quality}
                    className={`text-xs px-2 py-1 rounded ${qualityColor(quality)}`}
                  >
                    {qualityLabel(quality)}: {count}
                  </span>
                ))}
              </div>
            </div>

            {/* Per agency */}
            {data.informationSharing.perAgencyAnalysis.length > 0 && (
              <div>
                <div className="text-xs font-medium text-gray-500 mb-1">
                  By Agency
                </div>
                <div className="space-y-1">
                  {data.informationSharing.perAgencyAnalysis.map((a) => (
                    <div
                      key={a.agency}
                      className="flex items-center justify-between text-xs bg-gray-50 rounded p-2"
                    >
                      <span className="font-medium">
                        {agencyLabel(a.agency)}
                      </span>
                      <div className="flex gap-3 text-gray-500">
                        <span>Timely: {a.timelinessRate}%</span>
                        <span>Complete: {a.completenessRate}%</span>
                        <span className="text-gray-400">
                          ({a.totalRecords} records)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ExpandableSection>

        {/* Professional Relationships */}
        <ExpandableSection title="Professional Relationships">
          <div className="mt-2 space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="bg-green-50 rounded p-2 text-center">
                <span className="text-green-600 block font-medium text-lg">
                  {data.professionalRelationships.strongCount}
                </span>
                <span className="text-green-500">Strong</span>
              </div>
              <div className="bg-blue-50 rounded p-2 text-center">
                <span className="text-blue-600 block font-medium text-lg">
                  {data.professionalRelationships.adequateCount}
                </span>
                <span className="text-blue-500">Adequate</span>
              </div>
              <div className="bg-orange-50 rounded p-2 text-center">
                <span className="text-orange-600 block font-medium text-lg">
                  {data.professionalRelationships.developingCount}
                </span>
                <span className="text-orange-500">Developing</span>
              </div>
              <div className="bg-red-50 rounded p-2 text-center">
                <span className="text-red-600 block font-medium text-lg">
                  {data.professionalRelationships.poorCount}
                </span>
                <span className="text-red-500">Poor</span>
              </div>
            </div>

            {/* Key agency coverage */}
            <div>
              <div className="text-xs font-medium text-gray-500 mb-1">
                Key Agency Coverage
              </div>
              <div className="space-y-1">
                {data.professionalRelationships.coverageOfKeyAgencies.map(
                  (c) => (
                    <div
                      key={c.agency}
                      className="flex items-center justify-between text-xs bg-gray-50 rounded p-2"
                    >
                      <span className="font-medium">
                        {agencyLabel(c.agency)}
                      </span>
                      <div className="flex items-center gap-2">
                        {c.quality && (
                          <span className="text-gray-400">{c.quality}</span>
                        )}
                        <span
                          className={`w-2 h-2 rounded-full ${c.covered ? "bg-green-500" : "bg-red-400"}`}
                        />
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>

            {/* Responsiveness */}
            <div>
              <div className="text-xs font-medium text-gray-500 mb-1">
                Responsiveness
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(
                  data.professionalRelationships.responsivenessBreakdown,
                ).map(([level, count]) => (
                  <span
                    key={level}
                    className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}: {count}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </ExpandableSection>

        {/* Escalation Management */}
        <ExpandableSection title="Escalation Management">
          <div className="mt-2 space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="bg-gray-50 rounded p-2">
                <span className="text-gray-400 block">Total</span>
                <span className="font-medium">
                  {data.escalationManagement.totalEscalations}
                </span>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <span className="text-gray-400 block">Response Rate</span>
                <span className="font-medium">
                  {data.escalationManagement.responseRate}%
                </span>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <span className="text-gray-400 block">Timely</span>
                <span className="font-medium">
                  {data.escalationManagement.timelinessRate}%
                </span>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <span className="text-gray-400 block">Outcomes Achieved</span>
                <span className="font-medium">
                  {data.escalationManagement.outcomeAchievementRate}%
                </span>
              </div>
            </div>

            {data.escalationManagement.averageResponseDays > 0 && (
              <div className="text-xs text-gray-500">
                Average response time:{" "}
                <span className="font-medium text-gray-700">
                  {data.escalationManagement.averageResponseDays} days
                </span>
              </div>
            )}

            {data.escalationManagement.perAgencyBreakdown.length > 0 && (
              <div>
                <div className="text-xs font-medium text-gray-500 mb-1">
                  By Agency
                </div>
                <div className="space-y-1">
                  {data.escalationManagement.perAgencyBreakdown.map((a) => (
                    <div
                      key={a.agency}
                      className="flex items-center justify-between text-xs bg-gray-50 rounded p-2"
                    >
                      <span className="font-medium">
                        {agencyLabel(a.agency)}
                      </span>
                      <div className="flex gap-3 text-gray-500">
                        <span>Response: {a.responseRate}%</span>
                        <span>Outcome: {a.outcomeRate}%</span>
                        <span className="text-gray-400">
                          ({a.count} escalation{a.count !== 1 ? "s" : ""})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ExpandableSection>

        {/* Strengths / Areas / Actions */}
        <ExpandableSection title="Strengths, Areas for Improvement & Actions">
          <div className="mt-2 space-y-3">
            {data.strengths.length > 0 && (
              <div>
                <div className="text-xs font-medium text-green-700 mb-1">
                  Strengths
                </div>
                <ul className="space-y-1">
                  {data.strengths.map((s, i) => (
                    <li
                      key={i}
                      className="text-xs text-gray-700 bg-green-50 rounded p-2"
                    >
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {data.areasForImprovement.length > 0 && (
              <div>
                <div className="text-xs font-medium text-orange-700 mb-1">
                  Areas for Improvement
                </div>
                <ul className="space-y-1">
                  {data.areasForImprovement.map((a, i) => (
                    <li
                      key={i}
                      className="text-xs text-gray-700 bg-orange-50 rounded p-2"
                    >
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {data.actions.length > 0 && (
              <div>
                <div className="text-xs font-medium text-blue-700 mb-1">
                  Recommended Actions
                </div>
                <ul className="space-y-1">
                  {data.actions.map((a, i) => (
                    <li
                      key={i}
                      className="text-xs text-gray-700 bg-blue-50 rounded p-2"
                    >
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </ExpandableSection>

        {/* Regulatory Framework */}
        <ExpandableSection title="Regulatory Framework">
          <ul className="mt-2 space-y-1">
            {data.regulatoryLinks.map((link, i) => (
              <li
                key={i}
                className="text-xs text-gray-600 bg-gray-50 rounded p-2"
              >
                {link}
              </li>
            ))}
          </ul>
        </ExpandableSection>
      </div>
    </div>
  );
}

"use client";

// ══════════════════════════════════════════════════════════════════════════════
// INCIDENT PATTERN ANALYSIS DASHBOARD WIDGET
//
// Displays incident pattern analysis intelligence:
// - Overall rating and sub-scores
// - Key metrics grid
// - Child incident profiles
// - Incident response, notification compliance, pattern analysis, post-incident
// - Strengths, areas for improvement, actions
// - Regulatory framework references
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";

// ── Local interfaces for API response shape ─────────────────────────────

interface ChildIncidentProfileData {
  childId: string;
  childName: string;
  incidentCount: number;
  criticalCount: number;
  predominantCategory: string;
  escalating: boolean;
  deEscalationSuccessRate: number;
  restraintCount: number;
  overallScore: number;
}

interface IncidentResponseData {
  overallScore: number;
  totalIncidents: number;
  criticalIncidentCount: number;
  majorIncidentCount: number;
  responseQualityRate: number;
  deEscalationSuccessRate: number;
  childDebriefRate: number;
  restraintRate: number;
  averageResponseTimeMins: number;
}

interface NotificationComplianceData {
  overallScore: number;
  totalNotifiable: number;
  timelyCompleteRate: number;
  lateNotificationCount: number;
  notNotifiedCount: number;
  managersInformedRate: number;
}

interface PatternAnalysisData {
  overallScore: number;
  trendsAnalysed: number;
  escalatingChildCount: number;
  predominantCategory: string;
  lessonsIdentifiedRate: number;
  triggerPatternsIdentified: number;
  environmentalFactorsCount: number;
}

interface PostIncidentData {
  overallScore: number;
  totalPostIncident: number;
  debriefCompletionRate: number;
  supportPlanUpdateRate: number;
  medicalAttentionRate: number;
  externalReferralRate: number;
  noActionCount: number;
}

interface IncidentPatternData {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: string;
  incidentResponse: IncidentResponseData;
  notificationCompliance: NotificationComplianceData;
  patternAnalysis: PatternAnalysisData;
  postIncident: PostIncidentData;
  childProfiles: ChildIncidentProfileData[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
  meta?: {
    labelMaps: {
      incidentCategory: Record<string, string>;
      incidentSeverity: Record<string, string>;
      responseQuality: Record<string, string>;
      notificationStatus: Record<string, string>;
      deEscalationOutcome: Record<string, string>;
      postIncidentAction: Record<string, string>;
      rating: Record<string, string>;
    };
  };
}

// ── Rating Badge ─────────────────────────────────────────────────────────

function RatingBadge({ score, rating }: { score: number; rating: string }) {
  const colorClass =
    rating === "outstanding"
      ? "bg-green-100 text-green-800 border-green-300"
      : rating === "good"
        ? "bg-blue-100 text-blue-800 border-blue-300"
        : rating === "requires_improvement"
          ? "bg-amber-100 text-amber-800 border-amber-300"
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

// ── Score Bar ────────────────────────────────────────────────────────────

function ScoreBar({ label, score, max }: { label: string; score: number; max: number }) {
  const percentage = Math.round((score / max) * 100);
  const barColor =
    percentage >= 80
      ? "bg-green-500"
      : percentage >= 60
        ? "bg-blue-500"
        : percentage >= 40
          ? "bg-amber-500"
          : "bg-red-500";

  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs text-gray-600 mb-0.5">
        <span>{label}</span>
        <span>
          {score}/{max}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`${barColor} h-2 rounded-full transition-all`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// ── Child Profile Card ──────────────────────────────────────────────────

function ChildProfileCard({
  profile,
  categoryLabel,
}: {
  profile: ChildIncidentProfileData;
  categoryLabel: string;
}) {
  const scorePct = Math.round((profile.overallScore / 10) * 100);
  const borderColor =
    scorePct >= 80
      ? "border-green-200 bg-green-50"
      : scorePct >= 60
        ? "border-blue-200 bg-blue-50"
        : scorePct >= 40
          ? "border-amber-200 bg-amber-50"
          : "border-red-200 bg-red-50";

  return (
    <div className={`rounded-lg border p-3 ${borderColor}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-sm text-gray-900">{profile.childName}</span>
        <span className="text-xs font-bold text-gray-700">{profile.overallScore}/10</span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="text-xs text-gray-500">Incidents</div>
          <div className="text-sm font-bold text-gray-800">{profile.incidentCount}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Critical</div>
          <div
            className={`text-sm font-bold ${profile.criticalCount > 0 ? "text-red-600" : "text-green-600"}`}
          >
            {profile.criticalCount}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Restraints</div>
          <div
            className={`text-sm font-bold ${profile.restraintCount > 0 ? "text-amber-600" : "text-green-600"}`}
          >
            {profile.restraintCount}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-1 mt-2">
        {profile.predominantCategory !== "none" && (
          <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">
            {categoryLabel}
          </span>
        )}
        {profile.escalating && (
          <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium">
            Escalating
          </span>
        )}
        {profile.deEscalationSuccessRate > 0 && (
          <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
            De-esc {profile.deEscalationSuccessRate}%
          </span>
        )}
      </div>
    </div>
  );
}

// ── Collapsible Section ─────────────────────────────────────────────────

function CollapsibleSection({
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
    <div className="border-t border-gray-200">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full py-3 px-1 text-sm font-semibold text-gray-700 hover:text-gray-900"
      >
        <span>{title}</span>
        <span className="text-xs text-gray-400">{open ? "▲" : "▼"}</span>
      </button>
      {open && <div className="pb-4">{children}</div>}
    </div>
  );
}

// ── Metric Card ─────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  color = "blue",
}: {
  label: string;
  value: string | number;
  color?: "blue" | "red" | "green" | "amber" | "purple";
}) {
  const colorClasses: Record<string, string> = {
    blue: "bg-blue-50 text-blue-700",
    red: "bg-red-50 text-red-700",
    green: "bg-green-50 text-green-700",
    amber: "bg-amber-50 text-amber-700",
    purple: "bg-purple-50 text-purple-700",
  };

  return (
    <div className={`text-center p-2 rounded-lg ${colorClasses[color]}`}>
      <div className="text-xl font-bold">{value}</div>
      <div className="text-[10px] text-gray-500 uppercase">{label}</div>
    </div>
  );
}

// ── Main Widget ─────────────────────────────────────────────────────────

export function IncidentPatternAnalysisDashboardWidget() {
  const [data, setData] = useState<IncidentPatternData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/incident-pattern-analysis");
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
        <div className="h-24 bg-gray-100 rounded mb-4" />
        <div className="grid grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded" />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <div className="bg-white border border-red-200 rounded-xl p-6">
        <h3 className="font-semibold text-red-800">Incident Pattern Analysis</h3>
        <p className="text-sm text-red-600 mt-1">{error ?? "No data available"}</p>
      </div>
    );
  }

  const categoryLabel = (cat: string) =>
    data.meta?.labelMaps?.incidentCategory?.[cat] ?? cat.replace(/_/g, " ");

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900 text-lg">
            Incident Pattern Analysis Intelligence
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {data.periodStart} to {data.periodEnd} | {data.incidentResponse.totalIncidents} total
            incidents
          </p>
        </div>
        <RatingBadge score={data.overallScore} rating={data.rating} />
      </div>

      {/* Key Metrics Grid — 5 items */}
      <div className="grid grid-cols-5 gap-3 mb-4">
        <MetricCard
          label="Total Incidents"
          value={data.incidentResponse.totalIncidents}
          color="blue"
        />
        <MetricCard
          label="Critical"
          value={data.incidentResponse.criticalIncidentCount}
          color={data.incidentResponse.criticalIncidentCount > 0 ? "red" : "green"}
        />
        <MetricCard
          label="De-escalation"
          value={`${data.incidentResponse.deEscalationSuccessRate}%`}
          color={data.incidentResponse.deEscalationSuccessRate >= 70 ? "green" : "amber"}
        />
        <MetricCard
          label="Child Debrief"
          value={`${data.incidentResponse.childDebriefRate}%`}
          color={data.incidentResponse.childDebriefRate >= 80 ? "green" : "amber"}
        />
        <MetricCard
          label="Notification"
          value={`${data.notificationCompliance.timelyCompleteRate}%`}
          color={data.notificationCompliance.timelyCompleteRate >= 80 ? "green" : "amber"}
        />
      </div>

      {/* 4 Sub-score Bars */}
      <div className="mb-4">
        <ScoreBar
          label="Incident Response"
          score={data.incidentResponse.overallScore}
          max={25}
        />
        <ScoreBar
          label="Notification Compliance"
          score={data.notificationCompliance.overallScore}
          max={25}
        />
        <ScoreBar
          label="Pattern Analysis"
          score={data.patternAnalysis.overallScore}
          max={25}
        />
        <ScoreBar
          label="Post-Incident"
          score={data.postIncident.overallScore}
          max={25}
        />
      </div>

      {/* Child Incident Profiles — default open */}
      <CollapsibleSection title="Child Incident Profiles" defaultOpen={true}>
        {data.childProfiles.length === 0 ? (
          <p className="text-sm text-gray-500">No children with incidents during this period.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {data.childProfiles.map((profile) => (
              <ChildProfileCard
                key={profile.childId}
                profile={profile}
                categoryLabel={categoryLabel(profile.predominantCategory)}
              />
            ))}
          </div>
        )}
      </CollapsibleSection>

      {/* Incident Response Detail */}
      <CollapsibleSection title="Incident Response">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard
            label="Response Quality"
            value={`${data.incidentResponse.responseQualityRate}%`}
            color={data.incidentResponse.responseQualityRate >= 80 ? "green" : "amber"}
          />
          <MetricCard
            label="Restraint Rate"
            value={`${data.incidentResponse.restraintRate}%`}
            color={data.incidentResponse.restraintRate === 0 ? "green" : "red"}
          />
          <MetricCard
            label="Avg Response"
            value={`${data.incidentResponse.averageResponseTimeMins}m`}
            color="blue"
          />
          <MetricCard
            label="Major Incidents"
            value={data.incidentResponse.majorIncidentCount}
            color={data.incidentResponse.majorIncidentCount > 0 ? "amber" : "green"}
          />
        </div>
      </CollapsibleSection>

      {/* Notification Compliance Detail */}
      <CollapsibleSection title="Notification Compliance">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard
            label="Timely & Complete"
            value={`${data.notificationCompliance.timelyCompleteRate}%`}
            color={data.notificationCompliance.timelyCompleteRate >= 90 ? "green" : "amber"}
          />
          <MetricCard
            label="Late"
            value={data.notificationCompliance.lateNotificationCount}
            color={data.notificationCompliance.lateNotificationCount > 0 ? "amber" : "green"}
          />
          <MetricCard
            label="Not Notified"
            value={data.notificationCompliance.notNotifiedCount}
            color={data.notificationCompliance.notNotifiedCount > 0 ? "red" : "green"}
          />
          <MetricCard
            label="Managers Informed"
            value={`${data.notificationCompliance.managersInformedRate}%`}
            color={data.notificationCompliance.managersInformedRate >= 90 ? "green" : "amber"}
          />
        </div>
      </CollapsibleSection>

      {/* Pattern Analysis Detail */}
      <CollapsibleSection title="Pattern Analysis">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
          <MetricCard
            label="Trends Analysed"
            value={data.patternAnalysis.trendsAnalysed}
            color="blue"
          />
          <MetricCard
            label="Escalating"
            value={data.patternAnalysis.escalatingChildCount}
            color={data.patternAnalysis.escalatingChildCount > 0 ? "red" : "green"}
          />
          <MetricCard
            label="Lessons Rate"
            value={`${data.patternAnalysis.lessonsIdentifiedRate}%`}
            color={data.patternAnalysis.lessonsIdentifiedRate >= 80 ? "green" : "amber"}
          />
          <MetricCard
            label="Triggers Found"
            value={data.patternAnalysis.triggerPatternsIdentified}
            color="purple"
          />
        </div>
        {data.patternAnalysis.predominantCategory !== "none" && (
          <p className="text-xs text-gray-600">
            Predominant category:{" "}
            <span className="font-medium">
              {categoryLabel(data.patternAnalysis.predominantCategory)}
            </span>
          </p>
        )}
      </CollapsibleSection>

      {/* Post-Incident Detail */}
      <CollapsibleSection title="Post-Incident">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard
            label="Debrief Rate"
            value={`${data.postIncident.debriefCompletionRate}%`}
            color={data.postIncident.debriefCompletionRate >= 80 ? "green" : "amber"}
          />
          <MetricCard
            label="Plan Updated"
            value={`${data.postIncident.supportPlanUpdateRate}%`}
            color={data.postIncident.supportPlanUpdateRate >= 70 ? "green" : "amber"}
          />
          <MetricCard
            label="Medical"
            value={`${data.postIncident.medicalAttentionRate}%`}
            color="blue"
          />
          <MetricCard
            label="No Action"
            value={data.postIncident.noActionCount}
            color={data.postIncident.noActionCount > 0 ? "red" : "green"}
          />
        </div>
      </CollapsibleSection>

      {/* Strengths, Areas for Improvement, Actions */}
      <CollapsibleSection title="Strengths, Areas for Improvement & Actions">
        {data.strengths.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-green-800 mb-2">Strengths</h4>
            <ul className="space-y-1">
              {data.strengths.map((s, i) => (
                <li key={i} className="text-xs text-green-700">
                  + {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {data.areasForImprovement.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-amber-800 mb-2">Areas for Improvement</h4>
            <ul className="space-y-1">
              {data.areasForImprovement.map((a, i) => (
                <li key={i} className="text-xs text-amber-700">
                  - {a}
                </li>
              ))}
            </ul>
          </div>
        )}

        {data.actions.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-red-800 mb-2">Required Actions</h4>
            <ul className="space-y-1">
              {data.actions.map((action, i) => (
                <li key={i} className="text-xs text-red-700 flex items-start gap-1.5">
                  <span className="mt-0.5 shrink-0">
                    {action.startsWith("URGENT") ? "●" : "○"}
                  </span>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CollapsibleSection>

      {/* Regulatory Framework */}
      <CollapsibleSection title="Regulatory Framework">
        <ul className="space-y-1">
          {data.regulatoryLinks.map((link, i) => (
            <li key={i} className="text-xs text-gray-600">
              {link}
            </li>
          ))}
        </ul>
      </CollapsibleSection>
    </div>
  );
}

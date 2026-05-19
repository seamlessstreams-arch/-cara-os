"use client";

// ==============================================================================
// COMPLAINT RESOLUTION EFFECTIVENESS DASHBOARD WIDGET
//
// Displays the 4-layer complaint resolution effectiveness intelligence:
// - Overall score with rating
// - Layer scores: resolution quality, compliance, policy, staff readiness
// - Child complaint profiles
// - Strengths, areas for improvement, and actions
// - Regulatory references
//
// ONLY React + Tailwind CSS. No lucide-react, no Card/Badge, no cn().
// ==============================================================================

import { useState, useEffect } from "react";

// -- Local interfaces (mirrors API shape) ------------------------------------

interface ResolutionQuality {
  overallScore: number;
  resolutionRate: number;
  childInformedRate: number;
  lessonsLearnedRate: number;
  actionsTakenRate: number;
}

interface ComplaintCompliance {
  overallScore: number;
  resolvedWithinTimescaleRate: number;
  documentedRate: number;
  complainantSatisfiedRate: number;
  sourceDiversity: number;
}

interface ComplaintPolicyData {
  overallScore: number;
  complaintsProcedure: boolean;
  timescaleStandards: boolean;
  childFriendlyProcess: boolean;
  independentAdvocacy: boolean;
  escalationPathway: boolean;
  learningFromComplaints: boolean;
  regularReview: boolean;
}

interface StaffReadiness {
  overallScore: number;
  totalStaff: number;
  complaintHandlingRate: number;
  childFocusedResolutionRate: number;
  conflictResolutionRate: number;
  documentationSkillsRate: number;
  advocacyAwarenessRate: number;
  regulatoryRequirementsRate: number;
}

interface ChildProfile {
  childId: string;
  childName: string;
  complaintCount: number;
  resolutionRate: number;
  childInformedRate: number;
  sourceDiversity: number;
  overallScore: number;
}

interface RecordSummary {
  id: string;
  childName: string;
  date: string;
  source: string;
  outcome: string;
}

interface DashboardData {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: string;
  resolutionQuality: ResolutionQuality;
  complaintCompliance: ComplaintCompliance;
  complaintPolicy: ComplaintPolicyData;
  staffComplaintReadiness: StaffReadiness;
  childProfiles: ChildProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
  meta?: {
    recordSummary: RecordSummary[];
    ratingLabel: string;
  };
}

// -- Inline helpers -----------------------------------------------------------

function ratingColour(rating: string): string {
  switch (rating) {
    case "outstanding":
      return "bg-green-100 text-green-800 border-green-300";
    case "good":
      return "bg-blue-100 text-blue-800 border-blue-300";
    case "requires_improvement":
      return "bg-orange-100 text-orange-800 border-orange-300";
    default:
      return "bg-red-100 text-red-800 border-red-300";
  }
}

function ratingLabel(rating: string): string {
  switch (rating) {
    case "outstanding":
      return "Outstanding";
    case "good":
      return "Good";
    case "requires_improvement":
      return "Requires Improvement";
    default:
      return "Inadequate";
  }
}

function boolBadge(value: boolean): JSX.Element {
  return value ? (
    <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
      Yes
    </span>
  ) : (
    <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded">
      No
    </span>
  );
}

// -- Inline components --------------------------------------------------------

function ScoreBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pctVal = max > 0 ? Math.round((value / max) * 100) : 0;
  const colour =
    pctVal >= 80
      ? "bg-green-500"
      : pctVal >= 60
        ? "bg-blue-500"
        : pctVal >= 40
          ? "bg-orange-500"
          : "bg-red-500";

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium text-gray-800">
          {value}/{max}
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${colour}`}
          style={{ width: `${pctVal}%` }}
        />
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-gray-800">{title}</h4>
      {children}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center p-2 bg-gray-50 rounded-lg">
      <div className="text-lg font-bold text-gray-700">{value}</div>
      <div className="text-[10px] text-gray-500 uppercase mt-0.5">{label}</div>
    </div>
  );
}

// -- Main Widget --------------------------------------------------------------

export default function ComplaintResolutionEffectivenessDashboardWidget() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "quality" | "compliance" | "policy" | "staff" | "children"
  >("quality");

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/complaint-resolution-effectiveness");
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
        <div className="h-20 bg-gray-100 rounded mb-3" />
        <div className="grid grid-cols-4 gap-2">
          <div className="h-12 bg-gray-100 rounded" />
          <div className="h-12 bg-gray-100 rounded" />
          <div className="h-12 bg-gray-100 rounded" />
          <div className="h-12 bg-gray-100 rounded" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white border border-red-200 rounded-xl p-6">
        <h3 className="font-semibold text-red-800">
          Complaint Resolution Effectiveness
        </h3>
        <p className="text-sm text-red-600 mt-1">{error}</p>
      </div>
    );
  }

  // Null guard
  if (!data) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="font-semibold text-gray-800">
          Complaint Resolution Effectiveness
        </h3>
        <p className="text-sm text-gray-500 mt-1">No data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900 text-lg">
            Complaint Resolution Effectiveness
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {data.periodStart} to {data.periodEnd} |{" "}
            {data.staffComplaintReadiness.totalStaff} staff |{" "}
            {data.childProfiles.length} children
          </p>
        </div>
        <div
          className={`rounded-lg border px-4 py-3 text-center ${ratingColour(data.rating)}`}
        >
          <div className="text-3xl font-bold">{data.overallScore}</div>
          <div className="text-sm font-medium mt-1">
            {ratingLabel(data.rating)}
          </div>
        </div>
      </div>

      {/* 4 Layer Score Bars */}
      <div className="space-y-2 mb-4">
        <ScoreBar
          label="Resolution Quality"
          value={data.resolutionQuality.overallScore}
          max={25}
        />
        <ScoreBar
          label="Complaint Compliance"
          value={data.complaintCompliance.overallScore}
          max={25}
        />
        <ScoreBar
          label="Complaint Policy"
          value={data.complaintPolicy.overallScore}
          max={25}
        />
        <ScoreBar
          label="Staff Readiness"
          value={data.staffComplaintReadiness.overallScore}
          max={25}
        />
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-4">
        <Stat label="Resolution" value={`${data.resolutionQuality.resolutionRate}%`} />
        <Stat label="Timescale" value={`${data.complaintCompliance.resolvedWithinTimescaleRate}%`} />
        <Stat label="Informed" value={`${data.resolutionQuality.childInformedRate}%`} />
        <Stat label="Documented" value={`${data.complaintCompliance.documentedRate}%`} />
        <Stat label="Satisfied" value={`${data.complaintCompliance.complainantSatisfiedRate}%`} />
        <Stat label="Staff" value={data.staffComplaintReadiness.totalStaff} />
      </div>

      {/* Actions */}
      {data.actions.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <h4 className="text-sm font-semibold text-red-800 mb-2">Actions</h4>
          <ul className="space-y-1">
            {data.actions.map((action, i) => (
              <li
                key={i}
                className="text-xs text-red-700 flex items-start gap-1.5"
              >
                <span className="mt-0.5 shrink-0">
                  {action.startsWith("URGENT") ? "●" : "▪"}
                </span>
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Expandable Detail */}
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
            {(
              [
                ["quality", "Resolution"],
                ["compliance", "Compliance"],
                ["policy", "Policy"],
                ["staff", "Staff"],
                ["children", "Children"],
              ] as const
            ).map(([key, label]) => (
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

          {/* Resolution Quality Tab */}
          {activeTab === "quality" && (
            <Section title="Resolution Quality">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Stat label="Resolution Rate" value={`${data.resolutionQuality.resolutionRate}%`} />
                <Stat label="Child Informed" value={`${data.resolutionQuality.childInformedRate}%`} />
                <Stat label="Lessons Learned" value={`${data.resolutionQuality.lessonsLearnedRate}%`} />
                <Stat label="Actions Taken" value={`${data.resolutionQuality.actionsTakenRate}%`} />
              </div>
              {data.meta?.recordSummary && (
                <div className="bg-gray-50 rounded-lg p-3 mt-2">
                  {data.meta.recordSummary.map((rec) => (
                    <div
                      key={rec.id}
                      className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="font-medium text-sm truncate">
                          {rec.childName}
                        </span>
                        <span className="text-xs text-gray-400">
                          ({rec.source})
                        </span>
                        <span className="text-xs text-gray-400">
                          {rec.date}
                        </span>
                      </div>
                      <span className="text-xs text-gray-600 shrink-0">
                        {rec.outcome}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Section>
          )}

          {/* Compliance Tab */}
          {activeTab === "compliance" && (
            <Section title="Complaint Compliance">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Stat label="Within Timescale" value={`${data.complaintCompliance.resolvedWithinTimescaleRate}%`} />
                <Stat label="Documented" value={`${data.complaintCompliance.documentedRate}%`} />
                <Stat label="Satisfied" value={`${data.complaintCompliance.complainantSatisfiedRate}%`} />
                <Stat label="Source Diversity" value={`${Math.round(data.complaintCompliance.sourceDiversity * 100)}%`} />
              </div>
            </Section>
          )}

          {/* Policy Tab */}
          {activeTab === "policy" && (
            <Section title="Complaint Policy">
              <div className="grid grid-cols-1 gap-1.5">
                {[
                  ["Complaints Procedure", data.complaintPolicy.complaintsProcedure],
                  ["Timescale Standards", data.complaintPolicy.timescaleStandards],
                  ["Child-Friendly Process", data.complaintPolicy.childFriendlyProcess],
                  ["Independent Advocacy", data.complaintPolicy.independentAdvocacy],
                  ["Escalation Pathway", data.complaintPolicy.escalationPathway],
                  ["Learning from Complaints", data.complaintPolicy.learningFromComplaints],
                  ["Regular Review", data.complaintPolicy.regularReview],
                ].map(([label, value]) => (
                  <div
                    key={label as string}
                    className="flex items-center justify-between py-1 px-2 bg-gray-50 rounded"
                  >
                    <span className="text-xs text-gray-700">{label as string}</span>
                    {boolBadge(value as boolean)}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Staff Tab */}
          {activeTab === "staff" && (
            <Section title="Staff Complaint Readiness">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <Stat label="Complaint Handling" value={`${data.staffComplaintReadiness.complaintHandlingRate}%`} />
                <Stat label="Child-Focused" value={`${data.staffComplaintReadiness.childFocusedResolutionRate}%`} />
                <Stat label="Conflict Resolution" value={`${data.staffComplaintReadiness.conflictResolutionRate}%`} />
                <Stat label="Documentation" value={`${data.staffComplaintReadiness.documentationSkillsRate}%`} />
                <Stat label="Advocacy Awareness" value={`${data.staffComplaintReadiness.advocacyAwarenessRate}%`} />
                <Stat label="Regulatory" value={`${data.staffComplaintReadiness.regulatoryRequirementsRate}%`} />
              </div>
              <div className="mt-2">
                <Stat label="Total Staff" value={data.staffComplaintReadiness.totalStaff} />
              </div>
            </Section>
          )}

          {/* Children Tab */}
          {activeTab === "children" && (
            <Section title="Child Complaint Profiles">
              <div className="bg-gray-50 rounded-lg p-3">
                {data.childProfiles.length > 0 ? (
                  data.childProfiles.map((profile) => {
                    const scoreColor =
                      profile.overallScore >= 8
                        ? "bg-green-100 text-green-700"
                        : profile.overallScore >= 5
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700";

                    return (
                      <div
                        key={profile.childId}
                        className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                      >
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-sm truncate">
                            {profile.childName}
                          </span>
                          <div className="flex gap-3 text-[10px] text-gray-400 mt-0.5">
                            <span>Complaints: {profile.complaintCount}</span>
                            <span>Resolved: {profile.resolutionRate}%</span>
                            <span>Informed: {profile.childInformedRate}%</span>
                            <span>Sources: {profile.sourceDiversity}</span>
                          </div>
                        </div>
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded shrink-0 ${scoreColor}`}
                        >
                          {profile.overallScore}/10
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-gray-500 text-center py-2">
                    No child profiles available
                  </p>
                )}
              </div>
            </Section>
          )}

          {/* Strengths */}
          {data.strengths.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-green-800 mb-2">
                Strengths
              </h4>
              <ul className="space-y-1">
                {data.strengths.map((s, i) => (
                  <li key={i} className="text-xs text-green-700">
                    + {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Areas for Improvement */}
          {data.areasForImprovement.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-orange-800 mb-2">
                Areas for Improvement
              </h4>
              <ul className="space-y-1">
                {data.areasForImprovement.map((a, i) => (
                  <li key={i} className="text-xs text-orange-700">
                    - {a}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Regulatory Links */}
          {data.regulatoryLinks.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-800 mb-2">
                Regulatory References
              </h4>
              <ul className="space-y-1">
                {data.regulatoryLinks.map((link, i) => (
                  <li key={i} className="text-xs text-gray-600">
                    {link}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

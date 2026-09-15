"use client";

// ══════════════════════════════════════════════════════════════════════════════
// MISSING & ABSENT EPISODES DASHBOARD WIDGET
//
// Displays the 4-layer missing/absent episodes intelligence:
// - Overall score with rating
// - Layer scores: episode management, prevention, policy, staff readiness
// - Child missing profiles
// - Strengths, areas for improvement, actions, regulatory links
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";
import { meets, formatRate } from "@/lib/metrics/rate";

// ── Local interfaces (mirrors API shape) ──────────────────────────────────

interface EpisodeManagement {
  returnInterviewCompletionRate: number;
  returnInterviewTimelyRate: number;
  riskBreakdown: Record<string, number>;
  policeNotificationRate: number;
  localAuthorityNotificationRate: number;
  score: number;
}

interface PreventionEffectiveness {
  triggerIdentificationRate: number;
  preventionPlanUpdateRate: number;
  resolutionRate: number;
  selfReturnRate: number;
  score: number;
}

interface MissingPolicyResult {
  fieldsCompliant: number;
  totalFields: number;
  complianceRate: number;
  score: number;
}

interface StaffReadiness {
  totalStaff: number;
  averageCompetencyRate: number;
  competencyBreakdown: Record<string, number>;
  score: number;
}

interface ChildProfile {
  childId: string;
  childName: string;
  totalEpisodes: number;
  highRiskEpisodes: number;
  returnInterviewRate: number;
  triggerIdentifiedRate: number;
  overallScore: number;
}

interface MissingAbsentData {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: string;
  totalEpisodes: number;
  episodeManagement: EpisodeManagement;
  preventionEffectiveness: PreventionEffectiveness;
  missingPolicy: MissingPolicyResult;
  staffReadiness: StaffReadiness;
  childProfiles: ChildProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
  meta?: {
    episodeSummary: {
      id: string;
      date: string;
      type: string;
      riskLevel: string;
      outcome: string;
      child: string;
    }[];
    ratingLabel: string;
  };
}

// ── Rating Badge ──────────────────────────────────────────────────────────

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

// ── ScoreBar ──────────────────────────────────────────────────────────────

function ScoreBar({ label, score, max }: { label: string; score: number; max: number }) {
  const pctVal = max > 0 ? Math.round((score / max) * 100) : 0;
  const color =
    pctVal >= 80
      ? "bg-green-500"
      : pctVal >= 60
        ? "bg-blue-500"
        : pctVal >= 40
          ? "bg-orange-500"
          : "bg-red-500";
  const textColor =
    pctVal >= 80
      ? "text-green-700"
      : pctVal >= 60
        ? "text-blue-700"
        : pctVal >= 40
          ? "text-orange-700"
          : "text-red-700";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-700">{label}</span>
        <span className={`text-xs font-bold ${textColor}`}>
          {score}/{max}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${color}`}
          style={{ width: `${pctVal}%` }}
        />
      </div>
    </div>
  );
}

// ── Collapsible Section ───────────────────────────────────────────────────

function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border border-gray-200 rounded-lg">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 rounded-lg"
      >
        <span>{title}</span>
        <span className="text-gray-400">{open ? "−" : "+"}</span>
      </button>
      {open && <div className="px-3 pb-3 space-y-3">{children}</div>}
    </div>
  );
}

// ── Stat ──────────────────────────────────────────────────────────────────

function Stat({ label, value, color }: { label: string; value: string | number; color?: string }) {
  const bgColor = color ?? "bg-gray-50";
  const textColor = color
    ? color.replace("bg-", "text-").replace("-50", "-700").replace("-100", "-700")
    : "text-gray-700";

  return (
    <div className={`rounded-lg p-2.5 text-center ${bgColor}`}>
      <div className={`text-xl font-bold ${textColor}`}>{value}</div>
      <div className="text-[10px] font-medium text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}

// ── Main Widget ───────────────────────────────────────────────────────────

export default function MissingAbsentEpisodesDashboardWidget() {
  const [data, setData] = useState<MissingAbsentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/missing-absent-episodes");
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
        <h3 className="font-semibold text-red-800">Missing & Absent Episodes</h3>
        <p className="text-sm text-red-600 mt-1">{error}</p>
      </div>
    );
  }

  // Null guard
  if (!data) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="font-semibold text-gray-800">Missing & Absent Episodes</h3>
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
            Missing & Absent Episodes
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {data.periodStart} to {data.periodEnd} | {data.totalEpisodes} episodes | {data.staffReadiness.totalStaff} staff
          </p>
        </div>
        <RatingBadge score={data.overallScore} rating={data.rating} />
      </div>

      {/* 4 Layer Score Bars */}
      <div className="space-y-2 mb-4">
        <ScoreBar label="Episode Management" score={data.episodeManagement.score} max={25} />
        <ScoreBar label="Prevention Effectiveness" score={data.preventionEffectiveness.score} max={25} />
        <ScoreBar label="Missing Policy" score={data.missingPolicy.score} max={25} />
        <ScoreBar label="Staff Readiness" score={data.staffReadiness.score} max={25} />
      </div>

      {/* Urgent Actions */}
      {data.actions.length > 0 &&
        !data.actions[0].startsWith("No immediate actions") && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <h4 className="text-sm font-semibold text-red-800 mb-2">Actions Required</h4>
            <ul className="space-y-1">
              {data.actions.slice(0, 4).map((action, i) => (
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

      {/* Episode Management Section */}
      <CollapsibleSection title="Episode Management" defaultOpen>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Stat
            label="RI Completion"
            value={data.episodeManagement.returnInterviewCompletionRate + "%"}
            color={meets(data.episodeManagement.returnInterviewCompletionRate, 90) ? "bg-green-50" : meets(data.episodeManagement.returnInterviewCompletionRate, 70) ? "bg-yellow-50" : "bg-red-50"}
          />
          <Stat
            label="RI Timely (72h)"
            value={data.episodeManagement.returnInterviewTimelyRate + "%"}
            color={meets(data.episodeManagement.returnInterviewTimelyRate, 90) ? "bg-green-50" : meets(data.episodeManagement.returnInterviewTimelyRate, 70) ? "bg-yellow-50" : "bg-red-50"}
          />
          <Stat
            label="Police Notified"
            value={data.episodeManagement.policeNotificationRate + "%"}
            color={meets(data.episodeManagement.policeNotificationRate, 90) ? "bg-green-50" : meets(data.episodeManagement.policeNotificationRate, 70) ? "bg-yellow-50" : "bg-red-50"}
          />
          <Stat
            label="LA Notified"
            value={data.episodeManagement.localAuthorityNotificationRate + "%"}
            color={meets(data.episodeManagement.localAuthorityNotificationRate, 90) ? "bg-green-50" : meets(data.episodeManagement.localAuthorityNotificationRate, 70) ? "bg-yellow-50" : "bg-red-50"}
          />
        </div>
        {/* Risk breakdown */}
        <div className="grid grid-cols-4 gap-2 mt-2">
          <Stat label="Low Risk" value={data.episodeManagement.riskBreakdown.low ?? 0} color="bg-green-50" />
          <Stat label="Medium Risk" value={data.episodeManagement.riskBreakdown.medium ?? 0} color="bg-yellow-50" />
          <Stat label="High Risk" value={data.episodeManagement.riskBreakdown.high ?? 0} color="bg-orange-50" />
          <Stat label="Very High" value={data.episodeManagement.riskBreakdown.very_high ?? 0} color="bg-red-50" />
        </div>
      </CollapsibleSection>

      {/* Prevention Effectiveness Section */}
      <div className="mt-3">
        <CollapsibleSection title="Prevention Effectiveness">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Stat
              label="Triggers Identified"
              value={data.preventionEffectiveness.triggerIdentificationRate + "%"}
              color={meets(data.preventionEffectiveness.triggerIdentificationRate, 80) ? "bg-green-50" : "bg-yellow-50"}
            />
            <Stat
              label="Plans Updated"
              value={data.preventionEffectiveness.preventionPlanUpdateRate + "%"}
              color={meets(data.preventionEffectiveness.preventionPlanUpdateRate, 80) ? "bg-green-50" : "bg-yellow-50"}
            />
            <Stat
              label="Resolved"
              value={data.preventionEffectiveness.resolutionRate + "%"}
              color={meets(data.preventionEffectiveness.resolutionRate, 90) ? "bg-green-50" : "bg-red-50"}
            />
            <Stat
              label="Self-Returned"
              value={data.preventionEffectiveness.selfReturnRate + "%"}
              color={meets(data.preventionEffectiveness.selfReturnRate, 40) ? "bg-green-50" : "bg-gray-50"}
            />
          </div>
        </CollapsibleSection>
      </div>

      {/* Missing Policy Section */}
      <div className="mt-3">
        <CollapsibleSection title="Missing Policy">
          <div className="grid grid-cols-3 gap-2">
            <Stat
              label="Fields Compliant"
              value={data.missingPolicy.fieldsCompliant + "/" + data.missingPolicy.totalFields}
              color={meets(data.missingPolicy.complianceRate, 80) ? "bg-green-50" : "bg-orange-50"}
            />
            <Stat
              label="Compliance Rate"
              value={data.missingPolicy.complianceRate + "%"}
              color={meets(data.missingPolicy.complianceRate, 80) ? "bg-green-50" : "bg-orange-50"}
            />
            <Stat
              label="Policy Score"
              value={data.missingPolicy.score + "/25"}
              color={data.missingPolicy.score >= 20 ? "bg-green-50" : "bg-orange-50"}
            />
          </div>
        </CollapsibleSection>
      </div>

      {/* Staff Readiness Section */}
      <div className="mt-3">
        <CollapsibleSection title="Staff Readiness">
          <div className="grid grid-cols-2 gap-2">
            <Stat
              label="Total Staff"
              value={data.staffReadiness.totalStaff}
            />
            <Stat
              label="Avg Competency"
              value={data.staffReadiness.averageCompetencyRate + "%"}
              color={data.staffReadiness.averageCompetencyRate === null ? "bg-slate-50" : data.staffReadiness.averageCompetencyRate >= 90 ? "bg-green-50" : data.staffReadiness.averageCompetencyRate >= 70 ? "bg-yellow-50" : "bg-red-50"}
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
            {Object.entries(data.staffReadiness.competencyBreakdown).map(([key, val]) => (
              <Stat
                key={key}
                label={key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}
                value={val + "%"}
                color={Number(val) >= 90 ? "bg-green-50" : Number(val) >= 70 ? "bg-yellow-50" : "bg-red-50"}
              />
            ))}
          </div>
        </CollapsibleSection>
      </div>

      {/* Child Profiles Section */}
      <div className="mt-3">
        <CollapsibleSection title="Child Profiles">
          {data.childProfiles.length > 0 ? (
            <div className="bg-gray-50 rounded-lg p-3">
              {data.childProfiles.map((profile) => {
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
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">{profile.childName}</span>
                        {profile.highRiskEpisodes > 0 && (
                          <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded">
                            {profile.highRiskEpisodes} high risk
                          </span>
                        )}
                      </div>
                      <div className="flex gap-3 text-[10px] text-gray-400 mt-0.5">
                        <span>{profile.totalEpisodes} episode(s)</span>
                        <span>RI: {profile.returnInterviewRate}%</span>
                        <span>Triggers: {formatRate(profile.triggerIdentifiedRate)}</span>
                      </div>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded shrink-0 ${scoreColor}`}>
                      {profile.overallScore}/10
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-gray-500 text-center py-2">No child profiles available</p>
          )}
        </CollapsibleSection>
      </div>

      {/* Episode Summary (from meta) */}
      {data.meta?.episodeSummary && data.meta.episodeSummary.length > 0 && (
        <div className="mt-3">
          <CollapsibleSection title="Episode Summary">
            <div className="bg-gray-50 rounded-lg p-3">
              {data.meta.episodeSummary.map((ep) => (
                <div
                  key={ep.id}
                  className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="font-medium text-sm truncate">{ep.child}</span>
                    <span className="text-xs text-gray-400">{ep.type}</span>
                    <span className="text-xs text-gray-400">({ep.riskLevel})</span>
                    <span className="text-xs text-gray-400">{ep.date}</span>
                  </div>
                  <span className="text-xs text-gray-600 shrink-0">{ep.outcome}</span>
                </div>
              ))}
            </div>
          </CollapsibleSection>
        </div>
      )}

      {/* Strengths */}
      {data.strengths.length > 0 && (
        <div className="mt-4">
          <CollapsibleSection title="Strengths">
            <ul className="space-y-1">
              {data.strengths.map((s, i) => (
                <li key={i} className="text-xs text-green-700">+ {s}</li>
              ))}
            </ul>
          </CollapsibleSection>
        </div>
      )}

      {/* Areas for Improvement */}
      {data.areasForImprovement.length > 0 && (
        <div className="mt-3">
          <CollapsibleSection title="Areas for Improvement">
            <ul className="space-y-1">
              {data.areasForImprovement.map((a, i) => (
                <li key={i} className="text-xs text-orange-700">- {a}</li>
              ))}
            </ul>
          </CollapsibleSection>
        </div>
      )}

      {/* Actions (full list) */}
      {data.actions.length > 0 && (
        <div className="mt-3">
          <CollapsibleSection title="All Actions">
            <ul className="space-y-1">
              {data.actions.map((a, i) => (
                <li key={i} className="text-xs text-gray-700 flex items-start gap-1.5">
                  <span className="mt-0.5 shrink-0">
                    {a.startsWith("URGENT") ? "●" : a.startsWith("HIGH") ? "○" : a.startsWith("MEDIUM") ? "▪" : "—"}
                  </span>
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </CollapsibleSection>
        </div>
      )}

      {/* Regulatory Links */}
      {data.regulatoryLinks.length > 0 && (
        <div className="mt-3">
          <CollapsibleSection title="Regulatory References">
            <ul className="space-y-1">
              {data.regulatoryLinks.map((link, i) => (
                <li key={i} className="text-xs text-gray-600">{link}</li>
              ))}
            </ul>
          </CollapsibleSection>
        </div>
      )}
    </div>
  );
}

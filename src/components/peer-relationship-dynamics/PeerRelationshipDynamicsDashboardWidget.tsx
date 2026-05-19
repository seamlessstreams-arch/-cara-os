"use client";

// ══════════════════════════════════════════════════════════════════════════════
// PEER RELATIONSHIP DYNAMICS DASHBOARD WIDGET
//
// Displays the 4-layer peer relationship dynamics intelligence:
// - Overall score with rating
// - Layer scores: interaction quality, relationship safety, peer policy, staff readiness
// - Child peer profiles
// - Strengths, areas for improvement, and actions
// - Regulatory references
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";

// ── Local interfaces (mirrors API shape) ──────────────────────────────────

interface InteractionQuality {
  totalInteractions: number;
  positiveOutcomeRate: number;
  resolutionAchievedRate: number;
  socialSkillPracticedRate: number;
  childReflectedRate: number;
  documentedInLogRate: number;
  score: number;
}

interface RelationshipSafety {
  totalInteractions: number;
  negativeInteractionCount: number;
  negativeInteractionRate: number;
  staffMediatedNegativeRate: number;
  followUpPlannedNegativeRate: number;
  score: number;
}

interface PeerPolicyData {
  antisBullyingStrategy: boolean;
  conflictResolutionFramework: boolean;
  socialSkillsProgramme: boolean;
  peerMentoringScheme: boolean;
  inclusionStrategy: boolean;
  restorationPractice: boolean;
  regularReview: boolean;
  score: number;
}

interface StaffPeerReadiness {
  totalStaff: number;
  conflictResolutionRate: number;
  socialSkillsFacilitationRate: number;
  antibullyingPracticeRate: number;
  restorativeJusticeRate: number;
  groupDynamicsRate: number;
  traumaInformedRelationshipsRate: number;
  score: number;
}

interface ChildProfile {
  childId: string;
  childName: string;
  totalInteractions: number;
  positiveOutcomeRate: number;
  socialSkillPracticedRate: number;
  negativeInteractionRate: number;
  score: number;
}

interface PeerRelationshipData {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: string;
  interactionQuality: InteractionQuality;
  relationshipSafety: RelationshipSafety;
  peerPolicy: PeerPolicyData;
  staffPeerReadiness: StaffPeerReadiness;
  childProfiles: ChildProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
  meta?: {
    interactionSummary: { id: string; childName: string; date: string; type: string; outcome: string }[];
    ratingLabel: string;
  };
}

// ── ScoreBar ──────────────────────────────────────────────────────────────

function ScoreBar({ label, score, max = 25 }: { label: string; score: number; max?: number }) {
  const pctVal = Math.round((score / max) * 100);
  const fillColor =
    pctVal >= 80
      ? "bg-green-500"
      : pctVal >= 60
        ? "bg-blue-500"
        : pctVal >= 40
          ? "bg-orange-500"
          : "bg-red-500";

  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-medium text-gray-700">{label}</span>
        <span className="text-xs font-bold text-gray-900">
          {score}/{max}
        </span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${fillColor}`}
          style={{ width: `${pctVal}%` }}
        />
      </div>
    </div>
  );
}

// ── Section (collapsible) ─────────────────────────────────────────────────

function Section({
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
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <span className="text-sm font-semibold text-gray-800">{title}</span>
        <span className="text-gray-400 text-xs">{open ? "Hide" : "Show"}</span>
      </button>
      {open && <div className="px-4 py-3">{children}</div>}
    </div>
  );
}

// ── Stat ──────────────────────────────────────────────────────────────────

function Stat({ label, value, suffix = "" }: { label: string; value: string | number; suffix?: string }) {
  return (
    <div className="text-center p-2 bg-gray-50 rounded-lg">
      <div className="text-lg font-bold text-gray-800">
        {value}
        {suffix && <span className="text-sm font-normal text-gray-500">{suffix}</span>}
      </div>
      <div className="text-[10px] text-gray-500 uppercase mt-0.5">{label}</div>
    </div>
  );
}

// ── Main Widget ───────────────────────────────────────────────────────────

export default function PeerRelationshipDynamicsDashboardWidget() {
  const [data, setData] = useState<PeerRelationshipData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/peer-relationship-dynamics");
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
        <div className="h-4 bg-gray-100 rounded w-2/3 mb-3" />
        <div className="grid grid-cols-4 gap-3 mb-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded" />
          ))}
        </div>
        <div className="h-20 bg-gray-100 rounded" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white border border-red-200 rounded-xl p-6">
        <h3 className="font-semibold text-red-800">Peer Relationship Dynamics</h3>
        <p className="text-sm text-red-600 mt-1">{error}</p>
      </div>
    );
  }

  // Null guard
  if (!data) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="font-semibold text-gray-800">Peer Relationship Dynamics</h3>
        <p className="text-sm text-gray-500 mt-1">No data available</p>
      </div>
    );
  }

  const ratingColor =
    data.rating === "outstanding"
      ? "bg-green-100 text-green-800 border-green-300"
      : data.rating === "good"
        ? "bg-blue-100 text-blue-800 border-blue-300"
        : data.rating === "requires_improvement"
          ? "bg-orange-100 text-orange-800 border-orange-300"
          : "bg-red-100 text-red-800 border-red-300";

  const ratingLabel =
    data.meta?.ratingLabel ??
    (data.rating === "outstanding"
      ? "Outstanding"
      : data.rating === "good"
        ? "Good"
        : data.rating === "requires_improvement"
          ? "Requires Improvement"
          : "Inadequate");

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900 text-lg">
            Peer Relationship Dynamics
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {data.periodStart} to {data.periodEnd} | {data.interactionQuality.totalInteractions} interactions | {data.staffPeerReadiness.totalStaff} staff
          </p>
        </div>
        <div className={`rounded-lg border px-4 py-3 text-center ${ratingColor}`}>
          <div className="text-3xl font-bold">{data.overallScore}</div>
          <div className="text-sm font-medium mt-1">{ratingLabel}</div>
        </div>
      </div>

      {/* 4 Score Bars */}
      <div className="mb-5">
        <ScoreBar label="Interaction Quality" score={data.interactionQuality.score} />
        <ScoreBar label="Relationship Safety" score={data.relationshipSafety.score} />
        <ScoreBar label="Peer Policy" score={data.peerPolicy.score} />
        <ScoreBar label="Staff Peer Readiness" score={data.staffPeerReadiness.score} />
      </div>

      {/* Sections */}
      <div className="space-y-3">
        {/* Interaction Quality Details */}
        <Section title="Interaction Quality">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
            <Stat label="Positive Outcomes" value={data.interactionQuality.positiveOutcomeRate} suffix="%" />
            <Stat label="Resolution Achieved" value={data.interactionQuality.resolutionAchievedRate} suffix="%" />
            <Stat label="Skill Practised" value={data.interactionQuality.socialSkillPracticedRate} suffix="%" />
            <Stat label="Child Reflected" value={data.interactionQuality.childReflectedRate} suffix="%" />
            <Stat label="Documented" value={data.interactionQuality.documentedInLogRate} suffix="%" />
            <Stat label="Total" value={data.interactionQuality.totalInteractions} />
          </div>
        </Section>

        {/* Relationship Safety Details */}
        <Section title="Relationship Safety">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
            <Stat label="Negative Interactions" value={data.relationshipSafety.negativeInteractionCount} />
            <Stat label="Negative Rate" value={data.relationshipSafety.negativeInteractionRate} suffix="%" />
            <Stat label="Staff Mediated" value={data.relationshipSafety.staffMediatedNegativeRate} suffix="%" />
            <Stat label="Follow-Up Planned" value={data.relationshipSafety.followUpPlannedNegativeRate} suffix="%" />
          </div>
        </Section>

        {/* Peer Policy Details */}
        <Section title="Peer Policy">
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Anti-Bullying Strategy", value: data.peerPolicy.antisBullyingStrategy },
              { label: "Conflict Resolution", value: data.peerPolicy.conflictResolutionFramework },
              { label: "Social Skills Programme", value: data.peerPolicy.socialSkillsProgramme },
              { label: "Peer Mentoring", value: data.peerPolicy.peerMentoringScheme },
              { label: "Inclusion Strategy", value: data.peerPolicy.inclusionStrategy },
              { label: "Restoration Practice", value: data.peerPolicy.restorationPractice },
              { label: "Regular Review", value: data.peerPolicy.regularReview },
            ].map((item) => (
              <div
                key={item.label}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${
                  item.value
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                <span>{item.value ? "Yes" : "No"}</span>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* Staff Peer Readiness Details */}
        <Section title="Staff Peer Readiness">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
            <Stat label="Conflict Resolution" value={data.staffPeerReadiness.conflictResolutionRate} suffix="%" />
            <Stat label="Social Skills" value={data.staffPeerReadiness.socialSkillsFacilitationRate} suffix="%" />
            <Stat label="Anti-Bullying" value={data.staffPeerReadiness.antibullyingPracticeRate} suffix="%" />
            <Stat label="Restorative Justice" value={data.staffPeerReadiness.restorativeJusticeRate} suffix="%" />
            <Stat label="Group Dynamics" value={data.staffPeerReadiness.groupDynamicsRate} suffix="%" />
            <Stat label="Trauma-Informed" value={data.staffPeerReadiness.traumaInformedRelationshipsRate} suffix="%" />
          </div>
          <Stat label="Total Staff" value={data.staffPeerReadiness.totalStaff} />
        </Section>

        {/* Child Profiles */}
        <Section title="Child Peer Profiles">
          {data.childProfiles.length > 0 ? (
            <div className="space-y-2">
              {data.childProfiles.map((profile) => {
                const scoreColor =
                  profile.score >= 8
                    ? "bg-green-100 text-green-700"
                    : profile.score >= 5
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-700";

                return (
                  <div
                    key={profile.childId}
                    className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                  >
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-sm">{profile.childName}</span>
                      <div className="flex gap-3 text-[10px] text-gray-400 mt-0.5">
                        <span>{profile.totalInteractions} interactions</span>
                        <span>{profile.positiveOutcomeRate}% positive</span>
                        <span>{profile.socialSkillPracticedRate}% skills</span>
                        {profile.negativeInteractionRate > 0 && (
                          <span className="text-red-400">{profile.negativeInteractionRate}% negative</span>
                        )}
                      </div>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded shrink-0 ${scoreColor}`}>
                      {profile.score}/10
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-gray-500 text-center py-2">No child profiles available</p>
          )}
        </Section>

        {/* Strengths */}
        {data.strengths.length > 0 && (
          <Section title="Strengths" defaultOpen>
            <ul className="space-y-1">
              {data.strengths.map((s, i) => (
                <li key={i} className="text-xs text-green-700">+ {s}</li>
              ))}
            </ul>
          </Section>
        )}

        {/* Areas for Improvement */}
        {data.areasForImprovement.length > 0 && (
          <Section title="Areas for Improvement" defaultOpen>
            <ul className="space-y-1">
              {data.areasForImprovement.map((a, i) => (
                <li key={i} className="text-xs text-orange-700">- {a}</li>
              ))}
            </ul>
          </Section>
        )}

        {/* Actions */}
        {data.actions.length > 0 && (
          <Section title="Actions" defaultOpen>
            <ul className="space-y-1">
              {data.actions.map((action, i) => (
                <li key={i} className="text-xs text-red-700 flex items-start gap-1.5">
                  <span className="mt-0.5 shrink-0">
                    {action.startsWith("URGENT") ? "●" : "▪"}
                  </span>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Regulatory Links */}
        {data.regulatoryLinks.length > 0 && (
          <Section title="Regulatory References">
            <ul className="space-y-1">
              {data.regulatoryLinks.map((link, i) => (
                <li key={i} className="text-xs text-gray-600">{link}</li>
              ))}
            </ul>
          </Section>
        )}
      </div>
    </div>
  );
}

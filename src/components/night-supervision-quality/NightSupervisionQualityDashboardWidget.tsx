"use client";

// ══════════════════════════════════════════════════════════════════════════════
// NIGHT SUPERVISION QUALITY DASHBOARD WIDGET
//
// Displays the 4-layer night supervision quality intelligence:
// - Overall score with rating
// - Layer scores: check quality, night compliance, policy, staff readiness
// - Staff night profiles
// - Strengths, areas for improvement, and actions
// - Regulatory references
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";

// ── Local interfaces (mirrors API shape) ──────────────────────────────────

interface CheckQuality {
  totalChecks: number;
  satisfactoryRate: number;
  childrenAccountedForRate: number;
  documentedRate: number;
  environmentSafeRate: number;
  score: number;
}

interface NightCompliance {
  totalChecks: number;
  responseTimeAdequateRate: number;
  handoverRate: number;
  incidentReportRate: number;
  uniqueCheckTypes: number;
  checkTypeDiversity: number;
  score: number;
}

interface NightPolicy {
  nightStaffingPolicy: boolean;
  checkFrequencyStandard: boolean;
  wakingNightCriteria: boolean;
  sleepingNightProtocol: boolean;
  emergencyResponsePlan: boolean;
  handoverProcedure: boolean;
  regularReview: boolean;
  score: number;
}

interface StaffNightReadiness {
  totalStaff: number;
  nightSupervisionSkillsRate: number;
  safeguardingAtNightRate: number;
  emergencyFirstAidRate: number;
  fireEvacuationRate: number;
  childProtocolRate: number;
  documentationSkillsRate: number;
  score: number;
}

interface StaffNightProfile {
  staffId: string;
  staffName: string;
  totalChecks: number;
  satisfactoryRate: number;
  documentedRate: number;
  uniqueCheckTypes: number;
  score: number;
}

interface NightSupervisionData {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: string;
  checkQuality: CheckQuality;
  nightCompliance: NightCompliance;
  nightPolicy: NightPolicy;
  staffNightReadiness: StaffNightReadiness;
  staffNightProfiles: StaffNightProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
  meta?: {
    checkSummary: { id: string; staffName: string; date: string; type: string; outcome: string }[];
    ratingLabel: string;
  };
}

// ── Inline Helpers ────────────────────────────────────────────────────────

function ratingColour(rating: string): string {
  if (rating === "outstanding") return "bg-green-100 text-green-800 border-green-300";
  if (rating === "good") return "bg-blue-100 text-blue-800 border-blue-300";
  if (rating === "requires_improvement") return "bg-orange-100 text-orange-800 border-orange-300";
  return "bg-red-100 text-red-800 border-red-300";
}

function ratingLabel(rating: string): string {
  if (rating === "outstanding") return "Outstanding";
  if (rating === "good") return "Good";
  if (rating === "requires_improvement") return "Requires Improvement";
  return "Inadequate";
}

function boolBadge(value: boolean): JSX.Element {
  return value ? (
    <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">Yes</span>
  ) : (
    <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium">No</span>
  );
}

// ── Inline Sub-Components ─────────────────────────────────────────────────

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

  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs mb-0.5">
        <span className="text-gray-700 font-medium">{label}</span>
        <span className="text-gray-500">
          {score}/{max}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div className={`h-2 rounded-full ${color}`} style={{ width: pctVal + "%" }} />
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
    <div className="mb-4">
      <h4 className="text-sm font-semibold text-gray-800 mb-2">{title}</h4>
      {children}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center p-2 bg-gray-50 rounded">
      <div className="text-lg font-bold text-gray-700">{value}</div>
      <div className="text-[10px] text-gray-500 uppercase">{label}</div>
    </div>
  );
}

// ── Main Widget ────────────────────────────────────────────────────────────

export default function NightSupervisionQualityDashboardWidget() {
  const [data, setData] = useState<NightSupervisionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/night-supervision-quality");
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
          <div className="h-8 bg-gray-100 rounded" />
          <div className="h-8 bg-gray-100 rounded" />
          <div className="h-8 bg-gray-100 rounded" />
          <div className="h-8 bg-gray-100 rounded" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white border border-red-200 rounded-xl p-6">
        <h3 className="font-semibold text-red-800">Night Supervision Quality</h3>
        <p className="text-sm text-red-600 mt-1">{error}</p>
      </div>
    );
  }

  // Null guard
  if (!data) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="font-semibold text-gray-800">Night Supervision Quality</h3>
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
            Night Supervision Quality
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {data.periodStart} to {data.periodEnd} | {data.checkQuality.totalChecks} checks | {data.staffNightReadiness.totalStaff} staff
          </p>
        </div>
        <div className={`rounded-lg border px-4 py-3 text-center ${ratingColour(data.rating)}`}>
          <div className="text-3xl font-bold">{data.overallScore}</div>
          <div className="text-sm font-medium mt-1">{ratingLabel(data.rating)}</div>
        </div>
      </div>

      {/* 4 Score Bars */}
      <Section title="Dimension Scores">
        <ScoreBar label="Check Quality" score={data.checkQuality.score} max={25} />
        <ScoreBar label="Night Compliance" score={data.nightCompliance.score} max={25} />
        <ScoreBar label="Night Policy" score={data.nightPolicy.score} max={25} />
        <ScoreBar label="Staff Readiness" score={data.staffNightReadiness.score} max={25} />
      </Section>

      {/* Check Quality Section */}
      <Section title="Check Quality">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Stat label="Satisfactory" value={data.checkQuality.satisfactoryRate + "%"} />
          <Stat label="Children Accounted" value={data.checkQuality.childrenAccountedForRate + "%"} />
          <Stat label="Documented" value={data.checkQuality.documentedRate + "%"} />
          <Stat label="Environment Safe" value={data.checkQuality.environmentSafeRate + "%"} />
        </div>
      </Section>

      {/* Night Compliance Section */}
      <Section title="Night Compliance">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Stat label="Response Time" value={data.nightCompliance.responseTimeAdequateRate + "%"} />
          <Stat label="Handover" value={data.nightCompliance.handoverRate + "%"} />
          <Stat label="Incident Report" value={data.nightCompliance.incidentReportRate + "%"} />
          <Stat label="Check Types" value={data.nightCompliance.uniqueCheckTypes + "/8"} />
        </div>
      </Section>

      {/* Policy Booleans Section */}
      <Section title="Night Policy">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
            <span className="text-xs text-gray-600">Staffing Policy</span>
            {boolBadge(data.nightPolicy.nightStaffingPolicy)}
          </div>
          <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
            <span className="text-xs text-gray-600">Check Frequency</span>
            {boolBadge(data.nightPolicy.checkFrequencyStandard)}
          </div>
          <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
            <span className="text-xs text-gray-600">Waking Night</span>
            {boolBadge(data.nightPolicy.wakingNightCriteria)}
          </div>
          <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
            <span className="text-xs text-gray-600">Sleeping Night</span>
            {boolBadge(data.nightPolicy.sleepingNightProtocol)}
          </div>
          <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
            <span className="text-xs text-gray-600">Emergency Plan</span>
            {boolBadge(data.nightPolicy.emergencyResponsePlan)}
          </div>
          <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
            <span className="text-xs text-gray-600">Handover Proc.</span>
            {boolBadge(data.nightPolicy.handoverProcedure)}
          </div>
          <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
            <span className="text-xs text-gray-600">Regular Review</span>
            {boolBadge(data.nightPolicy.regularReview)}
          </div>
        </div>
      </Section>

      {/* Staff Readiness Rates Section */}
      <Section title="Staff Night Readiness">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          <Stat label="Night Supervision" value={data.staffNightReadiness.nightSupervisionSkillsRate + "%"} />
          <Stat label="Safeguarding" value={data.staffNightReadiness.safeguardingAtNightRate + "%"} />
          <Stat label="First Aid" value={data.staffNightReadiness.emergencyFirstAidRate + "%"} />
          <Stat label="Fire Evacuation" value={data.staffNightReadiness.fireEvacuationRate + "%"} />
          <Stat label="Child Protocol" value={data.staffNightReadiness.childProtocolRate + "%"} />
          <Stat label="Documentation" value={data.staffNightReadiness.documentationSkillsRate + "%"} />
        </div>
      </Section>

      {/* Staff Night Profiles Section */}
      {data.staffNightProfiles.length > 0 && (
        <Section title="Staff Night Profiles">
          <div className="bg-gray-50 rounded-lg p-3">
            {data.staffNightProfiles.map((profile) => (
              <div
                key={profile.staffId}
                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
              >
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-sm truncate">{profile.staffName}</span>
                  <div className="flex gap-3 text-[10px] text-gray-400 mt-0.5">
                    <span>Checks: {profile.totalChecks}</span>
                    <span>Sat: {profile.satisfactoryRate}%</span>
                    <span>Doc: {profile.documentedRate}%</span>
                    <span>Types: {profile.uniqueCheckTypes}</span>
                  </div>
                </div>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded shrink-0 ${
                    profile.score >= 8
                      ? "bg-green-100 text-green-700"
                      : profile.score >= 5
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                  }`}
                >
                  {profile.score}/10
                </span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Strengths */}
      {data.strengths.length > 0 && (
        <Section title="Strengths">
          <ul className="space-y-1">
            {data.strengths.map((s, i) => (
              <li key={i} className="text-xs text-green-700">
                + {s}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Areas for Improvement */}
      {data.areasForImprovement.length > 0 && (
        <Section title="Areas for Improvement">
          <ul className="space-y-1">
            {data.areasForImprovement.map((a, i) => (
              <li key={i} className="text-xs text-orange-700">
                - {a}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Actions */}
      {data.actions.length > 0 && (
        <Section title="Actions">
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
              <li key={i} className="text-xs text-gray-600">
                {link}
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}

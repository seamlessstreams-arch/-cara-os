"use client";

// ══════════════════════════════════════════════════════════════════════════════
// STAFF WELLBEING & RESILIENCE DASHBOARD WIDGET
//
// Displays the 4-layer staff wellbeing & resilience intelligence:
// - Overall score with rating
// - Layer scores: wellbeing quality, compliance, policy, staff readiness
// - Staff wellbeing profiles
// - Strengths, areas for improvement, and actions
// - Regulatory references
// ══════════════════════════════════════════════════════════════════════════════

import { formatRate } from "@/lib/metrics/rate";
import { useState, useEffect } from "react";

// ── Local interfaces (mirrors API shape) ──────────────────────────────────

interface WellbeingQuality {
  totalAssessments: number;
  wellbeingRate: number;
  stressManagedRate: number;
  supportProvidedRate: number;
  workloadReviewedRate: number;
  score: number;
}

interface WellbeingCompliance {
  totalAssessments: number;
  actionPlanRate: number;
  followUpRate: number;
  feedbackRate: number;
  wellbeingTypeDiversityRatio: number;
  score: number;
}

interface WellbeingPolicyData {
  staffWellbeingStrategy: boolean;
  burnoutPreventionPlan: boolean;
  supervisionFramework: boolean;
  workloadManagementPolicy: boolean;
  employeeAssistanceProgramme: boolean;
  peerSupportNetwork: boolean;
  regularReview: boolean;
  score: number;
}

interface StaffResilienceReadiness {
  totalStaff: number;
  stressManagementRate: number;
  emotionalResilienceRate: number;
  boundaryMaintenanceRate: number;
  selfCareRate: number;
  teamSupportRate: number;
  debriefingSkillsRate: number;
  score: number;
}

interface StaffProfile {
  staffId: string;
  staffName: string;
  totalAssessments: number;
  wellbeingRate: number;
  stressManagedRate: number;
  uniqueTypes: number;
  score: number;
}

interface StaffWellbeingData {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: string;
  wellbeingQuality: WellbeingQuality;
  wellbeingCompliance: WellbeingCompliance;
  wellbeingPolicy: WellbeingPolicyData;
  staffResilienceReadiness: StaffResilienceReadiness;
  staffProfiles: StaffProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
  meta?: {
    assessmentSummary: { id: string; staffName: string; date: string; type: string; score: string }[];
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

export default function StaffWellbeingResilienceDashboardWidget() {
  const [data, setData] = useState<StaffWellbeingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/staff-wellbeing-resilience");
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
        <h3 className="font-semibold text-red-800">Staff Wellbeing &amp; Resilience</h3>
        <p className="text-sm text-red-600 mt-1">{error}</p>
      </div>
    );
  }

  // Null guard
  if (!data) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="font-semibold text-gray-800">Staff Wellbeing &amp; Resilience</h3>
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
            Staff Wellbeing &amp; Resilience
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {data.periodStart} to {data.periodEnd} | {data.wellbeingQuality.totalAssessments} assessments | {data.staffResilienceReadiness.totalStaff} staff
          </p>
        </div>
        <div className={`rounded-lg border px-4 py-3 text-center ${ratingColor}`}>
          <div className="text-3xl font-bold">{data.overallScore}</div>
          <div className="text-sm font-medium mt-1">{ratingLabel}</div>
        </div>
      </div>

      {/* 4 Score Bars */}
      <div className="mb-5">
        <ScoreBar label="Wellbeing Quality" score={data.wellbeingQuality.score} />
        <ScoreBar label="Wellbeing Compliance" score={data.wellbeingCompliance.score} />
        <ScoreBar label="Wellbeing Policy" score={data.wellbeingPolicy.score} />
        <ScoreBar label="Staff Resilience Readiness" score={data.staffResilienceReadiness.score} />
      </div>

      {/* Sections */}
      <div className="space-y-3">
        {/* Wellbeing Quality Details */}
        <Section title="Wellbeing Quality">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
            <Stat label="Wellbeing Rate" value={data.wellbeingQuality.wellbeingRate} suffix="%" />
            <Stat label="Stress Managed" value={data.wellbeingQuality.stressManagedRate} suffix="%" />
            <Stat label="Support Provided" value={data.wellbeingQuality.supportProvidedRate} suffix="%" />
            <Stat label="Workload Reviewed" value={data.wellbeingQuality.workloadReviewedRate} suffix="%" />
            <Stat label="Total Assessments" value={data.wellbeingQuality.totalAssessments} />
          </div>
        </Section>

        {/* Wellbeing Compliance Details */}
        <Section title="Wellbeing Compliance">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
            <Stat label="Action Plan Rate" value={data.wellbeingCompliance.actionPlanRate} suffix="%" />
            <Stat label="Follow-Up Rate" value={data.wellbeingCompliance.followUpRate} suffix="%" />
            <Stat label="Feedback Rate" value={data.wellbeingCompliance.feedbackRate} suffix="%" />
            <Stat label="Type Diversity" value={Math.round(data.wellbeingCompliance.wellbeingTypeDiversityRatio * 100)} suffix="%" />
          </div>
        </Section>

        {/* Wellbeing Policy Details */}
        <Section title="Wellbeing Policy">
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Wellbeing Strategy", value: data.wellbeingPolicy.staffWellbeingStrategy },
              { label: "Burnout Prevention", value: data.wellbeingPolicy.burnoutPreventionPlan },
              { label: "Supervision Framework", value: data.wellbeingPolicy.supervisionFramework },
              { label: "Workload Management", value: data.wellbeingPolicy.workloadManagementPolicy },
              { label: "Employee Assistance", value: data.wellbeingPolicy.employeeAssistanceProgramme },
              { label: "Peer Support Network", value: data.wellbeingPolicy.peerSupportNetwork },
              { label: "Regular Review", value: data.wellbeingPolicy.regularReview },
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

        {/* Staff Resilience Readiness Details */}
        <Section title="Staff Resilience Readiness">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
            <Stat label="Stress Management" value={data.staffResilienceReadiness.stressManagementRate} suffix="%" />
            <Stat label="Emotional Resilience" value={data.staffResilienceReadiness.emotionalResilienceRate} suffix="%" />
            <Stat label="Boundary Maintenance" value={data.staffResilienceReadiness.boundaryMaintenanceRate} suffix="%" />
            <Stat label="Self-Care" value={data.staffResilienceReadiness.selfCareRate} suffix="%" />
            <Stat label="Team Support" value={data.staffResilienceReadiness.teamSupportRate} suffix="%" />
            <Stat label="Debriefing Skills" value={data.staffResilienceReadiness.debriefingSkillsRate} suffix="%" />
          </div>
          <Stat label="Total Staff" value={data.staffResilienceReadiness.totalStaff} />
        </Section>

        {/* Staff Profiles */}
        <Section title="Staff Wellbeing Profiles">
          {data.staffProfiles.length > 0 ? (
            <div className="space-y-2">
              {data.staffProfiles.map((profile) => {
                const scoreColor =
                  profile.score >= 8
                    ? "bg-green-100 text-green-700"
                    : profile.score >= 5
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-700";

                return (
                  <div
                    key={profile.staffId}
                    className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                  >
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-sm">{profile.staffName}</span>
                      <div className="flex gap-3 text-[10px] text-gray-400 mt-0.5">
                        <span>{profile.totalAssessments} assessments</span>
                        <span>{formatRate(profile.wellbeingRate)} wellbeing</span>
                        <span>{formatRate(profile.stressManagedRate)} stress managed</span>
                        <span>{profile.uniqueTypes} types</span>
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
            <p className="text-xs text-gray-500 text-center py-2">No staff profiles available</p>
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
                <li key={i} className={`text-xs flex items-start gap-1.5 ${action.startsWith("URGENT") ? "text-red-700" : "text-gray-700"}`}>
                  <span className="mt-0.5 shrink-0">
                    {action.startsWith("URGENT") ? "●" : "▪"}
                  </span>
                  <span>
                    {action.startsWith("URGENT") ? (
                      <>
                        <span className="font-bold text-red-700">URGENT</span>
                        {action.slice(6)}
                      </>
                    ) : (
                      action
                    )}
                  </span>
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

"use client";

// ══════════════════════════════════════════════════════════════════════════════
// HOMEWORK & STUDY SUPPORT DASHBOARD WIDGET
//
// Displays the 4-layer homework & study support intelligence:
// - Overall score with rating
// - Layer scores: quality, compliance, policy, staff readiness
// - Child profiles
// - Strengths, areas for improvement, and actions
// - Regulatory references
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";

// ── Local interfaces (mirrors API shape) ──────────────────────────────────

interface QualityData {
  overallScore: number;
  totalSessions: number;
  engagementRate: number;
  progressRate: number;
  confidenceRate: number;
  resourceRate: number;
}

interface ComplianceData {
  overallScore: number;
  documentedRate: number;
  staffSupportedRate: number;
  feedbackRate: number;
  activityDiversityRatio: number;
}

interface PolicyData {
  overallScore: number;
  homeworkSupportStrategy: boolean;
  quietStudySpaceProvision: boolean;
  educationalResourcePlan: boolean;
  tutoringArrangementFramework: boolean;
  schoolLiaisonProtocol: boolean;
  examSupportGuidance: boolean;
  regularReview: boolean;
}

interface StaffReadinessData {
  overallScore: number;
  educationalSupportRate: number;
  studySkillsCoachingRate: number;
  motivationalTechniquesRate: number;
  senAwarenessRate: number;
  schoolLiaisonRate: number;
  resourceManagementRate: number;
}

interface ChildProfileData {
  childId: string;
  childName: string;
  totalSessions: number;
  engagementRate: number;
  progressRate: number;
  overallScore: number;
}

interface HomeworkStudySupportData {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: string;
  quality: QualityData;
  compliance: ComplianceData;
  policy: PolicyData;
  staffReadiness: StaffReadinessData;
  childProfiles: ChildProfileData[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
  meta?: {
    sessionSummary: {
      id: string;
      childName: string;
      date: string;
      activityType: string;
      engagement: string;
      progressNoted: boolean;
    }[];
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

export default function HomeworkStudySupportDashboardWidget() {
  const [data, setData] = useState<HomeworkStudySupportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/homework-study-support");
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
        <h3 className="font-semibold text-red-800">Homework & Study Support</h3>
        <p className="text-sm text-red-600 mt-1">{error}</p>
      </div>
    );
  }

  // Null guard
  if (!data) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="font-semibold text-gray-800">Homework & Study Support</h3>
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
            Homework & Study Support
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {data.periodStart} to {data.periodEnd} | {data.quality.totalSessions} sessions | {data.staffReadiness.educationalSupportRate}% staff trained
          </p>
        </div>
        <div className={`rounded-lg border px-4 py-3 text-center ${ratingColor}`}>
          <div className="text-3xl font-bold">{data.overallScore}</div>
          <div className="text-sm font-medium mt-1">{ratingLabel}</div>
        </div>
      </div>

      {/* Score Bars */}
      <div className="mb-4">
        <ScoreBar label="Quality" score={data.quality.overallScore} />
        <ScoreBar label="Compliance" score={data.compliance.overallScore} />
        <ScoreBar label="Policy" score={data.policy.overallScore} />
        <ScoreBar label="Staff Readiness" score={data.staffReadiness.overallScore} />
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-4">
        <Stat label="Engagement" value={data.quality.engagementRate} suffix="%" />
        <Stat label="Progress" value={data.quality.progressRate} suffix="%" />
        <Stat label="Confidence" value={data.quality.confidenceRate} suffix="%" />
        <Stat label="Documented" value={data.compliance.documentedRate} suffix="%" />
        <Stat label="Staff Support" value={data.compliance.staffSupportedRate} suffix="%" />
        <Stat label="Feedback" value={data.compliance.feedbackRate} suffix="%" />
      </div>

      {/* Actions */}
      {data.actions.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <h4 className="text-sm font-semibold text-red-800 mb-2">Actions Required</h4>
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
        </div>
      )}

      {/* Collapsible Sections */}
      <div className="space-y-3">
        {/* Quality Detail */}
        <Section title="Quality">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <Stat label="Engagement" value={data.quality.engagementRate} suffix="%" />
            <Stat label="Progress" value={data.quality.progressRate} suffix="%" />
            <Stat label="Confidence" value={data.quality.confidenceRate} suffix="%" />
            <Stat label="Resources" value={data.quality.resourceRate} suffix="%" />
            <Stat label="Total Sessions" value={data.quality.totalSessions} />
          </div>
        </Section>

        {/* Compliance Detail */}
        <Section title="Compliance">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Stat label="Documented" value={data.compliance.documentedRate} suffix="%" />
            <Stat label="Staff Support" value={data.compliance.staffSupportedRate} suffix="%" />
            <Stat label="Feedback" value={data.compliance.feedbackRate} suffix="%" />
            <Stat label="Activity Diversity" value={data.compliance.activityDiversityRatio} suffix="%" />
          </div>
        </Section>

        {/* Policy Detail */}
        <Section title="Policy">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { label: "Homework Strategy", value: data.policy.homeworkSupportStrategy },
              { label: "Quiet Spaces", value: data.policy.quietStudySpaceProvision },
              { label: "Resource Plan", value: data.policy.educationalResourcePlan },
              { label: "Tutoring Framework", value: data.policy.tutoringArrangementFramework },
              { label: "School Liaison", value: data.policy.schoolLiaisonProtocol },
              { label: "Exam Guidance", value: data.policy.examSupportGuidance },
              { label: "Regular Review", value: data.policy.regularReview },
            ].map((item) => (
              <div
                key={item.label}
                className={`p-2 rounded-lg text-center text-xs font-medium ${
                  item.value
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {item.value ? "Yes" : "No"} — {item.label}
              </div>
            ))}
          </div>
        </Section>

        {/* Staff Readiness Detail */}
        <Section title="Staff Readiness">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <Stat label="Educational Support" value={data.staffReadiness.educationalSupportRate} suffix="%" />
            <Stat label="Study Skills" value={data.staffReadiness.studySkillsCoachingRate} suffix="%" />
            <Stat label="Motivation" value={data.staffReadiness.motivationalTechniquesRate} suffix="%" />
            <Stat label="SEN Awareness" value={data.staffReadiness.senAwarenessRate} suffix="%" />
            <Stat label="School Liaison" value={data.staffReadiness.schoolLiaisonRate} suffix="%" />
            <Stat label="Resources" value={data.staffReadiness.resourceManagementRate} suffix="%" />
          </div>
        </Section>

        {/* Child Profiles */}
        <Section title="Child Profiles">
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
                      <span className="font-medium text-sm">{profile.childName}</span>
                      <div className="flex gap-3 text-[10px] text-gray-400 mt-0.5">
                        <span>{profile.totalSessions} sessions</span>
                        <span>{profile.engagementRate}% engagement</span>
                        <span>{profile.progressRate}% progress</span>
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
        </Section>

        {/* Session Summary */}
        {data.meta?.sessionSummary && (
          <Section title="Session Log">
            <div className="bg-gray-50 rounded-lg p-3">
              {data.meta.sessionSummary.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="font-medium text-sm truncate">{s.childName}</span>
                    <span className="text-xs text-gray-400">{s.activityType}</span>
                    <span className="text-xs text-gray-400">{s.date}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-gray-500">{s.engagement}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded ${
                        s.progressNoted
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {s.progressNoted ? "Progress" : "No Progress"}
                    </span>
                  </div>
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
                <li key={i} className="text-xs text-green-700">+ {s}</li>
              ))}
            </ul>
          </Section>
        )}

        {/* Areas for Improvement */}
        {data.areasForImprovement.length > 0 && (
          <Section title="Areas for Improvement">
            <ul className="space-y-1">
              {data.areasForImprovement.map((a, i) => (
                <li key={i} className="text-xs text-orange-700">- {a}</li>
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

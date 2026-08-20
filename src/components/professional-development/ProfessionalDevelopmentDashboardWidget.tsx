"use client";

import React, { useEffect, useState } from "react";
import type {
  ProfessionalDevelopmentIntelligence,
  StaffDevelopmentProfile,
} from "@/lib/professional-development/professional-development-engine";
import {
  getCPDCategoryLabel,
  getQualificationLevelLabel,
} from "@/lib/professional-development/professional-development-engine";

// ── Rating Badge ─────────────────────────────────────────────────────────────

function RatingBadge({ rating, score }: { rating: string; score: number }) {
  const colorMap: Record<string, string> = {
    outstanding: "bg-green-100 text-green-800 border-green-300",
    good: "bg-blue-100 text-blue-800 border-blue-300",
    requires_improvement: "bg-amber-100 text-amber-800 border-amber-300",
    inadequate: "bg-red-100 text-red-800 border-red-300",
  };
  const labelMap: Record<string, string> = {
    outstanding: "Outstanding",
    good: "Good",
    requires_improvement: "Requires Improvement",
    inadequate: "Inadequate",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm font-semibold ${colorMap[rating] ?? "bg-gray-100 text-gray-800 border-gray-300"}`}>
      {labelMap[rating] ?? rating} — {score}/100
    </span>
  );
}

// ── Metric Card ──────────────────────────────────────────────────────────────

function MetricCard({ label, value, suffix, color }: { label: string; value: number | string | null; suffix?: string; color?: string }) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
      <span className={`text-2xl font-bold ${color ?? "text-gray-900"}`}>
        {value ?? "—"}{value !== null ? suffix : ""}
      </span>
      <span className="mt-1 text-xs text-gray-500 text-center">{label}</span>
    </div>
  );
}

// ── Score Bar ────────────────────────────────────────────────────────────────

function ScoreBar({ label, score, max, color }: { label: string; score: number; max: number; color: string }) {
  const pctVal = max > 0 ? Math.round((score / max) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-gray-700 font-medium">{label}</span>
        <span className="text-gray-500">{score}/{max}</span>
      </div>
      <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pctVal}%` }} />
      </div>
    </div>
  );
}

// ── Staff Profile Card ───────────────────────────────────────────────────────

function StaffProfileCard({ profile }: { profile: StaffDevelopmentProfile }) {
  const scoreColor = profile.overallScore >= 8 ? "text-green-600"
    : profile.overallScore >= 5 ? "text-blue-600"
    : profile.overallScore >= 3 ? "text-amber-600"
    : "text-red-600";

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="font-semibold text-gray-900">{profile.staffName}</h4>
          <span className="text-xs text-gray-500">{profile.totalCPDHours}h CPD</span>
        </div>
        <span className={`text-lg font-bold ${scoreColor}`}>{profile.overallScore}/10</span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t">
        <div>
          <span className="text-lg font-bold text-gray-900">{profile.qualificationsCompleted}</span>
          <p className="text-xs text-gray-500">Completed</p>
        </div>
        <div>
          <span className="text-lg font-bold text-gray-900">{profile.qualificationsInProgress}</span>
          <p className="text-xs text-gray-500">In Progress</p>
        </div>
        <div>
          <span className="text-lg font-bold text-gray-900">{profile.impactAssessmentRate}%</span>
          <p className="text-xs text-gray-500">Impact Assessed</p>
        </div>
      </div>
      {profile.hasOverdueQualification && (
        <div className="mt-2">
          <span className="rounded-full bg-red-100 text-red-700 px-2 py-0.5 text-xs font-medium border border-red-200">
            OVERDUE QUALIFICATION
          </span>
        </div>
      )}
    </div>
  );
}

// ── Main Widget ──────────────────────────────────────────────────────────────

export function ProfessionalDevelopmentDashboardWidget() {
  const [data, setData] = useState<ProfessionalDevelopmentIntelligence | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/professional-development")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse rounded-xl border border-gray-200 bg-white p-6">
        <div className="h-6 w-64 rounded bg-gray-200 mb-4" />
        <div className="grid grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 rounded-lg bg-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <h3 className="font-semibold text-red-800">Professional Development Intelligence</h3>
        <p className="mt-2 text-sm text-red-600">Failed to load: {error}</p>
      </div>
    );
  }

  const toggle = (section: string) =>
    setExpandedSection((prev) => (prev === section ? null : section));

  return (
    <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-lg font-bold text-gray-900">
            Professional Development Intelligence
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            {data.periodStart} to {data.periodEnd} · CHR 2015 Reg 33 / NMS 19
          </p>
        </div>
        <RatingBadge rating={data.rating} score={data.overallScore} />
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <MetricCard
          label="Total CPD Hours"
          value={data.cpdQuality.totalHours}
          suffix="h"
          color="text-blue-600"
        />
        <MetricCard
          label="Qualifications In Progress"
          value={data.qualificationProgress.totalQualifications - data.qualificationProgress.overdueCount > 0
            ? Math.round((data.qualificationProgress.inProgressRate / 100) * data.qualificationProgress.totalQualifications)
            : 0}
          color="text-indigo-600"
        />
        <MetricCard
          label="Avg Hours/Staff"
          value={data.cpdQuality.averageHoursPerStaff}
          suffix="h"
          color={(data.cpdQuality.averageHoursPerStaff ?? 0) >= 30 ? "text-green-600" : "text-amber-600"}
        />
        <MetricCard
          label="Overdue Qualifications"
          value={data.qualificationProgress.overdueCount}
          color={data.qualificationProgress.overdueCount === 0 ? "text-green-600" : "text-red-600"}
        />
      </div>

      {/* Score Bars — 4 Sub-domains */}
      <div className="space-y-3 mb-5">
        <ScoreBar label="CPD Quality" score={data.cpdQuality.overallScore} max={25} color="bg-blue-500" />
        <ScoreBar label="Qualification Progress" score={data.qualificationProgress.overallScore} max={25} color="bg-indigo-500" />
        <ScoreBar label="Supervision Development" score={data.supervisionDevelopment.overallScore} max={25} color="bg-purple-500" />
        <ScoreBar label="Learning Culture" score={data.learningCulture.overallScore} max={25} color="bg-teal-500" />
      </div>

      {/* Staff Profiles */}
      <div className="mb-5">
        <button
          onClick={() => toggle("staff")}
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
        >
          <span className={`transform transition-transform ${expandedSection === "staff" ? "rotate-90" : ""}`}>&#9654;</span>
          Staff Development Profiles ({data.staffProfiles.length})
        </button>
        {expandedSection === "staff" && (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.staffProfiles.map((profile) => (
              <StaffProfileCard key={profile.staffId} profile={profile} />
            ))}
          </div>
        )}
      </div>

      {/* CPD Quality */}
      <div className="mb-5">
        <button
          onClick={() => toggle("cpd")}
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
        >
          <span className={`transform transition-transform ${expandedSection === "cpd" ? "rotate-90" : ""}`}>&#9654;</span>
          CPD Quality Detail
        </button>
        {expandedSection === "cpd" && (
          <div className="mt-3 rounded-lg border border-gray-200 bg-white p-4 space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div>
                <span className="text-lg font-bold text-gray-900">{data.cpdQuality.impactAssessedRate}%</span>
                <p className="text-xs text-gray-500">Impact Assessed</p>
              </div>
              <div>
                <span className="text-lg font-bold text-gray-900">{data.cpdQuality.positiveImpactRate}%</span>
                <p className="text-xs text-gray-500">Positive Impact</p>
              </div>
              <div>
                <span className="text-lg font-bold text-gray-900">{data.cpdQuality.sharedWithTeamRate}%</span>
                <p className="text-xs text-gray-500">Shared with Team</p>
              </div>
              <div>
                <span className="text-lg font-bold text-gray-900">{data.cpdQuality.relevantToRoleRate}%</span>
                <p className="text-xs text-gray-500">Role Relevant</p>
              </div>
            </div>
            <div className="pt-3 border-t">
              <h5 className="text-xs font-semibold text-gray-500 mb-2 uppercase">Category Distribution</h5>
              <div className="flex flex-wrap gap-2">
                {Object.entries(data.cpdQuality.categoryDistribution)
                  .filter(([, count]) => count > 0)
                  .sort(([, a], [, b]) => b - a)
                  .map(([cat, count]) => (
                    <span key={cat} className="rounded-full bg-gray-100 text-gray-700 px-2 py-0.5 text-xs border border-gray-200">
                      {getCPDCategoryLabel(cat as Parameters<typeof getCPDCategoryLabel>[0])} ({count})
                    </span>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Qualification Progress */}
      <div className="mb-5">
        <button
          onClick={() => toggle("quals")}
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
        >
          <span className={`transform transition-transform ${expandedSection === "quals" ? "rotate-90" : ""}`}>&#9654;</span>
          Qualification Progress
        </button>
        {expandedSection === "quals" && (
          <div className="mt-3 rounded-lg border border-gray-200 bg-white p-4 space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div>
                <span className="text-lg font-bold text-green-600">{data.qualificationProgress.completedRate}%</span>
                <p className="text-xs text-gray-500">Completed</p>
              </div>
              <div>
                <span className="text-lg font-bold text-blue-600">{data.qualificationProgress.inProgressRate}%</span>
                <p className="text-xs text-gray-500">In Progress</p>
              </div>
              <div>
                <span className="text-lg font-bold text-indigo-600">{data.qualificationProgress.fundedRate}%</span>
                <p className="text-xs text-gray-500">Employer Funded</p>
              </div>
              <div>
                <span className="text-lg font-bold text-purple-600">{data.qualificationProgress.supportRate}%</span>
                <p className="text-xs text-gray-500">Support Provided</p>
              </div>
            </div>
            <div className="pt-3 border-t">
              <h5 className="text-xs font-semibold text-gray-500 mb-2 uppercase">Level Distribution</h5>
              <div className="flex flex-wrap gap-2">
                {Object.entries(data.qualificationProgress.levelDistribution)
                  .filter(([, count]) => count > 0)
                  .map(([level, count]) => (
                    <span key={level} className="rounded-full bg-indigo-50 text-indigo-700 px-2 py-0.5 text-xs border border-indigo-200">
                      {getQualificationLevelLabel(level as Parameters<typeof getQualificationLevelLabel>[0])} ({count})
                    </span>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Supervision Development */}
      <div className="mb-5">
        <button
          onClick={() => toggle("supervision")}
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
        >
          <span className={`transform transition-transform ${expandedSection === "supervision" ? "rotate-90" : ""}`}>&#9654;</span>
          Supervision Development
        </button>
        {expandedSection === "supervision" && (
          <div className="mt-3 rounded-lg border border-gray-200 bg-white p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-center">
              <div>
                <span className="text-lg font-bold text-gray-900">{data.supervisionDevelopment.goalsSetRate}%</span>
                <p className="text-xs text-gray-500">Goals Set</p>
              </div>
              <div>
                <span className="text-lg font-bold text-gray-900">{data.supervisionDevelopment.progressReviewedRate}%</span>
                <p className="text-xs text-gray-500">Progress Reviewed</p>
              </div>
              <div>
                <span className="text-lg font-bold text-gray-900">{data.supervisionDevelopment.trainingNeedsRate}%</span>
                <p className="text-xs text-gray-500">Training Needs Identified</p>
              </div>
              <div>
                <span className="text-lg font-bold text-gray-900">{data.supervisionDevelopment.actionPlanRate}%</span>
                <p className="text-xs text-gray-500">Action Plans Created</p>
              </div>
              <div>
                <span className="text-lg font-bold text-gray-900">{data.supervisionDevelopment.actionsCompletedRate}%</span>
                <p className="text-xs text-gray-500">Actions Completed</p>
              </div>
              <div>
                <span className="text-lg font-bold text-gray-900">{data.supervisionDevelopment.totalSupervisions}</span>
                <p className="text-xs text-gray-500">Total Sessions</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Learning Culture */}
      <div className="mb-5">
        <button
          onClick={() => toggle("culture")}
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
        >
          <span className={`transform transition-transform ${expandedSection === "culture" ? "rotate-90" : ""}`}>&#9654;</span>
          Learning Culture
        </button>
        {expandedSection === "culture" && (
          <div className="mt-3 rounded-lg border border-gray-200 bg-white p-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Team Meetings", value: data.learningCulture.teamMeetingRate },
                { label: "Shared Learning", value: data.learningCulture.sharedLearningRate },
                { label: "Reflective Practice", value: data.learningCulture.reflectiveRate },
                { label: "Feedback Culture", value: data.learningCulture.feedbackCultureRate },
                { label: "Innovation", value: data.learningCulture.innovationRate },
                { label: "Budget Allocated", value: data.learningCulture.budgetRate },
                { label: "Induction", value: data.learningCulture.inductionRate },
              ].map((item) => (
                <div key={item.label} className="text-center py-2">
                  <span className={`text-lg font-bold ${item.value >= 80 ? "text-green-600" : item.value >= 50 ? "text-amber-600" : "text-red-600"}`}>
                    {item.value}%
                  </span>
                  <p className="text-xs text-gray-500">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Strengths / Areas / Actions */}
      <div className="mb-5">
        <button
          onClick={() => toggle("analysis")}
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
        >
          <span className={`transform transition-transform ${expandedSection === "analysis" ? "rotate-90" : ""}`}>&#9654;</span>
          Strengths, Areas & Actions
        </button>
        {expandedSection === "analysis" && (
          <div className="mt-3 space-y-3">
            {data.actions.length > 0 && !data.actions[0].includes("No immediate") && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <h4 className="text-sm font-semibold text-red-800 mb-2">Immediate Actions</h4>
                <ul className="space-y-1">
                  {data.actions.map((action, i) => (
                    <li key={i} className="text-sm text-red-700">&#8226; {action}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <h4 className="text-sm font-semibold text-green-800 mb-2">Strengths</h4>
              <ul className="space-y-1">
                {data.strengths.map((s, i) => (
                  <li key={i} className="text-sm text-green-700">&#8226; {s}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <h4 className="text-sm font-semibold text-amber-800 mb-2">Areas for Improvement</h4>
              <ul className="space-y-1">
                {data.areasForImprovement.map((a, i) => (
                  <li key={i} className="text-sm text-amber-700">&#8226; {a}</li>
                ))}
              </ul>
            </div>

            {data.actions.length > 0 && data.actions[0].includes("No immediate") && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <h4 className="text-sm font-semibold text-green-800 mb-2">Actions</h4>
                <ul className="space-y-1">
                  {data.actions.map((action, i) => (
                    <li key={i} className="text-sm text-green-700">&#8226; {action}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Regulatory Framework */}
      <div>
        <button
          onClick={() => toggle("regulatory")}
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
        >
          <span className={`transform transition-transform ${expandedSection === "regulatory" ? "rotate-90" : ""}`}>&#9654;</span>
          Regulatory Framework
        </button>
        {expandedSection === "regulatory" && (
          <div className="mt-3 rounded-lg border border-gray-200 bg-white p-4">
            <ul className="space-y-1">
              {data.regulatoryLinks.map((link, i) => (
                <li key={i} className="text-xs text-gray-600">&#8226; {link}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

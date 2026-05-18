"use client";

import React, { useEffect, useState } from "react";
import type {
  ReligiousSpiritualSupportIntelligence,
  ChildFaithProfileResult,
} from "@/lib/religious-spiritual-support/religious-spiritual-support-engine";
import {
  getFaithBackgroundLabel,
  getChildPreferenceLabel,
  getRatingLabel,
} from "@/lib/religious-spiritual-support/religious-spiritual-support-engine";

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
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm font-semibold ${colorMap[rating] ?? "bg-gray-100 text-gray-800 border-gray-300"}`}
    >
      {labelMap[rating] ?? rating} — {score}/100
    </span>
  );
}

// ── Metric Card ──────────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  suffix,
  color,
}: {
  label: string;
  value: number | string;
  suffix?: string;
  color?: string;
}) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
      <span className={`text-2xl font-bold ${color ?? "text-gray-900"}`}>
        {value}
        {suffix}
      </span>
      <span className="mt-1 text-xs text-gray-500 text-center">{label}</span>
    </div>
  );
}

// ── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({
  value,
  max,
  color,
}: {
  value: number;
  max: number;
  color: string;
}) {
  const pctVal = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${pctVal}%` }}
        />
      </div>
      <span className="text-xs font-medium text-gray-600 w-10 text-right">
        {pctVal}%
      </span>
    </div>
  );
}

// ── Child Faith Profile Card ─────────────────────────────────────────────────

function ChildProfileCard({ profile }: { profile: ChildFaithProfileResult }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="font-semibold text-gray-900">{profile.childName}</h4>
          <span className="text-xs text-gray-500">
            {getFaithBackgroundLabel(profile.faithBackground)} —{" "}
            {getChildPreferenceLabel(profile.childPreference)}
          </span>
        </div>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-semibold border ${
            profile.overallScore >= 8
              ? "bg-green-100 text-green-700 border-green-200"
              : profile.overallScore >= 5
                ? "bg-blue-100 text-blue-700 border-blue-200"
                : "bg-amber-100 text-amber-700 border-amber-200"
          }`}
        >
          {profile.overallScore}/10
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-center pt-2 border-t">
        <div>
          <span className="text-lg font-bold text-gray-900">
            {profile.needsAssessed ? "Yes" : "No"}
          </span>
          <p className="text-xs text-gray-500">Assessed</p>
        </div>
        <div>
          <span className="text-lg font-bold text-gray-900">
            {profile.supportPlanInPlace ? "Yes" : "No"}
          </span>
          <p className="text-xs text-gray-500">Support Plan</p>
        </div>
        <div>
          <span className="text-lg font-bold text-gray-900">
            {profile.activitiesCount}
          </span>
          <p className="text-xs text-gray-500">Activities</p>
        </div>
        <div>
          <span className="text-lg font-bold text-gray-900">
            {profile.festivalsCount}
          </span>
          <p className="text-xs text-gray-500">Festivals</p>
        </div>
      </div>
    </div>
  );
}

// ── Main Widget ──────────────────────────────────────────────────────────────

export function ReligiousSpiritualSupportDashboardWidget() {
  const [data, setData] =
    useState<ReligiousSpiritualSupportIntelligence | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/religious-spiritual-support")
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
        <div className="h-6 w-48 rounded bg-gray-200 mb-4" />
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
        <h3 className="font-semibold text-red-800">
          Religious & Spiritual Support Intelligence
        </h3>
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
            Religious & Spiritual Support
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            {data.periodStart} to {data.periodEnd} · CHR 2015 Reg 10 / UNCRC
            Art 14
          </p>
        </div>
        <RatingBadge rating={data.rating} score={data.overallScore} />
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <MetricCard
          label="Overall Score"
          value={data.overallScore}
          suffix="/100"
          color={
            data.overallScore >= 80
              ? "text-green-600"
              : data.overallScore >= 60
                ? "text-blue-600"
                : data.overallScore >= 40
                  ? "text-amber-600"
                  : "text-red-600"
          }
        />
        <MetricCard
          label="Needs Assessment"
          value={data.needsAssessment.overallScore}
          suffix="/25"
          color={
            data.needsAssessment.overallScore >= 20
              ? "text-green-600"
              : data.needsAssessment.overallScore >= 15
                ? "text-blue-600"
                : "text-amber-600"
          }
        />
        <MetricCard
          label="Support Provision"
          value={data.supportProvision.overallScore}
          suffix="/25"
          color={
            data.supportProvision.overallScore >= 20
              ? "text-green-600"
              : data.supportProvision.overallScore >= 15
                ? "text-blue-600"
                : "text-amber-600"
          }
        />
        <MetricCard
          label="Staff Competence"
          value={data.staffCompetence.overallScore}
          suffix="/25"
          color={
            data.staffCompetence.overallScore >= 20
              ? "text-green-600"
              : data.staffCompetence.overallScore >= 15
                ? "text-blue-600"
                : "text-amber-600"
          }
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <MetricCard
          label="Needs Assessed"
          value={data.needsAssessment.needsAssessedRate}
          suffix="%"
          color={
            data.needsAssessment.needsAssessedRate >= 90
              ? "text-green-600"
              : "text-amber-600"
          }
        />
        <MetricCard
          label="Quality Rate"
          value={data.supportProvision.excellentGoodRate}
          suffix="%"
          color={
            data.supportProvision.excellentGoodRate >= 80
              ? "text-green-600"
              : "text-amber-600"
          }
        />
        <MetricCard
          label="Festival Inclusion"
          value={data.festivalInclusion.overallScore}
          suffix="/25"
          color={
            data.festivalInclusion.overallScore >= 20
              ? "text-green-600"
              : data.festivalInclusion.overallScore >= 15
                ? "text-blue-600"
                : "text-amber-600"
          }
        />
        <MetricCard
          label="Faith Awareness"
          value={data.staffCompetence.faithAwarenessRate}
          suffix="%"
          color={
            data.staffCompetence.faithAwarenessRate >= 90
              ? "text-green-600"
              : "text-amber-600"
          }
        />
      </div>

      {/* Status Badges */}
      <div className="flex flex-wrap gap-2 mb-5">
        {data.needsAssessment.needsAssessedRate >= 90 && (
          <span className="rounded-full bg-green-100 text-green-700 px-3 py-1 text-xs font-medium border border-green-200">
            ALL NEEDS ASSESSED
          </span>
        )}
        {data.supportProvision.excellentGoodRate >= 80 && (
          <span className="rounded-full bg-green-100 text-green-700 px-3 py-1 text-xs font-medium border border-green-200">
            HIGH QUALITY SUPPORT
          </span>
        )}
        {data.festivalInclusion.observedRate >= 90 &&
          data.festivalInclusion.totalFestivals > 0 && (
            <span className="rounded-full bg-green-100 text-green-700 px-3 py-1 text-xs font-medium border border-green-200">
              FESTIVALS CELEBRATED
            </span>
          )}
        {data.staffCompetence.faithAwarenessRate >= 90 && (
          <span className="rounded-full bg-green-100 text-green-700 px-3 py-1 text-xs font-medium border border-green-200">
            FAITH AWARE TEAM
          </span>
        )}
        {data.needsAssessment.reviewCurrentRate < 70 &&
          data.needsAssessment.totalProfiles > 0 && (
            <span className="rounded-full bg-red-100 text-red-700 px-3 py-1 text-xs font-medium border border-red-200">
              REVIEWS OVERDUE
            </span>
          )}
        {data.staffCompetence.overallCompetenceRate < 50 &&
          data.staffCompetence.totalStaff > 0 && (
            <span className="rounded-full bg-amber-100 text-amber-700 px-3 py-1 text-xs font-medium border border-amber-200">
              STAFF TRAINING NEEDED
            </span>
          )}
      </div>

      {/* Child Faith Profiles */}
      <div className="mb-5">
        <button
          onClick={() => toggle("profiles")}
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
        >
          <span
            className={`transform transition-transform ${expandedSection === "profiles" ? "rotate-90" : ""}`}
          >
            &#9654;
          </span>
          Child Faith Profiles ({data.childProfiles.length})
        </button>
        {expandedSection === "profiles" && (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.childProfiles.map((profile) => (
              <ChildProfileCard key={profile.childId} profile={profile} />
            ))}
          </div>
        )}
      </div>

      {/* Needs Assessment Detail */}
      <div className="mb-5">
        <button
          onClick={() => toggle("needs")}
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
        >
          <span
            className={`transform transition-transform ${expandedSection === "needs" ? "rotate-90" : ""}`}
          >
            &#9654;
          </span>
          Needs Assessment Detail
        </button>
        {expandedSection === "needs" && (
          <div className="mt-3 rounded-lg border border-gray-200 bg-white p-4 space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">Needs Assessed</span>
                <span className="font-medium">
                  {data.needsAssessment.needsAssessedRate}%
                </span>
              </div>
              <ProgressBar
                value={data.needsAssessment.needsAssessedRate}
                max={100}
                color="bg-blue-500"
              />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">Needs Documented</span>
                <span className="font-medium">
                  {data.needsAssessment.needsDocumentedRate}%
                </span>
              </div>
              <ProgressBar
                value={data.needsAssessment.needsDocumentedRate}
                max={100}
                color="bg-blue-500"
              />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">Support Plans in Place</span>
                <span className="font-medium">
                  {data.needsAssessment.supportPlanRate}%
                </span>
              </div>
              <ProgressBar
                value={data.needsAssessment.supportPlanRate}
                max={100}
                color={
                  data.needsAssessment.supportPlanRate >= 90
                    ? "bg-green-500"
                    : "bg-amber-500"
                }
              />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">Reviews Current</span>
                <span className="font-medium">
                  {data.needsAssessment.reviewCurrentRate}%
                </span>
              </div>
              <ProgressBar
                value={data.needsAssessment.reviewCurrentRate}
                max={100}
                color={
                  data.needsAssessment.reviewCurrentRate >= 90
                    ? "bg-green-500"
                    : "bg-amber-500"
                }
              />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">Preference Recorded</span>
                <span className="font-medium">
                  {data.needsAssessment.preferenceRecordedRate}%
                </span>
              </div>
              <ProgressBar
                value={data.needsAssessment.preferenceRecordedRate}
                max={100}
                color="bg-blue-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Support Provision Detail */}
      <div className="mb-5">
        <button
          onClick={() => toggle("support")}
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
        >
          <span
            className={`transform transition-transform ${expandedSection === "support" ? "rotate-90" : ""}`}
          >
            &#9654;
          </span>
          Support Provision Detail
        </button>
        {expandedSection === "support" && (
          <div className="mt-3 rounded-lg border border-gray-200 bg-white p-4 space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">Excellent/Good Quality</span>
                <span className="font-medium">
                  {data.supportProvision.excellentGoodRate}%
                </span>
              </div>
              <ProgressBar
                value={data.supportProvision.excellentGoodRate}
                max={100}
                color="bg-blue-500"
              />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">Child Initiated</span>
                <span className="font-medium">
                  {data.supportProvision.childInitiatedRate}%
                </span>
              </div>
              <ProgressBar
                value={data.supportProvision.childInitiatedRate}
                max={100}
                color="bg-blue-500"
              />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">Positive Feedback</span>
                <span className="font-medium">
                  {data.supportProvision.positiveFeedbackRate}%
                </span>
              </div>
              <ProgressBar
                value={data.supportProvision.positiveFeedbackRate}
                max={100}
                color="bg-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div>
                <span className="text-lg font-bold text-gray-900">
                  {data.supportProvision.supportTypeVariety}
                </span>
                <p className="text-xs text-gray-500">Support Types</p>
              </div>
              <div>
                <span className="text-lg font-bold text-gray-900">
                  {data.supportProvision.totalActivities}
                </span>
                <p className="text-xs text-gray-500">Total Activities</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Festival Inclusion Detail */}
      <div className="mb-5">
        <button
          onClick={() => toggle("festivals")}
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
        >
          <span
            className={`transform transition-transform ${expandedSection === "festivals" ? "rotate-90" : ""}`}
          >
            &#9654;
          </span>
          Festival Inclusion Detail
        </button>
        {expandedSection === "festivals" && (
          <div className="mt-3 rounded-lg border border-gray-200 bg-white p-4 space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">Observed Rate</span>
                <span className="font-medium">
                  {data.festivalInclusion.observedRate}%
                </span>
              </div>
              <ProgressBar
                value={data.festivalInclusion.observedRate}
                max={100}
                color={
                  data.festivalInclusion.observedRate >= 90
                    ? "bg-green-500"
                    : "bg-amber-500"
                }
              />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">Child Involved</span>
                <span className="font-medium">
                  {data.festivalInclusion.childInvolvedRate}%
                </span>
              </div>
              <ProgressBar
                value={data.festivalInclusion.childInvolvedRate}
                max={100}
                color="bg-blue-500"
              />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">Culturally Appropriate</span>
                <span className="font-medium">
                  {data.festivalInclusion.culturallyAppropriateRate}%
                </span>
              </div>
              <ProgressBar
                value={data.festivalInclusion.culturallyAppropriateRate}
                max={100}
                color="bg-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div>
                <span className="text-lg font-bold text-gray-900">
                  {data.festivalInclusion.totalFestivals}
                </span>
                <p className="text-xs text-gray-500">Total Festivals</p>
              </div>
              <div>
                <span className="text-lg font-bold text-gray-900">
                  {data.festivalInclusion.childrenCoveredRate}%
                </span>
                <p className="text-xs text-gray-500">Children Covered</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Staff Competence Detail */}
      <div className="mb-5">
        <button
          onClick={() => toggle("staff")}
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
        >
          <span
            className={`transform transition-transform ${expandedSection === "staff" ? "rotate-90" : ""}`}
          >
            &#9654;
          </span>
          Staff Diversity Training
        </button>
        {expandedSection === "staff" && (
          <div className="mt-3 rounded-lg border border-gray-200 bg-white p-4 space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">Faith Awareness</span>
                <span className="font-medium">
                  {data.staffCompetence.faithAwarenessRate}%
                </span>
              </div>
              <ProgressBar
                value={data.staffCompetence.faithAwarenessRate}
                max={100}
                color="bg-blue-500"
              />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">Cultural Competence</span>
                <span className="font-medium">
                  {data.staffCompetence.culturalCompetenceRate}%
                </span>
              </div>
              <ProgressBar
                value={data.staffCompetence.culturalCompetenceRate}
                max={100}
                color="bg-blue-500"
              />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">Anti-Discrimination</span>
                <span className="font-medium">
                  {data.staffCompetence.antiDiscriminationRate}%
                </span>
              </div>
              <ProgressBar
                value={data.staffCompetence.antiDiscriminationRate}
                max={100}
                color={
                  data.staffCompetence.antiDiscriminationRate >= 90
                    ? "bg-green-500"
                    : "bg-amber-500"
                }
              />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">Child Rights Training</span>
                <span className="font-medium">
                  {data.staffCompetence.childRightsRate}%
                </span>
              </div>
              <ProgressBar
                value={data.staffCompetence.childRightsRate}
                max={100}
                color="bg-blue-500"
              />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">Fully Competent</span>
                <span className="font-medium">
                  {data.staffCompetence.overallCompetenceRate}%
                </span>
              </div>
              <ProgressBar
                value={data.staffCompetence.overallCompetenceRate}
                max={100}
                color="bg-blue-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Strengths / Areas / Actions */}
      <div className="space-y-4 mb-5">
        {data.actions.length > 0 && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <h4 className="text-sm font-semibold text-red-800 mb-2">
              Actions Required
            </h4>
            <ul className="space-y-1">
              {data.actions.map((action, i) => (
                <li key={i} className="text-sm text-red-700">
                  - {action}
                </li>
              ))}
            </ul>
          </div>
        )}

        {data.strengths.length > 0 && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <h4 className="text-sm font-semibold text-green-800 mb-2">
              Strengths
            </h4>
            <ul className="space-y-1">
              {data.strengths.map((s, i) => (
                <li key={i} className="text-sm text-green-700">
                  - {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {data.areasForImprovement.length > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <h4 className="text-sm font-semibold text-amber-800 mb-2">
              Areas for Improvement
            </h4>
            <ul className="space-y-1">
              {data.areasForImprovement.map((a, i) => (
                <li key={i} className="text-sm text-amber-700">
                  - {a}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Regulatory Framework */}
      <div>
        <button
          onClick={() => toggle("regulatory")}
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
        >
          <span
            className={`transform transition-transform ${expandedSection === "regulatory" ? "rotate-90" : ""}`}
          >
            &#9654;
          </span>
          Regulatory Framework
        </button>
        {expandedSection === "regulatory" && (
          <div className="mt-3 rounded-lg border border-gray-200 bg-white p-4">
            <ul className="space-y-1">
              {data.regulatoryLinks.map((link, i) => (
                <li key={i} className="text-xs text-gray-600">
                  - {link}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

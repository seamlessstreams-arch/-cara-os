"use client";

import React, { useEffect, useState } from "react";
import type {
  ReligiousSpiritualNeedsIntelligence,
} from "@/lib/religious-spiritual-needs/religious-spiritual-needs-engine";

// -- Rating Badge -------------------------------------------------------------

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

// -- Metric Card --------------------------------------------------------------

function MetricCard({ label, value, suffix, color }: { label: string; value: number | string; suffix?: string; color?: string }) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
      <span className={`text-2xl font-bold ${color ?? "text-gray-900"}`}>
        {value}{suffix}
      </span>
      <span className="mt-1 text-xs text-gray-500 text-center">{label}</span>
    </div>
  );
}

// -- Progress Bar -------------------------------------------------------------

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pctVal = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pctVal}%` }} />
      </div>
      <span className="text-xs font-medium text-gray-600 w-10 text-right">{pctVal}%</span>
    </div>
  );
}

// -- Faith Badge --------------------------------------------------------------

const FAITH_LABELS: Record<string, string> = {
  christian: "Christian",
  muslim: "Muslim",
  hindu: "Hindu",
  sikh: "Sikh",
  jewish: "Jewish",
  buddhist: "Buddhist",
  no_faith: "No Faith",
  spiritual_not_religious: "Spiritual",
  other: "Other",
};

// -- Main Widget --------------------------------------------------------------

export function ReligiousSpiritualNeedsDashboardWidget() {
  const [data, setData] = useState<ReligiousSpiritualNeedsIntelligence | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/religious-spiritual-needs")
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
        <h3 className="font-semibold text-red-800">Religious & Spiritual Needs Intelligence</h3>
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
            Religious & Spiritual Needs
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            {data.periodStart} to {data.periodEnd} · CHR 2015 Reg 10 / Reg 12
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
          color={data.overallScore >= 80 ? "text-green-600" : data.overallScore >= 60 ? "text-blue-600" : data.overallScore >= 40 ? "text-amber-600" : "text-red-600"}
        />
        <MetricCard
          label="Assessment Quality"
          value={data.assessmentQuality.overallScore}
          suffix="/25"
          color={data.assessmentQuality.overallScore >= 20 ? "text-green-600" : data.assessmentQuality.overallScore >= 15 ? "text-blue-600" : "text-amber-600"}
        />
        <MetricCard
          label="Support Delivery"
          value={data.supportDelivery.overallScore}
          suffix="/25"
          color={data.supportDelivery.overallScore >= 20 ? "text-green-600" : data.supportDelivery.overallScore >= 15 ? "text-blue-600" : "text-amber-600"}
        />
        <MetricCard
          label="Staff Readiness"
          value={data.staffReadiness.overallScore}
          suffix="/25"
          color={data.staffReadiness.overallScore >= 20 ? "text-green-600" : data.staffReadiness.overallScore >= 15 ? "text-blue-600" : "text-amber-600"}
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <MetricCard
          label="Facilitated Rate"
          value={data.supportDelivery.facilitatedRate}
          suffix="%"
          color={data.supportDelivery.facilitatedRate >= 90 ? "text-green-600" : "text-amber-600"}
        />
        <MetricCard
          label="Religious Policy"
          value={data.religiousPolicy.overallScore}
          suffix="/25"
          color={data.religiousPolicy.overallScore >= 20 ? "text-green-600" : data.religiousPolicy.overallScore >= 15 ? "text-blue-600" : "text-amber-600"}
        />
        <MetricCard
          label="Child Satisfied"
          value={data.supportDelivery.childSatisfiedRate}
          suffix="%"
          color={data.supportDelivery.childSatisfiedRate >= 90 ? "text-green-600" : "text-amber-600"}
        />
        <MetricCard
          label="Faith Awareness"
          value={data.staffReadiness.faithAwarenessRate}
          suffix="%"
          color={data.staffReadiness.faithAwarenessRate >= 90 ? "text-green-600" : "text-amber-600"}
        />
      </div>

      {/* Status Badges */}
      <div className="flex flex-wrap gap-2 mb-5">
        {data.supportDelivery.facilitatedRate >= 90 && (
          <span className="rounded-full bg-green-100 text-green-700 px-3 py-1 text-xs font-medium border border-green-200">
            ACTIVE FAITH SUPPORT
          </span>
        )}
        {data.assessmentQuality.childViewsRate >= 90 && (
          <span className="rounded-full bg-green-100 text-green-700 px-3 py-1 text-xs font-medium border border-green-200">
            CHILD VOICE CENTRAL
          </span>
        )}
        {data.religiousPolicy.worshipAccessRate >= 90 && (
          <span className="rounded-full bg-green-100 text-green-700 px-3 py-1 text-xs font-medium border border-green-200">
            WORSHIP ACCESS PROVIDED
          </span>
        )}
        {data.religiousPolicy.dietaryObservanceRate >= 90 && (
          <span className="rounded-full bg-green-100 text-green-700 px-3 py-1 text-xs font-medium border border-green-200">
            DIETARY OBSERVANCE MET
          </span>
        )}
        {data.staffReadiness.faithAwarenessRate >= 90 && (
          <span className="rounded-full bg-green-100 text-green-700 px-3 py-1 text-xs font-medium border border-green-200">
            FAITH AWARE TEAM
          </span>
        )}
        {data.supportDelivery.facilitatedRate < 70 && data.supportDelivery.totalRecords > 0 && (
          <span className="rounded-full bg-red-100 text-red-700 px-3 py-1 text-xs font-medium border border-red-200">
            SUPPORT NOT FACILITATED
          </span>
        )}
        {data.staffReadiness.faithAwarenessRate < 70 && data.staffReadiness.totalStaff > 0 && (
          <span className="rounded-full bg-amber-100 text-amber-700 px-3 py-1 text-xs font-medium border border-amber-200">
            FAITH TRAINING NEEDED
          </span>
        )}
      </div>

      {/* Child Profiles */}
      {data.childProfiles.length > 0 && (
        <div className="mb-5">
          <button
            onClick={() => toggle("profiles")}
            className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
          >
            <span className={`transform transition-transform ${expandedSection === "profiles" ? "rotate-90" : ""}`}>&#9654;</span>
            Child Religious Profiles ({data.childProfiles.length})
          </button>
          {expandedSection === "profiles" && (
            <div className="mt-3 rounded-lg border border-gray-200 bg-white p-4 space-y-3">
              {data.childProfiles.map((profile) => (
                <div key={profile.childId} className="flex items-center justify-between border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                  <div>
                    <span className="text-sm font-medium text-gray-900">{profile.childName}</span>
                    <span className="ml-2 text-xs text-gray-500">
                      {FAITH_LABELS[profile.faithBackground] ?? profile.faithBackground}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">{profile.assessmentCount} assessments, {profile.supportCount} supports</span>
                    <span className={`text-sm font-bold ${profile.score >= 7 ? "text-green-600" : profile.score >= 4 ? "text-blue-600" : "text-amber-600"}`}>
                      {profile.score}/10
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Assessment Quality Detail */}
      <div className="mb-5">
        <button
          onClick={() => toggle("assessment")}
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
        >
          <span className={`transform transition-transform ${expandedSection === "assessment" ? "rotate-90" : ""}`}>&#9654;</span>
          Assessment Quality Detail
        </button>
        {expandedSection === "assessment" && (
          <div className="mt-3 rounded-lg border border-gray-200 bg-white p-4 space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">Needs Identified</span>
                <span className="font-medium">{data.assessmentQuality.needsIdentifiedRate}%</span>
              </div>
              <ProgressBar value={data.assessmentQuality.needsIdentifiedRate} max={100} color="bg-blue-500" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">Preferences Recorded</span>
                <span className="font-medium">{data.assessmentQuality.preferencesRecordedRate}%</span>
              </div>
              <ProgressBar value={data.assessmentQuality.preferencesRecordedRate} max={100} color="bg-blue-500" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">Child Views Sought</span>
                <span className="font-medium">{data.assessmentQuality.childViewsRate}%</span>
              </div>
              <ProgressBar value={data.assessmentQuality.childViewsRate} max={100} color={data.assessmentQuality.childViewsRate >= 90 ? "bg-green-500" : "bg-amber-500"} />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">Parent/Carer Consulted</span>
                <span className="font-medium">{data.assessmentQuality.parentConsultedRate}%</span>
              </div>
              <ProgressBar value={data.assessmentQuality.parentConsultedRate} max={100} color={data.assessmentQuality.parentConsultedRate >= 80 ? "bg-green-500" : "bg-amber-500"} />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">Care Plan Updated</span>
                <span className="font-medium">{data.assessmentQuality.careplanUpdatedRate}%</span>
              </div>
              <ProgressBar value={data.assessmentQuality.careplanUpdatedRate} max={100} color={data.assessmentQuality.careplanUpdatedRate >= 80 ? "bg-green-500" : "bg-amber-500"} />
            </div>
            <div className="text-center">
              <span className="text-lg font-bold text-gray-900">{data.assessmentQuality.totalAssessments}</span>
              <p className="text-xs text-gray-500">Total Assessments</p>
            </div>
          </div>
        )}
      </div>

      {/* Support Delivery Detail */}
      <div className="mb-5">
        <button
          onClick={() => toggle("support")}
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
        >
          <span className={`transform transition-transform ${expandedSection === "support" ? "rotate-90" : ""}`}>&#9654;</span>
          Support Delivery Detail
        </button>
        {expandedSection === "support" && (
          <div className="mt-3 rounded-lg border border-gray-200 bg-white p-4 space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">Facilitated</span>
                <span className="font-medium">{data.supportDelivery.facilitatedRate}%</span>
              </div>
              <ProgressBar value={data.supportDelivery.facilitatedRate} max={100} color={data.supportDelivery.facilitatedRate >= 90 ? "bg-green-500" : "bg-amber-500"} />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">Child Satisfied</span>
                <span className="font-medium">{data.supportDelivery.childSatisfiedRate}%</span>
              </div>
              <ProgressBar value={data.supportDelivery.childSatisfiedRate} max={100} color={data.supportDelivery.childSatisfiedRate >= 90 ? "bg-green-500" : "bg-amber-500"} />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">Culturally Appropriate</span>
                <span className="font-medium">{data.supportDelivery.culturallyAppropriateRate}%</span>
              </div>
              <ProgressBar value={data.supportDelivery.culturallyAppropriateRate} max={100} color={data.supportDelivery.culturallyAppropriateRate >= 90 ? "bg-green-500" : "bg-amber-500"} />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">Regular Frequency</span>
                <span className="font-medium">{data.supportDelivery.regularFrequencyRate}%</span>
              </div>
              <ProgressBar value={data.supportDelivery.regularFrequencyRate} max={100} color="bg-blue-500" />
            </div>
            <div className="text-center">
              <span className="text-lg font-bold text-gray-900">{data.supportDelivery.totalRecords}</span>
              <p className="text-xs text-gray-500">Total Support Records</p>
            </div>
          </div>
        )}
      </div>

      {/* Staff Religious Readiness Detail */}
      <div className="mb-5">
        <button
          onClick={() => toggle("staff")}
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
        >
          <span className={`transform transition-transform ${expandedSection === "staff" ? "rotate-90" : ""}`}>&#9654;</span>
          Staff Religious Readiness
        </button>
        {expandedSection === "staff" && (
          <div className="mt-3 rounded-lg border border-gray-200 bg-white p-4 space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">Faith Awareness</span>
                <span className="font-medium">{data.staffReadiness.faithAwarenessRate}%</span>
              </div>
              <ProgressBar value={data.staffReadiness.faithAwarenessRate} max={100} color="bg-blue-500" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">Cultural Competence</span>
                <span className="font-medium">{data.staffReadiness.culturalCompetenceRate}%</span>
              </div>
              <ProgressBar value={data.staffReadiness.culturalCompetenceRate} max={100} color="bg-blue-500" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">Dietary Requirements</span>
                <span className="font-medium">{data.staffReadiness.dietaryRequirementsRate}%</span>
              </div>
              <ProgressBar value={data.staffReadiness.dietaryRequirementsRate} max={100} color="bg-blue-500" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">Festival Knowledge</span>
                <span className="font-medium">{data.staffReadiness.festivalKnowledgeRate}%</span>
              </div>
              <ProgressBar value={data.staffReadiness.festivalKnowledgeRate} max={100} color="bg-blue-500" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">Anti-Discrimination</span>
                <span className="font-medium">{data.staffReadiness.antiDiscriminationRate}%</span>
              </div>
              <ProgressBar value={data.staffReadiness.antiDiscriminationRate} max={100} color="bg-blue-500" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">Child Views Advocacy</span>
                <span className="font-medium">{data.staffReadiness.childViewsAdvocacyRate}%</span>
              </div>
              <ProgressBar value={data.staffReadiness.childViewsAdvocacyRate} max={100} color="bg-blue-500" />
            </div>
          </div>
        )}
      </div>

      {/* Strengths / Areas / Actions */}
      <div className="space-y-4 mb-5">
        {data.actions.length > 0 && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <h4 className="text-sm font-semibold text-red-800 mb-2">Actions Required</h4>
            <ul className="space-y-1">
              {data.actions.map((action, i) => (
                <li key={i} className="text-sm text-red-700">- {action}</li>
              ))}
            </ul>
          </div>
        )}

        {data.strengths.length > 0 && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <h4 className="text-sm font-semibold text-green-800 mb-2">Strengths</h4>
            <ul className="space-y-1">
              {data.strengths.map((s, i) => (
                <li key={i} className="text-sm text-green-700">- {s}</li>
              ))}
            </ul>
          </div>
        )}

        {data.areasForImprovement.length > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <h4 className="text-sm font-semibold text-amber-800 mb-2">Areas for Improvement</h4>
            <ul className="space-y-1">
              {data.areasForImprovement.map((a, i) => (
                <li key={i} className="text-sm text-amber-700">- {a}</li>
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
          <span className={`transform transition-transform ${expandedSection === "regulatory" ? "rotate-90" : ""}`}>&#9654;</span>
          Regulatory Framework
        </button>
        {expandedSection === "regulatory" && (
          <div className="mt-3 rounded-lg border border-gray-200 bg-white p-4">
            <ul className="space-y-1">
              {data.regulatoryLinks.map((link, i) => (
                <li key={i} className="text-xs text-gray-600">- {link}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

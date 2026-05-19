"use client";

import React, { useEffect, useState } from "react";
import type {
  CulturalIdentitySupportIntelligence,
} from "@/lib/cultural-identity-support/cultural-identity-support-engine";

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

// -- Main Widget --------------------------------------------------------------

export function CulturalIdentitySupportDashboardWidget() {
  const [data, setData] = useState<CulturalIdentitySupportIntelligence | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/cultural-identity-support")
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
        <h3 className="font-semibold text-red-800">Cultural Identity Support Intelligence</h3>
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
            Cultural Identity Support
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            {data.periodStart} to {data.periodEnd} · CHR 2015 Reg 10 / Reg 14
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
          label="Needs Assessment"
          value={data.needsAssessment.overallScore}
          suffix="/25"
          color={data.needsAssessment.overallScore >= 20 ? "text-green-600" : data.needsAssessment.overallScore >= 15 ? "text-blue-600" : "text-amber-600"}
        />
        <MetricCard
          label="Cultural Activities"
          value={data.culturalActivities.overallScore}
          suffix="/25"
          color={data.culturalActivities.overallScore >= 20 ? "text-green-600" : data.culturalActivities.overallScore >= 15 ? "text-blue-600" : "text-amber-600"}
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
          label="Fully Met Rate"
          value={data.needsAssessment.fullyMetRate}
          suffix="%"
          color={data.needsAssessment.fullyMetRate >= 80 ? "text-green-600" : "text-amber-600"}
        />
        <MetricCard
          label="Identity Planning"
          value={data.identityPlanning.overallScore}
          suffix="/25"
          color={data.identityPlanning.overallScore >= 20 ? "text-green-600" : data.identityPlanning.overallScore >= 15 ? "text-blue-600" : "text-amber-600"}
        />
        <MetricCard
          label="Engagement Rate"
          value={data.culturalActivities.engagementRate}
          suffix="%"
          color={data.culturalActivities.engagementRate >= 85 ? "text-green-600" : "text-amber-600"}
        />
        <MetricCard
          label="Anti-Racism Rate"
          value={data.staffReadiness.antiRacismRate}
          suffix="%"
          color={data.staffReadiness.antiRacismRate >= 90 ? "text-green-600" : "text-amber-600"}
        />
      </div>

      {/* Status Badges */}
      <div className="flex flex-wrap gap-2 mb-5">
        {data.needsAssessment.fullyMetRate >= 80 && (
          <span className="rounded-full bg-green-100 text-green-700 px-3 py-1 text-xs font-medium border border-green-200">
            STRONG CULTURAL PROVISION
          </span>
        )}
        {data.needsAssessment.childConsultedRate >= 90 && (
          <span className="rounded-full bg-green-100 text-green-700 px-3 py-1 text-xs font-medium border border-green-200">
            CHILD VOICE CENTRAL
          </span>
        )}
        {data.culturalActivities.childrenReachedRate >= 90 && (
          <span className="rounded-full bg-green-100 text-green-700 px-3 py-1 text-xs font-medium border border-green-200">
            ALL CHILDREN REACHED
          </span>
        )}
        {data.identityPlanning.planInPlaceRate >= 90 && (
          <span className="rounded-full bg-green-100 text-green-700 px-3 py-1 text-xs font-medium border border-green-200">
            PLANS IN PLACE
          </span>
        )}
        {data.staffReadiness.antiRacismRate >= 90 && (
          <span className="rounded-full bg-green-100 text-green-700 px-3 py-1 text-xs font-medium border border-green-200">
            ANTI-RACIST PRACTICE
          </span>
        )}
        {data.needsAssessment.fullyMetRate < 60 && data.needsAssessment.totalAssessments > 0 && (
          <span className="rounded-full bg-red-100 text-red-700 px-3 py-1 text-xs font-medium border border-red-200">
            NEEDS NOT FULLY MET
          </span>
        )}
        {data.staffReadiness.awarenessRate < 70 && data.staffReadiness.totalStaff > 0 && (
          <span className="rounded-full bg-amber-100 text-amber-700 px-3 py-1 text-xs font-medium border border-amber-200">
            STAFF DEVELOPMENT NEEDED
          </span>
        )}
      </div>

      {/* Needs Assessment Detail */}
      <div className="mb-5">
        <button
          onClick={() => toggle("needs")}
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
        >
          <span className={`transform transition-transform ${expandedSection === "needs" ? "rotate-90" : ""}`}>&#9654;</span>
          Needs Assessment Detail
        </button>
        {expandedSection === "needs" && (
          <div className="mt-3 rounded-lg border border-gray-200 bg-white p-4 space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">Fully Met</span>
                <span className="font-medium">{data.needsAssessment.fullyMetRate}%</span>
              </div>
              <ProgressBar value={data.needsAssessment.fullyMetRate} max={100} color="bg-blue-500" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">Reviews Current</span>
                <span className="font-medium">{data.needsAssessment.reviewCurrentRate}%</span>
              </div>
              <ProgressBar value={data.needsAssessment.reviewCurrentRate} max={100} color="bg-blue-500" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">Child Consulted</span>
                <span className="font-medium">{data.needsAssessment.childConsultedRate}%</span>
              </div>
              <ProgressBar value={data.needsAssessment.childConsultedRate} max={100} color={data.needsAssessment.childConsultedRate >= 90 ? "bg-green-500" : "bg-amber-500"} />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">Family Consulted</span>
                <span className="font-medium">{data.needsAssessment.familyConsultedRate}%</span>
              </div>
              <ProgressBar value={data.needsAssessment.familyConsultedRate} max={100} color={data.needsAssessment.familyConsultedRate >= 80 ? "bg-green-500" : "bg-amber-500"} />
            </div>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div>
                <span className="text-lg font-bold text-gray-900">{data.needsAssessment.totalAssessments}</span>
                <p className="text-xs text-gray-500">Total Assessments</p>
              </div>
              <div>
                <span className="text-lg font-bold text-gray-900">{data.needsAssessment.needTypeCoverage}</span>
                <p className="text-xs text-gray-500">Need Types Covered</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Identity Planning Detail */}
      <div className="mb-5">
        <button
          onClick={() => toggle("planning")}
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
        >
          <span className={`transform transition-transform ${expandedSection === "planning" ? "rotate-90" : ""}`}>&#9654;</span>
          Identity Planning Detail
        </button>
        {expandedSection === "planning" && (
          <div className="mt-3 rounded-lg border border-gray-200 bg-white p-4 space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">Plans in Place</span>
                <span className="font-medium">{data.identityPlanning.planInPlaceRate}%</span>
              </div>
              <ProgressBar value={data.identityPlanning.planInPlaceRate} max={100} color={data.identityPlanning.planInPlaceRate >= 90 ? "bg-green-500" : "bg-amber-500"} />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">Identity Documented</span>
                <span className="font-medium">{data.identityPlanning.identityDocumentedRate}%</span>
              </div>
              <ProgressBar value={data.identityPlanning.identityDocumentedRate} max={100} color="bg-blue-500" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">Life Story Work Active</span>
                <span className="font-medium">{data.identityPlanning.lifeStoryRate}%</span>
              </div>
              <ProgressBar value={data.identityPlanning.lifeStoryRate} max={100} color="bg-blue-500" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">Cultural Mentor Assigned</span>
                <span className="font-medium">{data.identityPlanning.mentorRate}%</span>
              </div>
              <ProgressBar value={data.identityPlanning.mentorRate} max={100} color={data.identityPlanning.mentorRate >= 80 ? "bg-green-500" : "bg-amber-500"} />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">Community Links</span>
                <span className="font-medium">{data.identityPlanning.communityLinksRate}%</span>
              </div>
              <ProgressBar value={data.identityPlanning.communityLinksRate} max={100} color={data.identityPlanning.communityLinksRate >= 80 ? "bg-green-500" : "bg-amber-500"} />
            </div>
          </div>
        )}
      </div>

      {/* Staff Cultural Readiness Detail */}
      <div className="mb-5">
        <button
          onClick={() => toggle("staff")}
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
        >
          <span className={`transform transition-transform ${expandedSection === "staff" ? "rotate-90" : ""}`}>&#9654;</span>
          Staff Cultural Readiness
        </button>
        {expandedSection === "staff" && (
          <div className="mt-3 rounded-lg border border-gray-200 bg-white p-4 space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">Cultural Awareness</span>
                <span className="font-medium">{data.staffReadiness.awarenessRate}%</span>
              </div>
              <ProgressBar value={data.staffReadiness.awarenessRate} max={100} color="bg-blue-500" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">Anti-Racism</span>
                <span className="font-medium">{data.staffReadiness.antiRacismRate}%</span>
              </div>
              <ProgressBar value={data.staffReadiness.antiRacismRate} max={100} color={data.staffReadiness.antiRacismRate >= 90 ? "bg-green-500" : "bg-amber-500"} />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">Religious Literacy</span>
                <span className="font-medium">{data.staffReadiness.religiousLiteracyRate}%</span>
              </div>
              <ProgressBar value={data.staffReadiness.religiousLiteracyRate} max={100} color="bg-blue-500" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">Identity Support</span>
                <span className="font-medium">{data.staffReadiness.identitySupportRate}%</span>
              </div>
              <ProgressBar value={data.staffReadiness.identitySupportRate} max={100} color="bg-blue-500" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">LGBTQ+ Awareness</span>
                <span className="font-medium">{data.staffReadiness.lgbtqAwarenessRate}%</span>
              </div>
              <ProgressBar value={data.staffReadiness.lgbtqAwarenessRate} max={100} color="bg-blue-500" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">Communication Diversity</span>
                <span className="font-medium">{data.staffReadiness.communicationDiversityRate}%</span>
              </div>
              <ProgressBar value={data.staffReadiness.communicationDiversityRate} max={100} color="bg-blue-500" />
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

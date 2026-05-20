"use client";

// ══════════════════════════════════════════════════════════════════════════════
// EDUCATION INTELLIGENCE DASHBOARD WIDGET
//
// Displays education intelligence:
// - Overall education rating and score
// - Education quality, compliance, policy, and staff readiness
// - Child profiles with attainment and attendance
// - Strengths and areas for improvement
// - Regulatory alignment actions
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";

interface ChildProfile {
  childId: string;
  childName: string;
  totalRecords: number;
  attainmentRate: number;
  attendanceRate: number;
  exclusionCount: number;
  educationScore: number;
}

interface EvaluatorResult {
  score: number;
  strengths: string[];
  concerns: string[];
}

interface EducationData {
  homeId: string;
  assessedAt: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: string;
  educationQuality: EvaluatorResult & {
    totalRecords: number;
    attainmentRate: number;
    attendanceRate: number;
    noExclusionRate: number;
    designatedTeacherRate: number;
  };
  educationCompliance: EvaluatorResult & {
    totalRecords: number;
    pepRate: number;
    pupilPremiumRate: number;
    virtualSchoolRate: number;
    placementDiversityRatio: number;
    uniquePlacements: number;
  };
  educationPolicy: EvaluatorResult & { score: number };
  staffReadiness: EvaluatorResult & {
    totalStaff: number;
    educationRegulationsRate: number;
    pepProcessRate: number;
  };
  childProfiles: ChildProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
  meta: {
    placementSummary: Record<string, number>;
    attainmentSummary: Record<string, number>;
    totalRecords: number;
    totalStaff: number;
    demoMode: boolean;
  };
}

// ── Rating Badge ─────────────────────────────────────────────────────────

function RatingBadge({ rating, score }: { rating: string; score: number }) {
  const colorMap: Record<string, string> = {
    outstanding: "bg-emerald-100 text-emerald-800 border-emerald-300",
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
  const cls = colorMap[rating] || "bg-gray-100 text-gray-800 border-gray-300";
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${cls}`}>
      {labelMap[rating] || rating} ({score}/100)
    </span>
  );
}

// ── Score Bar ────────────────────────────────────────────────────────────

function ScoreBar({ label, score, max }: { label: string; score: number; max: number }) {
  const pct = max > 0 ? Math.round((score / max) * 100) : 0;
  const barColor = pct >= 80 ? "bg-emerald-500" : pct >= 60 ? "bg-blue-500" : pct >= 40 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-600 w-28 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-medium w-12 text-right">{score}/{max}</span>
    </div>
  );
}

// ── Main Widget ──────────────────────────────────────────────────────────

export default function EducationDashboardWidget() {
  const [data, setData] = useState<EducationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/education");
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

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="h-24 bg-gray-100 rounded" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white border border-red-200 rounded-xl p-6">
        <h3 className="font-semibold text-red-800">Education Intelligence</h3>
        <p className="text-sm text-red-600 mt-1">{error || "No data available"}</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Education Intelligence</h3>
              <p className="text-xs text-gray-500">
                {data.meta.totalRecords} records | {data.childProfiles.length} children | {data.meta.totalStaff} staff
              </p>
            </div>
          </div>
          <RatingBadge rating={data.rating} score={data.overallScore} />
        </div>
      </div>

      {/* Evaluator Scores */}
      <div className="p-4 space-y-2.5 border-b border-gray-100">
        <ScoreBar label="Quality" score={data.educationQuality.score} max={25} />
        <ScoreBar label="Compliance" score={data.educationCompliance.score} max={25} />
        <ScoreBar label="Policy" score={data.educationPolicy.score} max={25} />
        <ScoreBar label="Staff Readiness" score={data.staffReadiness.score} max={25} />
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 divide-x divide-gray-100 border-b border-gray-100">
        <div className="p-3 text-center">
          <p className="text-lg font-bold text-gray-900">{data.educationQuality.attainmentRate}%</p>
          <p className="text-[10px] text-gray-500">Attainment</p>
        </div>
        <div className="p-3 text-center">
          <p className="text-lg font-bold text-gray-900">{data.educationQuality.attendanceRate}%</p>
          <p className="text-[10px] text-gray-500">Attendance</p>
        </div>
        <div className="p-3 text-center">
          <p className="text-lg font-bold text-gray-900">{data.educationCompliance.pepRate}%</p>
          <p className="text-[10px] text-gray-500">PEP Rate</p>
        </div>
        <div className="p-3 text-center">
          <p className={`text-lg font-bold ${data.educationQuality.noExclusionRate < 80 ? "text-amber-600" : "text-gray-900"}`}>
            {data.educationQuality.noExclusionRate}%
          </p>
          <p className="text-[10px] text-gray-500">No Exclusion</p>
        </div>
      </div>

      {/* Child Profiles */}
      {data.childProfiles.length > 0 && (
        <div className="border-b border-gray-100">
          <div className="px-4 py-2 bg-gray-50">
            <p className="text-xs font-medium text-gray-600">Child Profiles</p>
          </div>
          <div className="divide-y divide-gray-50">
            {data.childProfiles.map((child) => (
              <div key={child.childId} className="px-4 py-2 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-900">{child.childName}</p>
                  <p className="text-[10px] text-gray-500">
                    {child.totalRecords} record{child.totalRecords !== 1 ? "s" : ""} |
                    Attainment {child.attainmentRate}% |
                    Attendance {child.attendanceRate}%
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {child.exclusionCount > 0 && (
                    <span className="text-[10px] text-red-600 font-medium">
                      {child.exclusionCount} exclusion{child.exclusionCount !== 1 ? "s" : ""}
                    </span>
                  )}
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    child.educationScore >= 8 ? "bg-emerald-100 text-emerald-700" :
                    child.educationScore >= 5 ? "bg-blue-100 text-blue-700" :
                    "bg-amber-100 text-amber-700"
                  }`}>
                    {child.educationScore}/10
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expandable Details */}
      <div className="border-b border-gray-100">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full px-4 py-2.5 text-xs text-gray-600 hover:bg-gray-50 flex items-center justify-between transition-colors"
        >
          <span>{expanded ? "Hide" : "Show"} details</span>
          <svg className={`w-3.5 h-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {expanded && (
          <div className="px-4 pb-4 space-y-4">
            {/* Strengths */}
            {data.strengths.length > 0 && (
              <div>
                <p className="text-xs font-medium text-emerald-700 mb-1.5">Strengths</p>
                <ul className="space-y-1">
                  {data.strengths.slice(0, 5).map((s, i) => (
                    <li key={i} className="text-xs text-gray-700 flex gap-1.5">
                      <span className="text-emerald-500 shrink-0">+</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Areas for Improvement */}
            {data.areasForImprovement.length > 0 && (
              <div>
                <p className="text-xs font-medium text-amber-700 mb-1.5">Areas for Improvement</p>
                <ul className="space-y-1">
                  {data.areasForImprovement.slice(0, 5).map((a, i) => (
                    <li key={i} className="text-xs text-gray-700 flex gap-1.5">
                      <span className="text-amber-500 shrink-0">!</span>
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions */}
            {data.actions.length > 0 && (
              <div>
                <p className="text-xs font-medium text-blue-700 mb-1.5">Actions</p>
                <ul className="space-y-1">
                  {data.actions.slice(0, 5).map((a, i) => (
                    <li key={i} className="text-xs text-gray-700 flex gap-1.5">
                      <span className="text-blue-500 shrink-0">&rarr;</span>
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Regulatory Links */}
            {data.regulatoryLinks.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1.5">Regulatory Framework</p>
                <ul className="space-y-0.5">
                  {data.regulatoryLinks.map((link, i) => (
                    <li key={i} className="text-[10px] text-gray-500">{link}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 text-center">
        <a href="/education" className="text-xs text-blue-600 font-medium hover:underline">
          View full education dashboard
        </a>
      </div>
    </div>
  );
}

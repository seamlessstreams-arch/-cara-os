"use client";

import React, { useEffect, useState } from "react";
import { formatRate, meets } from "@/lib/metrics/rate";
import type {
  HomeAtmosphereEthosIntelligence,
  ChildAtmosphereProfile,
} from "@/lib/home-atmosphere-ethos/home-atmosphere-ethos-engine";
import {
  getAtmosphereIndicatorLabel,
} from "@/lib/home-atmosphere-ethos/home-atmosphere-ethos-engine";

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

// ── Score Bar ────────────────────────────────────────────────────────────────

function ScoreBar({ label, score, max, color }: { label: string; score: number; max: number; color: string }) {
  const pctVal = max > 0 ? Math.round((score / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-700 w-40 shrink-0">{label}</span>
      <div className="flex-1 h-3 rounded-full bg-gray-200 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pctVal}%` }} />
      </div>
      <span className="text-sm font-semibold text-gray-700 w-14 text-right">{score}/{max}</span>
    </div>
  );
}

// ── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({ value, max, color }: { value: number | null; max: number; color: string }) {
  const pctVal = value !== null && max > 0 ? Math.round((value / max) * 100) : null;
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pctVal ?? 0}%` }} />
      </div>
      <span className="text-xs font-medium text-gray-600 w-10 text-right">{pctVal !== null ? `${pctVal}%` : "—"}</span>
    </div>
  );
}

// ── Child Profile Card ───────────────────────────────────────────────────────

function ChildProfileCard({ profile }: { profile: ChildAtmosphereProfile }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="font-semibold text-gray-900">{profile.childName}</h4>
          <span className="text-xs text-gray-500">
            Score: {profile.overallScore}/10 · {profile.feedbackCount} feedback entries
          </span>
        </div>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-semibold border ${
            profile.overallScore >= 8
              ? "bg-green-100 text-green-700 border-green-200"
              : profile.overallScore >= 6
                ? "bg-blue-100 text-blue-700 border-blue-200"
                : profile.overallScore >= 4
                  ? "bg-amber-100 text-amber-700 border-amber-200"
                  : "bg-red-100 text-red-700 border-red-200"
          }`}
        >
          {profile.overallScore >= 8
            ? "THRIVING"
            : profile.overallScore >= 6
              ? "SETTLED"
              : profile.overallScore >= 4
                ? "ADJUSTING"
                : "NEEDS SUPPORT"}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t">
        <div>
          <span className="text-lg font-bold text-gray-900">{formatRate(profile.positiveRate)}</span>
          <p className="text-xs text-gray-500">Positive</p>
        </div>
        <div>
          <span className={`text-lg font-bold ${profile.feelsSafe ? "text-green-600" : "text-red-600"}`}>
            {profile.feelsSafe ? "Yes" : "No"}
          </span>
          <p className="text-xs text-gray-500">Feels Safe</p>
        </div>
        <div>
          <span className={`text-lg font-bold ${profile.feelsAtHome ? "text-green-600" : "text-red-600"}`}>
            {profile.feelsAtHome ? "Yes" : "No"}
          </span>
          <p className="text-xs text-gray-500">At Home</p>
        </div>
      </div>
    </div>
  );
}

// ── Main Widget ──────────────────────────────────────────────────────────────

export function HomeAtmosphereEthosDashboardWidget() {
  const [data, setData] = useState<HomeAtmosphereEthosIntelligence | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/home-atmosphere-ethos")
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
        <h3 className="font-semibold text-red-800">Home Atmosphere & Ethos Intelligence</h3>
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
            Home Atmosphere & Ethos
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            {data.periodStart} to {data.periodEnd} · CHR 2015 Reg 6/9 · SCCIF · UNCRC Art. 3/12
          </p>
        </div>
        <RatingBadge rating={data.rating} score={data.overallScore} />
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <MetricCard
          label="Overall Score"
          value={data.overallScore}
          suffix="/100"
          color={data.overallScore >= 80 ? "text-green-600" : data.overallScore >= 60 ? "text-blue-600" : data.overallScore >= 40 ? "text-amber-600" : "text-red-600"}
        />
        <MetricCard
          label="Observations"
          value={data.warmthCulture.totalObservations}
          color="text-purple-600"
        />
        <MetricCard
          label="Child Feedback"
          value={data.childExperience.totalFeedback}
          color="text-blue-600"
        />
        <MetricCard
          label="Staff Records"
          value={data.staffPractice.totalRecords}
          color="text-indigo-600"
        />
      </div>

      {/* Score Bars for 4 Sub-Domains */}
      <div className="space-y-2 mb-5 rounded-lg border border-gray-200 bg-white p-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Sub-Domain Scores</h4>
        <ScoreBar label="Warmth & Culture" score={data.warmthCulture.overallScore} max={25} color="bg-rose-500" />
        <ScoreBar label="Child Experience" score={data.childExperience.overallScore} max={25} color="bg-blue-500" />
        <ScoreBar label="Environment Quality" score={data.environmentQuality.overallScore} max={25} color="bg-emerald-500" />
        <ScoreBar label="Staff Practice" score={data.staffPractice.overallScore} max={25} color="bg-violet-500" />
      </div>

      {/* Child Profiles */}
      <div className="mb-5">
        <button
          onClick={() => toggle("profiles")}
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
        >
          <span className={`transform transition-transform ${expandedSection === "profiles" ? "rotate-90" : ""}`}>&#9654;</span>
          Child Profiles ({data.childProfiles.length})
        </button>
        {expandedSection === "profiles" && (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.childProfiles.map((profile) => (
              <ChildProfileCard key={profile.childId} profile={profile} />
            ))}
          </div>
        )}
      </div>

      {/* Warmth & Culture */}
      <div className="mb-5">
        <button
          onClick={() => toggle("warmth")}
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
        >
          <span className={`transform transition-transform ${expandedSection === "warmth" ? "rotate-90" : ""}`}>&#9654;</span>
          Warmth & Culture
        </button>
        {expandedSection === "warmth" && (
          <div className="mt-3 rounded-lg border border-gray-200 bg-white p-4 space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-center">
              <div>
                <span className={`text-lg font-bold ${meets(data.warmthCulture.excellentGoodRate, 80) ? "text-green-600" : "text-amber-600"}`}>{formatRate(data.warmthCulture.excellentGoodRate)}</span>
                <p className="text-xs text-gray-500">Excellent/Good</p>
              </div>
              <div>
                <span className="text-lg font-bold text-rose-600">{data.warmthCulture.warmthScore}</span>
                <p className="text-xs text-gray-500">Warmth Score</p>
              </div>
              <div>
                <span className="text-lg font-bold text-blue-600">{formatRate(data.warmthCulture.calmScore)}</span>
                <p className="text-xs text-gray-500">Calm/Safety</p>
              </div>
            </div>
            <div className="pt-2 border-t border-gray-100 space-y-2">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">Respect</span>
                  <span className="font-medium">{formatRate(data.warmthCulture.respectScore)}</span>
                </div>
                <ProgressBar value={data.warmthCulture.respectScore} max={100} color="bg-purple-500" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">Fun</span>
                  <span className="font-medium">{formatRate(data.warmthCulture.funScore)}</span>
                </div>
                <ProgressBar value={data.warmthCulture.funScore} max={100} color="bg-amber-500" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">Nurture</span>
                  <span className="font-medium">{formatRate(data.warmthCulture.nurtureScore)}</span>
                </div>
                <ProgressBar value={data.warmthCulture.nurtureScore} max={100} color="bg-rose-500" />
              </div>
            </div>
            {data.warmthCulture.indicatorDistribution && (
              <div className="pt-2 border-t border-gray-100">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Indicator Distribution</h4>
                <div className="flex flex-wrap gap-2">
                  {(Object.entries(data.warmthCulture.indicatorDistribution) as [string, number][])
                    .filter(([, count]) => count > 0)
                    .map(([indicator, count]) => (
                      <span
                        key={indicator}
                        className="rounded-full bg-gray-100 text-gray-700 px-2 py-0.5 text-xs font-medium border border-gray-200"
                      >
                        {getAtmosphereIndicatorLabel(indicator as Parameters<typeof getAtmosphereIndicatorLabel>[0])} ({count})
                      </span>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Child Experience */}
      <div className="mb-5">
        <button
          onClick={() => toggle("experience")}
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
        >
          <span className={`transform transition-transform ${expandedSection === "experience" ? "rotate-90" : ""}`}>&#9654;</span>
          Child Experience
        </button>
        {expandedSection === "experience" && (
          <div className="mt-3 rounded-lg border border-gray-200 bg-white p-4 space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div>
                <span className={`text-lg font-bold ${meets(data.childExperience.positiveRate, 80) ? "text-green-600" : "text-amber-600"}`}>{formatRate(data.childExperience.positiveRate)}</span>
                <p className="text-xs text-gray-500">Positive Rate</p>
              </div>
              <div>
                <span className={`text-lg font-bold ${meets(data.childExperience.feelsSafeRate, 90) ? "text-green-600" : "text-red-600"}`}>{formatRate(data.childExperience.feelsSafeRate)}</span>
                <p className="text-xs text-gray-500">Feels Safe</p>
              </div>
              <div>
                <span className="text-lg font-bold text-blue-600">{formatRate(data.childExperience.feelsAtHomeRate)}</span>
                <p className="text-xs text-gray-500">At Home</p>
              </div>
              <div>
                <span className="text-lg font-bold text-purple-600">{formatRate(data.childExperience.canBeThemselvesRate)}</span>
                <p className="text-xs text-gray-500">Be Themselves</p>
              </div>
            </div>
            <div className="pt-2 border-t border-gray-100 space-y-2">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">Feels Listened To</span>
                  <span className="font-medium">{formatRate(data.childExperience.feelsListenedToRate)}</span>
                </div>
                <ProgressBar value={data.childExperience.feelsListenedToRate} max={100} color="bg-blue-500" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">Has Privacy</span>
                  <span className="font-medium">{formatRate(data.childExperience.hasPrivacyRate)}</span>
                </div>
                <ProgressBar value={data.childExperience.hasPrivacyRate} max={100} color="bg-indigo-500" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">Enjoys Living Here</span>
                  <span className="font-medium">{formatRate(data.childExperience.enjoysLivingRate)}</span>
                </div>
                <ProgressBar value={data.childExperience.enjoysLivingRate} max={100} color="bg-green-500" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Environment Quality */}
      <div className="mb-5">
        <button
          onClick={() => toggle("environment")}
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
        >
          <span className={`transform transition-transform ${expandedSection === "environment" ? "rotate-90" : ""}`}>&#9654;</span>
          Environment Quality
        </button>
        {expandedSection === "environment" && (
          <div className="mt-3 rounded-lg border border-gray-200 bg-white p-4 space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-center">
              <div>
                <span className="text-lg font-bold text-gray-900">{data.environmentQuality.totalAudits}</span>
                <p className="text-xs text-gray-500">Areas Audited</p>
              </div>
              <div>
                <span className={`text-lg font-bold ${meets(data.environmentQuality.cleanRate, 90) ? "text-green-600" : "text-amber-600"}`}>{formatRate(data.environmentQuality.cleanRate)}</span>
                <p className="text-xs text-gray-500">Clean</p>
              </div>
              <div>
                <span className={`text-lg font-bold ${meets(data.environmentQuality.repairsActionedRate, 80) ? "text-green-600" : "text-amber-600"}`}>{formatRate(data.environmentQuality.repairsActionedRate)}</span>
                <p className="text-xs text-gray-500">Repairs Actioned</p>
              </div>
            </div>
            <div className="pt-2 border-t border-gray-100 space-y-2">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">Personalised</span>
                  <span className="font-medium">{formatRate(data.environmentQuality.personalisedRate)}</span>
                </div>
                <ProgressBar value={data.environmentQuality.personalisedRate} max={100} color="bg-purple-500" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">Welcoming</span>
                  <span className="font-medium">{formatRate(data.environmentQuality.welcomingRate)}</span>
                </div>
                <ProgressBar value={data.environmentQuality.welcomingRate} max={100} color="bg-blue-500" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">Child Contributed</span>
                  <span className="font-medium">{formatRate(data.environmentQuality.childContributedRate)}</span>
                </div>
                <ProgressBar value={data.environmentQuality.childContributedRate} max={100} color="bg-emerald-500" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">Sensory Considered</span>
                  <span className="font-medium">{formatRate(data.environmentQuality.sensoryConsideredRate)}</span>
                </div>
                <ProgressBar value={data.environmentQuality.sensoryConsideredRate} max={100} color="bg-teal-500" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Staff Practice */}
      <div className="mb-5">
        <button
          onClick={() => toggle("staff")}
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
        >
          <span className={`transform transition-transform ${expandedSection === "staff" ? "rotate-90" : ""}`}>&#9654;</span>
          Staff Practice
        </button>
        {expandedSection === "staff" && (
          <div className="mt-3 rounded-lg border border-gray-200 bg-white p-4 space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-center">
              <div>
                <span className="text-lg font-bold text-gray-900">{data.staffPractice.totalRecords}</span>
                <p className="text-xs text-gray-500">Records</p>
              </div>
              <div>
                <span className={`text-lg font-bold ${meets(data.staffPractice.therapeuticRate, 80) ? "text-green-600" : "text-amber-600"}`}>{formatRate(data.staffPractice.therapeuticRate)}</span>
                <p className="text-xs text-gray-500">Therapeutic</p>
              </div>
              <div>
                <span className={`text-lg font-bold ${meets(data.staffPractice.boundariesRate, 90) ? "text-green-600" : "text-amber-600"}`}>{formatRate(data.staffPractice.boundariesRate)}</span>
                <p className="text-xs text-gray-500">Boundaries</p>
              </div>
            </div>
            <div className="pt-2 border-t border-gray-100 space-y-2">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">Child-Centred Language</span>
                  <span className="font-medium">{formatRate(data.staffPractice.childCentredRate)}</span>
                </div>
                <ProgressBar value={data.staffPractice.childCentredRate} max={100} color="bg-blue-500" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">Warm Interactions</span>
                  <span className="font-medium">{formatRate(data.staffPractice.warmInteractionRate)}</span>
                </div>
                <ProgressBar value={data.staffPractice.warmInteractionRate} max={100} color="bg-rose-500" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">Positive Reinforcement</span>
                  <span className="font-medium">{formatRate(data.staffPractice.positiveReinforcementRate)}</span>
                </div>
                <ProgressBar value={data.staffPractice.positiveReinforcementRate} max={100} color="bg-amber-500" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">Reflective Practice</span>
                  <span className="font-medium">{formatRate(data.staffPractice.reflectiveRate)}</span>
                </div>
                <ProgressBar value={data.staffPractice.reflectiveRate} max={100} color="bg-violet-500" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Strengths / Areas / Actions */}
      <div className="mb-5">
        <button
          onClick={() => toggle("insights")}
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
        >
          <span className={`transform transition-transform ${expandedSection === "insights" ? "rotate-90" : ""}`}>&#9654;</span>
          Strengths, Areas & Actions
        </button>
        {expandedSection === "insights" && (
          <div className="mt-3 space-y-4">
            {data.actions.length > 0 && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <h4 className="text-sm font-semibold text-red-800 mb-2">Actions Required</h4>
                <ul className="space-y-1">
                  {data.actions.map((action, i) => (
                    <li key={i} className={`text-sm ${action.startsWith("URGENT:") ? "text-red-800 font-semibold" : "text-red-700"}`}>- {action}</li>
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

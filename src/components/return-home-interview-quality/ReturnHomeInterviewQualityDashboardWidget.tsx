"use client";

import { useState, useEffect } from "react";
import type { ReturnHomeInterviewQualityIntelligence } from "@/lib/return-home-interview-quality";
import { formatRate } from "@/lib/metrics/rate";

const ratingColors: Record<string, string> = {
  outstanding: "bg-green-100 text-green-800 border-green-300",
  good: "bg-blue-100 text-blue-800 border-blue-300",
  requires_improvement: "bg-amber-100 text-amber-800 border-amber-300",
  inadequate: "bg-red-100 text-red-800 border-red-300",
};

const ratingLabels: Record<string, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

const qualityLabels: Record<string, string> = {
  thorough: "Thorough",
  adequate: "Adequate",
  superficial: "Superficial",
  not_completed: "Not Completed",
};

function ScoreBar({ score, label, max = 25 }: { score: number; label: string; max?: number }) {
  const pct = Math.round((score / max) * 100);
  const color =
    pct >= 80 ? "bg-green-500" : pct >= 60 ? "bg-blue-500" : pct >= 40 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 w-52 shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2.5">
        <div className={`h-2.5 rounded-full ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <span className="text-sm font-medium w-14 text-right">{score}/{max}</span>
    </div>
  );
}

function Section({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <span className="font-medium text-gray-900">{title}</span>
        <span className="text-gray-400">{open ? "▲" : "▼"}</span>
      </button>
      {open && <div className="p-4 space-y-3">{children}</div>}
    </div>
  );
}

export function ReturnHomeInterviewQualityDashboardWidget() {
  const [data, setData] = useState<ReturnHomeInterviewQualityIntelligence | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/return-home-interview-quality")
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-2/3" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded" />
            ))}
          </div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
        <h3 className="text-lg font-semibold text-red-800">
          Return Home Interview Quality Intelligence
        </h3>
        <p className="text-red-600 mt-2">Failed to load: {error}</p>
      </div>
    );
  }

  if (!data) return null;

  const ratingClass = ratingColors[data.rating] || ratingColors.inadequate;
  const ratingLabel = ratingLabels[data.rating] || data.rating;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Return Home Interview Quality Intelligence
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {data.periodStart} to {data.periodEnd}
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-gray-900">{data.overallScore}</div>
          <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${ratingClass}`}>
            {ratingLabel}
          </span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">
            {data.interviewCompliance.totalEpisodes}
          </div>
          <div className="text-xs text-gray-500 mt-1">Missing Episodes</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">
            {formatRate(data.interviewCompliance.rhiCompletedRate)}
          </div>
          <div className="text-xs text-gray-500 mt-1">RHI Completed</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">
            {formatRate(data.interviewCompliance.within72hRate)}
          </div>
          <div className="text-xs text-gray-500 mt-1">Within 72 Hours</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">
            {formatRate(data.interviewDepth.childViewsRate)}
          </div>
          <div className="text-xs text-gray-500 mt-1">Child Views Sought</div>
        </div>
      </div>

      {/* Component Scores */}
      <div className="space-y-2">
        <ScoreBar score={data.interviewCompliance.overallScore} label="Interview Compliance" />
        <ScoreBar score={data.interviewDepth.overallScore} label="Interview Depth" />
        <ScoreBar score={data.strategyResponse.overallScore} label="Strategy Response" />
        <ScoreBar score={data.preventionEffectiveness.overallScore} label="Prevention Effectiveness" />
      </div>

      {/* Sections */}
      <div className="space-y-3">
        {/* Child Missing Profiles */}
        <Section title="Child Missing Profiles" defaultOpen>
          <div className="space-y-3">
            {data.childProfiles.map((profile) => (
              <div key={profile.childId} className="border border-gray-100 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{profile.childName}</span>
                  <span className="text-sm font-medium text-gray-600">
                    Score: {profile.overallScore}/10
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-600">
                  <div>
                    <span className="text-gray-400">Episodes:</span>{" "}
                    <span className="font-medium">{profile.episodeCount}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">RHI Completed:</span>{" "}
                    <span className="font-medium">{formatRate(profile.rhiCompletedRate)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Avg Duration:</span>{" "}
                    <span className="font-medium">
                      {profile.averageDuration !== null ? `${profile.averageDuration}h` : "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Safety Plan:</span>{" "}
                    <span className={profile.hasSafetyPlan ? "text-green-600" : "text-red-600"}>
                      {profile.hasSafetyPlan ? "Yes" : "No"}
                    </span>
                  </div>
                </div>
                {profile.commonFactors.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {profile.commonFactors.slice(0, 4).map((factor) => (
                      <span
                        key={factor}
                        className="inline-block px-2 py-0.5 bg-purple-50 text-purple-700 text-xs rounded-full"
                      >
                        {factor.replace(/_/g, " ")}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>

        {/* Interview Compliance */}
        <Section title="Interview Compliance">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">Total Episodes:</span>{" "}
              <span className="font-medium">{data.interviewCompliance.totalEpisodes}</span>
            </div>
            <div>
              <span className="text-gray-500">RHI Completed:</span>{" "}
              <span className="font-medium">{formatRate(data.interviewCompliance.rhiCompletedRate)}</span>
            </div>
            <div>
              <span className="text-gray-500">Within 72 Hours:</span>{" "}
              <span className="font-medium">{formatRate(data.interviewCompliance.within72hRate)}</span>
            </div>
            <div>
              <span className="text-gray-500">Independent Rate:</span>{" "}
              <span className="font-medium">{formatRate(data.interviewCompliance.independentRate)}</span>
            </div>
            <div>
              <span className="text-gray-500">Declined:</span>{" "}
              <span className="font-medium">{data.interviewCompliance.declinedCount}</span>
            </div>
          </div>
          {/* Quality Distribution */}
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="text-xs text-gray-500 mb-2">Quality Distribution</div>
            <div className="grid grid-cols-4 gap-2 text-xs text-center">
              {(["thorough", "adequate", "superficial", "not_completed"] as const).map((q) => (
                <div key={q} className="bg-gray-50 rounded p-2">
                  <div className="font-medium text-gray-900">
                    {data.interviewCompliance.qualityDistribution[q]}
                  </div>
                  <div className="text-gray-500">{qualityLabels[q]}</div>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* Interview Depth */}
        <Section title="Interview Depth">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">Total Interviews:</span>{" "}
              <span className="font-medium">{data.interviewDepth.totalInterviews}</span>
            </div>
            <div>
              <span className="text-gray-500">Child Views Sought:</span>{" "}
              <span className="font-medium">{formatRate(data.interviewDepth.childViewsRate)}</span>
            </div>
            <div>
              <span className="text-gray-500">Push Factors Identified:</span>{" "}
              <span className="font-medium">{formatRate(data.interviewDepth.pushFactorsRate)}</span>
            </div>
            <div>
              <span className="text-gray-500">Pull Factors Identified:</span>{" "}
              <span className="font-medium">{formatRate(data.interviewDepth.pullFactorsRate)}</span>
            </div>
            <div>
              <span className="text-gray-500">Safety Plans Created:</span>{" "}
              <span className="font-medium">{formatRate(data.interviewDepth.safetyPlanCreatedRate)}</span>
            </div>
            <div>
              <span className="text-gray-500">Referrals Made:</span>{" "}
              <span className="font-medium">{data.interviewDepth.referralsMadeCount}</span>
            </div>
            <div>
              <span className="text-gray-500">Info Shared with Police:</span>{" "}
              <span className="font-medium">{formatRate(data.interviewDepth.policeInfoSharedRate)}</span>
            </div>
          </div>
        </Section>

        {/* Strategy Response */}
        <Section title="Strategy Response">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">Total Meetings:</span>{" "}
              <span className="font-medium">{data.strategyResponse.totalMeetings}</span>
            </div>
            <div>
              <span className="text-gray-500">Multi-Agency:</span>{" "}
              <span className="font-medium">{formatRate(data.strategyResponse.multiAgencyRate)}</span>
            </div>
            <div>
              <span className="text-gray-500">Action Plans Created:</span>{" "}
              <span className="font-medium">{formatRate(data.strategyResponse.actionPlanRate)}</span>
            </div>
            <div>
              <span className="text-gray-500">Actions Reviewed:</span>{" "}
              <span className="font-medium">{formatRate(data.strategyResponse.actionReviewedRate)}</span>
            </div>
            <div>
              <span className="text-gray-500">Trigger Patterns Discussed:</span>{" "}
              <span className="font-medium">{formatRate(data.strategyResponse.triggerPatternRate)}</span>
            </div>
            <div>
              <span className="text-gray-500">Avg Attendees:</span>{" "}
              <span className="font-medium">{data.strategyResponse.averageAttendees}</span>
            </div>
          </div>
        </Section>

        {/* Prevention Effectiveness */}
        <Section title="Prevention Effectiveness">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">Total Measures:</span>{" "}
              <span className="font-medium">{data.preventionEffectiveness.totalMeasures}</span>
            </div>
            <div>
              <span className="text-gray-500">Effective Rate:</span>{" "}
              <span className="font-medium">{formatRate(data.preventionEffectiveness.effectiveRate)}</span>
            </div>
            <div>
              <span className="text-gray-500">Reviewed Rate:</span>{" "}
              <span className="font-medium">{formatRate(data.preventionEffectiveness.reviewedRate)}</span>
            </div>
            <div>
              <span className="text-gray-500">Unique Children:</span>{" "}
              <span className="font-medium">{data.preventionEffectiveness.uniqueChildren}</span>
            </div>
          </div>
        </Section>

        {/* Strengths / Areas / Actions */}
        <Section title="Strengths, Areas &amp; Actions">
          {data.strengths.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-green-700 mb-1">Strengths</h4>
              <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                {data.strengths.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}
          {data.areasForImprovement.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-amber-700 mb-1">Areas for Improvement</h4>
              <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                {data.areasForImprovement.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          )}
          {data.actions.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-blue-700 mb-1">Recommended Actions</h4>
              <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                {data.actions.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          )}
        </Section>

        {/* Regulatory Framework */}
        <Section title="Regulatory Framework">
          <ul className="text-sm text-gray-600 space-y-1">
            {data.regulatoryLinks.map((link, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">&sect;</span>
                <span>{link}</span>
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </div>
  );
}

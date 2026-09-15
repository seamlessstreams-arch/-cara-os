"use client";

import { formatRate } from "@/lib/metrics/rate";
import { useState, useEffect } from "react";
import type { TherapeuticCareIntelligence } from "@/lib/therapeutic-care";

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

function ScoreBar({ score, label, maxScore = 100 }: { score: number; label: string; maxScore?: number }) {
  const pct = (score / maxScore) * 100;
  const color = pct >= 80 ? "bg-green-500" : pct >= 60 ? "bg-blue-500" : pct >= 40 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 w-44 shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2.5">
        <div className={`h-2.5 rounded-full ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <span className="text-sm font-medium w-12 text-right">{score}</span>
    </div>
  );
}

function Section({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors">
        <span className="font-medium text-gray-900">{title}</span>
        <span className="text-gray-400">{open ? "▲" : "▼"}</span>
      </button>
      {open && <div className="p-4 space-y-3">{children}</div>}
    </div>
  );
}

export function TherapeuticCareDashboardWidget() {
  const [data, setData] = useState<TherapeuticCareIntelligence | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/therapeutic-care")
      .then((res) => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json(); })
      .then((json) => setData(json.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-2/3" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="grid grid-cols-4 gap-4">{[1, 2, 3, 4].map((i) => <div key={i} className="h-20 bg-gray-200 rounded" />)}</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
        <h3 className="text-lg font-semibold text-red-800">Therapeutic Care</h3>
        <p className="text-red-600 mt-2">Failed to load: {error}</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Therapeutic Care</h3>
          <p className="text-sm text-gray-500 mt-1">{data.periodStart} to {data.periodEnd}</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-gray-900">{data.overallScore}</div>
          <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${ratingColors[data.rating] || ""}`}>
            {ratingLabels[data.rating] || data.rating}
          </span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.sessionQuality.totalSessions}</div>
          <div className="text-xs text-gray-500 mt-1">Sessions</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{formatRate(data.sessionQuality.attendanceRate)}</div>
          <div className="text-xs text-gray-500 mt-1">Attendance</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{formatRate(data.sessionQuality.positiveOutcomeRate)}</div>
          <div className="text-xs text-gray-500 mt-1">Positive Outcomes</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.referralEfficiency.averageWaitTimeDays}</div>
          <div className="text-xs text-gray-500 mt-1">Avg Wait (days)</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className={`text-2xl font-bold ${data.referralEfficiency.waitlistedCount === 0 ? "text-green-600" : "text-amber-600"}`}>
            {data.referralEfficiency.waitlistedCount}
          </div>
          <div className="text-xs text-gray-500 mt-1">Waitlisted</div>
        </div>
      </div>

      {/* Component Scores */}
      <div className="space-y-2">
        <ScoreBar score={data.sessionQuality.overallScore} label="Session Quality" maxScore={25} />
        <ScoreBar score={data.referralEfficiency.overallScore} label="Referral Efficiency" maxScore={25} />
        <ScoreBar score={data.therapyPlanning.overallScore} label="Therapy Planning" maxScore={25} />
        <ScoreBar score={data.therapeuticEnvironment.overallScore} label="Environment" maxScore={25} />
      </div>

      {/* Sections */}
      <div className="space-y-3">
        <Section title="Session Quality" defaultOpen>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Total Sessions:</span> <span className="font-medium">{data.sessionQuality.totalSessions}</span></div>
            <div><span className="text-gray-500">Attendance:</span> <span className="font-medium">{formatRate(data.sessionQuality.attendanceRate)}</span></div>
            <div><span className="text-gray-500">Positive Outcomes:</span> <span className="font-medium">{formatRate(data.sessionQuality.positiveOutcomeRate)}</span></div>
            <div><span className="text-gray-500">Engagement:</span> <span className="font-medium">{formatRate(data.sessionQuality.childEngagementRate)}</span></div>
            <div><span className="text-gray-500">Consent:</span> <span className="font-medium">{formatRate(data.sessionQuality.consentRate)}</span></div>
            <div><span className="text-gray-500">Key Worker Briefed:</span> <span className="font-medium">{formatRate(data.sessionQuality.keyWorkerBriefingRate)}</span></div>
            <div><span className="text-gray-500">Goals Addressed:</span> <span className="font-medium">{formatRate(data.sessionQuality.goalsAddressedRate)}</span></div>
          </div>
        </Section>

        <Section title="Referral Efficiency">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Total Referrals:</span> <span className="font-medium">{data.referralEfficiency.totalReferrals}</span></div>
            <div><span className="text-gray-500">Avg Wait Time:</span> <span className="font-medium">{data.referralEfficiency.averageWaitTimeDays} days</span></div>
            <div><span className="text-gray-500">Acceptance Rate:</span> <span className="font-medium">{formatRate(data.referralEfficiency.acceptanceRate)}</span></div>
            <div><span className="text-gray-500">Active:</span> <span className="font-medium">{data.referralEfficiency.activeReferrals}</span></div>
            <div><span className="text-gray-500">Waitlisted:</span> <span className={`font-medium ${data.referralEfficiency.waitlistedCount === 0 ? "text-green-600" : "text-amber-600"}`}>{data.referralEfficiency.waitlistedCount}</span></div>
          </div>
        </Section>

        <Section title="Therapy Planning">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Plans:</span> <span className="font-medium">{data.therapyPlanning.totalPlans}</span></div>
            <div><span className="text-gray-500">Review Rate:</span> <span className="font-medium">{formatRate(data.therapyPlanning.planReviewRate)}</span></div>
            <div><span className="text-gray-500">Co-Produced:</span> <span className="font-medium">{formatRate(data.therapyPlanning.coProducedRate)}</span></div>
            <div><span className="text-gray-500">Child Views:</span> <span className="font-medium">{formatRate(data.therapyPlanning.childViewsIncludedRate)}</span></div>
            <div><span className="text-gray-500">Goals Achieved:</span> <span className="font-medium">{formatRate(data.therapyPlanning.goalsAchievedRate)}</span></div>
          </div>
        </Section>

        <Section title="Therapeutic Environment">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <div><span className="text-gray-500">Quiet Space:</span> <span className={`font-medium ${data.therapeuticEnvironment.quietSpaceAvailable ? "text-green-600" : "text-red-600"}`}>{data.therapeuticEnvironment.quietSpaceAvailable ? "Available" : "Not Available"}</span></div>
            <div><span className="text-gray-500">Sensory Room:</span> <span className={`font-medium ${data.therapeuticEnvironment.sensoryRoomAvailable ? "text-green-600" : "text-red-600"}`}>{data.therapeuticEnvironment.sensoryRoomAvailable ? "Available" : "Not Available"}</span></div>
            <div><span className="text-gray-500">Outdoor Space:</span> <span className={`font-medium ${data.therapeuticEnvironment.outdoorTherapeuticSpace ? "text-green-600" : "text-amber-600"}`}>{data.therapeuticEnvironment.outdoorTherapeuticSpace ? "Available" : "Not Available"}</span></div>
            <div><span className="text-gray-500">Staff Trained:</span> <span className={`font-medium ${data.therapeuticEnvironment.staffTrained ? "text-green-600" : "text-red-600"}`}>{data.therapeuticEnvironment.staffTrained ? "Yes" : "No"}</span></div>
            <div><span className="text-gray-500">Room Privacy:</span> <span className={`font-medium ${data.therapeuticEnvironment.therapyRoomPrivate ? "text-green-600" : "text-red-600"}`}>{data.therapeuticEnvironment.therapyRoomPrivate ? "Private" : "Not Private"}</span></div>
            <div><span className="text-gray-500">Child Can Request:</span> <span className={`font-medium ${data.therapeuticEnvironment.childCanRequestTherapy ? "text-green-600" : "text-red-600"}`}>{data.therapeuticEnvironment.childCanRequestTherapy ? "Yes" : "No"}</span></div>
          </div>
        </Section>

        <Section title="Strengths, Areas & Actions">
          {data.strengths.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-green-700 mb-1">Strengths</h4>
              <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                {data.strengths.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}
          {data.areasForImprovement.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-amber-700 mb-1">Areas for Improvement</h4>
              <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                {data.areasForImprovement.map((a, i) => <li key={i}>{a}</li>)}
              </ul>
            </div>
          )}
          {data.actions.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-blue-700 mb-1">Recommended Actions</h4>
              <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                {data.actions.map((a, i) => (
                  <li key={i} className={a.startsWith("URGENT") ? "text-red-700 font-medium" : ""}>
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Section>

        <Section title="Regulatory Framework">
          <ul className="text-sm text-gray-600 space-y-1">
            {data.regulatoryLinks.map((link, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">§</span>
                <span>{link}</span>
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </div>
  );
}

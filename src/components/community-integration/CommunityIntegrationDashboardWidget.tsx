"use client";

import { formatRate } from "@/lib/metrics/rate";
import { useState, useEffect } from "react";
import type { CommunityIntegrationIntelligence } from "@/lib/community-integration";

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

export function CommunityIntegrationDashboardWidget() {
  const [data, setData] = useState<CommunityIntegrationIntelligence | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/community-integration")
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
        <h3 className="text-lg font-semibold text-red-800">Community Integration</h3>
        <p className="text-red-600 mt-2">Failed to load: {error}</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Community Integration</h3>
          <p className="text-sm text-gray-500 mt-1">{data.periodStart} to {data.periodEnd}</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-gray-900">{data.overallScore}</div>
          <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${ratingColors[data.rating] || ""}`}>
            {ratingLabels[data.rating] || data.rating}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.activityParticipation.totalActivities}</div>
          <div className="text-xs text-gray-500 mt-1">Total Activities</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{formatRate(data.activityParticipation.regularParticipationRate)}</div>
          <div className="text-xs text-gray-500 mt-1">Regular Participation</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{formatRate(data.socialNetworks.friendshipQualityRate)}</div>
          <div className="text-xs text-gray-500 mt-1">Good Friendships</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.barrierManagement.totalBarriers}</div>
          <div className="text-xs text-gray-500 mt-1">Barriers</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{formatRate(data.inclusionOutcomes.communityBelongingRate)}</div>
          <div className="text-xs text-gray-500 mt-1">Feel Belonging</div>
        </div>
      </div>

      <div className="space-y-2">
        <ScoreBar score={data.activityParticipation.overallScore} label="Activity Participation" maxScore={25} />
        <ScoreBar score={data.socialNetworks.overallScore} label="Social Networks" maxScore={25} />
        <ScoreBar score={data.barrierManagement.overallScore} label="Barrier Management" maxScore={25} />
        <ScoreBar score={data.inclusionOutcomes.overallScore} label="Inclusion Outcomes" maxScore={25} />
      </div>

      <div className="space-y-3">
        {data.childProfiles.length > 0 && (
          <Section title="Child Community Profiles" defaultOpen>
            <div className="space-y-3">
              {data.childProfiles.map((child) => (
                <div key={child.childId} className="border border-gray-100 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{child.childName}</span>
                    <span className="text-sm text-gray-500">{child.overallScore}/10</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div>Activities: <span className="font-medium">{child.activityCount}</span></div>
                    <div>Regular: <span className="font-medium">{child.regularActivityCount}</span></div>
                    <div>Friendships: <span className="font-medium">{String(child.friendshipQuality).replace(/_/g, " ")}</span></div>
                    <div>Barriers: <span className={`font-medium ${child.barriersCount > 0 ? "text-amber-600" : "text-green-600"}`}>{child.barriersCount} ({child.barriersResolvedCount} resolved)</span></div>
                    <div>Community: <span className={`font-medium ${child.feelsPartOfCommunity ? "text-green-600" : child.feelsPartOfCommunity === false ? "text-red-600" : "text-gray-400"}`}>{child.feelsPartOfCommunity === true ? "Belongs" : child.feelsPartOfCommunity === false ? "Isolated" : "N/A"}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        <Section title="Activity Participation">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Total:</span> <span className="font-medium">{data.activityParticipation.totalActivities}</span></div>
            <div><span className="text-gray-500">Regular:</span> <span className="font-medium">{formatRate(data.activityParticipation.regularParticipationRate)}</span></div>
            <div><span className="text-gray-500">Variety:</span> <span className="font-medium">{data.activityParticipation.activityVariety} types</span></div>
            <div><span className="text-gray-500">Community:</span> <span className="font-medium">{formatRate(data.activityParticipation.communityBasedRate)}</span></div>
            <div><span className="text-gray-500">Enjoyment:</span> <span className="font-medium">{formatRate(data.activityParticipation.enjoymentRate)}</span></div>
            <div><span className="text-gray-500">Independent:</span> <span className="font-medium">{formatRate(data.activityParticipation.independentAttendanceRate)}</span></div>
          </div>
        </Section>

        <Section title="Social Networks">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Networks:</span> <span className="font-medium">{data.socialNetworks.totalNetworks}</span></div>
            <div><span className="text-gray-500">Quality:</span> <span className="font-medium">{formatRate(data.socialNetworks.friendshipQualityRate)}</span></div>
            <div><span className="text-gray-500">Outside Care:</span> <span className="font-medium">{formatRate(data.socialNetworks.friendsOutsideCareRate)}</span></div>
            <div><span className="text-gray-500">Mentors:</span> <span className="font-medium">{formatRate(data.socialNetworks.mentorRate)}</span></div>
            <div><span className="text-gray-500">Social Media:</span> <span className="font-medium">{formatRate(data.socialNetworks.socialMediaSafetyRate)}</span></div>
          </div>
        </Section>

        <Section title="Barrier Management">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Total:</span> <span className="font-medium">{data.barrierManagement.totalBarriers}</span></div>
            <div><span className="text-gray-500">Action Taken:</span> <span className="font-medium">{formatRate(data.barrierManagement.actionTakenRate)}</span></div>
            <div><span className="text-gray-500">Resolved:</span> <span className="font-medium">{formatRate(data.barrierManagement.resolutionRate)}</span></div>
          </div>
        </Section>

        <Section title="Inclusion Outcomes">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Assessed:</span> <span className="font-medium">{data.inclusionOutcomes.totalAssessments}</span></div>
            <div><span className="text-gray-500">Belonging:</span> <span className="font-medium">{formatRate(data.inclusionOutcomes.communityBelongingRate)}</span></div>
            <div><span className="text-gray-500">Amenities:</span> <span className="font-medium">{formatRate(data.inclusionOutcomes.amenityAccessRate)}</span></div>
            <div><span className="text-gray-500">Relationships:</span> <span className="font-medium">{formatRate(data.inclusionOutcomes.positiveRelationshipsRate)}</span></div>
            <div><span className="text-gray-500">Travel Skills:</span> <span className="font-medium">{formatRate(data.inclusionOutcomes.independentTravelRate)}</span></div>
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

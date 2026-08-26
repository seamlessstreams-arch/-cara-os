"use client";

import { useState, useEffect } from "react";
import { below, formatRate } from "@/lib/metrics/rate";
import type { PeerMentoringEffectivenessIntelligence } from "@/lib/peer-mentoring-effectiveness";

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
  const pctVal = (score / maxScore) * 100;
  const color = pctVal >= 80 ? "bg-green-500" : pctVal >= 60 ? "bg-blue-500" : pctVal >= 40 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 w-44 shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2.5">
        <div className={`h-2.5 rounded-full ${color}`} style={{ width: `${Math.min(pctVal, 100)}%` }} />
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

export function PeerMentoringEffectivenessDashboardWidget() {
  const [data, setData] = useState<PeerMentoringEffectivenessIntelligence | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/peer-mentoring-effectiveness")
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
        <h3 className="text-lg font-semibold text-red-800">Peer Mentoring Effectiveness</h3>
        <p className="text-red-600 mt-2">Failed to load: {error}</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Peer Mentoring Effectiveness</h3>
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
          <div className="text-2xl font-bold text-gray-900">{data.pairingQuality.totalPairings}</div>
          <div className="text-xs text-gray-500 mt-1">Pairings</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.sessionEffectiveness.totalSessions}</div>
          <div className="text-xs text-gray-500 mt-1">Sessions</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{formatRate(data.sessionEffectiveness.positiveOutcomeRate)}</div>
          <div className="text-xs text-gray-500 mt-1">Positive</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{formatRate(data.relationshipSafeguarding.noSafeguardingConcernRate)}</div>
          <div className="text-xs text-gray-500 mt-1">No Concerns</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{formatRate(data.pairingQuality.consentRate)}</div>
          <div className="text-xs text-gray-500 mt-1">Consented</div>
        </div>
      </div>

      <div className="space-y-2">
        <ScoreBar score={data.pairingQuality.overallScore} label="Pairing Quality" maxScore={25} />
        <ScoreBar score={data.sessionEffectiveness.overallScore} label="Session Effectiveness" maxScore={25} />
        <ScoreBar score={data.relationshipSafeguarding.overallScore} label="Relationship Safeguarding" maxScore={25} />
        <ScoreBar score={data.staffSupport.overallScore} label="Staff Support" maxScore={25} />
      </div>

      <div className="space-y-3">
        {data.childProfiles.length > 0 && (
          <Section title="Child Mentoring Profiles" defaultOpen>
            <div className="space-y-3">
              {data.childProfiles.map((child) => (
                <div key={child.childId} className="border border-gray-100 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{child.childName}</span>
                    <span className="text-sm font-medium text-gray-600">{child.overallScore}/10</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div>Roles: <span className="font-medium">{child.roles.join(", ")}</span></div>
                    <div>Pairings: <span className="font-medium">{child.pairingsCount}</span></div>
                    <div>Sessions: <span className="font-medium">{child.sessionsInPeriod}</span></div>
                    <div>Positive: <span className="font-medium">{child.positiveOutcomeRate}%</span></div>
                    <div>Concerns: <span className={`font-medium ${child.safeguardingConcerns > 0 ? "text-red-600" : "text-green-600"}`}>{child.safeguardingConcerns}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        <Section title="Pairing Quality">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Pairings:</span> <span className="font-medium">{data.pairingQuality.totalPairings}</span></div>
            <div><span className="text-gray-500">Consent:</span> <span className="font-medium">{formatRate(data.pairingQuality.consentRate)}</span></div>
            <div><span className="text-gray-500">Risk Assessed:</span> <span className="font-medium">{formatRate(data.pairingQuality.riskAssessedRate)}</span></div>
            <div><span className="text-gray-500">Match Criteria:</span> <span className="font-medium">{formatRate(data.pairingQuality.matchCriteriaDefinedRate)}</span></div>
            <div><span className="text-gray-500">Active:</span> <span className="font-medium">{formatRate(data.pairingQuality.activePairingRate)}</span></div>
          </div>
        </Section>

        <Section title="Session Effectiveness">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Sessions:</span> <span className="font-medium">{data.sessionEffectiveness.totalSessions}</span></div>
            <div><span className="text-gray-500">Positive:</span> <span className="font-medium">{formatRate(data.sessionEffectiveness.positiveOutcomeRate)}</span></div>
            <div><span className="text-gray-500">Goals:</span> <span className="font-medium">{formatRate(data.sessionEffectiveness.goalsDiscussedRate)}</span></div>
            <div><span className="text-gray-500">Progress:</span> <span className="font-medium">{formatRate(data.sessionEffectiveness.progressMadeRate)}</span></div>
            <div><span className="text-gray-500">Regular:</span> <span className="font-medium">{formatRate(data.sessionEffectiveness.regularSessionRate)}</span></div>
          </div>
        </Section>

        <Section title="Relationship Safeguarding">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Reviews:</span> <span className="font-medium">{data.relationshipSafeguarding.totalReviews}</span></div>
            <div><span className="text-gray-500">Healthy:</span> <span className="font-medium">{formatRate(data.relationshipSafeguarding.healthyRelationshipRate)}</span></div>
            <div><span className="text-gray-500">Boundaries:</span> <span className="font-medium">{formatRate(data.relationshipSafeguarding.boundariesRespectedRate)}</span></div>
            <div><span className="text-gray-500">No Concerns:</span> <span className={`font-medium ${below(data.relationshipSafeguarding.noSafeguardingConcernRate, 100) ? "text-amber-600" : "text-green-600"}`}>{formatRate(data.relationshipSafeguarding.noSafeguardingConcernRate)}</span></div>
            <div><span className="text-gray-500">Both Benefit:</span> <span className="font-medium">{formatRate(data.relationshipSafeguarding.bothBenefitingRate)}</span></div>
          </div>
        </Section>

        <Section title="Staff Support">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Staff:</span> <span className="font-medium">{data.staffSupport.totalStaff}</span></div>
            <div><span className="text-gray-500">Mentoring:</span> <span className="font-medium">{formatRate(data.staffSupport.peerMentoringTrainedRate)}</span></div>
            <div><span className="text-gray-500">Safeguarding:</span> <span className="font-medium">{formatRate(data.staffSupport.safeguardingInPeerRate)}</span></div>
            <div><span className="text-gray-500">Conflict:</span> <span className="font-medium">{formatRate(data.staffSupport.conflictResolutionRate)}</span></div>
            <div><span className="text-gray-500">Boundaries:</span> <span className="font-medium">{formatRate(data.staffSupport.boundarySettingRate)}</span></div>
            <div><span className="text-gray-500">Supporting:</span> <span className="font-medium">{formatRate(data.staffSupport.supportingMentorsRate)}</span></div>
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

"use client";

import { useState, useEffect } from "react";
import type { IndependenceLifeSkillsIntelligence } from "@/lib/independence-life-skills";

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

export function IndependenceLifeSkillsDashboardWidget() {
  const [data, setData] = useState<IndependenceLifeSkillsIntelligence | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/independence-life-skills")
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
        <h3 className="text-lg font-semibold text-red-800">Independence & Life Skills</h3>
        <p className="text-red-600 mt-2">Failed to load: {error}</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Independence & Life Skills</h3>
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
          <div className="text-2xl font-bold text-gray-900">{data.skillDevelopment.totalAssessments}</div>
          <div className="text-xs text-gray-500 mt-1">Assessments</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.skillDevelopment.independentMostlyRate}%</div>
          <div className="text-xs text-gray-500 mt-1">Independent</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.goalProgress.achievedOnTrackRate}%</div>
          <div className="text-xs text-gray-500 mt-1">Goals On Track</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.practicalLearning.totalSessions}</div>
          <div className="text-xs text-gray-500 mt-1">Sessions</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.pathwayPreparation.pathwayPlanRate}%</div>
          <div className="text-xs text-gray-500 mt-1">Pathway Plans</div>
        </div>
      </div>

      <div className="space-y-2">
        <ScoreBar score={data.skillDevelopment.overallScore} label="Skill Development" maxScore={25} />
        <ScoreBar score={data.goalProgress.overallScore} label="Goal Progress" maxScore={25} />
        <ScoreBar score={data.practicalLearning.overallScore} label="Practical Learning" maxScore={25} />
        <ScoreBar score={data.pathwayPreparation.overallScore} label="Pathway Preparation" maxScore={25} />
      </div>

      <div className="space-y-3">
        {data.childProfiles.length > 0 && (
          <Section title="Child Independence Profiles" defaultOpen>
            <div className="space-y-3">
              {data.childProfiles.map((child) => (
                <div key={child.childId} className="border border-gray-100 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{child.childName}</span>
                    <span className="text-sm text-gray-500">{child.overallScore}/10</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div>Domains: <span className="font-medium">{child.domainsAssessed}</span></div>
                    <div>Independent: <span className="font-medium">{child.independentDomains}</span></div>
                    <div>Goals: <span className="font-medium">{child.goalsAchieved}/{child.goalCount}</span></div>
                    <div>Sessions: <span className="font-medium">{child.sessionCount}</span></div>
                    <div>Pathway: <span className={`font-medium ${child.hasPathwayPlan ? "text-green-600" : "text-red-600"}`}>{child.hasPathwayPlan ? "Yes" : "No"}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        <Section title="Skill Development">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Assessments:</span> <span className="font-medium">{data.skillDevelopment.totalAssessments}</span></div>
            <div><span className="text-gray-500">Independent:</span> <span className="font-medium">{data.skillDevelopment.independentMostlyRate}%</span></div>
            <div><span className="text-gray-500">Improving:</span> <span className="font-medium">{data.skillDevelopment.improvementRate}%</span></div>
            <div><span className="text-gray-500">Domains:</span> <span className="font-medium">{data.skillDevelopment.domainsAssessed}</span></div>
            <div><span className="text-gray-500">Avg/Child:</span> <span className="font-medium">{data.skillDevelopment.averageDomainsPerChild}</span></div>
            <div><span className="text-gray-500">Not Started:</span> <span className={`font-medium ${data.skillDevelopment.notYetStartedCount > 0 ? "text-amber-600" : "text-green-600"}`}>{data.skillDevelopment.notYetStartedCount}</span></div>
          </div>
        </Section>

        <Section title="Goal Progress">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Goals:</span> <span className="font-medium">{data.goalProgress.totalGoals}</span></div>
            <div><span className="text-gray-500">On Track:</span> <span className="font-medium">{data.goalProgress.achievedOnTrackRate}%</span></div>
            <div><span className="text-gray-500">Behind:</span> <span className={`font-medium ${data.goalProgress.behindCount > 0 ? "text-amber-600" : "text-green-600"}`}>{data.goalProgress.behindCount}</span></div>
            <div><span className="text-gray-500">Abandoned:</span> <span className={`font-medium ${data.goalProgress.abandonedCount > 0 ? "text-red-600" : "text-green-600"}`}>{data.goalProgress.abandonedCount}</span></div>
            <div><span className="text-gray-500">Child Involved:</span> <span className="font-medium">{data.goalProgress.childInvolvementRate}%</span></div>
            <div><span className="text-gray-500">Age Appropriate:</span> <span className="font-medium">{data.goalProgress.ageAppropriateRate}%</span></div>
          </div>
        </Section>

        <Section title="Practical Learning">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Sessions:</span> <span className="font-medium">{data.practicalLearning.totalSessions}</span></div>
            <div><span className="text-gray-500">Engagement:</span> <span className="font-medium">{data.practicalLearning.engagementRate}%</span></div>
            <div><span className="text-gray-500">Progress:</span> <span className="font-medium">{data.practicalLearning.progressRate}%</span></div>
            <div><span className="text-gray-500">Community:</span> <span className="font-medium">{data.practicalLearning.communityBasedRate}%</span></div>
            <div><span className="text-gray-500">Avg Duration:</span> <span className="font-medium">{data.practicalLearning.averageDurationMinutes}min</span></div>
            <div><span className="text-gray-500">Methods:</span> <span className="font-medium">{data.practicalLearning.teachingMethodVariety}</span></div>
            <div><span className="text-gray-500">Active Domains:</span> <span className="font-medium">{data.practicalLearning.domainsActive}</span></div>
          </div>
        </Section>

        <Section title="Pathway Preparation">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Children:</span> <span className="font-medium">{data.pathwayPreparation.totalChildren}</span></div>
            <div><span className="text-gray-500">Plans:</span> <span className="font-medium">{data.pathwayPreparation.pathwayPlanRate}%</span></div>
            <div><span className="text-gray-500">Independence:</span> <span className="font-medium">{data.pathwayPreparation.independenceSectionRate}%</span></div>
            <div><span className="text-gray-500">Accommodation:</span> <span className="font-medium">{data.pathwayPreparation.accommodationPlannedRate}%</span></div>
            <div><span className="text-gray-500">Finance:</span> <span className="font-medium">{data.pathwayPreparation.financialLiteracyRate}%</span></div>
            <div><span className="text-gray-500">Health:</span> <span className="font-medium">{data.pathwayPreparation.healthPassportRate}%</span></div>
            <div><span className="text-gray-500">Child Input:</span> <span className="font-medium">{data.pathwayPreparation.childContributionRate}%</span></div>
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

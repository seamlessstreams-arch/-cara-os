"use client";

import { useState, useEffect } from "react";
import type { TransitionPathwayPlanningIntelligence } from "@/lib/transition-pathway-planning";

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

const transitionTypeLabels: Record<string, string> = {
  leaving_care: "Leaving Care",
  step_down: "Step Down",
  foster_care: "Foster Care",
  semi_independence: "Semi-Independence",
  supported_living: "Supported Living",
  return_home: "Return Home",
  adoption: "Adoption",
  other: "Other",
};

const pathwayStatusLabels: Record<string, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  on_track: "On Track",
  at_risk: "At Risk",
  completed: "Completed",
};

function ScoreBar({ score, label, maxScore = 100 }: { score: number; label: string; maxScore?: number }) {
  const pctVal = (score / maxScore) * 100;
  const color = pctVal >= 80 ? "bg-green-500" : pctVal >= 60 ? "bg-blue-500" : pctVal >= 40 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 w-48 shrink-0">{label}</span>
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

export function TransitionPathwayPlanningDashboardWidget() {
  const [data, setData] = useState<TransitionPathwayPlanningIntelligence | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/transition-pathway-planning")
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
        <h3 className="text-lg font-semibold text-red-800">Transition Pathway Planning</h3>
        <p className="text-red-600 mt-2">Failed to load: {error}</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Transition Pathway Planning</h3>
          <p className="text-sm text-gray-500 mt-1">{data.periodStart} to {data.periodEnd}</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-gray-900">{data.overallScore}</div>
          <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${ratingColors[data.rating] || ""}`}>
            {ratingLabels[data.rating] || data.rating}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.childProfiles.length}</div>
          <div className="text-xs text-gray-500 mt-1">Children</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.pathwayPlanning.totalPlans}</div>
          <div className="text-xs text-gray-500 mt-1">Pathway Plans</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.independenceSkills.totalAssessments}</div>
          <div className="text-xs text-gray-500 mt-1">Skill Assessments</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.transitionMeetings.totalMeetings}</div>
          <div className="text-xs text-gray-500 mt-1">Meetings</div>
        </div>
      </div>

      <div className="space-y-2">
        <ScoreBar score={data.pathwayPlanning.overallScore} label="Pathway Planning" maxScore={25} />
        <ScoreBar score={data.independenceSkills.overallScore} label="Independence Skills" maxScore={25} />
        <ScoreBar score={data.transitionMeetings.overallScore} label="Transition Meetings" maxScore={25} />
        <ScoreBar score={data.staffTransitionReadiness.overallScore} label="Staff Readiness" maxScore={25} />
      </div>

      <div className="space-y-3">
        {data.childProfiles.length > 0 && (
          <Section title="Child Transition Profiles" defaultOpen>
            <div className="space-y-3">
              {data.childProfiles.map((child) => (
                <div key={child.childId} className="border border-gray-100 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{child.childName}</span>
                    <span className="text-sm font-medium text-gray-600">{child.overallScore}/10</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div>Type: <span className="font-medium">{transitionTypeLabels[child.transitionType] || child.transitionType}</span></div>
                    <div>Status: <span className={`font-medium ${child.pathwayStatus === "at_risk" ? "text-red-600" : child.pathwayStatus === "on_track" || child.pathwayStatus === "completed" ? "text-green-600" : "text-amber-600"}`}>{pathwayStatusLabels[child.pathwayStatus] || child.pathwayStatus}</span></div>
                    <div>Skills Assessed: <span className="font-medium">{child.skillAssessmentCount}</span></div>
                    <div>Meetings: <span className="font-medium">{child.meetingCount}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        <Section title="Pathway Planning">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <div><span className="text-gray-500">Plans:</span> <span className="font-medium">{data.pathwayPlanning.totalPlans}</span></div>
            <div><span className="text-gray-500">Personal Adviser:</span> <span className="font-medium">{data.pathwayPlanning.personalAdviserRate}%</span></div>
            <div><span className="text-gray-500">Regularly Reviewed:</span> <span className="font-medium">{data.pathwayPlanning.planReviewedRate}%</span></div>
            <div><span className="text-gray-500">Child Views:</span> <span className="font-medium">{data.pathwayPlanning.childViewsRate}%</span></div>
            <div><span className="text-gray-500">Accommodation:</span> <span className="font-medium">{data.pathwayPlanning.accommodationRate}%</span></div>
            <div><span className="text-gray-500">Financial Plan:</span> <span className="font-medium">{data.pathwayPlanning.financialPlanRate}%</span></div>
            <div><span className="text-gray-500">Health Passport:</span> <span className="font-medium">{data.pathwayPlanning.healthPassportRate}%</span></div>
          </div>
        </Section>

        <Section title="Independence Skills">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Assessments:</span> <span className="font-medium">{data.independenceSkills.totalAssessments}</span></div>
            <div><span className="text-gray-500">Competent+:</span> <span className="font-medium">{data.independenceSkills.competentPlusRate}%</span></div>
            <div><span className="text-gray-500">Support in Place:</span> <span className="font-medium">{data.independenceSkills.supportInPlaceRate}%</span></div>
            <div><span className="text-gray-500">Progress Recorded:</span> <span className="font-medium">{data.independenceSkills.progressRecordedRate}%</span></div>
          </div>
        </Section>

        <Section title="Transition Meetings">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <div><span className="text-gray-500">Meetings:</span> <span className="font-medium">{data.transitionMeetings.totalMeetings}</span></div>
            <div><span className="text-gray-500">Child Attended:</span> <span className="font-medium">{data.transitionMeetings.childAttendedRate}%</span></div>
            <div><span className="text-gray-500">Minutes Recorded:</span> <span className="font-medium">{data.transitionMeetings.minutesRecordedRate}%</span></div>
            <div><span className="text-gray-500">Actions Agreed:</span> <span className="font-medium">{data.transitionMeetings.actionsAgreedRate}%</span></div>
            <div><span className="text-gray-500">SW Present:</span> <span className={`font-medium ${data.transitionMeetings.socialWorkerPresentRate < 100 ? "text-amber-600" : "text-green-600"}`}>{data.transitionMeetings.socialWorkerPresentRate}%</span></div>
            <div><span className="text-gray-500">Next Scheduled:</span> <span className="font-medium">{data.transitionMeetings.nextMeetingScheduledRate}%</span></div>
          </div>
        </Section>

        <Section title="Staff Transition Readiness">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <div><span className="text-gray-500">Staff:</span> <span className="font-medium">{data.staffTransitionReadiness.totalStaff}</span></div>
            <div><span className="text-gray-500">Leaving Care Policy:</span> <span className="font-medium">{data.staffTransitionReadiness.leavingCarePolicyRate}%</span></div>
            <div><span className="text-gray-500">Pathway Planning:</span> <span className="font-medium">{data.staffTransitionReadiness.pathwayPlanningRate}%</span></div>
            <div><span className="text-gray-500">Independence Skills:</span> <span className="font-medium">{data.staffTransitionReadiness.independenceSkillsRate}%</span></div>
            <div><span className="text-gray-500">Housing Options:</span> <span className="font-medium">{data.staffTransitionReadiness.housingOptionsRate}%</span></div>
            <div><span className="text-gray-500">Financial Capability:</span> <span className="font-medium">{data.staffTransitionReadiness.financialCapabilityRate}%</span></div>
            <div><span className="text-gray-500">Emotional Support:</span> <span className="font-medium">{data.staffTransitionReadiness.emotionalSupportRate}%</span></div>
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

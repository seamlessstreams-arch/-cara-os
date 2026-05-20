"use client";

import { useEffect, useState } from "react";

// -- Local types (mirror engine result shape) ----------------------------------

interface IndependenceQualityResult {
  overallScore: number;
  totalRecords: number;
  individualPlanRate: number;
  ageAppropriateRate: number;
  childEngagedRate: number;
  progressRecordedRate: number;
}

interface IndependenceComplianceResult {
  overallScore: number;
  totalRecords: number;
  documentationCompleteRate: number;
  pathwayPlanAlignedRate: number;
  positiveOutcomeRate: number;
  categoryDiversityRate: number;
}

interface IndependencePolicyResult {
  overallScore: number;
  independencePolicyMet: boolean;
  pathwayPlanningGuidanceMet: boolean;
  lifeSkillsFrameworkMet: boolean;
  transitionProtocolMet: boolean;
  leavingCarePreparationMet: boolean;
  partnershipWorkingPolicyMet: boolean;
  reviewScheduleMet: boolean;
}

interface StaffIndependenceReadinessResult {
  overallScore: number;
  totalStaff: number;
  independencePlanningRate: number;
  lifeSkillsTeachingRate: number;
  pathwayKnowledgeRate: number;
  motivationalSkillsRate: number;
  communityResourcesRate: number;
  transitionSupportRate: number;
}

interface ChildProfile {
  childId: string;
  childName: string;
  totalRecords: number;
  individualPlanRate: number;
  childEngagedRate: number;
  uniqueCategories: number;
  overallScore: number;
}

interface IndependenceData {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: string;
  independenceQuality: IndependenceQualityResult;
  independenceCompliance: IndependenceComplianceResult;
  independencePolicy: IndependencePolicyResult;
  staffIndependenceReadiness: StaffIndependenceReadinessResult;
  childProfiles: ChildProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// -- Inline helpers ------------------------------------------------------------

const ratingColour: Record<string, string> = {
  outstanding: "bg-green-100 text-green-800 border-green-300",
  good: "bg-blue-100 text-blue-800 border-blue-300",
  requires_improvement: "bg-amber-100 text-amber-800 border-amber-300",
  inadequate: "bg-red-100 text-red-800 border-red-300",
};

const ratingLabel: Record<string, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

function boolBadge(value: boolean): string {
  return value ? "text-green-700 bg-green-50" : "text-red-700 bg-red-50";
}

// -- Inline components ---------------------------------------------------------

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

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <span className="text-gray-500">{label}:</span> <span className="font-medium">{value}</span>
    </div>
  );
}

// -- Main widget ---------------------------------------------------------------

export default function IndependenceDashboardWidget() {
  const [data, setData] = useState<IndependenceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/independence")
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
        <h3 className="text-lg font-semibold text-red-800">Independence</h3>
        <p className="text-red-600 mt-2">Failed to load: {error}</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Independence</h3>
          <p className="text-sm text-gray-500 mt-1">{data.periodStart} to {data.periodEnd}</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-gray-900">{data.overallScore}</div>
          <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${ratingColour[data.rating] || ""}`}>
            {ratingLabel[data.rating] || data.rating}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.independenceQuality.totalRecords}</div>
          <div className="text-xs text-gray-500 mt-1">Assessments</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.independenceQuality.childEngagedRate}%</div>
          <div className="text-xs text-gray-500 mt-1">Engagement</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.independenceCompliance.positiveOutcomeRate}%</div>
          <div className="text-xs text-gray-500 mt-1">Positive Outcomes</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.staffIndependenceReadiness.totalStaff}</div>
          <div className="text-xs text-gray-500 mt-1">Staff Trained</div>
        </div>
      </div>

      <div className="space-y-2">
        <ScoreBar score={data.independenceQuality.overallScore} label="Independence Quality" maxScore={25} />
        <ScoreBar score={data.independenceCompliance.overallScore} label="Independence Compliance" maxScore={25} />
        <ScoreBar score={data.independencePolicy.overallScore} label="Independence Policy" maxScore={25} />
        <ScoreBar score={data.staffIndependenceReadiness.overallScore} label="Staff Readiness" maxScore={25} />
      </div>

      <div className="space-y-3">
        {data.childProfiles.length > 0 && (
          <Section title="Child Independence Profiles" defaultOpen>
            <div className="space-y-3">
              {data.childProfiles.map((child) => (
                <div key={child.childId} className="border border-gray-100 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{child.childName}</span>
                    <span className="text-sm font-medium text-gray-600">{child.overallScore}/10</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div>Records: <span className="font-medium">{child.totalRecords}</span></div>
                    <div>Plan Rate: <span className="font-medium">{child.individualPlanRate}%</span></div>
                    <div>Engaged: <span className="font-medium">{child.childEngagedRate}%</span></div>
                    <div>Categories: <span className="font-medium">{child.uniqueCategories}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        <Section title="Independence Quality">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <Stat label="Assessments" value={data.independenceQuality.totalRecords} />
            <Stat label="Individual Plans" value={`${data.independenceQuality.individualPlanRate}%`} />
            <Stat label="Age Appropriate" value={`${data.independenceQuality.ageAppropriateRate}%`} />
            <Stat label="Child Engaged" value={`${data.independenceQuality.childEngagedRate}%`} />
            <Stat label="Progress Recorded" value={`${data.independenceQuality.progressRecordedRate}%`} />
          </div>
        </Section>

        <Section title="Independence Compliance">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <Stat label="Documentation" value={`${data.independenceCompliance.documentationCompleteRate}%`} />
            <Stat label="Pathway Aligned" value={`${data.independenceCompliance.pathwayPlanAlignedRate}%`} />
            <Stat label="Positive Outcomes" value={`${data.independenceCompliance.positiveOutcomeRate}%`} />
            <Stat label="Category Diversity" value={`${data.independenceCompliance.categoryDiversityRate}%`} />
          </div>
        </Section>

        <Section title="Independence Policy">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${boolBadge(data.independencePolicy.independencePolicyMet)}`}>{data.independencePolicy.independencePolicyMet ? "Yes" : "No"}</span> Independence Policy</div>
            <div><span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${boolBadge(data.independencePolicy.pathwayPlanningGuidanceMet)}`}>{data.independencePolicy.pathwayPlanningGuidanceMet ? "Yes" : "No"}</span> Pathway Planning</div>
            <div><span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${boolBadge(data.independencePolicy.lifeSkillsFrameworkMet)}`}>{data.independencePolicy.lifeSkillsFrameworkMet ? "Yes" : "No"}</span> Life Skills Framework</div>
            <div><span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${boolBadge(data.independencePolicy.transitionProtocolMet)}`}>{data.independencePolicy.transitionProtocolMet ? "Yes" : "No"}</span> Transition Protocol</div>
            <div><span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${boolBadge(data.independencePolicy.leavingCarePreparationMet)}`}>{data.independencePolicy.leavingCarePreparationMet ? "Yes" : "No"}</span> Leaving Care Prep</div>
            <div><span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${boolBadge(data.independencePolicy.partnershipWorkingPolicyMet)}`}>{data.independencePolicy.partnershipWorkingPolicyMet ? "Yes" : "No"}</span> Partnership Working</div>
            <div><span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${boolBadge(data.independencePolicy.reviewScheduleMet)}`}>{data.independencePolicy.reviewScheduleMet ? "Yes" : "No"}</span> Review Schedule</div>
          </div>
        </Section>

        <Section title="Staff Independence Readiness">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <Stat label="Staff" value={data.staffIndependenceReadiness.totalStaff} />
            <Stat label="Independence Planning" value={`${data.staffIndependenceReadiness.independencePlanningRate}%`} />
            <Stat label="Life Skills Teaching" value={`${data.staffIndependenceReadiness.lifeSkillsTeachingRate}%`} />
            <Stat label="Pathway Knowledge" value={`${data.staffIndependenceReadiness.pathwayKnowledgeRate}%`} />
            <Stat label="Motivational Skills" value={`${data.staffIndependenceReadiness.motivationalSkillsRate}%`} />
            <Stat label="Community Resources" value={`${data.staffIndependenceReadiness.communityResourcesRate}%`} />
            <Stat label="Transition Support" value={`${data.staffIndependenceReadiness.transitionSupportRate}%`} />
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

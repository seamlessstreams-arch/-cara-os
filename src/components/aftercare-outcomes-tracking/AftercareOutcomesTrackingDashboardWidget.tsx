"use client";

import { useState, useEffect } from "react";
import { above, below, formatRate } from "@/lib/metrics/rate";
import type { AftercareOutcomesTrackingIntelligence } from "@/lib/aftercare-outcomes-tracking";

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

const housingStatusLabels: Record<string, string> = {
  stable: "Stable",
  temporary: "Temporary",
  homeless: "Homeless",
  supported_housing: "Supported Housing",
  returned_home: "Returned Home",
  unknown: "Unknown",
};

const eteLabels: Record<string, string> = {
  employed: "Employed",
  in_education: "In Education",
  training: "Training",
  neet: "NEET",
  volunteering: "Volunteering",
  unknown: "Unknown",
};

const wellbeingLabels: Record<string, string> = {
  thriving: "Thriving",
  stable: "Stable",
  struggling: "Struggling",
  crisis: "Crisis",
  unknown: "Unknown",
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

export function AftercareOutcomesTrackingDashboardWidget() {
  const [data, setData] = useState<AftercareOutcomesTrackingIntelligence | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/aftercare-outcomes-tracking")
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
        <h3 className="text-lg font-semibold text-red-800">Aftercare Outcomes Tracking</h3>
        <p className="text-red-600 mt-2">Failed to load: {error}</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Aftercare Outcomes Tracking</h3>
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
          <div className="text-2xl font-bold text-gray-900">{data.childProfiles.length}</div>
          <div className="text-xs text-gray-500 mt-1">Care Leavers</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.keepingInTouch.totalContacts}</div>
          <div className="text-xs text-gray-500 mt-1">Contacts</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{formatRate(data.housingStability.stableHousingRate)}</div>
          <div className="text-xs text-gray-500 mt-1">Stable Housing</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{formatRate(data.educationEmployment.engagedRate)}</div>
          <div className="text-xs text-gray-500 mt-1">ETE Engaged</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{formatRate(data.wellbeingSupport.thrivingStableRate)}</div>
          <div className="text-xs text-gray-500 mt-1">Thriving/Stable</div>
        </div>
      </div>

      <div className="space-y-2">
        <ScoreBar score={data.keepingInTouch.overallScore} label="Keeping in Touch" maxScore={25} />
        <ScoreBar score={data.housingStability.overallScore} label="Housing Stability" maxScore={25} />
        <ScoreBar score={data.educationEmployment.overallScore} label="Education & Employment" maxScore={25} />
        <ScoreBar score={data.wellbeingSupport.overallScore} label="Wellbeing & Support" maxScore={25} />
      </div>

      <div className="space-y-3">
        {data.childProfiles.length > 0 && (
          <Section title="Care Leaver Profiles" defaultOpen>
            <div className="space-y-3">
              {data.childProfiles.map((child) => (
                <div key={child.childId} className="border border-gray-100 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{child.childName}</span>
                    <span className="text-sm font-medium text-gray-600">{child.overallScore}/10</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div>Housing: <span className={`font-medium ${child.housingStatus === "homeless" ? "text-red-600" : child.housingStatus === "stable" || child.housingStatus === "returned_home" ? "text-green-600" : "text-amber-600"}`}>{housingStatusLabels[child.housingStatus] || child.housingStatus}</span></div>
                    <div>ETE: <span className={`font-medium ${child.employmentEducationStatus === "neet" ? "text-red-600" : child.employmentEducationStatus === "employed" || child.employmentEducationStatus === "in_education" ? "text-green-600" : "text-amber-600"}`}>{eteLabels[child.employmentEducationStatus] || child.employmentEducationStatus}</span></div>
                    <div>Wellbeing: <span className={`font-medium ${child.wellbeingRating === "crisis" ? "text-red-600" : child.wellbeingRating === "thriving" || child.wellbeingRating === "stable" ? "text-green-600" : "text-amber-600"}`}>{wellbeingLabels[child.wellbeingRating] || child.wellbeingRating}</span></div>
                    <div>Contacts: <span className="font-medium">{child.contactCount}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        <Section title="Keeping in Touch">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Contacts:</span> <span className="font-medium">{data.keepingInTouch.totalContacts}</span></div>
            <div><span className="text-gray-500">Regular Rate:</span> <span className="font-medium">{formatRate(data.keepingInTouch.regularContactRate)}</span></div>
            <div><span className="text-gray-500">Child Initiated:</span> <span className="font-medium">{formatRate(data.keepingInTouch.childInitiatedRate)}</span></div>
            <div><span className="text-gray-500">Concerns Followed Up:</span> <span className={`font-medium ${below(data.keepingInTouch.concernsFollowedUpRate, 100) && data.keepingInTouch.totalContacts > 0 ? "text-amber-600" : "text-green-600"}`}>{formatRate(data.keepingInTouch.concernsFollowedUpRate)}</span></div>
            <div><span className="text-gray-500">Wellbeing Recorded:</span> <span className="font-medium">{formatRate(data.keepingInTouch.wellbeingRecordedRate)}</span></div>
          </div>
        </Section>

        <Section title="Housing Stability">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Leavers:</span> <span className="font-medium">{data.housingStability.totalLeavers}</span></div>
            <div><span className="text-gray-500">Stable Housing:</span> <span className="font-medium">{formatRate(data.housingStability.stableHousingRate)}</span></div>
            <div><span className="text-gray-500">Pathway Plan:</span> <span className="font-medium">{formatRate(data.housingStability.pathwayPlanRate)}</span></div>
            <div><span className="text-gray-500">Personal Adviser:</span> <span className="font-medium">{formatRate(data.housingStability.personalAdviserRate)}</span></div>
            <div><span className="text-gray-500">Homeless:</span> <span className={`font-medium ${above(data.housingStability.homelessnessRate, 0) ? "text-red-600" : "text-green-600"}`}>{formatRate(data.housingStability.homelessnessRate)}</span></div>
          </div>
        </Section>

        <Section title="Education & Employment">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Leavers:</span> <span className="font-medium">{data.educationEmployment.totalLeavers}</span></div>
            <div><span className="text-gray-500">ETE Engaged:</span> <span className="font-medium">{formatRate(data.educationEmployment.engagedRate)}</span></div>
            <div><span className="text-gray-500">NEET Rate:</span> <span className={`font-medium ${above(data.educationEmployment.neetRate, 0) ? "text-red-600" : "text-green-600"}`}>{formatRate(data.educationEmployment.neetRate)}</span></div>
            <div><span className="text-gray-500">In Education:</span> <span className="font-medium">{formatRate(data.educationEmployment.educationContinuedRate)}</span></div>
            <div><span className="text-gray-500">In Training:</span> <span className="font-medium">{formatRate(data.educationEmployment.trainingAccessRate)}</span></div>
          </div>
        </Section>

        <Section title="Wellbeing & Support">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Assessments:</span> <span className="font-medium">{data.wellbeingSupport.totalAssessments}</span></div>
            <div><span className="text-gray-500">Assessed Rate:</span> <span className="font-medium">{formatRate(data.wellbeingSupport.assessmentsDoneRate)}</span></div>
            <div><span className="text-gray-500">Thriving/Stable:</span> <span className="font-medium">{formatRate(data.wellbeingSupport.thrivingStableRate)}</span></div>
            <div><span className="text-gray-500">Services Accessed:</span> <span className="font-medium">{formatRate(data.wellbeingSupport.supportServicesAccessedRate)}</span></div>
            <div><span className="text-gray-500">Mental Health:</span> <span className="font-medium">{formatRate(data.wellbeingSupport.mentalHealthSupportedRate)}</span></div>
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

"use client";

import { useState, useEffect } from "react";
import type { HealthScreeningComplianceIntelligence } from "@/lib/health-screening-compliance";
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

export function HealthScreeningComplianceDashboardWidget() {
  const [data, setData] = useState<HealthScreeningComplianceIntelligence | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/health-screening-compliance")
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
        <h3 className="text-lg font-semibold text-red-800">Health Screening Compliance</h3>
        <p className="text-red-600 mt-2">Failed to load: {error}</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Health Screening Compliance</h3>
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
          <div className="text-2xl font-bold text-gray-900">{data.screeningCompliance.totalScreenings}</div>
          <div className="text-xs text-gray-500 mt-1">Screenings</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{formatRate(data.screeningCompliance.onTimeRate)}</div>
          <div className="text-xs text-gray-500 mt-1">On Time</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className={`text-2xl font-bold ${data.screeningCompliance.overdueCount > 0 ? "text-red-600" : "text-green-600"}`}>{data.screeningCompliance.overdueCount}</div>
          <div className="text-xs text-gray-500 mt-1">Overdue</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{formatRate(data.gpAccess.registeredRate)}</div>
          <div className="text-xs text-gray-500 mt-1">GP Registered</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{formatRate(data.healthPlanning.sdqCompletionRate)}</div>
          <div className="text-xs text-gray-500 mt-1">SDQ Complete</div>
        </div>
      </div>

      <div className="space-y-2">
        <ScoreBar score={data.screeningCompliance.overallScore} label="Screening Compliance" maxScore={25} />
        <ScoreBar score={data.gpAccess.overallScore} label="GP Access" maxScore={25} />
        <ScoreBar score={data.healthPlanning.overallScore} label="Health Planning" maxScore={25} />
        <ScoreBar score={data.staffHealthReadiness.overallScore} label="Staff Readiness" maxScore={25} />
      </div>

      <div className="space-y-3">
        {data.childProfiles.length > 0 && (
          <Section title="Child Health Profiles" defaultOpen>
            <div className="space-y-3">
              {data.childProfiles.map((child) => (
                <div key={child.childId} className="border border-gray-100 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{child.childName}</span>
                    <span className="text-sm font-medium text-gray-600">{child.overallScore}/10</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div>GP: <span className={`font-medium ${child.gpRegistered ? "text-green-600" : "text-red-600"}`}>{child.gpRegistered ? "Registered" : "Not Registered"}</span></div>
                    <div>Screenings: <span className="font-medium">{child.screeningsCompleted} completed</span></div>
                    <div>Overdue: <span className={`font-medium ${child.screeningsOverdue > 0 ? "text-red-600" : "text-green-600"}`}>{child.screeningsOverdue}</span></div>
                    <div>Health Passport: <span className={`font-medium ${child.hasHealthPassport ? "text-green-600" : "text-amber-600"}`}>{child.hasHealthPassport ? "Up to date" : "Needs update"}</span></div>
                    <div>Needs Addressed: <span className="font-medium">{child.healthNeedsAddressedRate}%</span></div>
                    {child.latestSDQScore !== null && (
                      <div>SDQ Score: <span className={`font-medium ${child.latestSDQScore <= 13 ? "text-green-600" : child.latestSDQScore <= 16 ? "text-amber-600" : "text-red-600"}`}>{child.latestSDQScore}</span></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        <Section title="Screening Compliance">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Total:</span> <span className="font-medium">{data.screeningCompliance.totalScreenings}</span></div>
            <div><span className="text-gray-500">On Time:</span> <span className="font-medium">{formatRate(data.screeningCompliance.onTimeRate)}</span></div>
            <div><span className="text-gray-500">Overdue:</span> <span className={`font-medium ${data.screeningCompliance.overdueCount > 0 ? "text-red-600" : "text-green-600"}`}>{data.screeningCompliance.overdueCount}</span></div>
            <div><span className="text-gray-500">Declined:</span> <span className={`font-medium ${data.screeningCompliance.declinedCount > 0 ? "text-amber-600" : "text-green-600"}`}>{data.screeningCompliance.declinedCount}</span></div>
            <div><span className="text-gray-500">Referral Follow-up:</span> <span className="font-medium">{formatRate(data.screeningCompliance.referralFollowUpRate)}</span></div>
            <div><span className="text-gray-500">Documented:</span> <span className="font-medium">{formatRate(data.screeningCompliance.documentedRate)}</span></div>
          </div>
        </Section>

        <Section title="GP Access">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Children:</span> <span className="font-medium">{data.gpAccess.totalChildren}</span></div>
            <div><span className="text-gray-500">Registered:</span> <span className="font-medium">{formatRate(data.gpAccess.registeredRate)}</span></div>
            <div><span className="text-gray-500">Named Nurse:</span> <span className="font-medium">{formatRate(data.gpAccess.namedNurseRate)}</span></div>
            <div><span className="text-gray-500">Health Passport:</span> <span className="font-medium">{formatRate(data.gpAccess.healthPassportRate)}</span></div>
            <div><span className="text-gray-500">Pending:</span> <span className={`font-medium ${data.gpAccess.pendingRegistrations > 0 ? "text-amber-600" : "text-green-600"}`}>{data.gpAccess.pendingRegistrations}</span></div>
            <div><span className="text-gray-500">Not Registered:</span> <span className={`font-medium ${data.gpAccess.notRegisteredCount > 0 ? "text-red-600" : "text-green-600"}`}>{data.gpAccess.notRegisteredCount}</span></div>
          </div>
        </Section>

        <Section title="Health Planning">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Plans:</span> <span className="font-medium">{data.healthPlanning.totalPlans}</span></div>
            <div><span className="text-gray-500">Needs Addressed:</span> <span className="font-medium">{formatRate(data.healthPlanning.needsAddressedRate)}</span></div>
            <div><span className="text-gray-500">Child Voice:</span> <span className="font-medium">{formatRate(data.healthPlanning.childContributionRate)}</span></div>
            <div><span className="text-gray-500">SW Informed:</span> <span className="font-medium">{formatRate(data.healthPlanning.socialWorkerInformedRate)}</span></div>
            <div><span className="text-gray-500">SDQ Complete:</span> <span className="font-medium">{formatRate(data.healthPlanning.sdqCompletionRate)}</span></div>
            <div><span className="text-gray-500">Reviewed:</span> <span className="font-medium">{formatRate(data.healthPlanning.reviewRate)}</span></div>
            {data.healthPlanning.averageSDQScore !== null && (
              <div><span className="text-gray-500">Avg SDQ:</span> <span className={`font-medium ${data.healthPlanning.averageSDQScore <= 13 ? "text-green-600" : data.healthPlanning.averageSDQScore <= 16 ? "text-amber-600" : "text-red-600"}`}>{data.healthPlanning.averageSDQScore}</span></div>
            )}
          </div>
        </Section>

        <Section title="Staff Health Readiness">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Staff:</span> <span className="font-medium">{data.staffHealthReadiness.totalStaff}</span></div>
            <div><span className="text-gray-500">First Aid:</span> <span className="font-medium">{formatRate(data.staffHealthReadiness.firstAidRate)}</span></div>
            <div><span className="text-gray-500">Medication:</span> <span className="font-medium">{formatRate(data.staffHealthReadiness.medicationTrainedRate)}</span></div>
            <div><span className="text-gray-500">Mental Health:</span> <span className="font-medium">{formatRate(data.staffHealthReadiness.mentalHealthRate)}</span></div>
            <div><span className="text-gray-500">Epilepsy:</span> <span className="font-medium">{formatRate(data.staffHealthReadiness.epilepsyRate)}</span></div>
            <div><span className="text-gray-500">Allergy:</span> <span className="font-medium">{formatRate(data.staffHealthReadiness.allergyRate)}</span></div>
            <div><span className="text-gray-500">Health Promotion:</span> <span className="font-medium">{formatRate(data.staffHealthReadiness.healthPromotionRate)}</span></div>
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

"use client";

import { useState, useEffect } from "react";
import type { SafeguardingOversightIntelligence } from "@/lib/safeguarding-oversight";

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

export function SafeguardingOversightDashboardWidget() {
  const [data, setData] = useState<SafeguardingOversightIntelligence | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/safeguarding-oversight")
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
        <h3 className="text-lg font-semibold text-red-800">Safeguarding Oversight</h3>
        <p className="text-red-600 mt-2">Failed to load: {error}</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Safeguarding Oversight</h3>
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
          <div className="text-2xl font-bold text-gray-900">{data.workforceSafety.totalStaff}</div>
          <div className="text-xs text-gray-500 mt-1">Staff</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.workforceSafety.enhancedDBSRate}%</div>
          <div className="text-xs text-gray-500 mt-1">DBS Current</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.workforceSafety.currentTrainingRate}%</div>
          <div className="text-xs text-gray-500 mt-1">Training Current</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.referralQuality.totalReferrals}</div>
          <div className="text-xs text-gray-500 mt-1">Referrals</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className={`text-2xl font-bold ${data.workforceSafety.hasDSL ? "text-green-600" : "text-red-600"}`}>
            {data.workforceSafety.hasDSL ? "Yes" : "No"}
          </div>
          <div className="text-xs text-gray-500 mt-1">DSL in Post</div>
        </div>
      </div>

      <div className="space-y-2">
        <ScoreBar score={data.workforceSafety.overallScore} label="Workforce Safety" maxScore={25} />
        <ScoreBar score={data.referralQuality.overallScore} label="Referral Quality" maxScore={25} />
        <ScoreBar score={data.auditCompliance.overallScore} label="Audit Compliance" maxScore={25} />
        <ScoreBar score={data.dslOversight.overallScore} label="DSL Oversight" maxScore={25} />
      </div>

      <div className="space-y-3">
        {data.staffProfiles.length > 0 && (
          <Section title="Staff Safeguarding Profiles" defaultOpen>
            <div className="space-y-3">
              {data.staffProfiles.map((staff) => (
                <div key={staff.staffId} className="border border-gray-100 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{staff.staffName}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${staff.compliant ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {staff.compliant ? "Compliant" : "Non-Compliant"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div>Role: <span className="font-medium">{staff.role}</span></div>
                    <div>DBS: <span className={`font-medium ${staff.dbsStatus.includes("current") || staff.dbsStatus === "update_service" ? "text-green-600" : "text-red-600"}`}>{String(staff.dbsStatus).replace(/_/g, " ")}</span></div>
                    <div>Training: <span className="font-medium">{String(staff.trainingLevel).replace(/_/g, " ")}</span></div>
                    {staff.isDSL && <div><span className="font-medium text-blue-600">Designated Safeguarding Lead</span></div>}
                    {staff.isDeputyDSL && <div><span className="font-medium text-blue-600">Deputy DSL</span></div>}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        <Section title="Workforce Safety">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Staff:</span> <span className="font-medium">{data.workforceSafety.totalStaff}</span></div>
            <div><span className="text-gray-500">DBS Current:</span> <span className="font-medium">{data.workforceSafety.enhancedDBSRate}%</span></div>
            <div><span className="text-gray-500">Training:</span> <span className="font-medium">{data.workforceSafety.currentTrainingRate}%</span></div>
            <div><span className="text-gray-500">Safer Recruitment:</span> <span className="font-medium">{data.workforceSafety.saferRecruitmentRate}%</span></div>
            <div><span className="text-gray-500">Prevent:</span> <span className="font-medium">{data.workforceSafety.preventTrainedRate}%</span></div>
            <div><span className="text-gray-500">Expired DBS:</span> <span className={`font-medium ${data.workforceSafety.expiredDBSCount > 0 ? "text-red-600" : "text-green-600"}`}>{data.workforceSafety.expiredDBSCount}</span></div>
            <div><span className="text-gray-500">DSL:</span> <span className={`font-medium ${data.workforceSafety.hasDSL ? "text-green-600" : "text-red-600"}`}>{data.workforceSafety.hasDSL ? "Yes" : "No"}</span></div>
            <div><span className="text-gray-500">Deputy DSL:</span> <span className={`font-medium ${data.workforceSafety.hasDeputyDSL ? "text-green-600" : "text-amber-600"}`}>{data.workforceSafety.hasDeputyDSL ? "Yes" : "No"}</span></div>
          </div>
        </Section>

        <Section title="Referral Quality">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Referrals:</span> <span className="font-medium">{data.referralQuality.totalReferrals}</span></div>
            <div><span className="text-gray-500">Timely:</span> <span className="font-medium">{data.referralQuality.timelyReferralRate}%</span></div>
            <div><span className="text-gray-500">Management:</span> <span className="font-medium">{data.referralQuality.managementInformedRate}%</span></div>
            <div><span className="text-gray-500">Recorded:</span> <span className="font-medium">{data.referralQuality.recordedAppropriatelyRate}%</span></div>
            <div><span className="text-gray-500">Action Taken:</span> <span className="font-medium">{data.referralQuality.actionTakenRate}%</span></div>
            <div><span className="text-gray-500">High Priority:</span> <span className={`font-medium ${data.referralQuality.immediateHighCount > 0 ? "text-amber-600" : "text-green-600"}`}>{data.referralQuality.immediateHighCount}</span></div>
            <div><span className="text-gray-500">Awaiting:</span> <span className={`font-medium ${data.referralQuality.awaitingOutcomeCount > 0 ? "text-amber-600" : "text-green-600"}`}>{data.referralQuality.awaitingOutcomeCount}</span></div>
          </div>
        </Section>

        <Section title="Audit Compliance">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Audits:</span> <span className="font-medium">{data.auditCompliance.totalAudits}</span></div>
            <div><span className="text-gray-500">Compliant:</span> <span className="font-medium">{data.auditCompliance.overallCompliantRate}%</span></div>
            <div><span className="text-gray-500">Policies:</span> <span className="font-medium">{data.auditCompliance.policiesUpToDateRate}%</span></div>
            <div><span className="text-gray-500">Risk Assessments:</span> <span className="font-medium">{data.auditCompliance.riskAssessmentsCurrentRate}%</span></div>
            <div><span className="text-gray-500">Children Aware:</span> <span className="font-medium">{data.auditCompliance.childrenKnowComplainRate}%</span></div>
            <div><span className="text-gray-500">Visitor Sign-in:</span> <span className="font-medium">{data.auditCompliance.visitorSignInRate}%</span></div>
          </div>
        </Section>

        <Section title="DSL Oversight">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Reviews:</span> <span className="font-medium">{data.dslOversight.totalReviews}</span></div>
            <div><span className="text-gray-500">Cases Reviewed:</span> <span className="font-medium">{data.dslOversight.caseReviewRate}%</span></div>
            <div><span className="text-gray-500">Supervision:</span> <span className="font-medium">{data.dslOversight.supervisionRate}%</span></div>
            <div><span className="text-gray-500">Multi-Agency:</span> <span className="font-medium">{data.dslOversight.multiAgencyRate}%</span></div>
            <div><span className="text-gray-500">Training:</span> <span className="font-medium">{data.dslOversight.trainingDeliveredRate}%</span></div>
            <div><span className="text-gray-500">Policy Review:</span> <span className="font-medium">{data.dslOversight.policyReviewRate}%</span></div>
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

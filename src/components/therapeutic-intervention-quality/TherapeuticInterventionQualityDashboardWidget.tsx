"use client";

import { useState, useEffect } from "react";
import type { TherapeuticInterventionQualityIntelligence } from "@/lib/therapeutic-intervention-quality";

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
      <span className="text-sm text-gray-600 w-48 shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2.5">
        <div className={`h-2.5 rounded-full ${color}`} style={{ width: `${Math.min(pctVal, 100)}%` }} />
      </div>
      <span className="text-sm font-medium w-12 text-right">{score}/{maxScore}</span>
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

function Stat({ label, value, warn }: { label: string; value: string | number; warn?: boolean }) {
  return (
    <div>
      <span className="text-gray-500">{label}:</span>{" "}
      <span className={`font-medium ${warn ? "text-red-600" : ""}`}>{value}</span>
    </div>
  );
}

export function TherapeuticInterventionQualityDashboardWidget() {
  const [data, setData] = useState<TherapeuticInterventionQualityIntelligence | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/therapeutic-intervention-quality")
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
        <h3 className="text-lg font-semibold text-red-800">Therapeutic Intervention Quality</h3>
        <p className="text-red-600 mt-2">Failed to load: {error}</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Therapeutic Intervention Quality</h3>
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
          <div className="text-2xl font-bold text-gray-900">{data.quality.totalSessions}</div>
          <div className="text-xs text-gray-500 mt-1">Sessions</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.quality.progressRate}%</div>
          <div className="text-xs text-gray-500 mt-1">Progress</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.quality.engagementRate}%</div>
          <div className="text-xs text-gray-500 mt-1">Engaged</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.compliance.documentedRate}%</div>
          <div className="text-xs text-gray-500 mt-1">Documented</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.staffReadiness.totalStaff}</div>
          <div className="text-xs text-gray-500 mt-1">Trained Staff</div>
        </div>
      </div>

      <div className="space-y-2">
        <ScoreBar score={data.quality.overallScore} label="Therapeutic Quality" maxScore={25} />
        <ScoreBar score={data.compliance.overallScore} label="Compliance" maxScore={25} />
        <ScoreBar score={data.policy.overallScore} label="Therapeutic Policy" maxScore={25} />
        <ScoreBar score={data.staffReadiness.overallScore} label="Staff Readiness" maxScore={25} />
      </div>

      <div className="space-y-3">
        {data.childProfiles.length > 0 && (
          <Section title="Child Therapy Profiles" defaultOpen>
            <div className="space-y-3">
              {data.childProfiles.map((child) => (
                <div key={child.childId} className="border border-gray-100 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{child.childName}</span>
                    <span className="text-sm font-medium text-gray-600">{child.overallScore}/10</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div>Sessions: <span className="font-medium">{child.totalSessions}</span></div>
                    <div>Progress: <span className="font-medium">{child.progressRate}%</span></div>
                    <div>Engaged: <span className="font-medium">{child.engagementRate}%</span></div>
                    <div>Score: <span className="font-medium">{child.overallScore}/10</span></div>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        <Section title="Therapeutic Quality">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <Stat label="Total Sessions" value={data.quality.totalSessions} />
            <Stat label="Progress Rate" value={`${data.quality.progressRate}%`} />
            <Stat label="Engagement Rate" value={`${data.quality.engagementRate}%`} />
            <Stat label="Goals Reviewed" value={`${data.quality.goalsReviewedRate}%`} />
            <Stat label="Relationship" value={`${data.quality.relationshipRate}%`} />
          </div>
        </Section>

        <Section title="Compliance">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <Stat label="Documented" value={`${data.compliance.documentedRate}%`} />
            <Stat label="Staff Supported" value={`${data.compliance.staffSupportedRate}%`} />
            <Stat label="Feedback Given" value={`${data.compliance.feedbackRate}%`} />
            <Stat label="Therapy Diversity" value={`${data.compliance.therapyDiversityRatio}%`} />
          </div>
        </Section>

        <Section title="Therapeutic Policy">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <Stat label="Framework" value={data.policy.therapeuticFramework ? "Yes" : "No"} warn={!data.policy.therapeuticFramework} />
            <Stat label="Referral Pathway" value={data.policy.referralPathway ? "Yes" : "No"} warn={!data.policy.referralPathway} />
            <Stat label="Consent Protocol" value={data.policy.consentAndConfidentialityProtocol ? "Yes" : "No"} warn={!data.policy.consentAndConfidentialityProtocol} />
            <Stat label="Multi-disciplinary" value={data.policy.multiDisciplinaryApproach ? "Yes" : "No"} warn={!data.policy.multiDisciplinaryApproach} />
            <Stat label="Outcome Measurement" value={data.policy.outcomeMeasurementPlan ? "Yes" : "No"} warn={!data.policy.outcomeMeasurementPlan} />
            <Stat label="Crisis Provision" value={data.policy.crisisTherapyProvision ? "Yes" : "No"} warn={!data.policy.crisisTherapyProvision} />
            <Stat label="Regular Review" value={data.policy.regularReview ? "Yes" : "No"} warn={!data.policy.regularReview} />
          </div>
        </Section>

        <Section title="Staff Therapeutic Readiness">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <Stat label="Staff Trained" value={data.staffReadiness.totalStaff} />
            <Stat label="Awareness" value={`${data.staffReadiness.therapeuticAwarenessRate}%`} />
            <Stat label="Trauma-Informed" value={`${data.staffReadiness.traumaInformedPracticeRate}%`} />
            <Stat label="Attachment Theory" value={`${data.staffReadiness.attachmentTheoryRate}%`} />
            <Stat label="Communication" value={`${data.staffReadiness.therapeuticCommunicationRate}%`} />
            <Stat label="Boundaries" value={`${data.staffReadiness.boundaryManagementRate}%`} />
            <Stat label="Reflective Practice" value={`${data.staffReadiness.reflectivePracticeRate}%`} />
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

export default TherapeuticInterventionQualityDashboardWidget;

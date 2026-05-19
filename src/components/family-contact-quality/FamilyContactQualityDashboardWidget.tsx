"use client";

import { useState, useEffect } from "react";
import type { FamilyContactQualityIntelligence } from "@/lib/family-contact-quality";

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
  const color =
    pctVal >= 80 ? "bg-green-500" :
    pctVal >= 60 ? "bg-blue-500" :
    pctVal >= 40 ? "bg-amber-500" :
    "bg-red-500";
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
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <span className="font-medium text-gray-900">{title}</span>
        <span className="text-gray-400">{open ? "▲" : "▼"}</span>
      </button>
      {open && <div className="p-4 space-y-3">{children}</div>}
    </div>
  );
}

function BoolIndicator({ value, label }: { value: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className={value ? "text-green-600" : "text-red-500"}>{value ? "Yes" : "No"}</span>
      <span className="text-gray-600">{label}</span>
    </div>
  );
}

export default function FamilyContactQualityDashboardWidget() {
  const [data, setData] = useState<FamilyContactQualityIntelligence | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/family-contact-quality")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
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
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
        <h3 className="text-lg font-semibold text-red-800">Family Contact Quality</h3>
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
          <h3 className="text-lg font-semibold text-gray-900">Family Contact Quality</h3>
          <p className="text-sm text-gray-500 mt-1">
            {data.periodStart} to {data.periodEnd}
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-gray-900">{data.overallScore}</div>
          <span
            className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${ratingColors[data.rating] || ""}`}
          >
            {ratingLabels[data.rating] || data.rating}
          </span>
        </div>
      </div>

      {/* Component Scores */}
      <div className="space-y-2">
        <ScoreBar score={data.contactQuality.score} label="Contact Quality" maxScore={25} />
        <ScoreBar score={data.contactConsistency.score} label="Contact Consistency" maxScore={25} />
        <ScoreBar score={data.contactPolicy.score} label="Contact Policy" maxScore={25} />
        <ScoreBar score={data.staffContactReadiness.score} label="Staff Readiness" maxScore={25} />
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.contactQuality.positiveOutcomeRate}%</div>
          <div className="text-xs text-gray-500 mt-1">Positive Outcomes</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.contactQuality.childPreparedRate}%</div>
          <div className="text-xs text-gray-500 mt-1">Children Prepared</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.contactConsistency.planAdherenceRate}%</div>
          <div className="text-xs text-gray-500 mt-1">Plan Adherence</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.staffContactReadiness.totalStaff}</div>
          <div className="text-xs text-gray-500 mt-1">Staff Trained</div>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-3">
        {/* Child Profiles */}
        {data.childProfiles.length > 0 && (
          <Section title="Child Contact Profiles" defaultOpen>
            <div className="space-y-3">
              {data.childProfiles.map((child) => (
                <div key={child.childId} className="border border-gray-100 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{child.childName}</span>
                    <span className="text-sm text-gray-500">{child.score}/10</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div>
                      Contacts: <span className="font-medium">{child.totalContacts}</span>
                    </div>
                    <div>
                      Positive: <span className="font-medium">{child.positiveRate}%</span>
                    </div>
                    <div>
                      Prepared: <span className="font-medium">{child.preparedRate}%</span>
                    </div>
                    <div>
                      Views Recorded: <span className="font-medium">{child.viewsRecordedRate}%</span>
                    </div>
                    <div>
                      Satisfied: <span className="font-medium">{child.satisfiedRate}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Contact Quality Detail */}
        <Section title="Contact Quality">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <span className="text-gray-500">Positive Outcomes:</span>{" "}
              <span className="font-medium">{data.contactQuality.positiveOutcomeRate}%</span>
            </div>
            <div>
              <span className="text-gray-500">Children Prepared:</span>{" "}
              <span className="font-medium">{data.contactQuality.childPreparedRate}%</span>
            </div>
            <div>
              <span className="text-gray-500">Views Recorded:</span>{" "}
              <span className="font-medium">{data.contactQuality.childViewsRecordedRate}%</span>
            </div>
            <div>
              <span className="text-gray-500">Satisfied + Plan:</span>{" "}
              <span className="font-medium">{data.contactQuality.satisfactionPlanRate}%</span>
            </div>
          </div>
        </Section>

        {/* Contact Consistency Detail */}
        <Section title="Contact Consistency">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <div>
              <span className="text-gray-500">Recorded:</span>{" "}
              <span className="font-medium">{data.contactConsistency.recordedRate}%</span>
            </div>
            <div>
              <span className="text-gray-500">Plan Adherence:</span>{" "}
              <span className="font-medium">{data.contactConsistency.planAdherenceRate}%</span>
            </div>
            <div>
              <span className="text-gray-500">Supervised:</span>{" "}
              <span className="font-medium">{data.contactConsistency.supervisedAppropriatelyRate}%</span>
            </div>
          </div>
        </Section>

        {/* Contact Policy Detail */}
        <Section title="Contact Policy">
          <div className="grid grid-cols-2 gap-2">
            <BoolIndicator value={data.contactPolicy.contactPlanForEachChild} label="Contact Plan per Child" />
            <BoolIndicator value={data.contactPolicy.familyEngagementStrategy} label="Family Engagement Strategy" />
            <BoolIndicator value={data.contactPolicy.supervisedContactGuidance} label="Supervised Contact Guidance" />
            <BoolIndicator value={data.contactPolicy.letterboxProcess} label="Letterbox Process" />
            <BoolIndicator value={data.contactPolicy.complaintsMechanism} label="Complaints Mechanism" />
            <BoolIndicator value={data.contactPolicy.culturalConsideration} label="Cultural Consideration" />
            <BoolIndicator value={data.contactPolicy.regularReview} label="Regular Review" />
          </div>
        </Section>

        {/* Staff Readiness Detail */}
        <Section title="Staff Contact Readiness">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <div>
              <span className="text-gray-500">Staff:</span>{" "}
              <span className="font-medium">{data.staffContactReadiness.totalStaff}</span>
            </div>
            <div>
              <span className="text-gray-500">Family Engagement:</span>{" "}
              <span className="font-medium">{data.staffContactReadiness.familyEngagementRate}%</span>
            </div>
            <div>
              <span className="text-gray-500">Contact Supervision:</span>{" "}
              <span className="font-medium">{data.staffContactReadiness.contactSupervisionRate}%</span>
            </div>
            <div>
              <span className="text-gray-500">Child Preparation:</span>{" "}
              <span className="font-medium">{data.staffContactReadiness.childPreparationRate}%</span>
            </div>
            <div>
              <span className="text-gray-500">Conflict Management:</span>{" "}
              <span className="font-medium">{data.staffContactReadiness.conflictManagementRate}%</span>
            </div>
            <div>
              <span className="text-gray-500">Record Keeping:</span>{" "}
              <span className="font-medium">{data.staffContactReadiness.recordKeepingRate}%</span>
            </div>
            <div>
              <span className="text-gray-500">Cultural Awareness:</span>{" "}
              <span className="font-medium">{data.staffContactReadiness.culturalAwarenessRate}%</span>
            </div>
          </div>
        </Section>

        {/* Strengths, Areas & Actions */}
        <Section title="Strengths, Areas & Actions">
          {data.strengths.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-green-700 mb-1">Strengths</h4>
              <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                {data.strengths.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}
          {data.areasForImprovement.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-amber-700 mb-1">Areas for Improvement</h4>
              <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                {data.areasForImprovement.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
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

        {/* Regulatory Framework */}
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

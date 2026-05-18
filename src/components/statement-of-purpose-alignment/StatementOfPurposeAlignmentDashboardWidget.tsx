"use client";

import { useState, useEffect } from "react";
import type { StatementOfPurposeAlignmentIntelligence } from "@/lib/statement-of-purpose-alignment";

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

const alignmentColors: Record<string, string> = {
  fully_aligned: "text-green-600",
  mostly_aligned: "text-blue-600",
  partially_aligned: "text-amber-600",
  not_aligned: "text-red-600",
  not_assessed: "text-gray-400",
};

const alignmentLabels: Record<string, string> = {
  fully_aligned: "Fully Aligned",
  mostly_aligned: "Mostly Aligned",
  partially_aligned: "Partially Aligned",
  not_aligned: "Not Aligned",
  not_assessed: "Not Assessed",
};

const sectionLabels: Record<string, string> = {
  ethos_values: "Ethos & Values",
  care_approach: "Care Approach",
  admission_criteria: "Admission Criteria",
  staffing_model: "Staffing Model",
  education_support: "Education Support",
  health_wellbeing: "Health & Wellbeing",
  behaviour_management: "Behaviour Management",
  safeguarding: "Safeguarding",
  family_contact: "Family Contact",
  transition_planning: "Transition Planning",
  location_community: "Location & Community",
  complaints_procedure: "Complaints Procedure",
};

function ScoreBar({ score, label, max = 25 }: { score: number; label: string; max?: number }) {
  const pctVal = Math.round((score / max) * 100);
  const color =
    pctVal >= 80 ? "bg-green-500" : pctVal >= 60 ? "bg-blue-500" : pctVal >= 40 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 w-44 shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2.5">
        <div className={`h-2.5 rounded-full ${color}`} style={{ width: `${Math.min(pctVal, 100)}%` }} />
      </div>
      <span className="text-sm font-medium w-14 text-right">{score}/{max}</span>
    </div>
  );
}

function Section({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
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

export function StatementOfPurposeAlignmentDashboardWidget() {
  const [data, setData] = useState<StatementOfPurposeAlignmentIntelligence | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/statement-of-purpose-alignment")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(setData)
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
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
        <h3 className="text-lg font-semibold text-red-800">
          Statement of Purpose Alignment Intelligence
        </h3>
        <p className="text-red-600 mt-2">Failed to load: {error}</p>
      </div>
    );
  }

  if (!data) return null;

  const ratingClass = ratingColors[data.rating] || ratingColors.inadequate;
  const ratingLabel = ratingLabels[data.rating] || data.rating;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Statement of Purpose Alignment Intelligence
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {data.periodStart} to {data.periodEnd}
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-gray-900">{data.overallScore}</div>
          <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${ratingClass}`}>
            {ratingLabel}
          </span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">
            {data.alignmentQuality.fullyAlignedRate}%
          </div>
          <div className="text-xs text-gray-500 mt-1">Fully Aligned</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">
            {data.reviewCurrency.currentRate}%
          </div>
          <div className="text-xs text-gray-500 mt-1">Reviews Current</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">
            {data.stakeholderAwareness.awareRate}%
          </div>
          <div className="text-xs text-gray-500 mt-1">Stakeholder Aware</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">
            {data.ofstedResponse.addressedRate}%
          </div>
          <div className="text-xs text-gray-500 mt-1">Ofsted Addressed</div>
        </div>
      </div>

      {/* Component Scores */}
      <div className="space-y-2">
        <ScoreBar score={data.alignmentQuality.overallScore} label="Alignment Quality" />
        <ScoreBar score={data.reviewCurrency.overallScore} label="Review Currency" />
        <ScoreBar score={data.stakeholderAwareness.overallScore} label="Stakeholder Awareness" />
        <ScoreBar score={data.ofstedResponse.overallScore} label="Ofsted Response" />
      </div>

      {/* Sections */}
      <div className="space-y-3">
        {/* Section Alignment Profiles */}
        <Section title="Section Alignment Profiles" defaultOpen>
          <div className="space-y-3">
            {data.sectionProfiles.map((profile) => (
              <div key={profile.section} className="border border-gray-100 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">
                    {sectionLabels[profile.section] || profile.section}
                  </span>
                  <span className="text-sm font-medium text-gray-600">
                    Score: {profile.overallScore}/10
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs text-gray-600">
                  <div>
                    <span className="text-gray-400">Alignment:</span>{" "}
                    <span className={`font-medium ${alignmentColors[profile.latestAlignment] || "text-gray-600"}`}>
                      {alignmentLabels[profile.latestAlignment] || profile.latestAlignment}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Evidence:</span>{" "}
                    <span className="font-medium">{profile.evidenceQuality.replace(/_/g, " ")}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Assessments:</span>{" "}
                    <span className="font-medium">{profile.assessmentCount}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Alignment Quality */}
        <Section title="Alignment Quality">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">Total Assessments:</span>{" "}
              <span className="font-medium">{data.alignmentQuality.totalAssessments}</span>
            </div>
            <div>
              <span className="text-gray-500">Fully Aligned:</span>{" "}
              <span className="font-medium">{data.alignmentQuality.fullyAlignedRate}%</span>
            </div>
            <div>
              <span className="text-gray-500">Not Aligned:</span>{" "}
              <span className="font-medium">{data.alignmentQuality.notAlignedCount}</span>
            </div>
            <div>
              <span className="text-gray-500">Strong Evidence:</span>{" "}
              <span className="font-medium">{data.alignmentQuality.strongEvidenceRate}%</span>
            </div>
            <div>
              <span className="text-gray-500">Actions Required:</span>{" "}
              <span className="font-medium">{data.alignmentQuality.actionsRequiredCount}</span>
            </div>
            <div>
              <span className="text-gray-500">Actions Taken:</span>{" "}
              <span className="font-medium">{data.alignmentQuality.actionsTakenRate}%</span>
            </div>
          </div>
        </Section>

        {/* Review Currency */}
        <Section title="Review Currency">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">Total Reviews:</span>{" "}
              <span className="font-medium">{data.reviewCurrency.totalReviews}</span>
            </div>
            <div>
              <span className="text-gray-500">Current:</span>{" "}
              <span className="font-medium">{data.reviewCurrency.currentRate}%</span>
            </div>
            <div>
              <span className="text-gray-500">Overdue:</span>{" "}
              <span className="font-medium">{data.reviewCurrency.overdueCount}</span>
            </div>
            <div>
              <span className="text-gray-500">Children Consulted:</span>{" "}
              <span className="font-medium">{data.reviewCurrency.childrenConsultedRate}%</span>
            </div>
            <div>
              <span className="text-gray-500">Staff Consulted:</span>{" "}
              <span className="font-medium">{data.reviewCurrency.staffConsultedRate}%</span>
            </div>
            <div>
              <span className="text-gray-500">All Sections Reviewed:</span>{" "}
              <span className="font-medium">{data.reviewCurrency.allSectionsRate}%</span>
            </div>
          </div>
        </Section>

        {/* Stakeholder Awareness */}
        <Section title="Stakeholder Awareness">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">Total Feedback:</span>{" "}
              <span className="font-medium">{data.stakeholderAwareness.totalFeedback}</span>
            </div>
            <div>
              <span className="text-gray-500">Aware of SoP:</span>{" "}
              <span className="font-medium">{data.stakeholderAwareness.awareRate}%</span>
            </div>
            <div>
              <span className="text-gray-500">Reflects Reality:</span>{" "}
              <span className="font-medium">{data.stakeholderAwareness.reflectsRealityRate}%</span>
            </div>
            <div>
              <span className="text-gray-500">Values Evident:</span>{" "}
              <span className="font-medium">{data.stakeholderAwareness.valuesEvidentRate}%</span>
            </div>
            <div>
              <span className="text-gray-500">Suggestions Provided:</span>{" "}
              <span className="font-medium">{data.stakeholderAwareness.suggestionsRate}%</span>
            </div>
          </div>
        </Section>

        {/* Ofsted Response */}
        <Section title="Ofsted Response">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">Total Recommendations:</span>{" "}
              <span className="font-medium">{data.ofstedResponse.totalRecommendations}</span>
            </div>
            <div>
              <span className="text-gray-500">Addressed:</span>{" "}
              <span className="font-medium">{data.ofstedResponse.addressedRate}%</span>
            </div>
            <div>
              <span className="text-gray-500">Evidence of Change:</span>{" "}
              <span className="font-medium">{data.ofstedResponse.evidenceRate}%</span>
            </div>
            <div>
              <span className="text-gray-500">Outstanding:</span>{" "}
              <span className="font-medium">{data.ofstedResponse.outstandingCount}</span>
            </div>
          </div>
        </Section>

        {/* Strengths / Areas / Actions */}
        <Section title="Strengths, Areas &amp; Actions">
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
                  <li key={i}>{a}</li>
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

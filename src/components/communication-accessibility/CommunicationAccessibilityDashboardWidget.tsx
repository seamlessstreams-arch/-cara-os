"use client";

import { useState, useEffect } from "react";
import type { CommunicationAccessibilityIntelligenceResult } from "@/lib/communication-accessibility";

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

const engagementLabels: Record<string, string> = {
  fully_engaged: "Fully Engaged",
  partially_engaged: "Partially Engaged",
  minimally_engaged: "Minimally Engaged",
  not_engaged: "Not Engaged",
  unable_to_assess: "Unable to Assess",
};

const engagementColors: Record<string, string> = {
  fully_engaged: "text-green-600",
  partially_engaged: "text-blue-600",
  minimally_engaged: "text-amber-600",
  not_engaged: "text-red-600",
  unable_to_assess: "text-gray-500",
};

function ScoreBar({ score, label }: { score: number; label: string }) {
  const color =
    score >= 80
      ? "bg-green-500"
      : score >= 60
        ? "bg-blue-500"
        : score >= 40
          ? "bg-amber-500"
          : "bg-red-500";
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 w-44 shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2.5">
        <div
          className={`h-2.5 rounded-full ${color}`}
          style={{ width: `${Math.min(score, 100)}%` }}
        />
      </div>
      <span className="text-sm font-medium w-10 text-right">{score}%</span>
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

export function CommunicationAccessibilityDashboardWidget() {
  const [data, setData] =
    useState<CommunicationAccessibilityIntelligenceResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/communication-accessibility")
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
          Communication &amp; Accessibility Intelligence
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
            Communication &amp; Accessibility Intelligence
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {data.periodStart} to {data.periodEnd}
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-gray-900">
            {data.overallScore}
          </div>
          <span
            className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${ratingClass}`}
          >
            {ratingLabel}
          </span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">
            {data.needsAssessment.assessmentRate}%
          </div>
          <div className="text-xs text-gray-500 mt-1">Assessment Rate</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">
            {data.supportProvision.supportMatchRate}%
          </div>
          <div className="text-xs text-gray-500 mt-1">Support Match</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">
            {data.accessibleInformation.keyDocumentCoverageRate}%
          </div>
          <div className="text-xs text-gray-500 mt-1">Docs Accessible</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">
            {data.staffTraining.trainingCoverageRate}%
          </div>
          <div className="text-xs text-gray-500 mt-1">Staff Trained</div>
        </div>
      </div>

      {/* Component Scores */}
      <div className="space-y-2">
        <ScoreBar
          score={data.needsAssessment.score}
          label="Needs Assessment"
        />
        <ScoreBar
          score={data.supportProvision.score}
          label="Support Provision"
        />
        <ScoreBar
          score={data.accessibleInformation.score}
          label="Accessible Information"
        />
        <ScoreBar score={data.staffTraining.score} label="Staff Training" />
      </div>

      {/* Sections */}
      <div className="space-y-3">
        {/* Child Communication Summaries */}
        <Section title="Child Communication Profiles" defaultOpen>
          <div className="space-y-3">
            {data.childSummaries.map((child) => (
              <div
                key={child.childId}
                className="border border-gray-100 rounded-lg p-3"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">
                    {child.childName}
                  </span>
                  <span className="text-sm font-medium text-gray-600">
                    Score: {child.overallScore}/100
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs text-gray-600">
                  <div>
                    <span className="text-gray-400">Language:</span>{" "}
                    <span className="font-medium">{child.primaryLanguage}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Needs:</span>{" "}
                    <span className="font-medium">
                      {child.communicationNeeds.length > 0
                        ? child.communicationNeeds.length
                        : "None"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Assessed:</span>{" "}
                    <span
                      className={
                        child.assessed ? "text-green-600" : "text-red-600"
                      }
                    >
                      {child.assessed ? "Yes" : "No"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Interpreter:</span>{" "}
                    <span
                      className={
                        child.interpreterRequired
                          ? "text-amber-600 font-medium"
                          : "text-gray-600"
                      }
                    >
                      {child.interpreterRequired ? "Required" : "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Support Match:</span>{" "}
                    <span className="font-medium">
                      {child.supportMatchRate}%
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Engagement:</span>{" "}
                    {child.engagementLevel ? (
                      <span
                        className={
                          engagementColors[child.engagementLevel] ||
                          "text-gray-600"
                        }
                      >
                        {engagementLabels[child.engagementLevel] ||
                          child.engagementLevel}
                      </span>
                    ) : (
                      "N/A"
                    )}
                  </div>
                  <div>
                    <span className="text-gray-400">Passport:</span>{" "}
                    <span
                      className={
                        child.hasCommunicationPassport
                          ? "text-green-600"
                          : child.communicationNeeds.length > 0
                            ? "text-red-600"
                            : "text-gray-600"
                      }
                    >
                      {child.hasCommunicationPassport
                        ? "Yes"
                        : child.communicationNeeds.length > 0
                          ? "Missing"
                          : "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Staff Trained:</span>{" "}
                    <span
                      className={
                        child.staffTrainedInNeeds
                          ? "text-green-600"
                          : child.communicationNeeds.length > 0
                            ? "text-red-600"
                            : "text-gray-600"
                      }
                    >
                      {child.staffTrainedInNeeds
                        ? "Yes"
                        : child.communicationNeeds.length > 0
                          ? "No"
                          : "N/A"}
                    </span>
                  </div>
                </div>
                {child.concerns.length > 0 && (
                  <div className="mt-2 text-xs text-red-600">
                    {child.concerns.join(" • ")}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>

        {/* Needs Assessment */}
        <Section title="Needs Assessment">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">Total Children:</span>{" "}
              <span className="font-medium">
                {data.needsAssessment.totalChildren}
              </span>
            </div>
            <div>
              <span className="text-gray-500">With Needs:</span>{" "}
              <span className="font-medium">
                {data.needsAssessment.childrenWithNeeds}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Assessed:</span>{" "}
              <span className="font-medium">
                {data.needsAssessment.childrenAssessed}/
                {data.needsAssessment.totalChildren}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Passport Rate:</span>{" "}
              <span className="font-medium">
                {data.needsAssessment.passportRate}%
              </span>
            </div>
          </div>
          {data.needsAssessment.childrenNotAssessed.length > 0 && (
            <div className="mt-3 text-sm text-red-600">
              Not assessed:{" "}
              {data.needsAssessment.childrenNotAssessed.join(", ")}
            </div>
          )}
        </Section>

        {/* Support Provision */}
        <Section title="Support Provision">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">Recommendations:</span>{" "}
              <span className="font-medium">
                {data.supportProvision.totalRecommendations}
              </span>
            </div>
            <div>
              <span className="text-gray-500">In Place:</span>{" "}
              <span className="font-medium">
                {data.supportProvision.totalInPlace}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Support Match:</span>{" "}
              <span className="font-medium">
                {data.supportProvision.supportMatchRate}%
              </span>
            </div>
            <div>
              <span className="text-gray-500">SLT Access:</span>{" "}
              <span className="font-medium">
                {data.supportProvision.speechTherapyAccessRate}%
              </span>
            </div>
            <div>
              <span className="text-gray-500">Interpreter Provision:</span>{" "}
              <span className="font-medium">
                {data.supportProvision.interpreterProvisionRate}%
              </span>
            </div>
            <div>
              <span className="text-gray-500">Full Support:</span>{" "}
              <span className="font-medium">
                {data.supportProvision.childrenWithFullSupport} children
              </span>
            </div>
          </div>
          {data.supportProvision.gaps.length > 0 && (
            <div className="mt-3 space-y-1">
              {data.supportProvision.gaps.map((gap, i) => (
                <div key={i} className="text-sm text-amber-600">
                  {gap}
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Accessible Information */}
        <Section title="Accessible Information">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">Total Documents:</span>{" "}
              <span className="font-medium">
                {data.accessibleInformation.totalDocuments}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Multiple Formats:</span>{" "}
              <span className="font-medium">
                {data.accessibleInformation.documentsWithMultipleFormats}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Key Docs Covered:</span>{" "}
              <span className="font-medium">
                {data.accessibleInformation.keyDocumentsCovered}/
                {data.accessibleInformation.totalKeyDocumentTypes}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Multi-Format Rate:</span>{" "}
              <span className="font-medium">
                {data.accessibleInformation.multipleFormatRate}%
              </span>
            </div>
          </div>
          {data.accessibleInformation.missingDocumentTypes.length > 0 && (
            <div className="mt-3 text-sm text-amber-600">
              Missing accessible formats:{" "}
              {data.accessibleInformation.missingDocumentTypes.join(", ")}
            </div>
          )}
        </Section>

        {/* Staff Training */}
        <Section title="Staff Training">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">Total Staff:</span>{" "}
              <span className="font-medium">
                {data.staffTraining.totalStaff}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Trained:</span>{" "}
              <span className="font-medium">
                {data.staffTraining.staffWithRelevantTraining}/
                {data.staffTraining.totalStaff}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Coverage Rate:</span>{" "}
              <span className="font-medium">
                {data.staffTraining.trainingCoverageRate}%
              </span>
            </div>
            <div>
              <span className="text-gray-500">Needs Coverage:</span>{" "}
              <span className="font-medium">
                {data.staffTraining.staffChildNeedsCoverage}%
              </span>
            </div>
          </div>
          {(data.staffTraining.expiredTraining > 0 ||
            data.staffTraining.expiringWithin90Days > 0) && (
            <div className="mt-3 text-sm">
              {data.staffTraining.expiredTraining > 0 && (
                <span className="text-red-600">
                  {data.staffTraining.expiredTraining} expired
                </span>
              )}
              {data.staffTraining.expiredTraining > 0 &&
                data.staffTraining.expiringWithin90Days > 0 && " | "}
              {data.staffTraining.expiringWithin90Days > 0 && (
                <span className="text-amber-600">
                  {data.staffTraining.expiringWithin90Days} expiring within 90
                  days
                </span>
              )}
            </div>
          )}
        </Section>

        {/* Strengths / Areas / Actions */}
        <Section title="Strengths, Areas &amp; Actions">
          {data.strengths.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-green-700 mb-1">
                Strengths
              </h4>
              <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                {data.strengths.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}
          {data.areasForImprovement.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-amber-700 mb-1">
                Areas for Improvement
              </h4>
              <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                {data.areasForImprovement.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          )}
          {data.actions.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-blue-700 mb-1">
                Recommended Actions
              </h4>
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
                <span className="text-blue-400 mt-0.5">&#167;</span>
                <span>{link}</span>
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </div>
  );
}

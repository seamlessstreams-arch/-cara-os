"use client";

import { useState, useEffect } from "react";
import type { ComplaintsFeedbackQualityIntelligence } from "@/lib/complaints-feedback-quality";

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

function ScoreBar({ score, label, max = 25 }: { score: number; label: string; max?: number }) {
  const pct = Math.round((score / max) * 100);
  const color =
    pct >= 80 ? "bg-green-500" : pct >= 60 ? "bg-blue-500" : pct >= 40 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 w-44 shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2.5">
        <div className={`h-2.5 rounded-full ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
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

export function ComplaintsFeedbackQualityDashboardWidget() {
  const [data, setData] = useState<ComplaintsFeedbackQualityIntelligence | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/complaints-feedback-quality")
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
          Complaints &amp; Feedback Quality Intelligence
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
            Complaints &amp; Feedback Quality Intelligence
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
            {data.complaintHandling.totalComplaints}
          </div>
          <div className="text-xs text-gray-500 mt-1">Total Complaints</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">
            {data.feedbackCulture.totalFeedback}
          </div>
          <div className="text-xs text-gray-500 mt-1">Total Feedback</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">
            {data.complaintHandling.resolvedWithinTimescaleRate}%
          </div>
          <div className="text-xs text-gray-500 mt-1">Resolved in Time</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">
            {data.policyCompliance.complianceRate}%
          </div>
          <div className="text-xs text-gray-500 mt-1">Policy Compliance</div>
        </div>
      </div>

      {/* Component Scores */}
      <div className="space-y-2">
        <ScoreBar score={data.complaintHandling.overallScore} label="Complaint Handling" />
        <ScoreBar score={data.feedbackCulture.overallScore} label="Feedback Culture" />
        <ScoreBar score={data.learningOutcomes.overallScore} label="Learning Outcomes" />
        <ScoreBar score={data.policyCompliance.overallScore} label="Policy Compliance" />
      </div>

      {/* Sections */}
      <div className="space-y-3">
        {/* Child Profiles */}
        <Section title="Child Complaint Profiles" defaultOpen>
          <div className="space-y-3">
            {data.childProfiles.map((profile) => (
              <div key={profile.childId} className="border border-gray-100 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{profile.childName}</span>
                  <span className="text-sm font-medium text-gray-600">
                    Score: {profile.overallScore}/10
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-600">
                  <div>
                    <span className="text-gray-400">Complaints:</span>{" "}
                    <span className="font-medium">{profile.complaintCount}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Feedback:</span>{" "}
                    <span className="font-medium">{profile.feedbackCount}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Supported:</span>{" "}
                    <span className={profile.supportedToComplain ? "text-green-600" : "text-red-600"}>
                      {profile.supportedToComplain ? "Yes" : "No"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Informed:</span>{" "}
                    <span className={profile.informedOfOutcomes ? "text-green-600" : "text-red-600"}>
                      {profile.informedOfOutcomes ? "Yes" : "No"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Complaint Handling */}
        <Section title="Complaint Handling">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">Total Complaints:</span>{" "}
              <span className="font-medium">{data.complaintHandling.totalComplaints}</span>
            </div>
            <div>
              <span className="text-gray-500">Resolved in Time:</span>{" "}
              <span className="font-medium">{data.complaintHandling.resolvedWithinTimescaleRate}%</span>
            </div>
            <div>
              <span className="text-gray-500">Child Informed:</span>{" "}
              <span className="font-medium">{data.complaintHandling.childInformedRate}%</span>
            </div>
            <div>
              <span className="text-gray-500">Child Supported:</span>{" "}
              <span className="font-medium">{data.complaintHandling.childSupportedRate}%</span>
            </div>
            <div>
              <span className="text-gray-500">Avg Resolution Days:</span>{" "}
              <span className="font-medium">{data.complaintHandling.averageResolutionDays}</span>
            </div>
            <div>
              <span className="text-gray-500">Escalations:</span>{" "}
              <span className="font-medium">{data.complaintHandling.escalationCount}</span>
            </div>
          </div>
        </Section>

        {/* Feedback Culture */}
        <Section title="Feedback Culture">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">Total Feedback:</span>{" "}
              <span className="font-medium">{data.feedbackCulture.totalFeedback}</span>
            </div>
            <div>
              <span className="text-gray-500">Acknowledged:</span>{" "}
              <span className="font-medium">{data.feedbackCulture.acknowledgedRate}%</span>
            </div>
            <div>
              <span className="text-gray-500">Acted Upon:</span>{" "}
              <span className="font-medium">{data.feedbackCulture.actedUponRate}%</span>
            </div>
            <div>
              <span className="text-gray-500">Timely Response:</span>{" "}
              <span className="font-medium">{data.feedbackCulture.responseTimelyRate}%</span>
            </div>
            <div>
              <span className="text-gray-500">Child Feedback:</span>{" "}
              <span className="font-medium">{data.feedbackCulture.childFeedbackCount}</span>
            </div>
            <div>
              <span className="text-gray-500">Compliments:</span>{" "}
              <span className="font-medium">{data.feedbackCulture.complimentCount}</span>
            </div>
          </div>
        </Section>

        {/* Learning Outcomes */}
        <Section title="Learning Outcomes">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">Total Lessons:</span>{" "}
              <span className="font-medium">{data.learningOutcomes.totalLessons}</span>
            </div>
            <div>
              <span className="text-gray-500">Implemented:</span>{" "}
              <span className="font-medium">{data.learningOutcomes.implementedRate}%</span>
            </div>
            <div>
              <span className="text-gray-500">Impact Assessed:</span>{" "}
              <span className="font-medium">{data.learningOutcomes.impactAssessedRate}%</span>
            </div>
            <div>
              <span className="text-gray-500">Shared with Team:</span>{" "}
              <span className="font-medium">{data.learningOutcomes.sharedWithTeamRate}%</span>
            </div>
            <div>
              <span className="text-gray-500">Policy Changes:</span>{" "}
              <span className="font-medium">{data.learningOutcomes.policyChangedCount}</span>
            </div>
          </div>
        </Section>

        {/* Policy Compliance */}
        <Section title="Policy Compliance">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">Child-Friendly Version:</span>{" "}
              <span className={`font-medium ${data.policyCompliance.childFriendlyVersion ? "text-green-600" : "text-red-600"}`}>
                {data.policyCompliance.childFriendlyVersion ? "Yes" : "No"}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Displayed Prominently:</span>{" "}
              <span className={`font-medium ${data.policyCompliance.displayedProminently ? "text-green-600" : "text-red-600"}`}>
                {data.policyCompliance.displayedProminently ? "Yes" : "No"}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Children Aware:</span>{" "}
              <span className={`font-medium ${data.policyCompliance.childrenAware ? "text-green-600" : "text-red-600"}`}>
                {data.policyCompliance.childrenAware ? "Yes" : "No"}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Advocacy Accessible:</span>{" "}
              <span className={`font-medium ${data.policyCompliance.advocacyAccessible ? "text-green-600" : "text-red-600"}`}>
                {data.policyCompliance.advocacyAccessible ? "Yes" : "No"}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Independent Person:</span>{" "}
              <span className={`font-medium ${data.policyCompliance.independentPerson ? "text-green-600" : "text-red-600"}`}>
                {data.policyCompliance.independentPerson ? "Yes" : "No"}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Audit Completed:</span>{" "}
              <span className={`font-medium ${data.policyCompliance.auditCompleted ? "text-green-600" : "text-red-600"}`}>
                {data.policyCompliance.auditCompleted ? "Yes" : "No"}
              </span>
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

"use client";

import { useState, useEffect } from "react";
import type { ChildrensRightsIntelligenceResult } from "@/lib/childrens-rights";

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

function ScoreBar({ score, label }: { score: number; label: string }) {
  const color =
    score >= 80 ? "bg-green-500" : score >= 60 ? "bg-blue-500" : score >= 40 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 w-40 shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2.5">
        <div className={`h-2.5 rounded-full ${color}`} style={{ width: `${Math.min(score, 100)}%` }} />
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

export function ChildrensRightsDashboardWidget() {
  const [data, setData] = useState<ChildrensRightsIntelligenceResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/childrens-rights")
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
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
        <h3 className="text-lg font-semibold text-red-800">Children&apos;s Rights Intelligence</h3>
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
            Children&apos;s Rights &amp; Advocacy Intelligence
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
            {data.guideCompliance.guidesCurrent}/{data.guideCompliance.totalChildren}
          </div>
          <div className="text-xs text-gray-500 mt-1">Current Guides</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">
            {data.advocacy.advocacyOfferedRate}%
          </div>
          <div className="text-xs text-gray-500 mt-1">Advocacy Offered</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">
            {data.participation.viewInfluencedOutcomeRate}%
          </div>
          <div className="text-xs text-gray-500 mt-1">Views Influencing Outcomes</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">
            {data.complaintAccess.feelsAbleToComplainRate}%
          </div>
          <div className="text-xs text-gray-500 mt-1">Feel Able to Complain</div>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-3">
        {/* Child Profiles */}
        <Section title="Child Rights Profiles" defaultOpen>
          <div className="space-y-3">
            {data.childProfiles.map((profile) => (
              <div key={profile.childId} className="border border-gray-100 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{profile.childName}</span>
                  <span className="text-sm font-medium text-gray-600">
                    Score: {profile.overallRightsScore}/100
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs text-gray-600">
                  <div>
                    <span className="text-gray-400">Guide:</span>{" "}
                    <span className={profile.guideStatus === "current" ? "text-green-600" : "text-amber-600"}>
                      {profile.guideStatus === "not_found" ? "Not Found" : profile.guideStatus.replace("_", " ")}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Rights Awareness:</span> {profile.rightsAwarenessScore}%
                  </div>
                  <div>
                    <span className="text-gray-400">Participation:</span> {profile.participationLevel}
                  </div>
                  <div>
                    <span className="text-gray-400">Advocacy:</span>{" "}
                    <span className={profile.advocacyStatus === "active" ? "text-green-600" : profile.advocacyStatus === "not_offered" ? "text-red-600" : "text-gray-600"}>
                      {profile.advocacyStatus.replace("_", " ")}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Complaint Access:</span> {profile.complaintAccessScore}%
                  </div>
                  <div>
                    <span className="text-gray-400">Feedback:</span> {profile.feedbackEngagement} entries
                  </div>
                </div>
                {profile.areasForDevelopment.length > 0 && (
                  <div className="mt-2 text-xs text-amber-600">
                    {profile.areasForDevelopment.join(" • ")}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>

        {/* Guide Compliance */}
        <Section title="Children's Guide Compliance">
          <div className="space-y-2">
            <ScoreBar score={data.guideCompliance.ageAppropriateRate} label="Age Appropriate" />
            <ScoreBar score={data.guideCompliance.accessibleFormatRate} label="Accessible Format" />
            <ScoreBar score={data.guideCompliance.coversComplaintsRate} label="Covers Complaints" />
            <ScoreBar score={data.guideCompliance.coversAdvocacyRate} label="Covers Advocacy" />
            <ScoreBar score={data.guideCompliance.coversRightsRate} label="Covers Rights" />
            <ScoreBar score={data.guideCompliance.coversOfstedRate} label="Covers Ofsted Contact" />
            <ScoreBar score={data.guideCompliance.childUnderstandingRate} label="Child Understanding" />
          </div>
          {data.guideCompliance.childrenNeedingUpdate.length > 0 && (
            <div className="mt-3 text-sm text-amber-600">
              Needs update: {data.guideCompliance.childrenNeedingUpdate.join(", ")}
            </div>
          )}
        </Section>

        {/* Advocacy */}
        <Section title="Advocacy Services">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">Total Records:</span>{" "}
              <span className="font-medium">{data.advocacy.totalRecords}</span>
            </div>
            <div>
              <span className="text-gray-500">Active Advocacy:</span>{" "}
              <span className="font-medium">{data.advocacy.activeAdvocacy}</span>
            </div>
            <div>
              <span className="text-gray-500">Offered Rate:</span>{" "}
              <span className="font-medium">{data.advocacy.advocacyOfferedRate}%</span>
            </div>
            <div>
              <span className="text-gray-500">Engaged Rate:</span>{" "}
              <span className="font-medium">{data.advocacy.advocacyEngagedRate}%</span>
            </div>
            <div>
              <span className="text-gray-500">Satisfaction:</span>{" "}
              <span className="font-medium">{data.advocacy.satisfactionRate}%</span>
            </div>
          </div>
          {data.advocacy.childrenWithoutAdvocacyOffer.length > 0 && (
            <div className="mt-3 text-sm text-red-600">
              Not offered advocacy: {data.advocacy.childrenWithoutAdvocacyOffer.join(", ")}
            </div>
          )}
        </Section>

        {/* Rights Awareness */}
        <Section title="Rights Awareness">
          <div className="text-sm text-gray-600 mb-2">
            Average rights understood: {data.rightsAwareness.averageRightsUnderstood} / {data.rightsAwareness.totalRightsCategories}
          </div>
          <div className="space-y-2">
            {Object.entries(data.rightsAwareness.categoryUnderstandingRates).map(([cat, rate]) => (
              <ScoreBar key={cat} score={rate as number} label={cat.replace(/_/g, " ")} />
            ))}
          </div>
          {data.rightsAwareness.childrenWithLowAwareness.length > 0 && (
            <div className="mt-3 text-sm text-amber-600">
              Low awareness: {data.rightsAwareness.childrenWithLowAwareness.join(", ")}
            </div>
          )}
        </Section>

        {/* Participation */}
        <Section title="Participation in Decisions">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">Records:</span>{" "}
              <span className="font-medium">{data.participation.totalRecords}</span>
            </div>
            <div>
              <span className="text-gray-500">Average Level:</span>{" "}
              <span className="font-medium">{data.participation.averageParticipationLevel}/5</span>
            </div>
            <div>
              <span className="text-gray-500">Views Recorded:</span>{" "}
              <span className="font-medium">{data.participation.childViewRecordedRate}%</span>
            </div>
            <div>
              <span className="text-gray-500">Influenced Outcome:</span>{" "}
              <span className="font-medium">{data.participation.viewInfluencedOutcomeRate}%</span>
            </div>
          </div>
          {data.participation.childrenWithLowParticipation.length > 0 && (
            <div className="mt-3 text-sm text-amber-600">
              Low participation: {data.participation.childrenWithLowParticipation.join(", ")}
            </div>
          )}
        </Section>

        {/* Complaint Access */}
        <Section title="Complaint Access">
          <div className="space-y-2">
            <ScoreBar score={data.complaintAccess.knowsHowToComplainRate} label="Knows How to Complain" />
            <ScoreBar score={data.complaintAccess.feelsAbleToComplainRate} label="Feels Able to Complain" />
            <ScoreBar score={data.complaintAccess.formsAccessibleRate} label="Forms Accessible" />
            <ScoreBar score={data.complaintAccess.advocacyOfferedRate} label="Advocacy Offered" />
          </div>
          {data.complaintAccess.barriersIdentified.length > 0 && (
            <div className="mt-3">
              <div className="text-sm font-medium text-gray-700 mb-1">Barriers Identified:</div>
              <ul className="text-sm text-amber-600 list-disc list-inside">
                {data.complaintAccess.barriersIdentified.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            </div>
          )}
        </Section>

        {/* Feedback */}
        <Section title="Child Feedback">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">Total Feedback:</span>{" "}
              <span className="font-medium">{data.feedback.totalFeedback}</span>
            </div>
            <div>
              <span className="text-gray-500">Acknowledged:</span>{" "}
              <span className="font-medium">{data.feedback.acknowledgedRate}%</span>
            </div>
            <div>
              <span className="text-gray-500">Action Taken:</span>{" "}
              <span className="font-medium">{data.feedback.actionTakenRate}%</span>
            </div>
            <div>
              <span className="text-gray-500">Outcome Shared:</span>{" "}
              <span className="font-medium">{data.feedback.outcomeSharedRate}%</span>
            </div>
            <div>
              <span className="text-gray-500">Satisfaction:</span>{" "}
              <span className="font-medium">{data.feedback.satisfactionRate}%</span>
            </div>
          </div>
        </Section>

        {/* Strengths / Areas / Actions */}
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
                <span className="text-blue-400 mt-0.5">§</span>
                <span>{link}</span>
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </div>
  );
}

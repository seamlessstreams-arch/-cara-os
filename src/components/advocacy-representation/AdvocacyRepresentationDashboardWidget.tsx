"use client";

import { useState, useEffect } from "react";
import type { AdvocacyRepresentationIntelligenceResult } from "@/lib/advocacy-representation";

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
      <span className="text-sm text-gray-600 w-44 shrink-0">{label}</span>
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

export function AdvocacyRepresentationDashboardWidget() {
  const [data, setData] = useState<AdvocacyRepresentationIntelligenceResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/advocacy-representation")
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
          Advocacy &amp; Representation Intelligence
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
            Advocacy &amp; Representation Intelligence
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
            {data.accessToAdvocacy.activeAdvocacyRate}%
          </div>
          <div className="text-xs text-gray-500 mt-1">Active Advocacy Rate</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">
            {data.independentVisitors.visitComplianceRate}%
          </div>
          <div className="text-xs text-gray-500 mt-1">IV Visit Compliance</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">
            {data.awarenessAndUnderstanding.childrenInformedOfRightsRate}%
          </div>
          <div className="text-xs text-gray-500 mt-1">Informed of Rights</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">
            {data.accessToAdvocacy.childSatisfactionAverage}/10
          </div>
          <div className="text-xs text-gray-500 mt-1">Advocacy Satisfaction</div>
        </div>
      </div>

      {/* Component Scores */}
      <div className="space-y-2">
        <ScoreBar score={data.accessToAdvocacy.score} label="Access to Advocacy" />
        <ScoreBar score={data.independentVisitors.score} label="Independent Visitors" />
        <ScoreBar score={data.awarenessAndUnderstanding.score} label="Awareness &amp; Understanding" />
        <ScoreBar score={data.policyAndProvision.score} label="Policy &amp; Provision" />
      </div>

      {/* Sections */}
      <div className="space-y-3">
        {/* Child Profiles */}
        <Section title="Child Advocacy Profiles" defaultOpen>
          <div className="space-y-3">
            {data.childProfiles.map((profile) => (
              <div key={profile.childId} className="border border-gray-100 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{profile.childName}</span>
                  <span className="text-sm font-medium text-gray-600">
                    Score: {profile.overallScore}/100
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs text-gray-600">
                  <div>
                    <span className="text-gray-400">Active Advocacy:</span>{" "}
                    <span className={profile.hasActiveAdvocacy ? "text-green-600" : "text-gray-600"}>
                      {profile.hasActiveAdvocacy ? "Yes" : "No"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">IV Assigned:</span>{" "}
                    <span className={profile.hasIndependentVisitor ? "text-green-600" : profile.needsIV ? "text-red-600" : "text-gray-600"}>
                      {profile.hasIndependentVisitor ? "Yes" : profile.needsIV ? "Needed" : "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">IV Compliance:</span>{" "}
                    {profile.hasIndependentVisitor ? `${profile.ivVisitCompliance}%` : "N/A"}
                  </div>
                  <div>
                    <span className="text-gray-400">Informed of Rights:</span>{" "}
                    <span className={profile.informedOfRights ? "text-green-600" : "text-red-600"}>
                      {profile.informedOfRights ? "Yes" : "No"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Knows Access:</span>{" "}
                    <span className={profile.knowsHowToAccess ? "text-green-600" : "text-red-600"}>
                      {profile.knowsHowToAccess ? "Yes" : "No"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Satisfaction:</span>{" "}
                    {profile.satisfaction > 0 ? `${profile.satisfaction}/10` : "N/A"}
                  </div>
                </div>
                {(profile.concerns?.length ?? 0) > 0 && (
                  <div className="mt-2 text-xs text-red-600">
                    {(profile.concerns ?? []).join(" • ")}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>

        {/* Access to Advocacy */}
        <Section title="Access to Advocacy">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">Total Referrals:</span>{" "}
              <span className="font-medium">{data.accessToAdvocacy.totalReferrals}</span>
            </div>
            <div>
              <span className="text-gray-500">Active Advocacy:</span>{" "}
              <span className="font-medium">{data.accessToAdvocacy.activeAdvocacyCount}</span>
            </div>
            <div>
              <span className="text-gray-500">Avg Response Time:</span>{" "}
              <span className="font-medium">{data.accessToAdvocacy.averageResponseTimeDays} days</span>
            </div>
            <div>
              <span className="text-gray-500">Satisfaction:</span>{" "}
              <span className="font-medium">{data.accessToAdvocacy.childSatisfactionAverage}/10</span>
            </div>
            <div>
              <span className="text-gray-500">Complaint Support:</span>{" "}
              <span className="font-medium">{data.accessToAdvocacy.complaintSupportRate}%</span>
            </div>
          </div>
          {data.accessToAdvocacy.childrenWithoutAdvocacy.length > 0 && (
            <div className="mt-3 text-sm text-red-600">
              No advocacy record: {data.accessToAdvocacy.childrenWithoutAdvocacy.join(", ")}
            </div>
          )}
        </Section>

        {/* Independent Visitors */}
        <Section title="Independent Visitors">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">Total Visitors:</span>{" "}
              <span className="font-medium">{data.independentVisitors.totalVisitors}</span>
            </div>
            <div>
              <span className="text-gray-500">Children with IV:</span>{" "}
              <span className="font-medium">
                {data.independentVisitors.childrenWithIV}/{data.independentVisitors.totalChildren}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Visit Compliance:</span>{" "}
              <span className="font-medium">{data.independentVisitors.visitComplianceRate}%</span>
            </div>
            <div>
              <span className="text-gray-500">Avg Engagement:</span>{" "}
              <span className="font-medium">{data.independentVisitors.averageEngagement}/10</span>
            </div>
          </div>
          {data.independentVisitors.childrenWithoutParentalContactMissingIV.length > 0 && (
            <div className="mt-3 text-sm text-red-600">
              Missing IV (no parental contact):{" "}
              {data.independentVisitors.childrenWithoutParentalContactMissingIV.join(", ")}
            </div>
          )}
        </Section>

        {/* Awareness */}
        <Section title="Awareness &amp; Understanding">
          <div className="space-y-2">
            <ScoreBar score={data.awarenessAndUnderstanding.understandsRightsRate} label="Understands Rights" />
            <ScoreBar score={data.awarenessAndUnderstanding.informedOfAdvocacyRate} label="Informed of Advocacy" />
            <ScoreBar score={data.awarenessAndUnderstanding.knowsHowToAccessRate} label="Knows How to Access" />
            <ScoreBar
              score={data.awarenessAndUnderstanding.childrenInformedOfRightsRate}
              label="Children Informed"
            />
          </div>
          {data.awarenessAndUnderstanding.childrenNotInformed.length > 0 && (
            <div className="mt-3 text-sm text-amber-600">
              Not yet informed: {data.awarenessAndUnderstanding.childrenNotInformed.join(", ")}
            </div>
          )}
        </Section>

        {/* Policy */}
        <Section title="Policy &amp; Provision">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">Policy Reviewed:</span>{" "}
              <span className={`font-medium ${data.policyAndProvision.policyReviewed ? "text-green-600" : "text-red-600"}`}>
                {data.policyAndProvision.policyReviewed ? "Yes" : "No"}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Provider Named:</span>{" "}
              <span className={`font-medium ${data.policyAndProvision.providerNamed ? "text-green-600" : "text-red-600"}`}>
                {data.policyAndProvision.providerNamed ? "Yes" : "No"}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Contract in Place:</span>{" "}
              <span className={`font-medium ${data.policyAndProvision.contractInPlace ? "text-green-600" : "text-red-600"}`}>
                {data.policyAndProvision.contractInPlace ? "Yes" : "No"}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Complaints Process:</span>{" "}
              <span className={`font-medium ${data.policyAndProvision.complaintsProcess ? "text-green-600" : "text-red-600"}`}>
                {data.policyAndProvision.complaintsProcess ? "Yes" : "No"}
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

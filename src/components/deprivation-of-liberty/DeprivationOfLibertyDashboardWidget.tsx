"use client";

import { useState, useEffect } from "react";
import type { DeprivationOfLibertyIntelligence } from "@/lib/deprivation-of-liberty";
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
      <span className="text-sm text-gray-600 w-48 shrink-0">{label}</span>
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

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
      {ok ? "✓" : "✗"} {label}
    </span>
  );
}

export function DeprivationOfLibertyDashboardWidget() {
  const [data, setData] = useState<DeprivationOfLibertyIntelligence | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/deprivation-of-liberty")
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
        <h3 className="text-lg font-semibold text-red-800">Deprivation of Liberty</h3>
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
          <h3 className="text-lg font-semibold text-gray-900">Deprivation of Liberty</h3>
          <p className="text-sm text-gray-500 mt-1">{data.periodStart} to {data.periodEnd}</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-gray-900">{data.overallScore}</div>
          <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${ratingColors[data.rating] || ""}`}>
            {ratingLabels[data.rating] || data.rating}
          </span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.authorisationCompliance.totalRestrictions}</div>
          <div className="text-xs text-gray-500 mt-1">Total Restrictions</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.authorisationCompliance.activeRestrictions}</div>
          <div className="text-xs text-gray-500 mt-1">Active</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{formatRate(data.authorisationCompliance.authorisedRate)}</div>
          <div className="text-xs text-gray-500 mt-1">Authorised</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className={`text-2xl font-bold ${data.proportionality.disproportionateCount === 0 ? "text-green-600" : "text-red-600"}`}>
            {data.proportionality.disproportionateCount}
          </div>
          <div className="text-xs text-gray-500 mt-1">Disproportionate</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{formatRate(data.rightsProtection.safeguardCoverage)}</div>
          <div className="text-xs text-gray-500 mt-1">Safeguard Coverage</div>
        </div>
      </div>

      {/* Component Scores */}
      <div className="space-y-2">
        <ScoreBar score={data.authorisationCompliance.overallScore} label="Authorisation Compliance" maxScore={30} />
        <ScoreBar score={data.proportionality.overallScore} label="Proportionality" maxScore={25} />
        <ScoreBar score={data.reviewSafeguards.overallScore} label="Review & Safeguards" maxScore={25} />
        <ScoreBar score={data.rightsProtection.overallScore} label="Rights Protection" maxScore={20} />
      </div>

      {/* Sections */}
      <div className="space-y-3">
        {data.childProfiles.length > 0 && (
          <Section title="Child DoLS Profiles" defaultOpen>
            <div className="space-y-3">
              {data.childProfiles.map((child) => (
                <div key={child.childId} className="border border-gray-100 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{child.childName}</span>
                    <span className="text-sm text-gray-500">{child.overallScore}/10</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    <StatusBadge ok={child.allAuthorised} label="Authorised" />
                    <StatusBadge ok={child.proportionalityStatus === "proportionate"} label={child.proportionalityStatus.replace(/_/g, " ")} />
                    <StatusBadge ok={child.reviewsUpToDate} label="Reviews Up to Date" />
                    <StatusBadge ok={child.safeguardsInPlace >= child.safeguardsRequired} label={`Safeguards ${child.safeguardsInPlace}/${child.safeguardsRequired}`} />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div>Active Restrictions: <span className="font-medium">{child.activeRestrictions}</span></div>
                    <div>Safeguards: <span className="font-medium">{child.safeguardsInPlace}/{child.safeguardsRequired}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        <Section title="Authorisation Compliance">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Total:</span> <span className="font-medium">{data.authorisationCompliance.totalRestrictions}</span></div>
            <div><span className="text-gray-500">Authorised:</span> <span className="font-medium">{formatRate(data.authorisationCompliance.authorisedRate)}</span></div>
            <div><span className="text-gray-500">Pending:</span> <span className={`font-medium ${data.authorisationCompliance.pendingApplications > 0 ? "text-amber-600" : "text-gray-900"}`}>{data.authorisationCompliance.pendingApplications}</span></div>
            <div><span className="text-gray-500">Expired:</span> <span className={`font-medium ${data.authorisationCompliance.expiredAuthorisations > 0 ? "text-red-600" : "text-green-600"}`}>{data.authorisationCompliance.expiredAuthorisations}</span></div>
            <div><span className="text-gray-500">Best Interests:</span> <span className="font-medium">{formatRate(data.authorisationCompliance.bestInterestsRate)}</span></div>
            <div><span className="text-gray-500">Least Restrictive:</span> <span className="font-medium">{formatRate(data.authorisationCompliance.leastRestrictiveRate)}</span></div>
            <div><span className="text-gray-500">Risk Assessed:</span> <span className="font-medium">{formatRate(data.authorisationCompliance.riskAssessmentRate)}</span></div>
          </div>
        </Section>

        <Section title="Proportionality Assessment">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Proportionate:</span> <span className="font-medium">{formatRate(data.proportionality.proportionateRate)}</span></div>
            <div><span className="text-gray-500">Disproportionate:</span> <span className={`font-medium ${data.proportionality.disproportionateCount > 0 ? "text-red-600" : "text-green-600"}`}>{data.proportionality.disproportionateCount}</span></div>
            <div><span className="text-gray-500">Not Assessed:</span> <span className={`font-medium ${data.proportionality.notAssessedCount > 0 ? "text-amber-600" : "text-gray-900"}`}>{data.proportionality.notAssessedCount}</span></div>
            <div><span className="text-gray-500">Avg Duration:</span> <span className="font-medium">{data.proportionality.averageActiveDurationDays === null ? "—" : `${data.proportionality.averageActiveDurationDays}d`}</span></div>
          </div>
          {Object.keys(data.proportionality.restrictionTypeBreakdown).length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {Object.entries(data.proportionality.restrictionTypeBreakdown).map(([type, count]) => (
                <span key={type} className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-700">
                  {type.replace(/_/g, " ")}: {count}
                </span>
              ))}
            </div>
          )}
        </Section>

        <Section title="Review & Safeguards">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Total Reviews:</span> <span className="font-medium">{data.reviewSafeguards.totalReviews}</span></div>
            <div><span className="text-gray-500">On Time:</span> <span className="font-medium">{data.reviewSafeguards.reviewsOnTime}</span></div>
            <div><span className="text-gray-500">Overdue:</span> <span className={`font-medium ${data.reviewSafeguards.overdueReviews > 0 ? "text-red-600" : "text-green-600"}`}>{data.reviewSafeguards.overdueReviews}</span></div>
            <div><span className="text-gray-500">Child Views:</span> <span className="font-medium">{formatRate(data.reviewSafeguards.childViewsRate)}</span></div>
            <div><span className="text-gray-500">Family Consulted:</span> <span className="font-medium">{formatRate(data.reviewSafeguards.familyConsultedRate)}</span></div>
            <div><span className="text-gray-500">Independent Involved:</span> <span className="font-medium">{formatRate(data.reviewSafeguards.independentInvolvementRate)}</span></div>
            <div><span className="text-gray-500">Proportionality Reviewed:</span> <span className="font-medium">{formatRate(data.reviewSafeguards.proportionalityReassessedRate)}</span></div>
            <div><span className="text-gray-500">Less Restrictive Considered:</span> <span className="font-medium">{formatRate(data.reviewSafeguards.lessRestrictiveConsideredRate)}</span></div>
          </div>
        </Section>

        <Section title="Rights Protection">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Safeguard Coverage:</span> <span className="font-medium">{formatRate(data.rightsProtection.safeguardCoverage)}</span></div>
            <div><span className="text-gray-500">Advocacy:</span> <span className="font-medium">{formatRate(data.rightsProtection.advocacyRate)}</span></div>
            <div><span className="text-gray-500">Legal Rep:</span> <span className="font-medium">{formatRate(data.rightsProtection.legalRepresentationRate)}</span></div>
            <div><span className="text-gray-500">Rights Info:</span> <span className="font-medium">{formatRate(data.rightsProtection.rightsInformationRate)}</span></div>
            <div><span className="text-gray-500">Family Notified:</span> <span className="font-medium">{formatRate(data.rightsProtection.familyNotificationRate)}</span></div>
            <div><span className="text-gray-500">Ofsted Notified:</span> <span className="font-medium">{formatRate(data.rightsProtection.ofstedNotificationRate)}</span></div>
            <div><span className="text-gray-500">Court Order Compliance:</span> <span className="font-medium">{formatRate(data.rightsProtection.courtOrderComplianceRate)}</span></div>
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

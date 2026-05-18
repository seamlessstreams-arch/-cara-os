"use client";

// ══════════════════════════════════════════════════════════════════════════════
// FAMILY CONTACT & COMMUNICATION DASHBOARD WIDGET
//
// Displays family contact intelligence:
// - Overall contact quality rating
// - Compliance with court-ordered contact
// - Session outcomes and quality metrics
// - Post-contact impact patterns
// - Per-child contact summaries
// - Immediate safeguarding actions
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";

interface ContactComplianceData {
  totalArrangements: number;
  courtOrderedCount: number;
  courtOrderedCompliant: number;
  courtOrderedComplianceRate: number;
  sessionsScheduled: number;
  sessionsCompleted: number;
  completionRate: number;
  cancellationsByFamily: number;
  cancellationsByHome: number;
  childRefusals: number;
  noShows: number;
}

interface ContactQualityData {
  totalSessions: number;
  positiveOutcomes: number;
  negativeOutcomes: number;
  distressingOutcomes: number;
  positiveRate: number;
  childPreparedRate: number;
  childVoiceRecordedRate: number;
  placingAuthorityInformedRate: number;
  averageDurationMinutes: number;
}

interface ImpactEntry {
  indicator: string;
  count: number;
  label?: string;
}

interface ImpactPatternEntry {
  familyMember: string;
  contactType: string;
  contactTypeLabel?: string;
  predominantImpact: "positive" | "mixed" | "negative";
  sessionCount: number;
}

interface ContactImpactData {
  totalSessions: number;
  sessionsWithImpactData: number;
  settledAfterRate: number;
  dysregulatedAfterRate: number;
  highRiskImpacts: ImpactEntry[];
  impactPatterns: ImpactPatternEntry[];
}

interface ChildSummary {
  childId: string;
  childName: string;
  arrangementsCount: number;
  sessionsCount: number;
  completionRate: number;
  positiveRate: number;
  primaryConcern?: string;
}

interface FamilyContactData {
  homeId: string;
  assessedAt: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: string;
  compliance: ContactComplianceData;
  quality: ContactQualityData;
  impact: ContactImpactData;
  childSummaries: ChildSummary[];
  reviewsDue: number;
  reviewsOverdue: number;
  strengths: string[];
  areasForDevelopment: string[];
  immediateActions: string[];
  regulatoryLinks: string[];
  meta?: {
    impactLabels: ImpactEntry[];
    patternLabels: ImpactPatternEntry[];
  };
}

// ── Rating Badge ───────────────────────────────────────────────────────────

function RatingBadge({ score, rating }: { score: number; rating: string }) {
  const colorClass =
    rating === "outstanding" ? "bg-green-100 text-green-800 border-green-300"
      : rating === "good" ? "bg-blue-100 text-blue-800 border-blue-300"
        : rating === "requires_improvement" ? "bg-orange-100 text-orange-800 border-orange-300"
          : "bg-red-100 text-red-800 border-red-300";

  const label =
    rating === "outstanding" ? "Outstanding"
      : rating === "good" ? "Good"
        : rating === "requires_improvement" ? "Requires Improvement"
          : "Inadequate";

  return (
    <div className={`rounded-lg border px-4 py-3 text-center ${colorClass}`}>
      <div className="text-3xl font-bold">{score}</div>
      <div className="text-sm font-medium mt-1">{label}</div>
    </div>
  );
}

// ── Compliance Gauge ──────────────────────────────────────────────────────

function ComplianceGauge({ rate, label }: { rate: number; label: string }) {
  const barColor =
    rate >= 90 ? "bg-green-500"
      : rate >= 70 ? "bg-blue-500"
        : rate >= 50 ? "bg-orange-500"
          : "bg-red-500";

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-600">{label}</span>
        <span className="font-semibold">{rate}%</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${rate}%` }} />
      </div>
    </div>
  );
}

// ── Child Contact Card ────────────────────────────────────────────────────

function ChildContactCard({ child }: { child: ChildSummary }) {
  const rateColor = (r: number) =>
    r >= 80 ? "text-green-700" : r >= 60 ? "text-blue-700" : r >= 40 ? "text-orange-700" : "text-red-700";

  return (
    <div className={`rounded-lg border p-3 ${child.primaryConcern ? "border-red-200 bg-red-50" : "border-gray-200 bg-gray-50"}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-sm">{child.childName}</span>
        <span className="text-xs text-gray-500">{child.arrangementsCount} arrangement{child.arrangementsCount !== 1 ? "s" : ""}</span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="text-xs text-gray-500">Sessions</div>
          <div className="text-sm font-bold text-gray-800">{child.sessionsCount}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Completed</div>
          <div className={`text-sm font-bold ${rateColor(child.completionRate)}`}>{child.completionRate}%</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Positive</div>
          <div className={`text-sm font-bold ${rateColor(child.positiveRate)}`}>{child.positiveRate}%</div>
        </div>
      </div>
      {child.primaryConcern && (
        <div className="mt-2 text-[10px] text-red-700 bg-red-100 rounded px-2 py-1">
          {child.primaryConcern}
        </div>
      )}
    </div>
  );
}

// ── Impact Pattern Badge ──────────────────────────────────────────────────

function ImpactBadge({ pattern }: { pattern: ImpactPatternEntry }) {
  const impactColor =
    pattern.predominantImpact === "positive" ? "bg-green-100 text-green-700 border-green-200"
      : pattern.predominantImpact === "negative" ? "bg-red-100 text-red-700 border-red-200"
        : "bg-yellow-100 text-yellow-700 border-yellow-200";

  return (
    <div className={`rounded border px-2 py-1.5 text-xs ${impactColor}`}>
      <div className="font-medium">{pattern.familyMember}</div>
      <div className="text-[10px] opacity-80">
        {pattern.contactTypeLabel ?? pattern.contactType.replace(/_/g, " ")} ({pattern.sessionCount}) — {pattern.predominantImpact}
      </div>
    </div>
  );
}

// ── Main Widget ────────────────────────────────────────────────────────────

export function FamilyContactDashboardWidget() {
  const [data, setData] = useState<FamilyContactData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/family-contact");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setData(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="h-24 bg-gray-100 rounded" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white border border-red-200 rounded-xl p-6">
        <h3 className="font-semibold text-red-800">Family Contact Intelligence</h3>
        <p className="text-sm text-red-600 mt-1">{error ?? "No data available"}</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900 text-lg">
            Family Contact Intelligence
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {data.compliance.totalArrangements} arrangements | {data.compliance.courtOrderedCount} court-ordered | {data.compliance.sessionsScheduled} sessions this period
          </p>
        </div>
        <RatingBadge score={data.overallScore} rating={data.rating} />
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="text-center p-2 bg-blue-50 rounded-lg">
          <div className="text-xl font-bold text-blue-700">{data.compliance.courtOrderedComplianceRate}%</div>
          <div className="text-[10px] text-gray-500 uppercase">Court Order Compliance</div>
        </div>
        <div className="text-center p-2 bg-green-50 rounded-lg">
          <div className="text-xl font-bold text-green-700">{data.quality.positiveRate}%</div>
          <div className="text-[10px] text-gray-500 uppercase">Positive Outcomes</div>
        </div>
        <div className="text-center p-2 bg-purple-50 rounded-lg">
          <div className="text-xl font-bold text-purple-700">{data.quality.childVoiceRecordedRate}%</div>
          <div className="text-[10px] text-gray-500 uppercase">Child Voice Captured</div>
        </div>
        <div className="text-center p-2 bg-orange-50 rounded-lg">
          <div className="text-xl font-bold text-orange-700">{data.impact.dysregulatedAfterRate}%</div>
          <div className="text-[10px] text-gray-500 uppercase">Dysregulation Rate</div>
        </div>
      </div>

      {/* Compliance Bars */}
      <div className="space-y-2 mb-4">
        <ComplianceGauge rate={data.compliance.completionRate} label="Session Completion" />
        <ComplianceGauge rate={data.quality.childPreparedRate} label="Child Preparation" />
        <ComplianceGauge rate={data.quality.placingAuthorityInformedRate} label="Placing Authority Informed" />
      </div>

      {/* Cancellation/Refusal Summary */}
      {(data.compliance.cancellationsByHome > 0 || data.compliance.childRefusals > 0 || data.compliance.noShows > 0) && (
        <div className="flex flex-wrap gap-2 mb-4">
          {data.compliance.cancellationsByHome > 0 && (
            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
              {data.compliance.cancellationsByHome} cancelled by home
            </span>
          )}
          {data.compliance.cancellationsByFamily > 0 && (
            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
              {data.compliance.cancellationsByFamily} cancelled by family
            </span>
          )}
          {data.compliance.childRefusals > 0 && (
            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
              {data.compliance.childRefusals} child refusal{data.compliance.childRefusals !== 1 ? "s" : ""}
            </span>
          )}
          {data.compliance.noShows > 0 && (
            <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
              {data.compliance.noShows} no-show{data.compliance.noShows !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      )}

      {/* Child Contact Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        {data.childSummaries.map((child) => (
          <ChildContactCard key={child.childId} child={child} />
        ))}
      </div>

      {/* Impact Patterns */}
      {(data.meta?.patternLabels ?? data.impact.impactPatterns).length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-semibold text-gray-600 uppercase mb-2">Post-Contact Impact Patterns</h4>
          <div className="flex flex-wrap gap-2">
            {(data.meta?.patternLabels ?? data.impact.impactPatterns).map((pattern, i) => (
              <ImpactBadge key={i} pattern={pattern} />
            ))}
          </div>
        </div>
      )}

      {/* High-Risk Impacts */}
      {(data.meta?.impactLabels ?? data.impact.highRiskImpacts).length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <h4 className="text-sm font-semibold text-red-800 mb-2">High-Risk Impact Indicators</h4>
          <div className="flex flex-wrap gap-2">
            {(data.meta?.impactLabels ?? data.impact.highRiskImpacts).map((h, i) => (
              <span key={i} className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded font-medium">
                {h.label ?? h.indicator.replace(/_/g, " ")} ({h.count})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Immediate Actions */}
      {data.immediateActions.length > 0 &&
        !data.immediateActions[0].startsWith("No immediate actions") && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
            <h4 className="text-sm font-semibold text-amber-800 mb-2">Required Actions</h4>
            <ul className="space-y-1">
              {data.immediateActions.map((action, i) => (
                <li key={i} className="text-xs text-amber-700 flex items-start gap-1.5">
                  <span className="mt-0.5 shrink-0">
                    {action.startsWith("HIGH") ? "🔴" : action.startsWith("MEDIUM") ? "🟠" : "🟡"}
                  </span>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

      {/* Reviews Overdue */}
      {data.reviewsOverdue > 0 && (
        <div className="flex items-center gap-2 mb-4 p-2 bg-orange-50 border border-orange-200 rounded-lg">
          <span className="text-orange-600 text-lg">📋</span>
          <span className="text-xs text-orange-700 font-medium">
            {data.reviewsOverdue} contact arrangement review{data.reviewsOverdue !== 1 ? "s" : ""} overdue — schedule with placing authority
          </span>
        </div>
      )}

      {/* Expand */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-sm text-blue-600 hover:text-blue-800 font-medium w-full text-left"
      >
        {expanded ? "Hide details ▲" : "Show quality insights & regulatory links ▼"}
      </button>

      {expanded && (
        <div className="mt-4 space-y-4">
          {/* Quality Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center p-2 bg-green-50 rounded">
              <div className="text-lg font-bold text-green-700">{data.impact.settledAfterRate}%</div>
              <div className="text-[10px] text-gray-500">Settled After</div>
            </div>
            <div className="text-center p-2 bg-blue-50 rounded">
              <div className="text-lg font-bold text-blue-700">{data.quality.averageDurationMinutes}m</div>
              <div className="text-[10px] text-gray-500">Avg Duration</div>
            </div>
            <div className="text-center p-2 bg-purple-50 rounded">
              <div className="text-lg font-bold text-purple-700">{data.impact.sessionsWithImpactData}</div>
              <div className="text-[10px] text-gray-500">Impact Recorded</div>
            </div>
            <div className="text-center p-2 bg-gray-100 rounded">
              <div className="text-lg font-bold text-gray-700">{data.reviewsDue}</div>
              <div className="text-[10px] text-gray-500">Reviews Due</div>
            </div>
          </div>

          {/* Strengths */}
          {data.strengths.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-green-800 mb-2">Strengths</h4>
              <ul className="space-y-1">
                {data.strengths.map((s, i) => (
                  <li key={i} className="text-xs text-green-700">+ {s}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Areas for Development */}
          {data.areasForDevelopment.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-orange-800 mb-2">Areas for Development</h4>
              <ul className="space-y-1">
                {data.areasForDevelopment.map((area, i) => (
                  <li key={i} className="text-xs text-orange-700">- {area}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Regulatory Links */}
          {data.regulatoryLinks.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-800 mb-2">Regulatory References</h4>
              <ul className="space-y-1">
                {data.regulatoryLinks.map((link, i) => (
                  <li key={i} className="text-xs text-gray-600">{link}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

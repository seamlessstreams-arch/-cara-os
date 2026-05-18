"use client";

// ══════════════════════════════════════════════════════════════════════════════
// ALLEGATIONS AGAINST STAFF DASHBOARD WIDGET
//
// Displays allegations intelligence:
// - Overall allegation management rating
// - LADO referral compliance
// - Ofsted notification compliance
// - Allegation category and source breakdowns
// - Staff profiles with risk indicators
// - Investigation status tracking
// - Immediate safeguarding actions
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";

interface CategoryEntry {
  category: string;
  count: number;
  label?: string;
}

interface SourceEntry {
  source: string;
  count: number;
  label?: string;
}

interface OutcomeEntry {
  outcome: string;
  count: number;
  label?: string;
}

interface StaffMultiple {
  staffId: string;
  staffName: string;
  count: number;
}

interface PatternsData {
  categoryBreakdown: CategoryEntry[];
  sourceBreakdown: SourceEntry[];
  outcomeBreakdown: OutcomeEntry[];
  staffWithMultiple: StaffMultiple[];
  averageResolutionDays: number;
  ongoingCount: number;
  categoryLabels?: CategoryEntry[];
  sourceLabels?: SourceEntry[];
  outcomeLabels?: OutcomeEntry[];
}

interface StaffProfileData {
  staffId: string;
  staffName: string;
  role: string;
  allegationCount: number;
  categories: string[];
  categoryLabels?: string[];
  outcomes: string[];
  outcomeLabels?: string[];
  currentAction: string;
  actionLabel?: string;
  isHighRisk: boolean;
  riskReason?: string;
}

interface ComplianceData {
  totalAllegations: number;
  ladoReferralsMade: number;
  ladoReferralsRequired: number;
  ladoTimelinessRate: number;
  ofstedNotifications: number;
  ofstedNotificationsRequired: number;
  ofstedTimelinessRate: number;
  placingAuthorityNotifiedRate: number;
  riNotifiedRate: number;
  dbsReferralsMade: number;
  dbsReferralsRequired: number;
}

interface AllegationsData {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: string;
  compliance: ComplianceData;
  patterns: PatternsData;
  staffProfiles: StaffProfileData[];
  childSupportRate: number;
  staffSupportRate: number;
  strengths: string[];
  concerns: string[];
  immediateActions: string[];
  regulatoryLinks: string[];
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

// ── Compliance Bar ────────────────────────────────────────────────────────

function ComplianceBar({ rate, label, denominator }: { rate: number; label: string; denominator?: string }) {
  const barColor =
    rate >= 90 ? "bg-green-500"
      : rate >= 70 ? "bg-blue-500"
        : rate >= 50 ? "bg-orange-500"
          : "bg-red-500";

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-600">{label}</span>
        <span className="font-semibold">{rate}%{denominator ? ` (${denominator})` : ""}</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${rate}%` }} />
      </div>
    </div>
  );
}

// ── Staff Profile Card ────────────────────────────────────────────────────

function StaffProfileCard({ profile }: { profile: StaffProfileData }) {
  return (
    <div className={`rounded-lg border p-3 ${profile.isHighRisk ? "border-red-200 bg-red-50" : "border-gray-200"}`}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-medium text-sm">{profile.staffName}</span>
        {profile.isHighRisk && (
          <span className="text-[10px] bg-red-600 text-white px-1.5 py-0.5 rounded font-medium">HIGH RISK</span>
        )}
      </div>
      <div className="text-xs text-gray-500 mb-2">{profile.role}</div>
      <div className="flex flex-wrap gap-1 mb-2">
        {(profile.categoryLabels ?? profile.categories).map((cat, i) => (
          <span key={i} className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">
            {typeof cat === "string" ? cat.replace(/_/g, " ") : cat}
          </span>
        ))}
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-500">{profile.allegationCount} allegation{profile.allegationCount !== 1 ? "s" : ""}</span>
        <span className={`font-medium px-2 py-0.5 rounded ${
          profile.currentAction === "suspended" ? "bg-red-100 text-red-700"
            : profile.currentAction === "dismissed" ? "bg-red-200 text-red-800"
              : profile.currentAction === "restricted_duties" ? "bg-orange-100 text-orange-700"
                : profile.currentAction === "no_action" ? "bg-gray-100 text-gray-600"
                  : "bg-yellow-100 text-yellow-700"
        }`}>
          {profile.actionLabel ?? profile.currentAction.replace(/_/g, " ")}
        </span>
      </div>
      {profile.riskReason && (
        <div className="mt-1.5 text-[10px] text-red-600">{profile.riskReason}</div>
      )}
    </div>
  );
}

// ── Main Widget ────────────────────────────────────────────────────────────

export function AllegationsDashboardWidget() {
  const [data, setData] = useState<AllegationsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/allegations");
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
        <h3 className="font-semibold text-red-800">Allegations Intelligence</h3>
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
            Allegations Intelligence
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {data.compliance.totalAllegations} allegation{data.compliance.totalAllegations !== 1 ? "s" : ""} this period | LADO & Ofsted compliance tracking
          </p>
        </div>
        <RatingBadge score={data.overallScore} rating={data.rating} />
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="text-center p-2 bg-blue-50 rounded-lg">
          <div className="text-xl font-bold text-blue-700">{data.compliance.totalAllegations}</div>
          <div className="text-[10px] text-gray-500 uppercase">Total Allegations</div>
        </div>
        <div className="text-center p-2 bg-orange-50 rounded-lg">
          <div className="text-xl font-bold text-orange-700">{data.patterns.ongoingCount}</div>
          <div className="text-[10px] text-gray-500 uppercase">Ongoing</div>
        </div>
        <div className="text-center p-2 bg-purple-50 rounded-lg">
          <div className="text-xl font-bold text-purple-700">{data.patterns.averageResolutionDays}d</div>
          <div className="text-[10px] text-gray-500 uppercase">Avg Resolution</div>
        </div>
        <div className="text-center p-2 bg-red-50 rounded-lg">
          <div className="text-xl font-bold text-red-700">{data.staffProfiles.filter((p) => p.isHighRisk).length}</div>
          <div className="text-[10px] text-gray-500 uppercase">High-Risk Staff</div>
        </div>
      </div>

      {/* Compliance Bars */}
      <div className="space-y-2 mb-4">
        <ComplianceBar
          rate={data.compliance.ladoReferralsRequired > 0
            ? Math.round((data.compliance.ladoReferralsMade / data.compliance.ladoReferralsRequired) * 100) : 100}
          label="LADO Referral Compliance"
          denominator={`${data.compliance.ladoReferralsMade}/${data.compliance.ladoReferralsRequired}`}
        />
        <ComplianceBar rate={data.compliance.ladoTimelinessRate} label="LADO Timeliness (within 1 day)" />
        <ComplianceBar
          rate={data.compliance.ofstedNotificationsRequired > 0
            ? Math.round((data.compliance.ofstedNotifications / data.compliance.ofstedNotificationsRequired) * 100) : 100}
          label="Ofsted Notification Compliance"
          denominator={`${data.compliance.ofstedNotifications}/${data.compliance.ofstedNotificationsRequired}`}
        />
        <ComplianceBar rate={data.compliance.placingAuthorityNotifiedRate} label="Placing Authority Notified" />
      </div>

      {/* Category Breakdown */}
      {(data.patterns.categoryLabels ?? data.patterns.categoryBreakdown).length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-semibold text-gray-600 uppercase mb-2">Allegation Categories</h4>
          <div className="flex flex-wrap gap-1.5">
            {(data.patterns.categoryLabels ?? data.patterns.categoryBreakdown).map((c, i) => (
              <span key={i} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                {c.label ?? c.category.replace(/_/g, " ")} ({c.count})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Staff Profiles */}
      {data.staffProfiles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          {data.staffProfiles.map((profile) => (
            <StaffProfileCard key={profile.staffId} profile={profile} />
          ))}
        </div>
      )}

      {/* Immediate Actions */}
      {data.immediateActions.length > 0 &&
        !data.immediateActions[0].startsWith("No immediate actions") && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <h4 className="text-sm font-semibold text-red-800 mb-2">Required Actions</h4>
            <ul className="space-y-1">
              {data.immediateActions.map((action, i) => (
                <li key={i} className="text-xs text-red-700 flex items-start gap-1.5">
                  <span className="mt-0.5 shrink-0">
                    {action.startsWith("URGENT") ? "🔴" : action.startsWith("HIGH") ? "🟠" : "🟡"}
                  </span>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

      {/* Expand */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-sm text-blue-600 hover:text-blue-800 font-medium w-full text-left"
      >
        {expanded ? "Hide details ▲" : "Show support rates, sources & regulatory links ▼"}
      </button>

      {expanded && (
        <div className="mt-4 space-y-4">
          {/* Support Rates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-2 bg-green-50 rounded">
              <div className="text-lg font-bold text-green-700">{data.childSupportRate}%</div>
              <div className="text-[10px] text-gray-500">Child Support Offered</div>
            </div>
            <div className="text-center p-2 bg-blue-50 rounded">
              <div className="text-lg font-bold text-blue-700">{data.staffSupportRate}%</div>
              <div className="text-[10px] text-gray-500">Staff Support Offered</div>
            </div>
          </div>

          {/* Source Breakdown */}
          {(data.patterns.sourceLabels ?? data.patterns.sourceBreakdown).length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-800 mb-2">Sources</h4>
              <div className="flex flex-wrap gap-1.5">
                {(data.patterns.sourceLabels ?? data.patterns.sourceBreakdown).map((s, i) => (
                  <span key={i} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                    {s.label ?? s.source.replace(/_/g, " ")} ({s.count})
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Outcomes */}
          {(data.patterns.outcomeLabels ?? data.patterns.outcomeBreakdown).length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-800 mb-2">Outcomes</h4>
              <div className="flex flex-wrap gap-1.5">
                {(data.patterns.outcomeLabels ?? data.patterns.outcomeBreakdown).map((o, i) => {
                  const color = o.outcome === "substantiated" ? "bg-red-100 text-red-700"
                    : o.outcome === "ongoing" ? "bg-orange-100 text-orange-700"
                      : "bg-green-100 text-green-700";
                  return (
                    <span key={i} className={`text-xs px-2 py-1 rounded ${color}`}>
                      {o.label ?? o.outcome} ({o.count})
                    </span>
                  );
                })}
              </div>
            </div>
          )}

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

          {/* Concerns */}
          {data.concerns.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-orange-800 mb-2">Concerns</h4>
              <ul className="space-y-1">
                {data.concerns.map((c, i) => (
                  <li key={i} className="text-xs text-orange-700">- {c}</li>
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

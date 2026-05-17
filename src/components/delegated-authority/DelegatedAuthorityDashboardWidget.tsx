// ══════════════════════════════════════════════════════════════════════════════
// DelegatedAuthorityDashboardWidget — Normalcy & Consent Management card
// ══════════════════════════════════════════════════════════════════════════════

"use client";

import { useEffect, useState } from "react";

interface DelegatedAuthorityEntry {
  category: string;
  authorityLevel: string;
  notes?: string;
}

interface ConsentRecord {
  id: string;
  childId: string;
  category: string;
  description: string;
  consentStatus: string;
  consentFrom: string;
  evidenceHeld: boolean;
}

interface ChildResult {
  childId: string;
  childName: string;
  isCompliant: boolean;
  issues: string[];
  warnings: string[];
  normalcyScore: number;
  fullyDelegatedCount: number;
  restrictedCount: number;
  coverageRate: number;
  pendingConsents: number;
  expiredConsents: number;
  consentEvidenceRate: number;
  reviewOverdue: boolean;
  daysUntilReviewDue: number;
}

interface HomeMetrics {
  homeId: string;
  childrenWithSchedule: number;
  totalChildren: number;
  scheduleCompletionRate: number;
  averageCoverageRate: number;
  averageNormalcyScore: number;
  mostRestrictedCategories: { category: string; count: number }[];
  reviewsOverdue: number;
  nextReviewDue: string;
  totalPendingConsents: number;
  totalExpiredConsents: number;
  consentEvidenceRate: number;
  complianceIssues: string[];
}

interface Profile {
  childId: string;
  childName: string;
  placingAuthority: string;
  socialWorkerName: string;
  delegatedAuthority: DelegatedAuthorityEntry[];
  consentRecords: ConsentRecord[];
}

interface DashboardData {
  metrics: HomeMetrics;
  childResults: ChildResult[];
  profiles: Profile[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function getScoreColour(score: number): string {
  if (score >= 75) return "text-green-600";
  if (score >= 50) return "text-amber-600";
  return "text-red-600";
}

function getScoreBg(score: number): string {
  if (score >= 75) return "bg-green-50";
  if (score >= 50) return "bg-amber-50";
  return "bg-red-50";
}

function getAuthorityColour(level: string): string {
  switch (level) {
    case "home_decides": return "bg-green-100 text-green-800";
    case "home_with_notification": return "bg-blue-100 text-blue-800";
    case "la_consent_required": return "bg-amber-100 text-amber-800";
    case "parent_consent_required": return "bg-purple-100 text-purple-800";
    case "court_order_required": return "bg-red-100 text-red-800";
    case "not_delegated": return "bg-slate-100 text-slate-800";
    default: return "bg-slate-100 text-slate-800";
  }
}

function getAuthorityLabel(level: string): string {
  const labels: Record<string, string> = {
    home_decides: "Home Decides",
    home_with_notification: "Home (Notify)",
    la_consent_required: "LA Consent",
    parent_consent_required: "Parent Consent",
    court_order_required: "Court Order",
    not_delegated: "Not Delegated",
  };
  return labels[level] ?? level;
}

function getCategoryLabel(cat: string): string {
  const labels: Record<string, string> = {
    routine_medical: "Routine Medical",
    specialist_medical: "Specialist Medical",
    dental: "Dental",
    overnight_stays: "Sleepovers",
    school_trips: "School Trips",
    haircut: "Haircuts",
    ear_piercing: "Piercing/Body Mod",
    social_media: "Social Media",
    mobile_phone: "Phone/Devices",
    leisure_activities: "Leisure/Clubs",
    travel_domestic: "Domestic Travel",
    travel_international: "International Travel",
    religious_observance: "Religious",
    diet_changes: "Diet Changes",
    education_decisions: "Education",
    contact_arrangements: "Contact",
    photographs_media: "Photos/Media",
    vaccinations: "Vaccinations",
    emergency_medical: "Emergency Medical",
    pocket_money_amounts: "Pocket Money",
    clothing_choices: "Clothing",
    relationships_dating: "Relationships",
  };
  return labels[cat] ?? cat;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

// ── Component ────────────────────────────────────────────────────────────────

export function DelegatedAuthorityDashboardWidget() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedChild, setSelectedChild] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/delegated-authority?homeId=home-oak&mode=dashboard")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch delegated authority data");
        return res.json();
      })
      .then((json) => setData(json))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm animate-pulse">
        <div className="h-6 w-56 bg-slate-200 rounded mb-4" />
        <div className="space-y-3">
          <div className="h-4 w-full bg-slate-100 rounded" />
          <div className="h-4 w-3/4 bg-slate-100 rounded" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <p className="text-red-700 text-sm">Error loading delegated authority data: {error}</p>
      </div>
    );
  }

  const { metrics, childResults, profiles } = data;
  const activeChild = selectedChild
    ? childResults.find(c => c.childId === selectedChild) ?? childResults[0]
    : null;
  const activeProfile = selectedChild
    ? profiles.find(p => p.childId === selectedChild) ?? null
    : null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Delegated Authority & Consent
          </h3>
          <p className="text-sm text-slate-500 mt-0.5">
            Normalcy principle, decision-making, consent tracking
          </p>
        </div>
        <div className="text-right">
          <p className={`text-2xl font-bold ${getScoreColour(metrics.averageNormalcyScore)}`}>
            {metrics.averageNormalcyScore}%
          </p>
          <p className="text-xs text-slate-400">normalcy score</p>
        </div>
      </div>

      {/* Home-level Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Schedules"
          value={`${metrics.scheduleCompletionRate}%`}
          sub={`${metrics.childrenWithSchedule}/${metrics.totalChildren} children`}
          score={metrics.scheduleCompletionRate}
        />
        <MetricCard
          label="Coverage"
          value={`${metrics.averageCoverageRate}%`}
          sub="categories addressed"
          score={metrics.averageCoverageRate}
        />
        <MetricCard
          label="Consent Evidence"
          value={`${metrics.consentEvidenceRate}%`}
          sub="written evidence"
          score={metrics.consentEvidenceRate}
        />
        <MetricCard
          label="Pending Consents"
          value={String(metrics.totalPendingConsents)}
          sub={metrics.totalExpiredConsents > 0 ? `${metrics.totalExpiredConsents} expired` : "none expired"}
          score={metrics.totalPendingConsents === 0 ? 100 : metrics.totalPendingConsents <= 2 ? 60 : 30}
        />
      </div>

      {/* Per-Child Normalcy */}
      <div>
        <h4 className="text-sm font-medium text-slate-700 mb-3">Child Normalcy Scores</h4>
        <div className="space-y-2">
          {childResults.map((child) => (
            <button
              key={child.childId}
              onClick={() => setSelectedChild(selectedChild === child.childId ? null : child.childId)}
              className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                selectedChild === child.childId
                  ? "border-indigo-200 bg-indigo-50"
                  : "border-slate-100 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${getScoreBg(child.normalcyScore)} ${getScoreColour(child.normalcyScore)}`}>
                  {child.normalcyScore}
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-slate-800">{child.childName}</p>
                  <p className="text-xs text-slate-500">
                    {child.fullyDelegatedCount} delegated &middot; {child.restrictedCount} restricted &middot; {child.coverageRate}% coverage
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {child.pendingConsents > 0 && (
                  <span className="text-xs bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded">
                    {child.pendingConsents} pending
                  </span>
                )}
                {child.reviewOverdue && (
                  <span className="text-xs bg-red-50 text-red-700 px-1.5 py-0.5 rounded">
                    Review overdue
                  </span>
                )}
                {child.isCompliant && !child.reviewOverdue && (
                  <span className="text-xs bg-green-50 text-green-700 px-1.5 py-0.5 rounded">
                    Compliant
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Expanded Child Detail */}
      {activeChild && activeProfile && (
        <div className="bg-slate-50 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-800">
              {activeChild.childName} — Delegation Schedule
            </h4>
            <span className="text-xs text-slate-500">
              {activeProfile.placingAuthority} &middot; SW: {activeProfile.socialWorkerName}
            </span>
          </div>

          {/* Authority Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5">
            {activeProfile.delegatedAuthority.map((da) => (
              <div
                key={da.category}
                className="flex items-center justify-between p-2 rounded bg-white border border-slate-100"
              >
                <span className="text-xs text-slate-700 truncate mr-2">
                  {getCategoryLabel(da.category)}
                </span>
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded whitespace-nowrap ${getAuthorityColour(da.authorityLevel)}`}>
                  {getAuthorityLabel(da.authorityLevel)}
                </span>
              </div>
            ))}
          </div>

          {/* Active Consents */}
          {activeProfile.consentRecords.length > 0 && (
            <div>
              <h5 className="text-xs font-medium text-slate-600 mb-2">Consent Records</h5>
              <div className="space-y-1.5">
                {activeProfile.consentRecords.map((consent) => (
                  <div key={consent.id} className="flex items-center justify-between p-2 rounded bg-white border border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${
                        consent.consentStatus === "granted" ? "bg-green-500" :
                        consent.consentStatus === "pending" ? "bg-amber-500" :
                        consent.consentStatus === "refused" ? "bg-red-500" : "bg-slate-400"
                      }`} />
                      <span className="text-xs text-slate-700">{consent.description}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500">{consent.consentFrom}</span>
                      {consent.evidenceHeld && (
                        <span className="text-[10px] text-green-600">✓ evidence</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Issues for child */}
          {activeChild.issues.length > 0 && (
            <div className="bg-red-50 border border-red-100 rounded p-3">
              <ul className="space-y-1">
                {activeChild.issues.map((issue, i) => (
                  <li key={i} className="text-xs text-red-700 flex items-start gap-1.5">
                    <span className="mt-0.5 shrink-0">•</span>
                    <span>{issue}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Most Restricted Categories */}
      {metrics.mostRestrictedCategories.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-slate-700 mb-2">Most Restricted Areas</h4>
          <div className="flex flex-wrap gap-2">
            {metrics.mostRestrictedCategories.map((cat) => (
              <span
                key={cat.category}
                className="text-xs bg-amber-50 text-amber-800 border border-amber-100 px-2.5 py-1 rounded-full"
              >
                {getCategoryLabel(cat.category)} ({cat.count}/{metrics.totalChildren})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Compliance Issues */}
      {metrics.complianceIssues.length > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-lg p-4">
          <h4 className="text-sm font-medium text-red-800 mb-2">
            Compliance Issues ({metrics.complianceIssues.length})
          </h4>
          <ul className="space-y-1">
            {metrics.complianceIssues.map((issue, i) => (
              <li key={i} className="text-xs text-red-700 flex items-start gap-1.5">
                <span className="mt-0.5 shrink-0">•</span>
                <span>{issue}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <div className="flex items-center gap-4">
          <MiniStat label="Reviews overdue" value={String(metrics.reviewsOverdue)} />
          <MiniStat label="Next review" value={formatDate(metrics.nextReviewDue)} />
          <MiniStat label="Pending consents" value={String(metrics.totalPendingConsents)} />
        </div>
        <span className="text-xs text-slate-400">
          Reg 5 &middot; Reg 14 &middot; s.33(3)(b) CA 1989
        </span>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  sub,
  score,
}: {
  label: string;
  value: string;
  sub: string;
  score: number;
}) {
  return (
    <div className="bg-slate-50 rounded-lg p-3">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={`text-lg font-semibold ${getScoreColour(score)}`}>{value}</p>
      <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-slate-500">{label}:</span>
      <span className="text-xs font-semibold text-slate-700">{value}</span>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SafeguardingDashboardWidget — Live safeguarding overview for home dashboard
// ══════════════════════════════════════════════════════════════════════════════

"use client";

import { useEffect, useState } from "react";

interface SafeguardingData {
  metrics: {
    totalConcerns: number;
    activeConcerns: number;
    concernsThisMonth: number;
    complianceRate: number;
    overdueReviews: number;
    childProtectionPlans: number;
    referralsMade: number;
    immediateProtectionActions: number;
    byCategory: { category: string; count: number }[];
    bySeverity: { severity: string; count: number }[];
  };
  activeConcerns: {
    id: string;
    childName: string;
    category: string;
    severity: string;
    status: string;
    raisedAt: string;
  }[];
  overdue: {
    concernId: string;
    childName: string;
    category: string;
    overdueBy: number;
    type: string;
  }[];
}

interface Props {
  homeId?: string;
}

const SEVERITY_STYLES: Record<string, string> = {
  low: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  medium: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  immediate: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

const CATEGORY_LABELS: Record<string, string> = {
  physical_abuse: "Physical Abuse",
  emotional_abuse: "Emotional Abuse",
  sexual_abuse: "Sexual Abuse",
  neglect: "Neglect",
  child_sexual_exploitation: "CSE",
  child_criminal_exploitation: "CCE",
  radicalisation: "Radicalisation",
  online_harm: "Online Harm",
  peer_on_peer_abuse: "Peer-on-Peer",
  self_harm: "Self-Harm",
  trafficking: "Trafficking",
  allegation_against_staff: "Staff Allegation",
  disclosure: "Disclosure",
  contextual_safeguarding: "Contextual",
  missing_linked: "Missing (SG)",
  other: "Other",
};

export function SafeguardingDashboardWidget({ homeId = "home-001" }: Props) {
  const [data, setData] = useState<SafeguardingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [homeId]);

  async function fetchData() {
    try {
      const res = await fetch(`/api/safeguarding?homeId=${homeId}`);
      const json = await res.json();
      setData(json);
    } catch {
      // noop
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 animate-pulse">
        <div className="h-4 w-32 bg-muted rounded mb-4" />
        <div className="space-y-2">
          <div className="h-3 w-full bg-muted rounded" />
          <div className="h-3 w-3/4 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { metrics, activeConcerns, overdue } = data;

  return (
    <div className="rounded-lg border border-border bg-card">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold">Safeguarding</h3>
              <p className="text-xs text-muted-foreground">
                {metrics.activeConcerns} active concern{metrics.activeConcerns !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          {overdue.length > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
              {overdue.length} overdue
            </span>
          )}
        </div>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-4 gap-px bg-border">
        <Stat label="This Month" value={metrics.concernsThisMonth} />
        <Stat label="Compliance" value={`${metrics.complianceRate}%`} highlight={metrics.complianceRate < 90} />
        <Stat label="Referrals" value={metrics.referralsMade} />
        <Stat label="CP Plans" value={metrics.childProtectionPlans} highlight={metrics.childProtectionPlans > 0} />
      </div>

      {/* Active Concerns List */}
      {activeConcerns.length > 0 && (
        <div className="border-t border-border">
          <div className="px-4 py-2 bg-muted/30">
            <span className="text-xs font-medium text-muted-foreground">Active Concerns</span>
          </div>
          <div className="divide-y divide-border max-h-48 overflow-y-auto">
            {activeConcerns.slice(0, 5).map((concern) => (
              <div key={concern.id} className="px-4 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex px-1.5 py-0.5 rounded text-xs font-medium ${SEVERITY_STYLES[concern.severity] ?? ""}`}>
                    {concern.severity}
                  </span>
                  <div>
                    <p className="text-xs font-medium">{concern.childName}</p>
                    <p className="text-xs text-muted-foreground">
                      {CATEGORY_LABELS[concern.category] ?? concern.category}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(concern.raisedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Overdue Items */}
      {overdue.length > 0 && (
        <div className="border-t border-border bg-red-50/50 dark:bg-red-900/10">
          <div className="px-4 py-2">
            <span className="text-xs font-medium text-red-700 dark:text-red-400">Overdue Actions</span>
          </div>
          <div className="divide-y divide-red-100 dark:divide-red-800/30">
            {overdue.slice(0, 3).map((item, i) => (
              <div key={i} className="px-4 py-2 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-red-800 dark:text-red-300">{item.childName}</p>
                  <p className="text-xs text-red-600 dark:text-red-400">
                    {item.type === "review" ? "Review overdue" :
                     item.type === "unacknowledged_referral" ? "Referral unacknowledged" :
                     "No review scheduled"}
                  </p>
                </div>
                <span className="text-xs font-medium text-red-700 dark:text-red-400">
                  {item.overdueBy}d overdue
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="p-3 border-t border-border text-center">
        <a href="/safeguarding" className="text-xs text-primary font-medium hover:underline">
          View all safeguarding concerns →
        </a>
      </div>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className="bg-card p-3 text-center">
      <p className={`text-lg font-bold ${highlight ? "text-red-600" : ""}`}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

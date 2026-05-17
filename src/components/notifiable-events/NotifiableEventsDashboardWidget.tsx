// ══════════════════════════════════════════════════════════════════════════════
// NotifiableEventsDashboardWidget — Statutory notification compliance overview
// ══════════════════════════════════════════════════════════════════════════════

"use client";

import { useEffect, useState } from "react";

interface EventMetrics {
  homeId: string;
  totalEvents: number;
  eventsThisMonth: number;
  eventsThisQuarter: number;
  pendingNotifications: number;
  overdueNotifications: number;
  complianceRate: number;
  averageResponseHours: number;
  byCategory: { category: string; count: number }[];
  recentEvents: { id: string; category: string; title: string; occurredAt: string; status: string }[];
  childrenInvolved: number;
  ofstedNotifications: number;
  requiresImmediateAction: { id: string; category: string; title: string }[];
}

interface Props {
  homeId?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  death: "Death",
  serious_injury: "Serious Injury",
  serious_illness: "Serious Illness",
  allegation_against_staff: "Staff Allegation",
  child_missing: "Missing",
  child_protection: "Child Protection",
  police_involvement: "Police",
  placement_disruption: "Disruption",
  serious_incident: "Serious Incident",
  restraint_injury: "Restraint Injury",
  fire: "Fire",
  outbreak_infection: "Outbreak",
  safeguarding_referral_external: "Ext. Referral",
  medication_error_serious: "Med Error",
  deprivation_of_liberty: "DoL",
};

const STATUS_STYLES: Record<string, string> = {
  on_time: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  late: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

export function NotifiableEventsDashboardWidget({ homeId = "home-oak" }: Props) {
  const [data, setData] = useState<EventMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [homeId]);

  async function fetchData() {
    try {
      const res = await fetch(`/api/notifiable-events?homeId=${homeId}&view=overview`);
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

  return (
    <div className="rounded-lg border border-border bg-card">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              data.overdueNotifications > 0
                ? "bg-gradient-to-br from-red-500 to-red-700 animate-pulse"
                : "bg-gradient-to-br from-rose-500 to-pink-600"
            }`}>
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold">Notifiable Events</h3>
              <p className="text-xs text-muted-foreground">
                Schedule 5 CHR 2015
              </p>
            </div>
          </div>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
            data.complianceRate >= 90 ? "bg-emerald-100 text-emerald-800" :
            data.complianceRate >= 70 ? "bg-amber-100 text-amber-800" :
            "bg-red-100 text-red-800"
          }`}>
            {data.complianceRate}% compliant
          </span>
        </div>
      </div>

      {/* Immediate Action Alert */}
      {data.requiresImmediateAction.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 p-3">
          <p className="text-xs font-bold text-red-800 dark:text-red-200 mb-1">REQUIRES IMMEDIATE ACTION</p>
          {data.requiresImmediateAction.map(evt => (
            <p key={evt.id} className="text-xs text-red-700 dark:text-red-300">
              {CATEGORY_LABELS[evt.category] ?? evt.category}: {evt.title}
            </p>
          ))}
        </div>
      )}

      {/* Key Stats */}
      <div className="grid grid-cols-4 gap-px bg-border">
        <Stat label="Quarter" value={String(data.eventsThisQuarter)} />
        <Stat label="Pending" value={String(data.pendingNotifications)} alert={data.pendingNotifications > 0} />
        <Stat label="Overdue" value={String(data.overdueNotifications)} alert={data.overdueNotifications > 0} />
        <Stat label="Avg Hrs" value={String(data.averageResponseHours)} />
      </div>

      {/* Recent Events */}
      {data.recentEvents.length > 0 && (
        <div className="divide-y divide-border border-t border-border">
          {data.recentEvents.slice(0, 4).map(evt => (
            <div key={evt.id} className="px-4 py-2.5 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium">{CATEGORY_LABELS[evt.category] ?? evt.category}</p>
                <p className="text-[10px] text-muted-foreground truncate max-w-[160px]">{evt.title}</p>
              </div>
              <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium ${STATUS_STYLES[evt.status] ?? ""}`}>
                {evt.status === "on_time" ? "Done" : evt.status}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Overdue Warning */}
      {data.overdueNotifications > 0 && (
        <div className="border-t border-border bg-red-50/50 dark:bg-red-900/10 p-3">
          <p className="text-xs font-medium text-red-700 dark:text-red-400">
            {data.overdueNotifications} notification{data.overdueNotifications !== 1 ? "s" : ""} past statutory deadline — action required
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="p-3 border-t border-border text-center">
        <a href="/notifiable-events" className="text-xs text-primary font-medium hover:underline">
          View notification log →
        </a>
      </div>
    </div>
  );
}

function Stat({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return (
    <div className="bg-card p-3 text-center">
      <p className={`text-lg font-bold ${alert ? "text-red-600 dark:text-red-400" : ""}`}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

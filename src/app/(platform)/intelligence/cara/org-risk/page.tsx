"use client";

import React from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { useOrgRisk } from "@/hooks/use-org-risk";
import type { RiskLevel } from "@/lib/org-risk/org-risk-engine";
import { cn } from "@/lib/utils";
import { Activity, Loader2, AlertTriangle, TrendingUp, Link2, HeartHandshake } from "lucide-react";

const LEVEL: Record<RiskLevel, { label: string; badge: string; dot: string; bar: string }> = {
  low: { label: "Low / healthy", badge: "bg-emerald-100 text-emerald-800 border-emerald-200", dot: "bg-emerald-500", bar: "bg-emerald-400" },
  moderate: { label: "Moderate / monitor", badge: "bg-amber-100 text-amber-800 border-amber-200", dot: "bg-amber-500", bar: "bg-amber-400" },
  high: { label: "High / action needed", badge: "bg-orange-100 text-orange-800 border-orange-200", dot: "bg-orange-500", bar: "bg-orange-400" },
  critical: { label: "Critical / immediate action", badge: "bg-red-100 text-red-800 border-red-200", dot: "bg-red-500", bar: "bg-red-500" },
};

export default function OrgRiskPage() {
  const { data, isLoading } = useOrgRisk();
  const overall = data ? LEVEL[data.overallLevel] : null;
  const maxIncidents = data ? Math.max(1, ...data.trend.map((t) => t.incidents)) : 1;

  return (
    <PageShell
      title="Burnout & Organisational Risk"
      subtitle="Spotting pressure on the team early — so managers can support staff and protect children"
    >
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-start gap-2 rounded-lg border border-[var(--cs-border,#e2e8f0)] bg-[var(--cs-cara-gold-bg,#fffbeb)] px-3 py-2 text-xs text-[var(--cs-text-secondary,#475569)]">
          <HeartHandshake className="mt-0.5 h-4 w-4 shrink-0 text-[var(--cs-cara-gold,#b45309)]" />
          <span>This dashboard is about <span className="font-semibold">supporting the team, not blaming it</span>. It surfaces pressure points early so they can be addressed before they affect children's care.</span>
        </div>

        {isLoading && <div className="flex items-center gap-2 text-sm text-[var(--cs-text-muted,#64748b)]"><Loader2 className="h-4 w-4 animate-spin" /> Assessing organisational risk…</div>}

        {data && overall && (
          <>
            {/* Overall */}
            <Card>
              <CardContent className="p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Activity className="h-5 w-5 text-[var(--cs-cara-gold,#b45309)]" />
                  <h2 className="text-base font-bold text-[var(--cs-navy,#1e293b)]">Organisational risk</h2>
                  <span className={cn("rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase", overall.badge)}>{overall.label}</span>
                </div>
                <p className="mt-1 max-w-3xl text-sm text-[var(--cs-text-secondary,#475569)]">{data.headline}</p>
              </CardContent>
            </Card>

            {/* Indicators */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {data.indicators.map((ind) => {
                const l = LEVEL[ind.level];
                return (
                  <div key={ind.key} className={cn("rounded-xl border bg-white p-3", ind.level === "critical" && "border-l-4 border-l-red-400", ind.level === "high" && "border-l-4 border-l-orange-400")}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wide text-[var(--cs-text-muted,#64748b)]">{ind.label}</span>
                      <span className={cn("h-2.5 w-2.5 rounded-full", l.dot)} title={l.label} />
                    </div>
                    <div className="mt-1 text-lg font-bold text-[var(--cs-navy,#1e293b)]">{ind.value}</div>
                    <p className="mt-1 text-[11px] text-[var(--cs-text-muted,#64748b)]">{ind.detail}</p>
                  </div>
                );
              })}
            </div>

            {/* Correlations */}
            {data.correlations.length > 0 && (
              <Card>
                <CardContent className="p-5">
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-[var(--cs-navy,#1e293b)]"><Link2 className="h-4 w-4 text-[var(--cs-cara-gold,#b45309)]" /> What Cara notices</h3>
                  <div className="space-y-2">
                    {data.correlations.map((c) => (
                      <div key={c.key} className={cn("flex items-start gap-2 rounded-lg border px-3 py-2 text-sm", c.severity === "concern" ? "border-orange-100 bg-orange-50 text-orange-800" : "border-amber-100 bg-amber-50 text-amber-800")}>
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{c.text}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Six-month trend */}
            <Card>
              <CardContent className="p-5">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-[var(--cs-navy,#1e293b)]"><TrendingUp className="h-4 w-4 text-[var(--cs-cara-gold,#b45309)]" /> Six-month trend</h3>
                <div className="grid grid-cols-6 gap-2">
                  {data.trend.map((t) => (
                    <div key={t.month} className="text-center">
                      <div className="flex h-20 items-end justify-center gap-0.5">
                        <div className="w-3 rounded-t bg-rose-300" style={{ height: `${Math.max(4, (t.incidents / maxIncidents) * 100)}%` }} title={`${t.incidents} incidents`} />
                        <div className="w-3 rounded-t bg-emerald-300" style={{ height: `${Math.max(4, (t.supervisionsCompleted / maxIncidents) * 100)}%` }} title={`${t.supervisionsCompleted} supervisions`} />
                      </div>
                      <div className="mt-1 text-[10px] text-[var(--cs-text-muted,#64748b)]">{t.month.slice(5)}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex items-center justify-center gap-4 text-[11px] text-[var(--cs-text-muted,#64748b)]">
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-rose-300" /> Incidents</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-300" /> Supervisions completed</span>
                </div>
              </CardContent>
            </Card>

            <p className="px-1 text-xs text-[var(--cs-text-muted,#64748b)]">
              Cara surfaces organisational pressure so leaders can act early. It informs leadership oversight and quality
              assurance — it never replaces professional judgement, and it never blames individual staff.
            </p>
          </>
        )}
      </div>
    </PageShell>
  );
}

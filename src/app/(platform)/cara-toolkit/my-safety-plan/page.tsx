"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import type { MySafetyPlanAnalysis, ChildSafetyPlan, SignalColour } from "@/lib/cara-visual-toolkit/types";

import { EmptyState } from "@/components/ui/empty-state";
async function fetchMySafetyPlan(): Promise<MySafetyPlanAnalysis> {
  const res = await fetch("/api/v1/cara-toolkit/my-safety-plan");
  if (!res.ok) throw new Error("Failed to fetch safety plan data");
  const json = await res.json();
  return json.data as MySafetyPlanAnalysis;
}

function useCaraToolkitMySafetyPlan() {
  return useQuery({
    queryKey: ["cara-toolkit-my-safety-plan"],
    queryFn: fetchMySafetyPlan,
    staleTime: 120_000,
  });
}

const SIGNAL_STYLES: Record<SignalColour, { bg: string; border: string; text: string; dot: string }> = {
  green: { bg: "bg-green-50",  border: "border-green-200",  text: "text-green-800",  dot: "bg-green-400"  },
  amber: { bg: "bg-amber-50",  border: "border-amber-200",  text: "text-amber-800",  dot: "bg-amber-400"  },
  red:   { bg: "bg-red-50",    border: "border-red-200",    text: "text-red-800",    dot: "bg-red-400"    },
  grey:  { bg: "bg-slate-50",  border: "border-slate-200",  text: "text-slate-600",  dot: "bg-slate-300"  },
};

const RISK_LEVEL_STYLES: Record<string, string> = {
  critical: "bg-red-100 text-red-700",
  high:     "bg-orange-100 text-orange-700",
  medium:   "bg-amber-100 text-amber-700",
  low:      "bg-green-100 text-green-700",
  unknown:  "bg-slate-100 text-slate-500",
};

const TREND_ICONS: Record<string, string> = {
  improving: "↓",
  declining: "↑",
  stable:    "→",
  increasing: "↑",
};

function ChildPlanCard({ plan }: { plan: ChildSafetyPlan }) {
  const style = SIGNAL_STYLES[plan.overallSignal];
  return (
    <div className={`rounded-xl border p-4 flex flex-col gap-3 ${style.bg} ${style.border}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${style.dot}`} />
          <span className="font-semibold text-slate-900">{plan.childInitials}</span>
          {plan.keyWorker && (
            <span className="text-xs text-slate-500">Key worker: {plan.keyWorker}</span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs shrink-0">
          {plan.highRiskDomainCount > 0 && (
            <span className="rounded-full bg-red-100 text-red-700 px-2 py-0.5 font-medium">
              {plan.highRiskDomainCount} high risk domain{plan.highRiskDomainCount > 1 ? "s" : ""}
            </span>
          )}
          {plan.overdueReviewCount > 0 && (
            <span className="rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 font-medium">
              {plan.overdueReviewCount} overdue review{plan.overdueReviewCount > 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {/* Risk domains */}
      {plan.riskDomains.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Risk domains</p>
          <div className="flex flex-wrap gap-1.5">
            {plan.riskDomains.map((d, i) => (
              <div key={i} className="flex items-center gap-1">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${RISK_LEVEL_STYLES[d.level] ?? RISK_LEVEL_STYLES.unknown}`}>
                  {d.domain}
                </span>
                {TREND_ICONS[d.trend] && (
                  <span className="text-xs text-slate-400">{TREND_ICONS[d.trend]}</span>
                )}
                {d.overdueReview && (
                  <span className="text-xs text-amber-600 font-medium">(review overdue)</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex flex-wrap gap-4 text-xs text-slate-500">
        <span>Last key work: <span className="font-medium text-slate-700">{plan.lastKeyWork ?? "None recorded"}</span></span>
        <span>Last RA: <span className="font-medium text-slate-700">{plan.lastRiskAssessment ?? "None recorded"}</span></span>
      </div>
    </div>
  );
}

export default function MySafetyPlanPage() {
  const { data, isLoading, error } = useCaraToolkitMySafetyPlan();

  if (isLoading) return <div className="p-8 text-slate-500 text-sm">Loading safety plans…</div>;
  if (error || !data) return <div className="p-8 text-red-600 text-sm">Unable to load safety plan data.</div>;

  const overall = SIGNAL_STYLES[data.overallSignal];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <nav className="flex items-center gap-2 text-xs text-slate-400">
        <Link href="/cara-toolkit" className="hover:text-slate-600">Cara Toolkit</Link>
        <span>/</span>
        <span className="text-slate-600">My Safety Plan</span>
      </nav>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Safety Plan</h1>
        <p className="text-sm text-slate-600 mt-1">
          Risk domains, review dates, key working frequency, and overall safety signal for each child in placement.
        </p>
      </div>

      {/* Summary */}
      <div className={`rounded-2xl border-2 p-5 ${overall.bg} ${overall.border}`}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-2xl font-bold text-slate-800">{data.totalChildren}</p>
            <p className="text-xs text-slate-500">Children in placement</p>
          </div>
          <div>
            <p className={`text-2xl font-bold ${data.childrenWithHighRisk > 0 ? "text-red-700" : "text-slate-800"}`}>
              {data.childrenWithHighRisk}
            </p>
            <p className="text-xs text-slate-500">High/critical risk</p>
          </div>
          <div>
            <p className={`text-2xl font-bold ${data.overdueRiskReviews > 0 ? "text-amber-700" : "text-slate-800"}`}>
              {data.overdueRiskReviews}
            </p>
            <p className="text-xs text-slate-500">Overdue RA reviews</p>
          </div>
          <div>
            <p className={`text-2xl font-bold ${data.childrenWithRecentKeyWork < data.totalChildren ? "text-amber-700" : "text-green-700"}`}>
              {data.childrenWithRecentKeyWork}
            </p>
            <p className="text-xs text-slate-500">Key work in last 30d</p>
          </div>
        </div>
      </div>

      {/* Insights */}
      {data.insights.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Cara insights</h2>
          <div className="flex flex-col gap-3">
            {data.insights.map((insight, i) => (
              <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700 leading-relaxed">
                <span className="font-semibold text-slate-900 mr-2">Cara:</span>
                {insight}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Per-child plans */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
          Children ({data.totalChildren})
        </h2>
        {data.childPlans.length === 0 ? (
          <EmptyState compact title="No children currently in placement." />
        ) : (
          <div className="flex flex-col gap-3">
            {data.childPlans.map((plan) => (
              <ChildPlanCard key={plan.childId} plan={plan} />
            ))}
          </div>
        )}
      </section>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
        <p className="font-semibold mb-1">Regulatory reference</p>
        <p>{data.regulatoryNote}</p>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
        Risk domains and review dates shown here are derived from existing risk assessment records. Managers remain professionally accountable for ensuring risk assessments are completed, reviewed, and acted upon with the child&apos;s full participation.
      </div>
    </div>
  );
}

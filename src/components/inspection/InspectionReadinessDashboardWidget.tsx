// ══════════════════════════════════════════════════════════════════════════════
// InspectionReadinessDashboardWidget — Live Ofsted inspection readiness
// ══════════════════════════════════════════════════════════════════════════════

"use client";

import { useCallback, useEffect, useState } from "react";

interface DomainScore {
  domain: string;
  score: number;
  judgement: string;
  strengths: string[];
  concerns: string[];
  evidenceStrength: string;
}

interface ReadinessData {
  homeId: string;
  overallScore: number;
  overallJudgement: string;
  readinessPercentage: number;
  inspectionLikelihood: string;
  domains: DomainScore[];
  criticalActions: string[];
  strengthsSummary: string[];
  riskFactors: string[];
  dayssinceLastInspection: number | null;
}

interface Props {
  homeId?: string;
}

const JUDGEMENT_STYLES: Record<string, string> = {
  outstanding: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  good: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  requires_improvement: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  inadequate: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

const JUDGEMENT_LABELS: Record<string, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "RI",
  inadequate: "Inadequate",
};

const DOMAIN_SHORT: Record<string, string> = {
  leadership_management: "Leadership",
  safeguarding: "Safeguarding",
  children_outcomes: "Outcomes",
  residential_experience: "Experience",
  workforce: "Workforce",
  records_compliance: "Records",
  regulatory_reports: "Regulatory",
  safer_recruitment: "Recruitment",
};

const LIKELIHOOD_STYLES: Record<string, string> = {
  low: "text-emerald-600 dark:text-emerald-400",
  medium: "text-amber-600 dark:text-amber-400",
  high: "text-red-600 dark:text-red-400",
};

export function InspectionReadinessDashboardWidget({ homeId = "home-oak" }: Props) {
  const [data, setData] = useState<ReadinessData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/inspection?homeId=${homeId}`);
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch {
      // noop
    } finally {
      setLoading(false);
    }
  }, [homeId]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

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
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold">Inspection Readiness</h3>
              <p className="text-xs text-muted-foreground">
                {data.dayssinceLastInspection != null ? `${data.dayssinceLastInspection}d since last` : "No prior inspection"}
              </p>
            </div>
          </div>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${JUDGEMENT_STYLES[data.overallJudgement] ?? ""}`}>
            {JUDGEMENT_LABELS[data.overallJudgement] ?? data.overallJudgement}
          </span>
        </div>
      </div>

      {/* Readiness gauge */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-muted-foreground">Readiness</span>
          <span className="text-sm font-bold">{data.readinessPercentage}%</span>
        </div>
        <div className="h-2.5 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              data.readinessPercentage >= 85 ? "bg-emerald-500" :
              data.readinessPercentage >= 65 ? "bg-blue-500" :
              data.readinessPercentage >= 40 ? "bg-amber-500" : "bg-red-500"
            }`}
            style={{ width: `${data.readinessPercentage}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-muted-foreground">Inspection likelihood:</span>
          <span className={`text-[10px] font-medium ${LIKELIHOOD_STYLES[data.inspectionLikelihood] ?? ""}`}>
            {data.inspectionLikelihood}
          </span>
        </div>
      </div>

      {/* Domain Scores */}
      <div className="divide-y divide-border">
        {data.domains.slice(0, 6).map(domain => (
          <div key={domain.domain} className="px-4 py-2 flex items-center justify-between">
            <span className="text-xs font-medium">{DOMAIN_SHORT[domain.domain] ?? domain.domain}</span>
            <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium ${JUDGEMENT_STYLES[domain.judgement] ?? ""}`}>
              {JUDGEMENT_LABELS[domain.judgement] ?? domain.judgement}
            </span>
          </div>
        ))}
      </div>

      {/* Critical Actions */}
      {data.criticalActions.length > 0 && (
        <div className="border-t border-border bg-red-50/50 dark:bg-red-900/10 p-3">
          <p className="text-[10px] font-medium text-red-700 dark:text-red-400 mb-1">Critical actions ({data.criticalActions.length}):</p>
          <p className="text-xs text-red-700 dark:text-red-400 line-clamp-2">
            {data.criticalActions[0]}
          </p>
        </div>
      )}

      {/* Risk Factors */}
      {data.riskFactors.length > 0 && data.criticalActions.length === 0 && (
        <div className="border-t border-border bg-amber-50/50 dark:bg-amber-900/10 p-3">
          <p className="text-[10px] font-medium text-amber-700 dark:text-amber-400 mb-1">Risk factors:</p>
          <p className="text-xs text-amber-700 dark:text-amber-400 line-clamp-2">
            {data.riskFactors[0]}
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="p-3 border-t border-border text-center">
        <a href="/inspection-readiness" className="text-xs text-primary font-medium hover:underline">
          View full inspection readiness →
        </a>
      </div>
    </div>
  );
}

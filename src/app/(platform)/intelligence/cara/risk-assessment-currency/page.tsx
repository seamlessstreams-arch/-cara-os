"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { EmptyState } from "@/components/ui/empty-state";
type RiskAssessmentChildProfile = {
  childId: string;
  childName: string;
  totalAssessments: number;
  overdueAssessments: number;
  dueWithin14Days: number;
  highOrVeryHighDomains: string[];
  improvingDomains: string[];
  decliningDomains: string[];
  domainsCovered: string[];
  daysUntilEarliestReview: number | null;
  signal: "green" | "amber" | "red" | "grey";
};

type RiskAssessmentCurrencyData = {
  totalAssessments: number;
  overdueAssessments: number;
  dueWithin14Days: number;
  highRiskCount: number;
  veryHighRiskCount: number;
  improvingCount: number;
  decliningCount: number;
  childProfiles: RiskAssessmentChildProfile[];
  insights: string[];
  overallSignal: "green" | "amber" | "red" | "grey";
  regulatoryNote: string;
};

async function fetchRiskAssessmentCurrency(): Promise<RiskAssessmentCurrencyData> {
  const res = await fetch("/api/v1/risk-assessment-currency");
  if (!res.ok) throw new Error("Failed to fetch risk assessment currency data");
  const json = await res.json();
  return json.data as RiskAssessmentCurrencyData;
}

function useRiskAssessmentCurrency() {
  return useQuery({
    queryKey: ["risk-assessment-currency"],
    queryFn: fetchRiskAssessmentCurrency,
    staleTime: 120_000,
  });
}

type Signal = "green" | "amber" | "red" | "grey";

const SIGNAL_STYLES: Record<Signal, { bg: string; border: string; dot: string }> = {
  green: { bg: "bg-green-50",  border: "border-green-200",  dot: "bg-green-400"  },
  amber: { bg: "bg-amber-50",  border: "border-amber-200",  dot: "bg-amber-400"  },
  red:   { bg: "bg-red-50",    border: "border-red-200",    dot: "bg-red-400"    },
  grey:  { bg: "bg-slate-50",  border: "border-slate-200",  dot: "bg-slate-300"  },
};

function ChildRiskCard({ profile }: { profile: RiskAssessmentChildProfile }) {
  const style = SIGNAL_STYLES[profile.signal];

  const daysLabel =
    profile.daysUntilEarliestReview === null
      ? null
      : profile.daysUntilEarliestReview < 0
      ? `${Math.abs(profile.daysUntilEarliestReview)}d overdue`
      : profile.daysUntilEarliestReview === 0
      ? "Due today"
      : `Next review: ${profile.daysUntilEarliestReview}d`;

  return (
    <div className={`rounded-xl border p-4 flex flex-col gap-3 ${style.bg} ${style.border}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${style.dot}`} />
          <span className="font-semibold text-slate-900 text-sm">{profile.childName}</span>
        </div>
        {daysLabel && (
          <span className={`text-xs font-semibold rounded-full px-2 py-0.5 shrink-0 ${
            profile.overdueAssessments > 0
              ? "bg-red-100 text-red-700"
              : profile.daysUntilEarliestReview !== null && profile.daysUntilEarliestReview <= 14
              ? "bg-amber-100 text-amber-700"
              : "bg-slate-100 text-slate-500"
          }`}>
            {daysLabel}
          </span>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        <span className="text-xs bg-slate-100 text-slate-600 rounded-full px-2 py-0.5">
          {profile.totalAssessments} domain{profile.totalAssessments === 1 ? "" : "s"}
        </span>
        {profile.highOrVeryHighDomains.length > 0 && (
          <span className="text-xs bg-red-100 text-red-700 rounded-full px-2 py-0.5 font-semibold">
            High/very-high: {profile.highOrVeryHighDomains.join(", ")}
          </span>
        )}
        {profile.decliningDomains.length > 0 && (
          <span className="text-xs bg-amber-100 text-amber-700 rounded-full px-2 py-0.5">
            Increasing: {profile.decliningDomains.join(", ")}
          </span>
        )}
        {profile.improvingDomains.length > 0 && (
          <span className="text-xs bg-green-100 text-green-700 rounded-full px-2 py-0.5">
            Improving: {profile.improvingDomains.join(", ")}
          </span>
        )}
      </div>

      {profile.domainsCovered.length > 0 && (
        <p className="text-xs text-slate-400">
          Domains: {profile.domainsCovered.join(" · ")}
        </p>
      )}
    </div>
  );
}

export default function RiskAssessmentCurrencyPage() {
  const { data, isLoading, error } = useRiskAssessmentCurrency();

  if (isLoading) return <div className="p-8 text-slate-500 text-sm">Reviewing risk assessments…</div>;
  if (error || !data) return <div className="p-8 text-red-600 text-sm">Unable to load risk assessment currency data.</div>;

  const overall = SIGNAL_STYLES[data.overallSignal];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <nav className="flex items-center gap-2 text-xs text-slate-400">
        <Link href="/intelligence" className="hover:text-slate-600">Intelligence</Link>
        <span>/</span>
        <span className="text-slate-600">Risk Assessment Currency</span>
      </nav>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Risk Assessment Currency</h1>
        <p className="text-sm text-slate-600 mt-1">
          Currency of active risk assessments, overdue reviews, domain-level risk levels, and trend directions — all children.
        </p>
      </div>

      {/* Summary */}
      <div className={`rounded-2xl border-2 p-5 ${overall.bg} ${overall.border}`}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className={`text-2xl font-bold ${data.veryHighRiskCount > 0 ? "text-red-700" : data.highRiskCount > 0 ? "text-orange-700" : "text-slate-700"}`}>
              {data.veryHighRiskCount + data.highRiskCount}
            </p>
            <p className="text-xs text-slate-500">High / very-high domains</p>
          </div>
          <div>
            <p className={`text-2xl font-bold ${data.overdueAssessments > 0 ? "text-red-700" : "text-slate-700"}`}>
              {data.overdueAssessments}
            </p>
            <p className="text-xs text-slate-500">Overdue reviews</p>
          </div>
          <div>
            <p className={`text-2xl font-bold ${data.dueWithin14Days > 0 ? "text-amber-700" : "text-slate-700"}`}>
              {data.dueWithin14Days}
            </p>
            <p className="text-xs text-slate-500">Due within 14 days</p>
          </div>
          <div>
            <p className={`text-2xl font-bold ${data.decliningCount > 0 ? "text-amber-700" : "text-slate-700"}`}>
              {data.decliningCount}
            </p>
            <p className="text-xs text-slate-500">Increasing risk</p>
          </div>
        </div>
      </div>

      {/* Very-high risk warning */}
      {data.veryHighRiskCount > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-center gap-3">
          <span className="text-xl font-bold text-red-600">!</span>
          <p className="text-sm text-red-800">
            <span className="font-semibold">
              {data.veryHighRiskCount} domain{data.veryHighRiskCount === 1 ? " is" : "s are"} at VERY HIGH risk.{" "}
            </span>
            These require immediate management oversight and frequent review.
          </p>
        </div>
      )}

      {/* Insights */}
      {data.insights.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Cara insights</h2>
          {data.insights.map((ins, i) => (
            <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700 leading-relaxed">
              <span className="font-semibold text-slate-900 mr-2">Cara:</span>
              {ins}
            </div>
          ))}
        </section>
      )}

      {/* Risk level summary */}
      {data.totalAssessments > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Risk level summary</h2>
          <div className="rounded-xl border border-slate-200 bg-white p-4 flex flex-wrap gap-3">
            {[
              { label: "Very High", count: data.veryHighRiskCount, colour: "bg-red-200 text-red-800" },
              { label: "High",      count: data.highRiskCount,     colour: "bg-orange-100 text-orange-700" },
              { label: "Improving", count: data.improvingCount,    colour: "bg-green-100 text-green-700"   },
              { label: "Increasing",count: data.decliningCount,    colour: "bg-amber-100 text-amber-700"   },
            ].filter((s) => s.count > 0).map((s) => (
              <div key={s.label} className={`rounded-xl px-4 py-2 text-center ${s.colour}`}>
                <p className="text-xl font-bold">{s.count}</p>
                <p className="text-xs">{s.label}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Per-child profiles */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Per-child risk profiles</h2>
        {data.childProfiles.length === 0 ? (
          <EmptyState compact title="No risk assessments found." />
        ) : (
          <div className="flex flex-col gap-3">
            {data.childProfiles.map((p) => (
              <ChildRiskCard key={p.childId} profile={p} />
            ))}
          </div>
        )}
      </section>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
        <p className="font-semibold mb-1">Regulatory reference</p>
        <p>{data.regulatoryNote}</p>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
        Risk intelligence is derived from current risk assessment records only. Assessments must be updated following any significant incident or change in circumstances — automatic signals do not replace professional risk judgement. All decisions remain with the registered manager and qualified practitioners.
      </div>
    </div>
  );
}

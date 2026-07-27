"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

type OutcomeProgressChild = {
  childId: string;
  childName: string;
  totalTargets: number;
  improvingCount: number;
  stableCount: number;
  decliningCount: number;
  overdueReviews: number;
  voiceCaptured: boolean;
  voiceCount: number;
  domains: string[];
  avgRating: number | null;
  signal: "green" | "amber" | "red" | "grey";
};

type OutcomeDomainRow = {
  domain: string;
  label: string;
  totalTargets: number;
  improving: number;
  stable: number;
  declining: number;
  avgRating: number;
};

type OutcomeProgressData = {
  totalTargets: number;
  improvingCount: number;
  stableCount: number;
  decliningCount: number;
  overdueReviews: number;
  childrenWithVoice: number;
  totalChildren: number;
  domainBreakdown: OutcomeDomainRow[];
  childSummaries: OutcomeProgressChild[];
  concerns: string[];
  insights: string[];
  overallSignal: "green" | "amber" | "red" | "grey";
  regulatoryNote: string;
};

async function fetchOutcomeProgress(): Promise<OutcomeProgressData> {
  const res = await fetch("/api/v1/outcome-progress");
  if (!res.ok) throw new Error("Failed to fetch outcome progress");
  const json = await res.json();
  return json.data as OutcomeProgressData;
}

function useOutcomeProgress() {
  return useQuery({
    queryKey: ["outcome-progress"],
    queryFn: fetchOutcomeProgress,
    staleTime: 120_000,
  });
}

type Signal = "green" | "amber" | "red" | "grey";

const SIGNAL_STYLES: Record<Signal, { bg: string; border: string; text: string; dot: string }> = {
  green: { bg: "bg-green-50",  border: "border-green-200",  text: "text-green-800",  dot: "bg-green-400"  },
  amber: { bg: "bg-amber-50",  border: "border-amber-200",  text: "text-amber-800",  dot: "bg-amber-400"  },
  red:   { bg: "bg-red-50",    border: "border-red-200",    text: "text-red-800",    dot: "bg-red-400"    },
  grey:  { bg: "bg-slate-50",  border: "border-slate-200",  text: "text-slate-500",  dot: "bg-slate-300"  },
};

function ChildCard({ child }: { child: OutcomeProgressChild }) {
  const style = SIGNAL_STYLES[child.signal];
  return (
    <div className={`rounded-xl border p-4 flex flex-col gap-3 ${style.bg} ${style.border}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${style.dot}`} />
          <span className="font-semibold text-slate-900 text-sm">{child.childName}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {child.voiceCaptured && (
            <span className="rounded-full bg-teal-100 text-teal-700 px-2 py-0.5 text-xs font-medium">Voice ✓</span>
          )}
          {child.overdueReviews > 0 && (
            <span className="rounded-full bg-red-100 text-red-700 px-2 py-0.5 text-xs font-medium">
              {child.overdueReviews} overdue
            </span>
          )}
        </div>
      </div>

      {child.totalTargets === 0 ? (
        <p className="text-xs text-slate-500 italic">No active outcome targets recorded.</p>
      ) : (
        <div className="flex gap-2">
          {child.improvingCount > 0 && (
            <div className="flex-1 rounded-lg bg-green-100 p-2 text-center">
              <p className="text-lg font-bold text-green-700">{child.improvingCount}</p>
              <p className="text-xs text-green-600">Improving</p>
            </div>
          )}
          {child.stableCount > 0 && (
            <div className="flex-1 rounded-lg bg-blue-50 border border-blue-100 p-2 text-center">
              <p className="text-lg font-bold text-blue-700">{child.stableCount}</p>
              <p className="text-xs text-blue-600">Stable</p>
            </div>
          )}
          {child.decliningCount > 0 && (
            <div className="flex-1 rounded-lg bg-red-100 p-2 text-center">
              <p className="text-lg font-bold text-red-700">{child.decliningCount}</p>
              <p className="text-xs text-red-600">Declining</p>
            </div>
          )}
        </div>
      )}

      {child.domains.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {child.domains.slice(0, 4).map((d) => (
            <span key={d} className="text-xs bg-white border border-slate-200 rounded-full px-2 py-0.5 text-slate-500">
              {d.replace(/_/g, " ")}
            </span>
          ))}
          {child.domains.length > 4 && (
            <span className="text-xs text-slate-400">+{child.domains.length - 4} more</span>
          )}
        </div>
      )}

      {child.avgRating !== null && (
        <p className="text-xs text-slate-400">
          Average current rating: <span className="font-semibold text-slate-600">{child.avgRating}/5</span>
        </p>
      )}
    </div>
  );
}

function DomainBar({ row }: { row: OutcomeDomainRow }) {
  const improvingPct = row.totalTargets > 0 ? (row.improving / row.totalTargets) * 100 : 0;
  const stablePct    = row.totalTargets > 0 ? (row.stable    / row.totalTargets) * 100 : 0;
  const decliningPct = row.totalTargets > 0 ? (row.declining / row.totalTargets) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="w-40 shrink-0 text-xs text-slate-600 text-right truncate">{row.label}</div>
      <div className="flex-1 h-5 rounded-full bg-slate-100 overflow-hidden flex">
        <div className="h-full bg-green-400" style={{ width: `${improvingPct}%` }} />
        <div className="h-full bg-blue-300" style={{ width: `${stablePct}%` }} />
        <div className="h-full bg-red-400"  style={{ width: `${decliningPct}%` }} />
      </div>
      <div className="w-8 shrink-0 text-xs text-slate-400 text-right">{row.totalTargets}</div>
    </div>
  );
}

export default function OutcomeProgressPage() {
  const { data, isLoading, error } = useOutcomeProgress();

  if (isLoading) return <div className="p-8 text-slate-500 text-sm">Computing outcome progress…</div>;
  if (error || !data) return <div className="p-8 text-red-600 text-sm">Unable to load outcome progress data.</div>;

  const overall = SIGNAL_STYLES[data.overallSignal];
  const improvePct = data.totalTargets > 0 ? Math.round((data.improvingCount / data.totalTargets) * 100) : 0;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <nav className="flex items-center gap-2 text-xs text-slate-400">
        <Link href="/intelligence" className="hover:text-slate-600">Intelligence</Link>
        <span>/</span>
        <span className="text-slate-600">Outcome Progress</span>
      </nav>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Outcome Progress Intelligence</h1>
        <p className="text-sm text-slate-600 mt-1">
          Progress across all active outcome targets — per child and per domain. Surfaces declining targets, overdue reviews, and child voice capture.
        </p>
      </div>

      {/* Summary banner */}
      <div className={`rounded-2xl border-2 p-5 ${overall.bg} ${overall.border}`}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-2xl font-bold text-slate-800">{data.totalTargets}</p>
            <p className="text-xs text-slate-500">Active targets</p>
          </div>
          <div>
            <p className={`text-2xl font-bold ${improvePct >= 60 ? "text-green-700" : "text-amber-700"}`}>
              {improvePct}%
            </p>
            <p className="text-xs text-slate-500">Improving</p>
          </div>
          <div>
            <p className={`text-2xl font-bold ${data.decliningCount > 0 ? "text-red-700" : "text-slate-700"}`}>
              {data.decliningCount}
            </p>
            <p className="text-xs text-slate-500">Declining</p>
          </div>
          <div>
            <p className={`text-2xl font-bold ${data.overdueReviews > 0 ? "text-red-700" : "text-slate-700"}`}>
              {data.overdueReviews}
            </p>
            <p className="text-xs text-slate-500">Overdue reviews</p>
          </div>
        </div>
      </div>

      {/* Concerns */}
      {data.concerns.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Attention required</h2>
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex flex-col gap-2">
            {data.concerns.map((c, i) => (
              <p key={i} className="text-sm text-red-800 flex items-start gap-2">
                <span className="shrink-0 font-bold mt-0.5">!</span>
                {c}
              </p>
            ))}
          </div>
        </section>
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

      {/* Domain breakdown */}
      {data.domainBreakdown.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Progress by domain</h2>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-400 inline-block" /> Improving
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-300 inline-block" /> Stable
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> Declining
              </span>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col gap-2.5">
            {data.domainBreakdown.map((row) => (
              <DomainBar key={row.domain} row={row} />
            ))}
          </div>
        </section>
      )}

      {/* Voice capture */}
      <div className="flex items-center justify-between rounded-xl border border-teal-200 bg-teal-50 p-4">
        <div>
          <p className="text-sm font-semibold text-teal-800">Child voice in outcome targets</p>
          <p className="text-xs text-teal-600 mt-0.5">
            Voice recorded for {data.childrenWithVoice} of {data.totalChildren} children
          </p>
        </div>
        <div className="text-2xl font-bold text-teal-700">
          {data.totalChildren > 0 ? Math.round((data.childrenWithVoice / data.totalChildren) * 100) : 0}%
        </div>
      </div>

      {/* Per-child summaries */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
          Per-child summary ({data.totalChildren})
        </h2>
        {data.childSummaries.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
            No children currently in placement.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.childSummaries.map((c) => (
              <ChildCard key={c.childId} child={c} />
            ))}
          </div>
        )}
      </section>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
        <p className="font-semibold mb-1">Regulatory reference</p>
        <p>{data.regulatoryNote}</p>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
        Outcome progress signals are derived from recorded target data. Direct observation, direct engagement with young people, and professional judgement remain essential. Managers are accountable for all care planning decisions.
      </div>
    </div>
  );
}

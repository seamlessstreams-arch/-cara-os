"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import type { ChildImpactSummary, ShowingImpactAnalysis, SignalColour } from "@/lib/cara-visual-toolkit/types";

async function fetchShowingImpact(): Promise<ShowingImpactAnalysis> {
  const res = await fetch("/api/v1/cara-toolkit/showing-impact");
  if (!res.ok) throw new Error("Failed to fetch showing impact data");
  const json = await res.json();
  return json.data as ShowingImpactAnalysis;
}

function useCaraToolkitShowingImpact() {
  return useQuery({
    queryKey: ["cara-toolkit-showing-impact"],
    queryFn: fetchShowingImpact,
    staleTime: 120_000,
  });
}

const SIGNAL_STYLES: Record<SignalColour, { bg: string; border: string; text: string; dot: string }> = {
  green: { bg: "bg-green-50",  border: "border-green-200",  text: "text-green-800",  dot: "bg-green-400"  },
  amber: { bg: "bg-amber-50",  border: "border-amber-200",  text: "text-amber-800",  dot: "bg-amber-400"  },
  red:   { bg: "bg-red-50",    border: "border-red-200",    text: "text-red-800",    dot: "bg-red-400"    },
  grey:  { bg: "bg-slate-50",  border: "border-slate-200",  text: "text-slate-600",  dot: "bg-slate-300"  },
};

const TREND_CONFIG: Record<string, { label: string; colour: string; icon: string }> = {
  improving:         { label: "Improving",       colour: "text-green-700 bg-green-100",  icon: "↓" },
  stable:            { label: "Stable",           colour: "text-blue-700 bg-blue-100",    icon: "→" },
  worsening:         { label: "Worsening",        colour: "text-red-700 bg-red-100",      icon: "↑" },
  insufficient_data: { label: "Insufficient data", colour: "text-slate-500 bg-slate-100", icon: "?" },
};

function ChildImpactCard({ summary }: { summary: ChildImpactSummary }) {
  const style = SIGNAL_STYLES[summary.overallSignal];
  const trend = TREND_CONFIG[summary.incidentTrend] ?? TREND_CONFIG.insufficient_data;

  return (
    <div className={`rounded-xl border p-4 flex flex-col gap-3 ${style.bg} ${style.border}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${style.dot}`} />
          <span className="font-semibold text-slate-900">{summary.childInitials}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${trend.colour}`}>
            {trend.icon} {trend.label}
          </span>
          {summary.voiceRecorded && (
            <span className="rounded-full bg-teal-100 text-teal-700 px-2 py-0.5 text-xs font-medium">
              Voice recorded
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <p className="text-xs text-slate-400 mb-0.5">Key work sessions</p>
          <p className="text-sm font-semibold text-slate-700">{summary.keyWorkCount}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400 mb-0.5">Incident trend</p>
          <p className={`text-sm font-medium ${trend.colour.split(" ")[0]}`}>{trend.label}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400 mb-0.5">Voice recorded</p>
          <p className={`text-sm font-medium ${summary.voiceRecorded ? "text-green-700" : "text-amber-600"}`}>
            {summary.voiceRecorded ? "Yes" : "Not yet"}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-400 mb-0.5">Risk trend</p>
          <p className="text-sm font-medium text-slate-600 capitalize">{summary.riskTrend ?? "Not assessed"}</p>
        </div>
      </div>

      {summary.recentOutcomes.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">Recent observations</p>
          <div className="flex flex-col gap-1.5">
            {summary.recentOutcomes.slice(0, 2).map((obs, i) => (
              <p key={i} className="text-xs text-slate-600 italic leading-relaxed line-clamp-2">
                &ldquo;{obs}&rdquo;
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ShowingImpactPage() {
  const { data, isLoading, error } = useCaraToolkitShowingImpact();

  if (isLoading) return <div className="p-8 text-slate-500 text-sm">Building impact evidence…</div>;
  if (error || !data) return <div className="p-8 text-red-600 text-sm">Unable to load impact data.</div>;

  const overall = SIGNAL_STYLES[data.overallSignal];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <nav className="flex items-center gap-2 text-xs text-slate-400">
        <Link href="/cara-toolkit" className="hover:text-slate-600">Cara Toolkit</Link>
        <span>/</span>
        <span className="text-slate-600">Showing Impact</span>
      </nav>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Showing Impact — Evidence Summary</h1>
        <p className="text-sm text-slate-600 mt-1">
          Baseline → Action → Voice → Change → Evidence → Impact. What has this home actually changed for the children in its care?
        </p>
      </div>

      {/* Impact chain reminder */}
      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
        <div className="flex flex-wrap gap-1.5 text-xs font-medium text-blue-800">
          {["Baseline", "Action", "Voice", "Change", "Evidence", "Impact"].map((s, i, arr) => (
            <span key={s} className="flex items-center gap-1.5">
              <span className="rounded-full bg-blue-100 border border-blue-200 px-2.5 py-0.5">{s}</span>
              {i < arr.length - 1 && <span className="text-blue-400">→</span>}
            </span>
          ))}
        </div>
      </div>

      {/* Summary banner */}
      <div className={`rounded-2xl border-2 p-5 ${overall.bg} ${overall.border}`}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-2xl font-bold text-slate-800">{data.totalChildren}</p>
            <p className="text-xs text-slate-500">Children in placement</p>
          </div>
          <div>
            <p className={`text-2xl font-bold ${data.childrenWithVoice === data.totalChildren ? "text-green-700" : "text-amber-700"}`}>
              {data.childrenWithVoice}
            </p>
            <p className="text-xs text-slate-500">With voice recorded</p>
          </div>
          <div>
            <p className={`text-2xl font-bold ${data.childrenImproving > 0 ? "text-green-700" : "text-slate-700"}`}>
              {data.childrenImproving}
            </p>
            <p className="text-xs text-slate-500">Improving trend</p>
          </div>
          <div>
            <p className={`text-2xl font-bold ${data.childrenWithKeyWork < data.totalChildren ? "text-amber-700" : "text-green-700"}`}>
              {data.childrenWithKeyWork}
            </p>
            <p className="text-xs text-slate-500">With key work</p>
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

      {/* Per-child summaries */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
          Per-child impact ({data.totalChildren})
        </h2>
        {data.childSummaries.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
            No children currently in placement.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {data.childSummaries.map((s) => (
              <ChildImpactCard key={s.childId} summary={s} />
            ))}
          </div>
        )}
      </section>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
        <p className="font-semibold mb-1">Regulatory reference</p>
        <p>{data.regulatoryNote}</p>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
        Impact signals shown here are derived from existing records. Managers and keyworkers are responsible for capturing rich evidence of change in records that can be used in Reg 45 reviews and Ofsted inspections.
      </div>
    </div>
  );
}

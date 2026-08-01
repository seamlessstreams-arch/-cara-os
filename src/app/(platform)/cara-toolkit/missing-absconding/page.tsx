"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import type { MissingAbscondingAnalysis, MissingEpisodeSummary, SignalColour } from "@/lib/cara-visual-toolkit/types";

async function fetchMissingAbsconding(): Promise<MissingAbscondingAnalysis> {
  const res = await fetch("/api/v1/cara-toolkit/missing-absconding");
  if (!res.ok) throw new Error("Failed to fetch missing/absconding data");
  const json = await res.json();
  return json.data as MissingAbscondingAnalysis;
}

function useCaraToolkitMissingAbsconding() {
  return useQuery({
    queryKey: ["cara-toolkit-missing-absconding"],
    queryFn: fetchMissingAbsconding,
    staleTime: 120_000,
  });
}

const SIGNAL_STYLES: Record<SignalColour, { bg: string; border: string; text: string }> = {
  green: { bg: "bg-green-50",  border: "border-green-200",  text: "text-green-800"  },
  amber: { bg: "bg-amber-50",  border: "border-amber-200",  text: "text-amber-800"  },
  red:   { bg: "bg-red-50",    border: "border-red-200",    text: "text-red-800"    },
  grey:  { bg: "bg-slate-50",  border: "border-slate-200",  text: "text-slate-600"  },
};

const RISK_STYLES: Record<string, string> = {
  critical: "bg-red-100 text-red-700 border-red-200",
  high:     "bg-orange-100 text-orange-700 border-orange-200",
  medium:   "bg-amber-100 text-amber-700 border-amber-200",
  low:      "bg-green-100 text-green-700 border-green-200",
  unknown:  "bg-slate-100 text-slate-500 border-slate-200",
};

function EpisodeCard({ ep }: { ep: MissingEpisodeSummary }) {
  const riskStyle = RISK_STYLES[ep.riskLevel] ?? RISK_STYLES.unknown;
  const isCurrent = ep.currentlyMissing;

  return (
    <div
      className={`rounded-xl border p-4 flex flex-col gap-3 ${
        isCurrent
          ? "border-red-300 bg-red-50"
          : !ep.returnInterviewCompleted && ep.dateReturned
          ? "border-amber-200 bg-amber-50"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold text-sm text-slate-800">{ep.childInitials}</span>
        <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${riskStyle}`}>
          {ep.riskLevel} risk
        </span>
        {isCurrent && (
          <span className="rounded-full bg-red-600 text-white px-2 py-0.5 text-xs font-semibold">
            Currently missing
          </span>
        )}
        <span className="text-xs text-slate-400 ml-auto">{ep.dateMissing}</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <p className="text-xs text-slate-400 mb-0.5">Returned</p>
          <p className="text-sm font-medium text-slate-700">{ep.dateReturned ?? "Not yet"}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400 mb-0.5">Duration</p>
          <p className="text-sm font-medium text-slate-700">
            {ep.durationHours !== null ? `${ep.durationHours}h` : "—"}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-400 mb-0.5">Police reported</p>
          <p className={`text-sm font-medium ${ep.reportedToPolice ? "text-green-700" : "text-slate-500"}`}>
            {ep.reportedToPolice ? "Yes" : "No"}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-400 mb-0.5">Return interview</p>
          <p
            className={`text-sm font-medium ${
              ep.currentlyMissing
                ? "text-slate-400"
                : ep.returnInterviewCompleted
                ? "text-green-700"
                : "text-amber-700"
            }`}
          >
            {ep.currentlyMissing
              ? "N/A — missing"
              : ep.returnInterviewCompleted
              ? "Completed"
              : "Outstanding"}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function MissingAbscondingPage() {
  const { data, isLoading, error } = useCaraToolkitMissingAbsconding();

  if (isLoading) return <div className="p-8 text-slate-500 text-sm">Loading missing and absconding data…</div>;
  if (error || !data) return <div className="p-8 text-red-600 text-sm">Unable to load missing/absconding data.</div>;

  const signal = SIGNAL_STYLES[data.overallSignal];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <nav className="flex items-center gap-2 text-xs text-slate-400">
        <Link href="/cara-toolkit" className="hover:text-slate-600">Cara Toolkit</Link>
        <span>/</span>
        <span className="text-slate-600">Missing / Absconding Review</span>
      </nav>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Missing / Absconding Review Tool</h1>
        <p className="text-sm text-slate-600 mt-1">
          Pattern, response, and prevention. Every missing episode is a safeguarding event — not a behaviour.
        </p>
      </div>

      {/* Currently missing alert */}
      {data.currentlyMissing > 0 && (
        <div className="rounded-xl border-2 border-red-300 bg-red-50 p-4 text-sm text-red-900">
          <p className="font-bold mb-1">
            {data.currentlyMissing} child{data.currentlyMissing > 1 ? "ren are" : " is"} currently missing
          </p>
          <p>Immediate multi-agency notification, welfare checks, and police contact must be in place. Review the Philomena Protocol.</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm">
          <p className="text-2xl font-bold text-slate-800">{data.totalEpisodes}</p>
          <p className="text-xs text-slate-500 mt-0.5">Total episodes</p>
        </div>
        <div className={`rounded-xl border p-3 text-center shadow-sm ${data.highRiskEpisodes > 0 ? "border-red-200 bg-red-50" : "border-slate-200 bg-white"}`}>
          <p className={`text-2xl font-bold ${data.highRiskEpisodes > 0 ? "text-red-700" : "text-slate-800"}`}>{data.highRiskEpisodes}</p>
          <p className="text-xs text-slate-500 mt-0.5">High/critical risk</p>
        </div>
        <div className={`rounded-xl border p-3 text-center shadow-sm ${data.returnInterviewCompletionRate < 100 ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white"}`}>
          <p className={`text-2xl font-bold ${data.returnInterviewCompletionRate === 100 ? "text-green-700" : "text-amber-700"}`}>
            {data.returnInterviewCompletionRate}%
          </p>
          <p className="text-xs text-slate-500 mt-0.5">RHI completion</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm">
          <p className="text-2xl font-bold text-slate-800">
            {data.avgDurationHours !== null ? `${data.avgDurationHours}h` : "—"}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Avg duration</p>
        </div>
      </div>

      {/* Risk level breakdown */}
      {data.riskLevelBreakdown.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Risk level distribution</h2>
          <div className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col gap-2">
            {data.riskLevelBreakdown.map((r) => (
              <div key={r.level} className="flex items-center gap-3">
                <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium w-24 text-center ${RISK_STYLES[r.level] ?? RISK_STYLES.unknown}`}>
                  {r.label}
                </span>
                <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-2 rounded-full bg-slate-400"
                    style={{ width: `${data.totalEpisodes > 0 ? Math.max(4, Math.round((r.count / data.totalEpisodes) * 100)) : null}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-slate-700 w-5 shrink-0">{r.count}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Overall signal */}
      <div className={`rounded-2xl border-2 p-4 ${signal.bg} ${signal.border}`}>
        <p className={`text-sm font-semibold ${signal.text}`}>
          {data.incompleteReturnInterviews > 0
            ? `${data.incompleteReturnInterviews} return home interview${data.incompleteReturnInterviews > 1 ? "s" : ""} still outstanding`
            : data.highRiskEpisodes > 0
            ? `${data.highRiskEpisodes} high or critical risk episode${data.highRiskEpisodes > 1 ? "s" : ""} — review contextual safeguarding plans`
            : data.totalEpisodes === 0
            ? "No missing episodes recorded"
            : "All return home interviews completed — statutory compliance maintained"}
        </p>
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

      {/* Episode list */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
          All episodes ({data.totalEpisodes})
        </h2>
        {data.episodes.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
            No missing episodes recorded.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {data.episodes.map((ep) => (
              <EpisodeCard key={ep.id} ep={ep} />
            ))}
          </div>
        )}
      </section>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
        <p className="font-semibold mb-1">Regulatory reference</p>
        <p>{data.regulatoryNote}</p>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
        Every missing episode is a safeguarding event. Missing from care is not a lifestyle choice or a behaviour problem — it is a signal of unmet need. Managers remain professionally accountable for all safeguarding decisions and notifications.
      </div>
    </div>
  );
}

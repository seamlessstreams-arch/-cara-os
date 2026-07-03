"use client";

import { PageShell } from "@/components/layout/page-shell";
import { usePracticeCultureScorecard } from "@/hooks/use-practice-culture-scorecard";
import type { RAGStatus, ScorecardDimension } from "@/hooks/use-practice-culture-scorecard";

// ── RAG helpers ──────────────────────────────────────────────────────────────

const RAG_LABEL: Record<RAGStatus, string> = {
  progressing:    "Progressing",
  developing:     "Developing",
  needs_support:  "Needs Support",
};

const RAG_BG: Record<RAGStatus, string> = {
  progressing:   "bg-emerald-50 border-emerald-200",
  developing:    "bg-amber-50 border-amber-200",
  needs_support: "bg-red-50 border-red-200",
};

const RAG_BADGE: Record<RAGStatus, string> = {
  progressing:   "bg-emerald-100 text-emerald-800",
  developing:    "bg-amber-100 text-amber-800",
  needs_support: "bg-red-100 text-red-800",
};

const RAG_BAR: Record<RAGStatus, string> = {
  progressing:   "bg-emerald-500",
  developing:    "bg-amber-500",
  needs_support: "bg-red-500",
};

const RAG_RING: Record<RAGStatus, string> = {
  progressing:   "text-emerald-600",
  developing:    "text-amber-500",
  needs_support: "text-red-500",
};

// ── Overall score dial (SVG arc) ─────────────────────────────────────────────

function ScoreDial({ score, status }: { score: number; status: RAGStatus }) {
  const r = 48;
  const cx = 60;
  const cy = 60;
  const circumference = 2 * Math.PI * r;
  const filled = (score / 100) * circumference;
  const gap = circumference - filled;

  const colourMap: Record<RAGStatus, string> = {
    progressing:   "#10b981",
    developing:    "#f59e0b",
    needs_support: "#ef4444",
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="120" height="120" viewBox="0 0 120 120">
        {/* track */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e5e7eb" strokeWidth="10" />
        {/* filled arc */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={colourMap[status]}
          strokeWidth="10"
          strokeDasharray={`${filled} ${gap}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
        />
        <text x={cx} y={cy + 7} textAnchor="middle" fontSize="22" fontWeight="700" fill={colourMap[status]}>
          {score}
        </text>
      </svg>
      <span className={`text-sm font-medium ${RAG_RING[status]}`}>{RAG_LABEL[status]}</span>
    </div>
  );
}

// ── Dimension card ───────────────────────────────────────────────────────────

function DimensionCard({ dim, priority }: { dim: ScorecardDimension; priority: boolean }) {
  return (
    <div className={`rounded-lg border p-4 ${RAG_BG[dim.status]} ${priority ? "ring-2 ring-[var(--cs-risk)] ring-offset-1" : ""}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          {priority && (
            <span className="inline-block text-xs bg-red-100 text-red-700 font-medium px-2 py-0.5 rounded mb-1">
              Priority area
            </span>
          )}
          <p className="text-sm font-semibold text-gray-800">{dim.label}</p>
          <p className="text-xs text-gray-500 mt-0.5">{dim.description}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-2xl font-bold text-gray-800">{dim.score}</p>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${RAG_BADGE[dim.status]}`}>
            {RAG_LABEL[dim.status]}
          </span>
        </div>
      </div>

      {/* score bar */}
      <div className="h-2 bg-white/60 rounded-full overflow-hidden mb-3">
        <div
          className={`h-full rounded-full transition-all ${RAG_BAR[dim.status]}`}
          style={{ width: `${dim.score}%` }}
        />
      </div>

      <p className="text-xs text-gray-500 mb-2">
        {dim.dataPoints} data point{dim.dataPoints !== 1 ? "s" : ""} analysed
      </p>

      {/* supervision prompt */}
      <details className="group">
        <summary className="text-xs font-medium text-indigo-700 cursor-pointer list-none hover:underline select-none">
          Supervision prompt ↓
        </summary>
        <p className="mt-2 text-xs text-gray-700 bg-white/70 rounded p-2 leading-relaxed">
          {dim.improvementPrompt}
        </p>
      </details>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function PracticeCultureScorecardPage() {
  const { data, isLoading, isError } = usePracticeCultureScorecard();

  return (
    <PageShell
      title="Practice Culture Scorecard"
      description="A five-dimension synthesis of recording quality, child voice, therapeutic language, strengths documentation, and framework engagement. Cara computes — the manager interprets and acts."
    >
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 rounded-full border-2 border-indigo-300 border-t-indigo-600 animate-spin" />
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Unable to load scorecard. Please refresh.
        </div>
      )}

      {data && (() => {
        const { overallScore, overallStatus, dimensions, summary } = data.data;

        const priorityDim = dimensions.find((d) => d.id === summary.priorityDimension);
        const strongestDim = dimensions.find((d) => d.id === summary.strongestDimension);

        return (
          <div className="space-y-6">
            {/* ── Overall score + summary tiles ───────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
              {/* Score dial */}
              <div className={`rounded-xl border p-6 flex flex-col items-center gap-4 ${RAG_BG[overallStatus]}`}>
                <p className="text-sm font-semibold text-gray-700">Overall Practice Culture Score</p>
                <ScoreDial score={overallScore} status={overallStatus} />
                <p className="text-xs text-gray-500 text-center">
                  {summary.totalRecordsAnalysed} records analysed across 5 dimensions
                </p>
              </div>

              {/* Priority dimension */}
              <div className="rounded-xl border border-red-200 bg-red-50 p-5">
                <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-1">Priority dimension</p>
                <p className="text-lg font-bold text-gray-800 mb-1">{summary.priorityLabel}</p>
                <p className="text-xs text-gray-600 leading-relaxed">{summary.priorityPrompt}</p>
              </div>

              {/* Strongest dimension */}
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-1">Strongest dimension</p>
                <p className="text-lg font-bold text-gray-800 mb-1">{summary.strongestLabel}</p>
                {strongestDim && (
                  <p className="text-xs text-gray-600">{strongestDim.description}</p>
                )}
                <div className="mt-2 flex items-center gap-1.5">
                  <span className={`text-xl font-bold ${RAG_RING[strongestDim?.status ?? "progressing"]}`}>
                    {strongestDim?.score ?? 0}
                  </span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${RAG_BADGE[strongestDim?.status ?? "progressing"]}`}>
                    {RAG_LABEL[strongestDim?.status ?? "progressing"]}
                  </span>
                </div>
              </div>
            </div>

            {/* ── Framework engagement strip ───────────────────────────── */}
            <div className="rounded-lg border border-violet-200 bg-violet-50 px-5 py-3 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-violet-800">
                  KB Framework Engagement
                </p>
                <p className="text-xs text-violet-600">
                  {summary.frameworksEngaged} of {summary.totalFrameworks} practice frameworks engaged across platform engines
                </p>
              </div>
              <div className="text-2xl font-bold text-violet-700">
                {summary.frameworksEngaged}/{summary.totalFrameworks}
              </div>
            </div>

            {/* ── Dimension cards ──────────────────────────────────────── */}
            <div>
              <h2 className="text-sm font-semibold text-gray-600 mb-3">Five Dimensions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {dimensions.map((dim) => (
                  <DimensionCard
                    key={dim.id}
                    dim={dim}
                    priority={dim.id === summary.priorityDimension}
                  />
                ))}
              </div>
            </div>

            {/* ── RAG legend ───────────────────────────────────────────── */}
            <div className="rounded-lg bg-gray-50 border border-gray-200 px-5 py-3">
              <p className="text-xs font-semibold text-gray-600 mb-2">Score guide</p>
              <div className="flex gap-4 text-xs text-gray-600">
                <span><span className="font-medium text-emerald-700">Progressing</span> — 65+</span>
                <span><span className="font-medium text-amber-700">Developing</span> — 40–64</span>
                <span><span className="font-medium text-red-700">Needs Support</span> — under 40</span>
              </div>
            </div>

            {/* ── Accountability note ──────────────────────────────────── */}
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-5 py-3 text-xs text-gray-500 leading-relaxed">
              <span className="font-medium text-gray-600">Professional accountability: </span>
              Cara computes this scorecard from patterns in the platform&rsquo;s records. It is a prompt for professional conversation — not a compliance judgement. The registered manager interprets the evidence, identifies root causes, and decides what action (if any) to take. Scores reflect what is recorded, not necessarily the quality of care delivered.
            </div>
          </div>
        );
      })()}
    </PageShell>
  );
}

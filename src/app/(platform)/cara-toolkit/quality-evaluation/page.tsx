"use client";

import Link from "next/link";
import { useCaraToolkitQualityEvaluation } from "@/hooks/use-cara-toolkit-quality-evaluation";
import type { QualityDimension, SignalColour } from "@/lib/cara-visual-toolkit/types";

const SIGNAL_STYLES: Record<SignalColour, { bg: string; border: string; text: string; dot: string; label: string }> = {
  green: { bg: "bg-green-50",  border: "border-green-200",  text: "text-green-800",  dot: "bg-green-400",  label: "Good"     },
  amber: { bg: "bg-amber-50",  border: "border-amber-200",  text: "text-amber-800",  dot: "bg-amber-400",  label: "Developing" },
  red:   { bg: "bg-red-50",    border: "border-red-200",    text: "text-red-800",    dot: "bg-red-400",    label: "Needs improvement" },
  grey:  { bg: "bg-slate-50",  border: "border-slate-200",  text: "text-slate-600",  dot: "bg-slate-300",  label: "No data"  },
};

function ScoreDial({ score, signal }: { score: number | null; signal: SignalColour }) {
  const colour = signal === "green" ? "text-green-700" : signal === "amber" ? "text-amber-700" : signal === "grey" ? "text-slate-500" : "text-red-700";
  const ring = signal === "green" ? "border-green-300" : signal === "amber" ? "border-amber-300" : signal === "grey" ? "border-slate-300" : "border-red-300";
  const bg   = signal === "green" ? "bg-green-50"    : signal === "amber" ? "bg-amber-50"    : signal === "grey" ? "bg-slate-50"    : "bg-red-50";
  return (
    <div className={`w-20 h-20 rounded-full border-4 flex flex-col items-center justify-center shrink-0 ${ring} ${bg}`}>
      <p className={`text-2xl font-black ${colour}`}>{score ?? "—"}</p>
      <p className={`text-xs font-medium ${colour}`}>{score === null ? "not measured" : "/100"}</p>
    </div>
  );
}

function DimensionCard({ dim }: { dim: QualityDimension }) {
  const style = SIGNAL_STYLES[dim.signal];
  return (
    <div className={`rounded-xl border p-4 flex flex-col gap-3 ${style.bg} ${style.border}`}>
      <div className="flex items-start gap-4">
        <ScoreDial score={dim.score} signal={dim.signal} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`w-2 h-2 rounded-full shrink-0 ${style.dot}`} />
            <p className={`font-semibold text-sm ${style.text}`}>{dim.label}</p>
          </div>
          {/* Score bar */}
          <div className="h-2 rounded-full bg-slate-200 overflow-hidden mb-2">
            <div
              className={`h-2 rounded-full ${dim.signal === "green" ? "bg-green-400" : dim.signal === "amber" ? "bg-amber-400" : dim.signal === "grey" ? "bg-slate-300" : "bg-red-400"}`}
              style={{ width: `${dim.score ?? 0}%` }}
            />
          </div>
          <div className="flex flex-col gap-1">
            {dim.evidence.map((e, i) => (
              <p key={i} className="text-xs text-slate-600 flex items-center gap-1.5">
                <span className="text-green-500 shrink-0">✓</span>
                {e}
              </p>
            ))}
            {dim.gaps.map((g, i) => (
              <p key={i} className="text-xs text-red-600 flex items-center gap-1.5">
                <span className="shrink-0">!</span>
                {g}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function QualityEvaluationPage() {
  const { data, isLoading, error } = useCaraToolkitQualityEvaluation();

  if (isLoading) return <div className="p-8 text-slate-500 text-sm">Evaluating quality of care…</div>;
  if (error || !data) return <div className="p-8 text-red-600 text-sm">Unable to load quality evaluation data.</div>;

  const overall = SIGNAL_STYLES[data.overallSignal];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <nav className="flex items-center gap-2 text-xs text-slate-400">
        <Link href="/cara-toolkit" className="hover:text-slate-600">Cara Toolkit</Link>
        <span>/</span>
        <span className="text-slate-600">Quality of Care Evaluation</span>
      </nav>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Quality of Care Evaluation</h1>
        <p className="text-sm text-slate-600 mt-1">
          Beyond activity — what has changed? Five evidence dimensions scored from your records. Supports Reg 45 and self-evaluation.
        </p>
      </div>

      {/* Overall score */}
      <div className={`rounded-2xl border-2 p-5 flex items-center gap-5 ${overall.bg} ${overall.border}`}>
        <ScoreDial score={data.overallScore} signal={data.overallSignal} />
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Overall quality score</p>
          <p className={`text-xl font-bold ${overall.text}`}>{overall.label}</p>
          {data.strengths.length > 0 && (
            <p className="text-sm text-slate-600 mt-1">
              Strong: {data.strengths.join(", ")}
            </p>
          )}
        </div>
      </div>

      {/* Dimensions */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Five dimensions</h2>
        <div className="flex flex-col gap-3">
          {data.dimensions.map((dim) => (
            <DimensionCard key={dim.id} dim={dim} />
          ))}
        </div>
      </section>

      {/* Areas for improvement */}
      {data.areasForImprovement.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Priority improvements</h2>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex flex-col gap-2">
            {data.areasForImprovement.map((area, i) => (
              <div key={i} className="text-sm text-amber-800 flex items-start gap-2">
                <span className="shrink-0 mt-0.5">→</span>
                {area}
              </div>
            ))}
          </div>
        </section>
      )}

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

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
        <p className="font-semibold mb-1">Regulatory reference</p>
        <p>{data.regulatoryNote}</p>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
        Quality scores are derived from seeded record data using deterministic rules. They support reflection and planning — not formal self-evaluation or inspection reporting. Managers remain professionally accountable for all quality assurance processes.
      </div>
    </div>
  );
}

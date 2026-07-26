"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import type { StaffingIndicator, WorkforceRiskAnalysis, WorkforceRiskLevel, SignalColour } from "@/lib/cara-visual-toolkit/types";

async function fetchWorkforceRisk(): Promise<WorkforceRiskAnalysis> {
  const res = await fetch("/api/v1/cara-toolkit/workforce-risk");
  if (!res.ok) throw new Error("Failed to fetch workforce risk data");
  const json = await res.json();
  return json.data as WorkforceRiskAnalysis;
}

function useCaraToolkitWorkforceRisk() {
  return useQuery({
    queryKey: ["cara-toolkit-workforce-risk"],
    queryFn: fetchWorkforceRisk,
    staleTime: 120_000,
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const RISK_STYLES: Record<WorkforceRiskLevel, { bg: string; border: string; text: string; label: string }> = {
  low:      { bg: "bg-green-50",  border: "border-green-300",  text: "text-green-800",  label: "Low"      },
  moderate: { bg: "bg-amber-50",  border: "border-amber-300",  text: "text-amber-800",  label: "Moderate" },
  elevated: { bg: "bg-orange-50", border: "border-orange-300", text: "text-orange-800", label: "Elevated" },
  critical: { bg: "bg-red-50",    border: "border-red-300",    text: "text-red-800",    label: "Critical" },
};

const SIGNAL_STYLES: Record<SignalColour, { dot: string; row: string }> = {
  green: { dot: "bg-green-400", row: "" },
  amber: { dot: "bg-amber-400", row: "bg-amber-50" },
  red:   { dot: "bg-red-400",   row: "bg-red-50" },
  grey:  { dot: "bg-slate-300", row: "" },
};

const PRIORITY_COLOUR: Record<string, string> = {
  urgent: "border-red-200 bg-red-50 text-red-800",
  high:   "border-amber-200 bg-amber-50 text-amber-800",
  medium: "border-blue-200 bg-blue-50 text-blue-800",
  low:    "border-slate-200 bg-white text-slate-700",
};

function IndicatorRow({ indicator }: { indicator: StaffingIndicator }) {
  const styles = SIGNAL_STYLES[indicator.signal];
  return (
    <div className={`flex items-start gap-3 rounded-lg px-3 py-2.5 ${styles.row}`}>
      <span className={`w-2.5 h-2.5 rounded-full mt-0.5 shrink-0 ${styles.dot}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-slate-700">{indicator.label}</span>
          <span className="text-sm font-semibold text-slate-900 shrink-0">{indicator.value}</span>
        </div>
        {indicator.note && (
          <p className="text-xs text-slate-500 mt-0.5">{indicator.note}</p>
        )}
      </div>
    </div>
  );
}

function IndicatorSection({
  title,
  indicators,
}: {
  title: string;
  indicators: StaffingIndicator[];
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100">
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      </div>
      <div className="p-2 flex flex-col gap-1">
        {indicators.map((ind, i) => (
          <IndicatorRow key={i} indicator={ind} />
        ))}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function WorkforceRiskPage() {
  const { data, isLoading, error } = useCaraToolkitWorkforceRisk();

  if (isLoading) {
    return <div className="p-8 text-slate-500 text-sm">Analysing workforce risk indicators…</div>;
  }
  if (error || !data) {
    return <div className="p-8 text-red-600 text-sm">Unable to load workforce risk data.</div>;
  }

  const risk = RISK_STYLES[data.overallRisk];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-slate-400">
        <Link href="/cara-toolkit" className="hover:text-slate-600">Cara Toolkit</Link>
        <span>/</span>
        <span className="text-slate-600">Workforce Burnout & Risk Dashboard</span>
      </nav>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Workforce Burnout & Risk Dashboard</h1>
        <p className="text-sm text-slate-600 mt-1">
          Staffing stability, supervision quality, training compliance, and burnout signals across the workforce.
        </p>
      </div>

      {/* Overall risk */}
      <div className={`rounded-2xl border-2 p-5 ${risk.bg} ${risk.border}`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
              Overall workforce risk
            </p>
            <p className={`text-xl font-bold ${risk.text}`}>{risk.label}</p>
            <p className={`text-sm mt-1 ${risk.text}`}>{data.overallRiskLabel}</p>
          </div>
          <div className={`rounded-full border-2 w-14 h-14 flex items-center justify-center ${risk.border} ${risk.bg}`}>
            <span className={`text-xl font-black ${risk.text}`}>
              {data.overallRisk === "critical" ? "!" :
               data.overallRisk === "elevated" ? "↑" :
               data.overallRisk === "moderate" ? "~" : "✓"}
            </span>
          </div>
        </div>
        <p className="text-sm mt-3 text-slate-700">{data.teamSignalSummary}</p>
      </div>

      {/* Indicators */}
      <div className="space-y-4">
        <IndicatorSection title="Staffing"         indicators={data.staffingIndicators} />
        <IndicatorSection title="Supervision"      indicators={data.supervisionIndicators} />
        <IndicatorSection title="Training"         indicators={data.trainingIndicators} />
      </div>

      {/* Burnout signals */}
      {data.burnoutSignals.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
            Burnout & risk signals
          </h2>
          <div className="flex flex-col gap-2">
            {data.burnoutSignals.map((signal, i) => (
              <div
                key={i}
                className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 leading-relaxed"
              >
                <span className="font-semibold mr-2">Cara:</span>
                {signal}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Strengths */}
      {data.strengths.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
            Strengths
          </h2>
          <div className="flex flex-col gap-2">
            {data.strengths.map((s, i) => (
              <div
                key={i}
                className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-900 flex items-start gap-2"
              >
                <span className="text-green-600 shrink-0 mt-0.5">✓</span>
                {s}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Priority actions */}
      {data.priorityActions.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
            Priority actions
          </h2>
          <div className="flex flex-col gap-3">
            {data.priorityActions.map((action) => (
              <div
                key={action.id}
                className={`rounded-xl border p-4 flex flex-col gap-2 ${PRIORITY_COLOUR[action.priority]}`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${PRIORITY_COLOUR[action.priority]}`}
                  >
                    {action.priority.toUpperCase()}
                  </span>
                  <span className="text-xs text-slate-500">→ {action.owner}</span>
                </div>
                <p className="text-sm font-medium text-slate-900">{action.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Regulatory note */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
        <p className="font-semibold mb-1">Regulatory reference</p>
        <p>{data.regulatoryNote}</p>
      </div>

      {/* Professional reminder */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
        Staff and managers remain professionally accountable for all workforce decisions. This tool supports review and planning — it does not replace professional judgement.
      </div>
    </div>
  );
}

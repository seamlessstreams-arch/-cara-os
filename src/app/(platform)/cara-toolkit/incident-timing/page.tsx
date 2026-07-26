"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import type { IncidentTimingAnalysis, PeriodCount, TimePeriod } from "@/lib/cara-visual-toolkit/types";

async function fetchIncidentTiming(): Promise<IncidentTimingAnalysis> {
  const res = await fetch("/api/v1/cara-toolkit/incident-timing");
  if (!res.ok) throw new Error("Failed to fetch incident timing data");
  const json = await res.json();
  return json.data as IncidentTimingAnalysis;
}

function useCaraToolkitIncidentTiming() {
  return useQuery({
    queryKey: ["cara-toolkit-incident-timing"],
    queryFn: fetchIncidentTiming,
    staleTime: 120_000,
  });
}

// ── Visual helpers ────────────────────────────────────────────────────────────

const PERIOD_ICON: Record<TimePeriod, string> = {
  night:     "🌙",
  morning:   "🌅",
  afternoon: "☀️",
  evening:   "🌆",
};

const SEV_COLOUR: Record<string, string> = {
  critical: "bg-red-600",
  high:     "bg-red-400",
  medium:   "bg-amber-400",
  low:      "bg-green-400",
  unknown:  "bg-slate-300",
};

const SEV_TEXT: Record<string, string> = {
  critical: "text-red-700",
  high:     "text-red-600",
  medium:   "text-amber-700",
  low:      "text-green-700",
  unknown:  "text-slate-500",
};

function PeriodBar({ period, maxCount }: { period: PeriodCount; maxCount: number }) {
  const barWidth = maxCount > 0 ? Math.max(4, Math.round((period.count / maxCount) * 100)) : 4;
  const isPeak = period.count === maxCount && period.count > 0;

  return (
    <div
      className={`rounded-xl border p-4 flex flex-col gap-3 ${
        isPeak
          ? "border-red-200 bg-red-50"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-lg" aria-hidden="true">{PERIOD_ICON[period.period]}</span>
          <div>
            <p className="font-semibold text-sm text-slate-900">{period.label}</p>
            <p className="text-xs text-slate-400">{period.hours}</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-slate-800">{period.count}</span>
          <p className="text-xs text-slate-400">{period.pct}%</p>
        </div>
      </div>

      {/* Bar */}
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-2 rounded-full transition-all ${isPeak ? "bg-red-400" : "bg-blue-300"}`}
          style={{ width: `${barWidth}%` }}
        />
      </div>

      {/* Severity breakdown */}
      {Object.keys(period.severityCounts).length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(period.severityCounts)
            .sort((a, b) => {
              const order: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
              return (order[a[0]] ?? 4) - (order[b[0]] ?? 4);
            })
            .map(([sev, cnt]) => (
              <span
                key={sev}
                className={`inline-flex items-center gap-1 text-xs font-medium ${SEV_TEXT[sev] ?? "text-slate-600"}`}
              >
                <span className={`w-2 h-2 rounded-full ${SEV_COLOUR[sev] ?? "bg-slate-300"}`} />
                {cnt} {sev}
              </span>
            ))}
        </div>
      )}

      {isPeak && (
        <p className="text-xs font-medium text-red-700">
          Peak risk period
        </p>
      )}
    </div>
  );
}

function HourGrid({ buckets }: { buckets: { hour: number; label: string; count: number }[] }) {
  const max = Math.max(...buckets.map((b) => b.count), 1);
  return (
    <div className="flex gap-1 items-end h-16">
      {buckets.map((b) => {
        const height = b.count > 0 ? Math.max(4, Math.round((b.count / max) * 60)) : 2;
        const isEvening = b.hour >= 18 && b.hour <= 23;
        return (
          <div key={b.hour} className="flex-1 flex flex-col items-center gap-0.5 group">
            <div
              title={`${b.label}: ${b.count} incident${b.count !== 1 ? "s" : ""}`}
              className={`w-full rounded-sm transition-all ${
                b.count > 0
                  ? isEvening
                    ? "bg-red-400 group-hover:bg-red-500"
                    : "bg-blue-300 group-hover:bg-blue-400"
                  : "bg-slate-100"
              }`}
              style={{ height: `${height}px` }}
            />
          </div>
        );
      })}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function IncidentTimingPage() {
  const { data, isLoading, error } = useCaraToolkitIncidentTiming();

  if (isLoading) {
    return <div className="p-8 text-slate-500 text-sm">Analysing incident timing patterns…</div>;
  }
  if (error || !data) {
    return <div className="p-8 text-red-600 text-sm">Unable to load incident timing data.</div>;
  }

  const maxPeriodCount = Math.max(...data.periodCounts.map((p) => p.count), 1);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-slate-400">
        <Link href="/cara-toolkit" className="hover:text-slate-600">Cara Toolkit</Link>
        <span>/</span>
        <span className="text-slate-600">Incident Timing Intelligence</span>
      </nav>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Incident Timing Intelligence</h1>
        <p className="text-sm text-slate-600 mt-1">
          When do incidents cluster? Understanding timing helps prevent escalation before it begins.
        </p>
      </div>

      {/* Safeguarding override */}
      {data.safeguardingNote && (
        <div className="rounded-xl border-2 border-red-300 bg-red-50 p-4 text-sm text-red-900">
          <p className="font-semibold mb-1">Safeguarding alert</p>
          <p>{data.safeguardingNote}</p>
        </div>
      )}

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm">
          <p className="text-2xl font-bold text-slate-800">{data.totalAnalysed}</p>
          <p className="text-xs text-slate-500 mt-0.5">Incidents analysed</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm">
          <p className="text-2xl font-bold text-slate-800">
            {data.peakPeriod ? PERIOD_ICON[data.peakPeriod] : "—"}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Peak: {data.peakPeriodLabel}</p>
        </div>
        <div className={`rounded-xl border p-3 text-center shadow-sm ${
          (data.severityBreakdown.find((s) => s.severity === "critical")?.count ?? 0) > 0
            ? "border-red-200 bg-red-50"
            : "border-slate-200 bg-white"
        }`}>
          <p className="text-2xl font-bold text-red-700">
            {data.severityBreakdown.find((s) => s.severity === "critical")?.count ?? 0}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Critical incidents</p>
        </div>
      </div>

      {/* Period cards */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
          Distribution by time period
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {data.periodCounts.map((p) => (
            <PeriodBar key={p.period} period={p} maxCount={maxPeriodCount} />
          ))}
        </div>
      </section>

      {/* 24-hour heatmap */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
          24-hour incident pattern
        </h2>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <HourGrid buckets={data.hourlyBuckets} />
          <div className="flex justify-between mt-2 text-xs text-slate-400">
            <span>00:00</span>
            <span>06:00</span>
            <span>12:00</span>
            <span>18:00</span>
            <span>23:00</span>
          </div>
          <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-red-400" />
              Evening (18–23)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-blue-300" />
              Other periods
            </span>
          </div>
        </div>
      </section>

      {/* Type breakdown */}
      {data.typeBreakdown.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
            Incident types
          </h2>
          <div className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col gap-2">
            {data.typeBreakdown.map((t) => (
              <div key={t.type} className="flex items-center gap-3">
                <div className="w-36 text-xs text-slate-600 shrink-0 truncate">{t.label}</div>
                <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-2 rounded-full bg-slate-400"
                    style={{
                      width: `${Math.max(4, Math.round((t.count / data.totalAnalysed) * 100))}%`,
                    }}
                  />
                </div>
                <div className="w-6 text-xs font-semibold text-slate-700 shrink-0">{t.count}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Prevention window */}
      <section className="rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-2">
        <h2 className="text-sm font-semibold text-blue-900">Prevention window</h2>
        <p className="text-sm text-blue-800">{data.preventionWindow}</p>
      </section>

      {/* Cara insights */}
      {data.insights.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
            Cara insights
          </h2>
          <div className="flex flex-col gap-3">
            {data.insights.map((insight, i) => (
              <div
                key={i}
                className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700 leading-relaxed"
              >
                <span className="font-semibold text-slate-900 mr-2">Cara:</span>
                {insight}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Regulatory note */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
        <span className="font-semibold">Regulatory reference: </span>
        CHR 2015 Reg 36 (notifiable events) and Reg 40 (registered manager oversight). This tool supports manager review and learning, not regulatory notification. Staff and managers remain professionally accountable for all decisions.
      </div>
    </div>
  );
}

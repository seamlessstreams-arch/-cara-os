"use client";

import { useQuery } from "@tanstack/react-query";
import { formatRate } from "@/lib/metrics/rate";
import type {
  StaffInductionOnboardingResult,
  InductionOnboardingRating,
  InductionInsight,
  InductionRecommendation,
} from "@/lib/engines/home-staff-induction-onboarding-intelligence-engine";

function useHomeStaffInductionOnboardingIntelligence() {
  return useQuery({
    queryKey: ["home-staff-induction-onboarding-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-staff-induction-onboarding-intelligence");
      if (!res.ok) throw new Error("Failed to fetch staff induction onboarding intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}

const RATING_STYLES: Record<InductionOnboardingRating, { badge: string; banner: string }> = {
  outstanding:        { badge: "bg-green-100 text-green-700 border-green-300",  banner: "border-green-300 bg-green-50" },
  good:               { badge: "bg-blue-100 text-blue-700 border-blue-300",     banner: "border-blue-300 bg-blue-50" },
  adequate:           { badge: "bg-amber-100 text-amber-700 border-amber-300",  banner: "border-amber-300 bg-amber-50" },
  inadequate:         { badge: "bg-red-100 text-red-700 border-red-300",        banner: "border-red-300 bg-red-50" },
  insufficient_data:  { badge: "bg-slate-100 text-slate-500 border-slate-200",  banner: "border-slate-200 bg-slate-50" },
};

const URGENCY_STYLES: Record<string, string> = {
  immediate: "border-red-300 bg-red-50 text-red-700",
  soon:      "border-amber-300 bg-amber-50 text-amber-700",
  planned:   "border-slate-200 bg-slate-50 text-slate-600",
};

const INSIGHT_BORDER: Record<string, string> = {
  critical: "border-red-400 bg-red-50 text-red-800",
  warning:  "border-amber-300 bg-amber-50 text-amber-800",
  positive: "border-green-300 bg-green-50 text-green-800",
};

function RateBar({ label, rate, alertBelow }: { label: string; rate: number | null; alertBelow?: number }) {
  if (rate === null) {
    return (
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-slate-600">{label}</span>
          <span className="font-semibold text-slate-500">—</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100" />
      </div>
    );
  }
  const alert = alertBelow !== undefined && rate < alertBelow;
  const barColor = rate >= 90 ? "bg-green-400" : rate >= 70 ? "bg-blue-400" : rate >= 50 ? "bg-amber-400" : "bg-red-400";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-slate-600">{label}</span>
        <span className={`font-semibold ${alert ? "text-red-600" : rate >= 80 ? "text-green-600" : "text-amber-600"}`}>
          {rate}%
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${rate}%` }} />
      </div>
    </div>
  );
}

export default function StaffInductionIntelligencePage() {
  const { data, isLoading, isError } = useHomeStaffInductionOnboardingIntelligence();

  if (isLoading) {
    return <div className="flex items-center justify-center p-12 text-slate-500">Loading staff induction intelligence…</div>;
  }
  if (isError || !data?.data) {
    return <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">Could not load staff induction intelligence.</div>;
  }

  const d: StaffInductionOnboardingResult = data.data;
  const styles = RATING_STYLES[d.induction_rating];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Staff Induction & Onboarding Intelligence</h1>
        <p className="text-sm text-slate-500 mt-1">
          Induction completion, safeguarding coverage, shadowing, handbook acknowledgement, and lone-working readiness.
        </p>
      </div>

      {/* Rating banner */}
      <div className={`rounded-lg border px-5 py-4 flex items-center gap-4 ${styles.banner}`}>
        <div>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">Induction rating</p>
          <span className={`rounded border px-2 py-1 text-sm font-semibold capitalize ${styles.badge}`}>
            {d.induction_rating.replace(/_/g, " ")}
          </span>
        </div>
        <div className="h-8 w-px bg-slate-200" />
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-700">{d.headline}</p>
          <p className="text-xs text-slate-500 mt-0.5">Score: {d.induction_score}/100 · {d.total_inductions} induction record{d.total_inductions !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Mandatory safeguarding alert */}
      {(d.safeguarding_coverage_rate ?? 0) < 100 && d.total_inductions > 0 && (
        <div className="rounded-lg border border-red-400 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
          {100 - (d.safeguarding_coverage_rate ?? 0)}% of induction records do not confirm safeguarding coverage — every member of staff must complete safeguarding training before working directly with children.
        </div>
      )}

      {/* Compliance rates */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
        <h2 className="text-sm font-semibold text-slate-700">Induction Compliance Rates</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-3">
            <RateBar label="Overall completion" rate={d.completion_rate} alertBelow={100} />
            <RateBar label="Agency induction completion" rate={d.agency_induction_completion_rate} alertBelow={100} />
            <RateBar label="Safeguarding covered" rate={d.safeguarding_coverage_rate} alertBelow={100} />
            <RateBar label="Medication covered" rate={d.medication_coverage_rate} alertBelow={100} />
          </div>
          <div className="space-y-3">
            <RateBar label="Fire safety covered" rate={d.fire_safety_coverage_rate} alertBelow={100} />
            <RateBar label="Handbook acknowledged" rate={d.handbook_acknowledgement_rate} alertBelow={100} />
            <RateBar label="Shadowing completed" rate={d.shadowing_completion_rate} alertBelow={80} />
            <RateBar label="Lone working readiness" rate={d.lone_working_readiness_rate} alertBelow={80} />
          </div>
        </div>
      </div>

      {/* Module + shadowing stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[
          { label: "Avg module completion", value: `${d.average_module_completion}%`, alert: d.average_module_completion < 80 },
          { label: "Shadowing competency rate", value: `${formatRate(d.shadowing_competency_rate)}`, alert: (d.shadowing_competency_rate ?? 0) < 80 },
          { label: "Total inductions", value: d.total_inductions },
        ].map((m) => (
          <div key={m.label} className={`rounded-lg border p-4 ${m.alert ? "border-amber-300 bg-amber-50" : "border-slate-200 bg-white"}`}>
            <p className="text-xs text-slate-500">{m.label}</p>
            <p className={`text-2xl font-bold ${m.alert ? "text-amber-700" : "text-slate-800"}`}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* Strengths + concerns */}
      {(d.strengths.length > 0 || d.concerns.length > 0) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {d.strengths.length > 0 && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 space-y-2">
              <h2 className="text-sm font-semibold text-green-700">Strengths</h2>
              <ul className="space-y-1">
                {d.strengths.map((s, i) => (
                  <li key={i} className="text-sm text-green-800 flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-green-500" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {d.concerns.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-2">
              <h2 className="text-sm font-semibold text-amber-700">Concerns</h2>
              <ul className="space-y-1">
                {d.concerns.map((c, i) => (
                  <li key={i} className="text-sm text-amber-800 flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Recommendations */}
      {d.recommendations.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-slate-700">Recommendations</h2>
          {d.recommendations.map((r: InductionRecommendation) => (
            <div key={r.rank} className={`rounded-lg border px-4 py-3 space-y-1 ${URGENCY_STYLES[r.urgency] ?? "border-slate-200 bg-slate-50"}`}>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide">{r.urgency}</span>
                <span className="text-xs text-slate-400">·</span>
                <span className="text-xs text-slate-500">{r.regulatory_ref}</span>
              </div>
              <p className="text-sm">{r.recommendation}</p>
            </div>
          ))}
        </div>
      )}

      {/* Insights */}
      {d.insights.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-slate-700">Cara Insights</h2>
          {d.insights.map((i: InductionInsight, idx: number) => (
            <div key={idx} className={`rounded-lg border px-3 py-2 text-sm ${INSIGHT_BORDER[i.severity] ?? "border-slate-200 bg-slate-50 text-slate-700"}`}>
              {i.text}
            </div>
          ))}
        </div>
      )}

      {/* Regulatory */}
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
        <span className="font-semibold text-slate-600">Regulatory note: </span>
        CHR 2015 Reg 32 and Schedule 2 require all staff to complete a structured induction before
        working unsupervised with children. Safeguarding training is mandatory before any direct work
        with children. Agency workers must receive a home-specific induction every visit. Ofsted SCCIF
        inspects induction records as a baseline for the &apos;How well is the home led and managed?&apos;
        quality standard and will examine whether safeguarding, medication, and behaviour management
        are covered.
      </div>
    </div>
  );
}

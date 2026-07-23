"use client";

import { useRestraintIntelligence } from "@/hooks/use-restraint-intelligence";
import { below, formatRate, meets } from "@/lib/metrics/rate";
import type {
  ChildRestraintProfile,
  ReasonBreakdown,
  TypeBreakdown,
  TimePattern,
  RestraintAlert,
  CaraRestraintInsight,
} from "@/lib/engines/restraint-intelligence-engine";

const TREND_STYLES: Record<string, string> = {
  increasing:         "text-red-600",
  stable:             "text-amber-600",
  decreasing:         "text-green-600",
  insufficient_data:  "text-slate-400",
};

const ALERT_BORDER: Record<string, string> = {
  critical: "border-red-400 bg-red-50",
  high:     "border-orange-400 bg-orange-50",
  medium:   "border-amber-300 bg-amber-50",
  low:      "border-slate-200 bg-slate-50",
};

const INSIGHT_BORDER: Record<string, string> = {
  critical: "border-red-400 bg-red-50 text-red-800",
  warning:  "border-amber-300 bg-amber-50 text-amber-800",
  positive: "border-green-300 bg-green-50 text-green-800",
};

function RateBar({ label, rate, alertBelow }: { label: string; rate: number | null; alertBelow?: number }) {
  const alert = alertBelow !== undefined && below(rate, alertBelow);
  const good = meets(rate, 90);
  const barColor = good ? "bg-green-400" : meets(rate, 70) ? "bg-amber-400" : "bg-red-400";
  const measured = typeof rate === "number";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-slate-600">{label}</span>
        <span
          className={`font-semibold ${
            !measured ? "text-slate-400" : alert ? "text-red-600" : good ? "text-green-600" : "text-amber-600"
          }`}
        >
          {measured ? formatRate(rate) : "Not recorded"}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        {measured && (
          <div className={`h-full rounded-full ${barColor}`} style={{ width: `${rate}%` }} />
        )}
      </div>
    </div>
  );
}

function ChildCard({ p }: { p: ChildRestraintProfile }) {
  const trendCls = TREND_STYLES[p.frequency_trend] ?? "text-slate-500";
  const hasInjuries = p.injuries_count > 0;
  return (
    <div className={`rounded-lg border bg-white p-4 space-y-2 ${p.total_incidents_30d >= 3 ? "border-red-300" : p.total_incidents_30d >= 1 ? "border-amber-300" : "border-slate-200"}`}>
      <div className="flex items-start justify-between">
        <p className="text-sm font-semibold text-slate-800">{p.child_name}</p>
        <span className={`text-xs font-medium capitalize ${trendCls}`}>
          {p.frequency_trend.replace("_", " ")}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded bg-slate-50 p-1.5">
          <p className="text-xs text-slate-500">30d</p>
          <p className={`text-lg font-bold ${p.total_incidents_30d >= 3 ? "text-red-600" : p.total_incidents_30d >= 1 ? "text-amber-600" : "text-slate-800"}`}>
            {p.total_incidents_30d}
          </p>
        </div>
        <div className="rounded bg-slate-50 p-1.5">
          <p className="text-xs text-slate-500">90d</p>
          <p className="text-lg font-bold text-slate-700">{p.total_incidents_90d}</p>
        </div>
        <div className={`rounded p-1.5 ${hasInjuries ? "bg-red-50" : "bg-slate-50"}`}>
          <p className="text-xs text-slate-500">Injuries</p>
          <p className={`text-lg font-bold ${hasInjuries ? "text-red-600" : "text-slate-700"}`}>
            {p.injuries_count}
          </p>
        </div>
      </div>
      <div className="flex gap-3 text-xs text-slate-500">
        {p.primary_reason && (
          <span>Reason: <span className="text-slate-700 font-medium">{p.primary_reason.replace(/_/g, " ")}</span></span>
        )}
        {p.avg_duration > 0 && (
          <span>Avg: {p.avg_duration}min</span>
        )}
      </div>
      <div className="space-y-1">
        <RateBar label="Debriefed" rate={p.debriefed_rate} alertBelow={100} />
      </div>
    </div>
  );
}

function BreakdownBar({ label, count, pct, color }: { label: string; count: number; pct: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <p className="w-40 shrink-0 truncate text-xs text-slate-700 capitalize">{label.replace(/_/g, " ")}</p>
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-16 shrink-0 text-right text-xs text-slate-500">{count} ({pct}%)</span>
    </div>
  );
}

export default function RestraintIntelligencePage() {
  const { data, isLoading, isError } = useRestraintIntelligence();

  if (isLoading) {
    return <div className="flex items-center justify-center p-12 text-slate-500">Loading physical intervention intelligence…</div>;
  }
  if (isError || !data?.data) {
    return <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">Could not load restraint intelligence.</div>;
  }

  const d = data.data;
  const ov = d.overview;

  const highFrequency = ov.total_incidents_30d >= 5;
  const injuryConcern = ov.incidents_with_injury > 0;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Physical Intervention Intelligence</h1>
        <p className="text-sm text-slate-500 mt-1">
          Restraint frequency, de-escalation, debrief compliance, and reduction trajectory.
        </p>
      </div>

      {/* High frequency warning */}
      {highFrequency && (
        <div className="rounded-lg border border-red-400 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
          {ov.total_incidents_30d} physical interventions in the last 30 days — review positive behaviour support plans and de-escalation strategies urgently.
        </div>
      )}

      {/* Injury concern */}
      {injuryConcern && (
        <div className="rounded-lg border border-orange-400 bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-800">
          {ov.incidents_with_injury} incident{ov.incidents_with_injury !== 1 ? "s" : ""} resulted in injury — medical checks and body maps must be documented and reviewed.
        </div>
      )}

      {/* Overview counts */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Incidents (30d)", value: ov.total_incidents_30d, alert: highFrequency },
          { label: "Incidents (90d)", value: ov.total_incidents_90d },
          { label: "Children involved (30d)", value: ov.children_involved_30d, alert: ov.children_involved_30d > 1 },
          { label: "Avg duration", value: ov.avg_duration_minutes > 0 ? `${ov.avg_duration_minutes}min` : "—" },
        ].map((m) => (
          <div key={m.label} className={`rounded-lg border p-4 ${m.alert ? "border-red-300 bg-red-50" : "border-slate-200 bg-white"}`}>
            <p className="text-xs text-slate-500">{m.label}</p>
            <p className={`text-2xl font-bold ${m.alert ? "text-red-700" : "text-slate-800"}`}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* Compliance rates */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
        <h2 className="text-sm font-semibold text-slate-700">Compliance Rates</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-3">
            <RateBar label="Child debriefed" rate={ov.child_debrief_rate} alertBelow={100} />
            <RateBar label="Staff debriefed" rate={ov.staff_debrief_rate} alertBelow={100} />
            <RateBar label="Review completed" rate={ov.review_completion_rate} alertBelow={100} />
          </div>
          <div className="space-y-3">
            <RateBar label="Body map completed" rate={ov.body_map_rate} alertBelow={100} />
            <RateBar label="De-escalation documented" rate={ov.de_escalation_documented_rate} alertBelow={80} />
            <RateBar label="Team Teach compliance" rate={ov.team_teach_compliance_rate} alertBelow={80} />
          </div>
        </div>
      </div>

      {/* Reason breakdown */}
      {d.reason_breakdown.some((r) => r.count > 0) && (
        <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
          <h2 className="text-sm font-semibold text-slate-700">Reason Breakdown</h2>
          <div className="space-y-2">
            {d.reason_breakdown.filter((r) => r.count > 0).map((r: ReasonBreakdown) => (
              <BreakdownBar key={r.reason} label={r.reason} count={r.count} pct={r.percentage} color="bg-amber-400" />
            ))}
          </div>
        </div>
      )}

      {/* Type breakdown */}
      {d.type_breakdown.some((t) => t.count > 0) && (
        <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
          <h2 className="text-sm font-semibold text-slate-700">Technique Breakdown</h2>
          <div className="space-y-2">
            {d.type_breakdown.filter((t) => t.count > 0).map((t: TypeBreakdown) => (
              <BreakdownBar key={t.type} label={t.type} count={t.count} pct={t.percentage} color="bg-blue-400" />
            ))}
          </div>
        </div>
      )}

      {/* Time patterns */}
      {d.time_patterns.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
          <h2 className="text-sm font-semibold text-slate-700">Time Patterns</h2>
          <div className="flex flex-wrap gap-2">
            {d.time_patterns.map((t: TimePattern) => (
              <div key={t.period} className="rounded border border-slate-200 bg-slate-50 px-3 py-2 text-center">
                <p className="text-xs text-slate-500">{t.period}</p>
                <p className="text-lg font-bold text-slate-800">{t.count}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alerts */}
      {d.alerts.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-slate-700">Alerts</h2>
          {d.alerts.map((a: RestraintAlert, i: number) => (
            <div key={i} className={`rounded-lg border px-3 py-2 text-sm ${ALERT_BORDER[a.severity] ?? "border-slate-200 bg-slate-50"}`}>
              <span className="font-medium capitalize">{a.severity}:</span> {a.message}
            </div>
          ))}
        </div>
      )}

      {/* Per-child profiles */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-700">Per-Child Profiles</h2>
        {d.child_profiles.length === 0 ? (
          <p className="text-sm text-slate-500">No physical intervention records found.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {d.child_profiles.map((p) => <ChildCard key={p.child_id} p={p} />)}
          </div>
        )}
      </div>

      {/* Insights */}
      {d.insights.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-slate-700">Cara Insights</h2>
          {d.insights.map((i: CaraRestraintInsight, idx: number) => (
            <div key={idx} className={`rounded-lg border px-3 py-2 text-sm ${INSIGHT_BORDER[i.severity] ?? "border-slate-200 bg-slate-50 text-slate-700"}`}>
              {i.text}
            </div>
          ))}
        </div>
      )}

      {/* Regulatory */}
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
        <span className="font-semibold text-slate-600">Regulatory note: </span>
        Physical intervention must be used as a last resort under CHR 2015 Reg 20 (positive behaviour
        management) and Reg 37 (use of restraint). Every incident must trigger a Reg 40 notification
        to Ofsted, the placing authority, and the child&apos;s IRO. Body maps, debrief records, and review
        sign-off are mandatory. ILACS directly inspects whether restraint is reducing over time and
        whether children are involved in post-incident discussions.
      </div>
    </div>
  );
}

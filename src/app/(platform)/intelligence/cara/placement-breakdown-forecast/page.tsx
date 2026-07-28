"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type {
  ChildPlacementForecast,
  ForecastAlert,
  CaraForecastInsight,
  ContributingFactor,
  RecommendedAction,
  RiskBand,
  RiskTrend,
  PlacementBreakdownForecastResult,
} from "@/lib/placement-breakdown-forecast/placement-breakdown-forecast-engine";

interface PlacementBreakdownForecastResponse {
  data: PlacementBreakdownForecastResult;
}

function usePlacementBreakdownForecast() {
  return useQuery({
    queryKey: ["placement-breakdown-forecast"],
    queryFn: () =>
      api.get<PlacementBreakdownForecastResponse>("/placement-breakdown-forecast"),
    refetchInterval: 60_000, // 60 second refresh
  });
}

const RISK_BAND_STYLES: Record<RiskBand, { badge: string; card: string; score: string }> = {
  critical: { badge: "bg-red-100 text-red-700 border-red-300",      card: "border-red-300",    score: "text-red-700"    },
  elevated: { badge: "bg-orange-100 text-orange-700 border-orange-300", card: "border-orange-300", score: "text-orange-700" },
  watch:    { badge: "bg-amber-100 text-amber-700 border-amber-300",  card: "border-amber-300",  score: "text-amber-700"  },
  stable:   { badge: "bg-green-100 text-green-700 border-green-300",  card: "border-slate-200",  score: "text-green-700"  },
};

const TREND_STYLES: Record<RiskTrend, string> = {
  escalating: "text-red-600",
  stable:     "text-amber-600",
  improving:  "text-green-600",
};

const TREND_ICONS: Record<RiskTrend, string> = {
  escalating: "↑",
  stable:     "→",
  improving:  "↓",
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

const PRIORITY_STYLES: Record<string, string> = {
  urgent:  "border-red-300 bg-red-50 text-red-700",
  high:    "border-orange-300 bg-orange-50 text-orange-700",
  routine: "border-slate-200 bg-slate-50 text-slate-600",
};

function ScoreDial({ score, band }: { score: number; band: RiskBand }) {
  const circ = 2 * Math.PI * 20;
  const fill = circ * (score / 100);
  const strokeColor = band === "critical" ? "#ef4444" : band === "elevated" ? "#f97316" : band === "watch" ? "#f59e0b" : "#22c55e";
  return (
    <svg viewBox="0 0 48 48" className="h-12 w-12 shrink-0 -rotate-90">
      <circle cx="24" cy="24" r="20" fill="none" stroke="#f1f5f9" strokeWidth="5" />
      <circle
        cx="24" cy="24" r="20" fill="none"
        stroke={strokeColor} strokeWidth="5"
        strokeDasharray={`${fill} ${circ}`}
        strokeLinecap="round"
      />
    </svg>
  );
}

function ChildForecastCard({ f }: { f: ChildPlacementForecast }) {
  const styles = RISK_BAND_STYLES[f.risk_band];
  const trendCls = TREND_STYLES[f.trend];
  const trendIcon = TREND_ICONS[f.trend];
  return (
    <div className={`rounded-lg border bg-white p-4 space-y-3 ${styles.card}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <ScoreDial score={f.risk_score} band={f.risk_band} />
            <span className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${styles.score}`}>
              {f.risk_score}
            </span>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">{f.child_name}</p>
            <p className="text-xs text-slate-500">Age {f.age} · {f.days_in_placement}d in placement</p>
          </div>
        </div>
        <div className="text-right space-y-1">
          <span className={`inline-block rounded border px-1.5 py-0.5 text-xs font-medium capitalize ${styles.badge}`}>
            {f.risk_band}
          </span>
          <p className={`text-xs font-medium ${trendCls}`}>
            {trendIcon} {f.trend}
          </p>
        </div>
      </div>

      {/* Projected horizon */}
      {f.projected_days_to_critical !== null && f.risk_band !== "stable" && (
        <div className={`rounded border px-3 py-2 text-xs ${f.risk_band === "critical" ? "border-red-300 bg-red-50 text-red-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>
          {f.risk_band === "critical"
            ? "At critical threshold now — immediate action required"
            : `Projected critical in ~${f.projected_days_to_critical}d${f.projected_date ? ` (${f.projected_date})` : ""}`}
        </div>
      )}

      {/* Contributing factors */}
      {f.contributing_factors.length > 0 && (
        <div className="space-y-1 border-t border-slate-100 pt-2">
          <p className="text-xs font-medium text-slate-500">Contributing factors</p>
          {f.contributing_factors.slice(0, 3).map((cf: ContributingFactor, i: number) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              {cf.rising && <span className="mt-0.5 shrink-0 text-red-500">↑</span>}
              {!cf.rising && <span className="mt-0.5 shrink-0 text-slate-400">—</span>}
              <span className="text-slate-700">{cf.detail}</span>
            </div>
          ))}
        </div>
      )}

      {/* Protective factors */}
      {f.protective_factors.length > 0 && (
        <div className="space-y-1 border-t border-slate-100 pt-2">
          <p className="text-xs font-medium text-green-600">Protective factors</p>
          {f.protective_factors.slice(0, 2).map((pf, i) => (
            <p key={i} className="text-xs text-green-700">✓ {pf}</p>
          ))}
        </div>
      )}

      {/* Recommended actions */}
      {f.recommended_actions.length > 0 && (
        <div className="space-y-1 border-t border-slate-100 pt-2">
          {f.recommended_actions.slice(0, 2).map((ra: RecommendedAction, i: number) => (
            <div key={i} className={`rounded border px-2 py-1.5 text-xs ${PRIORITY_STYLES[ra.priority] ?? "border-slate-200 bg-slate-50 text-slate-600"}`}>
              <span className="font-medium capitalize">{ra.priority}:</span> {ra.action}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PlacementBreakdownForecastPage() {
  const { data, isLoading, isError } = usePlacementBreakdownForecast();

  if (isLoading) {
    return <div className="flex items-center justify-center p-12 text-slate-500">Loading placement breakdown forecast…</div>;
  }
  if (isError || !data?.data) {
    return <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">Could not load placement breakdown forecast.</div>;
  }

  const d = data.data;
  const ov = d.overview;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Placement Breakdown Forecast</h1>
        <p className="text-sm text-slate-500 mt-1">
          Forward-looking breakdown risk per child — synthesised from incidents, missing episodes, restraints, behaviour, education, and key-work engagement.
        </p>
      </div>

      {/* Critical alert */}
      {ov.critical_count > 0 && (
        <div className="rounded-lg border border-red-400 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
          {ov.critical_count} child{ov.critical_count !== 1 ? "ren are" : " is"} at critical breakdown risk — immediate placement support intervention required.
          {ov.earliest_projected_child && ` Most urgent: ${ov.earliest_projected_child}.`}
        </div>
      )}

      {/* Overview */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Critical", value: ov.critical_count,  alert: ov.critical_count > 0,   bg: "border-red-300 bg-red-50",    text: "text-red-700"    },
          { label: "Elevated", value: ov.elevated_count,  alert: ov.elevated_count > 0,   bg: "border-orange-300 bg-orange-50", text: "text-orange-700" },
          { label: "Watch",    value: ov.watch_count,     alert: ov.watch_count > 0,      bg: "border-amber-300 bg-amber-50",  text: "text-amber-700"  },
          { label: "Stable",   value: ov.stable_count,    alert: false,                   bg: "border-green-200 bg-green-50",  text: "text-green-700"  },
        ].map((m) => (
          <div key={m.label} className={`rounded-lg border p-4 ${m.alert ? m.bg : "border-slate-200 bg-white"}`}>
            <p className="text-xs text-slate-500">{m.label}</p>
            <p className={`text-2xl font-bold ${m.alert ? m.text : "text-slate-800"}`}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* Trend overview */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[
          { label: "Escalating", value: ov.escalating_count, alert: ov.escalating_count > 0, cls: "text-red-600" },
          { label: "Improving",  value: ov.improving_count,  alert: false,                   cls: "text-green-600" },
          { label: "Avg risk score", value: `${ov.avg_risk_score}/100`, alert: ov.avg_risk_score > 50, cls: "text-slate-800" },
        ].map((m) => (
          <div key={m.label} className={`rounded-lg border p-4 ${m.alert ? "border-amber-300 bg-amber-50" : "border-slate-200 bg-white"}`}>
            <p className="text-xs text-slate-500">{m.label}</p>
            <p className={`text-2xl font-bold ${m.alert ? "text-amber-700" : m.cls}`}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* Alerts */}
      {d.alerts.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-slate-700">Alerts</h2>
          {d.alerts.map((a: ForecastAlert, i: number) => (
            <div key={i} className={`rounded-lg border px-3 py-2 text-sm ${ALERT_BORDER[a.severity] ?? "border-slate-200 bg-slate-50"}`}>
              <span className="font-medium capitalize">{a.severity}:</span> {a.message}
            </div>
          ))}
        </div>
      )}

      {/* Per-child forecast cards */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-700">Per-Child Forecast</h2>
        {d.child_forecasts.length === 0 ? (
          <p className="text-sm text-slate-500">No active placements to forecast.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[...d.child_forecasts]
              .sort((a, b) => b.risk_score - a.risk_score)
              .map((f: ChildPlacementForecast) => <ChildForecastCard key={f.child_id} f={f} />)}
          </div>
        )}
      </div>

      {/* Insights */}
      {d.insights.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-slate-700">Cara Insights</h2>
          {d.insights.map((i: CaraForecastInsight, idx: number) => (
            <div key={idx} className={`rounded-lg border px-3 py-2 text-sm ${INSIGHT_BORDER[i.severity] ?? "border-slate-200 bg-slate-50 text-slate-700"}`}>
              {i.text}
            </div>
          ))}
        </div>
      )}

      {/* Regulatory */}
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
        <span className="font-semibold text-slate-600">Regulatory note: </span>
        CHR 2015 Reg 11 requires active management of placement stability. Placement breakdown is a
        primary inspection concern under SCCIF &apos;Overall experiences and progress of children.&apos;
        This forecast is a deterministic early-warning tool — Cara identifies convergent risk signals
        to support timely managerial intervention. It does not replace clinical or social work
        judgement, and the manager should consider notification and escalation in line with Reg 40
        where breakdown risk is critical.
      </div>
    </div>
  );
}

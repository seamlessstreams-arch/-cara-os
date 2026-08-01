"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type {
  RecentEpisode,
  CaraInsight,
  PushPullFactor,
  MissingIntelligenceResult,
} from "@/lib/engines/missing-from-care-engine";

interface MissingIntelligenceResponse {
  data: MissingIntelligenceResult;
}

function useMissingIntelligence() {
  return useQuery({
    queryKey: ["missing-intelligence"],
    queryFn: () => api.get<MissingIntelligenceResponse>("/missing-intelligence"),
    refetchInterval: 30_000,
  });
}

const RISK_STYLES: Record<string, string> = {
  critical: "bg-red-100 text-red-700 border-red-300",
  high:     "bg-orange-100 text-orange-700 border-orange-300",
  medium:   "bg-amber-100 text-amber-700 border-amber-300",
  low:      "bg-green-100 text-green-700 border-green-300",
};

const RHI_STYLES: Record<string, string> = {
  completed: "text-green-600",
  pending:   "text-amber-600",
  refused:   "text-red-600",
  "n/a":     "text-slate-400",
};

const INSIGHT_BORDER: Record<string, string> = {
  critical: "border-red-400 bg-red-50 text-red-800",
  warning:  "border-amber-300 bg-amber-50 text-amber-800",
  positive: "border-green-300 bg-green-50 text-green-800",
};

function EpisodeRow({ e }: { e: RecentEpisode }) {
  const riskCls = RISK_STYLES[e.risk_level] ?? "bg-slate-100 text-slate-600 border-slate-200";
  const rhiCls  = RHI_STYLES[e.return_interview] ?? "text-slate-500";
  return (
    <tr className="border-b border-slate-100 last:border-0">
      <td className="py-2.5 pr-3 text-sm font-medium text-slate-800">{e.child_name}</td>
      <td className="py-2.5 pr-3">
        <span className={`rounded border px-1.5 py-0.5 text-xs font-medium ${riskCls}`}>
          {e.risk_level}
        </span>
      </td>
      <td className="py-2.5 pr-3 text-xs text-slate-500">{e.date}</td>
      <td className="py-2.5 pr-3 text-xs text-slate-500">{e.duration}</td>
      <td className={`py-2.5 pr-3 text-xs font-medium capitalize ${rhiCls}`}>
        {e.return_interview}
      </td>
      <td className="py-2.5 text-xs text-slate-500">
        {e.contextual_safeguarding && (
          <span className="rounded bg-purple-100 border border-purple-300 px-1.5 py-0.5 text-xs text-purple-700">
            Contextual
          </span>
        )}
      </td>
    </tr>
  );
}

function FactorList({ factors, label, color }: { factors: PushPullFactor[]; label: string; color: string }) {
  if (factors.length === 0) return null;
  return (
    <div className="space-y-1">
      <p className={`text-xs font-semibold uppercase tracking-wide ${color}`}>{label}</p>
      {factors.slice(0, 4).map((f, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-32 truncate text-xs text-slate-700">{f.factor}</span>
          <div className="h-2 flex-1 rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full ${color.includes("red") ? "bg-red-400" : color.includes("blue") ? "bg-blue-400" : "bg-amber-400"}`}
              style={{ width: `${Math.min(100, f.count * 25)}%` }}
            />
          </div>
          <span className="w-4 shrink-0 text-right text-xs text-slate-500">{f.count}</span>
        </div>
      ))}
    </div>
  );
}

export default function MissingIntelligencePage() {
  const { data, isLoading, isError } = useMissingIntelligence();

  if (isLoading) {
    return <div className="flex items-center justify-center p-12 text-slate-500">Loading missing from care intelligence…</div>;
  }
  if (isError || !data?.data) {
    return <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">Could not load missing from care intelligence.</div>;
  }

  const d = data.data;
  const p = d.profile;

  const rhiAlert = (p.return_interview_completion_rate ?? 0) < 100;
  const activeAlert = p.active_episodes > 0;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Missing from Care Intelligence</h1>
        <p className="text-sm text-slate-500 mt-1">
          Episode patterns, return home interview compliance, and contextual safeguarding risk.
        </p>
      </div>

      {/* Active episodes banner */}
      {activeAlert && (
        <div className="rounded-lg border border-red-400 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
          {p.active_episodes} child{p.active_episodes !== 1 ? "ren are" : " is"} currently missing — immediate action required.
        </div>
      )}

      {/* Overview */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Episodes (all time)", value: p.total_episodes },
          { label: "Active episodes", value: p.active_episodes, alert: p.active_episodes > 0 },
          {
            label: "RHI completion",
            value: `${p.return_interview_completion_rate}%`,
            alert: rhiAlert,
          },
          {
            label: "Police notified",
            value: `${p.police_notification_rate}%`,
            alert: (p.police_notification_rate ?? 0) < 100,
          },
        ].map((m) => (
          <div
            key={m.label}
            className={`rounded-lg border p-4 ${m.alert ? "border-red-300 bg-red-50" : "border-slate-200 bg-white"}`}
          >
            <p className="text-xs text-slate-500">{m.label}</p>
            <p className={`text-2xl font-bold ${m.alert ? "text-red-700" : "text-slate-800"}`}>
              {m.value}
            </p>
          </div>
        ))}
      </div>

      {/* Secondary metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Children with episodes", value: p.children_with_episodes },
          { label: "Repeat missing (3+)", value: p.repeat_missing_children.length, alert: p.repeat_missing_children.length > 0 },
          { label: "Contextual safeguarding flags", value: p.contextual_safeguarding_flagged, alert: p.contextual_safeguarding_flagged > 0 },
          { label: "Avg duration", value: (p.avg_duration_minutes ?? 0) > 0 ? `${Math.round((p.avg_duration_minutes ?? 0) / 60)}h` : "—" },
        ].map((m) => (
          <div
            key={m.label}
            className={`rounded-lg border p-4 ${m.alert ? "border-amber-300 bg-amber-50" : "border-slate-200 bg-white"}`}
          >
            <p className="text-xs text-slate-500">{m.label}</p>
            <p className={`text-2xl font-bold ${m.alert ? "text-amber-700" : "text-slate-800"}`}>
              {m.value}
            </p>
          </div>
        ))}
      </div>

      {/* Push/pull analysis */}
      {(d.push_pull.push.length > 0 || d.push_pull.pull.length > 0 || d.push_pull.risk.length > 0) && (
        <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-4">
          <h2 className="text-sm font-semibold text-slate-700">Push / Pull Factor Analysis</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <FactorList factors={d.push_pull.push} label="Push factors" color="text-red-600" />
            <FactorList factors={d.push_pull.pull} label="Pull factors" color="text-blue-600" />
            <FactorList factors={d.push_pull.risk} label="Risk factors" color="text-amber-600" />
          </div>
        </div>
      )}

      {/* Recent episodes */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-slate-700">Recent Episodes</h2>
        {d.recent_episodes.length === 0 ? (
          <p className="text-sm text-slate-500">No recent episodes.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="min-w-full">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  {["Child", "Risk", "Date", "Duration", "RHI", "Flags"].map((h) => (
                    <th key={h} className="py-2.5 pr-3 text-left text-xs font-semibold text-slate-500 first:pl-4">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 pl-4">
                {d.recent_episodes.map((e) => (
                  <tr key={e.id} className="pl-4">
                    <td className="py-2.5 pl-4 pr-3 text-sm font-medium text-slate-800">{e.child_name}</td>
                    <td className="py-2.5 pr-3">
                      <span className={`rounded border px-1.5 py-0.5 text-xs font-medium ${RISK_STYLES[e.risk_level] ?? "bg-slate-100 text-slate-600 border-slate-200"}`}>
                        {e.risk_level}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3 text-xs text-slate-500">{e.date}</td>
                    <td className="py-2.5 pr-3 text-xs text-slate-500">{e.duration}</td>
                    <td className={`py-2.5 pr-3 text-xs font-medium capitalize ${RHI_STYLES[e.return_interview] ?? "text-slate-500"}`}>
                      RHI: {e.return_interview}
                    </td>
                    <td className="py-2.5 pr-3 text-xs">
                      {e.contextual_safeguarding && (
                        <span className="rounded bg-purple-100 border border-purple-300 px-1.5 py-0.5 text-xs text-purple-700">CS</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Insights */}
      {d.insights.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-slate-700">Cara Insights</h2>
          {d.insights.map((i: CaraInsight, idx: number) => (
            <div key={idx} className={`rounded-lg border px-3 py-2 text-sm ${INSIGHT_BORDER[i.severity] ?? "border-slate-200 bg-slate-50 text-slate-700"}`}>
              {i.text}
            </div>
          ))}
        </div>
      )}

      {/* Regulatory */}
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
        <span className="font-semibold text-slate-600">Regulatory note: </span>
        Return Home Interviews (RHI) are required for every missing episode under statutory guidance
        (&apos;Statutory guidance on children who run away and go missing from home or care&apos;, 2014).
        CHR 2015 Reg 40 requires immediate notification to Ofsted and the placing authority. Contextual
        safeguarding risks including exploitation must be assessed and escalated. ILACS inspects
        management of missing episodes as a safeguarding indicator.
      </div>
    </div>
  );
}

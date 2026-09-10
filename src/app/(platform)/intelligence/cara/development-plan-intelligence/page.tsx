"use client";

import { formatRate } from "@/lib/metrics/rate";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type {
  DevelopmentPlanIntelligenceData,
  DevPlanStaffProfile,
  DevPlanAction,
} from "@/app/api/v1/development-plan-intelligence/route";

/* ── development-plan intelligence hook (inlined from use-development-plan-intelligence) ── */

interface DevPlanIntelligenceResponse {
  data: DevelopmentPlanIntelligenceData;
}

function useDevelopmentPlanIntelligence() {
  return useQuery({
    queryKey: ["development-plan-intelligence"],
    queryFn: () =>
      api.get<DevPlanIntelligenceResponse>("/development-plan-intelligence"),
    staleTime: 120_000,
  });
}

const SIGNAL_DOT: Record<string, string> = {
  green: "bg-green-500",
  amber: "bg-amber-400",
  red:   "bg-red-500",
  grey:  "bg-slate-300",
};

function ActionRow({ a }: { a: DevPlanAction }) {
  return (
    <li className="flex items-start gap-2 text-xs">
      <span
        className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${a.completed ? "bg-green-500" : a.overdue ? "bg-red-500" : "bg-slate-300"}`}
      />
      <span className={a.completed ? "line-through text-slate-400" : a.overdue ? "text-red-600" : "text-slate-700"}>
        {a.title}
        {a.domain && <span className="ml-1 text-slate-400">({a.domain})</span>}
        {a.targetDate && !a.completed && (
          <span className={`ml-1 ${a.overdue ? "text-red-500 font-medium" : "text-slate-400"}`}>
            · {new Date(a.targetDate).toLocaleDateString("en-GB")}
            {a.overdue && " (overdue)"}
          </span>
        )}
      </span>
    </li>
  );
}

function StaffPlanCard({ p }: { p: DevPlanStaffProfile }) {
  const dot = SIGNAL_DOT[p.signal] ?? "bg-slate-300";
  const pct = p.completionRate ?? 0;
  const barColor = pct >= 80 ? "bg-green-400" : pct >= 50 ? "bg-amber-400" : "bg-red-400";

  return (
    <div className={`rounded-lg border bg-white p-4 space-y-3 ${p.signal === "red" ? "border-red-300" : p.signal === "amber" ? "border-amber-300" : "border-slate-200"}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${dot}`} />
          <div>
            <p className="text-sm font-semibold text-slate-800">{p.staffName}</p>
            <p className="text-xs text-slate-500 mt-0.5">{p.fromStage} → {p.toStage}</p>
          </div>
        </div>
        <div className="text-right">
          {p.status === "draft" && (
            <span className="rounded border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-xs text-amber-700">
              Draft
            </span>
          )}
          {p.caraGenerated && (
            <span className="ml-1 rounded border border-violet-200 bg-violet-50 px-1.5 py-0.5 text-xs text-violet-700">
              Cara
            </span>
          )}
        </div>
      </div>

      <p className="text-xs font-medium text-slate-600">{p.planTitle}</p>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-slate-500">
          <span>{p.completedActions}/{p.totalActions} actions complete</span>
          <span className={pct >= 80 ? "text-green-600" : pct >= 50 ? "text-amber-600" : "text-red-600"}>
            {p.completionRate !== null ? `${formatRate(p.completionRate)}` : "—"}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
        </div>
      </div>

      {p.overdueActions > 0 && (
        <p className="text-xs font-medium text-red-600">
          {p.overdueActions} action{p.overdueActions === 1 ? "" : "s"} past target date
        </p>
      )}

      {/* Actions list */}
      {p.recentActions.length > 0 && (
        <ul className="space-y-1.5 border-t border-slate-100 pt-2">
          {p.recentActions.map((a, i) => <ActionRow key={i} a={a} />)}
        </ul>
      )}
    </div>
  );
}

export default function DevelopmentPlanIntelligencePage() {
  const { data, isLoading, isError } = useDevelopmentPlanIntelligence();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500">
        Loading development plan intelligence…
      </div>
    );
  }
  if (isError || !data?.data) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">
        Could not load development plan intelligence.
      </div>
    );
  }

  const d = data.data;

  const overallSignalBorder =
    d.overallSignal === "red"   ? "border-red-400 bg-red-50"   :
    d.overallSignal === "amber" ? "border-amber-400 bg-amber-50" :
    d.overallSignal === "green" ? "border-green-400 bg-green-50" :
    "border-slate-200 bg-slate-50";

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Development Plan Intelligence</h1>
        <p className="text-sm text-slate-500 mt-1">
          Staff development plans, progression pathway actions, and career stage momentum.
        </p>
      </div>

      {/* Overall signal banner */}
      {d.overallSignal !== "grey" && (
        <div className={`rounded-lg border px-4 py-3 text-sm font-medium ${overallSignalBorder}`}>
          {d.overallSignal === "red" && "One or more development plans have overdue actions — review in the next supervision session."}
          {d.overallSignal === "amber" && "Some development plans need attention — check progress and next target dates."}
          {d.overallSignal === "green" && "All active development plans are on track."}
        </div>
      )}

      {/* Overview metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Active plans", value: d.activePlans },
          { label: "Staff with plan", value: d.staffWithPlan, sub: `${d.staffWithoutPlan} without`, alert: d.staffWithoutPlan > 0 },
          { label: "Actions total", value: d.totalActions, sub: `${d.completedActions} completed` },
          {
            label: "Overdue actions",
            value: d.overdueActions,
            alert: d.overdueActions > 0,
          },
        ].map((m) => (
          <div
            key={m.label}
            className={`rounded-lg border p-4 ${m.alert ? "border-amber-300 bg-amber-50" : "border-slate-200 bg-white"}`}
          >
            <p className="text-xs text-slate-500">{m.label}</p>
            <p className={`text-2xl font-bold ${m.alert ? "text-amber-700" : "text-slate-800"}`}>
              {m.value}
            </p>
            {m.sub && <p className="text-xs text-slate-500">{m.sub}</p>}
          </div>
        ))}
      </div>

      {/* Overall action progress bar */}
      {d.totalActions > 0 && d.overallCompletionRate !== null && (
        <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium text-slate-700">Overall action completion</span>
            <span className={`font-semibold ${d.overallCompletionRate >= 80 ? "text-green-600" : d.overallCompletionRate >= 50 ? "text-amber-600" : "text-red-600"}`}>
              {formatRate(d.overallCompletionRate)}
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full ${d.overallCompletionRate >= 80 ? "bg-green-400" : d.overallCompletionRate >= 50 ? "bg-amber-400" : "bg-red-400"}`}
              style={{ width: `${formatRate(d.overallCompletionRate)}` }}
            />
          </div>
        </div>
      )}

      {/* Staff plan cards */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-700">Active Development Plans</h2>
        {d.staffProfiles.length === 0 ? (
          <p className="text-sm text-slate-500">No active development plans found.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {d.staffProfiles.map((p) => <StaffPlanCard key={p.staffId} p={p} />)}
          </div>
        )}
      </div>

      {/* Insights */}
      {d.insights.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-slate-700">Cara Insights</h2>
          {d.insights.map((i, idx) => (
            <div key={idx} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              {i}
            </div>
          ))}
        </div>
      )}

      {/* Regulatory */}
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
        <span className="font-semibold text-slate-600">Regulatory note: </span>
        {d.regulatoryNote}
      </div>
    </div>
  );
}

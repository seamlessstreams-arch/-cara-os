"use client";

import { useAdmissionReferralIntelligence } from "@/hooks/use-admission-referral-intelligence";
import { below, formatRate, meets } from "@/lib/metrics/rate";
import type {
  ReferralProfile,
  SourceAnalysis,
  AdmissionAlert,
  CaraAdmissionInsight,
  ReferralStatus,
} from "@/lib/engines/admission-referral-intelligence-engine";

const STATUS_STYLES: Record<ReferralStatus, string> = {
  new:                "bg-blue-100 text-blue-700 border-blue-300",
  under_assessment:   "bg-sky-100 text-sky-700 border-sky-300",
  impact_assessment:  "bg-violet-100 text-violet-700 border-violet-300",
  panel:              "bg-amber-100 text-amber-700 border-amber-300",
  accepted:           "bg-green-100 text-green-700 border-green-300",
  placed:             "bg-teal-100 text-teal-700 border-teal-300",
  declined:           "bg-slate-100 text-slate-500 border-slate-200",
  withdrawn:          "bg-slate-100 text-slate-500 border-slate-200",
};

const URGENCY_DOT: Record<string, string> = {
  critical: "bg-red-500",
  high:     "bg-orange-400",
  standard: "bg-slate-300",
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

function ReferralCard({ r }: { r: ReferralProfile }) {
  const urgencyDot = URGENCY_DOT[r.urgency] ?? "bg-slate-300";
  const statusCls = STATUS_STYLES[r.status] ?? "bg-slate-100 text-slate-600 border-slate-200";
  return (
    <div className={`rounded-lg border bg-white p-4 space-y-2 ${r.urgency === "critical" ? "border-red-300" : r.urgency === "high" ? "border-orange-300" : "border-slate-200"}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${urgencyDot}`} />
          <div>
            <p className="text-sm font-semibold text-slate-800">{r.child_name}</p>
            <p className="text-xs text-slate-500">Age {r.age} · {r.gender} · {r.local_authority}</p>
          </div>
        </div>
        <span className={`rounded border px-1.5 py-0.5 text-xs font-medium ${statusCls}`}>
          {r.status.replace(/_/g, " ")}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded bg-slate-50 p-1.5">
          <p className="text-xs text-slate-500">Days open</p>
          <p className={`text-sm font-bold ${r.days_open > 20 ? "text-amber-600" : "text-slate-800"}`}>{r.days_open}</p>
        </div>
        <div className="rounded bg-slate-50 p-1.5">
          <p className="text-xs text-slate-500">Presenting needs</p>
          <p className="text-sm font-bold text-slate-800">{r.presenting_needs_count}</p>
        </div>
        <div className="rounded bg-slate-50 p-1.5">
          <p className="text-xs text-slate-500">Risk factors</p>
          <p className={`text-sm font-bold ${r.risk_factors_count > 2 ? "text-red-600" : "text-slate-800"}`}>{r.risk_factors_count}</p>
        </div>
      </div>

      {!r.has_impact_assessment && r.status !== "new" && (
        <p className="text-xs font-medium text-amber-600">Impact assessment not completed</p>
      )}
    </div>
  );
}

function SourceBar({ s }: { s: SourceAnalysis }) {
  const total = s.accepted + s.declined + (s.count - s.accepted - s.declined);
  const acceptPct = total > 0 ? Math.round((s.accepted / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <p className="w-36 shrink-0 truncate text-xs text-slate-700 capitalize">{s.source.replace(/_/g, " ")}</p>
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-teal-400" style={{ width: `${acceptPct}%` }} />
      </div>
      <span className="w-28 shrink-0 text-right text-xs text-slate-500">
        {s.accepted}/{s.count} accepted{s.avg_days_to_decision !== null ? ` · ${s.avg_days_to_decision}d avg` : ""}
      </span>
    </div>
  );
}

export default function AdmissionReferralIntelligencePage() {
  const { data, isLoading, isError } = useAdmissionReferralIntelligence();

  if (isLoading) {
    return <div className="flex items-center justify-center p-12 text-slate-500">Loading admission intelligence…</div>;
  }
  if (isError || !data?.data) {
    return <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">Could not load admission intelligence.</div>;
  }

  const d = data.data;
  const ov = d.overview;
  const da = d.decision_analysis;
  const missingIA = da.decisions_without_impact_assessment > 0;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Admission & Referral Intelligence</h1>
        <p className="text-sm text-slate-500 mt-1">
          Referral pipeline, impact assessment compliance, occupancy management, and admission decisions.
        </p>
      </div>

      {/* Missing IA warning */}
      {missingIA && (
        <div className="rounded-lg border border-amber-400 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          {da.decisions_without_impact_assessment} admission decision{da.decisions_without_impact_assessment !== 1 ? "s were" : " was"} made without a completed impact assessment — required under CHR 2015 Reg 12.
        </div>
      )}

      {/* Occupancy banner */}
      <div className={`rounded-lg border px-5 py-4 flex items-center gap-6 ${ov.available_beds === 0 ? "border-amber-300 bg-amber-50" : "border-slate-200 bg-white"}`}>
        <div>
          <p className="text-xs text-slate-500">Occupancy</p>
          <p className={`text-3xl font-bold ${meets(ov.occupancy_rate, 100) ? "text-amber-700" : "text-slate-800"}`}>{formatRate(ov.occupancy_rate)}</p>
        </div>
        <div className="h-10 w-px bg-slate-200" />
        <div>
          <p className="text-xs text-slate-500">Available beds</p>
          <p className="text-3xl font-bold text-slate-800">{ov.available_beds}</p>
        </div>
        <div className="h-10 w-px bg-slate-200" />
        <div>
          <p className="text-xs text-slate-500">Active referrals</p>
          <p className="text-3xl font-bold text-slate-800">{ov.active_referrals}</p>
        </div>
        <div className="flex-1">
          <div className="h-4 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full ${meets(ov.occupancy_rate, 100) ? "bg-amber-400" : meets(ov.occupancy_rate, 80) ? "bg-teal-400" : "bg-slate-300"}`}
              style={{ width: `${Math.min(100, ov.occupancy_rate ?? 0)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Pipeline overview */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "New", value: ov.new_count },
          { label: "Under assessment", value: ov.under_assessment_count },
          { label: "Panel", value: ov.panel_count },
          { label: "Impact assessment", value: ov.impact_assessment_count, alert: below(ov.impact_assessment_completion_rate, 100) },
        ].map((m) => (
          <div key={m.label} className={`rounded-lg border p-4 ${m.alert ? "border-amber-300 bg-amber-50" : "border-slate-200 bg-white"}`}>
            <p className="text-xs text-slate-500">{m.label}</p>
            <p className={`text-2xl font-bold ${m.alert ? "text-amber-700" : "text-slate-800"}`}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* Decision analysis */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
        <h2 className="text-sm font-semibold text-slate-700">Decision Analysis</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Acceptance rate", value: formatRate(da.acceptance_rate), green: meets(da.acceptance_rate, 51) },
            { label: "Decline rate", value: formatRate(da.decline_rate) },
            { label: "Withdrawal rate", value: formatRate(da.withdrawal_rate) },
            { label: "Avg days to decision", value: da.avg_days_to_decision === null ? "—" : `${da.avg_days_to_decision}d`, alert: da.avg_days_to_decision !== null && da.avg_days_to_decision > 14 },
          ].map((m) => (
            <div key={m.label} className={`rounded border p-3 text-center ${m.alert ? "border-amber-300 bg-amber-50" : m.green ? "border-green-200 bg-green-50" : "border-slate-100 bg-slate-50"}`}>
              <p className="text-xs text-slate-500">{m.label}</p>
              <p className={`text-lg font-bold ${m.alert ? "text-amber-700" : m.green ? "text-green-700" : "text-slate-800"}`}>{m.value}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-500">Impact assessment completion: <span className={`font-semibold ${ov.impact_assessment_completion_rate === null ? "text-slate-500" : below(ov.impact_assessment_completion_rate, 100) ? "text-amber-600" : "text-green-600"}`}>{formatRate(ov.impact_assessment_completion_rate)}</span></p>
      </div>

      {/* Source analysis */}
      {d.source_analysis.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
          <h2 className="text-sm font-semibold text-slate-700">Referral Source Analysis</h2>
          <div className="space-y-2">
            {d.source_analysis.map((s: SourceAnalysis) => <SourceBar key={s.source} s={s} />)}
          </div>
        </div>
      )}

      {/* Alerts */}
      {d.alerts.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-slate-700">Alerts</h2>
          {d.alerts.map((a: AdmissionAlert, i: number) => (
            <div key={i} className={`rounded-lg border px-3 py-2 text-sm ${ALERT_BORDER[a.severity] ?? "border-slate-200 bg-slate-50"}`}>
              <span className="font-medium capitalize">{a.severity}:</span> {a.message}
            </div>
          ))}
        </div>
      )}

      {/* Active referral profiles */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-700">Active Referrals</h2>
        {d.referral_profiles.filter((r) => !["declined", "withdrawn"].includes(r.status)).length === 0 ? (
          <p className="text-sm text-slate-500">No active referrals in the pipeline.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {d.referral_profiles
              .filter((r) => !["declined", "withdrawn"].includes(r.status))
              .map((r: ReferralProfile) => <ReferralCard key={r.id} r={r} />)}
          </div>
        )}
      </div>

      {/* Insights */}
      {d.insights.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-slate-700">Cara Insights</h2>
          {d.insights.map((i: CaraAdmissionInsight, idx: number) => (
            <div key={idx} className={`rounded-lg border px-3 py-2 text-sm ${INSIGHT_BORDER[i.severity] ?? "border-slate-200 bg-slate-50 text-slate-700"}`}>
              {i.text}
            </div>
          ))}
        </div>
      )}

      {/* Regulatory */}
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
        <span className="font-semibold text-slate-600">Regulatory note: </span>
        CHR 2015 Reg 11 requires a thorough matching assessment before admitting a child. Reg 12
        mandates an impact assessment to ensure the proposed admission does not adversely affect
        existing residents. All placements must be agreed by the registered manager and documented
        before admission. Ofsted SCCIF inspects the admissions process as part of safe caring and
        placement matching evidence.
      </div>
    </div>
  );
}

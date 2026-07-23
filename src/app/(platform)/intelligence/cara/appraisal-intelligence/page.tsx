"use client";

import { useAppraisalIntelligence } from "@/hooks/use-appraisal-intelligence";
import type {
  StaffAppraisalProfile,
  AppraisalAlert,
  CaraAppraisalInsight,
  CompetencyAnalysis,
  RatingBreakdown,
} from "@/lib/engines/appraisal-intelligence-engine";
import { below, formatRate } from "@/lib/metrics/rate";

const RATING_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  outstanding:         { text: "text-green-700",  bg: "bg-green-100",  border: "border-green-300" },
  good:                { text: "text-blue-700",   bg: "bg-blue-100",   border: "border-blue-300"  },
  requires_improvement:{ text: "text-amber-700",  bg: "bg-amber-100",  border: "border-amber-300" },
  inadequate:          { text: "text-red-700",    bg: "bg-red-100",    border: "border-red-300"   },
};

const ALERT_BORDER: Record<string, string> = {
  critical: "border-red-400 bg-red-50",
  high:     "border-orange-400 bg-orange-50",
  medium:   "border-amber-300 bg-amber-50",
  low:      "border-slate-200 bg-slate-50",
};

const INSIGHT_BORDER: Record<string, string> = {
  critical: "border-red-400 bg-red-50",
  warning:  "border-amber-300 bg-amber-50",
  positive: "border-green-300 bg-green-50",
};

function RatingBar({ rb }: { rb: RatingBreakdown }) {
  const colors = RATING_COLORS[rb.rating] ?? { text: "text-slate-700", bg: "bg-slate-100", border: "border-slate-200" };
  return (
    <div className="flex items-center gap-3">
      <div className={`w-32 shrink-0 rounded border px-2 py-1 text-xs font-medium ${colors.text} ${colors.bg} ${colors.border}`}>
        {rb.rating.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
      </div>
      <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${colors.bg.replace("100", "500")}`}
          style={{ width: `${rb.percentage}%` }}
        />
      </div>
      <span className="w-10 shrink-0 text-right text-xs text-slate-600">
        {rb.count} ({rb.percentage}%)
      </span>
    </div>
  );
}

function CompetencyRow({ c }: { c: CompetencyAnalysis }) {
  const scoreColor = c.avg_score >= 4 ? "text-green-600" : c.avg_score >= 3 ? "text-blue-600" : c.avg_score > 0 ? "text-amber-600" : "text-slate-400";
  const barWidth = c.avg_score > 0 ? `${(c.avg_score / 5) * 100}%` : "0%";
  const barColor = c.avg_score >= 4 ? "bg-green-400" : c.avg_score >= 3 ? "bg-blue-400" : "bg-amber-400";
  return (
    <div className="flex items-center gap-3">
      <p className="w-44 shrink-0 truncate text-xs text-slate-700">{c.domain_label}</p>
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: barWidth }} />
      </div>
      <span className={`w-12 shrink-0 text-right text-xs font-semibold ${scoreColor}`}>
        {c.avg_score > 0 ? `${c.avg_score.toFixed(1)}/5` : "—"}
      </span>
    </div>
  );
}

function StaffCard({ p }: { p: StaffAppraisalProfile }) {
  const overdue = p.next_review_in_days < 0;
  const dueSoon = !overdue && p.next_review_in_days <= 30;
  const rColors = p.latest_rating ? RATING_COLORS[p.latest_rating] : null;
  return (
    <div className={`rounded-lg border p-4 bg-white space-y-2 ${overdue ? "border-red-300" : dueSoon ? "border-amber-300" : "border-slate-200"}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-800">{p.staff_name}</p>
          {p.latest_rating && rColors && (
            <span className={`inline-block rounded border px-1.5 py-0.5 text-xs font-medium mt-0.5 ${rColors.text} ${rColors.bg} ${rColors.border}`}>
              {p.latest_rating.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
            </span>
          )}
        </div>
        {p.next_review_in_days !== null && (
          <span className={`text-xs font-medium ${overdue ? "text-red-600" : dueSoon ? "text-amber-600" : "text-slate-500"}`}>
            {overdue
              ? `${Math.abs(p.next_review_in_days)}d overdue`
              : p.next_review_in_days === 0
              ? "Due today"
              : `Due in ${p.next_review_in_days}d`}
          </span>
        )}
      </div>

      {p.risk_flags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {p.risk_flags.slice(0, 3).map((f, i) => (
            <span key={i} className="rounded bg-red-50 px-1.5 py-0.5 text-xs text-red-600 border border-red-200">
              {f}
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-3 text-xs text-slate-500">
        {p.latest_appraisal_date && (
          <span>Last: {new Date(p.latest_appraisal_date).toLocaleDateString("en-GB")}</span>
        )}
        <span>{p.appraisal_count} appraisal{p.appraisal_count !== 1 ? "s" : ""}</span>
        {!p.is_signed && p.latest_appraisal_id && (
          <span className="text-amber-600">Unsigned</span>
        )}
      </div>
    </div>
  );
}

export default function AppraisalIntelligencePage() {
  const { data, isLoading, isError } = useAppraisalIntelligence();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500">
        Loading appraisal intelligence…
      </div>
    );
  }
  if (isError || !data?.data) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">
        Could not load appraisal intelligence.
      </div>
    );
  }

  const d = data.data;
  const ov = d.overview;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Appraisal Intelligence</h1>
        <p className="text-sm text-slate-500 mt-1">
          Staff appraisal status, competency analysis, and performance development.
        </p>
      </div>

      {/* Overview */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Appraisals total", value: ov.total_appraisals },
          { label: "Completed", value: ov.completed, sub: `${ov.overdue_count} overdue`, alert: ov.overdue_count > 0 },
          { label: "Completion rate", value: formatRate(ov.completion_rate), alert: below(ov.completion_rate, 80) },
          { label: "Avg competency", value: ov.avg_competency_score !== null ? `${ov.avg_competency_score.toFixed(1)}/5` : "—", alert: below(ov.avg_competency_score, 3) },
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

      {/* Rating breakdown */}
      {d.rating_breakdown.some((r) => r.count > 0) && (
        <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
          <h2 className="text-sm font-semibold text-slate-700">Rating Breakdown</h2>
          <div className="space-y-2">
            {d.rating_breakdown.map((rb) => <RatingBar key={rb.rating} rb={rb} />)}
          </div>
        </div>
      )}

      {/* Competency analysis */}
      {d.competency_analysis.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
          <h2 className="text-sm font-semibold text-slate-700">Competency Analysis</h2>
          <div className="space-y-2">
            {d.competency_analysis.map((c) => <CompetencyRow key={c.domain} c={c} />)}
          </div>
        </div>
      )}

      {/* Alerts */}
      {d.alerts.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-slate-700">Alerts</h2>
          {d.alerts.map((a, i) => (
            <div key={i} className={`rounded-lg border px-3 py-2 text-sm ${ALERT_BORDER[a.severity] ?? "border-slate-200 bg-slate-50"}`}>
              <span className="font-medium capitalize">{a.severity}:</span> {a.message}
            </div>
          ))}
        </div>
      )}

      {/* Staff profiles */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-700">Staff Profiles</h2>
        {d.staff_profiles.length === 0 ? (
          <p className="text-sm text-slate-500">No appraisal records found.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {d.staff_profiles.map((p) => <StaffCard key={p.staff_id} p={p} />)}
          </div>
        )}
      </div>

      {/* Insights */}
      {d.insights.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-slate-700">Cara Insights</h2>
          {d.insights.map((i, idx) => (
            <div key={idx} className={`rounded-lg border px-3 py-2 text-sm ${INSIGHT_BORDER[i.severity] ?? "border-slate-200 bg-slate-50"}`}>
              {i.text}
            </div>
          ))}
        </div>
      )}

      {/* Regulatory */}
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
        <span className="font-semibold text-slate-600">Regulatory note: </span>
        Children&apos;s Homes Regulations 2015 Reg 32 requires regular assessment of staff competence.
        Annual appraisals and probation reviews should be documented, signed by both parties, and linked
        to development plans. Ofsted SCCIF 2025 inspects staff competency evidence as part of effective leadership.
      </div>
    </div>
  );
}

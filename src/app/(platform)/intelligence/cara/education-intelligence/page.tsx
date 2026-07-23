"use client";

import Link from "next/link";
import { useEducationIntelligence } from "@/hooks/use-education-intelligence";
import { below, formatRate, meets } from "@/lib/metrics/rate";
import type {
  ChildEducationProfile,
  EducationAlert,
  CaraEducationInsight,
} from "@/lib/engines/education-intelligence-engine";

type Signal = "green" | "amber" | "red" | "grey";

const SIGNAL_STYLES: Record<Signal, { bg: string; border: string; dot: string }> = {
  green: { bg: "bg-green-50",  border: "border-green-200",  dot: "bg-green-400"  },
  amber: { bg: "bg-amber-50",  border: "border-amber-200",  dot: "bg-amber-400"  },
  red:   { bg: "bg-red-50",    border: "border-red-200",    dot: "bg-red-400"    },
  grey:  { bg: "bg-slate-50",  border: "border-slate-200",  dot: "bg-slate-300"  },
};

const ALERT_COLOURS: Record<string, string> = {
  critical: "bg-red-50 border-red-200 text-red-800",
  high:     "bg-orange-50 border-orange-200 text-orange-800",
  medium:   "bg-amber-50 border-amber-200 text-amber-800",
  low:      "bg-blue-50 border-blue-200 text-blue-800",
};

const INSIGHT_COLOURS: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  warning:  "border-amber-200 bg-amber-50 text-amber-800",
  positive: "border-green-200 bg-green-50 text-green-800",
};

function childSignal(p: ChildEducationProfile): Signal {
  if (p.exclusion_count_90d > 0 || below(p.attendance_pct, 80) || p.concerns_open > 0) return "red";
  if (below(p.attendance_pct, 90)) return "amber";
  if (p.pep_current === false && p.latest_pep_date !== null) return "amber";
  // No attendance recorded is a gap in the evidence, not a green light
  if (p.attendance_pct === null) return "grey";
  return "green";
}

function ChildEduCard({ profile }: { profile: ChildEducationProfile }) {
  const sig = childSignal(profile);
  const style = SIGNAL_STYLES[sig];
  return (
    <div className={`rounded-xl border p-4 flex flex-col gap-3 ${style.bg} ${style.border}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${style.dot}`} />
          <span className="font-semibold text-slate-900 text-sm">{profile.child_name}</span>
        </div>
        <span className={`text-xs font-bold rounded-full px-2 py-0.5 ${
          profile.attendance_pct === null ? "bg-slate-100 text-slate-500" :
          meets(profile.attendance_pct, 90) ? "bg-green-100 text-green-700" :
          meets(profile.attendance_pct, 80) ? "bg-amber-100 text-amber-700" :
          "bg-red-100 text-red-700"
        }`}>
          {profile.attendance_pct === null ? "No attendance recorded" : `${formatRate(profile.attendance_pct)} attendance`}
        </span>
      </div>

      {profile.school && (
        <p className="text-xs text-slate-500">{profile.school}</p>
      )}

      <div className="flex gap-2 flex-wrap">
        {profile.exclusion_count_90d > 0 && (
          <span className="text-xs bg-red-100 text-red-700 rounded-full px-2 py-0.5 font-semibold">
            {profile.exclusion_count_90d} exclusion{profile.exclusion_count_90d === 1 ? "" : "s"} (90d)
          </span>
        )}
        {profile.achievements_90d > 0 && (
          <span className="text-xs bg-green-100 text-green-700 rounded-full px-2 py-0.5">
            {profile.achievements_90d} achievement{profile.achievements_90d === 1 ? "" : "s"}
          </span>
        )}
        {profile.concerns_open > 0 && (
          <span className="text-xs bg-amber-100 text-amber-700 rounded-full px-2 py-0.5">
            {profile.concerns_open} open concern{profile.concerns_open === 1 ? "" : "s"}
          </span>
        )}
        {profile.has_sen && (
          <span className="text-xs bg-purple-100 text-purple-700 rounded-full px-2 py-0.5">SEN</span>
        )}
        {profile.pep_current && (
          <span className="text-xs bg-blue-100 text-blue-700 rounded-full px-2 py-0.5">PEP current</span>
        )}
      </div>
    </div>
  );
}

function AlertRow({ alert }: { alert: EducationAlert }) {
  return (
    <div className={`rounded-xl border p-3 text-sm ${ALERT_COLOURS[alert.severity] ?? "bg-slate-50 border-slate-200 text-slate-700"}`}>
      <span className="font-semibold mr-2">{alert.child_name}:</span>
      {alert.message}
    </div>
  );
}

function InsightRow({ insight }: { insight: CaraEducationInsight }) {
  return (
    <div className={`rounded-xl border p-4 text-sm leading-relaxed ${INSIGHT_COLOURS[insight.severity] ?? "border-slate-200 bg-white text-slate-700"}`}>
      <span className="font-semibold mr-2">Cara:</span>
      {insight.text}
    </div>
  );
}

export default function EducationIntelligencePage() {
  const { data: response, isLoading, error } = useEducationIntelligence();

  if (isLoading) return <div className="p-8 text-slate-500 text-sm">Reviewing education records…</div>;
  if (error || !response) return <div className="p-8 text-red-600 text-sm">Unable to load education intelligence data.</div>;

  const { data } = response;
  const ov = data.overview;
  const att = data.attendance;
  const act = data.activities;

  const overallSig: Signal =
    data.alerts.some((a) => a.severity === "critical") ? "red" :
    data.alerts.some((a) => a.severity === "high") ? "amber" :
    "green";

  const overallStyle = SIGNAL_STYLES[overallSig];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <nav className="flex items-center gap-2 text-xs text-slate-400">
        <Link href="/intelligence" className="hover:text-slate-600">Intelligence</Link>
        <span>/</span>
        <span className="text-slate-600">Education Intelligence</span>
      </nav>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Education Intelligence</h1>
        <p className="text-sm text-slate-600 mt-1">
          Education status, attendance rates, exclusions, PEP compliance, achievements, and enrichment activity — all children.
        </p>
      </div>

      {/* Overview */}
      <div className={`rounded-2xl border-2 p-5 ${overallStyle.bg} ${overallStyle.border}`}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className={`text-2xl font-bold ${
              att.overall_pct === null ? "text-slate-400" :
              meets(att.overall_pct, 90) ? "text-green-700" :
              meets(att.overall_pct, 80) ? "text-amber-700" : "text-red-700"
            }`}>
              {formatRate(att.overall_pct)}
            </p>
            <p className="text-xs text-slate-500">
              {att.overall_pct === null ? "Overall attendance — none recorded" : "Overall attendance"}
            </p>
          </div>
          <div>
            <p className={`text-2xl font-bold ${ov.exclusion_events_90d > 0 ? "text-red-700" : "text-slate-700"}`}>
              {ov.exclusion_events_90d}
            </p>
            <p className="text-xs text-slate-500">Exclusions (90d)</p>
          </div>
          <div>
            <p className={`text-2xl font-bold ${ov.pep_overdue_count > 0 ? "text-amber-700" : "text-slate-700"}`}>
              {ov.pep_current_count}
            </p>
            <p className="text-xs text-slate-500">PEPs current</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-700">
              {act.total_activities_30d}
            </p>
            <p className="text-xs text-slate-500">Activities (30d)</p>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {data.alerts.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Education alerts</h2>
          <div className="flex flex-col gap-2">
            {data.alerts.map((alert, i) => <AlertRow key={i} alert={alert} />)}
          </div>
        </section>
      )}

      {/* Cara insights */}
      {data.insights.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Cara insights</h2>
          <div className="flex flex-col gap-2">
            {data.insights.map((ins, i) => <InsightRow key={i} insight={ins} />)}
          </div>
        </section>
      )}

      {/* Attendance breakdown */}
      {att.sessions_total > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Attendance breakdown</h2>
          <div className="rounded-xl border border-slate-200 bg-white p-4 flex flex-wrap gap-3">
            {[
              { label: "Present",  count: att.sessions_present,  colour: "bg-green-100 text-green-700"  },
              { label: "Late",     count: att.sessions_late,      colour: "bg-amber-100 text-amber-700"  },
              { label: "Absent",   count: att.sessions_absent,    colour: "bg-red-100 text-red-700"      },
            ].filter((s) => s.count > 0).map((s) => (
              <div key={s.label} className={`rounded-xl px-4 py-2 text-center ${s.colour}`}>
                <p className="text-xl font-bold">{s.count}</p>
                <p className="text-xs">{s.label}</p>
              </div>
            ))}
            {att.below_90_count > 0 && (
              <div className="rounded-xl px-4 py-2 text-center bg-orange-100 text-orange-700">
                <p className="text-xl font-bold">{att.below_90_count}</p>
                <p className="text-xs">Below 90%</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Activity analysis */}
      {act.total_activities_30d > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Enrichment activities (30 days)</h2>
          <div className="rounded-xl border border-slate-200 bg-white p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-xl font-bold text-slate-800">{act.total_activities_30d}</p>
              <p className="text-xs text-slate-500">Total activities</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-blue-700">{act.new_experiences_30d}</p>
              <p className="text-xs text-slate-500">New experiences</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-slate-700">{act.avg_activities_per_child_30d}</p>
              <p className="text-xs text-slate-500">Avg per child</p>
            </div>
          </div>
        </section>
      )}

      {/* Per-child profiles */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Per-child education profiles</h2>
        {data.child_profiles.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
            No education records found.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.child_profiles.map((p) => (
              <ChildEduCard key={p.child_id} profile={p} />
            ))}
          </div>
        )}
      </section>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
        <p className="font-semibold mb-1">Regulatory reference</p>
        <p>Children in care must have a Personal Education Plan reviewed at each LAC review (Care Planning Regulations 2010). Exclusions must be notified to the designated teacher immediately (Children's Homes Regulations 2015, Reg 8 & 10; KCSIE 2024).</p>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
        Education intelligence is derived from recorded education entries only. Missing or incomplete records will affect accuracy. The Virtual School Head and IRO must be notified of any school placement concerns. Clinical or SEND decisions remain with qualified professionals.
      </div>
    </div>
  );
}

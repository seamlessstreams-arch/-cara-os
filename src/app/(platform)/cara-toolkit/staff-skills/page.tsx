"use client";

import Link from "next/link";
import { useCaraToolkitStaffSkills } from "@/hooks/use-cara-toolkit-staff-skills";
import { below, formatRate, meets } from "@/lib/metrics/rate";
import type { StaffSkillProfile, SignalColour } from "@/lib/cara-visual-toolkit/types";

const SIGNAL_STYLES: Record<SignalColour, { bg: string; border: string; text: string; dot: string }> = {
  green: { bg: "bg-green-50",  border: "border-green-200",  text: "text-green-800",  dot: "bg-green-400"  },
  amber: { bg: "bg-amber-50",  border: "border-amber-200",  text: "text-amber-800",  dot: "bg-amber-400"  },
  red:   { bg: "bg-red-50",    border: "border-red-200",    text: "text-red-800",    dot: "bg-red-400"    },
  grey:  { bg: "bg-slate-50",  border: "border-slate-200",  text: "text-slate-600",  dot: "bg-slate-300"  },
};

function ComplianceBar({ rate, height = "h-2" }: { rate: number | null; height?: string }) {
  const colour = meets(rate, 100) ? "bg-green-400" : meets(rate, 80) ? "bg-amber-400" : rate === null ? "bg-slate-200" : "bg-red-400";
  return (
    <div className={`flex-1 ${height} rounded-full bg-slate-100 overflow-hidden`}>
      <div
        className={`${height} rounded-full ${colour}`}
        style={{ width: `${rate ?? 0}%` }}
      />
    </div>
  );
}

function WellbeingDots({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={`w-2 h-2 rounded-full ${
            i < score
              ? score <= 2
                ? "bg-red-400"
                : score <= 3
                ? "bg-amber-400"
                : "bg-green-400"
              : "bg-slate-200"
          }`}
        />
      ))}
    </div>
  );
}

function StaffCard({ profile }: { profile: StaffSkillProfile }) {
  const style = SIGNAL_STYLES[profile.signal];
  return (
    <div className={`rounded-xl border p-4 flex flex-col gap-3 ${style.bg} ${style.border}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${style.dot}`} />
            <span className="font-semibold text-sm text-slate-900">{profile.staffName}</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 ml-4">{profile.role}</p>
        </div>
        <div className="text-right shrink-0">
          <p className={`text-xl font-bold ${meets(profile.complianceRate, 100) ? "text-green-700" : below(profile.complianceRate, 70) ? "text-red-700" : profile.complianceRate === null ? "text-slate-400" : "text-amber-700"}`}>
            {formatRate(profile.complianceRate)}
          </p>
          <p className="text-xs text-slate-400">
            {profile.complianceRate === null ? "no training recorded" : "training compliance"}
          </p>
        </div>
      </div>

      {/* Compliance bar */}
      <div className="flex items-center gap-2">
        <ComplianceBar rate={profile.complianceRate} />
        <span className="text-xs text-slate-500 shrink-0">
          {profile.mandatoryCompliant}/{profile.mandatoryTotal} mandatory
        </span>
      </div>

      {/* Overdue training */}
      {profile.overdueTraining.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-red-500 mb-1">Overdue training</p>
          <div className="flex flex-wrap gap-1.5">
            {profile.overdueTraining.map((t, i) => (
              <span key={i} className="rounded-full bg-red-100 text-red-700 px-2 py-0.5 text-xs">
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Supervision */}
      {(profile.supervisionScore !== null || profile.lastSupervision) && (
        <div className="flex items-center gap-4">
          {profile.supervisionScore !== null && (
            <div>
              <p className="text-xs text-slate-400 mb-1">Wellbeing</p>
              <WellbeingDots score={profile.supervisionScore} />
            </div>
          )}
          {profile.confidenceLevel && (
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Confidence</p>
              <p className="text-xs font-medium text-slate-700 capitalize">{profile.confidenceLevel}</p>
            </div>
          )}
          {profile.lastSupervision && (
            <div className="ml-auto">
              <p className="text-xs text-slate-400 mb-0.5">Last supervision</p>
              <p className="text-xs font-medium text-slate-700">{profile.lastSupervision}</p>
            </div>
          )}
        </div>
      )}

      {/* Development areas */}
      {profile.developmentAreas.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">Development areas</p>
          <div className="flex flex-wrap gap-1.5">
            {profile.developmentAreas.map((d, i) => (
              <span key={i} className="rounded-full bg-blue-50 border border-blue-200 text-blue-700 px-2 py-0.5 text-xs">
                {d}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function StaffSkillsPage() {
  const { data, isLoading, error } = useCaraToolkitStaffSkills();

  if (isLoading) return <div className="p-8 text-slate-500 text-sm">Loading staff skills and confidence data…</div>;
  if (error || !data) return <div className="p-8 text-red-600 text-sm">Unable to load staff skills data.</div>;

  const overall = SIGNAL_STYLES[data.overallSignal];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <nav className="flex items-center gap-2 text-xs text-slate-400">
        <Link href="/cara-toolkit" className="hover:text-slate-600">Cara Toolkit</Link>
        <span>/</span>
        <span className="text-slate-600">Staff Skills & Confidence</span>
      </nav>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Staff Skills & Confidence Tracker</h1>
        <p className="text-sm text-slate-600 mt-1">
          Training compliance, supervision wellbeing scores, confidence levels, and development priorities across the workforce.
        </p>
      </div>

      {/* Summary banner */}
      <div className={`rounded-2xl border-2 p-5 ${overall.bg} ${overall.border}`}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-2xl font-bold text-slate-800">{data.totalStaff}</p>
            <p className="text-xs text-slate-500">Active staff</p>
          </div>
          <div>
            <p className={`text-2xl font-bold ${meets(data.avgComplianceRate, 100) ? "text-green-700" : below(data.avgComplianceRate, 70) ? "text-red-700" : data.avgComplianceRate === null ? "text-slate-400" : "text-amber-700"}`}>
              {formatRate(data.avgComplianceRate)}
            </p>
            <p className="text-xs text-slate-500">Avg training compliance</p>
          </div>
          <div>
            <p className={`text-2xl font-bold ${data.overdueTrainingCount > 0 ? "text-red-700" : "text-slate-800"}`}>
              {data.overdueTrainingCount}
            </p>
            <p className="text-xs text-slate-500">Overdue training items</p>
          </div>
          <div>
            <p className={`text-2xl font-bold ${data.fullCompliance < data.totalStaff ? "text-amber-700" : "text-green-700"}`}>
              {data.fullCompliance}
            </p>
            <p className="text-xs text-slate-500">Fully compliant</p>
          </div>
        </div>
      </div>

      {/* Insights */}
      {data.insights.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Cara insights</h2>
          <div className="flex flex-col gap-3">
            {data.insights.map((insight, i) => (
              <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700 leading-relaxed">
                <span className="font-semibold text-slate-900 mr-2">Cara:</span>
                {insight}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Staff profiles — lowest compliance first */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
          Staff profiles ({data.totalStaff})
        </h2>
        {data.staffProfiles.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
            No active staff found.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {data.staffProfiles.map((p) => (
              <StaffCard key={p.staffId} profile={p} />
            ))}
          </div>
        )}
      </section>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
        <p className="font-semibold mb-1">Regulatory reference</p>
        <p>{data.regulatoryNote}</p>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
        Training compliance and wellbeing scores shown here are derived from existing records. Managers remain professionally accountable for ensuring all staff are appropriately trained, supervised, and supported.
      </div>
    </div>
  );
}

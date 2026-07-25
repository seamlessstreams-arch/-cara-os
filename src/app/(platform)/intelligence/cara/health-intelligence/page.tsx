"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

/* ── inline types ──────────────────────────────────────────────────── */
export type HealthChildProfile = {
  childId: string;
  childName: string;
  totalRecords: number;
  openConditions: number;
  allergies: string[];
  mentalHealthRecords: number;
  camhsInvolvement: boolean;
  overdueFollowUps: number;
  upcomingFollowUps: number;
  recentRecordDate: string | null;
  signal: "green" | "amber" | "red" | "grey";
};

export type HealthRecentRecord = {
  childName: string;
  type: string;
  date: string;
  title: string;
  professional: string;
  signal: "green" | "amber" | "red" | "grey";
};

export type HealthIntelligenceData = {
  totalRecords: number;
  openConditions: number;
  allergiesCount: number;
  mentalHealthRecords: number;
  camhsInvolvementCount: number;
  overdueFollowUps: number;
  upcomingFollowUps: number;
  recentRecords: HealthRecentRecord[];
  childProfiles: HealthChildProfile[];
  insights: string[];
  overallSignal: "green" | "amber" | "red" | "grey";
  regulatoryNote: string;
};

/* ── inline hook ───────────────────────────────────────────────────── */
async function fetchHealthIntelligence(): Promise<HealthIntelligenceData> {
  const res = await fetch("/api/v1/health-intelligence");
  if (!res.ok) throw new Error("Failed to fetch health intelligence data");
  const json = await res.json();
  return json.data as HealthIntelligenceData;
}

function useHealthIntelligence() {
  return useQuery({
    queryKey: ["health-intelligence"],
    queryFn: fetchHealthIntelligence,
    staleTime: 120_000,
  });
}

type Signal = "green" | "amber" | "red" | "grey";

const SIGNAL_STYLES: Record<Signal, { bg: string; border: string; dot: string }> = {
  green: { bg: "bg-green-50",  border: "border-green-200",  dot: "bg-green-400"  },
  amber: { bg: "bg-amber-50",  border: "border-amber-200",  dot: "bg-amber-400"  },
  red:   { bg: "bg-red-50",    border: "border-red-200",    dot: "bg-red-400"    },
  grey:  { bg: "bg-slate-50",  border: "border-slate-200",  dot: "bg-slate-300"  },
};

function ChildHealthCard({ profile }: { profile: HealthChildProfile }) {
  const style = SIGNAL_STYLES[profile.signal];
  return (
    <div className={`rounded-xl border p-4 flex flex-col gap-3 ${style.bg} ${style.border}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${style.dot}`} />
          <span className="font-semibold text-slate-900 text-sm">{profile.childName}</span>
        </div>
        <span className="text-xs text-slate-400">{profile.totalRecords} record{profile.totalRecords === 1 ? "" : "s"}</span>
      </div>

      <div className="flex gap-2 flex-wrap">
        {profile.allergies.length > 0 && (
          <span className="text-xs bg-amber-100 text-amber-700 rounded-full px-2 py-0.5 font-semibold">
            Allergy: {profile.allergies.join(", ")}
          </span>
        )}
        {profile.openConditions > 0 && (
          <span className="text-xs bg-slate-100 text-slate-600 rounded-full px-2 py-0.5">
            {profile.openConditions} active condition{profile.openConditions === 1 ? "" : "s"}
          </span>
        )}
        {profile.camhsInvolvement && (
          <span className="text-xs bg-purple-100 text-purple-700 rounded-full px-2 py-0.5">CAMHS</span>
        )}
        {profile.overdueFollowUps > 0 && (
          <span className="text-xs bg-red-100 text-red-700 rounded-full px-2 py-0.5 font-semibold">
            {profile.overdueFollowUps} overdue follow-up{profile.overdueFollowUps === 1 ? "" : "s"}
          </span>
        )}
        {profile.upcomingFollowUps > 0 && (
          <span className="text-xs bg-blue-100 text-blue-700 rounded-full px-2 py-0.5">
            {profile.upcomingFollowUps} follow-up due (14d)
          </span>
        )}
      </div>

      {profile.recentRecordDate && (
        <p className="text-xs text-slate-400">Last entry: {profile.recentRecordDate}</p>
      )}
    </div>
  );
}

function RecentRecordRow({ record }: { record: HealthRecentRecord }) {
  const style = SIGNAL_STYLES[record.signal];
  return (
    <div className={`rounded-xl border p-3 flex items-start gap-3 ${style.bg} ${style.border}`}>
      <span className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${style.dot}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900">{record.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-slate-500">{record.childName}</span>
          <span className="text-xs text-slate-300">·</span>
          <span className="text-xs text-slate-500">{record.type}</span>
          <span className="text-xs text-slate-300">·</span>
          <span className="text-xs text-slate-400">{record.date}</span>
        </div>
        {record.professional && (
          <p className="text-xs text-slate-400 mt-0.5">{record.professional}</p>
        )}
      </div>
    </div>
  );
}

export default function HealthIntelligencePage() {
  const { data, isLoading, error } = useHealthIntelligence();

  if (isLoading) return <div className="p-8 text-slate-500 text-sm">Reviewing health records…</div>;
  if (error || !data) return <div className="p-8 text-red-600 text-sm">Unable to load health intelligence data.</div>;

  const overall = SIGNAL_STYLES[data.overallSignal];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <nav className="flex items-center gap-2 text-xs text-slate-400">
        <Link href="/intelligence" className="hover:text-slate-600">Intelligence</Link>
        <span>/</span>
        <span className="text-slate-600">Health Intelligence</span>
      </nav>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Health Intelligence</h1>
        <p className="text-sm text-slate-600 mt-1">
          Health appointment currency, overdue follow-ups, documented conditions, allergies, CAMHS involvement, and per-child health signals.
        </p>
      </div>

      {/* Summary */}
      <div className={`rounded-2xl border-2 p-5 ${overall.bg} ${overall.border}`}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className={`text-2xl font-bold ${data.overdueFollowUps > 0 ? "text-red-700" : "text-slate-700"}`}>
              {data.overdueFollowUps}
            </p>
            <p className="text-xs text-slate-500">Overdue follow-ups</p>
          </div>
          <div>
            <p className={`text-2xl font-bold ${data.allergiesCount > 0 ? "text-amber-700" : "text-slate-700"}`}>
              {data.allergiesCount}
            </p>
            <p className="text-xs text-slate-500">Documented allergies</p>
          </div>
          <div>
            <p className={`text-2xl font-bold ${data.camhsInvolvementCount > 0 ? "text-purple-700" : "text-slate-700"}`}>
              {data.camhsInvolvementCount}
            </p>
            <p className="text-xs text-slate-500">CAMHS involvement</p>
          </div>
          <div>
            <p className={`text-2xl font-bold ${data.upcomingFollowUps > 0 ? "text-blue-700" : "text-slate-700"}`}>
              {data.upcomingFollowUps}
            </p>
            <p className="text-xs text-slate-500">Follow-ups due (14d)</p>
          </div>
        </div>
      </div>

      {/* Insights */}
      {data.insights.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Cara insights</h2>
          {data.insights.map((ins, i) => (
            <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700 leading-relaxed">
              <span className="font-semibold text-slate-900 mr-2">Cara:</span>
              {ins}
            </div>
          ))}
        </section>
      )}

      {/* Per-child profiles */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Per-child health summary</h2>
        {data.childProfiles.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
            No children found.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.childProfiles.map((p) => (
              <ChildHealthCard key={p.childId} profile={p} />
            ))}
          </div>
        )}
      </section>

      {/* Recent health records */}
      {data.recentRecords.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Recent health records</h2>
          <div className="flex flex-col gap-2">
            {data.recentRecords.map((r, i) => (
              <RecentRecordRow key={i} record={r} />
            ))}
          </div>
        </section>
      )}

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
        <p className="font-semibold mb-1">Regulatory reference</p>
        <p>{data.regulatoryNote}</p>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
        Health intelligence is derived from the health record log only. All clinical decisions must be made by qualified health professionals. The registered person must not make clinical judgements — their role is to facilitate timely access to health services and ensure health records are complete. Allergies must be communicated to all staff immediately.
      </div>
    </div>
  );
}

"use client";

import { formatRate } from "@/lib/metrics/rate";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { EmptyState } from "@/components/ui/empty-state";
type MedicationChildProfile = {
  childId: string;
  childName: string;
  activeMedications: number;
  totalDoses: number;
  givenDoses: number;
  lateDoses: number;
  refusedDoses: number;
  missedDoses: number;
  complianceRate: number | null;
  concerns: string[];
  recentConcernStatus: string | null;
  recentConcernDate: string | null;
  recentConcernNotes: string | null;
  signal: "green" | "amber" | "red" | "grey";
};

type MedicationSafetyData = {
  totalDoses: number;
  givenDoses: number;
  lateDoses: number;
  refusedDoses: number;
  missedDoses: number;
  withheldDoses: number;
  complianceRate: number;
  administeredWithoutWitness: number;
  childProfiles: MedicationChildProfile[];
  insights: string[];
  overallSignal: "green" | "amber" | "red" | "grey";
  regulatoryNote: string;
};

async function fetchMedicationSafety(): Promise<MedicationSafetyData> {
  const res = await fetch("/api/v1/medication-safety");
  if (!res.ok) throw new Error("Failed to fetch medication safety data");
  const json = await res.json();
  return json.data as MedicationSafetyData;
}

function useMedicationSafety() {
  return useQuery({
    queryKey: ["medication-safety"],
    queryFn: fetchMedicationSafety,
    staleTime: 120_000,
  });
}

type Signal = "green" | "amber" | "red" | "grey";

const SIGNAL_STYLES: Record<Signal, { bg: string; border: string; text: string; dot: string }> = {
  green: { bg: "bg-green-50",  border: "border-green-200",  text: "text-green-800",  dot: "bg-green-400"  },
  amber: { bg: "bg-amber-50",  border: "border-amber-200",  text: "text-amber-800",  dot: "bg-amber-400"  },
  red:   { bg: "bg-red-50",    border: "border-red-200",    text: "text-red-800",    dot: "bg-red-400"    },
  grey:  { bg: "bg-slate-50",  border: "border-slate-200",  text: "text-slate-500",  dot: "bg-slate-300"  },
};

function ChildMedCard({ profile }: { profile: MedicationChildProfile }) {
  const style = SIGNAL_STYLES[profile.signal];
  return (
    <div className={`rounded-xl border p-4 flex flex-col gap-3 ${style.bg} ${style.border}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${style.dot}`} />
          <span className="font-semibold text-slate-900 text-sm">{profile.childName}</span>
        </div>
        {profile.complianceRate !== null && (
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
            profile.complianceRate >= 95 ? "bg-green-100 text-green-700" :
            profile.complianceRate >= 80 ? "bg-amber-100 text-amber-700" :
            "bg-red-100 text-red-700"
          }`}>
            {formatRate(profile.complianceRate)} compliance
          </span>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        {profile.givenDoses > 0 && (
          <span className="text-xs bg-green-100 text-green-700 rounded-full px-2 py-0.5">
            {profile.givenDoses} given
          </span>
        )}
        {profile.lateDoses > 0 && (
          <span className="text-xs bg-amber-100 text-amber-700 rounded-full px-2 py-0.5">
            {profile.lateDoses} late
          </span>
        )}
        {profile.refusedDoses > 0 && (
          <span className="text-xs bg-red-100 text-red-700 rounded-full px-2 py-0.5">
            {profile.refusedDoses} refused
          </span>
        )}
        {profile.missedDoses > 0 && (
          <span className="text-xs bg-red-200 text-red-800 rounded-full px-2 py-0.5 font-semibold">
            {profile.missedDoses} missed
          </span>
        )}
      </div>

      {profile.concerns.length > 0 && (
        <div className="flex flex-col gap-1">
          {profile.concerns.map((c, i) => (
            <p key={i} className="text-xs text-red-700 flex items-center gap-1">
              <span>!</span>
              {c}
            </p>
          ))}
        </div>
      )}

      {profile.recentConcernNotes && (
        <p className="text-xs text-slate-500 italic border-t border-slate-200 pt-2">
          {profile.recentConcernDate}: {profile.recentConcernNotes.slice(0, 100)}
          {profile.recentConcernNotes.length > 100 ? "…" : ""}
        </p>
      )}
    </div>
  );
}

export default function MedicationSafetyPage() {
  const { data, isLoading, error } = useMedicationSafety();

  if (isLoading) return <div className="p-8 text-slate-500 text-sm">Analysing medication records…</div>;
  if (error || !data) return <div className="p-8 text-red-600 text-sm">Unable to load medication safety data.</div>;

  const overall = SIGNAL_STYLES[data.overallSignal];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <nav className="flex items-center gap-2 text-xs text-slate-400">
        <Link href="/intelligence" className="hover:text-slate-600">Intelligence</Link>
        <span>/</span>
        <span className="text-slate-600">Medication Safety</span>
      </nav>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Medication Safety Intelligence</h1>
        <p className="text-sm text-slate-600 mt-1">
          30-day medication administration record — compliance rate, refusals, missed doses, witness coverage, and per-child profiles.
        </p>
      </div>

      {/* Summary */}
      <div className={`rounded-2xl border-2 p-5 ${overall.bg} ${overall.border}`}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className={`text-2xl font-bold ${data.complianceRate >= 95 ? "text-green-700" : data.complianceRate >= 80 ? "text-amber-700" : "text-red-700"}`}>
              {formatRate(data.complianceRate)}
            </p>
            <p className="text-xs text-slate-500">Compliance rate</p>
          </div>
          <div>
            <p className={`text-2xl font-bold ${data.refusedDoses > 0 ? "text-red-700" : "text-slate-700"}`}>
              {data.refusedDoses}
            </p>
            <p className="text-xs text-slate-500">Refused doses</p>
          </div>
          <div>
            <p className={`text-2xl font-bold ${data.missedDoses > 0 ? "text-red-700" : "text-slate-700"}`}>
              {data.missedDoses}
            </p>
            <p className="text-xs text-slate-500">Missed doses</p>
          </div>
          <div>
            <p className={`text-2xl font-bold ${data.administeredWithoutWitness > 0 ? "text-amber-700" : "text-slate-700"}`}>
              {data.administeredWithoutWitness}
            </p>
            <p className="text-xs text-slate-500">No witness recorded</p>
          </div>
        </div>
      </div>

      {/* Status breakdown */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Dose status (30 days)</h2>
        <div className="rounded-xl border border-slate-200 bg-white p-4 flex flex-wrap gap-3">
          {[
            { label: "Given",    count: data.givenDoses,    style: "bg-green-100 text-green-700" },
            { label: "Late",     count: data.lateDoses,     style: "bg-amber-100 text-amber-700" },
            { label: "Refused",  count: data.refusedDoses,  style: "bg-red-100 text-red-700"     },
            { label: "Missed",   count: data.missedDoses,   style: "bg-red-200 text-red-800"     },
            { label: "Withheld", count: data.withheldDoses, style: "bg-slate-100 text-slate-600" },
          ].filter((s) => s.count > 0).map((s) => (
            <div key={s.label} className={`rounded-xl px-4 py-2 text-center ${s.style}`}>
              <p className="text-xl font-bold">{s.count}</p>
              <p className="text-xs">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

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
      {data.childProfiles.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Per-child profiles</h2>
          <div className="flex flex-col gap-3">
            {data.childProfiles.map((p) => (
              <ChildMedCard key={p.childId} profile={p} />
            ))}
          </div>
        </section>
      )}

      {data.childProfiles.length === 0 && (
        <EmptyState compact title="No medication administration records found for the last 30 days." />
      )}

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
        <p className="font-semibold mb-1">Regulatory reference</p>
        <p>{data.regulatoryNote}</p>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
        Medication safety signals are derived from administration records only. Clinical decisions about medication changes must be made in consultation with the prescribing clinician. Managers must not alter medication without clinical authorisation.
      </div>
    </div>
  );
}

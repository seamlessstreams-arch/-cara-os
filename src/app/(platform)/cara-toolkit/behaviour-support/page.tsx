"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import type { BehaviourSupportAnalysis, ChildBehaviourProfile, BehaviourStrategy, BehaviourTrigger, SignalColour } from "@/lib/cara-visual-toolkit/types";

async function fetchBehaviourSupport(): Promise<BehaviourSupportAnalysis> {
  const res = await fetch("/api/v1/cara-toolkit/behaviour-support");
  if (!res.ok) throw new Error("Failed to fetch behaviour support data");
  const json = await res.json();
  return json.data as BehaviourSupportAnalysis;
}

function useCaraToolkitBehaviourSupport() {
  return useQuery({
    queryKey: ["cara-toolkit-behaviour-support"],
    queryFn: fetchBehaviourSupport,
    staleTime: 120_000,
  });
}

const SIGNAL_STYLES: Record<SignalColour, { bg: string; border: string; text: string; dot: string }> = {
  green: { bg: "bg-green-50",  border: "border-green-200",  text: "text-green-800",  dot: "bg-green-400"  },
  amber: { bg: "bg-amber-50",  border: "border-amber-200",  text: "text-amber-800",  dot: "bg-amber-400"  },
  red:   { bg: "bg-red-50",    border: "border-red-200",    text: "text-red-800",    dot: "bg-red-400"    },
  grey:  { bg: "bg-slate-50",  border: "border-slate-200",  text: "text-slate-600",  dot: "bg-slate-300"  },
};

function EffectivenessBar({ rate }: { rate: number }) {
  const colour = rate >= 75 ? "bg-green-400" : rate >= 50 ? "bg-amber-400" : "bg-red-400";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div className={`h-1.5 rounded-full ${colour}`} style={{ width: `${rate}%` }} />
      </div>
      <span className="text-xs font-semibold text-slate-600 w-8 shrink-0">{rate}%</span>
    </div>
  );
}

function ChildProfileCard({ profile }: { profile: ChildBehaviourProfile }) {
  const style = SIGNAL_STYLES[profile.signal];
  return (
    <div className={`rounded-xl border p-4 flex flex-col gap-3 ${style.bg} ${style.border}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${style.dot}`} />
          <span className="font-semibold text-slate-900">{profile.childInitials}</span>
        </div>
        <div className="flex gap-2 text-xs shrink-0">
          <span className="rounded-full bg-white border border-slate-200 px-2 py-0.5 text-slate-600">
            {profile.totalEntries} entries
          </span>
          {profile.highIntensityCount > 0 && (
            <span className="rounded-full bg-red-100 text-red-700 px-2 py-0.5 font-medium">
              {profile.highIntensityCount} high intensity
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {profile.topTriggers.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">Top triggers</p>
            <ul className="flex flex-col gap-1">
              {profile.topTriggers.map((t, i) => (
                <li key={i} className="text-xs text-slate-600 flex items-center justify-between gap-2">
                  <span className="truncate">{t.trigger}</span>
                  <span className="font-semibold text-slate-700 shrink-0">{t.count}×</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {profile.topStrategies.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">Strategies</p>
            <ul className="flex flex-col gap-1.5">
              {profile.topStrategies.map((s, i) => (
                <li key={i} className="flex flex-col gap-0.5">
                  <span className="text-xs text-slate-600 truncate">{s.strategy} ({s.count}×)</span>
                  <EffectivenessBar rate={s.effectivenessRate} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="flex gap-4 text-xs text-slate-400">
        <span>Incidents: <span className="font-medium text-slate-600">{profile.linkedIncidents}</span></span>
        <span>Last entry: <span className="font-medium text-slate-600">{profile.mostRecentEntry ?? "None"}</span></span>
      </div>
    </div>
  );
}

export default function BehaviourSupportPage() {
  const { data, isLoading, error } = useCaraToolkitBehaviourSupport();

  if (isLoading) return <div className="p-8 text-slate-500 text-sm">Analysing behaviour patterns…</div>;
  if (error || !data) return <div className="p-8 text-red-600 text-sm">Unable to load behaviour support data.</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <nav className="flex items-center gap-2 text-xs text-slate-400">
        <Link href="/cara-toolkit" className="hover:text-slate-600">Cara Toolkit</Link>
        <span>/</span>
        <span className="text-slate-600">Behaviour Support Plan</span>
      </nav>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Behaviour Support Plan</h1>
        <p className="text-sm text-slate-600 mt-1">
          Understanding behaviour as communication. Triggers, strategies, and what works — across children and at the home level.
        </p>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm">
          <p className="text-2xl font-bold text-slate-800">{data.totalEntries}</p>
          <p className="text-xs text-slate-500 mt-0.5">Behaviour entries</p>
        </div>
        <div className={`rounded-xl border p-3 text-center shadow-sm ${data.highIntensityEntries > 0 ? "border-red-200 bg-red-50" : "border-slate-200 bg-white"}`}>
          <p className={`text-2xl font-bold ${data.highIntensityEntries > 0 ? "text-red-700" : "text-slate-800"}`}>
            {data.highIntensityEntries}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">High intensity</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm">
          <p className="text-2xl font-bold text-slate-800">{data.topTriggers.length}</p>
          <p className="text-xs text-slate-500 mt-0.5">Distinct triggers</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm">
          <p className="text-2xl font-bold text-slate-800">{data.childProfiles.length}</p>
          <p className="text-xs text-slate-500 mt-0.5">Children</p>
        </div>
      </div>

      {/* Top triggers */}
      {data.topTriggers.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Most common triggers (home level)</h2>
          <div className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col gap-2">
            {data.topTriggers.map((t: BehaviourTrigger, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-slate-600 w-48 shrink-0 truncate">{t.trigger}</span>
                <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-2 rounded-full bg-violet-300"
                    style={{ width: `${data.totalEntries > 0 ? Math.max(4, Math.round((t.count / data.totalEntries) * 100)) : 4}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-slate-700 w-6 shrink-0">{t.count}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Top strategies */}
      {data.topStrategies.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Strategy effectiveness (home level)</h2>
          <div className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col gap-3">
            {data.topStrategies.map((s: BehaviourStrategy, i) => (
              <div key={i} className="flex flex-col gap-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-slate-700 truncate">{s.strategy}</span>
                  <span className="text-xs text-slate-400 shrink-0">{s.count} uses, {s.positiveOutcomes} positive</span>
                </div>
                <EffectivenessBar rate={s.effectivenessRate} />
              </div>
            ))}
          </div>
        </section>
      )}

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

      {/* Per-child profiles */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
          Per-child profiles ({data.childProfiles.length})
        </h2>
        {data.childProfiles.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
            No behaviour log entries recorded yet.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {data.childProfiles.map((p) => (
              <ChildProfileCard key={p.childId} profile={p} />
            ))}
          </div>
        )}
      </section>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
        <p className="font-semibold mb-1">Regulatory reference</p>
        <p>{data.regulatoryNote}</p>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
        Behaviour must be understood as communication — not managed as a problem to be controlled. All behaviour support approaches must be trauma-informed and regularly reviewed. Staff and managers remain professionally accountable for all decisions about managing behaviour.
      </div>
    </div>
  );
}

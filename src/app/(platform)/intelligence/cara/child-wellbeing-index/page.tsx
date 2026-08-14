"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { EmptyState } from "@/components/ui/empty-state";
type WellbeingDomainScore = {
  key: string;
  label: string;
  score: number | null;
};

type ChildWellbeingProfile = {
  childId: string;
  childName: string;
  compositeScore: number;
  signal: "green" | "amber" | "red" | "grey";
  domainScores: WellbeingDomainScore[];
  strengthArea: { label: string; score: number } | null;
  concernArea:  { label: string; score: number } | null;
  recentIncidentCount: number;
  recentMissingCount: number;
  keyWorkSessions30d: number;
  activeTargets: number;
  ninetyIncidents: number;
  keyWorkTotal: number;
};

type ChildWellbeingIndexData = {
  totalChildren: number;
  avgCompositeScore: number;
  greenCount: number;
  amberCount: number;
  redCount: number;
  overallSignal: "green" | "amber" | "red" | "grey";
  childProfiles: ChildWellbeingProfile[];
  insights: string[];
  regulatoryNote: string;
};

async function fetchChildWellbeingIndex(): Promise<ChildWellbeingIndexData> {
  const res = await fetch("/api/v1/child-wellbeing-index");
  if (!res.ok) throw new Error("Failed to fetch child wellbeing index");
  const json = await res.json();
  return json.data as ChildWellbeingIndexData;
}

function useChildWellbeingIndex() {
  return useQuery({
    queryKey: ["child-wellbeing-index"],
    queryFn: fetchChildWellbeingIndex,
    staleTime: 120_000,
  });
}

type Signal = "green" | "amber" | "red" | "grey";

const SIGNAL_STYLES: Record<Signal, { bg: string; border: string; text: string; dot: string; ring: string }> = {
  green: { bg: "bg-green-50",  border: "border-green-200",  text: "text-green-800",  dot: "bg-green-400",  ring: "border-green-300"  },
  amber: { bg: "bg-amber-50",  border: "border-amber-200",  text: "text-amber-800",  dot: "bg-amber-400",  ring: "border-amber-300"  },
  red:   { bg: "bg-red-50",    border: "border-red-200",    text: "text-red-800",    dot: "bg-red-400",    ring: "border-red-300"    },
  grey:  { bg: "bg-slate-50",  border: "border-slate-200",  text: "text-slate-500",  dot: "bg-slate-300",  ring: "border-slate-300"  },
};

function ScoreDial({ score, signal }: { score: number; signal: Signal }) {
  const style = SIGNAL_STYLES[signal];
  return (
    <div className={`w-16 h-16 rounded-full border-4 flex flex-col items-center justify-center shrink-0 ${style.ring} ${style.bg}`}>
      <p className={`text-xl font-black ${style.text}`}>{score}</p>
      <p className={`text-xs ${style.text}`}>/100</p>
    </div>
  );
}

function DomainPill({ domain }: { domain: WellbeingDomainScore }) {
  if (domain.score === null) {
    return (
      <div className="rounded-lg bg-slate-100 p-2 text-center">
        <p className="text-sm font-bold text-slate-400">—</p>
        <p className="text-xs text-slate-400">{domain.label}</p>
      </div>
    );
  }
  const colour =
    domain.score >= 70 ? "bg-green-100 text-green-700" :
    domain.score >= 50 ? "bg-amber-100 text-amber-700" :
    "bg-red-100 text-red-700";
  return (
    <div className={`rounded-lg p-2 text-center ${colour}`}>
      <p className="text-sm font-bold">{domain.score}</p>
      <p className="text-xs">{domain.label}</p>
    </div>
  );
}

function ChildCard({ profile }: { profile: ChildWellbeingProfile }) {
  const style = SIGNAL_STYLES[profile.signal];
  return (
    <div className={`rounded-xl border p-4 flex flex-col gap-3 ${style.bg} ${style.border}`}>
      <div className="flex items-center gap-4">
        <ScoreDial score={profile.compositeScore} signal={profile.signal} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`w-2 h-2 rounded-full shrink-0 ${style.dot}`} />
            <p className="font-semibold text-slate-900">{profile.childName}</p>
          </div>
          <div className="flex gap-3 text-xs text-slate-500">
            {profile.recentIncidentCount > 0 && (
              <span className="text-red-600">{profile.recentIncidentCount} incident{profile.recentIncidentCount === 1 ? "" : "s"} (30d)</span>
            )}
            {profile.keyWorkSessions30d > 0 && (
              <span className="text-green-600">{profile.keyWorkSessions30d} KW session{profile.keyWorkSessions30d === 1 ? "" : "s"} (30d)</span>
            )}
            {profile.keyWorkSessions30d === 0 && (
              <span className="text-amber-600">No KW sessions (30d)</span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-1.5">
        {profile.domainScores.map((d) => (
          <DomainPill key={d.key} domain={d} />
        ))}
      </div>

      <div className="flex gap-3 text-xs">
        {profile.strengthArea && (
          <span className="flex items-center gap-1 text-green-700">
            <span>↑</span>
            <span>Strength: {profile.strengthArea.label} ({profile.strengthArea.score})</span>
          </span>
        )}
        {profile.concernArea && profile.concernArea.score < 60 && (
          <span className="flex items-center gap-1 text-red-600">
            <span>↓</span>
            <span>Focus: {profile.concernArea.label} ({profile.concernArea.score})</span>
          </span>
        )}
      </div>
    </div>
  );
}

export default function ChildWellbeingIndexPage() {
  const { data, isLoading, error } = useChildWellbeingIndex();

  if (isLoading) return <div className="p-8 text-slate-500 text-sm">Computing wellbeing index…</div>;
  if (error || !data) return <div className="p-8 text-red-600 text-sm">Unable to load wellbeing index data.</div>;

  const overall = SIGNAL_STYLES[data.overallSignal];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <nav className="flex items-center gap-2 text-xs text-slate-400">
        <Link href="/intelligence" className="hover:text-slate-600">Intelligence</Link>
        <span>/</span>
        <span className="text-slate-600">Child Wellbeing Index</span>
      </nav>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Child Wellbeing Index</h1>
        <p className="text-sm text-slate-600 mt-1">
          Five-domain composite wellbeing score per child — outcomes, wellbeing ratings, safety, key work engagement, and progress direction. Supports care review and placement decisions.
        </p>
      </div>

      {/* Key for domains */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Five domains (each 0–100)</p>
        <div className="grid grid-cols-5 gap-2 text-xs text-slate-600 text-center">
          {["Outcomes", "Wellbeing", "Safety", "Engagement", "Progress"].map((d) => (
            <div key={d} className="rounded-lg bg-white border border-slate-200 py-1.5 px-1">
              <p>{d}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Home summary */}
      <div className={`rounded-2xl border-2 p-5 ${overall.bg} ${overall.border}`}>
        <div className="flex items-center gap-5">
          <ScoreDial score={data.avgCompositeScore} signal={data.overallSignal} />
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Home average</p>
            <div className="flex gap-4">
              {data.greenCount > 0 && (
                <div>
                  <p className="text-xl font-bold text-green-700">{data.greenCount}</p>
                  <p className="text-xs text-green-600">Thriving</p>
                </div>
              )}
              {data.amberCount > 0 && (
                <div>
                  <p className="text-xl font-bold text-amber-700">{data.amberCount}</p>
                  <p className="text-xs text-amber-600">Developing</p>
                </div>
              )}
              {data.redCount > 0 && (
                <div>
                  <p className="text-xl font-bold text-red-700">{data.redCount}</p>
                  <p className="text-xs text-red-600">Needs focus</p>
                </div>
              )}
            </div>
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
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
          Child profiles ({data.totalChildren})
        </h2>
        {data.childProfiles.length === 0 ? (
          <EmptyState compact title="No children currently in placement." />
        ) : (
          <div className="flex flex-col gap-3">
            {data.childProfiles.map((p) => (
              <ChildCard key={p.childId} profile={p} />
            ))}
          </div>
        )}
      </section>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
        <p className="font-semibold mb-1">Regulatory reference</p>
        <p>{data.regulatoryNote}</p>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
        Wellbeing scores are computed from existing records. A high score does not mean no risk — scores supplement, not replace, direct observation, care planning, and professional judgement. The Registered Manager is accountable for all placement decisions.
      </div>
    </div>
  );
}

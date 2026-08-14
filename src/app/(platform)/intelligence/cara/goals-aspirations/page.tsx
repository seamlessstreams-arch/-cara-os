"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { EmptyState } from "@/components/ui/empty-state";
export type VoiceEntry = {
  source: "outcome_target" | "key_work";
  date: string;
  domain: string | null;
  domainLabel: string | null;
  text: string;
  targetDescription: string | null;
};

export type EnrichedVoiceEntry = VoiceEntry & {
  childName: string;
  childId: string;
};

export type ChildVoiceProfile = {
  childId: string;
  childName: string;
  totalVoices: number;
  targetVoiceCount: number;
  kwVoiceCount: number;
  hasVoice: boolean;
  allVoices: VoiceEntry[];
  mostRecentVoice: VoiceEntry | null;
  domainsMissingVoice: string[];
  coveredDomainCount: number;
  totalDomainCount: number;
};

export type GoalsAspirationsData = {
  totalChildren: number;
  childrenWithVoice: number;
  childrenWithoutVoice: number;
  totalVoices: number;
  overallSignal: "green" | "amber" | "red" | "grey";
  childVoiceProfiles: ChildVoiceProfile[];
  recentVoices: EnrichedVoiceEntry[];
  insights: string[];
  regulatoryNote: string;
};

type Signal = "green" | "amber" | "red" | "grey";

const SIGNAL_STYLES: Record<Signal, { bg: string; border: string; text: string; dot: string }> = {
  green: { bg: "bg-green-50",  border: "border-green-200",  text: "text-green-800",  dot: "bg-green-400"  },
  amber: { bg: "bg-amber-50",  border: "border-amber-200",  text: "text-amber-800",  dot: "bg-amber-400"  },
  red:   { bg: "bg-red-50",    border: "border-red-200",    text: "text-red-800",    dot: "bg-red-400"    },
  grey:  { bg: "bg-slate-50",  border: "border-slate-200",  text: "text-slate-500",  dot: "bg-slate-300"  },
};

const SOURCE_BADGE: Record<string, { label: string; colour: string }> = {
  outcome_target: { label: "Outcome target",  colour: "bg-violet-100 text-violet-700" },
  key_work:       { label: "Key work",         colour: "bg-teal-100 text-teal-700"    },
};

function VoiceCard({ voice, childName }: { voice: EnrichedVoiceEntry; childName?: string }) {
  const src = SOURCE_BADGE[voice.source] ?? { label: voice.source, colour: "bg-slate-100 text-slate-500" };
  return (
    <div className="rounded-xl border border-teal-200 bg-teal-50 p-4 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-3">
        <blockquote className="text-sm text-teal-900 leading-relaxed italic flex-1">
          &ldquo;{voice.text}&rdquo;
        </blockquote>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {childName && (
          <span className="text-xs font-semibold text-teal-800">{childName}</span>
        )}
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${src.colour}`}>{src.label}</span>
        {voice.domainLabel && (
          <span className="rounded-full bg-white border border-teal-200 px-2 py-0.5 text-xs text-teal-700">
            {voice.domainLabel}
          </span>
        )}
        <span className="text-xs text-slate-400 ml-auto">{voice.date}</span>
      </div>
      {voice.targetDescription && (
        <p className="text-xs text-slate-500 border-t border-teal-200 pt-2">
          Target: {voice.targetDescription.slice(0, 80)}{voice.targetDescription.length > 80 ? "…" : ""}
        </p>
      )}
    </div>
  );
}

function ChildVoiceRow({ profile }: { profile: ChildVoiceProfile }) {
  const signal: Signal = profile.hasVoice ? "green" : "red";
  const style = SIGNAL_STYLES[signal];
  return (
    <div className={`rounded-xl border p-4 flex flex-col gap-3 ${style.bg} ${style.border}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${style.dot}`} />
          <span className="font-semibold text-slate-900 text-sm">{profile.childName}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${profile.hasVoice ? "bg-teal-100 text-teal-700" : "bg-red-100 text-red-700"}`}>
            {profile.totalVoices} voice{profile.totalVoices === 1 ? "" : "s"}
          </span>
          {profile.coveredDomainCount > 0 && (
            <span className="text-xs text-slate-400">
              {profile.coveredDomainCount}/{profile.totalDomainCount} domains covered
            </span>
          )}
        </div>
      </div>

      {!profile.hasVoice && (
        <p className="text-xs text-red-700">
          No voice recorded in outcome targets or key work sessions. Seek the young person&apos;s views at the next opportunity.
        </p>
      )}

      {profile.mostRecentVoice && (
        <blockquote className="text-xs text-teal-800 italic bg-teal-50 border border-teal-200 rounded-lg p-3 leading-relaxed">
          &ldquo;{profile.mostRecentVoice.text.slice(0, 150)}{profile.mostRecentVoice.text.length > 150 ? "…" : ""}&rdquo;
          <span className="not-italic text-teal-500 ml-1 text-xs">— {profile.mostRecentVoice.date}</span>
        </blockquote>
      )}

      {profile.domainsMissingVoice.length > 0 && (
        <p className="text-xs text-amber-700">
          Domains without voice: {profile.domainsMissingVoice.map((d) => d.replace(/_/g, " ")).join(", ")}
        </p>
      )}

      {profile.targetVoiceCount > 0 && (
        <div className="flex gap-3 text-xs text-slate-500">
          <span>{profile.targetVoiceCount} in outcome targets</span>
          {profile.kwVoiceCount > 0 && <span>{profile.kwVoiceCount} in key work</span>}
        </div>
      )}
    </div>
  );
}

export default function GoalsAspirationsPage() {
  const { data, isLoading, error } = useQuery<GoalsAspirationsData>({
    queryKey: ["goals-aspirations"],
    queryFn: async () => {
      const res = await fetch("/api/v1/goals-aspirations");
      if (!res.ok) throw new Error("Failed to fetch goals and aspirations data");
      const json = await res.json();
      return json.data as GoalsAspirationsData;
    },
    staleTime: 120_000,
  });

  if (isLoading) return <div className="p-8 text-slate-500 text-sm">Gathering voice and aspirations…</div>;
  if (error || !data) return <div className="p-8 text-red-600 text-sm">Unable to load goals and aspirations data.</div>;

  const overall = SIGNAL_STYLES[data.overallSignal];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <nav className="flex items-center gap-2 text-xs text-slate-400">
        <Link href="/intelligence" className="hover:text-slate-600">Intelligence</Link>
        <span>/</span>
        <span className="text-slate-600">Goals & Aspirations</span>
      </nav>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Goals & Aspirations Intelligence</h1>
        <p className="text-sm text-slate-600 mt-1">
          What have the young people actually said about their goals, hopes, and what matters to them? Voice captured across outcome targets and key work sessions.
        </p>
      </div>

      {/* UN CRC callout */}
      <div className="rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm text-teal-800">
        <span className="font-semibold">Article 12, UNCRC: </span>
        Every child has the right to express their views freely in all matters affecting them, and to have those views given due weight in accordance with their age and maturity.
      </div>

      {/* Summary */}
      <div className={`rounded-2xl border-2 p-5 ${overall.bg} ${overall.border}`}>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-2xl font-bold text-slate-800">{data.totalVoices}</p>
            <p className="text-xs text-slate-500">Voice entries</p>
          </div>
          <div>
            <p className={`text-2xl font-bold ${data.childrenWithVoice === data.totalChildren ? "text-green-700" : "text-amber-700"}`}>
              {data.childrenWithVoice}
            </p>
            <p className="text-xs text-slate-500">Children with voice</p>
          </div>
          <div>
            <p className={`text-2xl font-bold ${data.childrenWithoutVoice > 0 ? "text-red-700" : "text-slate-700"}`}>
              {data.childrenWithoutVoice}
            </p>
            <p className="text-xs text-slate-500">Without any voice</p>
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

      {/* Recent voices */}
      {data.recentVoices.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Recent voice entries</h2>
          <div className="flex flex-col gap-3">
            {data.recentVoices.map((v, i) => (
              <VoiceCard key={i} voice={v} childName={v.childName} />
            ))}
          </div>
        </section>
      )}

      {/* Per-child profiles */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
          Voice by child ({data.totalChildren})
        </h2>
        {data.childVoiceProfiles.length === 0 ? (
          <EmptyState compact title="No children currently in placement." />
        ) : (
          <div className="flex flex-col gap-3">
            {data.childVoiceProfiles.map((p) => (
              <ChildVoiceRow key={p.childId} profile={p} />
            ))}
          </div>
        )}
      </section>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
        <p className="font-semibold mb-1">Regulatory reference</p>
        <p>{data.regulatoryNote}</p>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
        Voice entries shown here are drawn from recorded key work sessions and outcome target notes. The full depth of a young person&apos;s views cannot be captured in a text field — this tool surfaces what has been documented and highlights gaps.
      </div>
    </div>
  );
}

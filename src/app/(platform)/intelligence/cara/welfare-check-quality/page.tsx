"use client";

import { formatRate } from "@/lib/metrics/rate";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { EmptyState } from "@/components/ui/empty-state";
type WelfareChildProfile = {
  childId: string;
  childName: string;
  totalChecks: number;
  okCount: number;
  asleepCount: number;
  awakeCount: number;
  concernCount: number;
  notInRoomCount: number;
  signal: "green" | "amber" | "red" | "grey";
};

type WelfareCheckQualityData = {
  totalRounds: number;
  totalChecks: number;
  buildingSecureRate: number | null;
  overnightCoverage: number;
  checkStatusBreakdown: {
    ok: number;
    asleep: number;
    awake: number;
    concern: number;
    not_in_room: number;
    refused: number;
  };
  concernChecks: number;
  escalatedConcerns: number;
  unescalatedConcerns: number;
  notInRoomChecks: number;
  physicalMarksNoted: number;
  childProfiles: WelfareChildProfile[];
  insights: string[];
  overallSignal: "green" | "amber" | "red" | "grey";
  regulatoryNote: string;
};

async function fetchWelfareCheckQuality(): Promise<WelfareCheckQualityData> {
  const res = await fetch("/api/v1/welfare-check-quality");
  if (!res.ok) throw new Error("Failed to fetch welfare check quality data");
  const json = await res.json();
  return json.data as WelfareCheckQualityData;
}

function useWelfareCheckQuality() {
  return useQuery({
    queryKey: ["welfare-check-quality"],
    queryFn: fetchWelfareCheckQuality,
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



function ChildWelfareCard({ profile }: { profile: WelfareChildProfile }) {
  const style = SIGNAL_STYLES[profile.signal];
  return (
    <div className={`rounded-xl border p-4 flex flex-col gap-3 ${style.bg} ${style.border}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${style.dot}`} />
          <span className="font-semibold text-slate-900 text-sm">{profile.childName}</span>
        </div>
        <span className="text-xs text-slate-400">{profile.totalChecks} checks (7d)</span>
      </div>

      <div className="flex gap-2 flex-wrap">
        {profile.okCount > 0 && (
          <span className="text-xs bg-green-100 text-green-700 rounded-full px-2 py-0.5">{profile.okCount} clear</span>
        )}
        {profile.asleepCount > 0 && (
          <span className="text-xs bg-blue-100 text-blue-700 rounded-full px-2 py-0.5">{profile.asleepCount} asleep</span>
        )}
        {profile.awakeCount > 0 && (
          <span className="text-xs bg-sky-100 text-sky-700 rounded-full px-2 py-0.5">{profile.awakeCount} awake</span>
        )}
        {profile.concernCount > 0 && (
          <span className="text-xs bg-red-100 text-red-700 rounded-full px-2 py-0.5 font-semibold">
            {profile.concernCount} concern{profile.concernCount === 1 ? "" : "s"}
          </span>
        )}
        {profile.notInRoomCount > 0 && (
          <span className="text-xs bg-orange-100 text-orange-700 rounded-full px-2 py-0.5 font-semibold">
            {profile.notInRoomCount} not in room
          </span>
        )}
      </div>
    </div>
  );
}

export default function WelfareCheckQualityPage() {
  const { data, isLoading, error } = useWelfareCheckQuality();

  if (isLoading) return <div className="p-8 text-slate-500 text-sm">Reviewing welfare check records…</div>;
  if (error || !data) return <div className="p-8 text-red-600 text-sm">Unable to load welfare check quality data.</div>;

  const overall = SIGNAL_STYLES[data.overallSignal];
  const bd = data.checkStatusBreakdown;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <nav className="flex items-center gap-2 text-xs text-slate-400">
        <Link href="/intelligence" className="hover:text-slate-600">Intelligence</Link>
        <span>/</span>
        <span className="text-slate-600">Welfare Check Quality</span>
      </nav>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Welfare Check Quality Intelligence</h1>
        <p className="text-sm text-slate-600 mt-1">
          7-day welfare check analysis — round completion, overnight coverage, concerns, not-in-room findings, and per-child check profiles.
        </p>
      </div>

      {/* Summary */}
      <div className={`rounded-2xl border-2 p-5 ${overall.bg} ${overall.border}`}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-2xl font-bold text-slate-800">{data.totalRounds}</p>
            <p className="text-xs text-slate-500">Check rounds (7d)</p>
          </div>
          <div>
            <p className={`text-2xl font-bold ${data.overnightCoverage >= 90 ? "text-green-700" : data.overnightCoverage >= 70 ? "text-amber-700" : "text-red-700"}`}>
              {data.overnightCoverage}%
            </p>
            <p className="text-xs text-slate-500">Overnight coverage</p>
          </div>
          <div>
            <p className={`text-2xl font-bold ${data.unescalatedConcerns > 0 ? "text-red-700" : "text-slate-700"}`}>
              {data.concernChecks}
            </p>
            <p className="text-xs text-slate-500">Concerns found</p>
          </div>
          <div>
            <p className={`text-2xl font-bold ${data.notInRoomChecks > 0 ? "text-orange-700" : "text-slate-700"}`}>
              {data.notInRoomChecks}
            </p>
            <p className="text-xs text-slate-500">Not in room</p>
          </div>
        </div>
      </div>

      {/* Unescalated concern warning */}
      {data.unescalatedConcerns > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-center gap-3">
          <span className="text-xl font-bold text-red-600">!</span>
          <p className="text-sm text-red-800">
            <span className="font-semibold">{data.unescalatedConcerns} concern{data.unescalatedConcerns === 1 ? "" : "s"} not escalated. </span>
            Welfare check concerns must be acted upon — review and escalate immediately.
          </p>
        </div>
      )}

      {/* Physical marks warning */}
      {data.physicalMarksNoted > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-center gap-3">
          <span className="text-xl font-bold text-red-600">!</span>
          <p className="text-sm text-red-800">
            <span className="font-semibold">Physical marks noted in {data.physicalMarksNoted} check{data.physicalMarksNoted === 1 ? "" : "s"}. </span>
            Ensure body map completed and safeguarding procedures followed.
          </p>
        </div>
      )}

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

      {/* Check status breakdown */}
      {data.totalChecks > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Check status breakdown (7 days)</h2>
          <div className="rounded-xl border border-slate-200 bg-white p-4 flex flex-wrap gap-3">
            {[
              { label: "All clear", count: bd.ok, colour: "bg-green-100 text-green-700" },
              { label: "Asleep", count: bd.asleep, colour: "bg-blue-100 text-blue-700" },
              { label: "Awake", count: bd.awake, colour: "bg-sky-100 text-sky-700" },
              { label: "Concern", count: bd.concern, colour: "bg-red-100 text-red-700" },
              { label: "Not in room", count: bd.not_in_room, colour: "bg-orange-100 text-orange-700" },
              { label: "Refused", count: bd.refused, colour: "bg-amber-100 text-amber-700" },
            ].filter((s) => s.count > 0).map((s) => (
              <div key={s.label} className={`rounded-xl px-4 py-2 text-center min-w-[72px] ${s.colour}`}>
                <p className="text-xl font-bold">{s.count}</p>
                <p className="text-xs">{s.label}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Building security */}
      {data.buildingSecureRate !== null && (
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm text-slate-600">Building security confirmed in rounds</p>
          <p className={`text-lg font-bold ${data.buildingSecureRate >= 90 ? "text-green-700" : "text-amber-700"}`}>
            {formatRate(data.buildingSecureRate)}
          </p>
        </div>
      )}

      {/* Per-child */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Per-child welfare summary</h2>
        {data.childProfiles.length === 0 ? (
          <EmptyState compact title="No welfare check data found for the past 7 days." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.childProfiles.map((p) => (
              <ChildWelfareCard key={p.childId} profile={p} />
            ))}
          </div>
        )}
      </section>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
        <p className="font-semibold mb-1">Regulatory reference</p>
        <p>{data.regulatoryNote}</p>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
        This intelligence is derived from completed welfare check round records. Not-in-room findings and concerns require immediate managerial review. The Registered Manager remains accountable for all safeguarding decisions.
      </div>
    </div>
  );
}

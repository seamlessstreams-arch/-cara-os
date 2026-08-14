"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { EmptyState } from "@/components/ui/empty-state";
/* ── inline types ──────────────────────────────────────────────────── */
export type HandoverChildProfile = {
  childId: string;
  childName: string;
  alertCount: number;
  topAlerts: string[];
  avgMoodScore: number | null;
  handoverCount: number;
  signal: "green" | "amber" | "red" | "grey";
};

export type HandoverSummary = {
  id: string;
  date: string;
  time: string;
  from: string;
  to: string;
  completed: boolean;
  flagCount: number;
  signOffCount: number;
  linkedIncidents: number;
  generalNotes: string | null;
};

export type FlagEntry = {
  flag: string;
  count: number;
  formattedFlag: string;
};

export type HandoverQualityData = {
  totalHandovers: number;
  completedHandovers: number;
  completionRate: number | null;
  unsignedHandovers: number;
  handoversWithFlags: number;
  handoversWithIncidents: number;
  topFlags: FlagEntry[];
  childProfiles: HandoverChildProfile[];
  recentSummaries: HandoverSummary[];
  insights: string[];
  overallSignal: "green" | "amber" | "red" | "grey";
  regulatoryNote: string;
};

/* ── inline hook ───────────────────────────────────────────────────── */
async function fetchHandoverQuality(): Promise<HandoverQualityData> {
  const res = await fetch("/api/v1/handover-quality");
  if (!res.ok) throw new Error("Failed to fetch handover quality data");
  const json = await res.json();
  return json.data as HandoverQualityData;
}

function useHandoverQuality() {
  return useQuery({
    queryKey: ["handover-quality"],
    queryFn: fetchHandoverQuality,
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

const SHIFT_LABELS: Record<string, string> = {
  day: "Day",
  sleep_in: "Sleep-in",
  waking_night: "Waking night",
  night: "Night",
  morning: "Morning",
};

function ChildHandoverCard({ profile }: { profile: HandoverChildProfile }) {
  const style = SIGNAL_STYLES[profile.signal];
  return (
    <div className={`rounded-xl border p-4 flex flex-col gap-2 ${style.bg} ${style.border}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${style.dot}`} />
          <span className="font-semibold text-slate-900 text-sm">{profile.childName}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {profile.avgMoodScore !== null && (
            <span className={`text-xs font-semibold ${
              profile.avgMoodScore >= 7 ? "text-green-700" :
              profile.avgMoodScore >= 5 ? "text-amber-700" : "text-red-700"
            }`}>
              Mood avg: {profile.avgMoodScore}/10
            </span>
          )}
          {profile.alertCount > 0 && (
            <span className="rounded-full bg-red-100 text-red-700 px-2 py-0.5 text-xs font-medium">
              {profile.alertCount} alert{profile.alertCount === 1 ? "" : "s"}
            </span>
          )}
        </div>
      </div>
      {profile.topAlerts.length > 0 && (
        <div className="flex flex-col gap-1">
          {profile.topAlerts.map((a, i) => (
            <p key={i} className="text-xs text-red-700 flex items-center gap-1">
              <span className="shrink-0">→</span>
              {a.replace(/_/g, " ")}
            </p>
          ))}
        </div>
      )}
      <p className="text-xs text-slate-400">{profile.handoverCount} handover{profile.handoverCount === 1 ? "" : "s"} this period</p>
    </div>
  );
}

function HandoverRow({ handover }: { handover: HandoverSummary }) {
  return (
    <div className={`rounded-xl border p-4 flex flex-col gap-2 ${
      handover.completed ? "border-slate-200 bg-white" : "border-amber-200 bg-amber-50"
    }`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            {handover.date} · {handover.time}
          </p>
          <p className="text-xs text-slate-500">
            {SHIFT_LABELS[handover.from] ?? handover.from} → {SHIFT_LABELS[handover.to] ?? handover.to}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {!handover.completed && (
            <span className="rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-xs font-medium">Incomplete</span>
          )}
          {handover.signOffCount === 0 && handover.completed && (
            <span className="rounded-full bg-red-100 text-red-700 px-2 py-0.5 text-xs font-medium">Unsigned</span>
          )}
          {handover.flagCount > 0 && (
            <span className="rounded-full bg-orange-100 text-orange-700 px-2 py-0.5 text-xs">
              {handover.flagCount} flag{handover.flagCount === 1 ? "" : "s"}
            </span>
          )}
          {handover.linkedIncidents > 0 && (
            <span className="rounded-full bg-red-100 text-red-700 px-2 py-0.5 text-xs">
              {handover.linkedIncidents} incident{handover.linkedIncidents === 1 ? "" : "s"}
            </span>
          )}
        </div>
      </div>
      {handover.generalNotes && (
        <p className="text-xs text-slate-500 italic">{handover.generalNotes}{handover.generalNotes.length >= 80 ? "…" : ""}</p>
      )}
    </div>
  );
}

export default function HandoverQualityPage() {
  const { data, isLoading, error } = useHandoverQuality();

  if (isLoading) return <div className="p-8 text-slate-500 text-sm">Analysing handover records…</div>;
  if (error || !data) return <div className="p-8 text-red-600 text-sm">Unable to load handover quality data.</div>;

  const overall = SIGNAL_STYLES[data.overallSignal];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <nav className="flex items-center gap-2 text-xs text-slate-400">
        <Link href="/intelligence" className="hover:text-slate-600">Intelligence</Link>
        <span>/</span>
        <span className="text-slate-600">Handover Quality</span>
      </nav>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Handover Quality Intelligence</h1>
        <p className="text-sm text-slate-600 mt-1">
          7-day shift handover analysis — completion, sign-off coverage, recurring flags, child mood trends, and linked incidents.
        </p>
      </div>

      {/* Summary */}
      <div className={`rounded-2xl border-2 p-5 ${overall.bg} ${overall.border}`}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-2xl font-bold text-slate-800">{data.totalHandovers}</p>
            <p className="text-xs text-slate-500">Handovers (7d)</p>
          </div>
          <div>
            <p className={`text-2xl font-bold ${data.completionRate === 100 ? "text-green-700" : "text-amber-700"}`}>
              {data.completionRate ?? "—"}%
            </p>
            <p className="text-xs text-slate-500">Completed</p>
          </div>
          <div>
            <p className={`text-2xl font-bold ${data.unsignedHandovers > 0 ? "text-red-700" : "text-slate-700"}`}>
              {data.unsignedHandovers}
            </p>
            <p className="text-xs text-slate-500">Unsigned</p>
          </div>
          <div>
            <p className={`text-2xl font-bold ${data.handoversWithFlags > 0 ? "text-amber-700" : "text-slate-700"}`}>
              {data.handoversWithFlags}
            </p>
            <p className="text-xs text-slate-500">With flags</p>
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

      {/* Top flags */}
      {data.topFlags.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Recurring flags</h2>
          <div className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col gap-2">
            {data.topFlags.map((f) => (
              <div key={f.flag} className="flex items-center justify-between gap-3">
                <p className="text-sm text-slate-700">{f.formattedFlag}</p>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  f.count >= 3 ? "bg-red-100 text-red-700" :
                  f.count >= 2 ? "bg-amber-100 text-amber-700" :
                  "bg-slate-100 text-slate-500"
                }`}>
                  {f.count}×
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Child mood & alerts */}
      {data.childProfiles.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Child mood & alerts</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.childProfiles.map((p) => (
              <ChildHandoverCard key={p.childId} profile={p} />
            ))}
          </div>
        </section>
      )}

      {/* Recent handovers */}
      {data.recentSummaries.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Recent handovers</h2>
          <div className="flex flex-col gap-2">
            {data.recentSummaries.map((h) => (
              <HandoverRow key={h.id} handover={h} />
            ))}
          </div>
        </section>
      )}

      {data.totalHandovers === 0 && (
        <EmptyState compact title="No handover records found for the past 7 days." />
      )}

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
        <p className="font-semibold mb-1">Regulatory reference</p>
        <p>{data.regulatoryNote}</p>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
        Handover quality signals are derived from the handover log. Recurring flags that are not being resolved suggest systemic issues requiring managerial intervention. The Registered Manager is accountable for handover quality across all shifts.
      </div>
    </div>
  );
}

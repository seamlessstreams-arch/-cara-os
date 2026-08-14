"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { EmptyState } from "@/components/ui/empty-state";
export type BSPChildProfile = {
  childId: string;
  childName: string;
  hasBSP: boolean;
  bspStatus: string | null;
  reviewDate: string | null;
  daysUntilReview: number | null;
  reviewOverdue: boolean;
  lastReviewDate: string | null;
  highSeverityBehaviours: number;
  totalBehaviours: number;
  improvingBehaviours: number;
  triggerCount: number;
  topTriggers: string[];
  hasRestrictiveInterventions: boolean;
  diagnoses: string[];
  signal: "green" | "amber" | "red" | "grey";
};

export type BehaviourSupportData = {
  totalChildren: number;
  childrenWithBSP: number;
  childrenWithoutBSP: number;
  overdueReviews: number;
  reviewsDueSoon: number;
  highSeverityTotal: number;
  improvingTotal: number;
  restrictiveInterventionCount: number;
  childProfiles: BSPChildProfile[];
  insights: string[];
  overallSignal: "green" | "amber" | "red" | "grey";
  regulatoryNote: string;
};

async function fetchBehaviourSupportIntelligence(): Promise<BehaviourSupportData> {
  const res = await fetch("/api/v1/behaviour-support-intelligence");
  if (!res.ok) throw new Error("Failed to fetch behaviour support intelligence data");
  const json = await res.json();
  return json.data as BehaviourSupportData;
}

type Signal = "green" | "amber" | "red" | "grey";

const SIGNAL_STYLES: Record<Signal, { bg: string; border: string; dot: string }> = {
  green: { bg: "bg-green-50",  border: "border-green-200",  dot: "bg-green-400"  },
  amber: { bg: "bg-amber-50",  border: "border-amber-200",  dot: "bg-amber-400"  },
  red:   { bg: "bg-red-50",    border: "border-red-200",    dot: "bg-red-400"    },
  grey:  { bg: "bg-slate-50",  border: "border-slate-200",  dot: "bg-slate-300"  },
};

const BSP_STATUS_LABELS: Record<string, string> = {
  active:    "Active",
  draft:     "Draft",
  archived:  "Archived",
  suspended: "Suspended",
};

function ChildBSPCard({ profile }: { profile: BSPChildProfile }) {
  const style = SIGNAL_STYLES[profile.signal];

  const daysLabel =
    profile.daysUntilReview === null ? null :
    profile.daysUntilReview < 0 ? `${Math.abs(profile.daysUntilReview)}d overdue` :
    profile.daysUntilReview === 0 ? "Due today" :
    `Review in ${profile.daysUntilReview}d`;

  if (!profile.hasBSP) {
    return (
      <div className={`rounded-xl border p-4 ${style.bg} ${style.border}`}>
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${style.dot}`} />
          <span className="font-semibold text-slate-900 text-sm">{profile.childName}</span>
          <span className="text-xs text-slate-400 ml-auto">No BSP</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border p-4 flex flex-col gap-3 ${style.bg} ${style.border}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${style.dot}`} />
          <div>
            <span className="font-semibold text-slate-900 text-sm">{profile.childName}</span>
            {profile.bspStatus && (
              <span className="ml-2 text-xs text-slate-400">{BSP_STATUS_LABELS[profile.bspStatus] ?? profile.bspStatus}</span>
            )}
          </div>
        </div>
        {daysLabel && (
          <span className={`text-xs font-semibold rounded-full px-2 py-0.5 shrink-0 ${
            profile.reviewOverdue ? "bg-red-100 text-red-700" :
            (profile.daysUntilReview !== null && profile.daysUntilReview <= 14) ? "bg-amber-100 text-amber-700" :
            "bg-slate-100 text-slate-500"
          }`}>{daysLabel}</span>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        {profile.totalBehaviours > 0 && (
          <span className="text-xs bg-slate-100 text-slate-600 rounded-full px-2 py-0.5">
            {profile.totalBehaviours} behaviour{profile.totalBehaviours === 1 ? "" : "s"}
          </span>
        )}
        {profile.highSeverityBehaviours > 0 && (
          <span className="text-xs bg-red-100 text-red-700 rounded-full px-2 py-0.5 font-semibold">
            {profile.highSeverityBehaviours} high severity
          </span>
        )}
        {profile.improvingBehaviours > 0 && (
          <span className="text-xs bg-green-100 text-green-700 rounded-full px-2 py-0.5">
            {profile.improvingBehaviours} improving
          </span>
        )}
        {profile.hasRestrictiveInterventions && (
          <span className="text-xs bg-orange-100 text-orange-700 rounded-full px-2 py-0.5 font-medium">Restrictive interventions</span>
        )}
        {profile.diagnoses.length > 0 && (
          <span className="text-xs bg-purple-100 text-purple-700 rounded-full px-2 py-0.5">
            {profile.diagnoses.join(", ")}
          </span>
        )}
      </div>

      {profile.topTriggers.length > 0 && (
        <div className="flex flex-col gap-0.5">
          <p className="text-xs font-medium text-slate-500">Top triggers:</p>
          {profile.topTriggers.map((t, i) => (
            <p key={i} className="text-xs text-slate-600 flex items-center gap-1">
              <span className="shrink-0 text-slate-300">→</span>
              {t}
            </p>
          ))}
        </div>
      )}

      {profile.lastReviewDate && (
        <p className="text-xs text-slate-400">Last reviewed: {profile.lastReviewDate}</p>
      )}
    </div>
  );
}

export default function BehaviourSupportIntelligencePage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["behaviour-support-intelligence"],
    queryFn: fetchBehaviourSupportIntelligence,
    staleTime: 120_000,
  });

  if (isLoading) return <div className="p-8 text-slate-500 text-sm">Analysing behaviour support plans…</div>;
  if (error || !data) return <div className="p-8 text-red-600 text-sm">Unable to load behaviour support intelligence data.</div>;

  const overall = SIGNAL_STYLES[data.overallSignal];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <nav className="flex items-center gap-2 text-xs text-slate-400">
        <Link href="/intelligence" className="hover:text-slate-600">Intelligence</Link>
        <span>/</span>
        <span className="text-slate-600">Behaviour Support Intelligence</span>
      </nav>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Behaviour Support Plan Intelligence</h1>
        <p className="text-sm text-slate-600 mt-1">
          BSP currency, high-severity behaviours, identified triggers, improving trends, and restrictive intervention oversight — all children.
        </p>
      </div>

      {/* Summary */}
      <div className={`rounded-2xl border-2 p-5 ${overall.bg} ${overall.border}`}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className={`text-2xl font-bold ${data.childrenWithoutBSP > 0 ? "text-amber-700" : "text-slate-700"}`}>
              {data.childrenWithBSP}/{data.totalChildren}
            </p>
            <p className="text-xs text-slate-500">Children with BSP</p>
          </div>
          <div>
            <p className={`text-2xl font-bold ${data.overdueReviews > 0 ? "text-red-700" : "text-slate-700"}`}>
              {data.overdueReviews}
            </p>
            <p className="text-xs text-slate-500">Overdue reviews</p>
          </div>
          <div>
            <p className={`text-2xl font-bold ${data.highSeverityTotal > 0 ? "text-red-700" : "text-slate-700"}`}>
              {data.highSeverityTotal}
            </p>
            <p className="text-xs text-slate-500">High-severity behaviours</p>
          </div>
          <div>
            <p className={`text-2xl font-bold ${data.restrictiveInterventionCount > 0 ? "text-orange-700" : "text-slate-700"}`}>
              {data.restrictiveInterventionCount}
            </p>
            <p className="text-xs text-slate-500">With restrictive interventions</p>
          </div>
        </div>
      </div>

      {/* Restrictive intervention warning */}
      {data.restrictiveInterventionCount > 0 && (
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 flex items-center gap-3">
          <span className="text-xl font-bold text-orange-600">!</span>
          <p className="text-sm text-orange-800">
            <span className="font-semibold">
              {data.restrictiveInterventionCount} child{data.restrictiveInterventionCount === 1 ? " has" : "ren have"} restrictive interventions in their BSP.{" "}
            </span>
            All staff must be trained, all interventions must be manager-authorised, and post-incident debriefs must happen within 24 hours.
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

      {/* Improving signal */}
      {data.improvingTotal > 0 && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 flex items-center gap-3">
          <span className="text-xl text-green-600">✓</span>
          <p className="text-sm text-green-800">
            <span className="font-semibold">{data.improvingTotal} behaviour{data.improvingTotal === 1 ? " is" : "s are"} on an improving trend. </span>
            Note which strategies are working and discuss in team meeting and supervision.
          </p>
        </div>
      )}

      {/* Per-child profiles */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Per-child BSP summary</h2>
        {data.childProfiles.length === 0 ? (
          <EmptyState compact title="No children found." />
        ) : (
          <div className="flex flex-col gap-3">
            {data.childProfiles.map((p) => (
              <ChildBSPCard key={p.childId} profile={p} />
            ))}
          </div>
        )}
      </section>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
        <p className="font-semibold mb-1">Regulatory reference</p>
        <p>{data.regulatoryNote}</p>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
        Behaviour intelligence is derived from current Behaviour Support Plans only. BSPs must be co-produced with the child and reviewed following any significant change in behaviour pattern. Restrictive interventions require additional management oversight and must never be used punitively.
      </div>
    </div>
  );
}

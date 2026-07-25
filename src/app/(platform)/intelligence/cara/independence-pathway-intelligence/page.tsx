"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

export type PathwayDomainSummary = {
  name: string;
  score: number;
  maxScore: number;
  percentage: number;
  signal: "green" | "amber" | "red" | "grey";
};

export type IndependenceChildProfile = {
  childId: string;
  childName: string;
  overallReadiness: number;
  status: string;
  pathwayPlanLinked: boolean;
  reviewDate: string | null;
  daysUntilReview: number | null;
  reviewOverdue: boolean;
  domains: PathwayDomainSummary[];
  weakestDomains: string[];
  strongestDomains: string[];
  signal: "green" | "amber" | "red" | "grey";
};

export type IndependencePathwayData = {
  totalChildren: number;
  childrenWithPathway: number;
  childrenWithoutPathway: number;
  avgReadiness: number | null;
  childrenNeedingAttention: number;
  overdueReviews: number;
  unlinkedPlans: number;
  childProfiles: IndependenceChildProfile[];
  insights: string[];
  overallSignal: "green" | "amber" | "red" | "grey";
  regulatoryNote: string;
};

type Signal = "green" | "amber" | "red" | "grey";

const SIGNAL_STYLES: Record<Signal, { bg: string; border: string; dot: string; text: string }> = {
  green: { bg: "bg-green-50",  border: "border-green-200",  dot: "bg-green-400",  text: "text-green-700" },
  amber: { bg: "bg-amber-50",  border: "border-amber-200",  dot: "bg-amber-400",  text: "text-amber-700" },
  red:   { bg: "bg-red-50",    border: "border-red-200",    dot: "bg-red-400",    text: "text-red-700"   },
  grey:  { bg: "bg-slate-50",  border: "border-slate-200",  dot: "bg-slate-300",  text: "text-slate-400" },
};

const STATUS_LABELS: Record<string, string> = {
  on_track:         "On track",
  attention_needed: "Attention needed",
  not_assessed:     "Not assessed",
};

function ReadinessDial({ score }: { score: number }) {
  const sig: Signal = score >= 70 ? "green" : score >= 50 ? "amber" : "red";
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const colour = sig === "green" ? "#22c55e" : sig === "amber" ? "#f59e0b" : "#ef4444";
  return (
    <div className="relative w-20 h-20 flex items-center justify-center">
      <svg viewBox="0 0 64 64" className="w-20 h-20 -rotate-90">
        <circle cx="32" cy="32" r={r} stroke="#e2e8f0" strokeWidth="7" fill="none" />
        <circle
          cx="32" cy="32" r={r} stroke={colour} strokeWidth="7" fill="none"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        />
      </svg>
      <span className={`absolute text-lg font-bold ${SIGNAL_STYLES[sig].text}`}>{score}</span>
    </div>
  );
}

function DomainBar({ domain }: { domain: PathwayDomainSummary }) {
  const barColour =
    domain.percentage >= 70 ? "bg-green-400" :
    domain.percentage >= 50 ? "bg-amber-400" :
    "bg-red-400";
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-600 w-32 shrink-0 truncate">{domain.name}</span>
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${barColour}`} style={{ width: `${domain.percentage}%` }} />
      </div>
      <span className="text-xs text-slate-500 w-8 text-right">{domain.score}/{domain.maxScore}</span>
    </div>
  );
}

function ChildPathwayCard({ profile }: { profile: IndependenceChildProfile }) {
  const style = SIGNAL_STYLES[profile.signal];
  const daysLabel =
    profile.daysUntilReview === null ? null :
    profile.daysUntilReview < 0 ? `${Math.abs(profile.daysUntilReview)}d overdue` :
    profile.daysUntilReview === 0 ? "Due today" :
    `Review in ${profile.daysUntilReview}d`;

  return (
    <div className={`rounded-xl border p-4 flex flex-col gap-4 ${style.bg} ${style.border}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${style.dot}`} />
          <div>
            <p className="font-semibold text-slate-900 text-sm">{profile.childName}</p>
            <p className={`text-xs ${
              profile.status === "attention_needed" ? "text-red-600 font-medium" :
              profile.status === "not_assessed" ? "text-slate-400" : "text-slate-500"
            }`}>{STATUS_LABELS[profile.status] ?? profile.status}</p>
          </div>
        </div>
        {profile.overallReadiness > 0 && <ReadinessDial score={profile.overallReadiness} />}
      </div>

      <div className="flex gap-2 flex-wrap">
        {!profile.pathwayPlanLinked && profile.status !== "not_assessed" && (
          <span className="text-xs bg-amber-100 text-amber-700 rounded-full px-2 py-0.5 font-semibold">No pathway plan linked</span>
        )}
        {daysLabel && (
          <span className={`text-xs rounded-full px-2 py-0.5 font-semibold ${
            profile.reviewOverdue ? "bg-red-100 text-red-700" :
            (profile.daysUntilReview !== null && profile.daysUntilReview <= 30) ? "bg-amber-100 text-amber-700" :
            "bg-slate-100 text-slate-500"
          }`}>{daysLabel}</span>
        )}
      </div>

      {profile.domains.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {profile.domains.map((d) => <DomainBar key={d.name} domain={d} />)}
        </div>
      )}

      {profile.weakestDomains.length > 0 && (
        <p className="text-xs text-slate-500">
          <span className="text-slate-600 font-medium">Focus: </span>
          {profile.weakestDomains.join(" · ")}
        </p>
      )}
    </div>
  );
}

export default function IndependencePathwayIntelligencePage() {
  // Inlined useIndependencePathwayIntelligence + fetchIndependencePathwayIntelligence
  async function fetchIndependencePathwayIntelligence(): Promise<IndependencePathwayData> {
    const res = await fetch("/api/v1/independence-pathway-intelligence");
    if (!res.ok) throw new Error("Failed to fetch independence pathway data");
    const json = await res.json();
    return json.data as IndependencePathwayData;
  }

  const pathwayQuery = useQuery({
    queryKey: ["independence-pathway-intelligence"],
    queryFn: fetchIndependencePathwayIntelligence,
    staleTime: 120_000,
  });
  const { data, isLoading, error } = pathwayQuery;

  if (isLoading) return <div className="p-8 text-slate-500 text-sm">Analysing independence pathway data…</div>;
  if (error || !data) return <div className="p-8 text-red-600 text-sm">Unable to load independence pathway data.</div>;

  const overall = SIGNAL_STYLES[data.overallSignal];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <nav className="flex items-center gap-2 text-xs text-slate-400">
        <Link href="/intelligence" className="hover:text-slate-600">Intelligence</Link>
        <span>/</span>
        <span className="text-slate-600">Independence Pathway</span>
      </nav>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Independence Pathway Intelligence</h1>
        <p className="text-sm text-slate-600 mt-1">
          Leaving care readiness scores, domain-level development gaps, pathway plan currency, and review compliance — all children.
        </p>
      </div>

      {/* Summary */}
      <div className={`rounded-2xl border-2 p-5 ${overall.bg} ${overall.border}`}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className={`text-2xl font-bold ${data.avgReadiness !== null && data.avgReadiness < 60 ? "text-amber-700" : "text-slate-700"}`}>
              {data.avgReadiness !== null ? `${data.avgReadiness}%` : "—"}
            </p>
            <p className="text-xs text-slate-500">Avg readiness</p>
          </div>
          <div>
            <p className={`text-2xl font-bold ${data.childrenWithoutPathway > 0 ? "text-red-700" : "text-slate-700"}`}>
              {data.childrenWithPathway}/{data.totalChildren}
            </p>
            <p className="text-xs text-slate-500">Pathways assessed</p>
          </div>
          <div>
            <p className={`text-2xl font-bold ${data.unlinkedPlans > 0 ? "text-amber-700" : "text-slate-700"}`}>
              {data.unlinkedPlans}
            </p>
            <p className="text-xs text-slate-500">No pathway plan linked</p>
          </div>
          <div>
            <p className={`text-2xl font-bold ${data.childrenNeedingAttention > 0 ? "text-red-700" : "text-slate-700"}`}>
              {data.childrenNeedingAttention}
            </p>
            <p className="text-xs text-slate-500">Attention needed</p>
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

      {/* Per-child */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Per-child pathway profiles</h2>
        {data.childProfiles.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
            No pathway assessments found.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {data.childProfiles.map((p) => (
              <ChildPathwayCard key={p.childId} profile={p} />
            ))}
          </div>
        )}
      </section>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
        <p className="font-semibold mb-1">Regulatory reference</p>
        <p>{data.regulatoryNote}</p>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
        Independence readiness scores are based on recorded pathway assessments only. Young people must be fully involved in the assessment and in setting their own goals. Scores indicate development areas — not deficits. The personal adviser and social worker must be included in planning transitions.
      </div>
    </div>
  );
}

"use client";

import { formatRate } from "@/lib/metrics/rate";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { EmptyState } from "@/components/ui/empty-state";
// ── LAC review compliance query (inlined from the former hook wrapper) ─────

type LACReviewChildProfile = {
  childId: string;
  childName: string;
  lastReviewDate: string | null;
  nextReviewDate: string | null;
  daysUntilNextReview: number | null;
  reviewOverdue: boolean;
  totalReviews: number;
  mostRecentParticipation: string | null;
  totalActions: number;
  completedActions: number;
  overdueActions: number;
  actionCompletionRate: number | null;
  signal: "green" | "amber" | "red" | "grey";
};

type LACReviewComplianceData = {
  totalReviews: number;
  childrenWithNoReview: number;
  overdueReviews: number;
  reviewsDueSoon: number;
  totalActions: number;
  completedActions: number;
  overdueActions: number;
  childParticipationCount: number;
  totalChildren: number;
  childProfiles: LACReviewChildProfile[];
  insights: string[];
  overallSignal: "green" | "amber" | "red" | "grey";
  regulatoryNote: string;
};

async function fetchLACReviewCompliance(): Promise<LACReviewComplianceData> {
  const res = await fetch("/api/v1/lac-review-compliance");
  if (!res.ok) throw new Error("Failed to fetch LAC review compliance data");
  const json = await res.json();
  return json.data as LACReviewComplianceData;
}

function useLACReviewCompliance() {
  return useQuery({
    queryKey: ["lac-review-compliance"],
    queryFn: fetchLACReviewCompliance,
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

const PARTICIPATION_LABELS: Record<string, string> = {
  attended:          "Attended",
  views_submitted:   "Views submitted",
  advocate_attended: "Advocate attended",
  did_not_participate: "Did not participate",
};

function ChildLACCard({ profile }: { profile: LACReviewChildProfile }) {
  const style = SIGNAL_STYLES[profile.signal];

  const daysLabel =
    profile.daysUntilNextReview === null
      ? null
      : profile.daysUntilNextReview < 0
      ? `${Math.abs(profile.daysUntilNextReview)}d overdue`
      : profile.daysUntilNextReview === 0
      ? "Due today"
      : `${profile.daysUntilNextReview}d until review`;

  return (
    <div className={`rounded-xl border p-4 flex flex-col gap-3 ${style.bg} ${style.border}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${style.dot}`} />
          <span className="font-semibold text-slate-900 text-sm">{profile.childName}</span>
        </div>
        {daysLabel && (
          <span className={`text-xs font-semibold rounded-full px-2 py-0.5 ${
            profile.reviewOverdue
              ? "bg-red-100 text-red-700"
              : profile.daysUntilNextReview !== null && profile.daysUntilNextReview <= 30
              ? "bg-amber-100 text-amber-700"
              : "bg-green-100 text-green-700"
          }`}>
            {daysLabel}
          </span>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        <span className="text-xs bg-slate-100 text-slate-600 rounded-full px-2 py-0.5">
          {profile.totalReviews} review{profile.totalReviews === 1 ? "" : "s"}
        </span>
        {profile.mostRecentParticipation && (
          <span className={`text-xs rounded-full px-2 py-0.5 ${
            profile.mostRecentParticipation === "attended" || profile.mostRecentParticipation === "views_submitted"
              ? "bg-green-100 text-green-700"
              : "bg-slate-100 text-slate-500"
          }`}>
            {PARTICIPATION_LABELS[profile.mostRecentParticipation] ?? profile.mostRecentParticipation}
          </span>
        )}
        {profile.overdueActions > 0 && (
          <span className="text-xs bg-red-100 text-red-700 rounded-full px-2 py-0.5 font-semibold">
            {profile.overdueActions} overdue action{profile.overdueActions === 1 ? "" : "s"}
          </span>
        )}
        {profile.actionCompletionRate !== null && (
          <span className={`text-xs rounded-full px-2 py-0.5 font-semibold ${
            profile.actionCompletionRate >= 90 ? "bg-green-100 text-green-700" :
            profile.actionCompletionRate >= 60 ? "bg-amber-100 text-amber-700" :
            "bg-red-100 text-red-700"
          }`}>
            {formatRate(profile.actionCompletionRate)} actions complete
          </span>
        )}
      </div>

      {profile.lastReviewDate && (
        <p className="text-xs text-slate-400">Last review: {profile.lastReviewDate}</p>
      )}
    </div>
  );
}

export default function LACReviewCompliancePage() {
  const { data, isLoading, error } = useLACReviewCompliance();

  if (isLoading) return <div className="p-8 text-slate-500 text-sm">Checking LAC review compliance…</div>;
  if (error || !data) return <div className="p-8 text-red-600 text-sm">Unable to load LAC review compliance data.</div>;

  const overall = SIGNAL_STYLES[data.overallSignal];
  const actionCompletionRate =
    data.totalActions > 0 ? Math.round((data.completedActions / data.totalActions) * 100) : null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <nav className="flex items-center gap-2 text-xs text-slate-400">
        <Link href="/intelligence" className="hover:text-slate-600">Intelligence</Link>
        <span>/</span>
        <span className="text-slate-600">LAC Review Compliance</span>
      </nav>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">LAC Review Compliance</h1>
        <p className="text-sm text-slate-600 mt-1">
          Statutory review timeliness, action completion, child participation, and overdue reviews — all looked-after children.
        </p>
      </div>

      {/* Summary */}
      <div className={`rounded-2xl border-2 p-5 ${overall.bg} ${overall.border}`}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className={`text-2xl font-bold ${data.overdueReviews > 0 ? "text-red-700" : "text-slate-700"}`}>
              {data.overdueReviews}
            </p>
            <p className="text-xs text-slate-500">Overdue reviews</p>
          </div>
          <div>
            <p className={`text-2xl font-bold ${data.reviewsDueSoon > 0 ? "text-amber-700" : "text-slate-700"}`}>
              {data.reviewsDueSoon}
            </p>
            <p className="text-xs text-slate-500">Due within 30 days</p>
          </div>
          <div>
            <p className={`text-2xl font-bold ${data.overdueActions > 0 ? "text-red-700" : "text-slate-700"}`}>
              {data.overdueActions}
            </p>
            <p className="text-xs text-slate-500">Overdue actions</p>
          </div>
          <div>
            <p className={`text-2xl font-bold ${
              actionCompletionRate !== null && actionCompletionRate >= 80 ? "text-green-700" :
              actionCompletionRate !== null && actionCompletionRate >= 60 ? "text-amber-700" :
              "text-red-700"
            }`}>
              {actionCompletionRate !== null ? `${actionCompletionRate}%` : "—"}
            </p>
            <p className="text-xs text-slate-500">Actions complete</p>
          </div>
        </div>
      </div>

      {/* Participation rate */}
      {data.totalChildren > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-600">Child participation in last review</p>
          <p className={`text-lg font-bold ${
            data.childParticipationCount === data.totalChildren ? "text-green-700" :
            data.childParticipationCount >= data.totalChildren / 2 ? "text-amber-700" :
            "text-red-700"
          }`}>
            {data.childParticipationCount}/{data.totalChildren}
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

      {/* Per-child profiles */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Per-child review status</h2>
        {data.childProfiles.length === 0 ? (
          <EmptyState compact title="No children found." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.childProfiles.map((p) => (
              <ChildLACCard key={p.childId} profile={p} />
            ))}
          </div>
        )}
      </section>

      {/* Action summary */}
      {data.totalActions > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 flex items-center justify-between">
          <p className="text-sm text-slate-600">
            {data.completedActions} of {data.totalActions} review actions completed
          </p>
          <div className="w-40 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                actionCompletionRate !== null && actionCompletionRate >= 80 ? "bg-green-400" :
                actionCompletionRate !== null && actionCompletionRate >= 60 ? "bg-amber-400" :
                "bg-red-400"
              }`}
              style={{ width: `${actionCompletionRate ?? 0}%` }}
            />
          </div>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
        <p className="font-semibold mb-1">Regulatory reference</p>
        <p>{data.regulatoryNote}</p>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
        LAC review compliance is monitored by the IRO. The Registered Manager is responsible for ensuring all pre-review reports are submitted on time and that children are properly prepared and supported to participate. Ofsted inspectors will check review regularity and action follow-through.
      </div>
    </div>
  );
}

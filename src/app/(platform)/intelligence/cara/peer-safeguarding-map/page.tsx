"use client";

import { useQuery } from "@tanstack/react-query";
import type {
  PeerPairProfile,
  PairEntry,
  GroupAssessment,
  PeerSafeguardingMapResponse,
} from "@/app/api/v1/peer-safeguarding-map/route";

// ── Helpers ───────────────────────────────────────────────────────────────────

type Signal = "concern" | "attention" | "stable";
type RiskLevel = "none" | "low" | "medium" | "high";

const SIGNAL_STYLES: Record<Signal, string> = {
  concern: "bg-red-100 text-red-800 border border-red-200",
  attention: "bg-amber-100 text-amber-800 border border-amber-200",
  stable: "bg-green-100 text-green-800 border border-green-200",
};

const RISK_STYLES: Record<RiskLevel, string> = {
  none: "bg-slate-100 text-slate-600",
  low: "bg-green-100 text-green-700",
  medium: "bg-amber-100 text-amber-700",
  high: "bg-red-100 text-red-700",
};

const QUALITY_STYLES: Record<string, string> = {
  positive: "text-green-700 font-semibold",
  developing: "text-amber-700 font-semibold",
  strained: "text-orange-700 font-semibold",
  conflictual: "text-red-700 font-semibold",
  neutral: "text-slate-600 font-semibold",
};

const ENTRY_TYPE_LABELS: Record<string, string> = {
  incident: "Incident",
  observation: "Observation",
  positive_interaction: "Positive interaction",
  mediation: "Mediation",
  review: "Review",
};

const ENTRY_TYPE_STYLES: Record<string, string> = {
  incident: "bg-red-50 border-red-200 text-red-800",
  observation: "bg-slate-50 border-slate-200 text-slate-700",
  positive_interaction: "bg-green-50 border-green-200 text-green-800",
  mediation: "bg-amber-50 border-amber-200 text-amber-800",
  review: "bg-blue-50 border-blue-200 text-blue-800",
};

const ATMOSPHERE_LABELS: Record<string, string> = {
  calm: "Calm",
  positive: "Positive",
  mixed: "Mixed",
  tense: "Tense",
  volatile: "Volatile",
};

function SignalBadge({ signal }: { signal: Signal }) {
  const labels: Record<Signal, string> = {
    concern: "Concern",
    attention: "Attention",
    stable: "Stable",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${SIGNAL_STYLES[signal]}`}
    >
      {labels[signal]}
    </span>
  );
}

function RiskBadge({ risk }: { risk: RiskLevel }) {
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${RISK_STYLES[risk]}`}
    >
      Risk: {risk}
    </span>
  );
}

// ── Entry row ─────────────────────────────────────────────────────────────────

function EntryRow({ entry }: { entry: PairEntry }) {
  const style =
    ENTRY_TYPE_STYLES[entry.type] ?? "bg-slate-50 border-slate-200 text-slate-700";
  const label = ENTRY_TYPE_LABELS[entry.type] ?? entry.type;

  return (
    <div className={`rounded-lg border p-3 text-sm ${style}`}>
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="font-medium text-xs uppercase tracking-wide opacity-70">
          {label}
        </span>
        <span className="text-xs opacity-60">{entry.date}</span>
      </div>
      <p className="leading-snug">{entry.description}</p>
      {entry.interventionUsed && (
        <p className="mt-1 text-xs opacity-70">
          <span className="font-medium">Intervention: </span>
          {entry.interventionUsed}
        </p>
      )}
      {entry.outcome && (
        <p className="mt-0.5 text-xs opacity-60">{entry.outcome}</p>
      )}
      {entry.staffWitness && (
        <p className="mt-0.5 text-xs opacity-50">Witnessed by {entry.staffWitness}</p>
      )}
    </div>
  );
}

// ── Pair card ─────────────────────────────────────────────────────────────────

function PairCard({ pair }: { pair: PeerPairProfile }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-900 text-base">
            {pair.child1Name} &amp; {pair.child2Name}
          </h3>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className={QUALITY_STYLES[pair.quality] ?? "text-slate-700 font-semibold"}>
              {pair.quality.charAt(0).toUpperCase() + pair.quality.slice(1)}
            </span>
            <RiskBadge risk={pair.riskLevel as RiskLevel} />
          </div>
        </div>
        <SignalBadge signal={pair.signal as Signal} />
      </div>

      {/* Review status */}
      <div className="flex items-center gap-4 text-sm">
        {pair.reviewOverdue && (
          <span className="inline-flex items-center gap-1 text-red-700 font-medium">
            <span>&#9888;</span> Review overdue
            {pair.daysUntilNextReview !== null && (
              <span className="font-normal text-red-600">
                &nbsp;({Math.abs(pair.daysUntilNextReview)}d)
              </span>
            )}
          </span>
        )}
        {!pair.reviewOverdue && pair.nextReviewDue && (
          <span className="text-slate-500">
            Next review: {pair.nextReviewDue}
            {pair.daysUntilNextReview !== null && (
              <span> ({pair.daysUntilNextReview}d)</span>
            )}
          </span>
        )}
        {pair.incidentCount14d > 0 && (
          <span className="text-orange-700 font-medium">
            {pair.incidentCount14d} incident{pair.incidentCount14d > 1 ? "s" : ""} in last 14 days
          </span>
        )}
      </div>

      {/* Concerns */}
      {pair.concerns.length > 0 && (
        <div className="flex flex-col gap-1">
          <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
            Concerns
          </h4>
          <ul className="list-disc list-inside space-y-0.5">
            {pair.concerns.map((c, i) => (
              <li key={i} className="text-sm text-slate-700">
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Strategies */}
      {pair.strategies.length > 0 && (
        <div className="flex flex-col gap-1">
          <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
            Active strategies
          </h4>
          <ul className="list-disc list-inside space-y-0.5">
            {pair.strategies.map((s, i) => (
              <li key={i} className="text-sm text-slate-700">
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Strengths */}
      {pair.strengths.length > 0 && (
        <div className="flex flex-col gap-1">
          <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
            Strengths
          </h4>
          <ul className="list-disc list-inside space-y-0.5">
            {pair.strengths.map((s, i) => (
              <li key={i} className="text-sm text-green-800">
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recent entries */}
      {pair.recentEntries.length > 0 && (
        <div className="flex flex-col gap-2">
          <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
            Recent entries
          </h4>
          <div className="flex flex-col gap-2">
            {pair.recentEntries.slice(0, 3).map((e) => (
              <EntryRow key={e.id} entry={e} />
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {pair.notes && (
        <p className="text-xs text-slate-500 italic border-t border-slate-200 pt-3">
          {pair.notes}
        </p>
      )}
    </div>
  );
}

// ── Group assessment panel ────────────────────────────────────────────────────

function GroupAssessmentPanel({ ga }: { ga: GroupAssessment }) {
  const atmosphereLabel =
    ATMOSPHERE_LABELS[ga.overallAtmosphere] ?? ga.overallAtmosphere;
  const atmosphereStyle =
    ga.overallAtmosphere === "volatile" || ga.overallAtmosphere === "tense"
      ? "text-red-700 font-semibold"
      : ga.overallAtmosphere === "calm" || ga.overallAtmosphere === "positive"
      ? "text-green-700 font-semibold"
      : "text-amber-700 font-semibold";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-900">
          Group atmosphere — {ga.assessmentDate}
        </h3>
        <span className={atmosphereStyle}>{atmosphereLabel}</span>
      </div>
      {ga.groupStrengths.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
            Group strengths
          </p>
          <ul className="list-disc list-inside space-y-0.5">
            {ga.groupStrengths.map((s, i) => (
              <li key={i} className="text-sm text-green-800">
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}
      {ga.groupConcerns.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
            Group concerns
          </p>
          <ul className="list-disc list-inside space-y-0.5">
            {ga.groupConcerns.map((c, i) => (
              <li key={i} className="text-sm text-orange-800">
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}
      {ga.recommendations.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
            Recommendations
          </p>
          <ul className="list-disc list-inside space-y-0.5">
            {ga.recommendations.map((r, i) => (
              <li key={i} className="text-sm text-blue-800">
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="text-xs text-slate-400">Assessed by {ga.assessedBy}</p>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PeerSafeguardingMapPage() {
  const { data, isLoading, error } = useQuery<PeerSafeguardingMapResponse>({
    queryKey: ["peer-safeguarding-map"],
    queryFn: async () => {
      const res = await fetch("/api/v1/peer-safeguarding-map");
      if (!res.ok) throw new Error("Failed to fetch peer safeguarding map");
      const json = await res.json();
      return json.data as PeerSafeguardingMapResponse;
    },
    staleTime: 120_000,
  });

  if (isLoading) {
    return (
      <div className="p-8 text-slate-500 text-sm">
        Loading peer safeguarding map…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-red-600 text-sm">
        Unable to load peer safeguarding map.
      </div>
    );
  }

  const { pairs, latestGroupAssessment, summary } = data;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Peer Safeguarding Map
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Per-pair safeguarding triage: risk levels, review compliance, and
            active strategies for every pairwise relationship in the home.
          </p>
        </div>
        <SignalBadge signal={summary.overallSignal as Signal} />
      </div>

      {/* Regulatory callout */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 space-y-1">
        <p className="font-semibold">CHR 2015 Reg 19 — Behaviour management</p>
        <p>
          Reg 19 requires the home to have a clear behaviour management policy
          and to actively manage peer dynamics where risk exists. SCCIF requires
          that children feel safe with each other. This map supports managers in
          evidencing proactive peer risk management and review compliance.
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm">
          <p className="text-2xl font-bold text-slate-800">{summary.totalPairs}</p>
          <p className="text-xs text-slate-500 mt-0.5">Total pairs</p>
        </div>
        <div
          className={`rounded-xl border p-3 text-center shadow-sm ${
            summary.pairsAtConcern > 0
              ? "border-red-200 bg-red-50"
              : "border-slate-200 bg-white"
          }`}
        >
          <p
            className={`text-2xl font-bold ${
              summary.pairsAtConcern > 0 ? "text-red-700" : "text-slate-800"
            }`}
          >
            {summary.pairsAtConcern}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Concern</p>
        </div>
        <div
          className={`rounded-xl border p-3 text-center shadow-sm ${
            summary.reviewsOverdue > 0
              ? "border-orange-200 bg-orange-50"
              : "border-slate-200 bg-white"
          }`}
        >
          <p
            className={`text-2xl font-bold ${
              summary.reviewsOverdue > 0 ? "text-orange-700" : "text-slate-800"
            }`}
          >
            {summary.reviewsOverdue}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Reviews overdue</p>
        </div>
        <div
          className={`rounded-xl border p-3 text-center shadow-sm ${
            summary.incidentsLast14d > 0
              ? "border-amber-200 bg-amber-50"
              : "border-slate-200 bg-white"
          }`}
        >
          <p
            className={`text-2xl font-bold ${
              summary.incidentsLast14d > 0 ? "text-amber-700" : "text-slate-800"
            }`}
          >
            {summary.incidentsLast14d}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Incidents (14d)</p>
        </div>
      </div>

      {/* Pair cards */}
      <div className="flex flex-col gap-6">
        {pairs.map((pair) => (
          <PairCard key={pair.id} pair={pair} />
        ))}
      </div>

      {pairs.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500 text-sm">
          No peer relationship data recorded.
        </div>
      )}

      {/* Group assessment */}
      {latestGroupAssessment && (
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-slate-800">
            Latest group assessment
          </h2>
          <GroupAssessmentPanel ga={latestGroupAssessment} />
        </div>
      )}
    </div>
  );
}

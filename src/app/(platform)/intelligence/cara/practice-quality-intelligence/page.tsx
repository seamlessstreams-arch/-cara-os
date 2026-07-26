"use client";

import { useQuery } from "@tanstack/react-query";

import type {
  ChildPracticeProfile,
  DomainScore,
  PracticeAssessment,
  PracticeQualityEnvelope,
  PracticeSignal,
} from "@/app/api/v1/practice-quality-intelligence/route";

// ── Helpers ───────────────────────────────────────────────────────────────────

const SIGNAL_STYLES: Record<PracticeSignal, string> = {
  concern: "bg-red-100 text-red-800 border border-red-200",
  attention: "bg-amber-100 text-amber-800 border border-amber-200",
  good: "bg-green-100 text-green-800 border border-green-200",
};

const SIGNAL_LABELS: Record<PracticeSignal, string> = {
  concern: "Concern",
  attention: "Attention",
  good: "Good",
};

const DOMAIN_BAR_COLOURS: Record<PracticeSignal, string> = {
  concern: "bg-red-500",
  attention: "bg-amber-400",
  good: "bg-green-500",
};

function SignalBadge({ signal }: { signal: PracticeSignal }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${SIGNAL_STYLES[signal]}`}
    >
      {SIGNAL_LABELS[signal]}
    </span>
  );
}

const SOURCE_LABELS: Record<string, string> = {
  daily_record: "Daily record",
  key_work: "Key work session",
  incident: "Incident",
  care_form: "Care form",
  unknown: "Record",
};

// ── Domain score bar ──────────────────────────────────────────────────────────

function DomainScoreBar({ d }: { d: DomainScore }) {
  const barColour = DOMAIN_BAR_COLOURS[d.signal];
  return (
    <div className="flex items-center gap-3">
      <div className="w-40 text-xs text-slate-600 shrink-0 truncate">
        {d.label}
      </div>
      <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-2 rounded-full ${barColour}`}
          style={{ width: `${d.score}%` }}
        />
      </div>
      <div
        className={`w-8 text-xs font-semibold text-right shrink-0 ${
          d.signal === "concern"
            ? "text-red-700"
            : d.signal === "attention"
            ? "text-amber-700"
            : "text-green-700"
        }`}
      >
        {d.score}
      </div>
    </div>
  );
}

// ── Assessment card ───────────────────────────────────────────────────────────

function AssessmentCard({ a }: { a: PracticeAssessment }) {
  return (
    <div
      className={`rounded-xl border p-4 flex flex-col gap-3 ${
        a.status === "open" && !a.hasManagerDecision
          ? "border-amber-200 bg-amber-50"
          : "border-slate-200 bg-white"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
            {SOURCE_LABELS[a.sourceType] ?? a.sourceType}
          </span>
          <span className="text-xs text-slate-400">{a.createdAt}</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              a.status === "open"
                ? "bg-amber-100 text-amber-700"
                : "bg-green-100 text-green-700"
            }`}
          >
            {a.status === "open" ? "Open" : "Reviewed"}
          </span>
          <span className="text-xs font-bold text-slate-700">
            Overall: {a.overallScore}/100
          </span>
        </div>
      </div>

      {/* Summary */}
      {a.summary && (
        <p className="text-sm text-slate-700 italic">&ldquo;{a.summary}&rdquo;</p>
      )}

      {/* Domain scores */}
      <div className="flex flex-col gap-2">
        {a.domainScores.map((d) => (
          <DomainScoreBar key={d.domain} d={d} />
        ))}
      </div>

      {/* Manager decision */}
      {a.hasManagerDecision && a.managerDecision && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-900">
          <span className="font-semibold">Manager decision: </span>
          {a.managerDecision}
        </div>
      )}

      {!a.hasManagerDecision && a.status === "open" && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-900">
          Awaiting manager review and decision.
        </div>
      )}

      <p className="text-xs text-slate-400">Assessed by {a.createdBy}</p>
    </div>
  );
}

// ── Child card ────────────────────────────────────────────────────────────────

function ChildPracticeCard({ profile }: { profile: ChildPracticeProfile }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-900 text-base">
            {profile.childName}
          </h3>
          <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
            <span>{profile.assessmentCount} assessment{profile.assessmentCount !== 1 ? "s" : ""}</span>
            {profile.openCount > 0 && (
              <>
                <span className="text-slate-300">·</span>
                <span className="text-amber-700 font-medium">
                  {profile.openCount} open
                </span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {profile.latestOverallScore !== null && (
            <span
              className={`text-sm font-bold ${
                profile.latestOverallScore >= 65
                  ? "text-green-700"
                  : profile.latestOverallScore >= 40
                  ? "text-amber-700"
                  : "text-red-700"
              }`}
            >
              {profile.latestOverallScore}/100
            </span>
          )}
          <SignalBadge signal={profile.signal} />
        </div>
      </div>

      {/* Weakest domains */}
      {profile.weakestDomains.length > 0 && (
        <div className="flex flex-col gap-2">
          <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
            Practice areas needing attention
          </h4>
          <div className="flex flex-col gap-2">
            {profile.weakestDomains.slice(0, 3).map((d) => (
              <DomainScoreBar key={d.domain} d={d} />
            ))}
          </div>
        </div>
      )}

      {/* Assessment cards */}
      <div className="flex flex-col gap-3">
        <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
          Assessments
        </h4>
        {profile.assessments.map((a) => (
          <AssessmentCard key={a.id} a={a} />
        ))}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PracticeQualityIntelligencePage() {
  // Inlined: usePracticeQualityIntelligence
  const { data, isLoading, error } = useQuery<PracticeQualityEnvelope>({
    queryKey: ["practice-quality-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/practice-quality-intelligence");
      if (!res.ok)
        throw new Error("Failed to fetch practice quality intelligence");
      return res.json();
    },
    staleTime: 120_000,
  });

  if (isLoading) {
    return (
      <div className="p-8 text-slate-500 text-sm">
        Loading practice quality intelligence…
      </div>
    );
  }

  if (error || !data?.data) {
    return (
      <div className="p-8 text-red-600 text-sm">
        Unable to load practice quality intelligence.
      </div>
    );
  }

  const { profiles, summary } = data.data;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Practice Quality Intelligence
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Cara-generated practice quality assessments: per-child domain
            scores, weakest practice areas, and manager review status.
          </p>
        </div>
        <SignalBadge signal={summary.overallSignal} />
      </div>

      {/* Regulatory callout */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 space-y-1">
        <p className="font-semibold">Quality assurance — practice evidence</p>
        <p>
          These assessments are generated by Cara as staff record — scoring
          practice quality across seven domains. Open assessments without a
          manager decision represent a quality assurance gap: the RM should
          review and record their decision to close the loop. This evidences
          active management oversight for Reg 45 and SCCIF inspection.
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm">
          <p className="text-2xl font-bold text-slate-800">
            {summary.totalAssessments}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Total</p>
        </div>
        <div
          className={`rounded-xl border p-3 text-center shadow-sm ${
            summary.awaitingManagerReview > 0
              ? "border-amber-200 bg-amber-50"
              : "border-slate-200 bg-white"
          }`}
        >
          <p
            className={`text-2xl font-bold ${
              summary.awaitingManagerReview > 0
                ? "text-amber-700"
                : "text-slate-800"
            }`}
          >
            {summary.awaitingManagerReview}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Awaiting review</p>
        </div>
        <div
          className={`rounded-xl border p-3 text-center shadow-sm ${
            summary.childrenAtConcern > 0
              ? "border-red-200 bg-red-50"
              : "border-slate-200 bg-white"
          }`}
        >
          <p
            className={`text-2xl font-bold ${
              summary.childrenAtConcern > 0 ? "text-red-700" : "text-slate-800"
            }`}
          >
            {summary.childrenAtConcern}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Children — concern</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm">
          <p className="text-2xl font-bold text-slate-800">
            {summary.avgOverallScore !== null
              ? `${summary.avgOverallScore}`
              : "—"}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Avg score /100</p>
        </div>
      </div>

      {/* Child profiles */}
      <div className="flex flex-col gap-6">
        {profiles.map((profile) => (
          <ChildPracticeCard key={profile.childId} profile={profile} />
        ))}
      </div>

      {profiles.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500 text-sm">
          No practice quality assessments found.
        </div>
      )}
    </div>
  );
}
